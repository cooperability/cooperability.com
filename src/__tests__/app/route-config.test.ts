import fs from 'fs'
import path from 'path'

/**
 * Route-level config that has no other surface to assert on. `revalidate`,
 * `themeColor` and the canonical host are all single lines that change how the
 * whole site is served, and nothing else in the suite would notice them moving.
 */

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('canonical host', () => {
  // The apex 308s to www at the Vercel domain layer, so www is what every
  // canonical link, share card and sitemap entry must claim. Three files name
  // the host independently; before this PR they disagreed, and nothing but
  // this test stops them drifting apart again.
  const FILES = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'next-sitemap.config.js',
  ]

  it.each(FILES)('%s names the site host', (file) => {
    expect(read(file)).toMatch(/https:\/\/(www\.)?cooperability\.com/)
  })

  it('uses one origin across metadata, structured data and the sitemap', () => {
    const origins = new Set(
      FILES.flatMap((file) =>
        [...read(file).matchAll(/https:\/\/(?:www\.)?cooperability\.com/g)].map(
          (match) => match[0]
        )
      )
    )
    expect([...origins]).toEqual(['https://www.cooperability.com'])
  })
})

describe('/demos', () => {
  it('declares no revalidate window', async () => {
    // The page fetches nothing. `export const revalidate = 86400` made it an
    // ISR route that re-rendered identical HTML once a day for no gain.
    const page = await import('../../app/demos/page')
    expect((page as Record<string, unknown>).revalidate).toBeUndefined()
  })
})

describe('root layout viewport', () => {
  it('gives the browser chrome a colour for each scheme', async () => {
    // A lone '#ffffff' painted the chrome white behind the dark theme.
    const { viewport } = await import('../../app/layout')
    expect(Array.isArray(viewport.themeColor)).toBe(true)

    const entries = viewport.themeColor as Array<{
      media: string
      color: string
    }>
    expect(entries.map((entry) => entry.media)).toEqual([
      '(prefers-color-scheme: light)',
      '(prefers-color-scheme: dark)',
    ])
    expect(new Set(entries.map((entry) => entry.color)).size).toBe(2)
  })
})
