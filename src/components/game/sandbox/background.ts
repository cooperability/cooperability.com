import { context, dither, hash, makeCanvas, PAL, type Canvas } from './pixels'

export const VIEW_W = 320
export const VIEW_H = 180

// Sky bands from zenith to horizon, stepped with ordered dither.
const SKY = ['#08070d', '#0e0c17', '#151223', '#1d1830', '#2a1f37', '#3a2433']

function bakeSky(): Canvas {
  const c = makeCanvas(VIEW_W, VIEW_H)
  const ctx = context(c)
  for (let y = 0; y < VIEW_H; y++) {
    const pos = (y / VIEW_H) * (SKY.length - 1)
    const band = Math.floor(pos)
    const frac = pos - band
    for (let x = 0; x < VIEW_W; x++) {
      const i = frac > dither(x, y) ? band + 1 : band
      ctx.fillStyle = SKY[Math.min(i, SKY.length - 1)]
      ctx.fillRect(x, y, 1, 1)
    }
  }
  // A pale moon behind haze, with a dithered halo.
  const mx = 238
  const my = 42
  for (let y = -26; y < 27; y++) {
    for (let x = -26; x < 27; x++) {
      const r = Math.hypot(x, y)
      if (r < 11) {
        const shade =
          r > 9 ? '#8f8aa0' : hash(x, y, 9) > 0.8 ? '#a9a3b8' : '#c4bed0'
        ctx.fillStyle = shade
        ctx.fillRect(mx + x, my + y, 1, 1)
      } else if (r < 26 && (26 - r) / 15 > dither(mx + x, my + y) + 0.35) {
        ctx.fillStyle = '#2b2440'
        ctx.fillRect(mx + x, my + y, 1, 1)
      }
    }
  }
  // Sparse stars above the haze line.
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i, 1, 7) * VIEW_W)
    const y = Math.floor(hash(i, 2, 7) * 90)
    if (Math.hypot(x - mx, y - my) < 28) continue
    ctx.fillStyle = hash(i, 3, 7) > 0.8 ? '#b9b4c9' : '#5a5570'
    ctx.fillRect(x, y, 1, 1)
  }
  return c
}

// Height of a skyline column: spires, domes and bell towers along a tile.
function skyline(width: number, seed: number, base: number, tall: number) {
  const h = new Array<number>(width).fill(base)
  let x = 0
  while (x < width) {
    const kind = hash(x, 0, seed)
    const w = 10 + Math.floor(hash(x, 1, seed) * 22)
    const top = base + Math.floor(hash(x, 2, seed) * tall)
    for (let i = 0; i < w && x + i < width; i++) {
      const t = i / (w - 1)
      const edge = Math.abs(t - 0.5) * 2
      let v = top * (1 - 0.12 * edge)
      // Dome shoulders.
      if (kind > 0.66) v = base + (top - base) * Math.sqrt(1 - edge * edge)
      h[x + i] = Math.max(h[x + i], Math.round(v))
    }
    // A needle spire on the tallest blocks.
    if (kind < 0.4) {
      const mid = x + Math.floor(w / 2)
      for (let i = -3; i <= 3; i++)
        if (mid + i < width)
          h[mid + i] = Math.max(h[mid + i], top + (3 - Math.abs(i)) * 7)
    }
    x += w + Math.floor(hash(x, 3, seed) * 8)
  }
  return h
}

// A repeating strip of distant cathedral silhouettes.
function bakeSpires(): Canvas {
  const width = 480
  const c = makeCanvas(width, VIEW_H)
  const ctx = context(c)
  const heights = skyline(width, 11, 40, 50)
  for (let x = 0; x < width; x++) {
    const top = VIEW_H - heights[x]
    ctx.fillStyle = PAL.v
    ctx.fillRect(x, top, 1, VIEW_H - top)
  }
  // Lit windows in the towers.
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash(i, 4, 11) * width)
    const y = VIEW_H - Math.floor(hash(i, 5, 11) * heights[x] * 0.8) - 4
    if (y < VIEW_H - heights[x] + 4) continue
    ctx.fillStyle = hash(i, 6, 11) > 0.7 ? '#6b3a22' : '#2e2640'
    ctx.fillRect(x, y, 1, 2)
  }
  return c
}

// A ruined arcade: piers and pointed arches, closer and lighter.
function bakeArcade(): Canvas {
  const width = 384
  const c = makeCanvas(width, VIEW_H)
  const ctx = context(c)
  const floor = VIEW_H - 22
  ctx.fillStyle = PAL.V
  ctx.fillRect(0, floor, width, VIEW_H - floor)
  const bay = 48
  for (let b = 0; b < width / bay; b++) {
    const x0 = b * bay
    const broken = hash(b, 0, 21) > 0.6
    const top = floor - 70 - Math.floor(hash(b, 1, 21) * 24)
    // Pier.
    ctx.fillStyle = PAL.V
    ctx.fillRect(x0, top, 8, floor - top)
    ctx.fillStyle = '#2f2c44'
    ctx.fillRect(x0, top, 1, floor - top)
    if (broken) continue
    // Pointed arch spanning to the next pier, drawn as its intrados edge.
    const span = bay - 8
    for (let i = 0; i < span; i++) {
      const t = i / (span - 1)
      const lift = Math.sqrt(1 - Math.pow(Math.abs(t - 0.5) * 2, 1.6))
      const y = Math.round(top + 18 - lift * 26)
      ctx.fillStyle = PAL.V
      ctx.fillRect(x0 + 8 + i, top - 10, 1, y - top + 10)
    }
  }
  return c
}

export type Backdrop = { sky: Canvas; spires: Canvas; arcade: Canvas }

export function bakeBackdrop(): Backdrop {
  return { sky: bakeSky(), spires: bakeSpires(), arcade: bakeArcade() }
}

function strip(
  ctx: CanvasRenderingContext2D,
  img: Canvas,
  scroll: number,
  dy: number
) {
  const w = img.width
  const x = -(((Math.round(scroll) % w) + w) % w)
  for (let ox = x; ox < VIEW_W; ox += w) ctx.drawImage(img, ox, dy)
}

// Farther layers scroll slower, and all of them sink a little as the camera
// rises, so height reads as depth.
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  b: Backdrop,
  camX: number,
  camY: number,
  maxCamY: number
) {
  ctx.drawImage(b.sky, 0, 0)
  const rise = maxCamY - camY
  strip(ctx, b.spires, camX * 0.12, Math.round(rise * 0.06) + 6)
  strip(ctx, b.arcade, camX * 0.35, Math.round(rise * 0.18) + 10)
}
