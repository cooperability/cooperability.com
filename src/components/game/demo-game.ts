import { BUTTONS, type ButtonSet, type Frame } from './input'

export const WIDTH = 160
export const HEIGHT = 144

// Original DMG shades, lightest first.
const SHADES = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f']

export type Game = {
  step(frame: Frame): void
  draw(ctx: CanvasRenderingContext2D): void
  pause(): void
}

// Placeholder until the real game lands: a sprite on the D-pad, A cycles its
// shade, B recentres it, Start pauses, and the bottom row lights up whatever
// is held, so every input path can be checked on a device.
export function createDemoGame(): Game {
  let x = WIDTH / 2 - 4
  let y = HEIGHT / 2 - 4
  let shade = 3
  let paused = false
  let held: ButtonSet = new Set()

  return {
    step(frame) {
      held = frame.held
      if (frame.pressed.has('start')) paused = !paused
      if (paused) return
      if (held.has('left')) x = Math.max(0, x - 1)
      if (held.has('right')) x = Math.min(WIDTH - 8, x + 1)
      if (held.has('up')) y = Math.max(0, y - 1)
      if (held.has('down')) y = Math.min(HEIGHT - 20, y + 1)
      if (frame.pressed.has('a')) shade = shade === 1 ? 3 : shade - 1
      if (frame.pressed.has('b')) {
        x = WIDTH / 2 - 4
        y = HEIGHT / 2 - 4
      }
    },
    draw(ctx) {
      ctx.fillStyle = SHADES[0]
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = SHADES[shade]
      ctx.fillRect(x, y, 8, 8)

      BUTTONS.forEach((button, i) => {
        ctx.fillStyle = held.has(button) ? SHADES[3] : SHADES[1]
        ctx.fillRect(8 + i * 19, HEIGHT - 10, 11, 6)
      })

      if (paused) {
        ctx.fillStyle = SHADES[3]
        ctx.fillRect(0, HEIGHT / 2 - 10, WIDTH, 20)
        ctx.fillStyle = SHADES[0]
        ctx.font = '8px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2)
      }
    },
    pause() {
      paused = true
    },
  }
}
