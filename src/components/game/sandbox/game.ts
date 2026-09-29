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

// The square view the portrait handheld shows: the full height, cropped.
export const SQUARE = VIEW_H

export type Scene = 'title' | 'play' | 'dead' | 'won'

// Updates before a death or win screen accepts a press, so a button still
// held from play does not skip it.
export const SCREEN_DELAY = 50

export type Candlelight = Game & {
  readonly scene: Scene
  readonly world: World
  readonly paused: boolean
  // The About panel, opened with select. The page draws it over the screen.
  readonly about: boolean
  closeAbout(): void
  // Width of the view in game pixels: WIDTH, or SQUARE on a portrait phone.
  view: number
  // Hitbox boxes, for the beta script.
  debug: boolean
  // Launched from the home screen, so the title skips the install steps.
  standalone: boolean
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
  let about = false
  let debug = false
  let view = WIDTH
  let standalone = false
  let render: Renderer | null = null

  const begin = () => {
    world = new World()
    world.viewW = view
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
    get about() {
      return about
    },
    closeAbout() {
      about = false
    },
    get view() {
      return view
    },
    set view(w) {
      view = w
      world.viewW = w
    },
    get debug() {
      return debug
    },
    set debug(on) {
      debug = on
    },
    get standalone() {
      return standalone
    },
    set standalone(on) {
      standalone = on
    },
    get shade() {
      return render?.shade ?? null
    },

    step({ held, pressed }) {
      world.drift()
      // Any button closes the About panel, and does nothing else.
      if (about) {
        if (pressed.size) about = false
        return
      }
      if (pressed.has('select')) {
        about = true
        if (scene === 'play') paused = true
        return
      }
      const go = pressed.has('a') || pressed.has('start')
      if (scene === 'title') {
        world.time++
        if (pressed.size) begin()
        return
      }
      if (scene === 'play') {
        if (pressed.has('start')) paused = !paused
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
      const cx = view / 2
      // The narrow view halves the big type so every line still fits.
      const big = view < WIDTH ? 1 : 2
      const blink = (world.time >> 5) % 2 === 0

      if (scene === 'title') {
        ctx.fillStyle = 'rgba(3,2,8,0.45)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        // An ember shadow under the title, flickering like a wick.
        const flicker = (world.time >> 3) % 5 === 0 ? 0 : 1
        drawText(ctx, 'CANDLELIGHT', cx + 1, 41 + flicker, PAL.r, big + 1)
        drawText(ctx, 'CANDLELIGHT', cx, 40, PAL.E, big + 1)
        drawText(ctx, 'SLAY THE FIVE SERPENTS', cx, 72, PAL.b)
        if (blink) drawText(ctx, 'PRESS ANY BUTTON', cx, 96, PAL.B)
        // Installed already: nothing left to explain.
        if (!standalone) {
          drawText(ctx, 'ON IPHONE: TAP SHARE THEN', cx, 128, PAL.T)
          drawText(ctx, 'ADD TO HOME SCREEN TO PLAY', cx, 138, PAL.T)
          drawText(ctx, 'FULL SCREEN AND OFFLINE', cx, 148, PAL.T)
        }
        drawText(ctx, 'SELECT: ABOUT', cx, 166, PAL.t)
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
          drawText(ctx, 'THE DARK TAKES YOU', cx, 62, PAL.C, big)
          drawText(
            ctx,
            `${world.kills} OF ${world.total} SERPENTS SLAIN`,
            cx,
            92,
            PAL.b
          )
          if (blink) drawText(ctx, 'PRESS JUMP TO RISE AGAIN', cx, 128, PAL.B)
        } else {
          drawText(ctx, 'THE CANDLES HOLD', cx, 52, PAL.E, big)
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
