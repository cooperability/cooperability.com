# CLAUDE.md — cooperability.com

Next.js portfolio (Pages Router under `src/pages`), Vercel, Yarn 4 PnP, Node 22.

## Commands agents should use

Prefer catalogs in `.claude/cli/` (mirrored under `.cursor/cli/`).

| Task | Command |
|------|---------|
| Dev server | `yarn dev` |
| Lint (incl. jsx-a11y) | `yarn lint` |
| Types | `yarn typecheck` |
| Unit tests (non-interactive) | `yarn jest --ci --watchAll=false` |
| A11y (axe + Lighthouse) | `yarn access` |
| Security audit | `yarn audit:critical` |
| Format | `yarn format` (ask before huge rewrites) |

**Never** run `yarn test` in agent sessions — it is Jest watch mode.

Package manager is **Yarn 4 (PnP)**. Do not switch to npm/pnpm unless the user is doing that migration.

## Architecture (quick)

- App routes: `src/pages/`
- UI / demos: `src/components/` (e.g. opioid converter, prompt composer)
- Content: `src/resources/**/*.mdx`, `src/posts/`
- Shared libs: `src/lib/` (also legacy root `components/` + `lib/` — prefer `src/`)
- Tooling docs: `docs/Tooling.md`, `docs/Performance.md`
- Agent skills / CLI / subagents: `.claude/` and `.cursor/`

## Conventions

- Match existing TypeScript, Tailwind, and shadcn/Radix patterns
- Prefer semantic queries in tests (`getByRole`, etc.)
- No drive-by refactors; no new deps without asking
- Do not commit secrets; do not weaken CI/tests to go green
- Line endings: repo uses LF (`.gitattributes`). On Windows, `core.autocrlf=true` is fine

## Skills & agents

- Skills: `.claude/skills/*/SKILL.md` — workflows (Dependabot, PR review, a11y tests, git hygiene, PR copy)
- Subagents: `.claude/agents/*.md` — specialists to delegate to
- Index: `AGENTS.md`

When a skill matches the user request, read and follow it.
