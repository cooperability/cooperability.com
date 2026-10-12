'use client'

import React from 'react'
import { MAX_PROMPT_CHARS } from '@/src/lib/ai/review-schema'
import { SECTIONS } from './catalog'
import {
  composition,
  countWords,
  estimateTokens,
  type Span,
  type SpanKind,
} from './compile'
import { SECTION_ACCENT } from './ComponentSelector'

const LABELS = new Map<SpanKind, string>([
  ...SECTIONS.map(({ id, label }) => [id, label] as const),
  ['edited', 'Hand edits'],
])

// Hand edits carry no section colour in the prompt, so their swatch is an
// outline rather than a fill.
function Swatch({ kind }: { kind: SpanKind }) {
  return kind === 'edited' ? (
    <span className="inline-block h-3 w-3 shrink-0 rounded-sm border border-gray-500" />
  ) : (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-sm"
      style={{ backgroundColor: SECTION_ACCENT[kind] }}
    />
  )
}

export default function Composition({
  text,
  spans,
}: {
  text: string
  spans: Span[]
}) {
  const shares = composition(spans)
  const total = shares.reduce((n, s) => n + s.chars, 0)
  const chars = text.trim().length
  const overLimit = chars > MAX_PROMPT_CHARS

  return (
    <section aria-labelledby="pc-composition" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="pc-composition" className="text-lg font-bold">
          Composition
        </h2>
        <span className="text-sm font-bold tabular-nums">
          ~{estimateTokens(text).toLocaleString()} tokens
        </span>
      </div>

      {total === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Each section’s share of the prompt appears here as you write.
        </p>
      ) : (
        <>
          {/* The prompt read top to bottom, left to right. The table below
              carries the same numbers for screen readers. */}
          <div
            className="flex h-3 w-full gap-px overflow-hidden rounded-full"
            aria-hidden="true"
          >
            {spans.map(
              (span, i) =>
                span.kind && (
                  <div
                    key={i}
                    className={
                      span.kind === 'edited'
                        ? 'bg-gray-300 dark:bg-gray-600'
                        : undefined
                    }
                    style={{
                      flexGrow: span.text.trim().length,
                      backgroundColor:
                        span.kind === 'edited'
                          ? undefined
                          : SECTION_ACCENT[span.kind],
                    }}
                  />
                )
            )}
          </div>

          <table className="w-full text-sm tabular-nums">
            <caption className="sr-only">
              Share of the prompt by section
            </caption>
            {/* sr-only on the cells, not the thead: taking the header
                group out of table layout can drop the table's semantics. */}
            <thead>
              <tr>
                <th scope="col" className="p-0">
                  <span className="sr-only">Section</span>
                </th>
                <th scope="col" className="p-0">
                  <span className="sr-only">Tokens</span>
                </th>
                <th scope="col" className="p-0">
                  <span className="sr-only">Share</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shares.map(({ kind, chars: n, tokens }) => (
                <tr key={kind}>
                  <th scope="row" className="py-0.5 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <Swatch kind={kind} />
                      {LABELS.get(kind)}
                    </span>
                  </th>
                  <td className="text-gray-600 dark:text-gray-400 py-0.5 text-right">
                    ~{tokens.toLocaleString()}
                  </td>
                  <td className="w-12 py-0.5 text-right font-semibold">
                    {Math.round((n / total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p
        id="pc-compiled-stats"
        className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 border-t pt-3 text-xs tabular-nums"
      >
        <span>{countWords(text)} words</span>
        <span className={overLimit ? 'font-semibold text-red-600' : undefined}>
          {chars.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} chars
          for AI review
        </span>
      </p>
    </section>
  )
}
