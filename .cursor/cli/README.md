# Agent CLI directories

Machine-readable command catalogs for agents working in this repo.

| Directory | Use when |
|-----------|----------|
| [test/](test/COMMANDS.md) | Jest unit/component tests |
| [accessibility/](accessibility/COMMANDS.md) | ARIA/a11y: eslint-jsx-a11y, axe-core, Lighthouse |
| [quality/](quality/COMMANDS.md) | Lint, types, audit, build gates |

**Convention:** Prefer non-interactive flags. Never leave watch mode hanging in agent sessions.

**Any project:** If this catalog is missing or stale, discover scripts from the root package manifest (`package.json` / `pyproject.toml` / `Makefile` / `Cargo.toml`) and CI workflows under `.github/workflows/`.
