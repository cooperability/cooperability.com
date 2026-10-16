'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileDown, ImageDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { drawCard, type Card } from './draw'
import {
  AESTHETICS,
  EYES,
  HAIR,
  SEASONS,
  SKIN,
  analyze,
  applyAesthetic,
  classify,
  describeAxes,
  harmonies,
  type Feature,
} from './palette'
import { jpegToPdf } from './pdf'

const FEATURES = [
  { key: 'eyes', label: 'Eyes', options: EYES, initial: 'Hazel' },
  { key: 'skin', label: 'Skin', options: SKIN, initial: 'Light olive' },
  { key: 'hair', label: 'Hair', options: HAIR, initial: 'Medium brown' },
] as const

const TOGGLES = [
  { key: 'aesthetic', label: 'Aesthetic' },
  { key: 'neutrals', label: 'Neutrals and metals' },
  { key: 'avoid', label: 'Colors to avoid' },
  { key: 'harmonies', label: 'Colors from your features' },
] as const

type FeatureKey = (typeof FEATURES)[number]['key']
type ToggleKey = (typeof TOGGLES)[number]['key']

const selectClass =
  'w-full rounded-md border border-foreground/50 bg-background px-3 py-2'

export default function SwatchGenerator() {
  const [picked, setPicked] = useState<Record<FeatureKey, string>>(
    () =>
      Object.fromEntries(FEATURES.map((f) => [f.key, f.initial])) as Record<
        FeatureKey,
        string
      >
  )
  const [on, setOn] = useState<Record<ToggleKey, boolean>>({
    aesthetic: true,
    neutrals: true,
    avoid: true,
    harmonies: true,
  })
  const [aestheticName, setAestheticName] = useState(AESTHETICS[0].name)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const find = (list: readonly Feature[], name: string) =>
    list.find((f) => f.name === name)!
  const eyes = find(EYES, picked.eyes) as (typeof EYES)[number]
  const skin = find(SKIN, picked.skin)
  const hair = find(HAIR, picked.hair) as (typeof HAIR)[number]

  const card = useMemo<Card>(() => {
    const axes = analyze(eyes, skin, hair)
    const season = SEASONS[classify(axes)]
    const aesthetic = AESTHETICS.find((a) => a.name === aestheticName)!
    return {
      season: season.name,
      summary: season.summary,
      traits: describeAxes(axes),
      features: [
        { label: 'Eyes', ...eyes },
        { label: 'Skin', ...skin },
        { label: 'Hair', ...hair },
      ],
      best: season.best,
      aesthetic: on.aesthetic
        ? { ...aesthetic, ...applyAesthetic(season, aesthetic) }
        : undefined,
      neutrals: on.neutrals
        ? { swatches: season.neutrals, metals: season.metals }
        : undefined,
      avoid: on.avoid ? season.avoid : undefined,
      harmonies: on.harmonies ? harmonies(eyes, skin, hair) : undefined,
    }
  }, [eyes, skin, hair, on, aestheticName])

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, card)
  }, [card])

  async function save(kind: 'jpg' | 'pdf') {
    const canvas = canvasRef.current
    if (!canvas) return
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    )
    if (!jpeg) return
    const file =
      kind === 'jpg'
        ? jpeg
        : new Blob(
            [
              jpegToPdf(
                new Uint8Array(await jpeg.arrayBuffer()),
                canvas.width,
                canvas.height
              ),
            ],
            { type: 'application/pdf' }
          )
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-swatch-${card.season.toLowerCase().replace(' ', '-')}.${kind}`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const sections = [
    { title: 'Best colors', swatches: card.best },
    card.aesthetic && {
      title: `Aesthetic: ${card.aesthetic.name}`,
      swatches: card.aesthetic.featured,
    },
    card.neutrals && {
      title: `Neutrals (metals: ${card.neutrals.metals.join(', ')})`,
      swatches: card.neutrals.swatches,
    },
    card.avoid && { title: 'Colors to avoid', swatches: card.avoid },
    card.harmonies && {
      title: 'From your features',
      swatches: card.harmonies,
    },
  ].filter(Boolean) as { title: string; swatches: Card['best'] }[]

  return (
    <div className="lg:mx-[calc(50%_-_min(50vw_-_1rem,32rem))]">
      <h1 className="mb-2 text-center text-2xl font-bold">
        Personal Swatch Generator
      </h1>
      <p className="mb-6 text-center">
        Pick your eye, skin and hair colors to get your seasonal palette, then
        save it as a JPG or PDF.
      </p>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 font-semibold">Your features</legend>
            {FEATURES.map((f) => {
              const hex = f.options.find((o) => o.name === picked[f.key])!.hex
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`swatch-${f.key}`}>{f.label}</Label>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-9 shrink-0 rounded-full border border-foreground/50"
                      style={{ background: hex }}
                    />
                    <select
                      id={`swatch-${f.key}`}
                      className={selectClass}
                      value={picked[f.key]}
                      onChange={(e) =>
                        setPicked((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    >
                      {f.options.map((o) => (
                        <option key={o.name}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </fieldset>

          <div aria-live="polite" className="rounded-lg border p-4">
            <p className="text-sm">Your season</p>
            <p className="text-xl font-bold">{card.season}</p>
            <p className="text-sm">{card.summary}</p>
            <p className="mt-2 text-sm">
              {card.traits.map((t) => `${t.label}: ${t.value}`).join(', ')}
            </p>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-semibold">On the swatch</legend>
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`swatch-toggle-${t.key}`}>{t.label}</Label>
                  <Switch
                    id={`swatch-toggle-${t.key}`}
                    checked={on[t.key]}
                    onCheckedChange={(checked) =>
                      setOn((o) => ({ ...o, [t.key]: checked }))
                    }
                  />
                </div>
                {t.key === 'aesthetic' && on.aesthetic && (
                  <select
                    aria-label="Aesthetic style"
                    className={selectClass}
                    value={aestheticName}
                    onChange={(e) => setAestheticName(e.target.value)}
                  >
                    {AESTHETICS.map((a) => (
                      <option key={a.name}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </fieldset>
        </div>

        <div className="flex flex-col gap-4">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Personal color swatch: ${card.season}`}
            className="mx-auto h-auto w-full max-w-[34rem] rounded-lg border shadow"
          />
          <div className="mx-auto flex w-full max-w-[34rem] gap-3">
            <Button size="lg" className="flex-1" onClick={() => save('jpg')}>
              <ImageDown aria-hidden="true" /> Save JPG
            </Button>
            <Button size="lg" className="flex-1" onClick={() => save('pdf')}>
              <FileDown aria-hidden="true" /> Save PDF
            </Button>
          </div>
          <details className="mx-auto w-full max-w-[34rem]">
            <summary className="cursor-pointer">Palette as text</summary>
            {sections.map((sec) => (
              <section key={sec.title} className="mt-3">
                <h2 className="text-base font-semibold">{sec.title}</h2>
                <ul className="text-sm">
                  {sec.swatches.map((sw) => (
                    <li key={sw.name}>
                      {sw.name} {sw.hex}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </details>
        </div>
      </div>
    </div>
  )
}
