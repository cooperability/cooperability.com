# Agents & AI infrastructure

This repo ships parallel Cursor and Claude Code configs so either tool can use the same workflows.

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Project brief for Claude Code (commands, layout, conventions) |
| `.claude/skills/` | Claude skills (`SKILL.md` workflows) |
| `.claude/agents/` | Claude subagent personas |
| `.claude/cli/` | Non-interactive CLI command catalogs |
| `.cursor/skills/` | Cursor skills (mirrors `.claude/skills/`) |
| `.cursor/agents/` | Cursor subagents (mirrors key Claude agents) |
| `.cursor/rules/` | Cursor rules (always-on / glob-scoped) |
| `.cursor/cli/` | CLI catalogs (mirrors `.claude/cli/`) |

## Skills (both trees)

Project-local — hardcodes this stack, stays in this repo:

| Skill | Use for |
|-------|---------|
| `run-automated-tests` | Jest + optional quality/a11y gates |

Shared, synced from [claugmentations](https://github.com/cooperability/claugmentations). Edit upstream, never in place — see CLAUDE.md:

| Skill | Use for |
|-------|---------|
| `shepherd-to-pr` | One-shot: scoped idea → graded, reviewed draft PR |
| `plan-feature` | Idea → intent, out-of-scope list, files, test plan |
| `verified-change-loop` | Gate commits/PRs behind independent graded review |
| `pr-reviewing` | PR review: casts, inputs, footguns, DevEx |
| `security-testing` | Repo security audit (no exploit PoCs) |
| `premerge-cleanup` | Rebase, resolve, squash, gate, confirm merge-ready |
| `worktree-feature-pr` | Isolated worktree → branch → PR |
| `update-branch-from-base` | Sync branch without squash |
| `git-hygiene` | Repo settings, branches, line endings, secrets, reflog |
| `compose-pr-description` | Diff → PR/commit title + body |
| `triage-dependabot` | Clear Dependabot alerts in one bump PR |
| `integration-hunting` | Mine GitHub stars for useful OSS |
| `extract-chat-insights` | Harvest an old chat, then clear it for deletion |

## Subagents / personas

| Agent | Use for |
|-------|---------|
| `a11y-auditor` | axe, Lighthouse, ARIA / jsx-a11y findings |
| `frontend-reviewer` | Next/React/Tailwind/MDX review for this site |
| `test-engineer` | Jest + Testing Library coverage and fixes |
| `security-auditor` | Authz, injection, secrets, unsafe defaults |

## CLI catalogs

- `cli/test/` — Jest
- `cli/accessibility/` — lint a11y, axe, Lighthouse (`yarn access`)
- `cli/quality/` — lint, types, audit, build gates
