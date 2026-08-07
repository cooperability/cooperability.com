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

Most of `skills/` is vendored from [claugmentations](https://github.com/cooperability/claugmentations) — see `../.claugmentations.json` for the exact list, and CLAUDE.md for why those must be edited upstream rather than here. `agents/`, `cli/`, `rules/`, and `skills/run-automated-tests/` are project-local.
