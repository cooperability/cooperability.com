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

/**
 * Builds the prompt in the order the evidence favours: framing, then the
 * material (in tags, so it cannot be mistaken for instructions), then
 * examples, then the task, then how to answer. Anthropic measured queries at
 * the end of a long prompt at up to 30% better than queries at the top.
 *
 * An untouched composer compiles to the empty string, so the empty state is
 * reachable and nothing boilerplate is ever copied by accident.
 */
export function compilePrompt({ fields, selected }: ComposerState): string {
  const blocks: string[] = []

  const context = [fields.context.trim(), ...templatesFor(selected, 'context')]
    .filter(Boolean)
    .join('\n\n')
  if (context) blocks.push(tagged('context', context))

  const input = fields.input.trim()
  if (input) blocks.push(tagged('input', input))

  const examples = splitExamples(fields.examples)
  if (examples.length > 0) {
    blocks.push(
      tagged('examples', examples.map((e) => tagged('example', e)).join('\n'))
    )
  }

  const task = fields.task.trim()
  if (task) blocks.push(task)

  const requirements = fields.constraints
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean)
  const output = templatesFor(selected, 'output')
  if (requirements.length > 0 || output.length > 0) {
    blocks.push([...requirements, ...output].map((r) => `- ${r}`).join('\n'))
  }

  for (const section of ['quality', 'interaction'] as const) {
    const lines = templatesFor(selected, section)
    if (lines.length > 0) blocks.push(lines.join(' '))
  }

  return blocks.join('\n\n')
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
