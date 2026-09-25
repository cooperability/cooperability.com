'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Check, Copy, Sparkles, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_PROMPT_CHARS, REVIEW_DIMENSIONS } from '@/src/lib/ai/review-schema'
import { OPTIONS_BY_ID } from './catalog'
import { DIMENSION_LABELS } from './labels'
import { overallScore } from './review'
import type { Availability, CritiqueState } from './useCritique'

// Explicit colours: the theme's --primary is an oklch() value that
// tailwind.config.js wraps in hsl(), so the default Button variant renders
// with no fill. Tracked in docs/Roadmap.md rather than fixed here.
const PRIMARY =
  'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'

const UNAVAILABLE: Record<Exclude<Availability, 'enabled'>, string> = {
  checking: 'Checking whether AI review is available…',
  disabled: 'AI review is switched off for now. The live check still works.',
  budget:
    'AI review has used its budget for this period. The live check still works.',
  unconfigured: 'AI review is not configured on this deployment.',
  unavailable: 'AI review is unavailable right now. Try again later.',
}

function statusLine(state: CritiqueState, score: number | null): string {
  if (state.phase === 'streaming') return 'Reviewing your prompt…'
  if (state.phase === 'error') return state.error ?? 'The review failed.'
  if (state.phase === 'done' && score !== null) {
    return `Review complete: ${score} out of 100.`
  }
  return ''
}

interface Props {
  text: string
  availability: Availability
  state: CritiqueState
  selected: ReadonlySet<string>
  onRun: () => void
  onCancel: () => void
  onUseRewrite: (rewrite: string) => void
  onAddOption: (id: string) => void
}

export default function AiReview({
  text,
  availability,
  state,
  selected,
  onRun,
  onCancel,
  onUseRewrite,
  onAddOption,
}: Props) {
  const [copied, setCopied] = useState(false)
  const { view, phase } = state
  const score = overallScore(view)
  const streaming = phase === 'streaming'
  const trimmed = text.trim()
  const tooLong = trimmed.length > MAX_PROMPT_CHARS
  const stale =
    state.reviewedText !== null && state.reviewedText !== trimmed && !streaming
  const hasResult = view.summary !== undefined || score !== null
  const delta =
    phase === 'done' && score !== null && state.previousScore !== null
      ? score - state.previousScore
      : null

  const copyRewrite = async () => {
    if (!view.rewrite) return
    try {
      await navigator.clipboard.writeText(view.rewrite)
      setCopied(true)
      setTimeout(() => setCopied(false), 2_000)
    } catch {
      // The rewrite stays selectable on the page.
    }
  }

  return (
    <section aria-labelledby="pc-ai-review" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="pc-ai-review"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          AI review
        </h2>
        {streaming ? (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onRun}
            className={PRIMARY}
            disabled={availability !== 'enabled' || !trimmed || tooLong}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {hasResult ? 'Review again' : 'Review with AI'}
          </Button>
        )}
      </div>

      {availability !== 'enabled' ? (
        <p className="text-muted-foreground text-sm">
          {UNAVAILABLE[availability]}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Scores the prompt on the same six dimensions as the live check,
          suggests fixes, and drafts a rewrite. Sends the prompt text to
          Anthropic’s API; this site does not store it.{' '}
          <Link href="/resources/PrivacyStatement" className="underline">
            Privacy
          </Link>
        </p>
      )}

      {/* The finished score is already on screen as a headline, so only
          progress and errors show visually. Screen readers hear all three. */}
      <p
        role="status"
        aria-live="polite"
        className={state.phase === 'done' ? 'sr-only' : 'text-sm'}
      >
        {statusLine(state, score)}
      </p>

      {stale && hasResult && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          The prompt has changed since this review.
        </p>
      )}
      {state.fromCache && (
        <p className="text-muted-foreground text-xs">
          Same prompt as an earlier review, so that result is shown again at no
          cost.
        </p>
      )}
      {state.truncated && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          The review hit its length limit, so the rewrite may be cut short.
        </p>
      )}

      {hasResult && (
        <div className="space-y-4 rounded-md border p-4" aria-busy={streaming}>
          {score !== null && (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">{score}</span>
              <span className="text-muted-foreground">/100</span>
              {delta !== null && delta !== 0 && (
                <span
                  className={`flex items-center text-sm font-semibold ${
                    delta > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {delta > 0 ? (
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {Math.abs(delta)} since last review
                </span>
              )}
            </div>
          )}

          {view.summary && <p className="text-sm">{view.summary}</p>}

          <dl className="space-y-2">
            {REVIEW_DIMENSIONS.map((dim) => {
              const entry = view.scores[dim]
              if (!entry) return null
              return (
                <div key={dim} className="text-sm">
                  <dt className="flex items-center justify-between gap-2 font-semibold">
                    <span>{DIMENSION_LABELS[dim]}</span>
                    {entry.score !== undefined && (
                      <span className="tabular-nums">{entry.score}/5</span>
                    )}
                  </dt>
                  {entry.score !== undefined && (
                    <div
                      className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                        style={{ width: `${(entry.score / 5) * 100}%` }}
                      />
                    </div>
                  )}
                  {entry.note && (
                    <dd className="text-muted-foreground mt-1">{entry.note}</dd>
                  )}
                </div>
              )
            })}
          </dl>

          {view.topFix && (
            <div className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-3 text-sm dark:border-blue-400 dark:bg-blue-950">
              <span className="font-semibold">Top fix: </span>
              {view.topFix}
            </div>
          )}

          {view.suggested.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Suggested components</h3>
              <div className="flex flex-wrap gap-2">
                {view.suggested.map((id) => {
                  const added = selected.has(id)
                  const label = OPTIONS_BY_ID.get(id)?.label ?? id
                  return (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      disabled={added}
                      onClick={() => onAddOption(id)}
                    >
                      {added ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : null}
                      {added ? `${label} added` : `Add “${label}”`}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {view.rewrite && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Suggested rewrite</h3>
              <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {view.rewrite}
              </pre>
              {!streaming && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => onUseRewrite(view.rewrite!)}
                    className={PRIMARY}
                  >
                    Use this rewrite
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyRewrite}>
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy rewrite'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
