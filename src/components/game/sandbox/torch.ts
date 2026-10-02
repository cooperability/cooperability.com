import type { Level } from './level'
import { hash, PAL } from './pixels'

export const TORCH = {
  size: 4,
  // A flat toss: little lift, so it drops onto whatever is below and ahead.
  throwVX: 2.4,
  throwVY: -0.6,
  gravity: 0.2,
  maxFall: 4,
  cooldown: 60,
  // Frames a landed torch keeps burning on the floor.
  lying: 150,
  max: 3,
  // Height of a landed torch's flame at full strength, in pixels.
  flame: 9,
}

export class Torch {
  x: number
  y: number
  w = TORCH.size
  h = TORCH.size
  vy = TORCH.throwVY
  vx: number
  landed = false
  life = TORCH.lying
  spent = false

  constructor(
    private level: Level,
    cx: number,
    cy: number,
    facing: -1 | 1,
    carryVX = 0
  ) {
    this.x = cx - TORCH.size / 2
    this.y = cy - TORCH.size / 2
    this.vx = facing * TORCH.throwVX + carryVX * 0.3
  }

  // 0 to 1 as a landed torch burns out.
  get strength() {
    return this.landed ? this.life / TORCH.lying : 1
  }

  step() {
    if (this.landed) {
      if (--this.life <= 0) this.spent = true
      return
    }
    this.vy = Math.min(this.vy + TORCH.gravity, TORCH.maxFall)
    const { hitX, ground } = this.level.move(this, this.vx, this.vy)
    // Off a wall it drops straight down.
    if (hitX) this.vx = 0
    if (ground) {
      this.landed = true
      this.vx = 0
      this.vy = 0
    }
  }
}

// A three-wide flame standing on (x, base), `h` tall, its tip licking to
// one side. Fire rises whichever way the brand is turned.
export function drawFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  h: number,
  flick: number
) {
  ctx.fillStyle = PAL.e
  ctx.fillRect(x - 1, base - h, 3, h)
  ctx.fillStyle = PAL.E
  ctx.fillRect(x - 1 + (flick === 2 ? 1 : 0), base - h + 2, 2, h - 2)
  ctx.fillStyle = PAL.y
  ctx.fillRect(x, base - 3, 1, 2)
  ctx.fillStyle = PAL.e
  ctx.fillRect(x + flick - 1, base - h - 1, 1, 1)
}

const flickOf = (time: number, salt: number) =>
  Math.floor(hash(time >> 2, salt, 41) * 3)

export function drawTorch(
  ctx: CanvasRenderingContext2D,
  t: Torch,
  time: number
) {
  const x = Math.round(t.x + t.w / 2)
  const y = Math.round(t.y + t.h)
  const flick = flickOf(time, x)
  if (t.landed) {
    // A brand on its side, burning high, the flame sinking as it burns out.
    ctx.fillStyle = PAL.o
    ctx.fillRect(x - 3, y - 1, 6, 1)
    ctx.fillStyle = PAL.O
    ctx.fillRect(x - 3, y - 2, 4, 1)
    const h = Math.max(2, Math.round(t.strength * TORCH.flame)) + (flick >> 1)
    drawFlame(ctx, x + 2, y - 1, h, flick)
    return
  }
  // Tumbling end over end.
  const turn = (time >> 2) % 4
  const [dx, dy] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
  ][turn]
  ctx.fillStyle = PAL.O
  ctx.fillRect(x - dx * 2, y - 2 - dy * 2, 2, 2)
  drawFlame(ctx, x + dx * 2, y - 1 + dy * 2, 5 + (flick >> 1), flick)
}
