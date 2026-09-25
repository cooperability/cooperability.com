// Shared by the route (as the structured-output schema) and the Prompt
// Composer (to read the streamed result). No server imports: this module
// ships to the browser.
import { COMPONENT_IDS } from '@/src/components/prompt-composer/catalog'

export const REVIEW_DIMENSIONS = [
  'task',
  'context',
  'input',
  'examples',
  'output',
  'quality',
] as const

export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number]

export interface DimensionScore {
  score: number
  note: string
}

export interface PromptReview {
  summary: string
  scores: Record<ReviewDimension, DimensionScore>
  top_fix: string
  suggested_components: string[]
  rewrite: string
}

// Field order is stream order, so the scorecard lands first and the long
// rewrite last. Structured outputs cannot express min/max or maxLength, so
// the integer enum carries the 1-5 range and the prompt carries the lengths.
export const REVIEW_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'scores', 'top_fix', 'suggested_components', 'rewrite'],
  properties: {
    summary: { type: 'string' },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: [...REVIEW_DIMENSIONS],
      properties: Object.fromEntries(
        REVIEW_DIMENSIONS.map((d) => [d, { $ref: '#/$defs/dimension' }])
      ),
    },
    top_fix: { type: 'string' },
    suggested_components: {
      type: 'array',
      items: { type: 'string', enum: COMPONENT_IDS },
    },
    rewrite: { type: 'string' },
  },
  $defs: {
    dimension: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'note'],
      properties: {
        score: { type: 'integer', enum: [1, 2, 3, 4, 5] },
        note: { type: 'string' },
      },
    },
  },
} as const
