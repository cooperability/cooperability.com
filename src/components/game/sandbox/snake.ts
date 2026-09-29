import type { Box } from './player'
import { EMPTY, Level, TILE } from './level'
import { hash, PAL, pixelLine } from './pixels'

// Pixels and 60 Hz updates, like the player's TUNING.
export const SNAKE = {
  w: 12,
  h: 8,
  hp: 3,
  patrol: 0.35,
  chase: 0.75,
  climb: 0.6,
  gravity: 0.2,
  maxFall: 4,
  notice: 112,
  // Close enough to strike without leaving the ground.
  strikeX: 24,
  strikeY: 18,
  // Far enough to coil and launch.
  lungeX: 76,
  lungeY: 30,
  coilFrames: 40,
  lungeVX: 3.1,
  lungeVY: -2.4,
  strikeWind: 14,
  strikeActive: 6,
  strikeRecover: 16,
  recover: 40,
  // Burning deals one point at each of these frames left on the fuse.
  burnFrames: 90,
  burnTicks: [45, 0],
  dieFrames: 40,
}

export type SnakeState =
  | 'slither'
  | 'climb'
  | 'coil'
  | 'lunge'
  | 'strike'
  | 'recover'
  | 'fall'
  | 'dead'

export type SnakeEvent = 'coil' | 'lunge' | 'strike' | 'burned' | 'died'

type P = { x: number; y: number }

export class Snake {
  x: number
  y: number
  w = SNAKE.w
  h = SNAKE.h
  vx = 0
  vy = 0
  facing: -1 | 1 = -1
  state: SnakeState = 'slither'
  hp = SNAKE.hp
  // Side of the wall being climbed, or 0 on the floor.
  wall: -1 | 0 | 1 = 0
  burn = 0
  hurtT = 0
  noticed = false
  // Head positions, newest first, which the body follows when drawn.
  trail: P[] = []
  private t = 0
  private cooldown = 0
  private events: SnakeEvent[] = []

  constructor(
    private level: Level,
    feetX: number,
    feetY: number
  ) {
    this.x = feetX - SNAKE.w / 2
    this.y = feetY - SNAKE.h
  }

  get alive() {
    return this.state !== 'dead'
  }

  // Gone for good: dead and done dissolving.
  get gone() {
    return this.state === 'dead' && this.t <= 0
  }

  get dying() {
    return this.state === 'dead' ? this.t / SNAKE.dieFrames : 0
  }

  // 0 to 1 through the current timed state, for drawing.
  get progress() {
    const total =
      this.state === 'coil'
        ? SNAKE.coilFrames
        : this.state === 'strike'
          ? SNAKE.strikeWind + SNAKE.strikeActive + SNAKE.strikeRecover
          : this.state === 'recover'
            ? SNAKE.recover
            : 1
    return 1 - this.t / total
  }

  // What can hurt the player this update, or null.
  biteBox(): Box | null {
    if (this.state === 'lunge') return this
    if (this.state !== 'strike') return null
    const elapsed =
      SNAKE.strikeWind + SNAKE.strikeActive + SNAKE.strikeRecover - this.t
    if (
      elapsed < SNAKE.strikeWind ||
      elapsed >= SNAKE.strikeWind + SNAKE.strikeActive
    )
      return null
    const reach = 16
    const x = this.facing > 0 ? this.x + this.w : this.x - reach
    return { x, y: this.y - 6, w: reach, h: this.h + 6 }
  }

  // Returns true when the hit kills.
  hit(damage: number, fromDir: -1 | 1): boolean {
    if (!this.alive) return false
    this.hp -= damage
    this.hurtT = 12
    this.noticed = true
    if (this.hp <= 0) {
      this.state = 'dead'
      this.t = SNAKE.dieFrames
      this.events.push('died')
      return true
    }
    // Knocked off whatever it was doing.
    this.wall = 0
    this.state = 'fall'
    this.vx = fromDir * 1.6
    this.vy = -1.6
    return false
  }

  ignite() {
    // A fuse already burning runs its course; lying in flame does not
    // restart it.
    if (!this.alive || this.burn > 0) return
    this.events.push('burned')
    this.burn = SNAKE.burnFrames
    this.noticed = true
  }

  step(target: Box): SnakeEvent[] {
    this.update(target)
    const out = this.events
    this.events = []
    return out
  }

  private update(target: Box) {
    const events = this.events
    this.trail.unshift({ x: this.headX, y: this.headY })
    if (this.trail.length > 24) this.trail.length = 24
    if (this.hurtT > 0) this.hurtT--

    if (this.state === 'dead') {
      if (this.t > 0) this.t--
      return
    }

    if (this.burn > 0) {
      this.burn--
      if (SNAKE.burnTicks.includes(this.burn) && this.hit(1, this.facing))
        return
    }
    if (this.cooldown > 0) this.cooldown--

    const tx = target.x + target.w / 2
    const ty = target.y + target.h
    const dx = tx - (this.x + this.w / 2)
    const dy = ty - (this.y + this.h)
    const dist = Math.hypot(dx, dy)
    if (dist < SNAKE.notice) this.noticed = true
    else if (dist > SNAKE.notice * 2) this.noticed = false
    const toward: -1 | 1 = dx < 0 ? -1 : 1

    switch (this.state) {
      case 'slither': {
        if (!this.level.standing(this)) {
          this.state = 'fall'
          break
        }
        if (this.noticed && this.cooldown === 0) {
          if (Math.abs(dx) < SNAKE.strikeX && Math.abs(dy) < SNAKE.strikeY) {
            this.facing = toward
            this.begin(
              'strike',
              SNAKE.strikeWind + SNAKE.strikeActive + SNAKE.strikeRecover
            )
            events.push('strike')
            break
          }
          if (Math.abs(dx) < SNAKE.lungeX && Math.abs(dy) < SNAKE.lungeY) {
            this.facing = toward
            this.begin('coil', SNAKE.coilFrames)
            events.push('coil')
            break
          }
        }
        if (this.noticed && Math.abs(dx) > 4) this.facing = toward
        const speed = this.noticed ? SNAKE.chase : SNAKE.patrol
        const { hitX } = this.level.move(this, this.facing * speed, 0)
        if (hitX) {
          // Up the wall, unless the player it hunts is below.
          if ((!this.noticed || dy < 8) && this.canClimb()) {
            this.wall = this.facing
            this.state = 'climb'
          } else this.facing = this.facing > 0 ? -1 : 1
        } else if (!this.noticed && !this.groundAhead()) {
          this.facing = this.facing > 0 ? -1 : 1
        }
        break
      }

      case 'climb': {
        const side = this.wall || this.facing
        // Launch off the wall at a player level with it on the open side.
        if (
          this.noticed &&
          this.cooldown === 0 &&
          toward === -side &&
          Math.abs(dx) < SNAKE.lungeX &&
          Math.abs(dy) < SNAKE.lungeY
        ) {
          this.facing = toward
          this.begin('coil', SNAKE.coilFrames)
          events.push('coil')
          break
        }
        // Climb toward the player's height; drop off when they are below.
        if (this.noticed && dy > 24) {
          this.letGo(-side as -1 | 1)
          break
        }
        // A ceiling, or the top of the map: the outer walls run on above it.
        const blocked =
          this.y <= 0 || this.level.boxHitsSolid(this.x, this.y - 1, this.w, 1)
        if (blocked) {
          this.letGo(-side as -1 | 1)
          break
        }
        this.y = Math.max(0, this.y - SNAKE.climb)
        if (!this.touchingWall(side)) {
          // Over the lip: onto the top of the wall.
          this.wall = 0
          this.y = Math.round((this.y + this.h) / TILE) * TILE - this.h
          this.level.move(this, side * 3, 0)
          this.state = 'fall'
        }
        break
      }

      case 'coil': {
        this.t--
        if (this.t <= 0) {
          const from = this.wall
          this.wall = 0
          this.state = 'lunge'
          this.vx = this.facing * SNAKE.lungeVX
          this.vy = SNAKE.lungeVY + Math.max(-1.2, Math.min(0, dy / 30))
          if (from) this.vy = Math.min(this.vy, -1)
          events.push('lunge')
        }
        break
      }

      case 'strike': {
        this.t--
        if (this.t <= 0) this.rest()
        break
      }

      case 'recover': {
        this.t--
        this.vx *= 0.8
        this.level.move(this, this.vx, 0)
        if (this.t <= 0) this.state = 'slither'
        break
      }

      case 'lunge':
      case 'fall': {
        this.vy = Math.min(this.vy + SNAKE.gravity, SNAKE.maxFall)
        const { hitX, ground } = this.level.move(this, this.vx, this.vy)
        if (hitX) this.vx = 0
        if (ground) {
          this.vy = 0
          if (this.state === 'lunge') this.rest()
          else {
            this.vx = 0
            this.state = 'slither'
          }
        } else if (
          this.vy < 0 &&
          this.level.boxHitsSolid(this.x, this.y - 1, this.w, 1)
        ) {
          this.vy = 0
        }
        break
      }
    }
  }

  private begin(state: SnakeState, frames: number) {
    this.state = state
    this.t = frames
    this.vx = 0
  }

  private rest() {
    this.state = 'recover'
    this.t = SNAKE.recover
    this.cooldown = 30
  }

  // Drops off the wall facing away from it, so a patrol does not walk
  // straight back into the same climb.
  private letGo(dir: -1 | 1) {
    this.wall = 0
    this.facing = dir
    this.state = 'fall'
    this.vx = dir * 0.6
    this.vy = 0
  }

  private touchingWall(side: number) {
    const x = side > 0 ? this.x + this.w : this.x - 1
    return this.level.boxHitsSolid(x, this.y, 1, this.h)
  }

  // Only a wall with open air above its face can be climbed out of.
  private canClimb() {
    return !this.level.boxHitsSolid(this.x, this.y - 1, this.w, 1)
  }

  private groundAhead() {
    const x = this.facing > 0 ? this.x + this.w + 1 : this.x - 2
    const ty = Math.floor((this.y + this.h + 1) / TILE)
    return this.level.tileAt(Math.floor(x / TILE), ty) !== EMPTY
  }

  get headX() {
    if (this.wall) return this.wall > 0 ? this.x + this.w - 3 : this.x + 3
    return this.facing > 0 ? this.x + this.w - 2 : this.x + 2
  }

  get headY() {
    if (this.wall) return this.y + 1
    return this.y + this.h - 4
  }
}

// Crimson and gold bands, a warning that reads even in the dark.
const SCALE = [PAL.C, PAL.G]
// Pixels between body joints, so the body keeps its length at any speed.
const SPACING = 2

// Joints laid at fixed spacing back along the head's path, carried on
// behind the snake where the path runs out.
function bodyPoints(s: Snake, head: P, segs: number): P[] {
  const pts: P[] = [head]
  let from = head
  let need = SPACING
  for (const t of s.trail) {
    let d = Math.hypot(t.x - from.x, t.y - from.y)
    while (d >= need && pts.length <= segs) {
      const k = need / d
      from = { x: from.x + (t.x - from.x) * k, y: from.y + (t.y - from.y) * k }
      pts.push(from)
      d -= need
      need = SPACING
    }
    need -= d
    from = t
    if (pts.length > segs) break
  }
  while (pts.length <= segs) {
    const last = pts[pts.length - 1]
    pts.push(
      s.wall
        ? { x: last.x, y: last.y + SPACING }
        : { x: last.x - s.facing * SPACING, y: last.y }
    )
  }
  return pts
}

// A segmented body along the trail, a raised head with a pale eye, and on a
// coil the body wound tight behind a reared head.
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  s: Snake,
  time: number
) {
  const fading = s.state === 'dead'
  if (fading && s.dying <= 0) return
  // A hit blinks bone white. A coil strobes flame white, the tell that a
  // lunge is coming.
  const flash =
    (s.hurtT > 0 && s.hurtT % 4 < 2) ||
    (s.state === 'coil' && (time >> 2) % 2 === 0)
  // Dissolving into embers from the tail up.
  const color = (c: string, i = 0) =>
    flash
      ? s.state === 'coil'
        ? PAL.y
        : PAL.B
      : fading && hash(i, time >> 2, 5) > s.dying
        ? PAL.e
        : c
  const segs = 9
  const head = { x: s.headX, y: s.headY }
  let raise = 0
  if (s.state === 'coil') raise = Math.round(Math.min(1, s.progress * 2) * 5)
  if (s.state === 'strike') raise = s.progress < 0.4 ? 5 : 1

  if (s.state === 'coil' && !s.wall) {
    // A tight spiral under the reared head.
    const cx = Math.round(s.x + s.w / 2 - s.facing * 2)
    const cy = Math.round(s.y + s.h - 3)
    for (let i = 0; i < 18; i++) {
      const a = i * 0.7 + time * 0.08
      const r = 5 - i * 0.22
      ctx.fillStyle = color(SCALE[i % SCALE.length], i)
      ctx.fillRect(
        Math.round(cx + Math.cos(a) * r * 1.3),
        Math.round(cy + Math.sin(a) * r * 0.6),
        2,
        2
      )
    }
  } else {
    // The body follows the head's recent path, with a travelling wave.
    const body = bodyPoints(s, head, segs)
    let prev = head
    for (let i = 1; i <= segs; i++) {
      const p = body[i]
      const wave = Math.sin(time * 0.25 - i * 0.9)
      const q = s.wall
        ? { x: p.x + wave, y: p.y }
        : { x: p.x, y: p.y + 2 + wave * 0.7 }
      ctx.fillStyle = color(SCALE[i % SCALE.length], i)
      pixelLine(ctx, prev.x, prev.y, q.x, q.y, i < segs - 2 ? 2 : 1)
      prev = q
    }
  }

  // Head: a wedge with an eye, lifted when rearing.
  const hx = Math.round(head.x)
  const hy = Math.round(head.y - raise)
  const f = s.wall ? 0 : s.facing
  ctx.fillStyle = color(PAL.C)
  ctx.fillRect(hx - 2, hy - 1, 4, 3)
  ctx.fillStyle = color(PAL.R)
  ctx.fillRect(hx - 2 + (f > 0 ? 3 : -1), hy, 1, 2)
  ctx.fillStyle = s.noticed ? PAL.y : PAL.k
  ctx.fillRect(hx + (f >= 0 ? 0 : -1), hy - 1, 1, 1)
  if (s.state === 'strike' && s.progress > 0.35 && s.progress < 0.65) {
    // Fangs out at full reach.
    ctx.fillStyle = PAL.C
    ctx.fillRect(hx + f * 3, hy + 1, 2, 1)
  }

  if (s.burn > 0) {
    for (let i = 0; i < 5; i++) {
      const p = s.trail[i * 3] ?? head
      const h = 2 + ((time + i * 3) % 4)
      ctx.fillStyle = i % 2 ? PAL.e : PAL.E
      ctx.fillRect(Math.round(p.x), Math.round(p.y) - h, 1, h)
    }
  }
}
