import type { Frame } from '../input'
import { VIEW_H, VIEW_W } from './background'
import { drawText } from './font'
import { PAL } from './pixels'
import { createRenderer, type Renderer } from './render'
import { World } from './world'

export const WIDTH = VIEW_W
export const HEIGHT = VIEW_H

export type Game = {
  step(frame: Frame): void
  draw(ctx: CanvasRenderingContext2D): void
  pause(): void
}

export type Scene = 'title' | 'play' | 'dead' | 'won'

// Updates before a death or win screen accepts a press, so a button still
// held from play does not skip it.
export const SCREEN_DELAY = 50

export type Candlelight = Game & {
  readonly scene: Scene
  readonly world: World
  readonly paused: boolean
  // The darkness layer as last drawn, or null before the first draw.
  readonly shade: HTMLCanvasElement | null
}

const clock = (updates: number) => {
  const s = Math.floor(updates / 60)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// The title, a run, and the screens that end it. A run is a fresh World, so
// restarting cannot leak state from the last one.
export function createCandlelight(): Candlelight {
  let world = new World()
  let scene: Scene = 'title'
  let paused = false
  let debug = false
  let render: Renderer | null = null

  const begin = () => {
    world = new World()
    scene = 'play'
    paused = false
  }

  return {
    get scene() {
      return scene
    },
    get world() {
      return world
    },
    get paused() {
      return paused
    },
    get shade() {
      return render?.shade ?? null
    },

    step({ held, pressed }) {
      world.drift()
      const go = pressed.has('a') || pressed.has('start')
      if (scene === 'title') {
        world.time++
        if (go) begin()
        return
      }
      if (scene === 'play') {
        if (pressed.has('start')) paused = !paused
        if (pressed.has('select')) debug = !debug
        if (paused) return
        world.step({ held, pressed })
        if (world.status !== 'play') scene = world.status
        return
      }
      // Death or victory: the world keeps settling behind the screen.
      world.step({ held: new Set(), pressed: new Set() })
      if (go && world.statusT > SCREEN_DELAY) begin()
    },

    draw(ctx) {
      render ??= createRenderer()
      render.draw(ctx, world, { debug, hud: scene === 'play' })
      const cx = VIEW_W / 2
      const blink = (world.time >> 5) % 2 === 0

      if (scene === 'title') {
        ctx.fillStyle = 'rgba(3,2,8,0.45)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        // An ember shadow under the title, flickering like a wick.
        const flicker = (world.time >> 3) % 5 === 0 ? 0 : 1
        drawText(ctx, 'CANDLELIGHT', cx + 1, 49 + flicker, PAL.r, 3)
        drawText(ctx, 'CANDLELIGHT', cx, 48, PAL.E, 3)
        drawText(ctx, 'SLAY THE FIVE SERPENTS', cx, 84, PAL.b)
        if (blink) drawText(ctx, 'PRESS JUMP TO BEGIN', cx, 128, PAL.B)
        return
      }
      if (scene === 'play' && paused) {
        ctx.fillStyle = 'rgba(11,10,16,0.7)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        drawText(ctx, 'PAUSED', cx, VIEW_H / 2 - 4, PAL.B)
        return
      }
      if (
        (scene === 'dead' || scene === 'won') &&
        world.statusT > SCREEN_DELAY
      ) {
        const fade = Math.min(1, (world.statusT - SCREEN_DELAY) / 30)
        ctx.fillStyle = `rgba(3,2,8,${0.75 * fade})`
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        if (scene === 'dead') {
          drawText(ctx, 'THE DARK TAKES YOU', cx, 62, PAL.C, 2)
          drawText(
            ctx,
            `${world.kills} OF ${world.total} SERPENTS SLAIN`,
            cx,
            92,
            PAL.b
          )
          if (blink) drawText(ctx, 'PRESS JUMP TO RISE AGAIN', cx, 128, PAL.B)
        } else {
          drawText(ctx, 'THE CANDLES HOLD', cx, 52, PAL.E, 2)
          drawText(ctx, `ALL ${world.total} SERPENTS SLAIN`, cx, 82, PAL.B)
          drawText(ctx, `TIME ${clock(world.clock)}`, cx, 96, PAL.b)
          if (blink) drawText(ctx, 'PRESS JUMP TO PLAY AGAIN', cx, 128, PAL.B)
        }
      }
    },

    pause() {
      if (scene === 'play') paused = true
    },
  }
}
