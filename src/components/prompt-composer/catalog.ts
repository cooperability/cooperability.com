/**
 * The Prompt Composer's vocabulary: the free-text slots a prompt is built
 * from, the guidance options layered on top, and the sections that group them.
 *
 * Organised around what current models need to be told, not around who they
 * should pretend to be. See PROMPT-COMPOSER-README.md for the evidence.
 *
 * Pure data. The server imports COMPONENT_IDS for the review schema, so
 * nothing here may touch React or the DOM.
 */

export type SectionId =
  | 'task'
  | 'context'
  | 'input'
  | 'examples'
  | 'output'
  | 'quality'
  | 'interaction'

export type FieldId = 'task' | 'context' | 'input' | 'examples' | 'constraints'

export interface PromptField {
  id: FieldId
  section: SectionId
  label: string
  placeholder: string
  hint: string
  rows: number
}

export interface PromptOption {
  id: string
  section: SectionId
  label: string
  description: string
  template: string
  // Options sharing a group are mutually exclusive (a radio group), because
  // two answers to one question ("how long?") contradict each other.
  group?: string
}

export interface PromptSection {
  id: SectionId
  label: string
  icon: string
  blurb: string
}

export const SECTIONS: PromptSection[] = [
  {
    id: 'task',
    label: 'Task',
    icon: '🎯',
    blurb: 'The instruction itself. Be explicit about what done looks like.',
  },
  {
    id: 'context',
    label: 'Context & audience',
    icon: '📋',
    blurb:
      'Why the task matters and who it is for. Explaining the why beats assigning a persona.',
  },
  {
    id: 'input',
    label: 'Input material',
    icon: '📥',
    blurb:
      'Anything the task operates on. It is wrapped in tags and placed before the instructions.',
  },
  {
    id: 'examples',
    label: 'Examples',
    icon: '🧪',
    blurb:
      'Three to five varied examples are the most reliable way to fix format and tone.',
  },
  {
    id: 'output',
    label: 'Output',
    icon: '📄',
    blurb: 'Format, length and requirements, stated as what to do.',
  },
  {
    id: 'quality',
    label: 'Reasoning & quality',
    icon: '🔍',
    blurb: 'Grounding, honesty about uncertainty, and a final self-check.',
  },
  {
    id: 'interaction',
    label: 'Interaction',
    icon: '💬',
    blurb: 'How the model should handle ambiguity and follow-up.',
  },
]

export const FIELDS: PromptField[] = [
  {
    id: 'task',
    section: 'task',
    label: 'Task',
    placeholder:
      'e.g. Draft a one-page summary of the attached survey results for our board, highlighting the three findings that should change next quarter’s plan.',
    hint: 'Start with a verb. Name the deliverable and what a good one achieves.',
    rows: 4,
  },
  {
    id: 'context',
    section: 'context',
    label: 'Background and purpose',
    placeholder:
      'e.g. The board meets Thursday and has ten minutes for this item. Last quarter they asked for fewer charts and clearer recommendations.',
    hint: 'What is this for, and what does the model need to know that you know?',
    rows: 3,
  },
  {
    id: 'input',
    section: 'input',
    label: 'Material to work from',
    placeholder: 'Paste the document, data or text the task refers to.',
    hint: 'Compiled inside <input> tags, above the instructions.',
    rows: 5,
  },
  {
    id: 'examples',
    section: 'examples',
    label: 'Examples',
    placeholder:
      'One example per block. Separate examples with a line containing only ---',
    hint: 'Vary them, so the model copies the pattern rather than the content.',
    rows: 5,
  },
  {
    id: 'constraints',
    section: 'output',
    label: 'Requirements',
    placeholder:
      'e.g. Use the figures exactly as given. Mention the survey’s sample size.',
    hint: 'One requirement per line. Give the reason when it is not obvious.',
    rows: 3,
  },
]

export const OPTIONS: PromptOption[] = [
  // Audience: who reads the result sets depth and vocabulary. This replaces
  // the old persona radio, which told the model who to be instead.
  {
    id: 'audience-general',
    section: 'context',
    group: 'audience',
    label: 'General reader',
    description: 'No specialist background',
    template:
      'The reader has no specialist background, so define technical terms the first time they appear.',
  },
  {
    id: 'audience-practitioner',
    section: 'context',
    group: 'audience',
    label: 'Practitioner',
    description: 'Works in the field day to day',
    template:
      'The reader works in this field day to day, so skip the basics and focus on practical detail.',
  },
  {
    id: 'audience-expert',
    section: 'context',
    group: 'audience',
    label: 'Expert',
    description: 'Wants depth, edge cases and tradeoffs',
    template:
      'The reader is an expert, so use precise terminology, skip introductory material, and cover edge cases and tradeoffs.',
  },

  {
    id: 'format-prose',
    section: 'output',
    group: 'format',
    label: 'Prose',
    description: 'Flowing paragraphs',
    template: 'Write the response as flowing prose paragraphs.',
  },
  {
    id: 'format-structured',
    section: 'output',
    group: 'format',
    label: 'Structured',
    description: 'Headings, with lists for parallel items',
    template:
      'Organize the response under clear headings, using lists only where items are parallel.',
  },
  {
    id: 'format-table',
    section: 'output',
    group: 'format',
    label: 'Table',
    description: 'A table plus brief notes',
    template:
      'Present the core of the response as a table, followed by brief notes on anything the table cannot hold.',
  },
  {
    id: 'format-json',
    section: 'output',
    group: 'format',
    label: 'JSON',
    description: 'Machine-readable output only',
    template:
      'Respond with valid JSON only, with no text before or after it. Describe the fields you expect in the task or show them in an example.',
  },

  {
    id: 'length-brief',
    section: 'output',
    group: 'length',
    label: 'Brief',
    description: 'Under about 150 words',
    template: 'Keep the response under about 150 words.',
  },
  {
    id: 'length-moderate',
    section: 'output',
    group: 'length',
    label: 'Moderate',
    description: 'Roughly 300–500 words',
    template: 'Aim for roughly 300 to 500 words.',
  },
  {
    id: 'length-thorough',
    section: 'output',
    group: 'length',
    label: 'Thorough',
    description: 'As long as the task needs',
    template:
      'Be thorough: cover the topic fully, including edge cases, rather than summarizing.',
  },

  {
    id: 'output-answer-first',
    section: 'output',
    label: 'Answer first',
    description: 'Lead with the conclusion',
    template:
      'Start with the direct answer or recommendation, then give the support for it.',
  },
  {
    id: 'output-next-steps',
    section: 'output',
    label: 'Next steps',
    description: 'End with concrete actions',
    template: 'End with concrete next steps the reader can act on.',
  },
  {
    id: 'output-plain',
    section: 'output',
    label: 'Plain language',
    description: 'No filler, hype or needless hedging',
    template:
      'Use plain, direct language, without filler, hype or unnecessary hedging.',
  },

  {
    id: 'quality-grounding',
    section: 'quality',
    label: 'Ground in the input',
    description: 'Quote the material before concluding',
    template:
      'Base your answer on the provided input. Quote the passages you rely on before drawing conclusions from them.',
  },
  {
    id: 'quality-unknown',
    section: 'quality',
    label: 'Permission to not know',
    description: 'Say so rather than guess',
    template:
      'If you are not sure, or the information is not available, say so plainly instead of guessing.',
  },
  {
    id: 'quality-confidence',
    section: 'quality',
    label: 'Flag confidence',
    description: 'Mark assumptions and certainty',
    template:
      'Flag the assumptions you make and how confident you are in each key claim.',
  },
  {
    id: 'quality-think',
    section: 'quality',
    label: 'Think first',
    description: 'For non-reasoning models only',
    template:
      'Think the problem through and weigh the possible approaches before you answer.',
  },
  {
    id: 'quality-alternatives',
    section: 'quality',
    label: 'Consider alternatives',
    description: 'Weigh one other approach',
    template:
      'Consider at least one alternative approach, and briefly explain why you chose yours.',
  },
  {
    id: 'quality-verify',
    section: 'quality',
    label: 'Self-check',
    description: 'Verify against the requirements',
    template:
      'Before finishing, check your response against every requirement above and fix anything that falls short.',
  },

  {
    id: 'interaction-clarify',
    section: 'interaction',
    label: 'Clarify, then answer',
    description: 'Ask when ambiguity would change the answer',
    template:
      'If the task is ambiguous in a way that would change your answer, ask me clarifying questions before you start.',
  },
  {
    id: 'interaction-improve',
    section: 'interaction',
    label: 'Suggest prompt fixes',
    description: 'Say how to ask better next time',
    template:
      'After your response, suggest how this prompt could be changed to get a better result.',
  },
]

export const COMPONENT_IDS = OPTIONS.map((o) => o.id)

export const OPTIONS_BY_ID: ReadonlyMap<string, PromptOption> = new Map(
  OPTIONS.map((o) => [o.id, o])
)

export const EMPTY_FIELDS: Record<FieldId, string> = {
  task: '',
  context: '',
  input: '',
  examples: '',
  constraints: '',
}

export interface ComposerState {
  fields: Record<FieldId, string>
  selected: ReadonlySet<string>
}

// Selecting one option in a group clears its siblings. Selecting an option
// that is already on turns it off.
export function toggleOption(
  selected: ReadonlySet<string>,
  id: string
): Set<string> {
  const next = new Set(selected)
  if (next.has(id)) {
    next.delete(id)
    return next
  }
  const group = OPTIONS_BY_ID.get(id)?.group
  if (group) return setGroup(selected, group, id)
  next.add(id)
  return next
}

// null is a real answer ("let the model decide"), and often the right one
// for length on a reasoning model, so every group can return to it.
export function setGroup(
  selected: ReadonlySet<string>,
  group: string,
  id: string | null
): Set<string> {
  const next = new Set(selected)
  for (const option of OPTIONS) {
    if (option.group === group) next.delete(option.id)
  }
  if (id !== null && OPTIONS_BY_ID.get(id)?.group === group) next.add(id)
  return next
}
