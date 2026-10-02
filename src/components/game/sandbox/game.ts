import type { Frame } from '../input'
import { VIEW_H, VIEW_W } from './background'
import { drawDefeat, drawVictory, ENDING } from './ending'
import { drawText } from './font'
import { SANDBOX_MAP } from './level'
import { PAL } from './pixels'
import { createRenderer, type Renderer } from './render'
import { drawTitle } from './title'
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

// Updates before a death or win screen accepts a press: once its word is
// up, so a button still held from play cannot skip it.
export const SCREEN_DELAY = ENDING.hold + ENDING.sweep + ENDING.text

// Deaths to the boss in a row before the defeat screen points at the hall's
// health candle, and what it says.
export const HINT_AFTER = 3
export const BOSS_HINT = [
  'THROW A TORCH AT THE CANDLE',
  'IN THE FAR CORNER FOR HEALTH',
]

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
  // Deaths to the boss in a row, since the last win or fresh run.
  readonly bossDeaths: number
  // The darkness layer as last drawn, or null until a run is first drawn:
  // the title never draws the world.
  readonly shade: HTMLCanvasElement | null
}

const clock = (updates: number) => {
  const s = Math.floor(updates / 60)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// The title, a run, and the screens that end it. A run is a fresh World, so
// restarting cannot leak state from the last one. Dying to the boss starts
// the fresh World at its gate, the serpents already slain.
export function createCandlelight(): Candlelight {
  let world = new World()
  let scene: Scene = 'title'
  let paused = false
  let about = false
  let debug = false
  let view = WIDTH
  let render: Renderer | null = null
  // Whether a run has been drawn yet: until then the title owns the screen.
  let drawn = false
  let bossDeaths = 0

  const begin = () => {
    const retry = scene === 'dead' && !!world.boss?.awake
    if (!retry) bossDeaths = 0
    world = retry
      ? new World(SANDBOX_MAP, 1, { atBoss: true, clock: world.clock })
      : new World()
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
    get bossDeaths() {
      return bossDeaths
    },
    get shade() {
      return drawn ? render!.shade : null
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
        if (world.status !== 'play') {
          scene = world.status
          if (scene === 'won') bossDeaths = 0
          else if (world.boss?.awake) bossDeaths++
        }
        return
      }
      // Death or victory: the world keeps settling behind the screen.
      world.step({ held: new Set(), pressed: new Set() })
      if (go && world.statusT > SCREEN_DELAY) begin()
    },

    draw(ctx) {
      const cx = view / 2
      // A proper title: its own screen, with no world behind it.
      if (scene === 'title') {
        drawTitle(ctx, world.time, view, VIEW_H)
        // Bake the run's art while the title is up, once its first frame
        // is on screen, so pressing start never stalls.
        if (!render && world.time > 1) {
          render = createRenderer()
          render.prepare(world)
        }
        return
      }
      render ??= createRenderer()
      if (!drawn) render.prepare(world)
      drawn = true
      render.draw(ctx, world, { debug, hud: scene === 'play' })
      if (scene === 'play' && paused) {
        ctx.fillStyle = 'rgba(11,10,16,0.7)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        drawText(ctx, 'PAUSED', cx, VIEW_H / 2 - 4, PAL.B)
        return
      }
      const t = world.statusT
      if (scene === 'dead') {
        const boss = !!world.boss?.awake
        drawDefeat(
          ctx,
          t,
          view,
          VIEW_H,
          world.killer,
          boss ? world.cause : '',
          boss ? 'PRESS JUMP TO TRY AGAIN' : 'PRESS JUMP TO RISE AGAIN',
          world.time,
          boss && bossDeaths >= HINT_AFTER ? BOSS_HINT : []
        )
      }
      if (scene === 'won')
        drawVictory(
          ctx,
          t,
          view,
          VIEW_H,
          world.boss
            ? 'YOU DEFEATED SOCIETY.'
            : `ALL ${world.total} SERPENTS SLAIN`,
          world.boss ? 'THIS MAKES YOU ENLIGHTENED.' : '',
          clock(world.clock),
          world.time
        )
    },

    pause() {
      if (scene === 'play') paused = true
    },
  }
}
