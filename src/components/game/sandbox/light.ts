import { VIEW_H, VIEW_W } from './background'
import { context, dither, makeCanvas, type Canvas } from './pixels'

// A dark layer over the whole frame with holes cut where light falls. Each
// light is a baked sprite drawn with destination-out, so overlapping lights
// add up and anything outside every light stays near black.
export class Darkness {
  readonly canvas = makeCanvas(VIEW_W, VIEW_H)
  private ctx = context(this.canvas)
  private sprites = new Map<string, Canvas>()

  begin(color: string) {
    const ctx = this.ctx
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, VIEW_W, VIEW_H)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    ctx.globalCompositeOperation = 'destination-out'
  }

  // `core` is the fraction of the radius at full strength. `side` 1 or -1
  // lights only that half, right or left of x.
  light(
    x: number,
    y: number,
    radius: number,
    core: number,
    strength = 1,
    side: -1 | 0 | 1 = 0
  ) {
    if (strength <= 0) return
    const key = `${radius}|${core}|${side}`
    let img = this.sprites.get(key)
    if (!img) this.sprites.set(key, (img = bakeLight(radius, core, side)))
    this.ctx.globalAlpha = Math.min(1, strength)
    this.ctx.drawImage(img, Math.round(x) - radius, Math.round(y) - radius)
  }

  // `source-atop` darkens only what is already drawn on the target.
  end(
    target: CanvasRenderingContext2D,
    op: GlobalCompositeOperation = 'source-over'
  ) {
    this.ctx.globalAlpha = 1
    this.ctx.globalCompositeOperation = 'source-over'
    target.globalCompositeOperation = op
    target.drawImage(this.canvas, 0, 0)
    target.globalCompositeOperation = 'source-over'
  }
}

// Four alpha steps with ordered dither between them, so the edge of the
// light breaks up into pixels instead of a smooth gradient.
const STEPS = 4

function bakeLight(radius: number, core: number, side: number): Canvas {
  const size = radius * 2
  const c = makeCanvas(size, size)
  const ctx = context(c)
  const levels: [number, number][][] = Array.from(
    { length: STEPS + 1 },
    () => []
  )
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
      if (d >= 1) continue
      let v = d < core ? 1 : 1 - (d - core) / (1 - core)
      // A half light fades in over four pixels either side of its edge.
      if (side)
        v *= Math.max(0, Math.min(1, ((x - radius + 0.5) * side) / 4 + 0.5))
      const q = Math.min(STEPS, Math.floor(v * STEPS + dither(x, y)))
      if (q > 0) levels[q].push([x, y])
    }
  levels.forEach((pixels, q) => {
    ctx.fillStyle = `rgba(0,0,0,${q / STEPS})`
    for (const [x, y] of pixels) ctx.fillRect(x, y, 1, 1)
  })
  return c
}
