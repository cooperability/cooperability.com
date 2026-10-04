# Accessibility

This project targets WCAG 2.1 AA. ESLint, axe-core and Lighthouse check it
automatically.

**Run the audits:** `pnpm a11y`, which writes reports to
`./accessibility-reports/`. It boots a dev server first, so it needs a free
port 3000. axe and Lighthouse run on Playwright's Chromium
(`pnpm exec playwright install chromium`), so no system Chrome is needed.

## In place

- Semantic HTML5 with a real heading hierarchy on every route
- Keyboard navigation and managed focus
- ARIA attributes where the markup alone does not carry the meaning
- WCAG AA color contrast in both the light and the dark theme
- The automated suite above, wired into the development workflow

## Outstanding

- [ ] Playwright plus axe-core, so theme switching is covered in CI rather than by hand
- [ ] Give every icon-only button discernible screen-reader text
- [ ] Re-run the audit on a schedule rather than on demand
- [ ] Widen axe past `wcag2aa`. That tag selects 3 rules, so level-A checks
      such as alt text never run. A `wcag2a` + `wcag2aa` run on 2026-10-04
      found one critical violation on every page: the header's Radix Tabs set
      `aria-controls` to panels that do not exist (`aria-valid-attr-value`)

**Baseline (2026-10-04):** axe 0 `wcag2aa` violations on `/`, `/demos` and
`/resources`. Lighthouse accessibility 1.00, 0.98 and 1.00. These are the
first numbers with the light theme actually forced. Before, the variable never
reached the dev server. See [Lint Gate](Lint-Gate.md).

Testing procedures are in [Tooling.md](Tooling.md#accessibility-testing).
