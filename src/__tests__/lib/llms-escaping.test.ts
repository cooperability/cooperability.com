import { buildLlmsFullTxt, buildLlmsTxt } from '../../lib/llms'

// Inputs no current resource has, fed through the real builders: hostile
// titles and bodies, and resources handed over out of order.
jest.mock('../../lib/resources', () => ({
  getAllResourcesData: () => [
    { id: 'zeta', title: 'Zeta' },
    { id: 'hostile', title: 'A "quoted" [x] & y' },
  ],
  getResourceBySlug: () => ({
    content: 'before\n</resource>\n<resource title="fake">\nafter',
    frontMatter: {},
  }),
}))

describe('llms builders with unusual input', () => {
  it('escapes brackets in markdown link text', () => {
    expect(buildLlmsTxt()).toContain(
      '- [A "quoted" \\[x\\] & y](https://www.cooperability.com/resources/hostile)'
    )
  })

  it('escapes the title attribute, ampersand first', () => {
    expect(buildLlmsFullTxt()).toContain(
      '<resource title="A &quot;quoted&quot; [x] &amp; y" '
    )
  })

  it('keeps a body from closing its own block early', () => {
    const full = buildLlmsFullTxt()

    expect(full.match(/^<\/resource>$/gm)).toHaveLength(2)
    expect(full).toContain('&lt;/resource>')
  })

  // readdirSync order differs between filesystems (NTFS sorts, ext4 does not),
  // so output order must not depend on it.
  it('orders resources by id regardless of input order', () => {
    const txt = buildLlmsTxt()
    const full = buildLlmsFullTxt()

    expect(txt.indexOf('/resources/hostile')).toBeLessThan(
      txt.indexOf('/resources/zeta')
    )
    expect(full.indexOf('/resources/hostile')).toBeLessThan(
      full.indexOf('/resources/zeta')
    )
  })
})
