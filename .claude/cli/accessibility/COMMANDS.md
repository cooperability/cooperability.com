# Accessibility CLI commands (ARIA / axe / Lighthouse)

Three layers in this repo (WCAG 2.1 AA oriented). Package manager: **Yarn 4**.

| Layer | What | Command |
|-------|------|---------|
| Static ARIA / a11y | `eslint-plugin-jsx-a11y` via ESLint | `pnpm lint` |
| Runtime WCAG | `@axe-core/cli` (`wcag2aa`) | part of `pnpm access` |
| Lighthouse a11y | Lighthouse `--only-categories=accessibility` | part of `pnpm access` |

Reports are gitignored under `accessibility-reports/`.

## Full automated suite (preferred)

Starts Next dev server, then lint + axe + Lighthouse on key routes:

```bash
pnpm access
```

Under the hood (`access` → `access:run-audits`):

1. `NEXT_PUBLIC_AXE_FORCE_THEME=light`
2. Ensure `accessibility-reports/` exists
3. `pnpm lint` (includes jsx-a11y / ARIA static rules)
4. **axe-core** on:
   - `http://localhost:3000`
   - `http://localhost:3000/demos`
   - `http://localhost:3000/resources`
   - tags: `wcag2aa` → `accessibility-reports/axe-report.json`
5. **Lighthouse** (accessibility category only, headless Chrome) on the same three pages →
   - `accessibility-reports/lighthouse-report-home.{json,html}`
   - `accessibility-reports/lighthouse-report-demos.{json,html}`
   - `accessibility-reports/lighthouse-report-resources.{json,html}`

**Agent notes:** Slow (minutes). Needs a free port `3000` (or stop an existing `pnpm dev`). Run when the user asks for a11y / Lighthouse / axe — not on every unit-test pass.

## Static ARIA / jsx-a11y only (fast)

```bash
pnpm lint                 # ESLint incl. jsx-a11y (alt text, ARIA, semantics)
pnpm lint:mdx             # MDX subset
```

## Manual / partial runs (server already up)

If `pnpm dev` is already serving `http://localhost:3000`:

```bash
# Create report dir
node scripts/create-report-dir.js

# axe only (WCAG 2 AA)
pnpm exec axe http://localhost:3000 http://localhost:3000/demos http://localhost:3000/resources \
  --tags wcag2aa \
  --save ./accessibility-reports/axe-report.json \
  --exit

# Lighthouse accessibility only — one page
pnpm exec lighthouse http://localhost:3000 \
  --output json --output html \
  --output-path ./accessibility-reports/lighthouse-report-home \
  --only-categories=accessibility \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'

pnpm exec lighthouse http://localhost:3000/demos \
  --output json --output html \
  --output-path ./accessibility-reports/lighthouse-report-demos \
  --only-categories=accessibility \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'

pnpm exec lighthouse http://localhost:3000/resources \
  --output json --output html \
  --output-path ./accessibility-reports/lighthouse-report-resources \
  --only-categories=accessibility \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'
```

Or run the packaged audit step (still expects server on :3000):

```bash
pnpm access:run-audits
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
pnpm access
```

## Discover in any local project

Look for `axe`, `lighthouse`, `pa11y`, `playwright` + `@axe-core/playwright`, or scripts named `access` / `a11y` in `package.json` and CI.
