import {
  OPTIONS,
  type ComposerState,
  type PromptOption,
  type SectionId,
} from './catalog'

// A line holding only three or more dashes separates one example from the
// next.
const EXAMPLE_SEPARATOR = /^\s*-{3,}\s*$/m

export function splitExamples(text: string): string[] {
  return text
    .split(EXAMPLE_SEPARATOR)
    .map((e) => e.trim())
    .filter(Boolean)
}

function tagged(tag: string, body: string): string {
  return `<${tag}>\n${body}\n</${tag}>`
}

function templatesFor(
  selected: ReadonlySet<string>,
  section: SectionId
): string[] {
  return OPTIONS.filter(
    (o: PromptOption) => o.section === section && selected.has(o.id)
  ).map((o) => o.template)
}

export interface Block {
  section: SectionId
  text: string
}

/**
 * Builds the prompt in the order the evidence favours: framing, then the
 * material (in tags, so it cannot be mistaken for instructions), then
 * examples, then the task, then how to answer. Anthropic measured queries at
 * the end of a long prompt at up to 30% better than queries at the top.
 *
 * Each block comes from exactly one section, which is what lets the prompt
 * be coloured and measured by section.
 */
export function compileBlocks({ fields, selected }: ComposerState): Block[] {
  const blocks: Block[] = []

  const context = [fields.context.trim(), ...templatesFor(selected, 'context')]
    .filter(Boolean)
    .join('\n\n')
  if (context)
    blocks.push({ section: 'context', text: tagged('context', context) })

  const input = fields.input.trim()
  if (input) blocks.push({ section: 'input', text: tagged('input', input) })

  const examples = splitExamples(fields.examples)
  if (examples.length > 0) {
    blocks.push({
      section: 'examples',
      text: tagged(
        'examples',
        examples.map((e) => tagged('example', e)).join('\n')
      ),
    })
  }

  const task = fields.task.trim()
  if (task) blocks.push({ section: 'task', text: task })

  const requirements = fields.constraints
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean)
  const output = templatesFor(selected, 'output')
  if (requirements.length > 0 || output.length > 0) {
    blocks.push({
      section: 'output',
      text: [...requirements, ...output].map((r) => `- ${r}`).join('\n'),
    })
  }

  for (const section of ['quality', 'interaction'] as const) {
    const lines = templatesFor(selected, section)
    if (lines.length > 0) blocks.push({ section, text: lines.join(' ') })
  }

  return blocks
}

/**
 * An untouched composer compiles to the empty string, so the empty state is
 * reachable and nothing boilerplate is ever copied by accident.
 */
export function joinBlocks(blocks: Block[]): string {
  return blocks.map((b) => b.text).join('\n\n')
}

export function compilePrompt(state: ComposerState): string {
  return joinBlocks(compileBlocks(state))
}

// `edited` is text no block accounts for: hand edits, or a pasted prompt.
export type SpanKind = SectionId | 'edited'

export interface Span {
  kind: SpanKind | null
  text: string
}

/**
 * Splits the prompt into runs attributed to the block they came from. Blocks
 * are looked for in compile order, so a hand-edited prompt keeps the colour of
 * every block that survives verbatim and in its original order. A block moved
 * earlier reads as a hand edit, and so does every block it jumped over. The
 * order is what keeps the runs from repeating text. Whitespace between blocks
 * belongs to none
 * (kind null) and is never counted.
 */
export function attribute(text: string, blocks: Block[]): Span[] {
  const spans: Span[] = []
  const gap = (s: string) => {
    if (s) spans.push({ kind: s.trim() ? 'edited' : null, text: s })
  }
  let at = 0
  for (const block of blocks) {
    const found = text.indexOf(block.text, at)
    if (found < 0) continue
    gap(text.slice(at, found))
    spans.push({ kind: block.section, text: block.text })
    at = found + block.text.length
  }
  gap(text.slice(at))
  return spans
}

export interface Share {
  kind: SpanKind
  chars: number
  tokens: number
}

// One row per kind, in the order it first appears in the prompt.
export function composition(spans: Span[]): Share[] {
  const chars = new Map<SpanKind, number>()
  for (const { kind, text } of spans) {
    if (kind) chars.set(kind, (chars.get(kind) ?? 0) + text.trim().length)
  }
  return [...chars].map(([kind, n]) => ({
    kind,
    chars: n,
    tokens: Math.ceil(n / 4),
  }))
}

// Roughly four characters per token for English prose on current
// tokenizers. Good enough to tell a 200-token prompt from a 20,000-token one,
// which is all the stats row claims.
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4)
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}
