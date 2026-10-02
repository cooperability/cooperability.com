import type { ButtonSet, Frame } from '../input'
import { MAX_VIEW_W, VIEW_H, VIEW_W } from './background'
import { Boss, shotBox, WORD_W } from './boss'
import { Scarf, type HeroView } from './hero'
import { Level, SANDBOX_MAP, TILE } from './level'
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

// Health candles: dark until a torch lights one, then walked into for a
// candle of health, and back, dark again, `recharge` updates after.
// The box both lights and takes it.
export const PICKUP = { recharge: 300, w: 10, h: 14 }

export type Status = 'play' | 'dead' | 'won'

// What the player should feel: taking a hit, or landing the sword on an
// enemy. The shell turns each into a rumble or a vibration.
export type Haptic = 'hurt' | 'hit'

export type Pickup = {
  x: number
  y: number
  lit: boolean
  // Updates until it is back, 0 while it stands.
  recharge: number
}

export const pickupBox = (c: Pickup): Box => ({
  x: c.x - PICKUP.w / 2,
  y: c.y - PICKUP.h,
  w: PICKUP.w,
  h: PICKUP.h,
})

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
  // Sparks glow through the dark instead of sitting under it.
  glow?: boolean
}
type Ghost = { view: HeroView; life: number }
export type Banner = { text: string; color: string; t: number }
type Mote = { x: number; y: number; ember: boolean; phase: number }

export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const SPARKS = [PAL.E, PAL.y, PAL.e, PAL.E]

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
  readonly pickups: Pickup[]
  readonly snakes: Snake[]
  // Serpents on the map, slain or not.
  readonly total: number
  // Spawned by the last serpent's death, asleep until the player enters.
  boss: Boss | null = null
  // A line across the top of the screen, counting down.
  banner: Banner | null = null
  // What took the last candle, for the defeat screen: the enemy, and for
  // the boss the attack.
  killer = ''
  cause = ''
  torches: Torch[] = []
  particles: Particle[] = []
  // This update's haptics, for the shell to take after each step.
  readonly haptics: Haptic[] = []
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
  // Width of the view the camera frames, in game pixels.
  viewW = VIEW_W
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

  // `atBoss` starts on the sill of the boss's hall with the serpents already
  // slain: the retry after dying to the boss. `clock` carries the run's time.
  constructor(
    readonly map: string[] = SANDBOX_MAP,
    seed = 1,
    opts: { atBoss?: boolean; clock?: number } = {}
  ) {
    this.level = new Level(map)
    this.player = new Player(this.level)
    this.random = rng(seed)
    const props = this.level.props
    this.urns = props
      .filter((p) => p.kind === 'urn')
      .map((p) => ({ x: p.x, y: p.y, broken: false, respawn: 0 }))
    this.candles = props.filter((p) => p.kind === 'candle')
    this.pickups = props
      .filter((p) => p.kind === 'pickup')
      .map((p) => ({ x: p.x, y: p.y, lit: false, recharge: 0 }))
    const snakes = props
      .filter((p) => p.kind === 'snake')
      .map((p) => new Snake(this.level, p.x, p.y))
    this.total = snakes.length
    const retry = !!opts.atBoss && !!this.level.sill
    this.snakes = retry ? [] : snakes
    // Across the widest view, as thick as 48 across the usual one.
    const motes = Math.round((48 * MAX_VIEW_W) / VIEW_W)
    this.motes = Array.from({ length: motes }, (_, i) => ({
      x: hash(i, 1, 40) * MAX_VIEW_W,
      y: hash(i, 2, 40) * VIEW_H,
      ember: hash(i, 3, 40) > 0.82,
      phase: hash(i, 4, 40) * 6.28,
    }))
    this.camY = this.level.pixelHeight - VIEW_H
    if (retry) {
      const sill = this.level.sill!
      this.kills = this.total
      this.clock = opts.clock ?? 0
      this.player.x = sill.x - this.player.w / 2
      this.player.y = sill.y - this.player.h
      this.spawnBoss()
      this.enterArena()
    }
    this.snapCamera()
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
      if (m.x > MAX_VIEW_W) m.x -= MAX_VIEW_W
    }
  }

  step({ held, pressed }: Frame) {
    this.time++
    this.statusT++
    this.haptics.length = 0
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
    this.stepBoss()
    this.stepTorches()
    this.stepPickups()
    if (this.banner && --this.banner.t <= 0) this.banner = null

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

  private burst(
    x: number,
    y: number,
    n: number,
    colors: string[],
    dir = 0,
    glow = false
  ) {
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
        glow,
      })
    }
  }

  // Sparks off a flame: they glow through the dark. `lift` sends them up,
  // as off a brand on the floor; without it they hang in the air behind.
  private spark(x: number, y: number, n: number, lift = 0) {
    for (let i = 0; i < n; i++) {
      const max = 18 + Math.floor(this.random() * 18)
      this.particles.push({
        x: x + (this.random() - 0.5) * 2,
        y: y + (this.random() - 0.5) * 2,
        vx: (this.random() - 0.5) * 0.6,
        vy: -this.random() * 0.4 - lift,
        life: max,
        max,
        color: SPARKS[Math.floor(this.random() * SPARKS.length)],
        gravity: lift ? 0.012 : 0.02,
        glow: true,
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
      this.haptics.push('hit')
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
    const b = this.boss
    if (!b) return
    const letter = b.vulnerable
      ? b.letterBoxes().find((l) => overlaps(box, l))
      : undefined
    if (letter && !this.hitThisSwing.has(b)) {
      this.hitThisSwing.add(b)
      b.hit(1)
      this.haptics.push('hit')
      this.hitPause = HIT_PAUSE
      this.shake = 6
      this.burst(
        letter.x + letter.w / 2,
        letter.y + letter.h / 2,
        10,
        [PAL.B, PAL.G, PAL.y],
        p.facing
      )
    }
    // The sword cuts thrown and falling letters out of the air.
    for (const s of b.shots) {
      if (s.dead || s.kind === 'wave' || !overlaps(box, shotBox(s))) continue
      s.dead = true
      this.burst(s.x + s.w / 2, s.y + s.h / 2, 6, [PAL.C, PAL.B], p.facing)
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
      // A trail of sparks in flight, and sparks rising off a brand on the
      // floor until it burns low.
      if (!t.landed) this.spark(t.x + t.w / 2, t.y, 1 + (this.time % 2))
      else if (this.time % 4 === 0 && this.random() < t.strength)
        this.spark(t.x + t.w / 2 + 2, t.y - 4, 1, 0.5)
      for (const c of this.pickups) {
        if (c.lit || c.recharge || !overlaps(t, pickupBox(c))) continue
        c.lit = true
        this.spark(c.x, c.y - 7, 8, 0.4)
      }
      for (const s of this.snakes) {
        if (!s.alive || !overlaps(t, s)) continue
        s.ignite()
        if (!t.landed) {
          t.spent = true
          this.burst(t.x, t.y, 12, SPARKS, 0, true)
        }
      }
      const b = this.boss
      if (b?.vulnerable && b.letterBoxes().some((l) => overlaps(t, l))) {
        b.ignite()
        if (!t.landed) {
          t.spent = true
          this.burst(t.x, t.y, 12, SPARKS, 0, true)
        }
      }
    }
    this.torches = this.torches.filter((t) => !t.spent)
  }

  // A lit candle gives a candle of health to a player short of one, then
  // sits spent until it recharges.
  private stepPickups() {
    const p = this.player
    for (const c of this.pickups) {
      if (c.recharge > 0) {
        if (--c.recharge === 0) this.puff(c.x, c.y - 3, 4, 0.6)
        continue
      }
      if (!c.lit || this.status !== 'play' || this.hp >= MAX_HP) continue
      if (!overlaps(pickupBox(c), p)) continue
      this.hp++
      c.lit = false
      c.recharge = PICKUP.recharge
      this.spark(c.x, c.y - 7, 14, 0.8)
    }
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
      if (bite && overlaps(bite, p)) this.hurt(s.x + s.w / 2, 'SERPENT', '')
    }
    // The last serpent gone: with a hall on the map its boss rises, and
    // without one the run is won.
    if (
      this.status === 'play' &&
      !this.boss &&
      this.kills >= this.total &&
      this.snakes.every((s) => s.gone)
    ) {
      if (this.level.arena) {
        this.spawnBoss()
        this.announce('THE BELFRY GATE IS OPEN', PAL.E, 240)
      } else this.setStatus('won')
    }
  }

  // Takes a candle unless the player is in mercy frames, rolling or mid
  // climb, and throws them away from `fromX`. True when it landed.
  private hurt(fromX: number, killer: string, cause: string) {
    const p = this.player
    if (
      this.status !== 'play' ||
      this.invuln > 0 ||
      p.invulnerable ||
      p.pose === 'climb'
    )
      return false
    this.hp--
    this.haptics.push('hurt')
    this.invuln = INVULN
    this.killer = killer
    this.cause = cause
    const away: -1 | 1 = p.x + p.w / 2 < fromX ? -1 : 1
    p.knock(away)
    this.hitPause = 6
    this.shake = 8
    this.burst(p.x + p.w / 2, p.y + 10, 10, [PAL.R, PAL.C, PAL.r], away)
    if (this.hp <= 0) this.setStatus('dead')
    return true
  }

  private announce(text: string, color: string, frames = 120) {
    this.banner = { text, color, t: frames }
  }

  private spawnBoss() {
    this.boss = new Boss(this.level.arena!, this.random)
    this.level.setGate(true)
  }

  // Through the gate: it slams shut behind, the candles rekindle, and the
  // boss wakes.
  private enterArena() {
    this.level.setGate(false)
    this.hp = MAX_HP
    this.shake = 8
    this.boss!.wake()
  }

  private stepBoss() {
    const b = this.boss
    const arena = this.level.arena
    if (!b || !arena) return
    const p = this.player
    if (!b.awake && this.status === 'play' && p.x >= arena.left)
      this.enterArena()
    for (const e of b.step(p)) {
      if (e.kind === 'say') {
        this.announce(e.text, e.attack ? PAL.C : PAL.E, e.attack ? 90 : 150)
        continue
      }
      if (e.kind === 'land') {
        this.shake = 4
        this.puff(e.x, e.y, 6, 1.4)
      }
      if (e.kind === 'slam') {
        this.shake = 12
        this.puff(e.x, e.y, 24, 3.5, PAL.t, 1)
      }
      if (e.kind === 'clash') {
        this.shake = 10
        this.burst(e.x, e.y, 14, [PAL.B, PAL.G, PAL.g])
      }
      if (e.kind === 'roar') {
        this.shake = 16
        this.burst(e.x, e.y, 20, [PAL.C, PAL.E, PAL.B])
      }
      if (e.kind === 'fire') this.puff(e.x, e.y, 2, 0.6, PAL.C, 0.3)
      if (e.kind === 'shatter') this.burst(e.x, e.y, 5, [PAL.C, PAL.B, PAL.G])
    }
    if (b.burn > 0 && this.time % 3 === 0) {
      const l = b.letterBoxes()[this.time % 7]
      if (l) this.puff(l.x + l.w / 2, l.y, 1, 0.6, PAL.E, 0.8)
    }
    for (const box of b.contact())
      if (
        overlaps(box, p) &&
        this.hurt(box.x + box.w / 2, 'SOCIETY', b.contactCause)
      )
        break
    for (const s of b.shots) {
      if (s.dead || !overlaps(shotBox(s), p)) continue
      if (this.hurt(s.x + s.w / 2, 'SOCIETY', s.cause) && s.kind !== 'wave') {
        s.dead = true
        this.burst(s.x + s.w / 2, s.y + s.h / 2, 6, [PAL.C, PAL.B])
      }
    }
    if (b.gone && this.status === 'play') this.setStatus('won')
  }

  private snapCamera() {
    for (let i = 0; i < 200; i++) this.updateCamera()
  }

  private updateCamera() {
    const p = this.player
    // The boss's entrance takes the frame, on a view too narrow for both.
    const cx =
      this.boss?.state === 'intro'
        ? this.boss.x + WORD_W / 2
        : p.x + p.w / 2 + p.facing * 28
    const cy = p.y + p.h / 2 - 12
    this.camX += (cx - this.viewW / 2 - this.camX) * 0.1
    // The boss's hall stays out of view until the fight, then the view
    // holds on it, its gate wall at the left edge and its floor at the foot.
    const arena = this.level.arena
    const fighting = arena && this.boss?.awake
    let lo = 0
    let hi = this.level.pixelWidth - this.viewW
    // A view wider than the hall shows more of the belfry, never the void
    // past the map's right edge.
    if (arena && fighting) lo = Math.min(arena.left - TILE, hi)
    else if (arena) hi = Math.min(hi, arena.left - this.viewW)
    const targetY = fighting ? arena.top - 8 : cy - VIEW_H / 2
    // Vertical deadzone, so small hops do not bob the view.
    if (fighting) this.camY += (targetY - this.camY) * 0.1
    else if (Math.abs(targetY - this.camY) > 18)
      this.camY +=
        (targetY - this.camY - Math.sign(targetY - this.camY) * 18) * 0.12
    this.camX = Math.max(lo, Math.min(Math.max(lo, hi), this.camX))
    this.camY = Math.max(
      0,
      Math.min(this.level.pixelHeight - VIEW_H, this.camY)
    )
  }
}
