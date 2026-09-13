# Accessibility

This project targets WCAG 2.1 AA. ESLint, axe-core and Lighthouse check it
automatically.

**Run the audits:** `pnpm access`, which writes reports to
`./accessibility-reports/`. It boots a dev server first, so it needs a free
port 3000 and a Chrome binary on `PATH`.

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

The next `pnpm access` result is a **new baseline, not a regression**.
Collapsing the nested `ThemeProvider` during the App Router migration made
`NEXT_PUBLIC_AXE_FORCE_THEME` take effect for the first time, so the numbers
will move. See [Lint Gate](Lint-Gate.md).

Testing procedures are in [Tooling.md](Tooling.md#accessibility-testing).
