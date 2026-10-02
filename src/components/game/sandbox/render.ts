import {
  bakeBackdrop,
  drawBackdrop,
  MOON,
  VIEW_H,
  VIEW_W,
  type Backdrop,
} from './background'
import {
  BOSS,
  bossLabel,
  drawBoss,
  drawOutlined,
  LETTER_H,
  shotBox,
  WORD,
} from './boss'
import { drawText } from './font'
import { drawHero } from './hero'
import { Darkness, warmLight } from './light'
import {
  bake,
  bakePixels,
  context,
  dither,
  hash,
  makeCanvas,
  PAL,
  type Canvas,
} from './pixels'
import { debugLabel, drawSnake } from './snake'
import { TILE } from './level'
import { bakeTiles } from './tiles'
import { drawTorch } from './torch'
import {
  GHOST_LIFE,
  INVULN,
  MAX_HP,
  PICKUP,
  pickupBox,
  World,
  type Pickup,
} from './world'

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
// radius at full brightness. Outside every light the foreground keeps a
// quarter of its brightness and the sky and skyline behind it keep half.
// The visor lights only the side the player faces, at full brightness for
// about one body height (26px) ahead of the face.
export const LIGHT = {
  dark: 'rgba(3,2,8,0.75)',
  backdrop: 'rgba(3,2,8,0.5)',
  visor: { radius: 64, core: 0.45, ahead: 2 },
  candle: { radius: 52, core: 0.25 },
  torch: { radius: 56, core: 0.35 },
  burning: { radius: 28, core: 0.2 },
  // A health candle once a torch has lit it.
  pickup: { radius: 30, core: 0.25 },
  // The open gate, so the way on can be found; the boss, which lights its
  // hall around it; and each letter it throws.
  gate: { radius: 40, core: 0.3 },
  boss: { radius: 96, core: 0.35 },
  shot: { radius: 14, core: 0.3 },
  // Only as wide as the moon's own halo: it lights the sky, not the ground.
  moon: { radius: 36, core: 0.35, strength: 0.9 },
  candleGlow: { radius: 26, color: 'rgba(255,140,60,0.32)' },
  torchGlow: { radius: 18, color: 'rgba(255,150,60,0.42)' },
  pickupGlow: { radius: 10, color: 'rgba(255,150,60,0.4)' },
  eyeGlow: { radius: 6, color: 'rgba(255,170,80,0.7)' },
}

// A soft ember glow, dithered to stay in pixel style. Drawn additively.
function bakeGlow(radius: number, color: string): Canvas {
  const size = radius * 2
  return bakePixels(size, size, (x, y) => {
    const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
    return d < 1 && (1 - d) * (1 - d) > dither(x, y) ? color : null
  })
}

// Darkens the frame's edges so the eye settles on the middle.
function bakeVignette(width: number): Canvas {
  return bakePixels(width, VIEW_H, (x, y) => {
    const dx = (x - width / 2) / (width / 2)
    const dy = (y - VIEW_H / 2) / (VIEW_H / 2)
    const d = Math.hypot(dx * 0.8, dy)
    return d > 0.75 && (d - 0.75) * 1.6 > dither(x, y) ? PAL.k : null
  })
}

// A health candle as the HUD draws one: bone wax, and a flame once a torch
// has lit it. Taken, it is a grey stub growing back as it recharges.
function drawPickup(ctx: CanvasRenderingContext2D, c: Pickup, time: number) {
  const { x, y } = c
  if (c.recharge > 0) {
    const h = 1 + Math.floor((1 - c.recharge / PICKUP.recharge) * 4)
    ctx.fillStyle = PAL.t
    ctx.fillRect(x - 1, y - h, 3, h)
    ctx.fillStyle = PAL.s
    ctx.fillRect(x + 1, y - h, 1, h)
    return
  }
  ctx.fillStyle = PAL.B
  ctx.fillRect(x - 1, y - 5, 3, 5)
  ctx.fillStyle = PAL.b
  ctx.fillRect(x + 1, y - 5, 1, 5)
  if (!c.lit) {
    ctx.fillStyle = PAL.d
    ctx.fillRect(x, y - 7, 1, 2)
    return
  }
  ctx.fillStyle = (time >> 3) % 2 ? PAL.E : PAL.e
  ctx.fillRect(x, y - 8, 1, 3)
  ctx.fillStyle = PAL.y
  ctx.fillRect(x, y - 6, 1, 1)
}

export type Renderer = {
  draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    opts?: { debug?: boolean; hud?: boolean }
  ): void
  // Bakes everything a run of `world` will draw, so no frame of it stalls
  // on a first light, tile sheet or vignette.
  prepare(world: World): void
  // The last frame's foreground darkness, for measuring how far light reaches.
  shade: Canvas
}

export function createRenderer(): Renderer {
  const backdrop: Backdrop = bakeBackdrop()
  const tiles = new WeakMap<string[], Canvas>()
  const urnArt = bake(URN)
  const candleArt = bake(CANDLES)
  const candleGlow = bakeGlow(LIGHT.candleGlow.radius, LIGHT.candleGlow.color)
  const torchGlow = bakeGlow(LIGHT.torchGlow.radius, LIGHT.torchGlow.color)
  const pickupGlow = bakeGlow(LIGHT.pickupGlow.radius, LIGHT.pickupGlow.color)
  const eyeGlow = bakeGlow(LIGHT.eyeGlow.radius, LIGHT.eyeGlow.color)
  const vignettes = new Map<number, Canvas>()
  const vignetteOf = (viewW: number) => {
    let v = vignettes.get(viewW)
    if (!v) vignettes.set(viewW, (v = bakeVignette(viewW)))
    return v
  }
  const tilesOf = (world: World) => {
    let art = tiles.get(world.map)
    if (!art) tiles.set(world.map, (art = bakeTiles(world.level)))
    return art
  }
  // The sky and skyline keep their own, lighter dark, and only the
  // foreground takes the heavier one, so they are drawn apart.
  const back = new Darkness()
  const fore = new Darkness()
  const layer = makeCanvas(VIEW_W, VIEW_H)
  const scene = context(layer)

  const prepare: Renderer['prepare'] = (world) => {
    tilesOf(world)
    vignetteOf(world.viewW)
    warmLight(LIGHT.visor.radius, LIGHT.visor.core, 1)
    warmLight(LIGHT.visor.radius, LIGHT.visor.core, -1)
    warmLight(LIGHT.moon.radius, LIGHT.moon.core)
    for (const l of [
      LIGHT.candle,
      LIGHT.torch,
      LIGHT.burning,
      LIGHT.pickup,
      LIGHT.gate,
      LIGHT.boss,
      LIGHT.shot,
    ])
      warmLight(l.radius, l.core)
  }

  const draw: Renderer['draw'] = (
    ctx,
    world,
    { debug = false, hud = true } = {}
  ) => {
    const { player, time } = world
    const viewW = world.viewW
    const tileArt = tilesOf(world)

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
      world.level.pixelHeight - VIEW_H,
      viewW
    )
    scene.imageSmoothingEnabled = false
    scene.clearRect(0, 0, VIEW_W, VIEW_H)
    scene.drawImage(tileArt, ox, oy)

    scene.save()
    scene.translate(ox, oy)
    for (const c of world.candles) scene.drawImage(candleArt, c.x - 4, c.y - 10)
    for (const c of world.pickups) drawPickup(scene, c, time)
    for (const urn of world.urns)
      if (!urn.broken) scene.drawImage(urnArt, urn.x - 6, urn.y - 14)
    for (const t of world.torches) if (t.landed) drawTorch(scene, t, time)
    for (const s of world.snakes) drawSnake(scene, s, time)
    if (!world.level.gateOpen) drawGate(scene, world)

    for (const g of world.ghosts) {
      scene.globalAlpha = (g.life / GHOST_LIFE) * 0.45
      drawHero(scene, g.view, { tint: PAL.R })
    }
    scene.globalAlpha = 1
    // Blinks through the mercy frames after a bite.
    const blink =
      world.invuln > 0 && world.invuln < INVULN && (world.invuln >> 2) % 2
    if (!blink && world.status !== 'dead') {
      world.scarf.draw(scene)
      drawHero(scene, world.view())
    }

    for (const p of world.particles) {
      if (p.glow) continue
      scene.globalAlpha = Math.min(1, (p.life / p.max) * 1.5)
      scene.fillStyle = p.color
      scene.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
    }
    scene.globalAlpha = 1
    for (const t of world.torches) if (!t.landed) drawTorch(scene, t, time)

    // Flames, redrawn every frame so they flicker.
    for (const c of world.candles) {
      for (const [dx, dy] of FLAMES) {
        const h = 2 + Math.round(hash(Math.floor(time / 4), c.x + dx, 9) * 2)
        scene.fillStyle = PAL.e
        scene.fillRect(c.x + dx, c.y + dy - h, 1, h)
        scene.fillStyle = PAL.E
        scene.fillRect(c.x + dx, c.y + dy - 1, 1, 1)
      }
    }
    scene.restore()

    // Ash drifts in the dark; only embers glow through it.
    for (const m of world.motes) {
      if (m.ember) continue
      scene.fillStyle = PAL.T
      scene.globalAlpha = 0.35
      scene.fillRect(Math.round(m.x), Math.round(m.y), 1, 1)
    }
    scene.globalAlpha = 1

    // The dark, and every light cut out of it, in screen space.
    const { moon, visor, candle, torch, burning, pickup } = LIGHT
    const cut = (darkness: Darkness) => {
      if (world.status !== 'dead') {
        const head = player.pose === 'roll' ? player.y + 4 : player.y + 6
        darkness.light(
          player.x + player.w / 2 + player.facing * visor.ahead + ox,
          head + oy,
          visor.radius,
          visor.core,
          1,
          player.facing
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
      for (const c of world.pickups)
        if (c.lit)
          darkness.light(
            c.x + ox,
            c.y - 7 + oy,
            pickup.radius,
            pickup.core,
            hash(Math.floor(time / 6), c.x, 3) > 0.5 ? 0.9 : 1
          )
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
      const level = world.level
      if (level.gateOpen && level.gate.length) {
        const g = level.gate[Math.floor(level.gate.length / 2)]
        darkness.light(
          g.tx * TILE + TILE / 2 + ox,
          g.ty * TILE + TILE / 2 + oy,
          LIGHT.gate.radius,
          LIGHT.gate.core
        )
      }
      const b = world.boss
      if (b?.awake && !b.gone) {
        const boxes = b.letterBoxes()
        if (boxes.length) {
          const x = boxes.reduce((a, l) => a + l.x + l.w / 2, 0) / boxes.length
          const y = boxes.reduce((a, l) => a + l.y, 0) / boxes.length
          const fade = b.state === 'dying' ? 1 - b.t / BOSS.die : 1
          darkness.light(
            x + ox,
            y + LETTER_H / 2 + oy,
            LIGHT.boss.radius,
            LIGHT.boss.core,
            fade
          )
        }
        for (const s of b.shots)
          darkness.light(
            s.x + s.w / 2 + ox,
            s.y + s.h / 2 + oy,
            LIGHT.shot.radius,
            LIGHT.shot.core
          )
      }
    }
    back.begin(LIGHT.backdrop)
    // The moon lights the sky alone.
    back.light(
      MOON.x + viewW - VIEW_W,
      MOON.y,
      moon.radius,
      moon.core,
      moon.strength
    )
    cut(back)
    back.end(ctx)
    fore.begin(LIGHT.dark)
    cut(fore)
    fore.end(scene, 'source-atop')
    ctx.drawImage(layer, 0, 0)

    // Warm bloom on top of the dark.
    ctx.globalCompositeOperation = 'lighter'
    for (const c of world.candles) {
      const flicker = hash(Math.floor(time / 6), c.x, 3) > 0.5 ? 1 : 0
      const r = LIGHT.candleGlow.radius
      ctx.drawImage(candleGlow, c.x - r + flicker + ox, c.y - 10 - r + oy)
    }
    // Torches flare through the dark, dimming as a landed one burns out.
    for (const t of world.torches) {
      const r = LIGHT.torchGlow.radius
      const flicker = hash(time >> 2, t.x | 0, 5) > 0.5 ? 1 : 0
      ctx.globalAlpha = Math.max(0, Math.min(1, t.strength * 1.2))
      ctx.drawImage(
        torchGlow,
        Math.round(t.x + t.w / 2) - r + ox,
        Math.round(t.y) - 4 - r + flicker + oy
      )
    }
    ctx.globalAlpha = 1
    for (const c of world.pickups) {
      if (!c.lit || c.recharge) continue
      const r = LIGHT.pickupGlow.radius
      ctx.drawImage(pickupGlow, c.x - r + ox, c.y - 7 - r + oy)
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

    // Sparks off the torches glow through the dark.
    for (const p of world.particles) {
      if (!p.glow) continue
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6)
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x) + ox, Math.round(p.y) + oy, 1, 1)
    }
    // A dark wick smoulders, so a candle waiting for a torch can be found.
    for (const c of world.pickups) {
      if (c.lit || c.recharge) continue
      ctx.globalAlpha = 0.45 + Math.sin(time * 0.08 + c.x) * 0.3
      ctx.fillStyle = PAL.e
      ctx.fillRect(c.x + ox, c.y - 6 + oy, 1, 1)
    }
    ctx.globalAlpha = 1

    // The boss glows through the dark, so every attack reads.
    if (world.boss) {
      ctx.save()
      ctx.translate(ox, oy)
      drawBoss(ctx, world.boss, time)
      ctx.restore()
    }

    for (const m of world.motes) {
      if (!m.ember) continue
      ctx.fillStyle =
        hash(Math.floor(time / 8), m.phase, 1) > 0.5 ? PAL.E : PAL.e
      ctx.globalAlpha = 0.9
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1)
    }
    ctx.globalAlpha = 1
    ctx.drawImage(vignetteOf(viewW), 0, 0)

    if (hud) drawHud(ctx, world)

    if (debug) {
      ctx.save()
      ctx.translate(ox, oy)
      ctx.strokeStyle = '#3cf'
      ctx.strokeRect(player.x + 0.5, player.y + 0.5, player.w - 1, player.h - 1)
      const box = player.attackBox()
      ctx.strokeStyle = '#f33'
      if (box) ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
      const b = world.boss
      if (b?.awake && !b.gone) {
        ctx.strokeStyle = '#9f6'
        for (const l of b.letterBoxes())
          ctx.strokeRect(l.x + 0.5, l.y + 0.5, l.w - 1, l.h - 1)
        ctx.strokeStyle = '#f33'
        for (const l of b.contact())
          ctx.strokeRect(l.x + 0.5, l.y + 0.5, l.w - 1, l.h - 1)
        for (const s of b.shots) {
          const r = shotBox(s)
          ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
        }
        drawText(ctx, bossLabel(b), b.x + 58, b.y - 32, '#9f6')
      }
      ctx.strokeStyle = '#f93'
      for (const t of world.torches)
        ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1)
      ctx.strokeStyle = '#fe6'
      for (const c of world.pickups) {
        if (c.recharge) continue
        const r = pickupBox(c)
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
      }
      for (const s of world.snakes) {
        if (!s.alive) continue
        ctx.strokeStyle = '#9f6'
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1)
        const bite = s.biteBox()
        ctx.strokeStyle = '#f33'
        if (bite)
          ctx.strokeRect(bite.x + 0.5, bite.y + 0.5, bite.w - 1, bite.h - 1)
        drawText(ctx, debugLabel(s), s.x + s.w / 2, s.y - 9, '#9f6')
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
  return { draw, prepare, shade: fore.canvas }
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
    world.viewW - 6,
    6,
    PAL.B,
    1,
    'right'
  )
  // The serpent icon, banded like the serpents.
  ctx.fillStyle = PAL.C
  ctx.fillRect(world.viewW - 36, 10, 8, 2)
  ctx.fillRect(world.viewW - 30, 8, 3, 3)
  ctx.fillStyle = PAL.G
  ctx.fillRect(world.viewW - 33, 10, 2, 2)
  ctx.fillStyle = PAL.y
  ctx.fillRect(world.viewW - 28, 8, 1, 1)

  // An announcement under the HUD, big where it fits, blinking out.
  const banner = world.banner
  if (banner && (banner.t > 20 || (banner.t >> 2) % 2)) {
    const big = banner.text.length * 12 <= world.viewW - 8 ? 2 : 1
    drawOutlined(ctx, banner.text, world.viewW / 2, 24, banner.color, big)
  }

  // The boss's name and health, top centre between the candles and the
  // serpent count, from the moment it spawns. The bar fills as it wakes, and
  // a hit leaves an ember chip that drains after it.
  const b = world.boss
  if (!b || b.gone) return
  const w = Math.min(160, world.viewW - 124)
  const x0 = Math.round((world.viewW - w) / 2)
  const y = 12
  drawOutlined(ctx, WORD, world.viewW / 2, 2, b.phase === 2 ? PAL.C : PAL.B)
  ctx.fillStyle = PAL.k
  ctx.fillRect(x0 - 1, y - 1, w + 2, 6)
  ctx.fillStyle = PAL.d
  ctx.fillRect(x0, y, w, 4)
  const now = Math.round((w * b.hp * b.fill) / BOSS.hp)
  const lag = Math.round((w * b.lag * b.fill) / BOSS.hp)
  ctx.fillStyle = PAL.E
  ctx.fillRect(x0, y, lag, 4)
  ctx.fillStyle = b.phase === 2 ? PAL.C : PAL.R
  ctx.fillRect(x0, y, now, 4)
  ctx.fillStyle = b.phase === 2 ? PAL.E : PAL.C
  ctx.fillRect(x0, y, now, 1)
}

// A portcullis of iron bars over each shut gate cell.
function drawGate(ctx: CanvasRenderingContext2D, world: World) {
  for (const { tx, ty } of world.level.gate) {
    const x = tx * TILE
    const y = ty * TILE
    for (const bx of [1, 5, 9, 13]) {
      ctx.fillStyle = PAL.i
      ctx.fillRect(x + bx, y, 2, TILE)
      ctx.fillStyle = PAL.I
      ctx.fillRect(x + bx, y, 1, TILE)
    }
    ctx.fillStyle = PAL.i
    ctx.fillRect(x, y + 4, TILE, 2)
    ctx.fillRect(x, y + 12, TILE, 2)
  }
}
