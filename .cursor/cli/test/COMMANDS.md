# Test CLI commands (Jest)

Package manager: **Yarn 4 (PnP)**. Use `yarn` (not `npm`).

For axe / Lighthouse / ARIA audits → [../accessibility/COMMANDS.md](../accessibility/COMMANDS.md).

## Agent default (non-interactive)

`yarn test` is **watch mode** — do **not** use it in agent/CI sessions.

```bash
# Full suite, single run (preferred)
yarn jest --ci --watchAll=false

# Allow empty suite
yarn jest --ci --watchAll=false --passWithNoTests

# Fail fast
yarn jest --ci --watchAll=false --bail

# One file / pattern
yarn jest --ci --watchAll=false path/to/file.test.tsx
yarn jest --ci --watchAll=false --testPathPattern=opioid

# Related to staged/changed files (pre-commit style)
yarn jest --bail --findRelatedTests --passWithNoTests --watchAll=false --ci <file...>

# Coverage
yarn jest --ci --watchAll=false --coverage
```

## Human / interactive

```bash
yarn test                 # jest --watch
```

## Related type gates

```bash
yarn typecheck            # tsc --noEmit
yarn test-types           # tsc --noEmit -p tsconfig.dev.json
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
