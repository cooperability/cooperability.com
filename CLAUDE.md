# CLAUDE.md: cooperability.com

Next.js 16 portfolio (App Router under `src/app`), React 19, Vercel, pnpm 11, Node 22.

Start at [README.md](README.md): it carries the systems diagrams and links every
other doc. [docs/Roadmap.md](docs/Roadmap.md) is what is still outstanding.

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

`pnpm test` is the non-interactive run and is safe in agent sessions. The watcher is `pnpm test:watch`. Never run that one unattended.

Package manager is **pnpm 11**. Do not switch to npm or yarn.

All pnpm configuration lives in `pnpm-workspace.yaml`. `.npmrc` is auth and registry only in pnpm 11. The `pnpm` field in `package.json` is ignored. Settings placed in the wrong file are ignored silently. See [docs/PNPM-MIGRATION.md](docs/PNPM-MIGRATION.md).

## Architecture (quick)

- App routes: `src/app/` (App Router). There is no `src/pages/`
- Route chrome: `src/sections/` (Header, Sidebar, Footer), composed in `src/app/layout.tsx`
- UI / demos: `src/components/` (opioid converter, prompt composer, mandelbrot explorer)
- Content: `src/resources/**/*.mdx`, read by `src/lib/resources.ts`
- Shared libs: `src/lib/`, hooks in `src/hooks/` (also legacy root `components/ui` and `lib/`, but prefer `src/`)
- Docs: [README.md](README.md) indexes all of `docs/`
- Agent skills / CLI / subagents: `.claude/` and `.cursor/`

App Router has sharp edges this repo has already hit (metadata does not deep-merge, `generateStaticParams` needs `dynamicParams = false`, `next/dynamic` with `ssr: false` is illegal in a server component). Read [docs/App-Router.md](docs/App-Router.md) before touching routing or metadata.

## Conventions

- Match existing TypeScript, Tailwind, and shadcn/Radix patterns
- Prefer semantic queries in tests (`getByRole`, etc.)
- No drive-by refactors, and no new deps without asking
- Do not commit secrets, and do not weaken CI/tests to go green
- Line endings: repo uses LF (`.gitattributes`). On Windows, `core.autocrlf=true` is fine
- CI (`.github/workflows/ci.yml`) gates every PR on lint, typecheck, tests and a production build, plus a second job that reproduces Vercel's install shape. Run the first four locally before pushing
- Documentation belongs in `docs/`, linked from the README index. Keep the root README to the diagrams, tooling, dependencies and that index

## Skills & agents

- Skills: `.claude/skills/*/SKILL.md`, currently just `run-automated-tests`
- Subagents: `.claude/agents/*.md`: `a11y-auditor`, `frontend-reviewer`, `security-auditor`, `test-engineer`
- Command catalogs: `.claude/cli/{accessibility,quality,test}/COMMANDS.md`
- Index: `AGENTS.md`. Note that `next dev` rewrites it on every run, so an unrelated `M AGENTS.md` is that, not your change

When a skill matches the user request, read and follow it.

### Shared vs. project-local skills

Everything under `.claude/` and `.cursor/` in this repo is **project-local** and safe to edit here: `cli/**/COMMANDS.md` (the `pnpm` commands), all four agents, `.cursor/rules/*.mdc`, and `run-automated-tests`. They stay local precisely because they hardcode this stack. Keep stack-specific commands out of anything shared.

The shared git/GitHub workflow skills are **no longer vendored here.** They install once into your home directory from [claugmentations](https://github.com/cooperability/claugmentations) and load in every repo, so this repo has nothing to sync, check, or keep in step: no `.claugmentations.json`, no CI job. To change one, edit it upstream in `claugmentations/templates/claude/` and re-run that package's installer. Never copy one back into this repo: a local copy would shadow the installed skill and silently go stale.
