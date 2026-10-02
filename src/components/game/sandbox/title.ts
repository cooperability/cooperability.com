import { WIDE_VIEW } from './background'
import { drawText, glyphRows, glyphWidth } from './font'
import {
  bakePixels,
  context,
  dither,
  hash,
  makeCanvas,
  paintGrid,
  PAL,
  type Canvas,
} from './pixels'

// The title screen: CANDLELIGHT cast in candle wax on black, each letter a
// candle with a wick and a flame, wax running straight down off the letters
// into a pool below, and PRESS START. No world is drawn behind it.

const TITLE = 'CANDLELIGHT'

// What it plays on, under PRESS START, each line led by its icon.
const PAD = [
  '.bbbbbbbbb.',
  'bbbbbbbbbbb',
  'bb.bbbbb.bb',
  'b...bbb.b.b',
  'bb.bbbbb.bb',
  'bbbb...bbbb',
  '.bb.....bb.',
]
// Square corners, a dark screen and a home button, so it never reads as O.
const PHONE = ['bbbbb', 'bsssb', 'bsssb', 'bsssb', 'bsssb', 'bbbbb', 'bb.bb']
export const SUPPORT = [
  { icon: PAD, text: 'CONTROLLER SUPPORTED' },
  { icon: PHONE, text: 'PLAYS ON IPHONE' },
]

// A line's width in game pixels: its icon, a gap, and its text.
export const supportWidth = ({ icon, text }: (typeof SUPPORT)[number]) =>
  icon[0].length + 3 + [...text].reduce((w, ch) => w + glyphWidth(ch) + 1, -1)

// A drip only ever moves down: a bead swells at the lip, runs down to the
// stroke below or the pool, then its tail lets go and drains in after it.
// Each runs at its own pace, so some are faster than others. Off the
// letters' bottom row a drip runs on to the pool. Off a higher stroke it
// gives out a few font pixels down and hangs as a bead, unless a stroke
// below catches it first.
export type Drip = {
  // Font-pixel cell the drip hangs from.
  x: number
  y: number
  // Font row of the stroke it runs onto, or null for the pool.
  stop: number | null
  // Font pixels it can run before it gives out, or null to run all the way.
  reach: number | null
  // Font pixels per update.
  speed: number
  // Updates the bead swells for, and rests for once drained.
  swell: number
  rest: number
  phase: number
}

type Cast = {
  scale: number
  width: number
  letters: Canvas
  drips: Drip[]
  // Wick tops, in font pixels, one per letter.
  wicks: { x: number; y: number }[]
}

const casts = new Map<number, Cast>()

const glyphs = () => [...TITLE].map(glyphRows)

type Letterforms = { width: number; lit: (x: number, y: number) => boolean }
let forms: Letterforms | null = null

// The title's width in font pixels, and whether a font pixel is wax.
function letterforms(): Letterforms {
  if (forms) return forms
  const g = glyphs()
  const width = g.reduce((w, rows) => w + rows[0].length + 1, -1)
  const lit = (x: number, y: number) => {
    let ox = 0
    for (const rows of g) {
      const w = rows[0].length
      if (x >= ox && x < ox + w)
        return y >= 0 && y < 7 && rows[y][x - ox] === '#'
      ox += w + 1
    }
    return false
  }
  return (forms = { width, lit })
}

// Where wax runs off the underside of a stroke, at a scale. Fewer at small
// scales, where many would only read as noise.
export function dripsFor(scale: number): Drip[] {
  const { width, lit } = letterforms()
  const drips: Drip[] = []
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < width; x++) {
      if (!lit(x, y) || lit(x, y + 1)) continue
      if (hash(x, y, 31) <= (scale < 3 ? 0.7 : 0.45)) continue
      let stop: number | null = null
      for (let below = y + 2; below < 7 && stop === null; below++)
        if (lit(x, below)) stop = below
      drips.push({
        x,
        y,
        stop,
        reach: y === 6 ? null : 2 + Math.floor(hash(x, y, 39) * 2),
        speed: 0.015 + hash(x, y, 32) * 0.06,
        swell: 40 + Math.floor(hash(x, y, 33) * 80),
        rest: 30 + Math.floor(hash(x, y, 35) * 200),
        phase: Math.floor(hash(x, y, 34) * 600),
      })
    }
  return drips
}

// A drip at `time`, hanging from `top` and running onto `end`, in screen
// pixels at scale `s`: the wax from `from` down to `to`, whether the bead
// still leads it, updates since it landed, and which time round it is. Null
// while it rests between drips.
export function dripAt(
  d: Drip,
  time: number,
  top: number,
  end: number,
  s: number
) {
  const v = d.speed * s
  const bead = Math.max(1, Math.round(s / 2))
  const run = Math.ceil(Math.max(0, end - top - bead) / v)
  // The tail drains twice as fast as the head ran.
  const drain = Math.ceil((end - top) / (v * 2))
  const cycle = d.swell + run + drain + d.rest
  const age = time + d.phase
  const u = age % cycle
  const turn = Math.floor(age / cycle)
  let from = top
  let to: number
  if (u < d.swell) to = top + Math.round((bead * u) / d.swell)
  else if (u < d.swell + run)
    to = Math.min(end, top + bead + Math.round((u - d.swell) * v))
  else if (u < d.swell + run + drain) {
    to = end
    from = Math.min(end, top + Math.round((u - d.swell - run) * v * 2))
  } else return null
  return { from, to, beading: to < end, landed: u - d.swell - run, turn }
}

// Font pixels to letter art, baked once per scale: bone wax lit from the
// flames above, darker down the right edge of every stroke.
function cast(scale: number): Cast {
  const hit = casts.get(scale)
  if (hit) return hit
  const { width, lit } = letterforms()
  const letters = makeCanvas(width * scale, 7 * scale)
  const ctx = context(letters)
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < width; x++) {
      if (!lit(x, y)) continue
      const px = x * scale
      const py = y * scale
      ctx.fillStyle = PAL.B
      ctx.fillRect(px, py, scale, scale)
      // Shading needs room: at small scales it only reads as noise.
      if (scale >= 3 && !lit(x + 1, y)) {
        ctx.fillStyle = PAL.b
        ctx.fillRect(px + scale - 1, py, 1, scale)
      }
      if (scale >= 3 && !lit(x, y - 1)) {
        ctx.fillStyle = PAL.y
        ctx.fillRect(px, py, scale - (lit(x + 1, y) ? 0 : 1), 1)
      }
    }
  const drips = dripsFor(scale)
  // A wick on each letter's top row, over the lit pixel nearest its middle.
  const wicks: Cast['wicks'] = []
  let ox = 0
  for (const g of glyphs()) {
    const w = g[0].length
    const tops = [...g[0]].flatMap((c, i) => (c === '#' ? [i] : []))
    const mid = (w - 1) / 2
    const at = tops.reduce((a, b) =>
      Math.abs(b - mid) < Math.abs(a - mid) ? b : a
    )
    wicks.push({ x: ox + at, y: 0 })
    ox += w + 1
  }
  const made = { scale, width, letters, drips, wicks }
  casts.set(scale, made)
  return made
}

const glows = new Map<number, Canvas>()

// A warm dithered halo, drawn additively around each flame.
function bakeGlow(radius: number): Canvas {
  return bakePixels(radius * 2, radius * 2, (x, y) => {
    const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
    return d < 1 && (1 - d) * (1 - d) > dither(x, y)
      ? 'rgba(255,140,60,0.35)'
      : null
  })
}

// Where the title sits in a view: its scale, the top left of its letters,
// and the line of the pool under them.
export function titleLayout(viewW: number) {
  const s = viewW >= WIDE_VIEW ? 4 : 2
  const y0 = viewW >= WIDE_VIEW ? 44 : 56
  const x0 = Math.round((viewW - letterforms().width * s) / 2)
  const pool = y0 + 7 * s + 4 * s
  // PRESS START's top, with the support lines under it.
  const press = pool + (viewW >= WIDE_VIEW ? 34 : 30)
  return { s, x0, y0, pool, press }
}

// The lip a drip hangs from and where it ends, in screen pixels, and
// whether it ends on wax or gives out in the air.
export function dripSpan(d: Drip, viewW: number) {
  const { s, y0, pool } = titleLayout(viewW)
  const top = y0 + (d.y + 1) * s
  const land = d.stop === null ? pool - 1 : y0 + d.stop * s
  const end = d.reach === null ? land : Math.min(land, top + d.reach * s)
  return { top, end, lands: end === land }
}

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  time: number,
  viewW: number,
  height: number
) {
  ctx.fillStyle = PAL.k
  ctx.fillRect(0, 0, viewW, height)
  const { s, x0, y0, pool, press } = titleLayout(viewW)
  const c = cast(s)

  // The puddle the drips feed: a low, lumpy line of wax.
  for (let x = x0 - s * 2; x < x0 + (c.width + 2) * s; x++) {
    const h =
      1 + Math.floor(hash(x, 0, 35) * 2) + (hash(x >> 2, 1, 35) > 0.6 ? 1 : 0)
    ctx.fillStyle = PAL.b
    ctx.fillRect(x, pool - h, 1, h)
    ctx.fillStyle = PAL.B
    ctx.fillRect(x, pool - h, 1, 1)
  }

  ctx.drawImage(c.letters, x0, y0)

  // Each drip swells, runs down, and drains, never back up.
  const thick = s >= 4 ? 2 : 1
  for (const d of c.drips) {
    const { top, end, lands } = dripSpan(d, viewW)
    const at = dripAt(d, time, top, end, s)
    if (!at) continue
    // A fresh spot along the stroke each time round.
    const x =
      x0 +
      d.x * s +
      Math.floor(hash(d.x * 7 + at.turn, d.y, 36) * (s - thick + 1))
    const len = at.to - at.from
    if (len > 0) {
      ctx.fillStyle = PAL.B
      ctx.fillRect(x, at.from, thick, len)
      ctx.fillStyle = PAL.b
      ctx.fillRect(x + thick - 1, at.from, 1, len)
    }
    // The bead at the head until it meets the stroke or the pool, then a
    // ripple where it lands. One that gives out keeps its bead.
    if (!lands || (at.beading && at.landed < 0)) {
      ctx.fillStyle = PAL.B
      ctx.fillRect(x, at.to, thick + 1, 2)
      ctx.fillStyle = PAL.y
      ctx.fillRect(x, at.to, 1, 1)
    } else if (at.landed < 8) {
      ctx.fillStyle = PAL.B
      ctx.fillRect(x - 1, end - 1, 1, 1)
      ctx.fillRect(x + thick, end - 1, 1, 1)
    }
  }

  // Wicks and flames, then their glow over everything.
  // The halo scales with the letters, so small type is not swamped.
  const r = 5 * s
  let glow = glows.get(r)
  if (!glow) glows.set(r, (glow = bakeGlow(r)))
  const flames: [number, number][] = []
  c.wicks.forEach((w, i) => {
    const x = x0 + w.x * s + Math.floor(s / 2) - 1
    const y = y0 - 1
    ctx.fillStyle = PAL.d
    ctx.fillRect(x, y - 2, 1, 3)
    const flick = Math.floor(hash(Math.floor(time / 5), i, 37) * 3)
    const h = 4 + flick
    ctx.fillStyle = PAL.e
    ctx.fillRect(x - 1, y - 2 - h, 3, h)
    ctx.fillStyle = PAL.E
    ctx.fillRect(x - 1 + (flick === 2 ? 1 : 0), y - h, 2, h - 2)
    ctx.fillStyle = PAL.y
    ctx.fillRect(x, y - 3, 1, 2)
    ctx.fillStyle = PAL.e
    ctx.fillRect(x + (flick - 1), y - 3 - h, 1, 1)
    flames.push([x, y - 2 - h / 2])
  })
  ctx.globalCompositeOperation = 'lighter'
  for (const [i, [x, y]] of flames.entries()) {
    ctx.globalAlpha = hash(Math.floor(time / 6), i, 38) > 0.5 ? 0.8 : 1
    ctx.drawImage(glow, x - r, y - r)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  if ((time >> 5) % 2 === 0)
    drawText(ctx, 'PRESS START', viewW / 2, press, PAL.B)

  SUPPORT.forEach((line, i) => {
    const x = Math.round((viewW - supportWidth(line)) / 2)
    const y = press + 18 + i * 11
    paintGrid(ctx, line.icon, x, y)
    drawText(ctx, line.text, x + line.icon[0].length + 3, y, PAL.b, 1, 'left')
  })
}
