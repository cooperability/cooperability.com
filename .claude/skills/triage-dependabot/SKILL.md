---
name: triage-dependabot
description: >-
  Triage all open Dependabot alerts on a GitHub repository and resolve them with
  one clean package-bump PR. Use when the user mentions Dependabot, dependency
  alerts, security advisories for deps, or asks to bump packages to clear alerts.
---

# Triage Dependabot

Resolve every open Dependabot alert for the current repo in a single, reviewable PR. Prefer GitHub MCP tools if available; otherwise use `gh`.

## Preconditions

- Working tree should be clean (or stash first). Ask before discarding local work.
- Confirm remote repo: `gh repo view --json nameWithOwner -q .nameWithOwner`
- Prefer a fresh branch from the default base: `dependabot/triage-<YYYYMMDD>`

## 1. Inventory alerts

Via GitHub MCP (preferred) or:

```bash
gh api "repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100" --paginate
```

Collect per alert: `number`, `severity`, `package.name`, `ecosystem`, `vulnerable_version_range`, `first_patched_version` (if any), `dependency.manifest_path`, `security_advisory.ghsa_id` / CVE.

If paginated or truncated, keep fetching until complete. Also list open Dependabot PRs (`gh pr list --label dependencies`) so you do not duplicate work—close or supersede them in the final PR description.

## 2. Plan one bump set

Group alerts by ecosystem + manifest (`package.json`, `Cargo.toml`, `go.mod`, `requirements*.txt`, `Gemfile`, etc.).

For each group:

1. Choose the **minimum version that clears all alerts** for that package (usually `first_patched_version`, or the lowest safe range that satisfies every advisory).
2. Prefer one coordinated bump pass over many micro-PRs.
3. Note breaking majors separately; still include them if required to clear alerts, and call them out in the PR.
4. Skip alerts that are false positives only if the advisory clearly does not apply (unused optional peer, wrong platform)—document the skip with evidence.

Output a short plan before editing:

| Package | Manifest | From → To | Alerts closed | Risk |
|---------|----------|-----------|---------------|------|

Wait for user approval only if a major bump or lockfile-wide upgrade is required and the user has not already asked to “fix them all.”

## 3. Apply bumps cleanly

- Edit manifests with the package manager’s native commands when possible (`npm/pnpm/yarn`, `cargo update -p`, `go get`, `pip`/`uv`, `bundle update`, etc.) so lockfiles stay consistent.
- Do not hand-edit lockfiles unless the ecosystem has no alternative.
- One commit theme: dependency security bumps only—no drive-by refactors.
- Run the repo’s install + lint/test/typecheck scripts that already exist. Fix breakages caused by the bumps; do not weaken tests or CI to pass.

## 4. Verify alerts will clear

- Re-check that every targeted package version is outside each vulnerable range.
- Optionally: `npm audit` / `pnpm audit` / equivalent after the bump.
- Do not claim GitHub alerts are closed until the PR is merged (alerts close on default-branch presence).

## 5. Open one PR

```bash
gh pr create --title "chore(deps): resolve Dependabot alerts" --body "$(cat <<'EOF'
## Summary
- Resolves open Dependabot alerts in one bump pass
- <N> alerts across <M> packages / ecosystems

## Alerts addressed
| GHSA/CVE | Package | Severity | Bump |

## Test plan
- [ ] Install/lockfile refresh succeeds
- [ ] Existing CI / test script passes
- [ ] No unrelated dependency churn beyond what advisories require

EOF
)"
```

## Rules

- Never force-push to `main`/`master`. Never commit secrets.
- Do not disable Dependabot or ignore advisories to “clear” the queue.
- If an alert cannot be fixed yet (no patch, blocked peer dep), leave it open, document blocker in the PR, and still ship fixes for everything else.
