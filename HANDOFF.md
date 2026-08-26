# Handoff — cooperability.com @ chore/pnpm-migration

2026-08-26T01:39 local · window resets ~06:10 · run ends 07:30
`GUARD OK  5h 12%/92  wk 63%/80  headroom 80  reset 271m` — weekly is the
binding constraint (17 points), not the window.

## Next — take the top item

1. Add `.github/workflows/ci.yml`: lint + typecheck + test + build on PR,
   pnpm/action-setup with the pinned version, `pnpm install --frozen-lockfile`,
   store cached via actions/setup-node `cache: pnpm`. The repo has NO such
   workflow today; `security-audit.yml` is the only one and audits deps only.
2. Fix the lint stack. `pnpm lint` throws
   `TypeError: Class extends value undefined` because typescript-eslint 8.35.1
   predates ESLint 10. Bump typescript-eslint and eslint-config-next (pinned at
   ^15.4.8 while next is 16.x — a major behind). Also drop `--ext`, removed in
   ESLint 9 flat config.
3. Fix `src/__tests__/pages/index.test.tsx:65`. It asserts a link named
   /learnings/i; `src/pages/index.tsx:104` renders "knowledge". Copy changed,
   test never updated. Separate commit — this is pre-existing, not migration.
4. Fold in the 20 open Dependabot PRs' upgrades (user chose this explicitly).
   Beware `minimumReleaseAge: 1440` — pnpm 11 refuses to resolve packages
   published in the last 24h. Highest risk: tailwindcss 3→4 (#214),
   next 16.2.6→16.2.11 (#254), tar 6→7 (#229).
5. Measure build perf both sides: Turbopack (Next 16 default) vs
   `next build --webpack`. Baseline recorded: full pnpm build = 12.5s.
6. Write `docs/PNPM-MIGRATION.md` (the teaching deliverable) and sweep the ~40
   tracked files referencing yarn commands (`git grep -l yarn`).
7. Publish/refresh the dashboard Artifact. Same URL all run.

## In flight when this was written — TREAT AS NOT DONE

- Nothing dispatched. Verify against `git log` before redoing anything.

## Done this run

- `dd651c9` chore(build): migrate from Yarn 4 PnP to pnpm 11. Pure mechanism
  swap via `pnpm import`; zero version changes. 1417 files, -46330 lines.
  Verified: install 14.9s cold, typecheck clean, full build 12.5s.

## Standing constraints — do not violate

- **Draft PRs only.** Never merge, never mark ready, never request review,
  never @mention, never add reviewers.
- **Never `git add -A`.** Stage explicit paths. Other sessions share this repo.
- Work ONLY in the worktree `cooperability.com-pnpm` on branch
  `chore/pnpm-migration`. Never touch `main`, and never touch the sibling
  worktree `cooperability.com` — that is the human's checkout, currently on
  `feat/app-router-migration` (open draft PR #267).
- Do not close the 20 open Dependabot PRs. Closing them is the human's call.
- No history rewrite. The `.yarn/cache` blobs stay in history; the runbook for
  removing them is documentation only.
- `HANDOFF.md` is committed with the work; the run doc is not.
- Never run `pnpm test:watch` (interactive).

## For the human

- `pnpm lint` and one Jest test were ALREADY broken on `main` before this
  migration. Verified by running `yarn lint` on your existing worktree — it
  fails there too, with the same class of error. Nothing caught it because CI
  never ran lint or tests.
- Deliberately NOT decided here: whether to keep `chromedriver` allowlisted
  for install-time script execution. It is dev-only, downloads a browser
  driver on every clean install, and is used solely by `pnpm access`.
