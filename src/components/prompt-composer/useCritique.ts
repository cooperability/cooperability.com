'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { parsePartialJson } from './partial-json'
import {
  EMPTY_REVIEW,
  overallScore,
  toReviewView,
  type ReviewView,
} from './review'

export const CRITIQUE_ENDPOINT = '/api/ai/critique'

export type Availability =
  | 'checking'
  | 'enabled'
  | 'disabled'
  | 'budget'
  | 'unconfigured'
  | 'unavailable'

export type Phase = 'idle' | 'streaming' | 'done' | 'error'

export interface CritiqueState {
  phase: Phase
  view: ReviewView
  error: string | null
  // The model stopped at its token cap, so the tail (usually the rewrite)
  // is missing.
  truncated: boolean
  // The prompt text this review is of, to flag it stale after edits.
  reviewedText: string | null
  // The overall score of the review before this one, for the delta badge.
  previousScore: number | null
  fromCache: boolean
}

const INITIAL: CritiqueState = {
  phase: 'idle',
  view: EMPTY_REVIEW,
  error: null,
  truncated: false,
  reviewedText: null,
  previousScore: null,
  fromCache: false,
}

const REASONS = new Set<Availability>([
  'disabled',
  'budget',
  'unconfigured',
  'unavailable',
])

function errorFor(status: number, fallback?: string): string {
  if (status === 429) return 'Too many reviews in a row. Try again in a minute.'
  if (status === 413)
    return 'This prompt is too long to review (8,000 characters max).'
  if (status === 502)
    return 'The model is busy or unreachable. Try again shortly.'
  return fallback ?? 'The review failed. Try again shortly.'
}

// Reviews of text already reviewed this session are served from here, so a
// visitor re-clicking the button does not spend twice for the same answer.
const MAX_CACHED = 20

export function useCritique() {
  const [availability, setAvailability] = useState<Availability>('checking')
  const [state, setState] = useState<CritiqueState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef(new Map<string, ReviewView>())
  const lastScoreRef = useRef<number | null>(null)

  useEffect(() => {
    let live = true
    if (typeof fetch !== 'function') {
      // Async, like the fetch path, so no state is set during the effect.
      Promise.resolve().then(() => live && setAvailability('unavailable'))
      return () => {
        live = false
      }
    }
    fetch(CRITIQUE_ENDPOINT, { cache: 'no-store' })
      .then((res) => res.json())
      .then((body: { enabled?: boolean; reason?: Availability }) => {
        if (!live) return
        if (body.enabled) setAvailability('enabled')
        else
          setAvailability(
            REASONS.has(body.reason!) ? body.reason! : 'unavailable'
          )
      })
      .catch(() => live && setAvailability('unavailable'))
    return () => {
      live = false
      abortRef.current?.abort()
    }
  }, [])

  const complete = useCallback((text: string, view: ReviewView) => {
    const score = overallScore(view)
    const cache = cacheRef.current
    cache.set(text, view)
    if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!)
    const previous = lastScoreRef.current
    if (score !== null) lastScoreRef.current = score
    return previous
  }, [])

  const run = useCallback(
    async (prompt: string) => {
      const text = prompt.trim()
      if (!text) return

      const cached = cacheRef.current.get(text)
      if (cached) {
        setState((s) => ({
          ...INITIAL,
          phase: 'done',
          view: cached,
          reviewedText: text,
          previousScore: s.previousScore,
          fromCache: true,
        }))
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setState({ ...INITIAL, phase: 'streaming', reviewedText: text })

      let raw = ''
      let view = EMPTY_REVIEW
      try {
        const res = await fetch(CRITIQUE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
            reason?: Availability
          }
          if (body.reason && REASONS.has(body.reason)) {
            setAvailability(body.reason)
          }
          setState((s) => ({
            ...s,
            phase: 'error',
            error: errorFor(res.status, body.error),
          }))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffered = ''
        let ending: { type: string; stop_reason?: string | null } | null = null

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffered += decoder.decode(value, { stream: true })
          const lines = buffered.split('\n')
          buffered = lines.pop() ?? ''
          for (const line of lines) {
            if (!line) continue
            const msg = JSON.parse(line) as {
              type: string
              text?: string
              stop_reason?: string | null
            }
            if (msg.type === 'delta') raw += msg.text ?? ''
            else ending = msg
          }
          view = toReviewView(parsePartialJson(raw))
          setState((s) => ({ ...s, view }))
        }

        // The whole document is here now. A strict parse is authoritative;
        // the partial reader is the fallback for a cut-off tail.
        try {
          view = toReviewView(JSON.parse(raw))
        } catch {
          view = toReviewView(parsePartialJson(raw))
        }

        if (!ending || ending.type === 'error') {
          setState((s) => ({
            ...s,
            view,
            phase: 'error',
            error: 'The review was interrupted. Partial results are shown.',
          }))
          return
        }
        if (ending.stop_reason === 'refusal') {
          setState((s) => ({
            ...s,
            view,
            phase: 'error',
            error: 'The reviewer declined to review this prompt.',
          }))
          return
        }

        const truncated = ending.stop_reason === 'max_tokens'
        const previousScore = truncated
          ? lastScoreRef.current
          : complete(text, view)
        setState((s) => ({
          ...s,
          view,
          phase: 'done',
          truncated,
          previousScore,
        }))
      } catch {
        if (controller.signal.aborted) {
          setState((s) => ({
            ...s,
            view,
            phase: 'error',
            error: 'Review cancelled.',
          }))
          return
        }
        setState((s) => ({
          ...s,
          view,
          phase: 'error',
          error: errorFor(0),
        }))
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [complete]
  )

  const cancel = useCallback(() => abortRef.current?.abort(), [])
  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState(INITIAL)
  }, [])

  return { availability, state, run, cancel, reset }
}
