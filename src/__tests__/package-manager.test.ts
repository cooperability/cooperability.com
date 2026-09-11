import fs from 'node:fs'
import path from 'node:path'

const root = path.join(__dirname, '../..')

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel))
}

const COREPACK_BOOTSTRAP =
  /^corepack enable && corepack prepare (.+) --activate && pnpm install --frozen-lockfile$/

describe('pnpm 11 contract', () => {
  const pkg = JSON.parse(read('package.json')) as {
    packageManager?: string
    engines?: { yarn?: string; node?: string }
    dependenciesMeta?: unknown
    resolutions?: unknown
    scripts: Record<string, string>
    devDependencies?: Record<string, string>
  }

  it('pins pnpm 11 as the only package manager', () => {
    expect(pkg.packageManager).toMatch(/^pnpm@11\./)
    expect(pkg.engines?.yarn).toBeUndefined()
    expect(pkg.dependenciesMeta).toBeUndefined()
    expect(pkg.resolutions).toBeUndefined()
    expect(pkg.devDependencies?.['@yarnpkg/pnpify']).toBeUndefined()
  })

  it('keeps agent and CI test scripts non-interactive', () => {
    expect(pkg.scripts.test).toMatch(/watchAll=false/)
    expect(pkg.scripts['test:watch']).toMatch(/--watch/)
    expect(JSON.stringify(pkg.scripts)).not.toMatch(/yarn /)
  })

  it('drops the webpack pin from the default Next scripts, and keeps it on analyze', () => {
    expect(pkg.scripts.dev).toBe('next dev')
    expect(pkg.scripts.build).toMatch(/^next build /)
    expect(pkg.scripts.build).not.toMatch(/--webpack/)
    expect(pkg.scripts.analyze).toMatch(/--webpack/)
  })

  it('does not keep Yarn lockfiles or PnP shims', () => {
    expect(exists('yarn.lock')).toBe(false)
    expect(exists('.pnp.cjs')).toBe(false)
    expect(exists('.pnp.loader.mjs')).toBe(false)
    expect(exists('.yarnrc.yml')).toBe(false)
    expect(exists('pnpm-lock.yaml')).toBe(true)
  })

  it('stores pnpm 11 settings in pnpm-workspace.yaml', () => {
    const yaml = read('pnpm-workspace.yaml')
    expect(yaml).toMatch(/nodeLinker:\s*isolated/)
    expect(yaml).toMatch(/allowBuilds:/)
    expect(yaml).toMatch(/packages:\s*\n\s*-\s*['"]?\./)
  })

  it('bootstraps pnpm 11 on Vercel through corepack, not detection', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      installCommand: string
      buildCommand: string
      env: Record<string, string>
    }
    const match = vercel.installCommand.match(COREPACK_BOOTSTRAP)
    expect(match?.[1]).toBe(pkg.packageManager)
    expect(vercel.buildCommand).toBe('pnpm build')
    expect(vercel.env.ENABLE_EXPERIMENTAL_COREPACK).toBe('1')
    expect(vercel.env.YARN_CACHE_FOLDER).toBeUndefined()
  })

  it('runs the Vercel-shaped CI job with the same corepack command as vercel.json', () => {
    const ci = read('.github/workflows/ci.yml')
    const vercel = JSON.parse(read('vercel.json')) as { installCommand: string }
    expect(ci).not.toMatch(/run:\s*yarn\b/)
    expect(ci).toMatch(/pnpm\/action-setup/)
    expect(ci).toMatch(/name: Vercel-shaped install and build/)
    expect(ci).toContain(`run: ${vercel.installCommand}`)
    expect(vercel.installCommand).toContain(pkg.packageManager ?? '')
  })

  it('maps @/ aliases so lint-staged findRelatedTests can see tests', () => {
    const config = read('jest.config.js')
    expect(config).toMatch(/moduleNameMapper/)
    expect(config).toMatch(/\^@\/\(\.\*\)\$/)
  })

  it('does not instruct yarn as the live package manager in setup or shipped prompts', () => {
    const live = [
      'scripts/setup-env.sh',
      'src/resources/LLMPrompts.mdx',
      'docs/PROJECT-STRUCTURE.md',
      'docs/PWA.md',
      'docs/Performance.md',
      'docs/Tooling.md',
      'docs/MCP.md',
    ]
    const invocation =
      /(?:^|[\s`'"])yarn (?:install|dev|build|lint|test|access|analyze|typecheck|add|mcp:start)\b/
    for (const rel of live) {
      expect(read(rel)).not.toMatch(invocation)
    }
  })
})

describe('App Router test surface', () => {
  it('does not keep Pages Router tests that cannot run on this tree', () => {
    expect(exists('src/__tests__/pages')).toBe(false)
    expect(exists('src/pages')).toBe(false)
    expect(exists('src/__tests__/app/page.test.tsx')).toBe(true)
  })
})
