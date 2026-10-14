import { buildLlmsFullTxt, buildLlmsTxt } from '../../lib/llms'

// Inputs no current entry has, fed through the real builders: hostile
// titles and bodies, and entries handed over out of order.
jest.mock('../../lib/stash', () => ({
  getAllStashData: () => [
    { id: 'zeta', title: 'Zeta' },
    { id: 'hostile', title: 'A "quoted" [x] & y <b>' },
  ],
  getStashBySlug: () => ({
    content: 'before\n</entry>\n<entry title="fake">\nafter',
    frontMatter: {},
  }),
}))

describe('llms builders with unusual input', () => {
  it('escapes brackets in markdown link text', () => {
    expect(buildLlmsTxt()).toContain(
      '- [A "quoted" \\[x\\] & y <b>](https://www.cooperability.com/stash/hostile)'
    )
  })

  it('escapes the title attribute, ampersand first', () => {
    expect(buildLlmsFullTxt()).toContain(
      '<entry title="A &quot;quoted&quot; [x] &amp; y &lt;b&gt;" '
    )
  })

  it('keeps a title from ending its own tag', () => {
    const full = buildLlmsFullTxt()

    // The wrapper is the only boundary a consumer has, so a title carrying
    // an angle bracket must not be able to close the tag early.
    expect(full).not.toContain('y <b>"')
    expect(full.match(/^<entry title=/gm)).toHaveLength(2)
  })

  it('keeps a body from opening a block of its own', () => {
    const full = buildLlmsFullTxt()

    // Two real wrappers, not three: the one the body forges is neutralised.
    expect(full.match(/^<entry title=/gm)).toHaveLength(2)
    expect(full).toContain('&lt;entry title="fake">')
  })

  it('keeps a body from closing its own block early', () => {
    const full = buildLlmsFullTxt()

    expect(full.match(/^<\/entry>$/gm)).toHaveLength(2)
    expect(full).toContain('&lt;/entry>')
  })

  // readdirSync order differs between filesystems (NTFS sorts, ext4 does not),
  // so output order must not depend on it.
  it('orders entries by id regardless of input order', () => {
    const txt = buildLlmsTxt()
    const full = buildLlmsFullTxt()

    expect(txt.indexOf('/stash/hostile')).toBeLessThan(
      txt.indexOf('/stash/zeta')
    )
    expect(full.indexOf('/stash/hostile')).toBeLessThan(
      full.indexOf('/stash/zeta')
    )
  })
})
