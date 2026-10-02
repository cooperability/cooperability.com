import { drawText, glyphWidth } from './font'
import type { Arena } from './level'
import { hash, paintGrid, PAL } from './pixels'
import type { Box } from './player'

// The final boss: the word SOCIETY, in letters three pixels to the font
// pixel, with its O for a face. Pixels and 60 Hz updates, like SNAKE.
export const BOSS = {
  hp: 24,
  scale: 3,
  // Gap between the floor and the word's underside while it hovers: a jump
  // reaches it with an overhead swing, or from a beam.
  hover: 76,
  drift: 0.8,
  driftRage: 1.05,
  idle: 60,
  idleRage: 48,
  // Updates after reforming before the body hurts to touch again.
  grace: 30,
  introStagger: 12,
  introSay: 96,
  intro: 170,
  // Every attack but the slam winds up this long first.
  aim: 30,
  after: 40,
  // BRING YOU DOWN: rise, follow the player, hang, fall, sit dazed.
  rise: 30,
  track: 45,
  trackRage: 37,
  hold: 22,
  fallAccel: 0.6,
  fallMax: 8,
  stuck: 80,
  stuckRage: 65,
  wave: 2.6,
  waveRage: 2.9,
  // BREAK YOUR SPIRIT: one letter per gap, aimed.
  spiritGap: 8,
  spiritGapRage: 7,
  spiritSpeed: 2,
  spiritSpeedRage: 2.3,
  // PEER PRESSURE: split to the walls, brace, then close while hopping.
  gather: 40,
  brace: 30,
  squeeze: 1.8,
  squeezeRage: 2.15,
  hop: 10,
  // UNREALISTIC EXPECTATIONS: letters dropped from the ceiling.
  rainGap: 9,
  rainGapRage: 8,
  rainGravity: 0.1,
  rainMax: 3,
  rage: 90,
  // Burning deals one point at each of these frames left on the fuse.
  burnFrames: 90,
  burnTicks: [45, 0],
  die: 150,
}

export const WORD = 'SOCIETY'
const S = BOSS.scale
export const LETTER_H = 7 * S
const WIDTHS = [...WORD].map((ch) => glyphWidth(ch) * S)
const OFFSETS = WIDTHS.map((_, i) =>
  WIDTHS.slice(0, i).reduce((x, w) => x + w + S, 0)
)
export const WORD_W = OFFSETS[WORD.length - 1] + WIDTHS[WORD.length - 1]
// The O wears the hat, the monocle and the moustache.
const FACE = 1
// PEER PRESSURE splits the word into SOC and IETY.
const SPLIT = 3

export type Attack = 'down' | 'spirit' | 'pressure' | 'rain'

// Each attack's banner, and the line on the death screen when it kills.
export const ATTACKS: Record<Attack, { name: string; cause: string }> = {
  down: { name: 'BRING YOU DOWN', cause: 'SOCIETY BROUGHT YOU DOWN' },
  spirit: { name: 'BREAK YOUR SPIRIT', cause: 'SOCIETY BROKE YOUR SPIRIT' },
  pressure: { name: 'PEER PRESSURE', cause: 'YOU CAVED TO PEER PRESSURE' },
  rain: {
    name: 'UNREALISTIC EXPECTATIONS',
    cause: 'YOU DID NOT MEET EXPECTATIONS',
  },
}
export const BODY_CAUSE = 'SOCIETY WAS NOT AMUSED'
const SPIRIT = 'BREAKYOURSPIRIT'
const RAIN = 'EXPECTATIONS'
// Said over its head on every third hit.
const QUIPS = [
  'HOW RUDE',
  'UNCIVIL',
  'THE AUDACITY',
  'SEE ME AFTER',
  'NOT HERE',
]

export type BossState =
  'dormant' | 'intro' | 'idle' | Attack | 'stuck' | 'rage' | 'dying' | 'dead'

export type Shot = {
  kind: 'letter' | 'rain' | 'wave'
  ch: string
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  dead: boolean
  cause: string
}

export type BossEvent =
  | {
      kind: 'land' | 'slam' | 'clash' | 'roar' | 'fire' | 'shatter' | 'burned'
      x: number
      y: number
    }
  | { kind: 'say'; text: string; attack: boolean }

type Letter = { x: number; y: number; vx: number; vy: number; spin: number }

// What of a shot hurts: a letter's glyph with its corners forgiven.
export const shotBox = (s: Shot): Box =>
  s.kind === 'wave' ? s : { x: s.x + 2, y: s.y + 2, w: s.w - 4, h: s.h - 4 }

export class Boss {
  state: BossState = 'dormant'
  hp = BOSS.hp
  phase: 1 | 2 = 1
  // The whole word's top left while it holds together.
  x: number
  y: number
  vy = 0
  letters: Letter[]
  // Letters fall in one by one during the intro.
  shown = 0
  shots: Shot[] = []
  // The attack under way, or the last one.
  attack: Attack | null = null
  hurtT = 0
  burn = 0
  // Updates spent in the current state.
  t = 0
  // Health as the bar draws it: `fill` rises through the intro, and `lag`
  // trails a hit so the lost chunk shows.
  fill = 1
  lag = BOSS.hp
  quip: { text: string; t: number } | null = null
  // The player's centre, which the monocled eye follows.
  look = { x: 0, y: 0 }
  private time = 0
  private fired = 0
  private hits = 0
  private squeeze = 0
  private columns: number[] = []
  private events: BossEvent[] = []

  constructor(
    readonly arena: Arena,
    private random: () => number
  ) {
    this.x = this.centreX
    this.y = this.hoverY
    this.letters = OFFSETS.map((o) => ({
      x: this.x + o,
      y: this.y,
      vx: 0,
      vy: 0,
      spin: 0,
    }))
  }

  get hoverY() {
    return this.arena.floor - BOSS.hover - LETTER_H
  }

  private get centreX() {
    return (this.arena.left + this.arena.right - WORD_W) / 2
  }

  private get floorY() {
    return this.arena.floor - LETTER_H
  }

  get awake() {
    return this.state !== 'dormant'
  }

  get gone() {
    return this.state === 'dead'
  }

  // Takes damage from the sword and fire.
  get vulnerable() {
    return !['dormant', 'intro', 'rage', 'dying', 'dead'].includes(this.state)
  }

  // The slam's hang and the squeeze's brace strobe: the tells.
  get telegraph() {
    if (this.state === 'down') {
      const aimEnd = BOSS.rise + this.track
      return this.t > aimEnd && this.t <= aimEnd + BOSS.hold
    }
    return (
      this.state === 'pressure' &&
      this.t >= BOSS.gather &&
      this.t < BOSS.gather + BOSS.brace
    )
  }

  private get track() {
    return this.phase === 2 ? BOSS.trackRage : BOSS.track
  }

  // Every letter on screen, as the sword and torches see them.
  letterBoxes(): Box[] {
    if (!this.awake || this.gone) return []
    return this.letters.slice(0, this.shown).map((l, i) => ({
      x: l.x,
      y: l.y,
      w: WIDTHS[i],
      h: LETTER_H,
    }))
  }

  // The letters that hurt to touch this update, their edges forgiven.
  // Dazed on the floor, or just reformed, the body is safe.
  contact(): Box[] {
    const hot =
      this.state === 'idle'
        ? this.t >= BOSS.grace
        : this.state === 'pressure'
          ? this.t >= BOSS.gather + BOSS.brace
          : this.state === 'down' ||
            this.state === 'spirit' ||
            this.state === 'rain'
    if (!hot) return []
    return this.letterBoxes().map((l) => ({
      x: l.x + 2,
      y: l.y + 3,
      w: l.w - 4,
      h: l.h - 3,
    }))
  }

  get contactCause() {
    if (this.state === 'down') return ATTACKS.down.cause
    if (this.state === 'pressure') return ATTACKS.pressure.cause
    return BODY_CAUSE
  }

  wake() {
    if (this.awake) return
    this.enter('intro')
    this.fill = 0
    this.shown = 0
  }

  // Returns true when the hit kills.
  hit(damage: number): boolean {
    if (!this.vulnerable) return false
    this.hp = Math.max(0, this.hp - damage)
    this.hurtT = 12
    this.hits++
    if (this.hp === 0) {
      this.die()
      return true
    }
    if (this.phase === 1 && this.hp <= BOSS.hp / 2) {
      this.say('SOCIETY IS DISAPPOINTED', true)
      this.emit('roar', this.x + WORD_W / 2, this.y + LETTER_H / 2)
      this.enter('rage')
    } else if (this.hits % 3 === 0) {
      this.quip = { text: QUIPS[(this.hits / 3 - 1) % QUIPS.length], t: 60 }
    }
    return false
  }

  ignite() {
    if (!this.vulnerable || this.burn > 0) return
    this.burn = BOSS.burnFrames
    this.emit('burned', this.x + WORD_W / 2, this.y)
  }

  // Straight to the fall, for the QA hooks.
  defeat() {
    this.shown = WORD.length
    this.hp = 0
    this.die()
  }

  step(target: Box): BossEvent[] {
    this.time++
    this.t++
    if (this.hurtT > 0) this.hurtT--
    if (this.quip && --this.quip.t <= 0) this.quip = null
    this.look = { x: target.x + target.w / 2, y: target.y + target.h / 2 }
    this.lag = Math.max(this.hp, this.lag - 0.12)
    if (this.burn > 0) {
      this.burn--
      if (BOSS.burnTicks.includes(this.burn)) this.hit(1)
    }
    this.update()
    this.stepShots()
    const out = this.events
    this.events = []
    return out
  }

  private update() {
    const rage = this.phase === 2
    switch (this.state) {
      case 'dormant':
      case 'dead':
        return

      case 'intro': {
        this.fill = Math.min(1, this.t / BOSS.intro)
        this.letters.forEach((l, i) => {
          if (this.t < i * BOSS.introStagger) return
          if (i >= this.shown) {
            this.shown = i + 1
            l.x = this.x + OFFSETS[i]
            l.y = this.arena.top - LETTER_H
            l.vy = 0
          }
          if (l.y >= this.hoverY) return
          l.vy += 0.4
          l.y = Math.min(this.hoverY, l.y + l.vy)
          if (l.y === this.hoverY)
            this.emit('land', l.x + WIDTHS[i] / 2, l.y + LETTER_H)
        })
        if (this.t === BOSS.introSay) this.say('WE LIVE IN A SOCIETY', false)
        if (this.t >= BOSS.intro) this.enter('idle')
        return
      }

      case 'idle': {
        this.driftTo(
          this.look.x - WORD_W / 2,
          rage ? BOSS.driftRage : BOSS.drift
        )
        this.y += (this.hoverY - this.y) * 0.08
        this.follow(0.2)
        if (this.t >= (rage ? BOSS.idleRage : BOSS.idle)) this.choose()
        return
      }

      case 'down': {
        const aimEnd = BOSS.rise + this.track
        if (this.t <= aimEnd) {
          this.y += (this.arena.top + 6 - this.y) * 0.15
          this.driftTo(
            this.look.x - WORD_W / 2,
            this.t <= BOSS.rise ? 1.2 : 2.6
          )
          this.follow(0.35)
        } else if (this.t <= aimEnd + BOSS.hold) {
          this.follow(0.35)
        } else {
          this.vy = Math.min(this.vy + BOSS.fallAccel, BOSS.fallMax)
          this.y = Math.min(this.floorY, this.y + this.vy)
          this.follow(1, false)
          if (this.y === this.floorY) this.slam()
        }
        return
      }

      case 'stuck': {
        this.follow(1, false)
        if (this.t >= (rage ? BOSS.stuckRage : BOSS.stuck)) this.enter('idle')
        return
      }

      case 'spirit': {
        this.driftTo(this.look.x - WORD_W / 2, 0.4)
        this.y += (this.hoverY - this.y) * 0.08
        this.follow(0.2)
        const gap = rage ? BOSS.spiritGapRage : BOSS.spiritGap
        const n = this.t - BOSS.aim
        if (n >= 0 && n % gap === 0 && this.fired < SPIRIT.length)
          this.fire(SPIRIT[this.fired++], rage)
        if (
          this.fired >= SPIRIT.length &&
          n >= gap * SPIRIT.length + BOSS.after
        )
          this.enter('idle')
        return
      }

      case 'pressure': {
        const { gather, brace } = BOSS
        if (this.t < gather + brace) {
          const k = this.t < gather ? 0.12 : 1
          this.letters.forEach((l, i) => {
            l.x += (this.home(i) - l.x) * k
            l.y += (this.floorY - l.y) * k
          })
          return
        }
        this.squeeze += rage ? BOSS.squeezeRage : BOSS.squeeze
        // Each half hops as one, out of step with the other, so there is a
        // moment to jump either.
        this.letters.forEach((l, i) => {
          const left = i < SPLIT
          l.x = this.home(i) + (left ? this.squeeze : -this.squeeze)
          l.y =
            this.floorY -
            Math.abs(Math.sin(this.t * 0.11 + (left ? 0 : 1.2))) * BOSS.hop
        })
        const inner = this.letters[SPLIT - 1].x + WIDTHS[SPLIT - 1]
        const outer = this.letters[SPLIT].x
        if (inner + S >= outer) {
          const mid = (inner + outer) / 2
          this.emit('clash', mid, this.arena.floor - LETTER_H / 2)
          this.x = this.clampX(mid - WORD_W / 2)
          this.y = this.floorY
          this.enter('idle')
        }
        return
      }

      case 'rain': {
        this.driftTo(this.centreX, 1.2)
        this.y += (this.arena.top + 6 - this.y) * 0.1
        this.follow(0.2)
        const gap = rage ? BOSS.rainGapRage : BOSS.rainGap
        const n = this.t - BOSS.aim
        if (n >= 0 && n % gap === 0 && this.fired < RAIN.length)
          this.drop(RAIN[this.fired++])
        if (this.fired >= RAIN.length && n >= gap * RAIN.length + 90)
          this.enter('idle')
        return
      }

      case 'rage': {
        this.y += (this.hoverY - this.y) * 0.1
        this.driftTo(this.centreX, 1)
        this.follow(0.3)
        if (this.t >= BOSS.rage) {
          this.phase = 2
          this.enter('idle')
        }
        return
      }

      case 'dying': {
        const { left, right } = this.arena
        this.letters.forEach((l, i) => {
          l.vy += 0.25
          l.x = Math.max(left, Math.min(right - WIDTHS[i], l.x + l.vx))
          l.y += l.vy
          l.spin += l.vx * 0.04
          if (l.y > this.floorY) {
            l.y = this.floorY
            l.vy *= -0.35
            l.vx *= 0.7
          }
        })
        if (this.t >= BOSS.die) this.enter('dead')
        return
      }
    }
  }

  private enter(state: BossState) {
    this.state = state
    this.t = 0
    this.vy = 0
  }

  private emit(kind: Exclude<BossEvent['kind'], 'say'>, x: number, y: number) {
    this.events.push({ kind, x, y })
  }

  private say(text: string, attack: boolean) {
    this.events.push({ kind: 'say', text, attack })
  }

  // Never the same attack twice in a row.
  private choose() {
    const options = (Object.keys(ATTACKS) as Attack[]).filter(
      (a) => a !== this.attack
    )
    const a = options[Math.floor(this.random() * options.length)]
    this.attack = a
    this.fired = 0
    this.squeeze = 0
    this.columns = []
    this.say(ATTACKS[a].name, true)
    this.enter(a)
  }

  private clampX(x: number) {
    return Math.max(
      this.arena.left + 4,
      Math.min(this.arena.right - WORD_W - 4, x)
    )
  }

  private driftTo(tx: number, speed: number) {
    const dx = this.clampX(tx) - this.x
    this.x = this.clampX(this.x + Math.max(-speed, Math.min(speed, dx)))
  }

  // Letters ease toward their place in the word, each bobbing on its own
  // beat, so the word ripples.
  private follow(k: number, bob = true) {
    this.letters.forEach((l, i) => {
      const y = bob
        ? this.y + Math.round(Math.sin(this.time * 0.08 + i * 0.8) * 2)
        : this.y
      l.x += (this.x + OFFSETS[i] - l.x) * k
      l.y += (y - l.y) * k
    })
  }

  // A letter's spot for PEER PRESSURE: SOC packed against the left wall,
  // IETY against the right.
  private home(i: number) {
    return i < SPLIT
      ? this.arena.left + 2 + OFFSETS[i]
      : this.arena.right - 2 - WORD_W + OFFSETS[i]
  }

  private slam() {
    const rage = this.phase === 2
    const speed = rage ? BOSS.waveRage : BOSS.wave
    const y = this.arena.floor - 8
    for (const [x, dir] of [
      [this.x - 10, -1],
      [this.x + WORD_W, 1],
    ])
      this.shots.push({
        kind: 'wave',
        ch: '',
        x,
        y,
        w: 10,
        h: 8,
        vx: dir * speed,
        vy: 0,
        dead: false,
        cause: ATTACKS.down.cause,
      })
    this.emit('slam', this.x + WORD_W / 2, this.arena.floor)
    this.enter('stuck')
  }

  // Out of the monocle, at the player, a little scattered.
  private fire(ch: string, rage: boolean) {
    const eye = this.letters[FACE]
    const ex = eye.x + WIDTHS[FACE] / 2
    const ey = eye.y + LETTER_H / 2
    const angle =
      Math.atan2(this.look.y - ey, this.look.x - ex) +
      (this.random() - 0.5) * 0.2
    const speed = rage ? BOSS.spiritSpeedRage : BOSS.spiritSpeed
    const w = glyphWidth(ch) * 2
    this.shots.push({
      kind: 'letter',
      ch,
      x: ex - w / 2,
      y: ey - 7,
      w,
      h: 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      dead: false,
      cause: ATTACKS.spirit.cause,
    })
    this.emit('fire', ex, ey)
  }

  // From the ceiling, spread across the hall in a shuffled order, with every
  // third letter over the player's head.
  private drop(ch: string) {
    const { left, right, top } = this.arena
    const w = glyphWidth(ch) * 2
    if (!this.columns.length) {
      const span = right - left - 12 - 10
      this.columns = RAIN.split('').map(
        (_, k) => left + 6 + (k * span) / (RAIN.length - 1)
      )
      for (let k = this.columns.length - 1; k > 0; k--) {
        const j = Math.floor(this.random() * (k + 1))
        ;[this.columns[k], this.columns[j]] = [this.columns[j], this.columns[k]]
      }
    }
    const aimed = this.fired % 3 === 0
    const x = aimed
      ? Math.max(left, Math.min(right - w, this.look.x - w / 2))
      : this.columns[this.fired - 1]
    this.shots.push({
      kind: 'rain',
      ch,
      x,
      y: top,
      w,
      h: 14,
      vx: 0,
      vy: 0,
      dead: false,
      cause: ATTACKS.rain.cause,
    })
  }

  private stepShots() {
    const { left, right, top, floor } = this.arena
    for (const s of this.shots) {
      if (s.dead) continue
      if (s.kind === 'rain')
        s.vy = Math.min(s.vy + BOSS.rainGravity, BOSS.rainMax)
      s.x += s.vx
      s.y += s.vy
      if (s.kind === 'wave') {
        if (s.x <= left || s.x + s.w >= right) s.dead = true
        continue
      }
      // Letters break on the floor, the ceiling and the walls, and pass
      // through beams.
      if (
        s.y + s.h >= floor ||
        s.y <= top - s.h ||
        s.x <= left ||
        s.x + s.w >= right
      ) {
        s.dead = true
        this.emit(
          'shatter',
          s.x + s.w / 2,
          Math.max(top, Math.min(floor, s.y + s.h / 2))
        )
      }
    }
    this.shots = this.shots.filter((s) => !s.dead)
  }

  private die() {
    this.enter('dying')
    this.shots = []
    this.burn = 0
    this.quip = null
    this.letters.forEach((l, i) => {
      l.vx = (i - 3) * 0.5 + (this.random() - 0.5)
      l.vy = -2.5 - this.random() * 2
    })
    this.say('SOCIETY HAS FALLEN', false)
    this.emit('roar', this.x + WORD_W / 2, this.y + LETTER_H / 2)
  }
}

// The debug view's label: state, updates in it, and health.
export const bossLabel = (b: Boss) => `${b.state} ${b.t} ${b.hp}HP`

// A black silk top hat with a crimson band, rim-lit so it reads against
// the dark wall.
const HAT = [
  '..TTTTTTTTT..',
  '..TkkkkkkIT..',
  '..TkkkkkkIT..',
  '..TkkkkkkIT..',
  '..TkkkkkkIT..',
  '..TRRRRRRRT..',
  '..TCCCCCCCT..',
  'TTTkkkkkkkTTT',
  'TkkkkkkkkkkkT',
  '.TTTTTTTTTTT.',
]

// A waxed white handlebar, tips curled up.
const MOUSTACHE = [
  'kk............kk',
  'kwk..kkkkkk..kwk',
  'kwwkkwwwwwwkkwwk',
  '.kwwwwwBBwwwwwk.',
  '..kwwwwkkwwwwk..',
  '...kkkk..kkkk...',
]

// A bushy white brow: arched and superior at rest, a scowl mid-attack.
const BROW_UP = [
  '....kkkk.....',
  '..kkwwwwkk...',
  '.kwwBBwwwwkk.',
  'kwwk....kkwwk',
  '.kk.......kk.',
]
const BROW_DOWN = [
  'kk...........',
  'kwkkk........',
  '.kwwwkkkk....',
  '..kkwwBwwkkk.',
  '....kkkwwwwwk',
  '.......kkkkk.',
]

const OUTLINE = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [2, 1],
  [1, 2],
  [2, 2],
]

// Everything of the boss, drawn after the dark so it glows through it.
export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss, time: number) {
  for (const s of b.shots) drawShot(ctx, s, time)
  if (!b.awake || b.gone) return
  const flash =
    (b.hurtT > 0 && b.hurtT % 4 < 2) || (b.telegraph && (time >> 2) % 2 === 0)
  const main = flash ? PAL.y : b.phase === 2 ? PAL.C : PAL.B
  const shade = b.phase === 2 ? PAL.r : PAL.g
  const shake = b.state === 'rage' ? 2 : b.telegraph ? 1 : 0
  ctx.globalAlpha =
    b.state === 'dying' ? Math.min(1, (1 - b.t / BOSS.die) * 2) : 1
  b.letters.slice(0, b.shown).forEach((l, i) => {
    const jx = shake ? Math.round((hash(time, i, 1) - 0.5) * 2 * shake) : 0
    const jy = shake ? Math.round((hash(time, i, 2) - 0.5) * 2 * shake) : 0
    const x = Math.round(l.x) + jx
    const y = Math.round(l.y) + jy
    // Dazed after a slam, the letters lean on each other.
    const tilt =
      b.state === 'stuck'
        ? i % 2
          ? 0.22
          : -0.16
        : b.state === 'dying'
          ? l.spin
          : 0
    ctx.save()
    if (tilt) {
      const px = x + WIDTHS[i] / 2
      const py = y + LETTER_H
      ctx.translate(px, py)
      ctx.rotate(tilt)
      ctx.translate(-px, -py)
    }
    const ch = WORD[i]
    for (const [dx, dy] of OUTLINE)
      drawText(ctx, ch, x + dx, y + dy, PAL.k, S, 'left')
    drawText(ctx, ch, x + 1, y + 1, shade, S, 'left')
    drawText(ctx, ch, x, y, main, S, 'left')
    if (i === FACE) drawFace(ctx, b, x, y)
    if (b.burn > 0)
      for (let k = 0; k < 3; k++) {
        const h = 2 + ((time + k * 3 + i) % 4)
        ctx.fillStyle = k % 2 ? PAL.e : PAL.E
        ctx.fillRect(x + 2 + k * 5, y - h, 2, h)
      }
    ctx.restore()
  })
  ctx.globalAlpha = 1
  if (b.quip) {
    const top = Math.min(...b.letters.map((l) => l.y))
    const cx = Math.round(b.x + WORD_W / 2)
    drawOutlined(ctx, b.quip.text, cx, Math.round(top) - 28, PAL.B)
  }
}

// The O's counter is an eye, looking at the player through a monocle, under
// a raised brow at rest and a scowl mid-attack.
function drawFace(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  x: number,
  y: number
) {
  const cx = x + WIDTHS[FACE] / 2
  const cy = y + LETTER_H / 2
  ctx.fillStyle = PAL.y
  ctx.fillRect(x + 3, y + 3, 9, 15)
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
  const px = clamp(Math.round((b.look.x - cx) / 24), 3)
  const py = clamp(Math.round((b.look.y - cy) / 24), 5)
  ctx.fillStyle = b.phase === 2 ? PAL.R : PAL.k
  ctx.fillRect(x + 6 + px, y + 9 + py, 3, 4)
  ctx.fillStyle = PAL.B
  ctx.fillRect(x + 7 + px, y + 9 + py, 1, 1)
  // The monocle's rim, and its chain down past the C.
  ctx.fillStyle = PAL.G
  for (let a = 0; a < 64; a++) {
    const r = (a / 64) * Math.PI * 2
    ctx.fillRect(
      Math.round(cx + Math.cos(r) * 8 - 0.5),
      Math.round(cy + Math.sin(r) * 10 - 0.5),
      1,
      1
    )
  }
  ctx.fillStyle = PAL.g
  for (let k = 0; k < 8; k++)
    ctx.fillRect(
      Math.round(cx + 6 + k * 2),
      Math.round(cy + 9 + Math.sin((k / 7) * Math.PI) * 6),
      1,
      1
    )
  const calm = b.state === 'idle' || b.state === 'intro' || b.state === 'stuck'
  paintGrid(ctx, calm ? BROW_UP : BROW_DOWN, x + 1, y - (calm ? 7 : 5))
  // A hit knocks the hat up off the brow.
  const pop = b.hurtT > 6 ? 4 : 0
  paintGrid(ctx, HAT, x + 1, y - 17 - pop)
  paintGrid(ctx, MOUSTACHE, Math.round(cx) - 8, y + LETTER_H)
}

function drawShot(ctx: CanvasRenderingContext2D, s: Shot, time: number) {
  const x = Math.round(s.x)
  const y = Math.round(s.y)
  if (s.kind === 'wave') {
    // A rolling ridge of rubble with an ember crest.
    for (let k = 0; k < s.w; k++) {
      const h = 3 + ((k + (time >> 1)) % 4) + (k > 2 && k < 7 ? 2 : 0)
      ctx.fillStyle = PAL.b
      ctx.fillRect(x + k, y + s.h - h, 1, h)
      ctx.fillStyle = PAL.E
      ctx.fillRect(x + k, y + s.h - h, 1, 1)
    }
    return
  }
  const color = s.kind === 'letter' ? PAL.C : PAL.G
  for (const [dx, dy] of OUTLINE.slice(0, 4))
    drawText(ctx, s.ch, x + dx, y + dy, PAL.k, 2, 'left')
  drawText(ctx, s.ch, x, y, color, 2, 'left')
}

// Text with a dark rim, so it reads over anything.
export function drawOutlined(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1
) {
  for (const [dx, dy] of OUTLINE.slice(0, 4))
    drawText(ctx, text, x + dx, y + dy, PAL.k, scale)
  drawText(ctx, text, x, y, color, scale)
}
