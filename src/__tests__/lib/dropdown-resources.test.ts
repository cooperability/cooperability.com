import { getResourceBySlug } from '../../lib/resources'

/**
 * Jest cannot load the ESM-only MDX pipeline, so the rendered dropdowns are
 * checked by `pnpm dropdowns` in a real browser. These pin the content and
 * front matter that rendering depends on.
 */

const DROPDOWN_PAGES = ['LLMPrompts', 'OnlineTools']

function content(slug: string) {
  const resource = getResourceBySlug(slug)
  if (!resource) throw new Error(`missing resource ${slug}`)
  return resource
}

describe('Resource pages built from dropdowns', () => {
  it.each(DROPDOWN_PAGES)(
    '%s opts into structured rendering, without which lists lose their bullets',
    (slug) => {
      expect(content(slug).frontMatter.structured).toBe(true)
    }
  )

  it.each(DROPDOWN_PAGES)(
    '%s never numbers a bullet by hand, which renders two markers',
    (slug) => {
      expect(content(slug).content).not.toMatch(/^\s*[-*] \d+\. /m)
    }
  )
})

describe('Online Tools entries', () => {
  const lines = content('OnlineTools').content.split('\n')
  const entries = lines.filter((line) => line.includes('](http'))

  it('has entries to check', () => {
    expect(entries.length).toBeGreaterThan(50)
  })

  it('puts every link in a bullet, linking the name and leaving the description as text', () => {
    const malformed = entries.filter(
      (line) => !/^- \[\*\*[^*\]]+\*\*\]\([^)\s]+\)( - \S.*)?$/.test(line)
    )
    expect(malformed).toEqual([])
  })

  it('keeps each dropdown a single tight list, with no blank line splitting it', () => {
    const splits = lines.filter(
      (line, i) =>
        line === '' &&
        lines[i - 1]?.startsWith('- [') &&
        lines[i + 1]?.startsWith('- [')
    )
    expect(splits).toEqual([])
  })
})
