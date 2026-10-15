import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

// Checks that each /stash title sits above its date at 525px and below, and
// beside it from 526px. Jest's DOM applies no stylesheet, so this is the only
// check that sees the breakpoint classes take effect. It runs with JavaScript
// off too, because the server render is what a phone sees first. Expects
// `pnpm build && pnpm start` on :3000, or a BASE_URL.
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const WIDTHS = [375, 525, 526, 1280]
const ROW_FROM = 526

const chrome = chromium.executablePath()
if (!existsSync(chrome)) {
  console.error(
    `No Chromium at ${chrome}. Run: pnpm exec playwright install chromium`
  )
  process.exit(1)
}

/* global document */
function measureItems() {
  return [...document.querySelectorAll('li')]
    .filter((li) => li.querySelector('a[href^="/stash/"]'))
    .map((li) => {
      const link = li.querySelector('a')
      const a = link.getBoundingClientRect()
      const d = link.nextElementSibling.getBoundingClientRect()
      return {
        title: link.textContent.trim(),
        sameRow: Math.abs(a.top - d.top) < a.height,
        below: d.top >= a.bottom,
      }
    })
}

const browser = await chromium.launch()
const failures = []
let items = 0
for (const javaScriptEnabled of [false, true]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      javaScriptEnabled,
      serviceWorkers: 'block',
    })
    const page = await context.newPage()
    await page.goto(BASE + '/stash')
    const label = `${width}px js=${javaScriptEnabled ? 'on' : 'off'}`
    const measured = await page.evaluate(measureItems)
    if (measured.length === 0) failures.push(`${label}: no stash items found`)
    for (const { title, sameRow, below } of measured) {
      if (width >= ROW_FROM && !sameRow) {
        failures.push(`${label} "${title}": date is not beside the title`)
      }
      if (width < ROW_FROM && !below) {
        failures.push(`${label} "${title}": date is not below the title`)
      }
    }
    items += measured.length
    await context.close()
  }
}
await browser.close()

if (failures.length) {
  console.error(`${failures.length} layout problem(s):\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(
  `stash: ${items} items laid out as expected at ${WIDTHS.join(', ')}px, JS off and on`
)
