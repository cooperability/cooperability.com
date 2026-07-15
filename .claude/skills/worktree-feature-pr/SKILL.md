---
name: worktree-feature-pr
description: >-
  Create a git worktree and new feature branch so local dirty diffs or stashes
  stay untouched, then commit, push, and open a PR from that worktree. Use when
  the user wants an isolated worktree, not to disturb WIP, or to PR from a clean
  checkout beside the current workspace.
---

# Worktree → Feature Branch → PR

Ship work from a **new worktree** so the primary checkout’s uncommitted diff/stash remains undisturbed.

## When to use

- Working tree is dirty / has a stash you must not touch
- Need a parallel branch without `git stash` gymnastics
- User asks for worktree isolation

## 1. Snapshot primary state (read-only)

```bash
PRIMARY=$(pwd)
git rev-parse --show-toplevel
git status -sb
git branch --show-current
git fetch origin
```

Do **not** stash, reset, or checkout away from dirty files unless the user explicitly allows it.

## 2. Create worktree + branch

Pick names:

- Branch: `feature/<slug>` or user-provided
- Path: sibling of repo root, e.g. `../<repo>-<slug>` (avoid nesting inside the main worktree)

```bash
ROOT=$(git rev-parse --show-toplevel)
REPO=$(basename "$ROOT")
BASE=main   # or default branch: gh repo view --json defaultBranchRef -q .defaultBranchRef.name
SLUG=<slug>
BRANCH=feature/$SLUG
WT="$(dirname "$ROOT")/${REPO}-${SLUG}"

git worktree add -b "$BRANCH" "$WT" "origin/$BASE"
```

If the branch already exists: `git worktree add "$WT" "$BRANCH"`.

## 3. Do the work in the worktree

```bash
cd "$WT"
# edit / copy only the intended changes into this tree
# run tests via .claude/cli/test/COMMANDS.md
```

- Commit **only** when the user asked to commit (or clearly asked to open a PR, which implies commit).
- Follow repo commit-message style; no secrets.
- Keep the primary `$PRIMARY` directory unchanged.

## 4. Push and open PR

```bash
git push -u origin HEAD
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- <1-3 bullets>

## Test plan
- [ ] <checks>

EOF
)"
```

Return the PR URL.

## 5. Cleanup (only if asked)

```bash
cd "$PRIMARY"
git worktree remove "$WT"
# if branch fully merged and user wants:
# git branch -d "$BRANCH"
```

List with `git worktree list` before removing. Never remove a worktree with uncommitted work unless the user confirms.

## Rules

- Do not disturb the original worktree’s index, WIP, or stash.
- Do not force-push to default branches.
- Prefer worktrees over stashing when the user said “don’t disturb local diff.”
