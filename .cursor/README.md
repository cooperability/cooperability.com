# Cursor project config

| Path | Role |
|------|------|
| [../CLAUDE.md](../CLAUDE.md) | Shared project brief |
| [../AGENTS.md](../AGENTS.md) | Full skill / agent index |
| [skills/](skills/) | Invokable workflows |
| [agents/](agents/) | Subagent personas |
| [rules/](rules/) | Always-on / glob Cursor rules |
| [cli/](cli/) | Jest / a11y / quality command catalogs |

Mirror of skills/cli/agents also lives under `.claude/` for Claude Code.

Everything here is project-local and safe to edit: `agents/`, `cli/`, `rules/`, and `skills/run-automated-tests/`. The shared workflow skills that used to be vendored into `skills/` are installed into your home directory from [claugmentations](https://github.com/cooperability/claugmentations) instead, so they load in every repo and none of them live here — see CLAUDE.md.
