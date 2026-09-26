import { PAL, pixelLine } from './pixels'
import type { Player, Pose } from './player'

// Parts are drawn facing right. Rows run top to bottom, '.' is transparent.
// A sallet helm with a single ember slit, over a hood's edge.
const HELM = [
  '...kkkk..',
  '..kIIIik.',
  '.kIwIIiik',
  '.kIIIiiik',
  '.kiiiyEek',
  'kkiiiiiik',
  'ks.kiiik.',
  '.ksskkk..',
]

// Coat, crimson tabard, gold belt, bone trim.
const TORSO = [
  '..kRCRRk..',
  '.ksSSSSsk.',
  'kssSSSSSsk',
  'ksSSbSSSsk',
  'ksSSbSSssk',
  'kssgGGgssk',
  'ksrRRRrssk',
  '.ksRCRrsk.',
  '.ksrRRrsk.',
  '..krRrsk..',
]

// Tucked into a ball for the roll, rotated in quarter turns.
const TUCK = [
  '...kkkkk....',
  '..kIIIiik...',
  '.kIwIiyEek..',
  '.kiiiiiikRk.',
  'kssSSSSSkCRk',
  'ksSSbSSSsRRk',
  'ksSSbSGgskk.',
  'kssrRRrssk..',
  '.ksRCRrsk...',
  '.kiikkiik...',
  '..kk..kk....',
]

type P = { x: number; y: number }

// Joint positions relative to the feet, facing right, y up is negative.
type Rig = {
  body: P
  feet: [P, P]
  knees: [P, P]
  hands: [P, P]
  // Sword tip, from the front hand.
  tip: P | null
  facing: 1 | -1
}

export type HeroView = Pick<
  Player,
  'x' | 'y' | 'w' | 'h' | 'vx' | 'vy' | 'facing' | 'wall' | 'actionProgress'
> & { pose: Pose; time: number; runPhase: number; squash: number }

function rig(v: HeroView): Rig {
  const f = v.facing
  const breathe = Math.sin(v.time / 22) > 0.4 ? 1 : 0
  const base: Rig = {
    body: { x: 0, y: breathe },
    feet: [
      { x: -3, y: 0 },
      { x: 3, y: 0 },
    ],
    knees: [
      { x: -2, y: -5 },
      { x: 3, y: -5 },
    ],
    hands: [
      { x: -4, y: -11 + breathe },
      { x: 4, y: -11 + breathe },
    ],
    tip: { x: 12, y: -1 },
    facing: f,
  }
  switch (v.pose) {
    case 'run': {
      const s = Math.sin(v.runPhase)
      const c = Math.cos(v.runPhase)
      const bob = Math.abs(c) > 0.7 ? 1 : 0
      return {
        body: { x: 1, y: bob },
        feet: [
          { x: Math.round(s * 5), y: Math.min(0, Math.round(c * 3)) },
          { x: Math.round(-s * 5), y: Math.min(0, Math.round(-c * 3)) },
        ],
        knees: [
          { x: Math.round(s * 3) + 2, y: -5 + bob },
          { x: Math.round(-s * 3) + 2, y: -5 + bob },
        ],
        hands: [
          { x: Math.round(-s * 3) - 2, y: -11 + bob },
          { x: Math.round(s * 3) + 4, y: -12 + bob },
        ],
        tip: { x: 13, y: -6 + bob },
        facing: f,
      }
    }
    case 'rise':
      return {
        ...base,
        body: { x: 0, y: -1 },
        feet: [
          { x: -3, y: -3 },
          { x: 3, y: -2 },
        ],
        knees: [
          { x: 0, y: -7 },
          { x: 5, y: -6 },
        ],
        hands: [
          { x: -5, y: -15 },
          { x: 5, y: -14 },
        ],
        tip: { x: 13, y: -9 },
      }
    case 'fall':
      return {
        ...base,
        feet: [
          { x: -4, y: 0 },
          { x: 3, y: -2 },
        ],
        knees: [
          { x: -3, y: -5 },
          { x: 4, y: -6 },
        ],
        hands: [
          { x: -6, y: -18 },
          { x: 6, y: -17 },
        ],
        tip: { x: 14, y: -21 },
      }
    case 'wall':
      // Back to the wall, one hand dragging on it.
      return {
        body: { x: 0, y: 0 },
        feet: [
          { x: -5, y: -3 },
          { x: 1, y: 0 },
        ],
        knees: [
          { x: -2, y: -7 },
          { x: 2, y: -5 },
        ],
        hands: [
          { x: -6, y: -20 },
          { x: 5, y: -12 },
        ],
        tip: { x: 13, y: -4 },
        facing: v.wall > 0 ? -1 : 1,
      }
    case 'hang':
      return {
        body: { x: -1, y: 1 },
        feet: [
          { x: -1, y: 1 },
          { x: 1, y: 0 },
        ],
        knees: [
          { x: -1, y: -5 },
          { x: 1, y: -5 },
        ],
        hands: [
          { x: 3, y: -23 },
          { x: 5, y: -23 },
        ],
        tip: null,
        facing: f,
      }
    case 'climb': {
      const t = v.actionProgress
      return {
        body: { x: 1, y: t < 0.5 ? 0 : 2 },
        feet: [
          { x: -2, y: -Math.round(6 * (1 - t)) },
          { x: 3, y: -Math.round(10 * (1 - t)) },
        ],
        knees: [
          { x: 1, y: -9 },
          { x: 5, y: -12 },
        ],
        hands: [
          { x: 4, y: -18 - Math.round(4 * (1 - t)) },
          { x: 6, y: -18 - Math.round(4 * (1 - t)) },
        ],
        tip: null,
        facing: f,
      }
    }
    case 'airdash':
      return {
        body: { x: 2, y: 1 },
        feet: [
          { x: -8, y: -3 },
          { x: -4, y: -5 },
        ],
        knees: [
          { x: -4, y: -6 },
          { x: -1, y: -8 },
        ],
        hands: [
          { x: -6, y: -13 },
          { x: 3, y: -12 },
        ],
        tip: { x: -12, y: -9 },
        facing: f,
      }
    case 'attack': {
      const t = v.actionProgress
      // Wind up behind the head, cut down through the front, then settle.
      const windup = t < 0.2
      const cut = t < 0.5
      return {
        body: { x: windup ? -1 : 2, y: windup ? 0 : 1 },
        feet: [
          { x: -4, y: 0 },
          { x: 4, y: 0 },
        ],
        knees: [
          { x: -3, y: -5 },
          { x: 5, y: -5 },
        ],
        hands: windup
          ? [
              { x: -3, y: -12 },
              { x: -1, y: -21 },
            ]
          : [
              { x: -4, y: -12 },
              { x: 6, y: cut ? -14 : -11 },
            ],
        tip: windup
          ? { x: -12, y: -26 }
          : cut
            ? { x: 20, y: -8 }
            : { x: 16, y: 0 },
        facing: f,
      }
    }
    default:
      return base
  }
}

export type Look = { tint?: string }

// Draws the hero with feet at the bottom centre of its collision box.
export function drawHero(
  ctx: CanvasRenderingContext2D,
  v: HeroView,
  look: Look = {}
) {
  const fx = Math.round(v.x + v.w / 2)
  const fy = Math.round(v.y + v.h)
  const color = (key: string) => look.tint ?? PAL[key]

  if (v.pose === 'roll') {
    const turn = Math.floor(v.actionProgress * 6) % 4
    ctx.save()
    ctx.translate(fx, fy - 6)
    ctx.rotate((turn * Math.PI * v.facing) / 2)
    paintParts(ctx, TUCK, -6, -6, v.facing < 0, color)
    ctx.restore()
    return
  }

  const r = rig(v)
  const f = r.facing
  // Mirror a right-facing offset around the feet, keeping the same pixels.
  const X = (dx: number) => (f > 0 ? fx + dx : fx - 1 - dx)
  // Landing squash sinks the body a pixel or two.
  const sink = Math.round(v.squash * 2)
  const by = fy + r.body.y + sink
  const bx = r.body.x

  const limb = (key: string, a: P, b: P, c: P, thick = 2) => {
    ctx.fillStyle = color(key)
    pixelLine(ctx, X(a.x), fy + a.y, X(b.x), fy + b.y, thick)
    pixelLine(ctx, X(b.x), fy + b.y, X(c.x), fy + c.y, thick)
  }

  const hipBack = { x: bx - 2, y: -10 + r.body.y + sink }
  const hipFront = { x: bx + 1, y: -10 + r.body.y + sink }
  const shoulderBack = { x: bx - 3, y: -18 + r.body.y + sink }
  const shoulderFront = { x: bx + 2, y: -18 + r.body.y + sink }

  // Back leg and arm first, darker, so the figure reads in depth.
  limb('s', hipBack, r.knees[0], r.feet[0])
  ctx.fillStyle = color('k')
  ctx.fillRect(X(r.feet[0].x) - (f > 0 ? 1 : 1), fy + r.feet[0].y - 1, 3, 2)
  ctx.fillStyle = color('d')
  pixelLine(
    ctx,
    X(shoulderBack.x),
    fy + shoulderBack.y,
    X(r.hands[0].x),
    fy + r.hands[0].y,
    2
  )

  paintParts(
    ctx,
    TORSO,
    f > 0 ? fx + bx - 5 : fx - 1 - bx - 4,
    by - 20,
    f < 0,
    color
  )
  paintParts(
    ctx,
    HELM,
    f > 0 ? fx + bx - 4 : fx - 1 - bx - 4,
    by - 27,
    f < 0,
    color
  )

  limb('i', hipFront, r.knees[1], r.feet[1])
  ctx.fillStyle = color('k')
  ctx.fillRect(X(r.feet[1].x) - 1, fy + r.feet[1].y - 1, 3, 2)

  // Sword, then the front arm over its grip.
  if (r.tip) {
    const hand = r.hands[1]
    ctx.fillStyle = color('w')
    pixelLine(ctx, X(hand.x), fy + hand.y, X(r.tip.x), fy + r.tip.y)
    ctx.fillStyle = color('I')
    pixelLine(ctx, X(hand.x), fy + hand.y + 1, X(r.tip.x), fy + r.tip.y + 1)
    ctx.fillStyle = color('G')
    ctx.fillRect(X(hand.x) - 1, fy + hand.y - 1, 3, 1)
  }
  ctx.fillStyle = color('S')
  pixelLine(
    ctx,
    X(shoulderFront.x),
    fy + shoulderFront.y,
    X(r.hands[1].x),
    fy + r.hands[1].y,
    2
  )
  ctx.fillStyle = color('b')
  ctx.fillRect(X(r.hands[1].x), fy + r.hands[1].y, 2, 2)

  if (v.pose === 'attack' && !look.tint) drawSmear(ctx, v, fx, fy)
}

function paintParts(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  ox: number,
  oy: number,
  flip: boolean,
  color: (key: string) => string
) {
  const w = grid[0].length
  grid.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const key = row[x]
      if (key === '.') continue
      ctx.fillStyle = color(key)
      ctx.fillRect(ox + (flip ? w - 1 - x : x), oy + y, 1, 1)
    }
  })
}

// The slash's crescent: bright at the leading edge, fading behind it.
function drawSmear(
  ctx: CanvasRenderingContext2D,
  v: HeroView,
  fx: number,
  fy: number
) {
  const t = v.actionProgress
  if (t < 0.2 || t > 0.6) return
  const sweep = Math.min(1, (t - 0.2) / 0.2)
  const cx = fx + v.facing * 2
  const cy = fy - 16
  const start = -115
  const end = start + 170 * sweep
  const fade = t > 0.4 ? 1 - (t - 0.4) / 0.2 : 1
  for (let a = start; a <= end; a += 3) {
    const lead = (a - start) / (end - start || 1)
    const rad = (a * Math.PI) / 180
    for (let r = 14; r <= 22; r++) {
      const inner = r < 16 + lead * 4
      if (inner && r < 17) continue
      const color = lead > 0.8 ? PAL.y : r > 19 ? PAL.b : PAL.B
      if (fade < 1 && (r + a) % 3 > fade * 3) continue
      ctx.fillStyle = color
      ctx.fillRect(
        Math.round(cx + Math.cos(rad) * r * v.facing),
        Math.round(cy + Math.sin(rad) * r),
        1,
        1
      )
    }
  }
}

// The crimson scarf: a short verlet chain pinned at the neck.
export class Scarf {
  private pts: { x: number; y: number; px: number; py: number }[] = []

  constructor(
    private links = 7,
    private spacing = 3
  ) {}

  step(anchorX: number, anchorY: number, facing: number, time: number) {
    if (!this.pts.length)
      for (let i = 0; i < this.links; i++)
        this.pts.push({
          x: anchorX,
          y: anchorY + i,
          px: anchorX,
          py: anchorY + i,
        })
    // A steady draft from ahead, so even at rest the scarf trails behind.
    const wind = Math.sin(time / 37) * 0.05 - facing * 0.1
    this.pts.forEach((p, i) => {
      if (i === 0) {
        Object.assign(p, { x: anchorX, y: anchorY, px: anchorX, py: anchorY })
        return
      }
      const vx = (p.x - p.px) * 0.88
      const vy = (p.y - p.py) * 0.88
      p.px = p.x
      p.py = p.y
      p.x += vx + wind
      p.y += vy + 0.1
    })
    for (let n = 0; n < 3; n++) {
      for (let i = 1; i < this.pts.length; i++) {
        const a = this.pts[i - 1]
        const b = this.pts[i]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const k = (d - this.spacing) / d
        b.x -= dx * k
        b.y -= dy * k
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.pts.forEach((p, i) => {
      if (i === 0) return
      const a = this.pts[i - 1]
      ctx.fillStyle = i < 3 ? PAL.R : i < 5 ? PAL.R : PAL.r
      pixelLine(ctx, a.x, a.y, p.x, p.y, i < 4 ? 2 : 1)
      if (i < 3) {
        ctx.fillStyle = PAL.C
        ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1)
      }
    })
  }
}
