'use client'

/**
 * Prompt Composer v2: build a prompt from what current models need, check it
 * live for free, and ask for an AI review on demand.
 * See PROMPT-COMPOSER-README.md for the design and the evidence behind it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import AiReview from './AiReview'
import {
  EMPTY_FIELDS,
  FIELDS,
  OPTIONS_BY_ID,
  setGroup,
  toggleOption,
  type ComposerState,
  type FieldId,
} from './catalog'
import CompiledPrompt from './CompiledPrompt'
import { compilePrompt } from './compile'
import ComponentSelector from './ComponentSelector'
import LiveCheck from './LiveCheck'
import { lintPrompt, type Fix } from './lint'
import ResearchNotes from './ResearchNotes'
import { useCritique } from './useCritique'

export interface PromptComposerProps {
  className?: string
}

// Versioned, so a later change to the saved shape starts clean instead of
// crashing on an old one.
export const STORAGE_KEY = 'prompt-composer:v2'

interface Saved {
  fields: Record<FieldId, string>
  selected: string[]
  override: string | null
}

// Storage can be absent, full, or disabled (private mode, embedded views),
// and the saved value is whatever an earlier version wrote. Everything here
// degrades to a blank composer rather than throwing.
function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Saved>
    const fields = { ...EMPTY_FIELDS }
    for (const { id } of FIELDS) {
      const value = parsed.fields?.[id]
      if (typeof value === 'string') fields[id] = value
    }
    return {
      fields,
      selected: Array.isArray(parsed.selected)
        ? parsed.selected.filter((id) => OPTIONS_BY_ID.has(id))
        : [],
      override: typeof parsed.override === 'string' ? parsed.override : null,
    }
  } catch {
    return null
  }
}

function save(value: Saved | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Not persisting is acceptable. Losing the page is not.
  }
}

const PromptComposer: React.FC<PromptComposerProps> = ({ className }) => {
  // Lazy initialisers read storage during the first render. This component
  // is loaded with ssr: false, so there is no server render to mismatch.
  const [initial] = useState(load)
  const [fields, setFields] = useState(initial?.fields ?? EMPTY_FIELDS)
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(initial?.selected ?? [])
  )
  // Hand edits to the compiled prompt. While set, it is what the textarea
  // shows, and changes to the components recompile underneath without touching it.
  // v1 overwrote hand edits on every toggle.
  const [override, setOverride] = useState<string | null>(
    initial?.override ?? null
  )
  const [open, setOpen] = useState<string[]>(['task'])
  const fieldRefs = useRef<Partial<Record<FieldId, HTMLTextAreaElement>>>({})
  const critique = useCritique()

  const state: ComposerState = useMemo(
    () => ({ fields, selected }),
    [fields, selected]
  )
  const compiled = useMemo(() => compilePrompt(state), [state])
  const text = override ?? compiled
  const lint = useMemo(() => lintPrompt(state, text), [state, text])

  const pristine =
    override === null &&
    selected.size === 0 &&
    FIELDS.every(({ id }) => !fields[id])

  useEffect(() => {
    save(pristine ? null : { fields, selected: [...selected], override })
  }, [fields, selected, override, pristine])

  const setField = useCallback((id: FieldId, value: string) => {
    setFields((f) => ({ ...f, [id]: value }))
  }, [])

  const addOption = useCallback((id: string) => {
    const group = OPTIONS_BY_ID.get(id)?.group
    setSelected((s) =>
      s.has(id) ? s : group ? setGroup(s, group, id) : toggleOption(s, id)
    )
  }, [])

  const clearAll = () => {
    setFields(EMPTY_FIELDS)
    setSelected(new Set())
    setOverride(null)
    critique.reset()
  }

  const applyFix = (fix: Fix) => {
    if (fix.kind === 'option') {
      addOption(fix.id)
      return
    }
    const section = FIELDS.find((f) => f.id === fix.field)!.section
    setOpen((o) => (o.includes(section) ? o : [...o, section]))
    // The field mounts when its section opens, so focus after that paint.
    requestAnimationFrame(() => fieldRefs.current[fix.field]?.focus())
  }

  return (
    <div className={`container mx-auto p-1 ${className ?? ''}`}>
      <header className="mb-4 text-center md:mb-6">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">
          🧩 Prompt Composer
        </h1>
        <p className="text-sm text-gray-600 md:text-base dark:text-gray-400">
          Build prompts from what current models actually need, check them as
          you type, and get an AI review when you want one.
        </p>
      </header>

      {/* One column: the site's content well is about 600px wide at every
          breakpoint, and two columns there left each panel too narrow to use. */}
      <div className="flex flex-col gap-3">
        <Card className="w-full gap-3 py-4">
          <CardContent className="px-4">
            <h2 className="mb-3 text-lg font-bold">Components</h2>
            <ComponentSelector
              state={state}
              open={open}
              onOpenChange={setOpen}
              onField={setField}
              onToggle={(id) => setSelected((s) => toggleOption(s, id))}
              onGroup={(group, id) =>
                setSelected((s) => setGroup(s, group, id))
              }
              fieldRefs={fieldRefs}
            />
          </CardContent>
        </Card>

        <div className="flex w-full flex-col gap-3">
          <Card className="py-4">
            <CardContent className="px-4">
              <CompiledPrompt
                text={text}
                edited={override !== null && override !== compiled}
                onChange={setOverride}
                onDiscardEdits={() => setOverride(null)}
                onClear={clearAll}
                canClear={!pristine}
              />
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="px-4">
              <LiveCheck result={lint} onFix={applyFix} />
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="px-4">
              <AiReview
                text={text}
                availability={critique.availability}
                state={critique.state}
                selected={selected}
                onRun={() => critique.run(text)}
                onCancel={critique.cancel}
                onUseRewrite={setOverride}
                onAddOption={addOption}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <ResearchNotes />
      </div>
    </div>
  )
}

export default PromptComposer
