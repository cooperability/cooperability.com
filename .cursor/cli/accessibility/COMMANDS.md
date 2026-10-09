# Accessibility CLI commands (ARIA / axe / Lighthouse)

Three layers in this repo (WCAG 2.1 AA oriented). Package manager: **pnpm 11**.

| Layer | What | Command |
|-------|------|---------|
| Static ARIA / a11y | `eslint-plugin-jsx-a11y` via ESLint | `pnpm lint` |
| Runtime WCAG | `@axe-core/playwright` (`wcag2aa`) | part of `pnpm a11y` |
| Lighthouse a11y | Lighthouse `--only-categories=accessibility` | part of `pnpm a11y` |

Reports are gitignored under `accessibility-reports/`.

## Full automated suite (preferred)

Starts Next dev server, then lint + axe + Lighthouse on key routes:

```bash
pnpm a11y
```

Under the hood (`a11y` → `a11y:run-audits`):

1. `NEXT_PUBLIC_AXE_FORCE_THEME=light`, set on `a11y` itself so the dev server renders the light theme
2. `pnpm lint` (includes jsx-a11y / ARIA static rules)
3. `scripts/a11y-audit.mjs`, on Playwright's Chromium (no system Chrome or chromedriver)
4. **axe-core** (`@axe-core/playwright`) on:
   - `http://localhost:3000`
   - `http://localhost:3000/demos`
   - `http://localhost:3000/resources`
   - tags: `wcag2aa` → `accessibility-reports/axe-report.json`
   - any violation fails the run here, before Lighthouse
5. **Lighthouse** (accessibility category only, `CHROME_PATH` set to the same Chromium) on the same three pages →
   - `accessibility-reports/lighthouse-report-home.{json,html}`
   - `accessibility-reports/lighthouse-report-demos.{json,html}`
   - `accessibility-reports/lighthouse-report-resources.{json,html}`

**Agent notes:** Slow (minutes). Needs Playwright's Chromium (`pnpm exec playwright install chromium`). Needs a free port `3000` (or stop an existing `pnpm dev`). Run when the user asks for a11y / Lighthouse / axe — not on every unit-test pass.

## Static ARIA / jsx-a11y only (fast)

```bash
pnpm lint                 # ESLint incl. jsx-a11y (alt text, ARIA, semantics)
pnpm lint:mdx             # MDX subset
```

## Manual / partial runs (server already up)

If `pnpm dev` is already serving `http://localhost:3000`:

```bash
# axe + Lighthouse on Playwright's Chromium, without the lint step
node scripts/a11y-audit.mjs

# Lighthouse accessibility only, one page (needs Chrome, or CHROME_PATH)
pnpm exec lighthouse http://localhost:3000 \
  --output json --output html \
  --output-path ./accessibility-reports/lighthouse-report-home \
  --only-categories=accessibility \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'
```

Or run the packaged audit step (still expects server on :3000):

```bash
pnpm a11y:run-audits
```

## Review outputs

| Artifact | Tool |
|----------|------|
| `accessibility-reports/axe-report.json` | axe-core |
| `accessibility-reports/lighthouse-report-*.html` | Lighthouse (human) |
| `accessibility-reports/lighthouse-report-*.json` | Lighthouse (machine) |

Known limits: axe may false-positive contrast on themed UI; theme states may need manual browser checks. See `docs/Tooling.md#accessibility-testing`.

## Suggested sequences

```bash
# Unit tests only
pnpm test

# Static a11y + unit
pnpm lint && pnpm test

# Full a11y (axe + Lighthouse) when requested
pnpm a11y
```

## Discover in any local project

Look for `axe`, `lighthouse`, `pa11y`, `playwright` + `@axe-core/playwright`, or scripts named `access` / `a11y` in `package.json` and CI.
