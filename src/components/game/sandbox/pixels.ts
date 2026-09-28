// One palette for the whole game: cold indigo stone lit by ember and blood.
export const PAL: Record<string, string> = {
  k: '#0b0a10', // outline, near black
  d: '#15131d', // deepest shadow
  s: '#24212e', // stone dark
  S: '#353142', // stone
  t: '#4d485d', // stone light
  T: '#6f6882', // stone highlight
  v: '#1b1a2b', // far silhouette
  V: '#262439', // mid silhouette
  b: '#9c927f', // bone
  B: '#d6ccb4', // bone light
  r: '#4f0e14', // blood dark
  R: '#8a1a22', // crimson
  C: '#b8342c', // crimson light
  e: '#d4602a', // ember
  E: '#ffb347', // ember light
  y: '#fff1c1', // flame core
  g: '#9c7b34', // gold
  G: '#dcc06a', // gold light
  m: '#2c3a2b', // moss
  M: '#435a3a', // moss light
  i: '#343b4b', // iron
  I: '#5d6679', // iron light
  w: '#b9b4c9', // steel edge
  o: '#35261f', // wood dark
  O: '#56402f', // wood
}

export type Canvas = HTMLCanvasElement

export function makeCanvas(w: number, h: number): Canvas {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function context(c: Canvas) {
  return c.getContext('2d') as CanvasRenderingContext2D
}

// Paints a grid of palette keys, '.' transparent, one fillRect per pixel run.
export function paintGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  ox = 0,
  oy = 0,
  flip = false
) {
  const w = grid[0].length
  grid.forEach((row, y) => {
    let x = 0
    while (x < w) {
      const key = row[x]
      let end = x + 1
      while (end < w && row[end] === key) end++
      if (key !== '.') {
        ctx.fillStyle = PAL[key]
        const px = flip ? w - end : x
        ctx.fillRect(ox + px, oy + y, end - x, 1)
      }
      x = end
    }
  })
}

export function bake(grid: string[], flip = false): Canvas {
  const c = makeCanvas(grid[0].length, grid.length)
  paintGrid(context(c), grid, 0, 0, flip)
  return c
}

// Stable per-cell noise, so procedural detail is the same every load.
export function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// 4x4 ordered dither threshold, for banded gradients and soft light.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export function dither(x: number, y: number) {
  return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
}

// A 1px line, stepped like pixel art rather than anti-aliased.
export function pixelLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thick = 1
) {
  x0 = Math.round(x0)
  y0 = Math.round(y0)
  x1 = Math.round(x1)
  y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    ctx.fillRect(x0, y0, thick, thick)
    if (x0 === x1 && y0 === y1) return
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}
