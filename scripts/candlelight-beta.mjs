// Beta pass for /demos/game on desktop and phone viewports. Opens the game
// with ?qa=1, which runs the in-game scenarios and measures frame timing and
// layout, then plays through with real keys or touches, screenshots each
// screen, and writes report.md for a human or Claude to read.
//
//   pnpm build && pnpm start          (in one terminal)
//   node scripts/candlelight-beta.mjs [--url http://localhost:3000] [--out dir]
//
// Needs Playwright's Chromium once: pnpm exec playwright install chromium
/* global window */
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, devices } from 'playwright'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const base = arg('url', 'http://localhost:3000')
const out = arg('out', join(tmpdir(), `candlelight-beta-${Date.now()}`))
mkdirSync(out, { recursive: true })

const phone = (name, landscape = false) => {
  // Chromium stands in for each phone's browser: same viewport, touch and UA.
  const d = { ...devices[name] }
  delete d.defaultBrowserType
  if (!landscape) return d
  return {
    ...d,
    viewport: { width: d.viewport.height, height: d.viewport.width },
    screen: { width: d.screen.height, height: d.screen.width },
  }
}

const PROFILES = [
  {
    name: 'desktop-1440',
    touch: false,
    context: { viewport: { width: 1440, height: 900 } },
  },
  {
    name: 'laptop-1280',
    touch: false,
    context: { viewport: { width: 1280, height: 720 } },
  },
  { name: 'iphone15-portrait', touch: true, context: phone('iPhone 15') },
  {
    name: 'iphone15-landscape',
    touch: true,
    context: phone('iPhone 15', true),
  },
  { name: 'pixel7-portrait', touch: true, context: phone('Pixel 7') },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function run(browser, profile) {
  const context = await browser.newContext(profile.context)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  // Vercel's analytics scripts 404 and the site's report-only CSP warns on
  // any local server. Both are site-wide, not the game's.
  const ignored = new Set()
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const local =
      (m.location()?.url ?? '').includes('/_vercel/') ||
      /_vercel\/|report-only policy/.test(m.text())
    if (local) ignored.add(m.text().slice(0, 90))
    else errors.push(`console: ${m.text()}`)
  })
  const checks = []
  const check = (name, pass, detail = '') =>
    checks.push({ name, pass: !!pass, detail: String(detail) })
  const shots = []
  const shot = async (label) => {
    const file = `${profile.name}-${label}.png`
    await page.screenshot({ path: join(out, file) })
    shots.push(file)
  }
  const snap = () => page.evaluate(() => window.__candlelight.snapshot())
  const cdp = profile.touch ? await context.newCDPSession(page) : null

  // A touch held on a control for `ms`, at a point in its box (0..1).
  const hold = async (selector, fx, fy, ms) => {
    const box = await page.locator(selector).first().boundingBox()
    const point = { x: box.x + box.width * fx, y: box.y + box.height * fy }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point],
    })
    await sleep(ms)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
  }
  const FACE = {
    a: [0.5, 0.82],
    b: [0.82, 0.5],
    x: [0.18, 0.5],
    y: [0.5, 0.18],
  }
  const DPAD = { right: [0.95, 0.5], left: [0.05, 0.5], up: [0.5, 0.05] }
  const press = async (button, ms = 80) => {
    if (profile.touch) {
      const [fx, fy] = FACE[button]
      return hold('[class*="face"]', fx, fy, ms)
    }
    const key = { a: 'KeyK', b: 'KeyL', x: 'KeyJ', y: 'KeyI' }[button]
    await page.keyboard.down(key)
    await sleep(ms)
    await page.keyboard.up(key)
  }
  const walk = async (dir, ms) => {
    if (profile.touch) {
      const [fx, fy] = DPAD[dir]
      return hold('[class*="dpad"]', fx, fy, ms)
    }
    const key = dir === 'right' ? 'KeyD' : 'KeyA'
    await page.keyboard.down(key)
    await sleep(ms)
    await page.keyboard.up(key)
  }

  await page.goto(`${base}/demos/game?qa=1`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__candlelightQA?.done, null, {
    timeout: 30000,
  })
  const qa = await page.evaluate(() => window.__candlelightQA)
  await shot('title')

  let s = await snap()
  check('opens on the title', s.scene === 'title', s.scene)
  check(
    'layout mode matches the device',
    s.mode === (profile.touch ? 'touch' : 'external'),
    s.mode
  )

  await press('a')
  await sleep(200)
  s = await snap()
  check('jump leaves the title', s.scene === 'play', s.scene)

  const x0 = s.player.x
  await walk('right', 1200)
  s = await snap()
  check(
    'holding right walks right',
    s.player.x - x0 > 40,
    `${s.player.x - x0}px`
  )
  await shot('walk')

  await press('y')
  await sleep(150)
  s = await snap()
  check(
    'the torch button throws a torch',
    s.torches >= 1,
    `${s.torches} torches`
  )
  await shot('torch')

  // Stand near the cloister snake and let it come.
  await page.evaluate(() => {
    const w = window.__candlelight.game.world
    const sn = w.snakes[0]
    w.player.x = sn.x + 44
    w.player.y = sn.y + sn.h - w.player.h
  })
  await sleep(900)
  await shot('snake')

  // Death, then rising again.
  await page.evaluate(() => {
    const w = window.__candlelight.game.world
    window.__candlelight.setHp(1)
    const sn = w.snakes[0]
    w.player.x = sn.x + 16
    w.player.y = sn.y + sn.h - w.player.h
  })
  await page
    .waitForFunction(
      () => window.__candlelight.snapshot().scene === 'dead',
      null,
      { timeout: 8000 }
    )
    .catch(() => {})
  s = await snap()
  check('a bite at 1 HP ends the run', s.scene === 'dead', s.scene)
  await sleep(1600)
  await shot('death')
  await press('a')
  await sleep(200)
  s = await snap()
  check(
    'rising again restores 5 HP and all snakes',
    s.scene === 'play' && s.hp === 5 && s.kills === 0,
    JSON.stringify({ scene: s.scene, hp: s.hp, kills: s.kills })
  )

  // Victory.
  await page.evaluate(() => window.__candlelight.killAll())
  await page
    .waitForFunction(
      () => window.__candlelight.snapshot().scene === 'won',
      null,
      { timeout: 5000 }
    )
    .catch(() => {})
  await sleep(1600)
  s = await snap()
  check('five kills show the win screen', s.scene === 'won', s.scene)
  await shot('win')

  if (!profile.touch) {
    await page.keyboard.press('ArrowLeft')
    const legend = await page
      .locator('button', { hasText: 'Keys:' })
      .textContent()
    check(
      'the legend follows the arrows layout once used',
      /Arrows/.test(legend),
      legend
    )
    await shot('legend-arrows')
  }

  await context.close()
  return {
    profile: profile.name,
    qa,
    checks,
    errors,
    ignored: [...ignored],
    shots,
  }
}

const browser = await chromium.launch()
const results = []
for (const p of PROFILES) {
  try {
    results.push(await run(browser, p))
  } catch (e) {
    results.push({
      profile: p.name,
      qa: null,
      checks: [{ name: 'run finished', pass: false, detail: e.message }],
      errors: [],
      shots: [],
    })
  }
}
await browser.close()

const lines = [
  '# Candlelight beta report',
  '',
  `Target: ${base}/demos/game?qa=1`,
  '',
]
let failed = 0
for (const r of results) {
  const all = [
    ...(r.qa?.scenarios ?? []),
    ...(r.qa?.light ?? []),
    ...(r.qa?.layout ?? []),
    ...r.checks,
  ]
  const bad = all.filter((c) => !c.pass)
  const hitches = r.qa
    ? r.qa.frames.slow > Math.ceil(r.qa.frames.count * 0.02)
    : true
  failed += bad.length + r.errors.length + (hitches ? 1 : 0)
  lines.push(`## ${r.profile}`, '')
  if (r.qa) {
    const v = r.qa.viewport
    lines.push(
      `Viewport ${v.width}x${v.height} @${v.dpr}x, touch ${v.touch}.`,
      `Frames: ${r.qa.frames.count} in 3.5s, p50 ${r.qa.frames.p50}ms, p95 ${r.qa.frames.p95}ms, max ${r.qa.frames.max}ms, hitches over 34ms: ${r.qa.frames.slow}.`,
      `Cost per update ${r.qa.cost.stepUs}µs, per draw ${r.qa.cost.drawUs}µs.`,
      ''
    )
  }
  lines.push('| Check | Result | Detail |', '| --- | --- | --- |')
  for (const c of all)
    lines.push(
      `| ${c.name} | ${c.pass ? 'pass' : '**FAIL**'} | ${c.detail.replace(/\|/g, '/')} |`
    )
  lines.push(
    '',
    r.errors.length
      ? `Errors:\n${r.errors.map((e) => `- ${e}`).join('\n')}`
      : 'No page or console errors from the game.',
    ''
  )
  if (r.ignored?.length)
    lines.push(`Ignored, local server only: ${r.ignored.join(' / ')}`, '')
  lines.push(`Screenshots: ${r.shots.join(', ')}`, '')
}
lines.push(failed ? `**${failed} problem(s).**` : 'All checks passed.')
writeFileSync(join(out, 'report.md'), lines.join('\n'))
writeFileSync(join(out, 'report.json'), JSON.stringify(results, null, 2))
console.log(lines.join('\n'))
console.log(`\nReport and screenshots: ${out}`)
process.exit(failed ? 1 : 0)
