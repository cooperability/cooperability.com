# Test CLI commands (Jest)

Package manager: **pnpm 11**. Use `pnpm` (not `npm` or `yarn`).

For axe / Lighthouse / ARIA audits → [../accessibility/COMMANDS.md](../accessibility/COMMANDS.md).

## Agent default (non-interactive)

`pnpm test` is a single run (`jest --ci --watchAll=false`). Use that in agent and CI sessions.

```bash
# Full suite, single run (preferred)
pnpm test

# Allow empty suite
pnpm test --passWithNoTests

# Fail fast
pnpm test --bail

# One file / pattern
pnpm test path/to/file.test.tsx
pnpm test --testPathPattern=opioid

# Related to staged/changed files (pre-commit style)
pnpm exec jest --bail --findRelatedTests --passWithNoTests --watchAll=false --ci <file...>

# Coverage
pnpm test:ci
```

## Rendered dropdown layout (Playwright)

Jest cannot load the ESM MDX pipeline, so the LLM Prompts and Online Tools
dropdowns are checked in Playwright's Chromium. It opens every dropdown at
375px and 1280px and fails on clipped text, missing bullets or numbers,
unindented lists, flat headings and blocks with no space between them.

```bash
pnpm dropdowns            # starts `pnpm dev`, then runs the check
pnpm dropdowns:check      # against a server already on :3000 (or BASE_URL)
```

Needs a free port `3000` for `pnpm dropdowns`. Run it after touching
`src/stash/*.mdx` or the stash page's MDX components.

## Human / interactive

```bash
pnpm test:watch           # jest --watch
```

Never run `pnpm test:watch` unattended.

## Related type gates

```bash
pnpm typecheck            # tsc --noEmit
pnpm test-types           # tsc --noEmit -p tsconfig.dev.json
```

## Layout

| Path | Role |
|------|------|
| `jest.config.js` | Jest + Next.js |
| `jest.setup.js` | `@testing-library/jest-dom` |
| `src/__tests__/` | Test files |
| `lint-staged` | Runs related Jest on commit |

## Discover in any local project

1. Read root scripts / Makefile / CI workflows.
2. Prefer CI runners: `jest --ci --watchAll=false`, `vitest run`, `pytest`, etc.
3. Never start watch/TUI modes unless the user asks.
