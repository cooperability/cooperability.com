'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { FileDown, ImageDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card as Panel } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup } from '@/components/ui/radio-group'
import {
  ToggleGroup,
  ToggleGroupItem,
  toggleItemClass,
} from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import ColorSelect from './ColorSelect'
import { drawCard, type Card } from './draw'
import {
  AESTHETICS,
  EYES,
  HAIR,
  METALS,
  SEASONS,
  SKIN,
  UNDERTONES,
  analyze,
  applyAesthetic,
  classify,
  describeAxes,
  harmonies,
  type Season,
  type Swatch,
} from './palette'
import { jpegToPdf } from './pdf'

const FEATURES = [
  { key: 'eyes', label: 'Eyes', options: EYES, initial: 'Hazel' },
  { key: 'hair', label: 'Hair', options: HAIR, initial: 'Medium brown' },
  { key: 'skin', label: 'Skin depth', options: SKIN, initial: SKIN[4].name },
] as const

const SECTIONS = [
  { key: 'neutrals', label: 'Neutrals' },
  { key: 'avoid', label: 'Avoid' },
  { key: 'harmonies', label: 'Harmonies' },
] as const

const NO_AESTHETIC = 'None'

type FeatureKey = (typeof FEATURES)[number]['key']
type SectionKey = (typeof SECTIONS)[number]['key']

export default function SwatchGenerator() {
  const [picked, setPicked] = useState<Record<FeatureKey, string>>(
    () =>
      Object.fromEntries(FEATURES.map((f) => [f.key, f.initial])) as Record<
        FeatureKey,
        string
      >
  )
  const [undertoneName, setUndertoneName] = useState('Neutral')
  const [seasonal, setSeasonal] = useState(true)
  const [shown, setShown] = useState<SectionKey[]>(
    SECTIONS.map((sec) => sec.key)
  )
  const [aestheticName, setAestheticName] = useState(AESTHETICS[0].name)

  const eyes = EYES.find((f) => f.name === picked.eyes)!
  const hair = HAIR.find((f) => f.name === picked.hair)!
  const skin = SKIN.find((f) => f.name === picked.skin)!
  const undertone = UNDERTONES.find((u) => u.name === undertoneName)!

  const card = useMemo<Card>(() => {
    const axes = analyze(eyes, skin, undertone, hair)
    const season: Season | undefined = seasonal
      ? SEASONS[classify(axes)]
      : undefined
    const aesthetic = season && AESTHETICS.find((a) => a.name === aestheticName)
    const on = (key: SectionKey) => shown.includes(key)
    return {
      season: season?.name,
      title: season?.name ?? 'Your colors',
      aka: season?.aka,
      summary:
        season?.summary ?? 'Built from your eye, skin and hair colors alone.',
      traits: describeAxes(axes),
      features: [
        { label: 'Eyes', ...eyes },
        {
          label: 'Skin',
          name: `${skin.name}, ${undertone.name.toLowerCase()}`,
          hex: skin.hex,
        },
        { label: 'Hair', ...hair },
      ],
      best: season?.best,
      aesthetic: aesthetic && {
        ...aesthetic,
        ...applyAesthetic(season, aesthetic),
      },
      neutrals: on('neutrals')
        ? season
          ? { swatches: season.neutrals, metals: season.metals }
          : { swatches: [], metals: undertone.metals }
        : undefined,
      avoid: season && on('avoid') ? season.avoid : undefined,
      harmonies: on('harmonies')
        ? harmonies(eyes, skin, undertone, hair)
        : undefined,
    }
  }, [eyes, skin, undertone, hair, seasonal, shown, aestheticName])

  const empty = !card.best && !card.neutrals && !card.harmonies

  // Both files are encoded ahead of the tap. Safari only honors a download
  // click made synchronously inside the user's gesture, not after an await.
  const [files, setFiles] = useState<{ card: Card; jpg: Blob; pdf: Blob }>()
  const ready = files?.card === card ? files : undefined

  useEffect(() => {
    let stale = false
    // Waits out bursts of changes, such as type-ahead in a closed select, so
    // full-size canvases do not pile up against iOS Safari's memory cap.
    const timer = setTimeout(() => {
      const canvas = document.createElement('canvas')
      drawCard(canvas, card)
      const { width, height } = canvas
      canvas.toBlob(
        async (jpg) => {
          canvas.width = canvas.height = 0
          if (!jpg || stale) return
          const bytes = new Uint8Array(await jpg.arrayBuffer())
          const pdf = new Blob([jpegToPdf(bytes, width, height)], {
            type: 'application/pdf',
          })
          if (!stale) setFiles({ card, jpg, pdf })
        },
        'image/jpeg',
        0.92
      )
    }, 150)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [card])

  function save(kind: 'jpg' | 'pdf') {
    if (!ready) return
    const url = URL.createObjectURL(ready[kind])
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-swatch-${card.title.toLowerCase().replace(' ', '-')}.${kind}`
    document.body.append(a)
    a.click()
    a.remove()
    // iOS reads the URL only after the user confirms its download sheet.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="lg:mx-[calc(50%_-_min(50vw_-_1rem,40rem))]">
      <div className="mb-3 flex flex-col items-center lg:flex-row lg:items-baseline lg:gap-3">
        <h1 className="text-center text-xl font-bold sm:text-2xl">
          Personal Swatch Generator
        </h1>
        <p className="hidden text-center text-sm sm:block">
          Pick your eye, hair and skin colors to get a palette, then save it as
          a JPG or PDF.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
        <fieldset className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1 lg:gap-2.5">
          <legend className="sr-only">Your features and options</legend>
          {FEATURES.map((f) => (
            <ColorSelect
              key={f.key}
              className="col-span-2 sm:col-span-1"
              label={f.label}
              options={f.options}
              value={picked[f.key]}
              onChange={(name) => setPicked((p) => ({ ...p, [f.key]: name }))}
            />
          ))}

          <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
            <div className="flex items-baseline justify-between gap-2">
              <Label id="swatch-undertone">Undertone</Label>
              <p
                id="swatch-undertone-hint"
                className="truncate text-xs text-muted-foreground"
              >
                {undertone.hint}
              </p>
            </div>
            {/* A radio group, not a single toggle group, so arrow keys select. */}
            <RadioGroup
              aria-labelledby="swatch-undertone"
              aria-describedby="swatch-undertone-hint"
              className="grid grid-cols-4 gap-1.5"
              value={undertoneName}
              onValueChange={setUndertoneName}
            >
              {UNDERTONES.map((u) => (
                <RadioGroupPrimitive.Item
                  key={u.name}
                  value={u.name}
                  className={cn(toggleItemClass, 'px-1')}
                >
                  {u.name}
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between gap-3 self-end rounded-md border border-foreground/50 px-3 py-2 lg:self-auto">
            <Label htmlFor="swatch-seasonal">Seasonal analysis</Label>
            {/* The default off track measures 1.23:1 on white. */}
            <Switch
              id="swatch-seasonal"
              className="data-[state=unchecked]:bg-foreground/50"
              checked={seasonal}
              onCheckedChange={setSeasonal}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="swatch-aesthetic">Aesthetic</Label>
            <Select
              value={seasonal ? aestheticName : NO_AESTHETIC}
              onValueChange={setAestheticName}
              disabled={!seasonal}
            >
              <SelectTrigger
                id="swatch-aesthetic"
                aria-describedby={seasonal ? undefined : 'swatch-needs-season'}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[NO_AESTHETIC, ...AESTHETICS.map((a) => a.name)].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!seasonal && (
              <p
                id="swatch-needs-season"
                className="text-xs text-muted-foreground"
              >
                Aesthetic and Avoid use a season&apos;s colors, so they need
                seasonal analysis.
              </p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
            <Label id="swatch-sections">On the swatch</Label>
            <ToggleGroup
              type="multiple"
              aria-labelledby="swatch-sections"
              // Avoid shows as off while seasons are off, and keeps its own
              // setting for when they come back.
              value={seasonal ? shown : shown.filter((k) => k !== 'avoid')}
              onValueChange={(v) =>
                setShown(
                  seasonal || !shown.includes('avoid')
                    ? (v as SectionKey[])
                    : [...(v as SectionKey[]), 'avoid']
                )
              }
            >
              {SECTIONS.map((sec) => (
                <ToggleGroupItem
                  key={sec.key}
                  value={sec.key}
                  disabled={sec.key === 'avoid' && !seasonal}
                  aria-describedby={
                    sec.key === 'avoid' && !seasonal
                      ? 'swatch-needs-season'
                      : undefined
                  }
                >
                  {sec.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </fieldset>

        <Panel className="gap-3 p-4">
          <p aria-live="polite" className="sr-only">
            {`${card.title}. ${card.traits.map((t) => `${t.label}: ${t.value}`).join(', ')}`}
          </p>
          <div className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto]">
            <h2 className="text-2xl leading-tight font-bold">
              {card.title}
              {card.aka && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  also called {card.aka}
                </span>
              )}
            </h2>
            <p className="text-sm sm:col-span-2 sm:row-start-2">
              {card.summary}{' '}
              <span className="block font-medium lg:ml-1 lg:inline">
                {card.traits.map((t) => `${t.label}: ${t.value}`).join(', ')}
              </span>
            </p>
            <div className="mt-1 flex gap-2 sm:col-start-2 sm:row-start-1 sm:mt-0">
              <Button
                className="flex-1"
                disabled={!ready || empty}
                onClick={() => save('jpg')}
              >
                <ImageDown aria-hidden="true" /> Save JPG
              </Button>
              <Button
                className="flex-1"
                disabled={!ready || empty}
                onClick={() => save('pdf')}
              >
                <FileDown aria-hidden="true" /> Save PDF
              </Button>
            </div>
          </div>

          {empty && (
            <p className="text-sm">
              Switch on a section under &ldquo;On the swatch&rdquo; to add
              colors.
            </p>
          )}
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {card.best && (
              <Section title="Best colors" className="md:col-span-2">
                <Chips
                  swatches={card.best}
                  className="grid-cols-5 xl:grid-cols-10"
                />
              </Section>
            )}
            {card.aesthetic && (
              <Section
                title={`Aesthetic: ${card.aesthetic.name}`}
                note={card.aesthetic.blurb}
              >
                <Chips
                  swatches={card.aesthetic.featured}
                  className="grid-cols-4"
                />
                <Ratio swatches={card.aesthetic.ratio} />
              </Section>
            )}
            {card.harmonies && (
              <Section title="Harmonies from your features">
                <Chips swatches={card.harmonies} className="grid-cols-5" />
              </Section>
            )}
            {card.neutrals && (
              <Section
                title={
                  card.neutrals.swatches.length
                    ? 'Neutrals and metals'
                    : 'Metals'
                }
              >
                <Chips
                  swatches={card.neutrals.swatches}
                  className="grid-cols-5"
                />
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {card.neutrals.metals.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden="true"
                        className="size-6 rounded-full border border-foreground/50"
                        style={{
                          background: `linear-gradient(135deg, ${METALS[m][1]}, ${METALS[m][0]} 50%, ${METALS[m][1]})`,
                        }}
                      />
                      {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {card.avoid && (
              <Section title="Colors to avoid">
                <Chips
                  swatches={card.avoid}
                  struck
                  hex={false}
                  className="grid-cols-4"
                />
              </Section>
            )}
          </div>
        </Panel>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Skin tones come from the{' '}
        <a className="underline" href="https://skintone.google/">
          Monk Skin Tone Scale
        </a>{' '}
        (Ellis Monk and Google,{' '}
        <a
          className="underline"
          href="https://creativecommons.org/licenses/by/4.0/"
        >
          CC BY 4.0
        </a>
        ). Seasonal color analysis is a styling convention with little published
        testing.
      </p>
    </div>
  )
}

function Section({
  title,
  note,
  className,
  children,
}: {
  title: string
  note?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('min-w-0', className)}>
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-xs font-bold tracking-wider uppercase">{title}</h3>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

// A light halo under a dark line reads on both black and white chips.
const STRIKE =
  'linear-gradient(to top right, transparent 48.5%, #6B635C 48.5% 51.5%, transparent 51.5%), linear-gradient(to top right, transparent 46%, #FBF8F4 46% 54%, transparent 54%)'

function Chips({
  swatches,
  struck = false,
  hex = true,
  className,
}: {
  swatches: readonly Swatch[]
  struck?: boolean
  hex?: boolean
  className?: string
}) {
  if (!swatches.length) return null
  return (
    <ul className={cn('grid gap-2', className)}>
      {swatches.map((sw) => (
        <li key={sw.name} className="min-w-0">
          <div
            aria-hidden="true"
            data-testid="swatch-chip"
            className="h-8 rounded-md border border-foreground/50"
            style={{
              backgroundColor: sw.hex,
              backgroundImage: struck ? STRIKE : undefined,
            }}
          />
          <p className="mt-1 text-xs leading-tight font-medium">{sw.name}</p>
          {hex && (
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              {sw.hex}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

const SHARES = [60, 30, 10]

function Ratio({ swatches }: { swatches: readonly Swatch[] }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="mt-2 flex h-5 overflow-hidden rounded-md border border-foreground/50"
      >
        {swatches.map((sw, i) => (
          <span
            key={sw.name}
            style={{ width: `${SHARES[i]}%`, background: sw.hex }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs">
        {swatches.map((sw, i) => `${SHARES[i]}% ${sw.name}`).join(', ')}
      </p>
    </>
  )
}
