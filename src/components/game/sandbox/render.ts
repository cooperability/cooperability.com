import {
  bakeBackdrop,
  drawBackdrop,
  MOON,
  VIEW_H,
  VIEW_W,
  type Backdrop,
} from './background'
import { drawText } from './font'
import { drawHero } from './hero'
import { Darkness } from './light'
import {
  bake,
  context,
  dither,
  hash,
  makeCanvas,
  PAL,
  type Canvas,
} from './pixels'
import { drawSnake } from './snake'
import { bakeTiles } from './tiles'
import { drawTorch } from './torch'
import { GHOST_LIFE, INVULN, MAX_HP, World } from './world'

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

// Wick offsets of the two candles in CANDLES, from the prop's feet.
const FLAMES = [
  [-2, -12],
  [2, -9],
]

// Everything that lights the dark, in pixels. `core` is the share of the
// radius at full brightness. Outside every light the scene keeps half its
// brightness; the visor light sits ahead of the face, so the player sees
// clearly for about two body lengths (52px) in the direction they look.
export const LIGHT = {
  dark: 'rgba(3,2,8,0.5)',
  visor: { radius: 60, core: 0.45, ahead: 12 },
  candle: { radius: 52, core: 0.25 },
  torch: { radius: 44, core: 0.3 },
  burning: { radius: 28, core: 0.2 },
  // Only as wide as the moon's own halo: it lights the sky, not the ground.
  moon: { radius: 36, core: 0.35, strength: 0.9 },
  candleGlow: { radius: 26, color: 'rgba(255,140,60,0.32)' },
  eyeGlow: { radius: 6, color: 'rgba(255,170,80,0.7)' },
}

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

export type Renderer = {
  draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    opts?: { debug?: boolean; hud?: boolean }
  ): void
  // The last frame's darkness layer, for measuring how far the light reaches.
  shade: Canvas
}

export function createRenderer(): Renderer {
  const backdrop: Backdrop = bakeBackdrop()
  const tiles = new WeakMap<string[], Canvas>()
  const urnArt = bake(URN)
  const candleArt = bake(CANDLES)
  const candleGlow = bakeGlow(LIGHT.candleGlow.radius, LIGHT.candleGlow.color)
  const eyeGlow = bakeGlow(LIGHT.eyeGlow.radius, LIGHT.eyeGlow.color)
  const vignette = bakeVignette()
  const darkness = new Darkness()

  const draw: Renderer['draw'] = (
    ctx,
    world,
    { debug = false, hud = true } = {}
  ) => {
    const { player, time } = world
    let tileArt = tiles.get(world.map)
    if (!tileArt) tiles.set(world.map, (tileArt = bakeTiles(world.level)))

    ctx.imageSmoothingEnabled = false
    const shaking = world.shake > 0
    const sx = shaking ? Math.round((hash(time, 1, 77) - 0.5) * 3) : 0
    const sy = shaking ? Math.round((hash(time, 2, 77) - 0.5) * 3) : 0
    const ox = -Math.round(world.camX) + sx
    const oy = -Math.round(world.camY) + sy

    drawBackdrop(
      ctx,
      backdrop,
      world.camX,
      world.camY,
      world.level.pixelHeight - VIEW_H
    )
    ctx.drawImage(tileArt, ox, oy)

    ctx.save()
    ctx.translate(ox, oy)
    for (const c of world.candles) ctx.drawImage(candleArt, c.x - 4, c.y - 10)
    for (const urn of world.urns)
      if (!urn.broken) ctx.drawImage(urnArt, urn.x - 6, urn.y - 14)
    for (const t of world.torches) if (t.landed) drawTorch(ctx, t, time)
    for (const s of world.snakes) drawSnake(ctx, s, time)

    for (const g of world.ghosts) {
      ctx.globalAlpha = (g.life / GHOST_LIFE) * 0.45
      drawHero(ctx, g.view, { tint: PAL.R })
    }
    ctx.globalAlpha = 1
    // Blinks through the mercy frames after a bite.
    const blink =
      world.invuln > 0 && world.invuln < INVULN && (world.invuln >> 2) % 2
    if (!blink && world.status !== 'dead') {
      world.scarf.draw(ctx)
      drawHero(ctx, world.view())
    }

    for (const p of world.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5)
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
    }
    ctx.globalAlpha = 1
    for (const t of world.torches) if (!t.landed) drawTorch(ctx, t, time)

    // Flames, redrawn every frame so they flicker.
    for (const c of world.candles) {
      for (const [dx, dy] of FLAMES) {
        const h = 2 + Math.round(hash(Math.floor(time / 4), c.x + dx, 9) * 2)
        ctx.fillStyle = PAL.e
        ctx.fillRect(c.x + dx, c.y + dy - h, 1, h)
        ctx.fillStyle = PAL.E
        ctx.fillRect(c.x + dx, c.y + dy - 1, 1, 1)
      }
    }
    ctx.restore()

    // Ash drifts in the dark; only embers glow through it.
    for (const m of world.motes) {
      if (m.ember) continue
      ctx.fillStyle = PAL.T
      ctx.globalAlpha = 0.35
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1)
    }
    ctx.globalAlpha = 1

    // The dark, and every light cut out of it, in screen space.
    darkness.begin(LIGHT.dark)
    const { moon, visor, candle, torch, burning } = LIGHT
    darkness.light(MOON.x, MOON.y, moon.radius, moon.core, moon.strength)
    if (world.status !== 'dead') {
      const head = player.pose === 'roll' ? player.y + 4 : player.y + 6
      darkness.light(
        player.x + player.w / 2 + player.facing * visor.ahead + ox,
        head + oy,
        visor.radius,
        visor.core
      )
    }
    for (const c of world.candles) {
      const flicker = hash(Math.floor(time / 6), c.x, 3) > 0.5 ? 0.92 : 1
      darkness.light(
        c.x + ox,
        c.y - 10 + oy,
        candle.radius,
        candle.core,
        flicker
      )
    }
    for (const t of world.torches)
      darkness.light(
        t.x + t.w / 2 + ox,
        t.y + oy,
        torch.radius,
        torch.core,
        t.strength
      )
    for (const s of world.snakes)
      if (s.burn > 0)
        darkness.light(
          s.x + s.w / 2 + ox,
          s.y + oy,
          burning.radius,
          burning.core
        )
    darkness.end(ctx)

    // Warm bloom on top of the dark.
    ctx.globalCompositeOperation = 'lighter'
    for (const c of world.candles) {
      const flicker = hash(Math.floor(time / 6), c.x, 3) > 0.5 ? 1 : 0
      const r = LIGHT.candleGlow.radius
      ctx.drawImage(candleGlow, c.x - r + flicker + ox, c.y - 10 - r + oy)
    }
    if (player.pose !== 'roll' && world.status !== 'dead')
      ctx.drawImage(
        eyeGlow,
        Math.round(player.x + player.w / 2 + player.facing * 2) -
          LIGHT.eyeGlow.radius +
          ox,
        Math.round(player.y) - 3 + oy
      )
    ctx.globalCompositeOperation = 'source-over'

    for (const m of world.motes) {
      if (!m.ember) continue
      ctx.fillStyle =
        hash(Math.floor(time / 8), m.phase, 1) > 0.5 ? PAL.E : PAL.e
      ctx.globalAlpha = 0.9
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1)
    }
    ctx.globalAlpha = 1
    ctx.drawImage(vignette, 0, 0)

    if (hud) drawHud(ctx, world)

    if (debug) {
      ctx.save()
      ctx.translate(ox, oy)
      ctx.strokeStyle = '#3cf'
      ctx.strokeRect(player.x + 0.5, player.y + 0.5, player.w - 1, player.h - 1)
      const box = player.attackBox()
      ctx.strokeStyle = '#f33'
      if (box) ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
      for (const s of world.snakes) {
        if (!s.alive) continue
        ctx.strokeStyle = '#9f6'
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1)
        const bite = s.biteBox()
        ctx.strokeStyle = '#f33'
        if (bite)
          ctx.strokeRect(bite.x + 0.5, bite.y + 0.5, bite.w - 1, bite.h - 1)
      }
      ctx.restore()
      drawText(
        ctx,
        `${player.pose} ${player.vx.toFixed(1)} ${player.vy.toFixed(1)}`,
        4,
        16,
        '#9fe',
        1,
        'left'
      )
    }
  }
  return { draw, shade: darkness.canvas }
}

// Candles for health, a brand for the torch, and the serpent count.
function drawHud(ctx: CanvasRenderingContext2D, world: World) {
  for (let i = 0; i < MAX_HP; i++) {
    const x = 6 + i * 8
    const lit = i < world.hp
    ctx.fillStyle = lit ? PAL.B : PAL.t
    ctx.fillRect(x, 8, 3, 5)
    ctx.fillStyle = lit ? PAL.b : PAL.s
    ctx.fillRect(x + 2, 8, 1, 5)
    if (lit) {
      ctx.fillStyle =
        (world.time >> 3) % 2 && i === world.hp - 1 ? PAL.E : PAL.e
      ctx.fillRect(x + 1, 5, 1, 3)
      ctx.fillStyle = PAL.y
      ctx.fillRect(x + 1, 7, 1, 1)
    }
  }
  const ready = world.torchCooldown === 0
  ctx.fillStyle = PAL.O
  ctx.fillRect(50, 9, 2, 5)
  ctx.fillStyle = ready ? PAL.E : PAL.s
  ctx.fillRect(49, 5, 4, 4)
  drawText(
    ctx,
    `${world.kills}/${world.total}`,
    VIEW_W - 6,
    6,
    PAL.B,
    1,
    'right'
  )
  ctx.fillStyle = PAL.M
  ctx.fillRect(VIEW_W - 36, 10, 8, 2)
  ctx.fillRect(VIEW_W - 30, 8, 3, 3)
  ctx.fillStyle = PAL.E
  ctx.fillRect(VIEW_W - 28, 8, 1, 1)
}
