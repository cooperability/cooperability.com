# Test CLI commands (Jest)

Package manager: **pnpm 11**. Use `pnpm` (not `npm` or `yarn`).

For axe / Lighthouse / ARIA audits → [../accessibility/COMMANDS.md](../accessibility/COMMANDS.md).

## Agent default (non-interactive)

`pnpm test` is **watch mode** — do **not** use it in agent/CI sessions.

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
pnpm jest --bail --findRelatedTests --passWithNoTests --watchAll=false --ci <file...>

# Coverage
pnpm test --coverage
```

## Human / interactive

```bash
pnpm test                 # jest --watch
```

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
