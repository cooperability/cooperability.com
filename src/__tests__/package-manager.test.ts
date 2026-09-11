import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = path.join(__dirname, '../..')
const nodeRequire = createRequire(__filename)

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel))
}

/** Top-level YAML map. Skips comments and nested keys. */
function parseTopLevelMap(yaml: string, key: string): Record<string, string> {
  const lines = yaml.split('\n')
  const start = lines.findIndex((line) => line === `${key}:`)
  if (start < 0) {
    return {}
  }
  const out: Record<string, string> = {}
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\S/.test(line)) {
      break
    }
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue
    }
    const match = trimmed.match(/^('[^']+'|"[^"]+"|[A-Za-z0-9@/_.-]+):\s*(\S+)/)
    if (!match) {
      continue
    }
    out[match[1].replace(/^['"]|['"]$/g, '')] = match[2]
  }
  return out
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
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }

  it('pins pnpm 11 as the only package manager', () => {
    expect(pkg.packageManager).toMatch(/^pnpm@11\./)
    expect(pkg.engines?.yarn).toBeUndefined()
    expect(pkg.dependenciesMeta).toBeUndefined()
    expect(pkg.resolutions).toBeUndefined()
    expect(pkg.devDependencies?.['@yarnpkg/pnpify']).toBeUndefined()
    expect(pkg.devDependencies?.eslint).toMatch(/^10\./)
    expect(pkg.dependencies?.['@next/mdx']).toMatch(/^[\^~]?16\./)
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
    expect(yaml).not.toMatch(/^onlyBuiltDependencies:/m)
    expect(yaml).toMatch(/packages:\s*\n\s*-\s*['"]?\./)
  })

  it('allowlists the install scripts Next, ESLint, and access actually need', () => {
    const allowBuilds = parseTopLevelMap(
      read('pnpm-workspace.yaml'),
      'allowBuilds'
    )
    expect(allowBuilds).toEqual({
      '@swc/core': 'true',
      sharp: 'true',
      'unrs-resolver': 'true',
      chromedriver: 'true',
    })
  })

  it('pins the same overrides in the workspace file and the lockfile', () => {
    const expected = {
      punycode: '^2.3.1',
      'form-data': '^4.0.4',
      tmp: '^0.2.4',
      glob: '^10.5.0',
      'mdast-util-to-hast': '^13.2.1',
      'js-yaml': '^3.15.2',
      'test-exclude': '^7.0.2',
      socks: '^2.8.9',
      postcss: '^8.5.26',
      sharp: '^0.35.4',
      'adm-zip': '^0.6.1',
    }
    const workspace = parseTopLevelMap(read('pnpm-workspace.yaml'), 'overrides')
    const lockfile = parseTopLevelMap(read('pnpm-lock.yaml'), 'overrides')
    expect(workspace).toEqual(expected)
    expect(lockfile).toEqual(expected)
    expect(read('pnpm-workspace.yaml')).toMatch(
      /minimumReleaseAgeExclude:\n\s+-\s+adm-zip@0\.6\.1/
    )
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

  it('restricts GITHUB_TOKEN to what each workflow actually uses', () => {
    const ci = read('.github/workflows/ci.yml')
    const audit = read('.github/workflows/security-audit.yml')
    expect(ci).toMatch(/^permissions:\n {2}contents: read\n/m)
    expect(ci).not.toMatch(/actions:\s*write/)
    expect(ci).not.toMatch(/contents:\s*write/)
    expect(audit).toMatch(
      /^permissions:\n {2}contents: read\n {2}issues: write\n/m
    )
  })

  it('maps @/ aliases so findRelatedTests sees tests', () => {
    const jestBin = nodeRequire.resolve('jest/bin/jest')
    const out = execFileSync(
      process.execPath,
      [
        jestBin,
        '--listTests',
        '--findRelatedTests',
        '--watchAll=false',
        '--ci',
        'components/ui/accordion.tsx',
      ],
      { encoding: 'utf8', cwd: root, timeout: 30000 }
    )
    expect(out).toMatch(/accordion-theme\.test/)
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
      'src/app/providers.tsx',
      'src/components/prompt-composer/PROMPT-COMPOSER-README.md',
    ]
    expect(read('README.md')).not.toMatch(
      /YARN_CACHE_FOLDER` is set in `vercel\.json/
    )
    expect(read('README.md')).not.toMatch(/Why ESLint is pinned to 9\.x/)
    expect(read('README.md')).not.toMatch(/All three now pass `--webpack`/)
    expect(read('README.md')).not.toMatch(/`test` stays interactive/)
    expect(read('README.md')).not.toMatch(/only `security-audit\.yml` exists/)
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
