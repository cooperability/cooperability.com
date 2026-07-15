---
name: pr-reviewing
description: >-
  Review pull requests and local diffs for deterministic TypeScript smell fixes
  (as-any, as-unknown, as-never) plus security, DevEx, footguns, and antipatterns.
  Use when the user asks to review a PR, review changes, code review, or clean up
  unsafe casts and review quality issues.
---

# PR Reviewing

Review the requested PR or local diff. Default scope: current branch vs the repo default base (merge-base). If given a PR URL/number, check out or fetch that head first.

Read-only unless the user asks you to apply fixes.

## 1. Gather the diff

```bash
gh pr view <n> --json title,body,files,baseRefName,headRefName
gh pr diff <n>
# or local:
git diff $(git merge-base HEAD origin/main)...HEAD
```

Infer the real base branch if not `main`. Skim linked issues for intent.

## 2. Deterministic pass (must run)

Search the changed lines (and adjacent context) for mechanical debt. Flag or fix-propose each hit with location:

| Pattern | Why it matters |
|---------|----------------|
| `as any` / `as unknown` / `as never` | Hides type errors; prefer correct types, generics, or narrow guards |
| `as unknown as X` double-casts | Same; treat as high-priority smell |
| `@ts-ignore` / `@ts-expect-error` without rationale | Require reason or proper typing |
| eslint-disable without scoped rule + reason | Prefer fixing the violation |
| `!` non-null assertions on uncertain values | Prefer narrowing |
| Empty `catch` / swallowed errors | At least log or rethrow with context |
| `console.log` left in production paths | Remove or gate behind debug |
| Hardcoded secrets, private URLs, prod tokens | Block merge |
| `TODO`/`FIXME` introduced without owner/issue | Note if it ships incomplete behavior |

For TypeScript cast removal: propose the smallest sound fix (type the API, add a type guard, fix the upstream return type). Do not replace `as any` with looser runtime hacks.

## 3. Abstract pass (judgment)

Prioritize issues that will hurt production or future contributors:

**Correctness & security**

- Unsanitized / unvalidated inputs at trust boundaries (HTTP, webhooks, forms, URL params)
- Authz gaps, IDOR, SSRF, XSS, injection sinks introduced or left open by the change
- Race conditions, incorrect null handling, off-by-one, broken error paths

**Footguns & antipatterns**

- Hidden global state; surprising mutation; god objects
- Leaky abstractions; copy-paste drift; premature generality
- Async hazards (missing await, floating promises, incorrect abort/cleanup)
- API shapes that invite misuse (stringly types, boolean trap params)

**DevEx**

- Unclear names; missing docs on non-obvious public APIs
- Tests absent for non-trivial logic; brittle tests that snapshot noise
- CI/config changes that weaken gates without justification
- DX papercuts: poor errors, missing `--help`, inconsistent flags

Match feedback to the project’s existing patterns—do not impose a foreign style guide.

## 4. Output format

1. **Verdict**: Approve / Approve with nits / Request changes (one line why).
2. **Blocking** — must fix before merge.
3. **Should fix** — real issues, non-blocking if user accepts risk.
4. **Nits** — style/clarity; keep short.
5. **Deterministic cleanup list** — cast/lint suppressions table (`file:line`, pattern, suggested fix).

Per finding: severity, `file:line`, what’s wrong, concrete fix. No filler praise. No repeating the PR description.

## Claude Code notes

- Use `gh` and the local diff; when GitHub MCP is available, use it for PR metadata and review comments.
- Post review comments to GitHub only if the user asks.
