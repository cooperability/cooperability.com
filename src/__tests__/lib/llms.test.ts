import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import { DEMOS, buildLlmsFullTxt, buildLlmsTxt } from '../../lib/llms'

// Real files on purpose: these tests exist to catch llms.txt drifting from the
// pages and MDX the site actually serves.
const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

const SITE = 'https://www.cooperability.com'

const resources = fs
  .readdirSync(path.join(process.cwd(), 'src/resources'))
  .filter((name) => /\.mdx?$/.test(name))
  .map((name) => {
    const raw = read(`src/resources/${name}`)
    return {
      id: name.replace(/\.mdx?$/, ''),
      raw,
      title: matter(raw).data.title as string,
      body: matter(raw).content.trim(),
    }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const demoHrefs = [
  ...read('src/app/demos/page.tsx').matchAll(/href="(\/demos\/[^"]+)"/g),
].map((match) => match[1])

// Splits llms.txt into its H2 sections so each assertion reads one section.
function sections(txt: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  let current: string[] | undefined
  for (const line of txt.split('\n')) {
    const heading = line.match(/^## (.+)$/)
    if (heading) map.set(heading[1], (current = []))
    else if (current && line !== '') current.push(line)
  }
  return map
}

describe('llms.txt demos', () => {
  it.each(DEMOS)('$path has a page whose description matches', (demo) => {
    expect(read(`src/app${demo.path}/page.tsx`)).toContain(demo.description)
  })
})

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt()
  const parsed = sections(txt)

  it('opens with the H1 and blockquote summary the format requires', () => {
    const [h1, blank, summary] = txt.split('\n')
    expect(h1).toMatch(/^# \S/)
    expect(blank).toBe('')
    expect(summary).toMatch(/^> \S/)
  })

  it('has exactly the Demos and Resources sections, in that order', () => {
    expect([...parsed.keys()]).toEqual(['Demos', 'Resources'])
  })

  it('lists every demo the /demos page links to, with its page description', () => {
    const items = parsed.get('Demos')!.map((line) => {
      const match = line.match(/^- \[[^\]]+\]\(([^)]+)\): (.+)$/)
      expect(match).not.toBeNull()
      return { url: match![1], description: match![2] }
    })

    expect(items.map((item) => item.url).sort()).toEqual(
      demoHrefs.map((href) => `${SITE}${href}`).sort()
    )
    for (const item of items) {
      const page = read(`src/app${new URL(item.url).pathname}/page.tsx`)
      expect(page).toContain(item.description)
    }
  })

  it('lists every resource once, sorted, titled from its front matter', () => {
    const items = parsed.get('Resources')!.map((line) => {
      const match = line.match(/^- \[(.+)\]\(([^)]+)\)$/)
      expect(match).not.toBeNull()
      return { title: match![1], url: match![2] }
    })

    expect(items).toEqual(
      resources.map((r) => ({
        title: r.title,
        url: `${SITE}/resources/${r.id}`,
      }))
    )
  })

  it('points at a full-text file that has a route', () => {
    const url = txt.match(/https:\/\/\S+llms[^\s]*\.txt/)?.[0]
    expect(url).toBeDefined()
    const route = `src/app${new URL(url!).pathname}/route.ts`
    expect(fs.existsSync(path.join(process.cwd(), route))).toBe(true)
  })
})

describe('buildLlmsFullTxt', () => {
  const full = buildLlmsFullTxt()
  const blocks = [
    ...full.matchAll(
      /^<resource title="([^"]*)" source="([^"]+)">\n([\s\S]*?)\n<\/resource>$/gm
    ),
  ].map((match) => ({ title: match[1], source: match[2], body: match[3] }))

  it('holds one block per resource, sorted, each body exactly its file body', () => {
    expect(blocks).toEqual(
      resources.map((r) => ({
        title: r.title,
        source: `${SITE}/resources/${r.id}`,
        body: r.body,
      }))
    )
  })

  it.each(resources)('does not leak the front matter of $id', (resource) => {
    // Read raw rather than via gray-matter, whose parse cache hands back an
    // empty `.matter` for a string it has already seen.
    const frontMatter = resource.raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
    expect(frontMatter).toContain('title:')
    expect(full).not.toContain(frontMatter)
  })
})
