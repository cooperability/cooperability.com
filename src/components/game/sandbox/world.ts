import type { ButtonSet, Frame } from '../input'
import { VIEW_H, VIEW_W } from './background'
import { Scarf, type HeroView } from './hero'
import { Level, SANDBOX_MAP } from './level'
import { hash, PAL } from './pixels'
import { Player, type Box, type PlayerEvent } from './player'
import { Snake } from './snake'
import { Torch, TORCH } from './torch'

export const MAX_HP = 5
// Frames of mercy after a bite, so one lunge cannot land twice.
export const INVULN = 60
export const URN_RESPAWN = 300
export const HIT_PAUSE = 4
export const GHOST_LIFE = 12

export type Status = 'play' | 'dead' | 'won'

type Urn = { x: number; y: number; broken: boolean; respawn: number }
export type Particle = {
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

export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

// Seeded, so a run replays the same from the same inputs.
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Everything that moves, with no canvas: the renderer draws it, tests and
// the QA runner step it directly.
export class World {
  readonly level: Level
  readonly player: Player
  readonly scarf = new Scarf()
  readonly urns: Urn[]
  readonly candles: { x: number; y: number }[]
  readonly snakes: Snake[]
  torches: Torch[] = []
  particles: Particle[] = []
  ghosts: Ghost[] = []
  readonly motes: Mote[]

  time = 0
  // Updates of play, for the win screen's clock.
  clock = 0
  hitPause = 0
  shake = 0
  squash = 0
  runPhase = 0
  camX = 0
  camY: number
  hp = MAX_HP
  invuln = 0
  kills = 0
  torchCooldown = 0
  status: Status = 'play'
  // Updates since the status last changed.
  statusT = 0

  private random: () => number
  private hitThisSwing = new Set<object>()
  private carried: ButtonSet = new Set()

  constructor(
    readonly map: string[] = SANDBOX_MAP,
    seed = 1
  ) {
    this.level = new Level(map)
    this.player = new Player(this.level)
    this.random = rng(seed)
    const props = this.level.props
    this.urns = props
      .filter((p) => p.kind === 'urn')
      .map((p) => ({ x: p.x, y: p.y, broken: false, respawn: 0 }))
    this.candles = props.filter((p) => p.kind === 'candle')
    this.snakes = props
      .filter((p) => p.kind === 'snake')
      .map((p) => new Snake(this.level, p.x, p.y))
    this.motes = Array.from({ length: 48 }, (_, i) => ({
      x: hash(i, 1, 40) * VIEW_W,
      y: hash(i, 2, 40) * VIEW_H,
      ember: hash(i, 3, 40) > 0.82,
      phase: hash(i, 4, 40) * 6.28,
    }))
    this.camY = this.level.pixelHeight - VIEW_H
    this.snapCamera()
  }

  get total() {
    return this.snakes.length
  }

  view(): HeroView {
    const p = this.player
    return {
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      vx: p.vx,
      vy: p.vy,
      facing: p.facing,
      wall: p.wall,
      actionProgress: p.actionProgress,
      attackUp: p.attackUp,
      pose: p.pose,
      time: this.time,
      runPhase: this.runPhase,
      squash: this.squash,
    }
  }

  // Ash and embers drift even while paused.
  drift() {
    for (const m of this.motes) {
      m.phase += 0.02
      m.y += m.ember ? -0.15 : 0.22
      m.x += Math.sin(m.phase) * 0.2 + (m.ember ? 0 : 0.1)
      if (m.y > VIEW_H) m.y -= VIEW_H
      if (m.y < 0) m.y += VIEW_H
      if (m.x > VIEW_W) m.x -= VIEW_W
    }
  }

  step({ held, pressed }: Frame) {
    this.time++
    this.statusT++
    // Presses made during hit-pause still count once play resumes.
    if (this.hitPause > 0) {
      this.hitPause--
      pressed.forEach((b) => this.carried.add(b))
      return
    }
    if (this.carried.size) {
      pressed = new Set([...pressed, ...this.carried])
      this.carried.clear()
    }

    const player = this.player
    const alive = this.status !== 'dead'
    if (this.status === 'play') this.clock++
    const events = alive
      ? player.step({
          left: held.has('left'),
          right: held.has('right'),
          up: held.has('up'),
          down: held.has('down'),
          jumpHeld: held.has('a'),
          jump: pressed.has('a'),
          dash: pressed.has('b'),
          attack: pressed.has('x'),
        })
      : []
    this.react(events)
    if (alive) {
      this.strike()
      if (pressed.has('y')) this.throwTorch()
    }
    if (this.torchCooldown > 0) this.torchCooldown--
    if (this.invuln > 0) this.invuln--

    if (player.pose === 'run') {
      this.runPhase += Math.abs(player.vx) * 0.14
      if (this.time % 12 === 0) this.puff(this.feet().x, this.feet().y, 1, 0.6)
    }
    if (player.pose === 'wall' && this.time % 5 === 0)
      this.puff(this.feet().x + player.wall * 5, player.y + 6, 1, 0.3)
    if (player.dash && this.time % 2 === 0)
      this.ghosts.push({ view: this.view(), life: GHOST_LIFE })
    this.squash *= 0.8

    this.scarf.step(
      player.x + player.w / 2 - player.facing * 2,
      player.y + (player.dash === 'roll' ? 4 : 7),
      player.facing,
      this.time
    )

    this.stepSnakes()
    this.stepTorches()

    this.particles = this.particles.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.96
      return --p.life > 0
    })
    this.ghosts = this.ghosts.filter((g) => --g.life > 0)
    for (const urn of this.urns) {
      if (urn.broken && --urn.respawn <= 0) {
        urn.broken = false
        this.puff(urn.x, urn.y - 4, 6, 1)
      }
    }
    if (this.shake > 0) this.shake--
    this.updateCamera()
  }

  private setStatus(status: Status) {
    this.status = status
    this.statusT = 0
  }

  private feet() {
    const p = this.player
    return { x: p.x + p.w / 2, y: p.y + p.h }
  }

  private puff(
    x: number,
    y: number,
    count: number,
    spread: number,
    color = PAL.t,
    lift = 0.4
  ) {
    for (let i = 0; i < count; i++) {
      const max = 14 + Math.floor(this.random() * 12)
      this.particles.push({
        x,
        y,
        vx: (this.random() - 0.5) * spread,
        vy: -this.random() * lift,
        life: max,
        max,
        color,
        gravity: 0.02,
      })
    }
  }

  private burst(x: number, y: number, n: number, colors: string[], dir = 0) {
    for (let i = 0; i < n; i++) {
      const max = 30 + Math.floor(this.random() * 30)
      this.particles.push({
        x: x + (this.random() - 0.5) * 8,
        y: y + (this.random() - 0.5) * 8,
        vx: (this.random() - 0.5) * 3 + dir * 1.2,
        vy: -this.random() * 3 - 0.5,
        life: max,
        max,
        color: colors[i % colors.length],
        gravity: 0.18,
      })
    }
  }

  private react(events: PlayerEvent[]) {
    const f = this.feet()
    const p = this.player
    for (const e of events) {
      if (e === 'jump') this.puff(f.x, f.y, 5, 1.2)
      if (e === 'land') {
        this.squash = Math.min(1, p.landSpeed / 4.6)
        this.puff(
          f.x,
          f.y,
          Math.round(3 + this.squash * 8),
          1.8 + this.squash * 1.5
        )
      }
      if (e === 'turn') this.puff(f.x, f.y, 3, 0.8)
      if (e === 'walljump')
        this.puff(f.x - p.facing * 6, f.y - 12, 6, 1, PAL.t, 1)
      if (e === 'roll' || e === 'airdash') this.puff(f.x, f.y - 4, 6, 1.4)
    }
  }

  private strike() {
    const p = this.player
    const box = p.attackBox()
    if (!box) {
      if (p.attackT === 0) this.hitThisSwing.clear()
      return
    }
    for (const urn of this.urns) {
      if (urn.broken || this.hitThisSwing.has(urn)) continue
      if (!overlaps(box, { x: urn.x - 6, y: urn.y - 14, w: 12, h: 14 }))
        continue
      this.hitThisSwing.add(urn)
      urn.broken = true
      urn.respawn = URN_RESPAWN
      this.hitPause = HIT_PAUSE
      this.shake = 6
      this.burst(urn.x, urn.y - 8, 14, [PAL.R, PAL.B, PAL.b], p.facing)
      this.puff(urn.x, urn.y - 6, 6, 1, PAL.e, 0.8)
    }
    for (const s of this.snakes) {
      if (!s.alive || this.hitThisSwing.has(s) || !overlaps(box, s)) continue
      this.hitThisSwing.add(s)
      s.hit(1, p.facing)
      this.hitPause = HIT_PAUSE
      this.shake = 6
      this.burst(
        s.x + s.w / 2,
        s.y + s.h / 2,
        8,
        [PAL.m, PAL.M, PAL.r],
        p.facing
      )
    }
  }

  private throwTorch() {
    const p = this.player
    if (this.torchCooldown > 0) return
    if (p.pose === 'hang' || p.pose === 'climb' || p.pose === 'roll') return
    this.torchCooldown = TORCH.cooldown
    this.torches.push(
      new Torch(
        this.level,
        p.x + p.w / 2 + p.facing * 6,
        p.y + 10,
        p.facing,
        p.vx
      )
    )
    if (this.torches.length > TORCH.max) this.torches.shift()
  }

  private stepTorches() {
    for (const t of this.torches) {
      t.step()
      if (!t.landed && this.time % 2 === 0)
        this.puff(t.x + t.w / 2, t.y, 1, 0.4, PAL.e, 0.3)
      for (const s of this.snakes) {
        if (!s.alive || !overlaps(t, s)) continue
        s.ignite()
        if (!t.landed) {
          t.spent = true
          this.burst(t.x, t.y, 10, [PAL.E, PAL.e, PAL.y])
        }
      }
    }
    this.torches = this.torches.filter((t) => !t.spent)
  }

  private stepSnakes() {
    const p = this.player
    for (const s of this.snakes) {
      for (const e of s.step(p)) {
        if (e === 'died') {
          this.kills++
          this.burst(s.x + s.w / 2, s.y, 16, [PAL.E, PAL.e, PAL.m])
        }
        if (e === 'lunge') this.puff(s.x + s.w / 2, s.y + s.h, 4, 1)
      }
      if (s.burn > 0 && this.time % 3 === 0)
        this.puff(s.x + s.w / 2, s.y, 1, 0.6, PAL.E, 0.8)
      const bite = s.biteBox()
      if (
        bite &&
        this.status === 'play' &&
        this.invuln === 0 &&
        !p.invulnerable &&
        p.pose !== 'climb' &&
        overlaps(bite, p)
      ) {
        this.hp--
        this.invuln = INVULN
        const away: -1 | 1 = p.x + p.w / 2 < s.x + s.w / 2 ? -1 : 1
        p.knock(away)
        this.hitPause = 6
        this.shake = 8
        this.burst(p.x + p.w / 2, p.y + 10, 10, [PAL.R, PAL.C, PAL.r], away)
        if (this.hp <= 0) this.setStatus('dead')
      }
    }
    if (
      this.status === 'play' &&
      this.kills >= this.total &&
      this.snakes.every((s) => s.gone)
    )
      this.setStatus('won')
  }

  private snapCamera() {
    for (let i = 0; i < 200; i++) this.updateCamera()
  }

  private updateCamera() {
    const p = this.player
    const cx = p.x + p.w / 2 + p.facing * 28
    const cy = p.y + p.h / 2 - 12
    this.camX += (cx - VIEW_W / 2 - this.camX) * 0.1
    const targetY = cy - VIEW_H / 2
    // Vertical deadzone, so small hops do not bob the view.
    if (Math.abs(targetY - this.camY) > 18)
      this.camY +=
        (targetY - this.camY - Math.sign(targetY - this.camY) * 18) * 0.12
    this.camX = Math.max(0, Math.min(this.level.pixelWidth - VIEW_W, this.camX))
    this.camY = Math.max(
      0,
      Math.min(this.level.pixelHeight - VIEW_H, this.camY)
    )
  }
}
