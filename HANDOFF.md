# Handoff — cooperability.com @ chore/pnpm-migration

2026-08-26T02:56 local · run ends 07:30
`GUARD WARN  5h 76%/92  wk 70%/80  headroom 16` — weekly is the binding
constraint and does NOT reset tonight. Descoped to consolidation only.

Draft PR: **#268**, 16 commits. CI and the audit workflow both pass.
**Vercel preview deploys fail and are parked.**

## Next — take the top item

1. **Get the Vercel build log.** It is the only thing blocking the PR.
   `npx vercel login && npx vercel inspect <deployment-url> --logs`
   Four hypotheses were each tested by pushing them ALONE and all four were
   wrong (listed below). Do not guess a fifth time.
2. **Pin the NaN coercion path.** `handleDoseChange` does `Number(value)` on a
   `type="text"` input, so typing a letter renders
   "Morphine Equivalence: NaN mg". `"0x10"` is accepted as 16 and `"5e3"` as
   5000. `value={med.dailyDose || ''}` then silently blanks the field because
   NaN is falsy. Pre-existing, untested, and it is the one place user garbage
   enters the calculator.
3. **Two contradictory drug tables.** `OPIOID_OPTIONS` in
   `utils/calculations.ts` has ZERO production callers, and it disagrees with
   the component's `MEDICATION_ARRAY`: hydromorphone 5 vs 4, fentanyl 100 vs
   Duragesic 2.4. Six of the 18 tests pin this dead code. Either delete it or
   make it the single source — do not leave two disagreeing potency tables in
   a clinical calculator.
4. **Strengthen three weak assertions** flagged by review:
   `exposes a factor for every listed opioid` passes under an empty function
   body; `is a no-op when input and output are the same drug` cancels the
   factor so it cannot detect a wrong one; `returns zero when every dose is
   zero` is subsumed by the empty-list test.
5. Set a `coverageThreshold` in `jest.config.js`. Coverage is now honest
   (13.47%) but still cannot fail the build.
6. Consider `hoistPattern: []` to restore full PnP-strict parity — needs its
   own verification pass, see docs/PNPM-MIGRATION.md §2.

## In flight when this was written — TREAT AS NOT DONE

- Nothing. The adversarial review completed and its findings are either fixed
  in `ff3da19` or listed above.

## Done this run

- `dd651c9` Yarn 4 PnP → pnpm 11. Mechanism only, zero version changes.
- `4cda87f` Restore a working ESLint run (three stacked faults).
- `0202086` Fix a test asserting copy that had been rewritten.
- `f4f441e` CI: lint + types + tests + build on every PR.
- `083c661` Fold in the Dependabot upgrades.
- 4 commits: single-variable Vercel attempts, all rejected.
- `35c53df` Rewrite the toolchain docs; add `docs/PNPM-MIGRATION.md`.
- `ff861f8` Pin the dosing arithmetic with characterisation tests, then
  replace state+effect with `useMemo`.
- `ff3da19` Act on the adversarial review: advisories 5 → **0**, fix a
  pre-commit hook that reported success for untested changes, make coverage
  honest, stop CI cancelling runs on main, commit two missed doc files, and
  correct three overstated claims.

## Vercel — PARKED, needs the human

`main` and PR #267 deploy fine; every commit on this branch fails. GitHub
Actions runs the same install and production build on ubuntu and passes in
~50s, so it is specific to the Vercel environment. No Vercel CLI or token
exists in this environment, so the build log could not be read.

Rejected, each pushed alone: (1) corepack not enabled — restored
`ENABLE_EXPERIMENTAL_COREPACK=1`; (2) `engines.node` semver range — back to
`"22.x"`; (3) `pnpm-workspace.yaml` `packages: [.]` monorepo signal — removed;
(4) Turbopack — pinned `--webpack`, reverted after it made no difference.
Changes 1–3 are correct regardless and were kept.

## Standing constraints — do not violate

- **Draft PRs only.** Never merge, mark ready, request review, @mention, or
  add reviewers.
- **Never `git add -A`.** Stage explicit paths; other sessions share this repo.
- Work ONLY in the worktree `cooperability.com-pnpm` on branch
  `chore/pnpm-migration`. Never touch `main`, and never touch the sibling
  worktree `cooperability.com` — the human's checkout, on
  `feat/app-router-migration` (open draft PR #267).
- Do not close the 20 open Dependabot PRs. That is the human's call.
- No history rewrite. The runbook in `docs/PNPM-MIGRATION.md` §9 is
  documentation only.
- Never run `pnpm test:watch` (interactive). `pnpm test` is safe.
- Do not refactor UI behaviour unattended without tests.
- `pnpm build` rewrites `next-env.d.ts`, `tsconfig.json` (with CRLF) and
  `public/sw.js`. Revert that churn rather than committing it.

## For the human

- **The headline is not the migration.** `pnpm lint` crashed, a test failed,
  and coverage had never run — all pre-existing on `main`, because the only CI
  workflow audited dependencies.
- **An adversarial review caught me in three wrong claims,** all now corrected
  in the docs rather than quietly patched: advisories were fixable (they are
  now all fixed), the mutation evidence was overstated 4x, and phantom-import
  parity with PnP strict is partial, not complete.
- **ESLint was downgraded 10 → 9 deliberately** — `eslint-plugin-react` has no
  ESLint 10 support at all.
- **Turbopack is a trade:** 2.4x faster build, +25 KB gzipped. Measured both
  sides.
- **tailwindcss 3 → 4 (#214) was deliberately not folded in.**
