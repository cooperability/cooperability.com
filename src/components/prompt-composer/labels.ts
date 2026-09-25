import type { ReviewDimension } from '@/src/lib/ai/review-schema'

// One vocabulary for the live check and the AI review, so the two read as a
// single rubric.
export const DIMENSION_LABELS: Record<ReviewDimension, string> = {
  task: 'Task',
  context: 'Context',
  input: 'Input',
  examples: 'Examples',
  output: 'Output',
  quality: 'Quality',
}
