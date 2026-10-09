import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium } from 'playwright'

// axe and Lighthouse both run on Playwright's Chromium, so the audit needs no
// system Chrome and no chromedriver matched to one. Expects `pnpm dev` on :3000.
const BASE = 'http://localhost:3000'
const PAGES = { home: '/', demos: '/demos', resources: '/resources' }
const REPORTS = 'accessibility-reports'
// WCAG 2.1 A and AA, the site's stated target. `wcag2aa` alone selects 3
// rules and skips every level-A check.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const chrome = chromium.executablePath()
if (!existsSync(chrome)) {
  console.error(`No Chromium at ${chrome}. Run: pnpm exec playwright install chromium`)
  process.exit(1)
}
mkdirSync(REPORTS, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext()
const results = []
for (const path of Object.values(PAGES)) {
  const page = await context.newPage()
  await page.goto(BASE + path)
  results.push(await new AxeBuilder({ page }).withTags(TAGS).analyze())
  await page.close()
}
await browser.close()
writeFileSync(`${REPORTS}/axe-report.json`, JSON.stringify(results, null, 2))

const violations = results.flatMap((r) =>
  r.violations.map((v) => `${r.url}  ${v.id}: ${v.nodes.length} node(s)`)
)
if (violations.length) {
  console.error(`axe found ${violations.length} violation(s):\n${violations.join('\n')}`)
  process.exit(1)
}
console.log(`axe: no ${TAGS.join(' + ')} violations on ${results.length} pages`)

for (const [name, path] of Object.entries(PAGES)) {
  const run = spawnSync(
    process.execPath,
    [
      'node_modules/lighthouse/cli/index.js',
      BASE + path,
      '--output=json',
      '--output=html',
      `--output-path=./${REPORTS}/lighthouse-report-${name}`,
      '--only-categories=accessibility',
      '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    ],
    { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chrome } }
  )
  if (run.status !== 0) process.exit(run.status ?? 1)
}
