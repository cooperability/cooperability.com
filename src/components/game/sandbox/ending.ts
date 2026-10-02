import { drawOutlined } from './boss'
import { drawText } from './font'
import { hash, PAL } from './pixels'

// The end of a run, in updates since it ended: the world holds a moment,
// the transition sweeps (a wave of blood down the screen for a defeat, a
// fade to white for a victory), then the big word fades in.
export const ENDING = { hold: 30, sweep: 60, text: 30 }

export const WHITE = '#ffffff'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// 0 to 1 through the sweep, then through the text's fade.
export const sweepOf = (t: number) => clamp01((t - ENDING.hold) / ENDING.sweep)
const textOf = (t: number) =>
  clamp01((t - ENDING.hold - ENDING.sweep) / ENDING.text)

export function drawDefeat(
  ctx: CanvasRenderingContext2D,
  t: number,
  viewW: number,
  height: number,
  killer: string,
  cause: string,
  prompt: string,
  time: number
) {
  const u = sweepOf(t)
  if (u > 0) {
    // The front, with drips running ahead of it, moves from above the top
    // edge to below the bottom, so the wave covers the whole screen.
    const reach = 26
    const front = u * (height + reach * 2) - reach
    for (let x = 0; x < viewW; x += 2) {
      const band = x >> 1
      const wave =
        Math.sin(band * 0.38 + time * 0.15) * 3 +
        Math.sin(band * 0.13 - time * 0.06) * 4
      const drip =
        hash(band, 0, 40) > 0.62
          ? hash(band, 1, 40) * reach * Math.min(1, u * 3)
          : 0
      const bottom = Math.round(Math.min(height, front + wave + drip))
      if (bottom <= 0) continue
      ctx.fillStyle = PAL.r
      ctx.fillRect(x, 0, 2, bottom)
      // The wet leading edge, until it runs off the bottom.
      if (bottom >= height) continue
      ctx.fillStyle = PAL.R
      ctx.fillRect(x, bottom - 3, 2, 3)
      ctx.fillStyle = PAL.C
      ctx.fillRect(x, bottom - 1, 2, 1)
    }
  }
  const v = textOf(t)
  if (v <= 0) return
  // The blood darkens as the word comes up, so the word stands out.
  ctx.fillStyle = `rgba(11,10,16,${0.45 * v})`
  ctx.fillRect(0, 0, viewW, height)
  const wide = viewW >= 300
  ctx.globalAlpha = v
  drawOutlined(ctx, 'DEFEAT', viewW / 2, wide ? 42 : 48, PAL.B, wide ? 4 : 3)
  drawOutlined(ctx, `KILLED BY: ${killer}`, viewW / 2, 96, PAL.B, wide ? 2 : 1)
  if (cause) drawOutlined(ctx, cause, viewW / 2, wide ? 118 : 110, PAL.b)
  ctx.globalAlpha = 1
  if (v === 1 && (time >> 5) % 2 === 0)
    drawOutlined(ctx, prompt, viewW / 2, 146, PAL.B)
}

export function drawVictory(
  ctx: CanvasRenderingContext2D,
  t: number,
  viewW: number,
  height: number,
  subtitle: string,
  fine: string,
  clock: string,
  time: number
) {
  const u = sweepOf(t)
  if (u <= 0) return
  ctx.globalAlpha = u * u
  ctx.fillStyle = WHITE
  ctx.fillRect(0, 0, viewW, height)
  const v = textOf(t)
  ctx.globalAlpha = v
  if (v > 0) {
    const wide = viewW >= 300
    const big = wide ? 4 : 3
    const y = wide ? 40 : 46
    drawText(ctx, 'VICTORY', viewW / 2 + 1, y + 1, PAL.G, big)
    drawText(ctx, 'VICTORY', viewW / 2, y, PAL.d, big)
    drawText(ctx, subtitle, viewW / 2, wide ? 92 : 90, PAL.s, wide ? 2 : 1)
    if (fine) drawText(ctx, fine, viewW / 2, wide ? 112 : 104, PAL.t)
    drawText(ctx, `TIME ${clock}`, viewW / 2, 164, PAL.T)
  }
  ctx.globalAlpha = 1
  if (v === 1 && (time >> 5) % 2 === 0)
    drawText(ctx, 'PRESS JUMP TO PLAY AGAIN', viewW / 2, 142, PAL.t)
}
