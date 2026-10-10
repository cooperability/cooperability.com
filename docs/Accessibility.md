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
- [ ] Bring focus rings to 3:1 (WCAG 1.4.11). The ring is `--ring` at 50%
      alpha, which measures 1.56:1 on white
      ([#348](https://github.com/cooperability/cooperability.com/pull/348))

**Baseline (2026-10-04):** axe 0 violations on `/`, `/demos` and `/resources`
across WCAG 2.1 A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`), 62
rules run per page. Lighthouse accessibility 1.00, 0.98 and 1.00. These are
the first numbers with the light theme actually forced. Before, the variable
never reached the dev server. See [Lint Gate](Lint-Gate.md).

Before 2026-10-04 axe ran `wcag2aa` alone, which selects 3 rules, so no
level-A check ran. The wider run caught the header's Radix Tabs pointing
`aria-controls` at tab panels that did not exist (`aria-valid-attr-value`,
critical, on every page). The header is now a list of links.

axe and Lighthouse do not test WCAG 2.4.7 (Focus Visible). Both passed on
2026-10-04 while every shadcn focus ring computed to `box-shadow: none`,
because `global.css` wrapped the oklch theme variables in `hsl()`
([#348](https://github.com/cooperability/cooperability.com/pull/348)). Check
focus by tabbing through each page. A Playwright check must press Tab until
the target is focused, because `.focus()` does not reliably match
`:focus-visible`. It must also wait out `transition-all` before reading
`box-shadow`, or a mid-transition value reads as a zero-width ring.

Testing procedures are in [Tooling.md](Tooling.md#accessibility-testing).
