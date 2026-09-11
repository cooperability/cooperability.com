import fs from 'fs'
import { getAllResourcesData, getResourceBySlug } from '../../lib/resources'

jest.mock('fs')
const mockedFs = jest.mocked(fs)

/**
 * The loader enumerated every entry in src/resources and stripped `.mdx?` for
 * the id, then looked the file back up as `${slug}.mdx`. A `.md` resource
 * listed fine and then threw ENOENT at read time, and a stray non-content file
 * threw during enumeration. Both are build-time crashes on a static route.
 */

const CONTENT: Record<string, string> = {
  'alpha.mdx': '---\ntitle: Alpha\n---\nalpha body',
  'beta.md': '---\ntitle: Beta\n---\nbeta body',
}

function openedPaths(): string[] {
  return mockedFs.readFileSync.mock.calls.map((call) => String(call[0]))
}

beforeEach(() => {
  jest.clearAllMocks()

  mockedFs.readdirSync.mockReturnValue([
    'alpha.mdx',
    'beta.md',
    'notes.txt',
    '.DS_Store',
  ] as never)

  mockedFs.readFileSync.mockImplementation((filePath) => {
    const fileName = Object.keys(CONTENT).find((name) =>
      String(filePath).endsWith(name)
    )
    if (!fileName) {
      throw Object.assign(new Error(`ENOENT: ${filePath}`), { code: 'ENOENT' })
    }
    return CONTENT[fileName]
  })
})

describe('getAllResourcesData', () => {
  it('enumerates .md alongside .mdx', () => {
    const ids = getAllResourcesData().map((resource) => resource.id)
    expect(ids.sort()).toEqual(['alpha', 'beta'])
  })

  it('never opens a file that is not .md or .mdx', () => {
    getAllResourcesData()
    expect(openedPaths().some((p) => p.endsWith('notes.txt'))).toBe(false)
    expect(openedPaths().some((p) => p.endsWith('.DS_Store'))).toBe(false)
  })
})

describe('getResourceBySlug', () => {
  it('reads a .md resource at its real extension', () => {
    // The whole finding: this used to build the path as `beta.mdx`.
    expect(getResourceBySlug('beta')?.content.trim()).toBe('beta body')
  })

  it('still reads a .mdx resource', () => {
    expect(getResourceBySlug('alpha')?.content.trim()).toBe('alpha body')
  })

  it('returns null for an unknown slug without touching the disk', () => {
    expect(getResourceBySlug('nope')).toBeNull()
    expect(mockedFs.readFileSync).not.toHaveBeenCalled()
  })

  it('returns null for a traversal attempt', () => {
    expect(getResourceBySlug('../../../package')).toBeNull()
    expect(getResourceBySlug('../secrets')).toBeNull()
    expect(mockedFs.readFileSync).not.toHaveBeenCalled()
  })
})
