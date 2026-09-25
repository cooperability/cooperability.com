/**
 * The free, instant half of prompt grading. Runs on every keystroke in the
 * browser, costs nothing, and covers what rules can see. The AI review
 * (on demand, metered) covers what they cannot.
 *
 * Its dimensions are the AI review's, so the two read as one rubric.
 */
import type { ReviewDimension } from '@/src/lib/ai/review-schema'

import type { ComposerState, FieldId } from './catalog'
import { countWords, splitExamples } from './compile'

export type CheckStatus = 'good' | 'weak' | 'missing' | 'na'

export type Fix =
  { kind: 'field'; field: FieldId } | { kind: 'option'; id: string }

export interface Check {
  dimension: ReviewDimension
  status: CheckStatus
  message: string
  fix?: Fix
}

export interface Warning {
  id: 'persona' | 'caps' | 'prohibitions' | 'cot-script'
  message: string
}

export interface LintResult {
  checks: Check[]
  warnings: Warning[]
  // 0-100 over the dimensions that apply, or null before anything is written.
  score: number | null
}

const has = (selected: ReadonlySet<string>, prefix: string) =>
  [...selected].some((id) => id.startsWith(prefix))

// Words that point at material the prompt is supposed to carry.
const REFERS_TO_MATERIAL =
  /\b(?:this|these|the following|attached|below|above|provided|given|pasted)\s+(?:\w+\s+)?(?:text|document|doc|data|dataset|article|report|email|code|transcript|passage|file|notes|table|survey|results|essay|draft|paper|spreadsheet|contract|policy)\b/i

const FORMAT_SENSITIVE = /\b(?:format|style|tone|template|voice|consistent)\b/i

function checkTask(state: ComposerState): Check {
  const words = countWords(state.fields.task)
  if (words === 0) {
    return {
      dimension: 'task',
      status: 'missing',
      message: 'Write the task: what should the model produce?',
      fix: { kind: 'field', field: 'task' },
    }
  }
  if (words < 8) {
    return {
      dimension: 'task',
      status: 'weak',
      message: 'Say what a finished result looks like, not just the topic.',
      fix: { kind: 'field', field: 'task' },
    }
  }
  return { dimension: 'task', status: 'good', message: 'The task is explicit.' }
}

function checkContext({ fields, selected }: ComposerState): Check {
  const why = fields.context.trim().length > 0
  const who = has(selected, 'audience-')
  if (why && who) {
    return {
      dimension: 'context',
      status: 'good',
      message: 'Purpose and audience are both stated.',
    }
  }
  if (why) {
    return {
      dimension: 'context',
      status: 'weak',
      message: 'Say who will read the result, so depth and vocabulary fit.',
      fix: { kind: 'field', field: 'context' },
    }
  }
  if (who) {
    return {
      dimension: 'context',
      status: 'weak',
      message:
        'Say why the task matters. Reasons generalise better than rules.',
      fix: { kind: 'field', field: 'context' },
    }
  }
  return {
    dimension: 'context',
    status: 'missing',
    message: 'Add background: what this is for, and who it is for.',
    fix: { kind: 'field', field: 'context' },
  }
}

function checkInput({ fields }: ComposerState): Check {
  if (fields.input.trim()) {
    return {
      dimension: 'input',
      status: 'good',
      message: 'Material is delimited in <input> tags, ahead of the task.',
    }
  }
  if (REFERS_TO_MATERIAL.test(fields.task)) {
    return {
      dimension: 'input',
      status: 'missing',
      message: 'The task refers to material. Paste it into Input.',
      fix: { kind: 'field', field: 'input' },
    }
  }
  return {
    dimension: 'input',
    status: 'na',
    message: 'No material needed for this task.',
  }
}

function checkExamples({ fields, selected }: ComposerState): Check {
  const count = splitExamples(fields.examples).length
  if (count >= 3) {
    return {
      dimension: 'examples',
      status: 'good',
      message: `${count} examples. Check they vary enough to show the pattern.`,
    }
  }
  if (count > 0) {
    return {
      dimension: 'examples',
      status: 'weak',
      message: `${count} example${count > 1 ? 's' : ''}. Three to five varied ones steer best.`,
      fix: { kind: 'field', field: 'examples' },
    }
  }
  const formatMatters =
    selected.has('format-json') ||
    selected.has('format-table') ||
    FORMAT_SENSITIVE.test(fields.task)
  if (formatMatters) {
    return {
      dimension: 'examples',
      status: 'weak',
      message:
        'Format matters here, and an example fixes it better than a description.',
      fix: { kind: 'field', field: 'examples' },
    }
  }
  return {
    dimension: 'examples',
    status: 'na',
    message: 'Optional for this task.',
  }
}

function checkOutput({ fields, selected }: ComposerState): Check {
  const stated = [
    has(selected, 'format-'),
    has(selected, 'length-'),
    fields.constraints.trim().length > 0 || has(selected, 'output-'),
  ].filter(Boolean).length
  if (stated >= 2) {
    return {
      dimension: 'output',
      status: 'good',
      message: 'The shape of the answer is specified.',
    }
  }
  if (stated === 1) {
    return {
      dimension: 'output',
      status: 'weak',
      message: 'Add a format or length, so the model does not guess.',
    }
  }
  return {
    dimension: 'output',
    status: 'missing',
    message: 'Say what shape the answer should take.',
  }
}

function checkQuality({ fields, selected }: ComposerState): Check {
  const hasInput = fields.input.trim().length > 0
  if (hasInput && !selected.has('quality-grounding')) {
    return {
      dimension: 'quality',
      status: 'weak',
      message: 'With material attached, ask for answers grounded in it.',
      fix: { kind: 'option', id: 'quality-grounding' },
    }
  }
  if (has(selected, 'quality-')) {
    return {
      dimension: 'quality',
      status: 'good',
      message: 'Includes a quality safeguard.',
    }
  }
  return {
    dimension: 'quality',
    status: 'weak',
    message: 'Give it permission to say it does not know, which cuts guessing.',
    fix: { kind: 'option', id: 'quality-unknown' },
  }
}

// Patterns in the final text that current guidance says to drop. These read
// the edited prompt, so they also catch what was typed in by hand.
export function warningsFor(text: string): Warning[] {
  const warnings: Warning[] = []

  if (
    /\byou are (?:an?|the)\s+(?:[\w-]+\s+){0,5}(?:expert|specialist|consultant|analyst|professional|guru|authority)\b/i.test(
      text
    ) ||
    /\b(?:act|pretend|behave) as (?:an?|the)\s+(?:[\w-]+\s+){0,5}(?:expert|specialist)\b/i.test(
      text
    )
  ) {
    warnings.push({
      id: 'persona',
      message:
        'Expert personas do not reliably improve accuracy. The same words spent on context usually help more.',
    })
  }

  const shouting = text.match(
    /\b(?:NEVER|ALWAYS|MUST|IMPORTANT|CRITICAL|DO NOT|DON'T)\b/g
  )
  if (shouting && shouting.length >= 2) {
    warnings.push({
      id: 'caps',
      message:
        'Emphatic capitals tend to over-steer current models. Give the reason instead.',
    })
  }

  const prohibitions = text.match(/\b(?:don't|do not|never|avoid)\b/gi)
  if (prohibitions && prohibitions.length >= 4) {
    warnings.push({
      id: 'prohibitions',
      message:
        'Several prohibitions. Saying what to do works better than listing what not to do.',
    })
  }

  if (/\bstep[- ]by[- ]step\b/i.test(text)) {
    warnings.push({
      id: 'cot-script',
      message:
        'Scripted step-by-step reasoning adds little on reasoning models. "Think first" covers older ones.',
    })
  }

  return warnings
}

const POINTS: Record<CheckStatus, number> = {
  good: 2,
  weak: 1,
  missing: 0,
  na: 0,
}

export function lintPrompt(state: ComposerState, text: string): LintResult {
  const checks = [
    checkTask(state),
    checkContext(state),
    checkInput(state),
    checkExamples(state),
    checkOutput(state),
    checkQuality(state),
  ]
  const scored = checks.filter((c) => c.status !== 'na')
  const earned = scored.reduce((sum, c) => sum + POINTS[c.status], 0)

  return {
    checks,
    warnings: warningsFor(text),
    score: text.trim()
      ? Math.round((earned / (scored.length * 2)) * 100)
      : null,
  }
}
