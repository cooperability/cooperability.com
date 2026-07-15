---
name: run-automated-tests
description: >-
  Run the project's automated tests and related quality gates using the agent
  CLI directories. Use when the user asks to run tests, verify CI locally, check
  that a change passes, or execute Jest/unit/integration suites.
---

# Run Automated Tests

## 1. Load the command catalog

Read (in order):

1. `.cursor/cli/test/COMMANDS.md` — Jest
2. `.cursor/cli/accessibility/COMMANDS.md` — when user wants axe / Lighthouse / ARIA
3. `.cursor/cli/quality/COMMANDS.md` — lint/types/audit gates

(Use the `.claude/cli/` twin if that tree is active.) If catalogs are missing, discover from `package.json` / CI. Prefer non-interactive runners.

## 2. Choose the command

| Intent | Command (this repo) |
|--------|---------------------|
| Default Jest suite | `yarn jest --ci --watchAll=false` |
| Fail fast | add `--bail` |
| One area | path or `--testPathPattern=` |
| Related to edits | `--findRelatedTests --passWithNoTests` on touched files |
| Static ARIA / a11y | `yarn lint` |
| Full axe + Lighthouse | `yarn access` (slow; needs :3000) |
| + types/lint | see quality catalog |

**Never** run `yarn test` in an agent session (it is watch mode). Do not run `yarn access` unless a11y/Lighthouse was requested.

## 3. Execute and report

- Run from the repo root (or package root in a monorepo).
- On failure: paste the failing test names + first assertion error; fix only if the user asked.
- On success: one line — suite passed, N tests.
- Do not start long a11y/build jobs unless requested.

## 4. Optional full gate

When asked to “make sure CI would pass”:

```bash
yarn lint && yarn typecheck && yarn jest --ci --watchAll=false
```

Add `yarn audit:critical` if security is in scope.
