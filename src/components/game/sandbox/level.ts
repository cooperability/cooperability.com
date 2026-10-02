export const TILE = 16

export const EMPTY = 0
export const SOLID = 1
export const ONEWAY = 2

export type Prop = {
  kind: 'urn' | 'candle' | 'snake' | 'pickup'
  x: number
  y: number
}

export type Body = { x: number; y: number; w: number; h: number }

// The boss's hall, in pixels: the inside faces of its walls, ceiling and floor.
export type Arena = { left: number; right: number; top: number; floor: number }

// '#' stone, '=' one-way beam, ':' backdrop wall (no collision), 'P' spawn,
// 'u' breakable urn, 'c' candle, 's' snake in open air, 'S' snake in front of
// a backdrop wall, 'h' a health candle in open air, 'H' one in front of a
// backdrop wall, 'G' a gate (stone until opened), 'B' anywhere inside the
// boss's hall. Props sit on the tile below their cell.
// Left to right: spawn cloister with drop-through beams, a wall taller than
// a jump (ledge grab), a tunnel only a roll fits, a wall-jump chimney up to
// a belfry, a pit wide enough to want the air dash, then altar steps. Past
// the belfry's gate, a sill drops into the boss's hall: a flat floor, two
// low beams and one high one between them. Health candles stand on the
// block floating over the roll tunnel and in the hall's far corner.
export const SANDBOX_MAP = [
  '#......................................................####################',
  '#......................................................####################',
  '#........................................::::::::::::::####################',
  '#..........................#.............::::::::::::::#::::::::::::::::::#',
  '#::::::::::................#.............::::::::::::::G::::::::::::::::::#',
  '#::::::::::.......h.u.s....#.=====.......::::::::::::::G::::::::::::::::::#',
  '#::::::::::.......######...#::::::.......:::::::::::ucSG::::::::::::::::::#',
  '#::::::::::.......######...#::::::.......:::::::::::######::::::::::::::::#',
  '#:::::====:.......######...#::::::.......:::::::::u:####::::::::B:::::::::#',
  '#::::::::::...c.s.######...#::::::..===..::::::::#######:::::::====:::::::#',
  '#:::====:::.#####.######...#::::::.......::::::c:#######::::::::::::::::::#',
  '#::::::::::.#####.######....::::::.......:::::##########::===::::::::===::#',
  '#:cP::u::c:.#####...........::u:cS.......:cu::##########:c::::::::::::::cH#',
  '##################################.......##################################',
  '##################################....s..##################################',
  '###########################################################################',
]

export class Level {
  readonly width: number
  readonly height: number
  readonly tiles: Uint8Array
  readonly backdrop: Uint8Array
  readonly props: Prop[] = []
  readonly spawn = { x: 0, y: 0 }
  readonly gate: { tx: number; ty: number }[] = []
  // Null on a map with no 'B'.
  readonly arena: Arena | null = null
  // Where a player stands just inside the gate, feet on the sill.
  readonly sill: { x: number; y: number } | null = null
  gateOpen = false

  constructor(rows: string[]) {
    this.height = rows.length
    this.width = rows[0].length
    this.tiles = new Uint8Array(this.width * this.height)
    this.backdrop = new Uint8Array(this.width * this.height)
    // Cast, so the assignment inside forEach does not narrow it to null.
    let mark = null as { tx: number; ty: number } | null
    rows.forEach((row, ty) => {
      ;[...row].forEach((ch, tx) => {
        const i = ty * this.width + tx
        if (ch === '#' || ch === 'G') this.tiles[i] = SOLID
        else if (ch === '=') this.tiles[i] = ONEWAY
        else if (ch !== '.' && ch !== 's' && ch !== 'h') this.backdrop[i] = 1
        // Props and the spawn stand on the floor of their cell.
        const x = tx * TILE + TILE / 2
        const y = (ty + 1) * TILE
        if (ch === 'P') Object.assign(this.spawn, { x, y })
        if (ch === 'u') this.props.push({ kind: 'urn', x, y })
        if (ch === 'c') this.props.push({ kind: 'candle', x, y })
        if (ch === 's' || ch === 'S') this.props.push({ kind: 'snake', x, y })
        if (ch === 'h' || ch === 'H') this.props.push({ kind: 'pickup', x, y })
        if (ch === 'G') this.gate.push({ tx, ty })
        if (ch === 'B') mark = { tx, ty }
      })
    })
    if (mark) {
      const m = mark
      // The last open cell from the mark in each direction.
      const reach = (dx: number, dy: number) => {
        let [tx, ty] = [m.tx, m.ty]
        while (this.tileAt(tx + dx, ty + dy) !== SOLID)
          [tx, ty] = [tx + dx, ty + dy]
        return dx ? tx : ty
      }
      this.arena = {
        left: reach(-1, 0) * TILE,
        right: (reach(1, 0) + 1) * TILE,
        top: reach(0, -1) * TILE,
        floor: (reach(0, 1) + 1) * TILE,
      }
    }
    if (this.gate.length) {
      const tx = Math.max(...this.gate.map((g) => g.tx))
      const ty = Math.max(...this.gate.map((g) => g.ty))
      this.sill = { x: (tx + 2) * TILE, y: (ty + 1) * TILE }
    }
  }

  isGate(tx: number, ty: number) {
    return this.gate.some((g) => g.tx === tx && g.ty === ty)
  }

  // Opening turns the gate's cells to air, closing back to stone.
  setGate(open: boolean) {
    this.gateOpen = open
    for (const { tx, ty } of this.gate)
      this.tiles[ty * this.width + tx] = open ? EMPTY : SOLID
  }

  get pixelWidth() {
    return this.width * TILE
  }

  get pixelHeight() {
    return this.height * TILE
  }

  // Off the sides and bottom is wall, so nothing leaves the map. Above the
  // top is open sky.
  tileAt(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.width || ty >= this.height) return SOLID
    if (ty < 0) return EMPTY
    return this.tiles[ty * this.width + tx]
  }

  isSolid(tx: number, ty: number) {
    return this.tileAt(tx, ty) === SOLID
  }

  // True when any solid tile overlaps the box.
  boxHitsSolid(x: number, y: number, w: number, h: number): boolean {
    const x0 = Math.floor(x / TILE)
    const x1 = Math.floor((x + w - 0.001) / TILE)
    const y0 = Math.floor(y / TILE)
    const y1 = Math.floor((y + h - 0.001) / TILE)
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (this.isSolid(tx, ty)) return true
    return false
  }

  // Moves a body by (dx, dy), stopping at solid tiles and landing on beams
  // from above. For enemies and thrown things; the player keeps its own
  // collision for drop-through and ledge rules.
  move(b: Body, dx: number, dy: number) {
    let hitX = false
    let ground = false
    b.x += dx
    if (this.boxHitsSolid(b.x, b.y, b.w, b.h)) {
      b.x =
        dx > 0
          ? Math.floor((b.x + b.w) / TILE) * TILE - b.w
          : Math.ceil(b.x / TILE) * TILE
      hitX = true
    }
    const bottom = b.y + b.h
    b.y += dy
    if (dy > 0) {
      const ty = Math.floor((b.y + b.h - 0.001) / TILE)
      const top = ty * TILE
      for (
        let tx = Math.floor(b.x / TILE);
        tx <= Math.floor((b.x + b.w - 0.001) / TILE);
        tx++
      ) {
        const tile = this.tileAt(tx, ty)
        if (tile === SOLID || (tile === ONEWAY && bottom <= top + 0.001)) {
          b.y = top - b.h
          ground = true
          break
        }
      }
    } else if (dy < 0 && this.boxHitsSolid(b.x, b.y, b.w, b.h)) {
      b.y = Math.ceil(b.y / TILE) * TILE
    }
    return { hitX, ground }
  }

  // Solid or beam directly under the body's feet.
  standing(b: Body) {
    const ty = Math.floor((b.y + b.h + 0.5) / TILE)
    for (
      let tx = Math.floor(b.x / TILE);
      tx <= Math.floor((b.x + b.w - 0.001) / TILE);
      tx++
    )
      if (this.tileAt(tx, ty) !== EMPTY && b.y + b.h <= ty * TILE + 0.001)
        return true
    return false
  }
}
