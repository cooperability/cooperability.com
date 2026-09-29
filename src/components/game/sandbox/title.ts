import { drawText, glyphRows } from './font'
import { context, dither, hash, makeCanvas, PAL, type Canvas } from './pixels'

// The title screen: CANDLELIGHT cast in candle wax on black, each letter a
// candle with a wick and a flame, wax dripping off the letters into a pool
// below, and PRESS START. No world is drawn behind it.

const TITLE = 'CANDLELIGHT'

type Drip = {
  // Font-pixel cell the drip hangs from, and where in it.
  x: number
  y: number
  // Longest it grows, in screen pixels, and updates per grow-and-fall cycle.
  max: number
  period: number
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

// Font pixels to letter art, baked once per scale: bone wax lit from the
// flames above, darker down the right edge of every stroke.
function cast(scale: number): Cast {
  const hit = casts.get(scale)
  if (hit) return hit
  const glyphs = [...TITLE].map(glyphRows)
  const width = glyphs.reduce((w, g) => w + g[0].length + 1, -1)
  const lit = (x: number, y: number) => {
    let ox = 0
    for (const g of glyphs) {
      const w = g[0].length
      if (x >= ox && x < ox + w) return y >= 0 && y < 7 && g[y][x - ox] === '#'
      ox += w + 1
    }
    return false
  }
  const letters = makeCanvas(width * scale, 7 * scale)
  const ctx = context(letters)
  const drips: Drip[] = []
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
      // Wax runs off the underside of a stroke.
      if (!lit(x, y + 1) && hash(x, y, 31) > (scale < 3 ? 0.7 : 0.45))
        drips.push({
          x,
          y,
          max: scale * (2 + Math.floor(hash(x, y, 32) * 4)),
          period: 150 + Math.floor(hash(x, y, 33) * 260),
          phase: Math.floor(hash(x, y, 34) * 400),
        })
    }
  // A wick on each letter's top row, over the lit pixel nearest its middle.
  const wicks: Cast['wicks'] = []
  let ox = 0
  for (const g of glyphs) {
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
  const c = makeCanvas(radius * 2, radius * 2)
  const ctx = context(c)
  ctx.fillStyle = 'rgba(255,140,60,0.35)'
  for (let y = 0; y < radius * 2; y++)
    for (let x = 0; x < radius * 2; x++) {
      const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
      if (d < 1 && (1 - d) * (1 - d) > dither(x, y)) ctx.fillRect(x, y, 1, 1)
    }
  return c
}

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  time: number,
  viewW: number,
  height: number
) {
  ctx.fillStyle = PAL.k
  ctx.fillRect(0, 0, viewW, height)
  const c = cast(viewW >= 300 ? 4 : 2)
  const s = c.scale
  const x0 = Math.round((viewW - c.width * s) / 2)
  const y0 = viewW >= 300 ? 44 : 56
  const pool = y0 + 7 * s + 6 * s

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

  // Each drip swells to its length, lets a drop go, and starts again.
  const thick = s >= 4 ? 2 : 1
  for (const d of c.drips) {
    const u = ((time + d.phase) % d.period) / d.period
    const x = x0 + d.x * s + Math.floor(hash(d.x, d.y, 36) * (s - thick))
    const top = y0 + (d.y + 1) * s
    const grow = u < 0.8 ? u / 0.8 : 1 - (u - 0.8) / 0.2
    const len = Math.max(1, Math.round(d.max * grow * grow))
    ctx.fillStyle = PAL.B
    ctx.fillRect(x, top, thick, len)
    ctx.fillStyle = PAL.b
    ctx.fillRect(x + thick - 1, top, 1, len)
    // A bead at the tip, bigger as it gets ready to fall.
    if (grow > 0.5) {
      ctx.fillStyle = PAL.B
      ctx.fillRect(x, top + len, thick + 1, 2)
      ctx.fillStyle = PAL.y
      ctx.fillRect(x, top + len, 1, 1)
    }
    if (u >= 0.8) {
      // The drop in free fall, into the pool.
      const f = (u - 0.8) * d.period
      const y = top + d.max + 2 + Math.round(0.12 * f * f)
      if (y < pool - 2) {
        ctx.fillStyle = PAL.B
        ctx.fillRect(x, y, thick, 2)
      }
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
    drawText(
      ctx,
      'PRESS START',
      viewW / 2,
      pool + (viewW >= 300 ? 34 : 30),
      PAL.B
    )
}
