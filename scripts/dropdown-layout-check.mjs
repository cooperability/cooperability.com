import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

// Opens every dropdown on the stash pages that are built from accordions,
// at a phone and a desktop width, and checks that the text inside renders as
// structured, readable blocks. Jest cannot run the MDX pipeline, so this is
// the only check that sees the real rendered lists. Expects `pnpm dev` on
// :3000, or a BASE_URL.
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const PAGES = ['/stash/LLMPrompts', '/stash/OnlineTools']
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 900 },
}

const chrome = chromium.executablePath()
if (!existsSync(chrome)) {
  console.error(
    `No Chromium at ${chrome}. Run: pnpm exec playwright install chromium`
  )
  process.exit(1)
}

// Runs in the page against one open accordion panel. Returns a list of
// problems, empty when the panel reads cleanly.
/* global document, window, getComputedStyle -- serialized into the page */
function inspectPanel(panel) {
  const problems = []
  const body = panel.firstElementChild
  const box = body.getBoundingClientRect()
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop])
  const label = (el) =>
    `<${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 40)}"`

  if (document.documentElement.scrollWidth > window.innerWidth) {
    problems.push('the page scrolls sideways')
  }

  // The panel is overflow-hidden for its open/close animation, so anything
  // wider than it is silently cut off rather than scrolled.
  for (const el of body.querySelectorAll('*')) {
    if (el.closest('pre') && el.tagName !== 'PRE') continue
    if (el.getBoundingClientRect().right > box.right + 1) {
      problems.push(`${label(el)} is clipped at the right edge`)
    }
  }

  for (const pre of body.querySelectorAll('pre')) {
    if (pre.scrollWidth <= pre.clientWidth) continue
    if (!['auto', 'scroll'].includes(getComputedStyle(pre).overflowX)) {
      problems.push(`${label(pre)} overflows without scrolling`)
    }
    if (pre.tabIndex < 0) {
      problems.push(`${label(pre)} scrolls but cannot take keyboard focus`)
    }
  }

  for (const list of body.querySelectorAll('ul, ol')) {
    if (getComputedStyle(list).listStyleType === 'none') {
      problems.push(`${label(list)} shows no bullets or numbers`)
    }
    if (px(list, 'paddingLeft') < 16) {
      problems.push(`${label(list)} is not indented`)
    }
  }

  const bodySize = px(body, 'fontSize')
  for (const el of body.querySelectorAll('p, li')) {
    if (px(el, 'fontSize') < 14) problems.push(`${label(el)} is under 14px`)
    // Negated so a `normal` line height, which parses to NaN, fails too.
    if (!(px(el, 'lineHeight') >= 1.4 * px(el, 'fontSize'))) {
      problems.push(`${label(el)} has cramped line height`)
    }
  }
  for (const heading of body.querySelectorAll('h1, h2, h3')) {
    if (
      px(heading, 'fontSize') <= bodySize &&
      px(heading, 'fontWeight') < 600
    ) {
      problems.push(`${label(heading)} does not stand out from body text`)
    }
  }

  // Blocks that touch read as one run-on paragraph, which is the failure this
  // script exists to catch.
  const blocks = [...body.children]
  for (let i = 1; i < blocks.length; i++) {
    const gap =
      blocks[i].getBoundingClientRect().top -
      blocks[i - 1].getBoundingClientRect().bottom
    if (gap < 6) {
      problems.push(`${label(blocks[i])} has no space above it`)
    }
  }
  for (const list of body.querySelectorAll('ul, ol')) {
    const items = [...list.children]
    for (let i = 1; i < items.length; i++) {
      const gap =
        items[i].getBoundingClientRect().top -
        items[i - 1].getBoundingClientRect().bottom
      if (gap < 4) problems.push(`${label(items[i])} has no space above it`)
    }
  }

  return problems
}

const browser = await chromium.launch()
const failures = []
let panels = 0
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const page = await browser.newPage({ viewport })
  for (const path of PAGES) {
    await page.goto(BASE + path)
    const triggers = page.locator('[data-slot="accordion-trigger"]')
    const count = await triggers.count()
    if (count === 0) failures.push(`${name} ${path}: no dropdowns found`)
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i)
      const title = (await trigger.textContent()).trim()
      await trigger.click()
      const panel = page.locator(
        '[data-slot="accordion-content"][data-state="open"]'
      )
      // Measure after the open animation settles, not mid-expansion.
      await panel.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
      )
      for (const problem of await panel.evaluate(inspectPanel)) {
        failures.push(`${name} ${path} [${title}]: ${problem}`)
      }
      panels++
    }
  }
  await page.close()
}
await browser.close()

if (failures.length) {
  console.error(`${failures.length} layout problem(s):\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(
  `dropdowns: ${panels} panels clean at ${Object.keys(VIEWPORTS).join(' + ')}`
)
