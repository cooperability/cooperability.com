# CLAUDE.md — cooperability.com

Next.js portfolio (Pages Router under `src/pages`), Vercel, pnpm 11, Node 22.

## Commands agents should use

Prefer catalogs in `.claude/cli/` (mirrored under `.cursor/cli/`).

| Task                         | Command                                  |
| ---------------------------- | ---------------------------------------- |
| Dev server                   | `pnpm dev`                               |
| Lint (incl. jsx-a11y)        | `pnpm lint`                              |
| Types                        | `pnpm typecheck`                         |
| Unit tests (non-interactive) | `pnpm test`                              |
| Unit tests + coverage        | `pnpm test:ci`                           |
| A11y (axe + Lighthouse)      | `pnpm access`                            |
| Security audit               | `pnpm audit:critical`                    |
| Format                       | `pnpm format` (ask before huge rewrites) |

`pnpm test` is now the non-interactive run and is safe in agent sessions. The
watcher moved to `pnpm test:watch` — **never** run that one unattended.

Package manager is **pnpm 11**. Do not switch to npm or yarn.

All pnpm configuration lives in `pnpm-workspace.yaml` — not `.npmrc` (auth and
registry only in pnpm 11) and not `package.json` (its `pnpm` field is ignored).
Settings placed in the wrong file are ignored **silently**. See
`docs/PNPM-MIGRATION.md`.

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

### Shared vs. project-local skills

Everything under `.claude/` and `.cursor/` in this repo is **project-local** and safe to edit here: `cli/**/COMMANDS.md` (the `pnpm` commands), all four agents, `.cursor/rules/*.mdc`, and `run-automated-tests`. They stay local precisely because they hardcode this stack — keep stack-specific commands out of anything shared.

The shared git/GitHub workflow skills are **no longer vendored here.** They install once into your home directory from [claugmentations](https://github.com/cooperability/claugmentations) and load in every repo, so this repo has nothing to sync, check, or keep in step — no `.claugmentations.json`, no CI job. To change one, edit it upstream in `claugmentations/templates/claude/` and re-run that package's installer. Never copy one back into this repo: a local copy would shadow the installed skill and silently go stale.
