import type { Frame } from '../input'
import {
  bakeBackdrop,
  drawBackdrop,
  VIEW_H,
  VIEW_W,
  type Backdrop,
} from './background'
import { drawHero, Scarf, type HeroView } from './hero'
import { Level, SANDBOX_MAP } from './level'
import {
  bake,
  context,
  dither,
  hash,
  makeCanvas,
  PAL,
  type Canvas,
} from './pixels'
import { Player, type Box, type PlayerEvent } from './player'
import { bakeTiles } from './tiles'

export const WIDTH = VIEW_W
export const HEIGHT = VIEW_H

export type Game = {
  step(frame: Frame): void
  draw(ctx: CanvasRenderingContext2D): void
  pause(): void
}

const URN = [
  '...kkkkkk...',
  '..kBBBBBbk..',
  '...kbbbbk...',
  '..kbBBBbbk..',
  '.kbBBbbbbbk.',
  'kbBBbbbbbbsk',
  'krRRRRRRRrrk',
  'kbBbbbbbbbsk',
  'kbBbbbbbbssk',
  '.kbbbbbbbsk.',
  '.kbbbbbbssk.',
  '..kbbbbssk..',
  '..kkssssk...',
  '...kkkkkk...',
]

const CANDLES = [
  '..B......',
  '.BBb.....',
  '.BBb..B..',
  '.Bbb.BBb.',
  '.Bbb.Bbb.',
  'gGGGgBbb.',
  '.ggggGGg.',
  '..kg.gg..',
  '.gGGGGGg.',
  'kgggggggk',
]

type Urn = { x: number; y: number; broken: boolean; respawn: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  gravity: number
}
type Ghost = { view: HeroView; life: number }
type Mote = { x: number; y: number; ember: boolean; phase: number }

const URN_RESPAWN = 300
const HIT_PAUSE = 4

// A soft ember glow, dithered to stay in pixel style. Drawn additively.
function bakeGlow(radius: number, color: string): Canvas {
  const size = radius * 2
  const c = makeCanvas(size, size)
  const ctx = context(c)
  ctx.fillStyle = color
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
      if (d < 1 && (1 - d) * (1 - d) > dither(x, y)) ctx.fillRect(x, y, 1, 1)
    }
  return c
}

// Darkens the frame's edges so the eye settles on the middle.
function bakeVignette(): Canvas {
  const c = makeCanvas(VIEW_W, VIEW_H)
  const ctx = context(c)
  ctx.fillStyle = PAL.k
  for (let y = 0; y < VIEW_H; y++)
    for (let x = 0; x < VIEW_W; x++) {
      const dx = (x - VIEW_W / 2) / (VIEW_W / 2)
      const dy = (y - VIEW_H / 2) / (VIEW_H / 2)
      const d = Math.hypot(dx * 0.8, dy)
      if (d > 0.75 && (d - 0.75) * 1.6 > dither(x, y)) ctx.fillRect(x, y, 1, 1)
    }
  return c
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export function createSandbox(): Game {
  const level = new Level(SANDBOX_MAP)
  const player = new Player(level)
  const scarf = new Scarf()
  const tiles = bakeTiles(level)
  const backdrop: Backdrop = bakeBackdrop()
  const urnArt = bake(URN)
  const candleArt = bake(CANDLES)
  const candleGlow = bakeGlow(26, 'rgba(255,140,60,0.16)')
  const eyeGlow = bakeGlow(6, 'rgba(255,170,80,0.35)')
  const vignette = bakeVignette()

  const urns: Urn[] = level.props
    .filter((p) => p.kind === 'urn')
    .map((p) => ({ x: p.x, y: p.y, broken: false, respawn: 0 }))
  const candles = level.props.filter((p) => p.kind === 'candle')

  let particles: Particle[] = []
  let ghosts: Ghost[] = []
  const motes: Mote[] = Array.from({ length: 48 }, (_, i) => ({
    x: hash(i, 1, 40) * VIEW_W,
    y: hash(i, 2, 40) * VIEW_H,
    ember: hash(i, 3, 40) > 0.82,
    phase: hash(i, 4, 40) * 6.28,
  }))

  let time = 0
  let paused = false
  let debug = false
  let hitPause = 0
  let shake = 0
  let squash = 0
  let runPhase = 0
  let camX = 0
  let camY = level.pixelHeight - VIEW_H
  const hitThisSwing = new Set<Urn>()

  const view = (): HeroView => ({
    x: player.x,
    y: player.y,
    w: player.w,
    h: player.h,
    vx: player.vx,
    vy: player.vy,
    facing: player.facing,
    wall: player.wall,
    actionProgress: player.actionProgress,
    pose: player.pose,
    time,
    runPhase,
    squash,
  })

  const puff = (
    x: number,
    y: number,
    count: number,
    spread: number,
    color = PAL.t,
    lift = 0.4
  ) => {
    for (let i = 0; i < count; i++) {
      const max = 14 + Math.floor(Math.random() * 12)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * lift,
        life: max,
        max,
        color,
        gravity: 0.02,
      })
    }
  }

  const feet = () => ({ x: player.x + player.w / 2, y: player.y + player.h })

  const react = (events: PlayerEvent[]) => {
    const f = feet()
    for (const e of events) {
      if (e === 'jump') puff(f.x, f.y, 5, 1.2)
      if (e === 'land') {
        squash = Math.min(1, player.landSpeed / 4.6)
        puff(f.x, f.y, Math.round(3 + squash * 8), 1.8 + squash * 1.5)
      }
      if (e === 'turn') puff(f.x, f.y, 3, 0.8)
      if (e === 'walljump')
        puff(f.x - player.facing * 6, f.y - 12, 6, 1, PAL.t, 1)
      if (e === 'roll' || e === 'airdash') puff(f.x, f.y - 4, 6, 1.4)
    }
  }

  const strike = () => {
    const box = player.attackBox()
    if (!box) {
      if (player.attackT === 0) hitThisSwing.clear()
      return
    }
    for (const urn of urns) {
      if (urn.broken || hitThisSwing.has(urn)) continue
      const body = { x: urn.x - 6, y: urn.y - 14, w: 12, h: 14 }
      if (!overlaps(box, body)) continue
      hitThisSwing.add(urn)
      urn.broken = true
      urn.respawn = URN_RESPAWN
      hitPause = HIT_PAUSE
      shake = 6
      for (let i = 0; i < 14; i++) {
        const max = 30 + Math.floor(Math.random() * 30)
        particles.push({
          x: urn.x + (Math.random() - 0.5) * 8,
          y: urn.y - 8 + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 3 + player.facing * 1.2,
          vy: -Math.random() * 3 - 0.5,
          life: max,
          max,
          color: i % 3 === 0 ? PAL.R : i % 2 ? PAL.B : PAL.b,
          gravity: 0.18,
        })
      }
      puff(urn.x, urn.y - 6, 6, 1, PAL.e, 0.8)
    }
  }

  const updateCamera = () => {
    const cx = player.x + player.w / 2 + player.facing * 28
    const cy = player.y + player.h / 2 - 12
    camX += (cx - VIEW_W / 2 - camX) * 0.1
    const targetY = cy - VIEW_H / 2
    // Vertical deadzone, so small hops do not bob the view.
    if (Math.abs(targetY - camY) > 18)
      camY += (targetY - camY - Math.sign(targetY - camY) * 18) * 0.12
    camX = Math.max(0, Math.min(level.pixelWidth - VIEW_W, camX))
    camY = Math.max(0, Math.min(level.pixelHeight - VIEW_H, camY))
  }

  return {
    step({ held, pressed }) {
      if (pressed.has('start')) paused = !paused
      if (pressed.has('select')) debug = !debug
      time++
      for (const m of motes) {
        m.phase += 0.02
        m.y += m.ember ? -0.15 : 0.22
        m.x += Math.sin(m.phase) * 0.2 + (m.ember ? 0 : 0.1)
        if (m.y > VIEW_H) m.y -= VIEW_H
        if (m.y < 0) m.y += VIEW_H
        if (m.x > VIEW_W) m.x -= VIEW_W
      }
      if (paused) return
      if (hitPause > 0) {
        hitPause--
        return
      }

      const events = player.step({
        left: held.has('left'),
        right: held.has('right'),
        up: held.has('up'),
        down: held.has('down'),
        jumpHeld: held.has('a'),
        jump: pressed.has('a'),
        dash: pressed.has('b'),
        attack: pressed.has('x'),
      })
      react(events)
      strike()

      if (player.pose === 'run') {
        runPhase += Math.abs(player.vx) * 0.22
        if (time % 12 === 0) puff(feet().x, feet().y, 1, 0.6)
      }
      if (player.pose === 'wall' && time % 5 === 0)
        puff(feet().x + player.wall * 5, player.y + 6, 1, 0.3)
      if (player.dash && time % 2 === 0) ghosts.push({ view: view(), life: 12 })
      squash *= 0.8

      const neckX = player.x + player.w / 2 - player.facing * 2
      scarf.step(
        neckX,
        player.y + (player.dash === 'roll' ? 4 : 7),
        player.facing,
        time
      )

      particles = particles.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.96
        return --p.life > 0
      })
      ghosts = ghosts.filter((g) => --g.life > 0)
      for (const urn of urns) {
        if (urn.broken && --urn.respawn <= 0) {
          urn.broken = false
          puff(urn.x, urn.y - 4, 6, 1)
        }
      }
      if (shake > 0) shake--
      updateCamera()
    },

    draw(ctx) {
      ctx.imageSmoothingEnabled = false
      const sx = shake ? Math.round((Math.random() - 0.5) * 3) : 0
      const sy = shake ? Math.round((Math.random() - 0.5) * 3) : 0
      const ox = -Math.round(camX) + sx
      const oy = -Math.round(camY) + sy

      drawBackdrop(ctx, backdrop, camX, camY, level.pixelHeight - VIEW_H)
      ctx.drawImage(tiles, ox, oy)

      ctx.save()
      ctx.translate(ox, oy)
      for (const c of candles) ctx.drawImage(candleArt, c.x - 4, c.y - 10)
      for (const urn of urns)
        if (!urn.broken) ctx.drawImage(urnArt, urn.x - 6, urn.y - 14)

      for (const g of ghosts) {
        ctx.globalAlpha = (g.life / 12) * 0.45
        drawHero(ctx, g.view, { tint: PAL.R })
      }
      ctx.globalAlpha = 1
      scarf.draw(ctx)
      drawHero(ctx, view())

      for (const p of particles) {
        ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      }
      ctx.globalAlpha = 1

      // Flames, redrawn every frame so they flicker.
      for (const c of candles) {
        for (const [dx, dy] of [
          [-2, -12],
          [2, -9],
        ]) {
          const h = 2 + Math.round(hash(Math.floor(time / 4), c.x + dx, 9) * 2)
          ctx.fillStyle = PAL.e
          ctx.fillRect(c.x + dx, c.y + dy - h, 1, h)
          ctx.fillStyle = PAL.E
          ctx.fillRect(c.x + dx, c.y + dy - 1, 1, 1)
        }
      }

      ctx.globalCompositeOperation = 'lighter'
      for (const c of candles) {
        const flicker = hash(Math.floor(time / 6), c.x, 3) > 0.5 ? 1 : 0
        ctx.drawImage(candleGlow, c.x - 26 + flicker, c.y - 36)
      }
      if (player.pose !== 'roll')
        ctx.drawImage(
          eyeGlow,
          Math.round(player.x + player.w / 2 + player.facing * 2) - 6,
          Math.round(player.y) - 3
        )
      ctx.globalCompositeOperation = 'source-over'

      if (debug) {
        ctx.strokeStyle = '#3cf'
        ctx.strokeRect(
          player.x + 0.5,
          player.y + 0.5,
          player.w - 1,
          player.h - 1
        )
        const box = player.attackBox()
        if (box) {
          ctx.strokeStyle = '#f33'
          ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
        }
      }
      ctx.restore()

      for (const m of motes) {
        ctx.fillStyle = m.ember
          ? hash(Math.floor(time / 8), m.phase, 1) > 0.5
            ? PAL.E
            : PAL.e
          : PAL.T
        ctx.globalAlpha = m.ember ? 0.9 : 0.35
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1)
      }
      ctx.globalAlpha = 1
      ctx.drawImage(vignette, 0, 0)

      if (debug) {
        ctx.fillStyle = '#9fe'
        ctx.font = '8px monospace'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(
          `${player.pose} vx ${player.vx.toFixed(2)} vy ${player.vy.toFixed(2)}`,
          4,
          4
        )
      }
      if (paused) {
        ctx.fillStyle = 'rgba(11,10,16,0.7)'
        ctx.fillRect(0, 0, VIEW_W, VIEW_H)
        ctx.fillStyle = PAL.B
        ctx.font = '8px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2)
      }
    },

    pause() {
      paused = true
    },
  }
}
