import type { Button, ButtonSet, Frame } from '../input'
import {
  SCREEN_DELAY,
  WIDTH,
  HEIGHT,
  createCandlelight,
  type Candlelight,
  type Scene,
} from './game'
import { rig } from './hero'
import { SANDBOX_MAP, TILE } from './level'
import { PLAYER_H } from './player'
import { SNAKE } from './snake'
import { World } from './world'

// The beta-test script. Each scenario plays a fresh world through real
// inputs and returns null on a pass or what went wrong. Jest runs these on
// every commit; /demos/game?qa=1 runs them in the browser too, with frame
// timing and layout checks, and exposes the live game for a driver.

type Hold = Partial<Record<Button, boolean>>

// Read fresh: TypeScript would otherwise keep a narrowing across steps.
const sceneOf = (g: Candlelight): Scene => g.scene

const frame = (held: Hold = {}, pressed: Hold = {}): Frame => {
  const h: ButtonSet = new Set()
  const p: ButtonSet = new Set()
  for (const [b, on] of Object.entries(held)) if (on) h.add(b as Button)
  for (const [b, on] of Object.entries(pressed))
    if (on) {
      h.add(b as Button)
      p.add(b as Button)
    }
  return { held: h, pressed: p }
}

function play(
  w: { step(f: Frame): void },
  n: number,
  held: Hold = {},
  pressedFirst: Hold = {}
) {
  for (let i = 0; i < n; i++) w.step(frame(held, i === 0 ? pressedFirst : {}))
}

// A walled 24x10 room with a floor on row 9 and a spawn at column 3.
function room(edit: (g: string[][]) => void = () => {}) {
  const g: string[][] = Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 24 }, (_, x) =>
      y === 9 || x === 0 || x === 23 ? '#' : '.'
    )
  )
  g[8][3] = 'P'
  edit(g)
  return g.map((r) => r.join(''))
}

const FLOOR = 9 * TILE

export type Scenario = { name: string; run(): string | null }

export const SCENARIOS: Scenario[] = [
  {
    name: 'title: jump starts a run',
    run() {
      const g = createCandlelight()
      if (sceneOf(g) !== 'title') return `opened on ${g.scene}`
      play(g, 3)
      if (sceneOf(g) !== 'title') return 'left the title without a press'
      play(g, 1, {}, { a: true })
      return sceneOf(g) === 'play' ? null : `jump led to ${g.scene}`
    },
  },
  {
    name: 'spawn: no snake is close enough to notice the player at the start',
    run() {
      const w = new World()
      const p = w.player
      const near = w.snakes.filter(
        (s) =>
          Math.hypot(s.x + s.w / 2 - (p.x + p.w / 2), s.y + s.h - (p.y + p.h)) <
          SNAKE.notice * 1.2
      )
      return near.length
        ? `${near.length} snake(s) within reach of spawn`
        : null
    },
  },
  {
    name: 'map: left alone for a minute, every snake stays inside the map',
    run() {
      const w = new World()
      for (let i = 0; i < 3600; i++) {
        w.step(frame())
        for (const s of w.snakes)
          if (s.y < 0 || s.y + s.h > w.level.pixelHeight)
            return `a snake left the map at ${i} (y ${s.y.toFixed(0)}, ${s.state})`
      }
      return null
    },
  },
  {
    name: 'walk: the lifted foot swings forward, the planted foot slides back',
    run() {
      const w = new World(room())
      let samples = 0
      let bad = 0
      let prev = rig(w.view())
      for (let i = 0; i < 120; i++) {
        w.step(frame({ right: true }))
        const r = rig(w.view())
        if (w.player.pose === 'run')
          for (const f of [0, 1]) {
            const dx = r.feet[f].x - prev.feet[f].x
            if (dx === 0) continue
            samples++
            if (r.feet[f].y < 0 ? dx < 0 : dx > 0) bad++
          }
        prev = r
      }
      return samples > 20 && bad / samples < 0.1
        ? null
        : `${bad} of ${samples} foot moves went the wrong way`
    },
  },
  {
    name: 'walk: a full stride takes at least 24 updates at top speed',
    run() {
      const w = new World(room())
      play(w, 40, { right: true })
      const before = w.runPhase
      play(w, 60, { right: true })
      const perStride = (60 * 2 * Math.PI) / (w.runPhase - before)
      return perStride >= 24
        ? null
        : `stride is ${perStride.toFixed(1)} updates`
    },
  },
  {
    name: 'beams: the upper cloister beam is reachable from the lower one',
    run() {
      const w = new World()
      const lower = SANDBOX_MAP.findIndex((r) => r.slice(4, 8) === '====')
      const upper = SANDBOX_MAP.findIndex((r) => r.slice(6, 10) === '====')
      if (lower < 0 || upper < 0 || upper === lower)
        return 'cloister beams not found'
      const p = w.player
      p.x = 6 * TILE + 3
      p.y = lower * TILE - PLAYER_H
      play(w, 10)
      if (p.y + p.h !== lower * TILE) return 'could not stand on the lower beam'
      play(w, 50, { a: true }, { a: true })
      play(w, 30)
      return p.y + p.h === upper * TILE && p.onGround
        ? null
        : `ended with feet at ${p.y + p.h}, upper beam top is ${upper * TILE}`
    },
  },
  {
    name: 'attack: up + attack cuts a snake clinging above the head',
    run() {
      const w = new World(
        room((g) => {
          for (let x = 1; x < 12; x++) g[7][x] = '='
          g[6][4] = 's'
        })
      )
      const s = w.snakes[0]
      play(w, 2)
      play(w, 20, { up: true }, { up: true, x: true })
      return s.hp < SNAKE.hp ? null : 'the overhead swing missed'
    },
  },
  {
    name: 'torch: the throw barely rises and lands ahead and below',
    run() {
      const w = new World(
        room((g) => {
          for (let y = 6; y < 9; y++) for (let x = 1; x < 7; x++) g[y][x] = '#'
          // At the lip of a three-tile ledge.
          g[8][3] = '.'
          g[5][6] = 'P'
        })
      )
      play(w, 10)
      play(w, 1, {}, { y: true })
      const t = w.torches[0]
      if (!t) return 'no torch was thrown'
      const y0 = t.y
      let top = t.y
      for (let i = 0; i < 90 && !t.landed; i++) {
        play(w, 1)
        top = Math.min(top, t.y)
      }
      if (y0 - top > 6) return `rose ${(y0 - top).toFixed(1)}px`
      if (!t.landed) return 'never landed'
      if (t.y + t.h !== FLOOR)
        return `landed at ${t.y + t.h}, not the floor below`
      if (t.x < w.player.x + 16) return 'landed behind the player'
      return null
    },
  },
  {
    name: 'torch: one throw per second',
    run() {
      const w = new World(room())
      play(w, 5)
      for (let i = 0; i < 60; i++) play(w, 1, {}, { y: true })
      return w.torches.length === 1
        ? null
        : `${w.torches.length} torches in 60 updates`
    },
  },
  {
    name: 'torch: a hit sets a snake burning for 2 of its 3 HP over 1.5s',
    run() {
      const w = new World(room((g) => (g[8][6] = 's')))
      play(w, 2)
      play(w, 1, {}, { y: true })
      const s = w.snakes[0]
      for (let i = 0; i < 30 && s.burn === 0; i++) play(w, 1)
      if (s.burn === 0) return 'the torch never lit the snake'
      // Out of reach, so only the fire does damage.
      w.player.x = 20 * TILE
      play(w, SNAKE.burnFrames + 2)
      return s.hp === SNAKE.hp - 2 && s.alive
        ? null
        : `hp ${s.hp}, alive ${s.alive}`
    },
  },
  {
    name: 'snake: strikes a player standing close, once per mercy window',
    run() {
      const w = new World(room((g) => (g[8][5] = 's')))
      let first = -1
      for (let i = 0; i < 180 && first < 0; i++) {
        play(w, 1)
        if (w.hp < 5) first = i
      }
      if (first < 0) return 'never bit'
      play(w, 40)
      return w.hp === 4 ? null : `hp ${w.hp} after one mercy window`
    },
  },
  {
    name: 'snake: coils, then launches at a player in range',
    run() {
      const w = new World(room((g) => (g[8][7] = 's')))
      const seen = new Set<string>()
      for (let i = 0; i < 200; i++) {
        play(w, 1)
        seen.add(w.snakes[0].state)
      }
      return seen.has('coil') && seen.has('lunge')
        ? null
        : `states: ${[...seen].join(', ')}`
    },
  },
  {
    name: 'snake: climbs a wall toward a player above',
    run() {
      const w = new World(
        room((g) => {
          for (let y = 6; y < 9; y++)
            for (let x = 12; x < 23; x++) g[y][x] = '#'
          g[8][3] = '.'
          g[5][18] = 'P'
          g[8][4] = 's'
        })
      )
      const s = w.snakes[0]
      let climbed = false
      let top = Infinity
      for (let i = 0; i < 400; i++) {
        play(w, 1)
        if (s.state === 'climb') climbed = true
        top = Math.min(top, s.y + s.h)
      }
      return climbed && top <= 6 * TILE
        ? null
        : `climbed ${climbed}, highest feet ${top}`
    },
  },
  {
    name: 'win: the shipped map has five snakes, and killing them wins',
    run() {
      const g = createCandlelight()
      play(g, 1, {}, { a: true })
      if (g.world.total !== 5) return `${g.world.total} snakes on the map`
      for (const s of g.world.snakes) s.hit(SNAKE.hp, 1)
      play(g, SNAKE.dieFrames + 5)
      if (sceneOf(g) !== 'won') return `scene is ${g.scene} after five kills`
      play(g, 1, {}, { a: true })
      if (sceneOf(g) !== 'won') return 'the win screen skipped on a held button'
      play(g, SCREEN_DELAY)
      play(g, 1, {}, { a: true })
      return sceneOf(g) === 'play' && g.world.kills === 0
        ? null
        : 'play again did not start fresh'
    },
  },
  {
    name: 'win: the shipped map can be won with the sword alone',
    run() {
      const g = createCandlelight()
      play(g, 1, {}, { a: true })
      const w = g.world
      for (let i = 0; i < 20000 && sceneOf(g) === 'play'; i++) {
        const target = w.snakes.find((s) => s.alive)
        if (target && i % 40 === 0) {
          // Stand just beside the snake, facing it, on its level.
          const p = w.player
          p.x = target.x - p.w - 2
          p.y = target.y + target.h - PLAYER_H
          p.vx = 0
          p.vy = 0
          p.facing = 1
        }
        // Only the sword is under test here, not survival.
        w.hp = 5
        const above = target ? target.y + target.h < w.player.y + 4 : false
        g.step(frame({ up: above }, i % 12 === 0 ? { x: true } : {}))
      }
      return sceneOf(g) === 'won'
        ? null
        : `${w.kills} of ${w.total} killed, scene ${g.scene}`
    },
  },
  {
    name: 'snake: coils on a wall and launches off it at the player',
    run() {
      const w = new World(
        room((g) => {
          for (let y = 1; y < 9; y++) g[y][12] = '#'
          g[8][11] = 's'
          g[8][3] = '.'
          g[8][7] = 'P'
        })
      )
      const s = w.snakes[0]
      // Put it on the wall, level with the player's head.
      s.wall = 1
      s.state = 'climb'
      s.facing = 1
      s.y = 8 * TILE - 20
      let coiledOnWall = false
      for (let i = 0; i < 200; i++) {
        play(w, 1)
        const state: string = s.state
        if (state === 'coil' && s.wall) coiledOnWall = true
        if (coiledOnWall && state === 'lunge')
          return s.vx < 0 ? null : 'launched toward the wall'
      }
      return `coiled on the wall ${coiledOnWall}, state ${s.state}`
    },
  },
  {
    name: 'pause: start freezes the run and start again resumes it',
    run() {
      const g = createCandlelight()
      play(g, 1, {}, { a: true })
      play(g, 1, {}, { start: true })
      const x = g.world.player.x
      const t = g.world.clock
      play(g, 60, { right: true })
      if (g.world.player.x !== x || g.world.clock !== t)
        return 'the world moved while paused'
      play(g, 1, {}, { start: true })
      play(g, 30, { right: true })
      return g.world.player.x > x ? null : 'did not resume'
    },
  },
  {
    name: 'death: at 0 HP the run ends, and rising again restores everything',
    run() {
      const g = createCandlelight()
      play(g, 1, {}, { a: true })
      const w = g.world
      w.hp = 1
      const s = w.snakes[0]
      w.player.x = s.x + 18
      w.player.y = s.y + s.h - PLAYER_H
      for (let i = 0; i < 240 && sceneOf(g) === 'play'; i++) play(g, 1)
      if (sceneOf(g) !== 'dead') return `scene is ${g.scene} at hp ${w.hp}`
      play(g, SCREEN_DELAY + 2)
      play(g, 1, {}, { a: true })
      const fresh = g.world
      return sceneOf(g) === 'play' &&
        fresh.hp === 5 &&
        fresh.kills === 0 &&
        fresh !== w
        ? null
        : 'restart did not reset the run'
    },
  },
  {
    name: 'hit-pause: a jump pressed during it still happens',
    run() {
      const w = new World(room())
      play(w, 5)
      w.hitPause = 4
      play(w, 1, {}, { a: true })
      play(w, 6, { a: true })
      return w.player.vy < 0 ? null : 'the jump was dropped'
    },
  },
  {
    name: 'soak: 20,000 random updates stay finite and out of the walls',
    run() {
      const g = createCandlelight()
      let seed = 7
      const rand = () =>
        (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
      const buttons: Button[] = [
        'left',
        'right',
        'up',
        'down',
        'a',
        'b',
        'x',
        'y',
      ]
      let held: Hold = {}
      for (let i = 0; i < 20000; i++) {
        if (i % 12 === 0) {
          held = {}
          for (const b of buttons) if (rand() < 0.3) held[b] = true
        }
        const pressed: Hold = {}
        for (const b of buttons) if (held[b] && rand() < 0.2) pressed[b] = true
        if (sceneOf(g) !== 'play' && rand() < 0.05) pressed.a = true
        g.step(frame(held, pressed))
        const w = g.world
        const p = w.player
        if (![p.x, p.y, p.vx, p.vy].every(Number.isFinite))
          return `player NaN at ${i}`
        if (p.pose !== 'climb' && w.level.boxHitsSolid(p.x, p.y, p.w, p.h))
          return `player inside a wall at ${i} (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.pose})`
        for (const s of w.snakes) {
          if (!Number.isFinite(s.x) || !Number.isFinite(s.y))
            return `snake NaN at ${i}`
          if (
            s.alive &&
            s.state !== 'climb' &&
            w.level.boxHitsSolid(s.x, s.y, s.w, s.h)
          )
            return `snake inside a wall at ${i} (${s.state})`
          if (
            s.x < 0 ||
            s.x > w.level.pixelWidth ||
            s.y < 0 ||
            s.y > w.level.pixelHeight
          )
            return `snake left the map at ${i}`
        }
      }
      return null
    },
  },
]

export type Check = { name: string; pass: boolean; detail: string }

export function runScenarios(): Check[] {
  return SCENARIOS.map((s) => {
    try {
      const fail = s.run()
      return { name: s.name, pass: fail === null, detail: fail ?? 'ok' }
    } catch (e) {
      return { name: s.name, pass: false, detail: `threw ${String(e)}` }
    }
  })
}

// ---- Browser only: timing, layout, and a handle for a driver. ----

export type QAReport = {
  done: boolean
  viewport: { width: number; height: number; dpr: number; touch: boolean }
  scenarios: Check[]
  layout: Check[]
  light: Check[]
  cost: { stepUs: number; drawUs: number }
  frames: { count: number; p50: number; p95: number; max: number; slow: number }
  pass: boolean
}

const percentile = (xs: number[], p: number) =>
  xs.length
    ? [...xs].sort((a, b) => a - b)[
        Math.min(xs.length - 1, Math.floor(xs.length * p))
      ]
    : 0

function layoutChecks(canvas: HTMLCanvasElement, root: HTMLElement): Check[] {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const c = canvas.getBoundingClientRect()
  const checks: Check[] = []
  const add = (name: string, pass: boolean, detail: string) =>
    checks.push({ name, pass, detail })
  add(
    'screen fits the viewport',
    c.left >= -1 && c.top >= -1 && c.right <= vw + 1 && c.bottom <= vh + 1,
    `${Math.round(c.width)}x${Math.round(c.height)} at ${Math.round(c.left)},${Math.round(c.top)} in ${vw}x${vh}`
  )
  const scale = c.width / WIDTH
  add(
    'pixels are square and whole where there is room',
    Math.abs(c.height / HEIGHT - scale) < 0.01 &&
      (scale < 2 || Math.abs(scale - Math.round(scale)) < 0.01),
    `scale ${scale.toFixed(2)}`
  )
  add(
    'no horizontal scroll',
    document.documentElement.scrollWidth <= vw + 1,
    `scrollWidth ${document.documentElement.scrollWidth}`
  )
  // The HUD is the top 20 game pixels of the screen.
  const hud = { top: c.top, bottom: c.top + (20 * c.height) / HEIGHT }
  for (const el of root.querySelectorAll<HTMLElement>('button, a')) {
    const r = el.getBoundingClientRect()
    if (!r.width) continue
    const covers =
      r.left < c.right &&
      r.right > c.left &&
      r.top < hud.bottom &&
      r.bottom > hud.top
    add(
      `"${el.textContent?.trim()}" leaves the HUD clear`,
      !covers,
      `${Math.round(r.left)},${Math.round(r.top)}`
    )
  }
  if (root.dataset.mode === 'touch') {
    for (const sel of ['[class*="dpad"]', '[class*="face"]']) {
      const el = root.querySelector<HTMLElement>(sel)
      const r = el?.getBoundingClientRect()
      if (!r) {
        add(`${sel} present`, false, 'missing')
        continue
      }
      add(
        `${sel} is thumb-sized`,
        r.width >= 88 && r.height >= 88,
        `${Math.round(r.width)}x${Math.round(r.height)}`
      )
      add(
        `${sel} stays on screen`,
        r.left >= 0 && r.right <= vw && r.bottom <= vh,
        `${Math.round(r.left)}..${Math.round(r.right)}, bottom ${Math.round(r.bottom)}`
      )
      const overlap =
        Math.max(0, Math.min(r.right, c.right) - Math.max(r.left, c.left)) *
        Math.max(0, Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top))
      add(
        `${sel} leaves the screen clear`,
        overlap / (c.width * c.height) < 0.05,
        `${Math.round((overlap / (c.width * c.height)) * 100)}% of the screen covered`
      )
    }
  }
  return checks
}

// How much of the scene shows through the dark ahead of the visor, measured
// on the darkness layer itself, in open floor with no candle nearby.
function lightChecks(): Check[] {
  const g = createCandlelight()
  play(g, 1, {}, { a: true })
  const w = g.world
  w.snakes.length = 0
  const p = w.player
  p.x = 19 * TILE
  p.y = 6 * TILE - PLAYER_H
  // Facing away from the moon, which sits in the top right of the screen.
  p.facing = -1
  play(g, 240)
  const off = document.createElement('canvas')
  off.width = WIDTH
  off.height = HEIGHT
  g.draw(off.getContext('2d')!)
  const shade = g.shade!.getContext('2d')!
  const px = Math.round(p.x + p.w / 2 - w.camX)
  const py = Math.round(p.y + 6 - w.camY)
  const seen = (ahead: number) => {
    const d = shade.getImageData(px + p.facing * ahead - 2, py - 2, 5, 5).data
    let a = 0
    for (let i = 3; i < d.length; i += 4) a += d[i]
    return +(1 - a / 25 / 255).toFixed(2)
  }
  const one = seen(26)
  const two = seen(52)
  const far = seen(104)
  return [
    {
      name: 'full light within one body length',
      pass: one >= 0.9,
      detail: `${one} of full brightness`,
    },
    {
      name: 'still clear at two body lengths',
      pass: two >= 0.7,
      detail: `${two}`,
    },
    {
      name: 'half the ambient light past four body lengths',
      pass: Math.abs(far - 0.5) <= 0.05,
      detail: `${far}`,
    },
  ]
}

function measureCost() {
  const g = createCandlelight()
  play(g, 1, {}, { a: true })
  const off = document.createElement('canvas')
  off.width = WIDTH
  off.height = HEIGHT
  const ctx = off.getContext('2d')!
  g.draw(ctx)
  let t = performance.now()
  play(g, 600, { right: true })
  const stepUs = ((performance.now() - t) / 600) * 1000
  t = performance.now()
  for (let i = 0; i < 200; i++) g.draw(ctx)
  const drawUs = ((performance.now() - t) / 200) * 1000
  return { stepUs: Math.round(stepUs), drawUs: Math.round(drawUs) }
}

declare global {
  interface Window {
    __candlelight?: {
      game: Candlelight
      snapshot(): unknown
      killAll(): void
      setHp(hp: number): void
    }
    __candlelightQA?: QAReport
  }
}

export function exposeQA(
  game: Candlelight,
  canvas: HTMLCanvasElement,
  root: HTMLElement
) {
  window.__candlelight = {
    game,
    snapshot() {
      const w = game.world
      const p = w.player
      return {
        scene: game.scene,
        paused: game.paused,
        hp: w.hp,
        kills: w.kills,
        total: w.total,
        torches: w.torches.length,
        camera: { x: Math.round(w.camX), y: Math.round(w.camY) },
        player: {
          x: Math.round(p.x),
          y: Math.round(p.y),
          pose: p.pose,
          facing: p.facing,
        },
        snakes: w.snakes.map((s) => ({
          x: Math.round(s.x),
          y: Math.round(s.y),
          state: s.state,
          hp: s.hp,
          burn: s.burn,
        })),
        mode: root.dataset.mode,
      }
    },
    killAll() {
      for (const s of game.world.snakes) s.hit(SNAKE.hp, 1)
    },
    setHp(hp: number) {
      game.world.hp = hp
    },
  }

  const report: QAReport = {
    done: false,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
      touch: navigator.maxTouchPoints > 0,
    },
    scenarios: [],
    layout: [],
    light: [],
    cost: { stepUs: 0, drawUs: 0 },
    frames: { count: 0, p50: 0, p95: 0, max: 0, slow: 0 },
    pass: false,
  }
  window.__candlelightQA = report

  // The live loop's frame gaps are sampled first, while nothing else runs,
  // so the scenarios' own work and garbage cannot show up as hitches.
  const gaps: number[] = []
  let last = 0
  const started = performance.now()
  const sample = (now: number) => {
    if (last) gaps.push(now - last)
    last = now
    if (now - started < 3500) {
      requestAnimationFrame(sample)
      return
    }
    report.layout = layoutChecks(canvas, root)
    // Cost first, on a quiet heap, then the checks that make garbage.
    report.cost = measureCost()
    report.light = lightChecks()
    report.scenarios = runScenarios()
    report.frames = {
      count: gaps.length,
      p50: +percentile(gaps, 0.5).toFixed(1),
      p95: +percentile(gaps, 0.95).toFixed(1),
      max: +Math.max(0, ...gaps).toFixed(1),
      // Longer than two 60 Hz frames: a visible hitch.
      slow: gaps.filter((g) => g > 34).length,
    }
    report.pass =
      report.scenarios.every((c) => c.pass) &&
      report.layout.every((c) => c.pass) &&
      report.light.every((c) => c.pass) &&
      report.frames.slow <= Math.ceil(report.frames.count * 0.02)
    report.done = true
    console.info('[candlelight-qa]', JSON.stringify(report))
  }
  requestAnimationFrame(sample)
}
