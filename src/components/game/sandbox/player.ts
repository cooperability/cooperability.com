import { EMPTY, Level, ONEWAY, SOLID, TILE } from './level'

// All speeds are pixels per 60 Hz update. Jump height at full hold is
// jumpV^2 / (2 * gravity) = 42px, just over 2.5 tiles, so a 3-tile wall
// needs a ledge grab or a wall jump.
export const TUNING = {
  run: 1.7,
  accelGround: 0.22,
  accelAir: 0.14,
  friction: 0.3,
  airFriction: 0.06,
  gravity: 0.24,
  fallGravity: 0.38,
  maxFall: 4.6,
  jumpV: -4.5,
  jumpCut: 0.45,
  coyote: 6,
  buffer: 7,
  wallSlide: 1.1,
  wallJumpX: 2.3,
  wallJumpY: -4.2,
  wallLock: 9,
  wallCoyote: 5,
  rollFrames: 16,
  rollStart: 3.2,
  rollEnd: 1.4,
  airDashFrames: 11,
  airDashSpeed: 3.6,
  dashCooldown: 14,
  attackFrames: 20,
  climbFrames: 16,
  regrab: 12,
  drop: 10,
}

export const PLAYER_W = 10
export const PLAYER_H = 26
export const ROLL_H = 12

export type PlayerInput = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jumpHeld: boolean
  // Pressed this update.
  jump: boolean
  dash: boolean
  attack: boolean
}

export type PlayerEvent =
  | 'jump'
  | 'walljump'
  | 'land'
  | 'turn'
  | 'roll'
  | 'airdash'
  | 'attack'
  | 'hang'
  | 'climb'

export type Pose =
  | 'idle'
  | 'run'
  | 'rise'
  | 'fall'
  | 'wall'
  | 'hang'
  | 'climb'
  | 'roll'
  | 'airdash'
  | 'attack'

export type Box = { x: number; y: number; w: number; h: number }

const approach = (v: number, target: number, step: number) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target)

export class Player {
  x = 0
  y = 0
  vx = 0
  vy = 0
  w = PLAYER_W
  h = PLAYER_H
  facing: 1 | -1 = 1
  onGround = false
  // Side of the wall being slid down, or 0.
  wall: -1 | 0 | 1 = 0
  hanging = false
  dash: 'roll' | 'air' | null = null
  attackT = 0
  // Impact speed of the last landing, for squash and dust.
  landSpeed = 0

  private coyote = 0
  private buffer = 0
  private jumping = false
  private wallLock = 0
  private wallCoyote = 0
  private wallCoyoteSide: -1 | 1 = 1
  private dashT = 0
  private dashCooldown = 0
  private airDashReady = true
  private hangSide: -1 | 1 = 1
  private regrab = 0
  private dropT = 0
  private climbT = 0
  private climbFrom = { x: 0, y: 0 }
  private climbTo = { x: 0, y: 0 }
  private events: PlayerEvent[] = []

  constructor(private level: Level) {
    this.respawn()
  }

  respawn() {
    Object.assign(this, {
      x: this.level.spawn.x - PLAYER_W / 2,
      y: this.level.spawn.y - PLAYER_H,
      vx: 0,
      vy: 0,
      h: PLAYER_H,
      hanging: false,
      dash: null,
      dashT: 0,
      climbT: 0,
      attackT: 0,
    })
  }

  get pose(): Pose {
    if (this.climbT > 0) return 'climb'
    if (this.hanging) return 'hang'
    if (this.dash === 'roll') return 'roll'
    if (this.dash === 'air') return 'airdash'
    if (this.attackT > 0) return 'attack'
    if (this.wall) return 'wall'
    if (!this.onGround) return this.vy < 0 ? 'rise' : 'fall'
    return Math.abs(this.vx) > 0.3 ? 'run' : 'idle'
  }

  // 0 at the start of a pose-specific action, rising to 1 at its end.
  get actionProgress(): number {
    if (this.climbT > 0) return 1 - this.climbT / TUNING.climbFrames
    if (this.dash === 'roll') return 1 - this.dashT / TUNING.rollFrames
    if (this.dash === 'air') return 1 - this.dashT / TUNING.airDashFrames
    if (this.attackT > 0) return 1 - this.attackT / TUNING.attackFrames
    return 0
  }

  get invulnerable() {
    return this.dash === 'roll'
  }

  // The blade's reach, only during the swing's active frames.
  attackBox(): Box | null {
    const t = TUNING.attackFrames - this.attackT
    if (this.attackT === 0 || t < 4 || t > 10) return null
    const w = 30
    const x = this.facing > 0 ? this.x + this.w - 2 : this.x - w + 2
    return { x, y: this.y + 2, w, h: 20 }
  }

  step(input: PlayerInput): PlayerEvent[] {
    this.events = []
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    if (input.jump) this.buffer = TUNING.buffer
    if (!this.onGround && this.coyote > 0) this.coyote--
    for (const key of [
      'wallLock',
      'wallCoyote',
      'dashCooldown',
      'regrab',
      'dropT',
    ] as const)
      if (this[key] > 0) this[key]--

    if (this.climbT > 0) {
      this.stepClimb()
      return this.events
    }
    if (this.hanging) {
      this.stepHang(input, dir)
      this.tickBuffer()
      return this.events
    }

    if (input.attack && this.attackT === 0 && this.dash !== 'roll') {
      this.attackT = TUNING.attackFrames
      if (this.wall) this.facing = this.wall > 0 ? -1 : 1
      this.events.push('attack')
    }

    if (input.dash && !this.dash && this.dashCooldown === 0) {
      if (dir) this.facing = dir > 0 ? 1 : -1
      if (this.onGround) this.startRoll()
      else if (this.airDashReady) this.startAirDash()
    }

    if (this.dash) this.stepDash(dir)
    else this.steer(dir)

    if (this.buffer > 0 && this.dash !== 'air') {
      if (this.onGround || this.coyote > 0) {
        if (input.down && this.standingOnOneWay()) {
          this.dropT = TUNING.drop
          this.onGround = false
          this.coyote = 0
          this.buffer = 0
        } else if (this.dash !== 'roll' || this.canStand()) {
          if (this.dash === 'roll') this.endRoll()
          this.jump()
        }
      } else {
        const side =
          this.wallContact() || (this.wallCoyote && this.wallCoyoteSide)
        if (side && (this.dash !== 'roll' || this.canStand())) {
          if (this.dash === 'roll') this.endRoll()
          this.wallJump(side)
        }
      }
    }

    // Letting go early cuts the rise, which is what makes hops possible.
    if (this.jumping && !input.jumpHeld && this.vy < 0) {
      this.vy *= TUNING.jumpCut
      this.jumping = false
    }
    if (this.vy >= 0) this.jumping = false

    if (this.dash !== 'air') {
      const falling = this.vy > 0 || !input.jumpHeld
      this.vy = Math.min(
        this.vy + (falling ? TUNING.fallGravity : TUNING.gravity),
        TUNING.maxFall
      )
    }

    this.wall = 0
    if (!this.onGround && !this.dash && this.vy > 0) {
      const side = this.wallContact()
      if (side && dir === side) {
        this.wall = side
        this.vy = Math.min(this.vy, TUNING.wallSlide)
        this.airDashReady = true
        this.wallCoyote = TUNING.wallCoyote
        this.wallCoyoteSide = side
      }
    }

    const wasGround = this.onGround
    const impact = this.vy
    this.moveX(this.vx)
    this.moveY(this.vy)
    if (this.onGround) {
      this.coyote = TUNING.coyote
      this.airDashReady = true
      if (!wasGround) {
        this.landSpeed = impact
        this.events.push('land')
      }
    }

    if (
      !this.onGround &&
      !this.dash &&
      this.vy >= 0 &&
      this.regrab === 0 &&
      this.attackT === 0 &&
      dir !== 0
    )
      this.tryLedge(dir > 0 ? 1 : -1)

    if (this.attackT > 0) this.attackT--
    this.tickBuffer()
    return this.events
  }

  private tickBuffer() {
    if (this.buffer > 0) this.buffer--
  }

  private steer(dir: number) {
    const attackingOnGround = this.attackT > 0 && this.onGround
    if (this.wallLock > 0) return
    if (dir && !attackingOnGround) {
      const accel = this.onGround ? TUNING.accelGround : TUNING.accelAir
      this.vx = approach(this.vx, dir * TUNING.run, accel)
      const face = dir > 0 ? 1 : -1
      if (face !== this.facing && this.attackT === 0) {
        if (this.onGround) this.events.push('turn')
        this.facing = face
      }
    } else {
      const drag = this.onGround ? TUNING.friction : TUNING.airFriction
      this.vx = approach(this.vx, 0, drag)
    }
  }

  private jump() {
    this.vy = TUNING.jumpV
    this.onGround = false
    this.coyote = 0
    this.buffer = 0
    this.jumping = true
    this.events.push('jump')
  }

  private wallJump(side: -1 | 1) {
    this.vx = -side * TUNING.wallJumpX
    this.vy = TUNING.wallJumpY
    this.facing = side > 0 ? -1 : 1
    this.wallLock = TUNING.wallLock
    this.wallCoyote = 0
    this.buffer = 0
    this.jumping = true
    this.wall = 0
    this.events.push('walljump')
  }

  private startRoll() {
    this.dash = 'roll'
    this.dashT = TUNING.rollFrames
    this.y += PLAYER_H - ROLL_H
    this.h = ROLL_H
    this.attackT = 0
    this.events.push('roll')
  }

  private endRoll() {
    this.dash = null
    this.dashT = 0
    this.y -= PLAYER_H - ROLL_H
    this.h = PLAYER_H
    this.dashCooldown = TUNING.dashCooldown
  }

  private startAirDash() {
    this.dash = 'air'
    this.dashT = TUNING.airDashFrames
    this.airDashReady = false
    this.vy = 0
    this.jumping = false
    this.events.push('airdash')
  }

  private stepDash(dir: number) {
    this.dashT--
    if (this.dash === 'roll') {
      const t = this.dashT / TUNING.rollFrames
      const speed = TUNING.rollEnd + (TUNING.rollStart - TUNING.rollEnd) * t
      this.vx = this.facing * speed
      // Under a low ceiling the roll becomes a crawl the player steers,
      // either way, until there is headroom to stand.
      if (this.dashT <= 0) {
        if (this.canStand()) this.endRoll()
        else {
          this.dashT = 1
          if (dir) this.facing = dir > 0 ? 1 : -1
          this.vx = dir ? this.facing * TUNING.rollEnd : 0
        }
      }
    } else {
      this.vx = this.facing * TUNING.airDashSpeed
      this.vy = 0
      if (this.dashT <= 0) {
        this.dash = null
        this.vx = this.facing * TUNING.run
        this.dashCooldown = TUNING.dashCooldown
      }
    }
  }

  private canStand() {
    const lift = PLAYER_H - this.h
    return !this.level.boxHitsSolid(this.x, this.y - lift, this.w, PLAYER_H)
  }

  private standingOnOneWay() {
    const ty = Math.floor((this.y + this.h + 1) / TILE)
    const x0 = Math.floor(this.x / TILE)
    const x1 = Math.floor((this.x + this.w - 0.001) / TILE)
    let oneway = false
    for (let tx = x0; tx <= x1; tx++) {
      const tile = this.level.tileAt(tx, ty)
      if (tile === SOLID) return false
      if (tile === ONEWAY) oneway = true
    }
    return oneway
  }

  // Which side has a wall flush against the body, ignoring the feet and head
  // so a floor or ceiling corner does not count.
  private wallContact(): -1 | 0 | 1 {
    const { x, y, w, h } = this
    if (this.level.boxHitsSolid(x - 1, y + 4, 1, h - 8)) return -1
    if (this.level.boxHitsSolid(x + w, y + 4, 1, h - 8)) return 1
    return 0
  }

  private moveX(dx: number) {
    this.x += dx
    const y0 = Math.floor(this.y / TILE)
    const y1 = Math.floor((this.y + this.h - 0.001) / TILE)
    const tx =
      dx > 0
        ? Math.floor((this.x + this.w - 0.001) / TILE)
        : Math.floor(this.x / TILE)
    if (dx === 0) return
    for (let ty = y0; ty <= y1; ty++) {
      if (!this.level.isSolid(tx, ty)) continue
      this.x = dx > 0 ? tx * TILE - this.w : (tx + 1) * TILE
      this.vx = 0
      return
    }
  }

  private moveY(dy: number) {
    const prevBottom = this.y + this.h
    this.y += dy
    this.onGround = false
    const x0 = Math.floor(this.x / TILE)
    const x1 = Math.floor((this.x + this.w - 0.001) / TILE)
    if (dy > 0) {
      const ty = Math.floor((this.y + this.h - 0.001) / TILE)
      for (let tx = x0; tx <= x1; tx++) {
        const tile = this.level.tileAt(tx, ty)
        const top = ty * TILE
        const landsOnBeam =
          tile === ONEWAY && prevBottom <= top + 0.001 && this.dropT === 0
        if (tile === SOLID || landsOnBeam) {
          this.y = top - this.h
          this.vy = 0
          this.onGround = true
          return
        }
      }
    } else if (dy < 0) {
      const ty = Math.floor(this.y / TILE)
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.level.isSolid(tx, ty)) continue
        this.y = (ty + 1) * TILE
        this.vy = 0
        this.jumping = false
        return
      }
    }
  }

  private tryLedge(side: -1 | 1) {
    const frontX = side > 0 ? this.x + this.w + 1 : this.x - 1
    const tx = Math.floor(frontX / TILE)
    const handY = this.y + 4
    const ty = Math.floor(handY / TILE)
    const top = ty * TILE
    if (!this.level.isSolid(tx, ty)) return
    if (this.level.tileAt(tx, ty - 1) !== EMPTY) return
    if (handY - top > 8) return
    const standX = side > 0 ? tx * TILE : (tx + 1) * TILE - this.w
    if (this.level.boxHitsSolid(standX, top - PLAYER_H, this.w, PLAYER_H))
      return
    // The hanging body sits up to 8px higher than now, so it must fit too.
    const hangX = side > 0 ? tx * TILE - this.w : (tx + 1) * TILE
    if (this.level.boxHitsSolid(hangX, top - 4, this.w, PLAYER_H)) return
    this.hanging = true
    this.hangSide = side
    this.facing = side
    this.vx = 0
    this.vy = 0
    this.wall = 0
    this.y = top - 4
    this.x = side > 0 ? tx * TILE - this.w : (tx + 1) * TILE
    this.airDashReady = true
    this.climbTo = { x: standX, y: top - PLAYER_H }
    this.events.push('hang')
  }

  private stepHang(input: PlayerInput, dir: number) {
    this.vx = 0
    this.vy = 0
    if (this.buffer > 0 && dir === -this.hangSide) {
      this.hanging = false
      this.wallJump(this.hangSide)
    } else if (this.buffer > 0 || input.up) {
      this.hanging = false
      this.buffer = 0
      this.climbT = TUNING.climbFrames
      this.climbFrom = { x: this.x, y: this.y }
      this.events.push('climb')
    } else if (input.down) {
      this.hanging = false
      this.regrab = TUNING.regrab
    }
  }

  private stepClimb() {
    this.climbT--
    const t = 1 - this.climbT / TUNING.climbFrames
    // Up first, then over the lip.
    const up = Math.min(1, t * 1.6)
    const over = Math.max(0, (t - 0.4) / 0.6)
    this.y = this.climbFrom.y + (this.climbTo.y - this.climbFrom.y) * up
    this.x = this.climbFrom.x + (this.climbTo.x - this.climbFrom.x) * over
    if (this.climbT === 0) {
      this.x = this.climbTo.x
      this.y = this.climbTo.y
      this.onGround = true
      this.coyote = TUNING.coyote
    }
  }
}
