import { VIEW_H, VIEW_W } from './background'
import { bakePixels, context, dither, makeCanvas, type Canvas } from './pixels'

// Light sprites, baked once and shared by every darkness layer.
const sprites = new Map<string, Canvas>()

function sprite(radius: number, core: number, side: -1 | 0 | 1) {
  const key = `${radius}|${core}|${side}`
  let img = sprites.get(key)
  if (!img) sprites.set(key, (img = bakeLight(radius, core, side)))
  return img
}

// Bakes a light ahead of its first use, so that frame does not stall.
export function warmLight(radius: number, core: number, side: -1 | 0 | 1 = 0) {
  sprite(radius, core, side)
}

// A dark layer over the whole frame with holes cut where light falls. Each
// light is a baked sprite drawn with destination-out, so overlapping lights
// add up and anything outside every light stays near black.
export class Darkness {
  readonly canvas = makeCanvas(VIEW_W, VIEW_H)
  private ctx = context(this.canvas)

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
    this.ctx.globalAlpha = Math.min(1, strength)
    this.ctx.drawImage(
      sprite(radius, core, side),
      Math.round(x) - radius,
      Math.round(y) - radius
    )
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
  return bakePixels(size, size, (x, y) => {
    const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
    if (d >= 1) return null
    let v = d < core ? 1 : 1 - (d - core) / (1 - core)
    // A half light fades in over four pixels either side of its edge.
    if (side)
      v *= Math.max(0, Math.min(1, ((x - radius + 0.5) * side) / 4 + 0.5))
    const q = Math.min(STEPS, Math.floor(v * STEPS + dither(x, y)))
    return q > 0 ? `rgba(0,0,0,${q / STEPS})` : null
  })
}
