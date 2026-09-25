import {
  REVIEW_DIMENSIONS,
  type ReviewDimension,
} from '@/src/lib/ai/review-schema'

import { OPTIONS_BY_ID } from './catalog'

export interface DimensionView {
  score?: number
  note?: string
}

// What the panel renders. Every field is optional because it is read from a
// document that is still streaming in.
export interface ReviewView {
  summary?: string
  scores: Partial<Record<ReviewDimension, DimensionView>>
  topFix?: string
  suggested: string[]
  rewrite?: string
}

export const EMPTY_REVIEW: ReviewView = { scores: {}, suggested: [] }

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
const obj = (v: unknown) =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined

// Model output is untrusted input to the page, whatever the schema promises:
// keep only known keys and types, clamp scores, and admit only component ids
// the catalog knows, so a suggestion can never toggle something that isn't
// there.
export function toReviewView(value: unknown): ReviewView {
  const root = obj(value)
  if (!root) return EMPTY_REVIEW

  const scores: ReviewView['scores'] = {}
  const rawScores = obj(root.scores)
  for (const dim of REVIEW_DIMENSIONS) {
    const d = obj(rawScores?.[dim])
    if (!d) continue
    const score =
      typeof d.score === 'number' && Number.isFinite(d.score)
        ? Math.min(5, Math.max(1, Math.round(d.score)))
        : undefined
    scores[dim] = { score, note: str(d.note) }
  }

  const suggested = Array.isArray(root.suggested_components)
    ? [
        ...new Set(
          root.suggested_components.filter(
            (id): id is string =>
              typeof id === 'string' && OPTIONS_BY_ID.has(id)
          )
        ),
      ].slice(0, 3)
    : []

  return {
    summary: str(root.summary),
    scores,
    topFix: str(root.top_fix),
    suggested,
    rewrite: str(root.rewrite),
  }
}

// 0-100, and only once every dimension has a score, so the headline number
// does not jump around while the scorecard is still arriving.
export function overallScore(view: ReviewView): number | null {
  const values = REVIEW_DIMENSIONS.map((d) => view.scores[d]?.score)
  if (values.some((v) => v === undefined)) return null
  const mean = (values as number[]).reduce((a, b) => a + b, 0) / values.length
  return Math.round(((mean - 1) / 4) * 100)
}
