'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Span } from './compile'
import { SECTION_ACCENT, textareaClass } from './ComponentSelector'

// The highlight layer sits behind a transparent textarea and has to wrap
// glyph for glyph with it, so both take their box and type from here. The
// textarea scrolls whenever its text outgrows it: always possible from xl,
// where it has a fixed height, and below that when field-sizing is missing or
// it is dragged shorter. Its scrollbar would then narrow the text, so both
// reserve that gutter.
const metrics =
  'w-full rounded-md border px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word [scrollbar-gutter:stable]'

interface Props {
  text: string
  spans: Span[]
  edited: boolean
  onChange: (value: string) => void
  onDiscardEdits: () => void
  onClear: () => void
  canClear: boolean
}

type Flash = 'copied' | 'copy-failed' | 'cleared' | null

export default function CompiledPrompt({
  text,
  spans,
  edited,
  onChange,
  onDiscardEdits,
  onClear,
  canClear,
}: Props) {
  const [flash, setFlash] = useState<Flash>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const backdrop = useRef<HTMLDivElement>(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = (next: Flash) => {
    setFlash(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlash(null), 2_000)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      show('copied')
    } catch {
      // Insecure contexts and some embedded browsers have no clipboard API.
      show('copy-failed')
    }
  }

  const chars = text.trim().length

  return (
    // From xl the prompt fills its column and scrolls inside the textarea.
    <div className="space-y-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:gap-3 xl:space-y-0">
      {/* First, not last: Tailwind 4's space-y puts margin below every child
          but the last, and this one is out of flow. */}
      <p role="status" className="sr-only">
        {flash === 'copied'
          ? 'Prompt copied to clipboard'
          : flash === 'cleared'
            ? 'Composer cleared'
            : ''}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pc-compiled-label" className="text-lg font-bold">
          Compiled prompt
        </h2>
        <div className="flex flex-wrap gap-2">
          {edited && (
            <Button variant="outline" size="sm" onClick={onDiscardEdits}>
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Discard edits
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClear()
              show('cleared')
            }}
            disabled={!canClear}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={copy} disabled={!chars}>
            {flash === 'copied' ? (
              <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {flash === 'copied' ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="relative rounded-md bg-white xl:min-h-0 xl:flex-1 dark:bg-gray-950">
        <div
          ref={backdrop}
          aria-hidden="true"
          className={`${metrics} absolute inset-0 overflow-hidden border-transparent text-transparent`}
        >
          {/* The space after the runs: a trailing newline only takes up a
              line here if something follows it, as it does in the textarea. */}
          {spans.map((span, i) =>
            span.kind && span.kind !== 'edited' ? (
              <span
                key={i}
                className="rounded-sm"
                style={{ backgroundColor: `${SECTION_ACCENT[span.kind]}40` }}
              >
                {span.text}
              </span>
            ) : (
              span.text
            )
          )}{' '}
        </div>
        <textarea
          aria-labelledby="pc-compiled-label"
          aria-describedby="pc-compiled-stats"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          // When the textarea scrolls, the highlights have to scroll with it.
          onScroll={(e) => {
            if (backdrop.current)
              backdrop.current.scrollTop = e.currentTarget.scrollTop
          }}
          placeholder="Fill in a task and your prompt assembles here, coloured by section. You can also type or paste a prompt directly."
          // Below xl it grows with its content where field-sizing is supported,
          // so the whole prompt shows without scrolling inside the box. From xl
          // it fills its column instead and scrolls.
          className={cn(
            textareaClass,
            metrics,
            'relative block min-h-[240px] bg-transparent field-sizing-content lg:min-h-[60dvh] xl:h-full xl:min-h-0 xl:resize-none xl:field-sizing-fixed dark:bg-transparent'
          )}
        />
      </div>

      {edited && (
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Edited by hand. Changes to the components will not overwrite your
          edits until you discard them.
        </p>
      )}

      {flash === 'copy-failed' && (
        <p role="alert" className="text-sm text-red-600">
          Copy failed. Select the text and copy it manually.
        </p>
      )}
    </div>
  )
}
