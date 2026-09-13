# The Lint Gate: why ESLint 10 stays

This tree pins `eslint` at **10.10.0**. `pnpm lint` exits 0. The Yarn-era
write-up that recommended downgrading to 9.39.5 applied to an unscoped
`eslint-config-next` config. #267 scoped APP files in `eslint.config.mjs` and
kept ESLint 10. This PR does not replay the downgrade.

The rest of this section is the config work that still applies:

Two related things were fixed in the same pass, and both are worth knowing:

- **`FlatCompat` is no longer needed.** `eslint-config-next` 16 ships a native
  flat config at `eslint-config-next/core-web-vitals`. Loading it through
  `FlatCompat` instead throws `Converting circular structure to JSON`. Dropping
  the shim removed `@eslint/eslintrc` and `@eslint/compat` (the latter was never
  imported).
- **React version detection is pinned.** `eslint-config-next` sets
  `react: { version: 'detect' }`, and detection calls an ESLint API that v10
  removed. `eslint.config.mjs` now reads the installed version directly, which
  is both immune to that break and faster.

`eslint-config-prettier` also moved to the **end** of the config array. It has
to come after every config whose stylistic rules it exists to switch off.

**`pnpm access` is unblocked but still unverified.** It runs `pnpm lint` first
and used to die there, and it now gets through to `axe`. Completing it needs a
Chrome binary on `PATH`, which the agent sandbox this was fixed in did not have,
so the a11y numbers have not actually been re-measured. Run it locally, and
treat the result as a new baseline, not a regression, because collapsing the
nested `ThemeProvider` made `NEXT_PUBLIC_AXE_FORCE_THEME` effective for the
first time.
