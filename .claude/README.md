# Claude Code project config

| Path | Role |
|------|------|
| [../CLAUDE.md](../CLAUDE.md) | Project brief (commands, architecture) |
| [../AGENTS.md](../AGENTS.md) | Full skill / agent index |
| [skills/](skills/) | Invokable workflows |
| [agents/](agents/) | Subagent personas |
| [cli/](cli/) | Jest / a11y / quality command catalogs |

Mirror of most workflows also lives under `.cursor/` for Cursor.

Most of `skills/` is vendored from [claugmentations](https://github.com/cooperability/claugmentations) — see `../.claugmentations.json` for the exact list, and CLAUDE.md for why those must be edited upstream rather than here. `agents/`, `cli/`, and `skills/run-automated-tests/` are project-local.
