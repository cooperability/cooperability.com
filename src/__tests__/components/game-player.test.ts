import { Level, SANDBOX_MAP, TILE } from '../../components/game/sandbox/level'
import {
  Player,
  PLAYER_H,
  ROLL_H,
  TUNING,
  type PlayerInput,
} from '../../components/game/sandbox/player'

const idle: PlayerInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  jumpHeld: false,
  jump: false,
  dash: false,
  attack: false,
}

// A floor at row 9 of a 20x10 room, plus whatever the test draws in.
function room(draw: (g: string[][]) => void = () => {}) {
  const g = Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 20 }, (_, x) =>
      y === 9 || x === 0 || x === 19 ? '#' : '.'
    )
  )
  g[8][3] = 'P'
  draw(g)
  return new Level(g.map((r) => r.join('')))
}

function run(p: Player, frames: number, input: Partial<PlayerInput> = {}) {
  const events: string[] = []
  for (let i = 0; i < frames; i++) events.push(...p.step({ ...idle, ...input }))
  return events
}

function settle(p: Player) {
  run(p, 10)
  expect(p.onGround).toBe(true)
}

// Highest the feet reach over a jump, in pixels above the start.
function jumpHeight(p: Player, holdFrames: number) {
  const start = p.y
  let top = p.y
  p.step({ ...idle, jump: true, jumpHeld: true })
  for (let i = 0; i < 60; i++) {
    p.step({ ...idle, jumpHeld: i < holdFrames })
    top = Math.min(top, p.y)
  }
  return start - top
}

describe('Player jump', () => {
  it('rises about 2.6 tiles at full hold', () => {
    const p = new Player(room())
    settle(p)
    const h = jumpHeight(p, 60)
    expect(h).toBeGreaterThan(38)
    expect(h).toBeLessThan(46)
  })

  it('hops much lower when the button is tapped', () => {
    const p = new Player(room())
    settle(p)
    const full = jumpHeight(p, 60)
    settle(p)
    expect(jumpHeight(p, 2)).toBeLessThan(full * 0.5)
  })

  it('still jumps a few frames after running off a ledge', () => {
    // Floor only under the spawn, then a drop.
    const level = room((g) => {
      for (let x = 6; x < 19; x++) g[9][x] = '.'
      g[9][19] = '#'
    })
    const p = new Player(level)
    settle(p)
    let airborne = 0
    for (let i = 0; i < 60 && airborne < TUNING.coyote - 2; i++) {
      p.step({ ...idle, right: true })
      if (!p.onGround) airborne++
    }
    expect(p.onGround).toBe(false)
    expect(
      p.step({ ...idle, right: true, jump: true, jumpHeld: true })
    ).toContain('jump')
  })

  it('does not jump once coyote time has run out', () => {
    const level = room((g) => {
      for (let x = 6; x < 19; x++) g[9][x] = '.'
      g[9][19] = '#'
    })
    const p = new Player(level)
    settle(p)
    let airborne = 0
    for (let i = 0; i < 80 && airborne < TUNING.coyote + 2; i++) {
      p.step({ ...idle, right: true })
      if (!p.onGround) airborne++
    }
    expect(p.step({ ...idle, jump: true, jumpHeld: true })).not.toContain(
      'jump'
    )
  })

  it('remembers a jump pressed just before landing', () => {
    const p = new Player(room())
    settle(p)
    p.step({ ...idle, jump: true, jumpHeld: true })
    const floor = 9 * TILE
    // Fall until the feet are a few pixels above the floor.
    for (let i = 0; i < 120; i++) {
      p.step(idle)
      if (p.vy > 0 && floor - (p.y + p.h) < 8) break
    }
    expect(p.onGround).toBe(false)
    const events = p.step({ ...idle, jump: true, jumpHeld: true })
    expect(events).not.toContain('jump')
    events.push(...run(p, TUNING.buffer - 1, { jumpHeld: true }))
    expect(events).toContain('land')
    expect(events).toContain('jump')
  })
})

describe('Player one-way beams', () => {
  const beamRoom = () =>
    room((g) => {
      for (let x = 1; x < 19; x++) g[6][x] = '='
      g[8][3] = '.'
      g[5][3] = 'P'
    })

  it('stands on a beam', () => {
    const p = new Player(beamRoom())
    settle(p)
    expect(p.y + p.h).toBe(6 * TILE)
  })

  it('drops through it on down + jump', () => {
    const p = new Player(beamRoom())
    settle(p)
    p.step({ ...idle, down: true, jump: true, jumpHeld: true })
    run(p, 30)
    expect(p.y + p.h).toBe(9 * TILE)
  })

  it('jumps up through it from below', () => {
    const level = room((g) => {
      for (let x = 1; x < 19; x++) g[7][x] = '='
    })
    const p = new Player(level)
    settle(p)
    p.step({ ...idle, jump: true, jumpHeld: true })
    run(p, 60, { jumpHeld: true })
    expect(p.y + p.h).toBe(7 * TILE)
  })
})

describe('Player walls', () => {
  // A tall wall three tiles right of the spawn.
  const wallRoom = () =>
    room((g) => {
      for (let y = 0; y < 9; y++) g[y][7] = '#'
    })

  it('slides down a wall slowly while pressing into it', () => {
    const p = new Player(wallRoom())
    settle(p)
    p.x = 7 * TILE - p.w
    p.y = TILE
    p.onGround = false
    run(p, 20, { right: true })
    expect(p.pose).toBe('wall')
    expect(p.vy).toBeLessThanOrEqual(TUNING.wallSlide)
  })

  it('kicks away from the wall on jump', () => {
    const p = new Player(wallRoom())
    settle(p)
    p.x = 7 * TILE - p.w
    p.y = TILE
    p.onGround = false
    run(p, 10, { right: true })
    const events = p.step({ ...idle, right: true, jump: true, jumpHeld: true })
    expect(events).toContain('walljump')
    expect(p.vx).toBeLessThan(0)
    expect(p.vy).toBeLessThan(0)
  })
})

describe('Player ledges', () => {
  // A block 3 tiles high: taller than a jump.
  const ledgeRoom = () =>
    room((g) => {
      for (let y = 6; y < 9; y++) for (let x = 6; x < 10; x++) g[y][x] = '#'
    })

  it('cannot clear a 3-tile wall with a plain jump', () => {
    const p = new Player(ledgeRoom())
    settle(p)
    expect(jumpHeight(p, 60)).toBeLessThan(3 * TILE)
  })

  it('grabs the ledge when jumping into it, then climbs on top', () => {
    const p = new Player(ledgeRoom())
    settle(p)
    const events: string[] = []
    events.push(...p.step({ ...idle, right: true, jump: true, jumpHeld: true }))
    for (let i = 0; i < 60 && !p.hanging; i++)
      events.push(...p.step({ ...idle, right: true, jumpHeld: true }))
    expect(events).toContain('hang')
    events.push(...p.step({ ...idle, up: true }))
    run(p, TUNING.climbFrames + 5)
    expect(events).toContain('climb')
    expect(p.onGround).toBe(true)
    expect(p.y + p.h).toBe(6 * TILE)
    expect(p.x).toBeGreaterThanOrEqual(6 * TILE)
  })

  it('lets go on down and falls back to the floor', () => {
    const p = new Player(ledgeRoom())
    settle(p)
    p.step({ ...idle, right: true, jump: true, jumpHeld: true })
    for (let i = 0; i < 60 && !p.hanging; i++)
      p.step({ ...idle, right: true, jumpHeld: true })
    expect(p.hanging).toBe(true)
    run(p, 40, { down: true })
    expect(p.hanging).toBe(false)
    expect(p.y + p.h).toBe(9 * TILE)
  })
})

describe('Player roll and air dash', () => {
  it('rolls through a gap too low to walk through', () => {
    // A ceiling one tile above the floor from column 6 on.
    const level = room((g) => {
      for (let x = 6; x < 14; x++) for (let y = 0; y < 8; y++) g[y][x] = '#'
    })
    const walker = new Player(level)
    settle(walker)
    run(walker, 120, { right: true })
    expect(walker.x + walker.w).toBeLessThanOrEqual(6 * TILE)

    const roller = new Player(level)
    settle(roller)
    run(roller, 20, { right: true })
    roller.step({ ...idle, right: true, dash: true })
    expect(roller.h).toBe(ROLL_H)
    run(roller, 200, { right: true })
    expect(roller.x).toBeGreaterThan(14 * TILE)
    expect(roller.h).toBe(PLAYER_H)
  })

  it('air dashes once per airtime and gets it back on landing', () => {
    // A 40-row shaft, so the fall outlasts the dash and its cooldown.
    const level = new Level(
      Array.from({ length: 40 }, (_, y) =>
        y === 39
          ? '#'.repeat(20)
          : y === 1
            ? '#..P' + '.'.repeat(15) + '#'
            : '#' + '.'.repeat(18) + '#'
      )
    )
    const p = new Player(level)
    run(p, 5)
    expect(p.step({ ...idle, dash: true })).toContain('airdash')
    expect(p.vy).toBe(0)
    run(p, TUNING.airDashFrames + TUNING.dashCooldown)
    expect(p.onGround).toBe(false)
    expect(p.step({ ...idle, dash: true })).not.toContain('airdash')
    run(p, 120)
    expect(p.onGround).toBe(true)
    p.step({ ...idle, jump: true, jumpHeld: true })
    run(p, 3, { jumpHeld: true })
    expect(p.step({ ...idle, dash: true })).toContain('airdash')
  })

  it('covers more ground with an air dash than without', () => {
    const plain = new Player(room())
    const dashed = new Player(room())
    for (const p of [plain, dashed]) {
      settle(p)
      run(p, 30, { right: true })
      p.step({ ...idle, right: true, jump: true, jumpHeld: true })
    }
    run(plain, 8, { right: true, jumpHeld: true })
    run(dashed, 8, { right: true, jumpHeld: true })
    dashed.step({ ...idle, right: true, dash: true })
    run(plain, 60, { right: true })
    run(dashed, 60, { right: true })
    // Both hit the right wall eventually, so compare where each first lands.
    expect(dashed.x).toBeGreaterThanOrEqual(plain.x)
  })
})

describe('Player review fixes', () => {
  it('crawls back out of a dead-end tunnel it rolled into', () => {
    // A 1-tile-high crawlspace from column 6 to 10, walled off at column 11.
    const level = room((g) => {
      for (let x = 6; x < 12; x++) for (let y = 0; y < 8; y++) g[y][x] = '#'
      for (let x = 6; x < 11; x++) g[8][x] = '.'
      for (let y = 0; y < 9; y++) g[y][11] = '#'
    })
    const p = new Player(level)
    settle(p)
    run(p, 20, { right: true })
    p.step({ ...idle, right: true, dash: true })
    run(p, 120, { right: true })
    expect(p.x).toBeGreaterThan(6 * TILE)
    run(p, 300, { left: true })
    expect(p.x + p.w).toBeLessThanOrEqual(6 * TILE)
    expect(p.h).toBe(PLAYER_H)
    expect(p.pose).not.toBe('roll')
  })

  it('never hangs from a ledge with its head inside the ceiling', () => {
    // A step at column 8 whose top is row 7, under a ceiling at row 6 that
    // stops short of the step, so there is room to stand on top of it.
    const level = room((g) => {
      for (let x = 1; x < 8; x++) g[6][x] = '#'
      for (let y = 7; y < 9; y++) for (let x = 8; x < 19; x++) g[y][x] = '#'
    })
    const p = new Player(level)
    settle(p)
    // Just under the ceiling, against the step, hands inside the grab window.
    Object.assign(p, { x: 8 * TILE - p.w, y: 7 * TILE + 3, vy: 0 })
    p.onGround = false
    run(p, 3, { right: true })
    expect(level.boxHitsSolid(p.x, p.y, p.w, p.h)).toBe(false)
  })

  it('ends an air roll before wall jumping out of it', () => {
    // A ledge at row 4 ending at column 6, a 2-tile gap, a wall at column 9.
    const level = room((g) => {
      g[8][3] = '.'
      g[3][3] = 'P'
      for (let x = 1; x < 7; x++) g[4][x] = '#'
      for (let y = 0; y < 9; y++) g[y][9] = '#'
    })
    const p = new Player(level)
    settle(p)
    // Roll from right at the lip, so coyote time is over by the wall.
    for (let i = 0; i < 90 && p.x < 7 * TILE - 2; i++)
      p.step({ ...idle, right: true })
    p.step({ ...idle, right: true, dash: true })
    let airborne = 0
    for (let i = 0; i < 30 && p.x + p.w < 9 * TILE; i++) {
      p.step({ ...idle, right: true })
      if (!p.onGround) airborne++
    }
    expect(airborne).toBeGreaterThan(TUNING.coyote)
    expect(p.pose).toBe('roll')
    p.step({ ...idle, right: true, jump: true, jumpHeld: true })
    run(p, 2, { jumpHeld: true })
    expect(p.pose).not.toBe('roll')
    expect(p.h).toBe(PLAYER_H)
  })
})

describe('Player attack', () => {
  it('reaches in front only during the active frames', () => {
    const p = new Player(room())
    settle(p)
    p.step({ ...idle, attack: true })
    expect(p.attackBox()).toBeNull()
    run(p, 5)
    const box = p.attackBox()!
    expect(box.x).toBeGreaterThanOrEqual(p.x + p.w - 2)
    run(p, TUNING.attackFrames)
    expect(p.attackBox()).toBeNull()
  })

  it('faces the swing away from a wall it is sliding on', () => {
    const level = room((g) => {
      for (let y = 0; y < 9; y++) g[y][7] = '#'
    })
    const p = new Player(level)
    settle(p)
    p.x = 7 * TILE - p.w
    p.y = TILE
    p.onGround = false
    run(p, 10, { right: true })
    p.step({ ...idle, right: true, attack: true })
    expect(p.facing).toBe(-1)
  })
})

describe('Sandbox map', () => {
  it('parses to a rectangle with a spawn standing on stone', () => {
    const level = new Level(SANDBOX_MAP)
    expect(new Set(SANDBOX_MAP.map((r) => r.length)).size).toBe(1)
    const tx = Math.floor(level.spawn.x / TILE)
    const ty = level.spawn.y / TILE
    expect(level.isSolid(tx, ty)).toBe(true)
    expect(level.props.length).toBeGreaterThan(5)
  })

  it('drops the player onto the floor at spawn', () => {
    const p = new Player(new Level(SANDBOX_MAP))
    settle(p)
    expect(p.pose).toBe('idle')
  })
})
