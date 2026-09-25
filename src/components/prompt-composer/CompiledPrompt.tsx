'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_PROMPT_CHARS } from '@/src/lib/ai/review-schema'
import { countWords, estimateTokens } from './compile'
import { textareaClass } from './ComponentSelector'

interface Props {
  text: string
  edited: boolean
  onChange: (value: string) => void
  onDiscardEdits: () => void
  onClear: () => void
  canClear: boolean
}

type Flash = 'copied' | 'copy-failed' | 'cleared' | null

export default function CompiledPrompt({
  text,
  edited,
  onChange,
  onDiscardEdits,
  onClear,
  canClear,
}: Props) {
  const [flash, setFlash] = useState<Flash>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

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
  const overLimit = chars > MAX_PROMPT_CHARS

  return (
    <div className="space-y-3">
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

      <textarea
        aria-labelledby="pc-compiled-label"
        aria-describedby="pc-compiled-stats"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Fill in a task above and your prompt assembles here. You can also type or paste a prompt directly."
        // Grows with its content where field-sizing is supported, so the whole
        // prompt is visible without scrolling inside the box.
        className={`${textareaClass} min-h-[240px] font-mono [field-sizing:content]`}
      />

      {edited && (
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Edited by hand. Changes to the components will not overwrite your
          edits until you discard them.
        </p>
      )}

      <p
        id="pc-compiled-stats"
        className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 text-xs tabular-nums"
      >
        <span>{countWords(text)} words</span>
        <span>~{estimateTokens(text)} tokens</span>
        <span className={overLimit ? 'font-semibold text-red-600' : undefined}>
          {chars.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} chars
          for AI review
        </span>
      </p>

      <p role="status" className="sr-only">
        {flash === 'copied'
          ? 'Prompt copied to clipboard'
          : flash === 'cleared'
            ? 'Composer cleared'
            : ''}
      </p>
      {flash === 'copy-failed' && (
        <p role="alert" className="text-sm text-red-600">
          Copy failed. Select the text and copy it manually.
        </p>
      )}
    </div>
  )
}
