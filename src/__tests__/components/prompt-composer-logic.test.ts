import {
  COMPONENT_IDS,
  EMPTY_FIELDS,
  OPTIONS,
  setGroup,
  toggleOption,
  type ComposerState,
} from '../../components/prompt-composer/catalog'
import {
  compilePrompt,
  countWords,
  estimateTokens,
  splitExamples,
} from '../../components/prompt-composer/compile'
import { lintPrompt, warningsFor } from '../../components/prompt-composer/lint'
import { parsePartialJson } from '../../components/prompt-composer/partial-json'
import {
  overallScore,
  toReviewView,
} from '../../components/prompt-composer/review'

function state(
  fields: Partial<ComposerState['fields']> = {},
  selected: string[] = []
): ComposerState {
  return { fields: { ...EMPTY_FIELDS, ...fields }, selected: new Set(selected) }
}

describe('catalog', () => {
  it('has unique option ids', () => {
    expect(new Set(COMPONENT_IDS).size).toBe(COMPONENT_IDS.length)
  })

  it('no longer offers a persona', () => {
    for (const o of OPTIONS) {
      expect(o.template).not.toMatch(/^You are (an?|the) /i)
    }
  })

  it('keeps a radio group exclusive', () => {
    let s = toggleOption(new Set(), 'length-brief')
    s = toggleOption(s, 'length-thorough')
    expect([...s]).toEqual(['length-thorough'])
  })

  it('toggles a checkbox off again', () => {
    const s = toggleOption(
      toggleOption(new Set(), 'quality-verify'),
      'quality-verify'
    )
    expect(s.size).toBe(0)
  })

  it('returns a group to "let the model decide"', () => {
    const s = setGroup(
      new Set(['format-json', 'quality-verify']),
      'format',
      null
    )
    expect([...s]).toEqual(['quality-verify'])
  })

  it('ignores an id from another group', () => {
    expect([...setGroup(new Set(), 'format', 'length-brief')]).toEqual([])
  })
})

describe('compilePrompt', () => {
  it('compiles an untouched composer to nothing', () => {
    expect(compilePrompt(state())).toBe('')
  })

  it('puts context and material first and the task after them', () => {
    const out = compilePrompt(
      state(
        {
          task: 'Summarize the report.',
          context: 'For the board.',
          input: 'Q3 revenue rose 4%.',
        },
        ['audience-expert', 'format-prose', 'quality-grounding']
      )
    )

    expect(out).toBe(
      [
        '<context>\nFor the board.\n\nThe reader is an expert, so use precise terminology, skip introductory material, and cover edge cases and tradeoffs.\n</context>',
        '<input>\nQ3 revenue rose 4%.\n</input>',
        'Summarize the report.',
        '- Write the response as flowing prose paragraphs.',
        'Base your answer on the provided input. Quote the passages you rely on before drawing conclusions from them.',
      ].join('\n\n')
    )
    expect(out.indexOf('<input>')).toBeLessThan(out.indexOf('Summarize'))
  })

  it('wraps each example in its own tag', () => {
    const out = compilePrompt(
      state({ examples: 'one\n---\ntwo\n----\n\nthree' })
    )

    expect(out).toBe(
      '<examples>\n<example>\none\n</example>\n<example>\ntwo\n</example>\n<example>\nthree\n</example>\n</examples>'
    )
  })

  it('lists requirements as bullets, stripping bullets the user typed', () => {
    const out = compilePrompt(
      state({ constraints: '- Cite figures\n\n* Keep names' }, ['length-brief'])
    )

    expect(out).toBe(
      '- Cite figures\n- Keep names\n- Keep the response under about 150 words.'
    )
  })
})

describe('text stats', () => {
  it('counts words and estimates tokens', () => {
    expect(countWords('  one two\nthree ')).toBe(3)
    expect(countWords('   ')).toBe(0)
    expect(estimateTokens('abcdefgh')).toBe(2)
  })

  it('splits examples on dash lines only', () => {
    expect(splitExamples('a - b\n---\nc')).toEqual(['a - b', 'c'])
  })
})

describe('lintPrompt', () => {
  const statusOf = (s: ComposerState, dim: string) =>
    lintPrompt(s, compilePrompt(s)).checks.find((c) => c.dimension === dim)!
      .status

  it('has no score before anything is written', () => {
    expect(lintPrompt(state(), '').score).toBeNull()
  })

  it('flags a missing task, then a vague one, then passes a specific one', () => {
    expect(statusOf(state(), 'task')).toBe('missing')
    expect(statusOf(state({ task: 'Write about dogs' }), 'task')).toBe('weak')
    expect(
      statusOf(
        state({
          task: 'Write a 200-word adoption listing for a senior beagle named Max',
        }),
        'task'
      )
    ).toBe('good')
  })

  it('asks for material the task points at', () => {
    const s = state({ task: 'Summarize the attached report for the board' })
    const check = lintPrompt(s, compilePrompt(s)).checks.find(
      (c) => c.dimension === 'input'
    )!

    expect(check.status).toBe('missing')
    expect(check.fix).toEqual({ kind: 'field', field: 'input' })
  })

  it('does not score input a task does not need', () => {
    expect(
      statusOf(
        state({ task: 'Write a haiku about autumn leaves falling' }),
        'input'
      )
    ).toBe('na')
  })

  it('asks for grounding once material is attached', () => {
    const s = state({ task: 'Summarize it', input: 'text' })
    const check = lintPrompt(s, compilePrompt(s)).checks.find(
      (c) => c.dimension === 'quality'
    )!

    expect(check.fix).toEqual({ kind: 'option', id: 'quality-grounding' })
  })

  it('wants examples when the format matters', () => {
    expect(statusOf(state({}, ['format-json']), 'examples')).toBe('weak')
    expect(statusOf(state(), 'examples')).toBe('na')
    expect(statusOf(state({ examples: 'a\n---\nb\n---\nc' }), 'examples')).toBe(
      'good'
    )
  })

  it('scores a complete prompt at 100', () => {
    const s = state(
      {
        task: 'Draft a one-page summary of the survey results below for the board',
        context: 'The board decides next quarter’s budget on Thursday.',
        input: 'results',
        examples: 'a\n---\nb\n---\nc',
      },
      [
        'audience-general',
        'format-structured',
        'length-brief',
        'quality-grounding',
      ]
    )

    expect(lintPrompt(s, compilePrompt(s)).score).toBe(100)
  })
})

describe('warningsFor', () => {
  const ids = (text: string) => warningsFor(text).map((w) => w.id)

  it('flags personas', () => {
    expect(ids('You are a world-class marketing expert.')).toContain('persona')
    expect(ids('Act as a senior tax specialist.')).toContain('persona')
    expect(ids('You are writing for experts.')).not.toContain('persona')
  })

  it('flags repeated shouting but not a single acronym-like word', () => {
    expect(ids('NEVER guess. ALWAYS cite.')).toContain('caps')
    expect(ids('It is IMPORTANT that you cite.')).not.toContain('caps')
  })

  it('flags a pile of prohibitions', () => {
    expect(
      ids("Don't guess. Do not hedge. Never pad. Avoid jargon.")
    ).toContain('prohibitions')
  })

  it('flags scripted chain of thought', () => {
    expect(ids('Think step by step.')).toContain('cot-script')
  })
})

describe('parsePartialJson', () => {
  const doc = JSON.stringify({
    summary: 'Clear "task", thin context.',
    scores: { task: { score: 4, note: 'ok\\n' } },
    suggested_components: ['quality-verify'],
    rewrite: 'Line one\nLine two é 漢',
  })

  it('reads every prefix of a document without throwing', () => {
    for (let i = 0; i <= doc.length; i++) {
      expect(() => parsePartialJson(doc.slice(0, i))).not.toThrow()
    }
  })

  it('returns the whole document once complete', () => {
    expect(parsePartialJson(doc)).toEqual(JSON.parse(doc))
  })

  it('surfaces a string while it is still streaming', () => {
    expect(parsePartialJson('{"summary":"Clear ta')).toEqual({
      summary: 'Clear ta',
    })
  })

  it('drops a half-written key and a half-written literal', () => {
    expect(parsePartialJson('{"a":1,"summ')).toEqual({ a: 1 })
    expect(parsePartialJson('{"a":tr')).toEqual({})
  })

  it('never splits an escape sequence', () => {
    expect(parsePartialJson('{"a":"x\\')).toEqual({ a: 'x' })
    expect(parsePartialJson('{"a":"x\\u00')).toEqual({ a: 'x' })
  })

  it('returns undefined for nothing', () => {
    expect(parsePartialJson('  ')).toBeUndefined()
  })
})

describe('toReviewView', () => {
  it('keeps only known dimensions, clamps scores and drops unknown ids', () => {
    const view = toReviewView({
      summary: 'ok',
      scores: {
        task: { score: 9, note: 'n' },
        context: { score: 0 },
        bogus: { score: 3 },
      },
      suggested_components: [
        'quality-verify',
        'quality-verify',
        'rm -rf',
        42,
        'format-json',
        'length-brief',
        'quality-unknown',
      ],
      rewrite: { not: 'a string' },
    })

    expect(view.scores).toEqual({
      task: { score: 5, note: 'n' },
      context: { score: 1, note: undefined },
    })
    expect(view.suggested).toEqual([
      'quality-verify',
      'format-json',
      'length-brief',
    ])
    expect(view.rewrite).toBeUndefined()
  })

  it('survives garbage', () => {
    expect(toReviewView(null)).toEqual({ scores: {}, suggested: [] })
    expect(toReviewView([1, 2])).toEqual({ scores: {}, suggested: [] })
  })
})

describe('overallScore', () => {
  const all = (score: number) =>
    toReviewView({
      scores: Object.fromEntries(
        ['task', 'context', 'input', 'examples', 'output', 'quality'].map(
          (d) => [d, { score }]
        )
      ),
    })

  it('maps 1-5 onto 0-100', () => {
    expect(overallScore(all(1))).toBe(0)
    expect(overallScore(all(5))).toBe(100)
    expect(overallScore(all(3))).toBe(50)
  })

  it('waits until every dimension has arrived', () => {
    expect(
      overallScore(toReviewView({ scores: { task: { score: 5 } } }))
    ).toBeNull()
  })
})
