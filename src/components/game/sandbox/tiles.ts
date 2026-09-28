import { EMPTY, Level, ONEWAY, SOLID, TILE } from './level'
import {
  context,
  hash,
  makeCanvas,
  paintGrid,
  PAL,
  type Canvas,
} from './pixels'

// Two courses of dressed stone, mortar in 'd', lit from the top left.
const BRICK = [
  'ttttttttttdttttt',
  'tSSSSSSSSsdtSSSs',
  'SSSTSSSSSsdSSSSs',
  'SSSSSSSSSsdSSTSs',
  'SSSSSSStSsdSSSSs',
  'sSSSSSSSSsdSSSSs',
  'ssssssssssdsssss',
  'dddddddddddddddd',
  'ttttdttttttttttt',
  'SSSsdtSSSSSSSSSs',
  'SSSsdSSSSSSTSSSs',
  'STSsdSSSSSSSSSSs',
  'SSSsdSSSSTSSSSSs',
  'sSSsdSSSSSSSSSSs',
  'ssssdsssssssssss',
  'dddddddddddddddd',
]

// A charred beam on iron brackets. Only the top four rows collide visually.
const BEAM = [
  'OOOOOOOOOOOOOOOO',
  'oOOIoOOOOOOoIOOo',
  'oooooooooooooooo',
  'kookkooookkoookk',
]

function isAir(level: Level, tx: number, ty: number) {
  return level.tileAt(tx, ty) !== SOLID
}

// Distance in tiles to the nearest non-solid tile, capped at 3.
function depth(level: Level, tx: number, ty: number) {
  for (let r = 1; r <= 3; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (isAir(level, tx + dx, ty + dy)) return r
  return 3
}

// Bakes every tile of the level into one canvas, drawn once per frame with a
// single drawImage at the camera offset.
export function bakeTiles(level: Level): Canvas {
  const c = makeCanvas(level.pixelWidth, level.pixelHeight)
  const ctx = context(c)
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const tile = level.tileAt(tx, ty)
      const ox = tx * TILE
      const oy = ty * TILE
      const i = ty * level.width + tx
      if (tile === EMPTY && level.backdrop[i]) drawBackdrop(ctx, ox, oy, tx, ty)
      if (tile === SOLID) drawStone(ctx, level, ox, oy, tx, ty)
      if (tile === ONEWAY) drawBeam(ctx, level, ox, oy, tx, ty)
    }
  }
  return c
}

function drawStone(
  ctx: CanvasRenderingContext2D,
  level: Level,
  ox: number,
  oy: number,
  tx: number,
  ty: number
) {
  paintGrid(ctx, BRICK, ox, oy, hash(tx, ty) > 0.5)

  // A crack now and then, so the wall does not read as a stamp.
  if (hash(tx, ty, 1) > 0.75) {
    ctx.fillStyle = PAL.d
    let x = 3 + Math.floor(hash(tx, ty, 2) * 9)
    for (let y = 1; y < 7; y++) {
      ctx.fillRect(ox + x, oy + y, 1, 1)
      if (hash(tx, y, 3) > 0.5) x += 1
    }
  }

  const d = depth(level, tx, ty)
  if (d > 1) {
    ctx.fillStyle = d > 2 ? 'rgba(11,10,16,0.62)' : 'rgba(11,10,16,0.38)'
    ctx.fillRect(ox, oy, TILE, TILE)
  }

  if (isAir(level, tx, ty - 1)) {
    ctx.fillStyle = PAL.T
    ctx.fillRect(ox, oy, TILE, 1)
    // Moss creeping over the lip.
    for (let x = 0; x < TILE; x++) {
      const n = hash(tx * TILE + x, ty, 4)
      if (n > 0.55) {
        ctx.fillStyle = n > 0.8 ? PAL.M : PAL.m
        ctx.fillRect(ox + x, oy, 1, 1 + (n > 0.9 ? 1 : 0))
      }
      if (n > 0.93) {
        ctx.fillStyle = PAL.m
        ctx.fillRect(ox + x, oy - 1, 1, 1)
      }
    }
  }
  if (isAir(level, tx - 1, ty)) {
    ctx.fillStyle = PAL.t
    ctx.fillRect(ox, oy + 1, 1, TILE - 1)
  }
  if (isAir(level, tx + 1, ty)) {
    ctx.fillStyle = PAL.d
    ctx.fillRect(ox + TILE - 1, oy, 1, TILE)
  }
  if (isAir(level, tx, ty + 1)) {
    ctx.fillStyle = PAL.k
    ctx.fillRect(ox, oy + TILE - 1, TILE, 1)
    ctx.fillStyle = PAL.d
    ctx.fillRect(ox, oy + TILE - 2, TILE, 1)
    // Roots and drips hanging from overhangs.
    for (let x = 1; x < TILE - 1; x++) {
      const n = hash(tx * TILE + x, ty, 5)
      if (n > 0.9) {
        ctx.fillStyle = PAL.m
        ctx.fillRect(ox + x, oy + TILE, 1, 1 + Math.floor(n * 10 - 8))
      }
    }
  }
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  level: Level,
  ox: number,
  oy: number,
  tx: number,
  ty: number
) {
  paintGrid(ctx, BEAM, ox, oy)
  // A chain up to the ceiling at each end of a run of beams.
  for (const side of [-1, 1]) {
    if (level.tileAt(tx + side, ty) === ONEWAY) continue
    const x = ox + (side < 0 ? 2 : TILE - 3)
    ctx.fillStyle = PAL.i
    for (let y = oy - 1; y > oy - 40 && y > 0; y -= 2) {
      ctx.fillRect(x, y, 1, 1)
      ctx.fillStyle = ctx.fillStyle === PAL.i ? PAL.I : PAL.i
    }
  }
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  tx: number,
  ty: number
) {
  paintGrid(ctx, BRICK, ox, oy, hash(tx, ty, 6) > 0.5)
  ctx.fillStyle = 'rgba(11,10,16,0.66)'
  ctx.fillRect(ox, oy, TILE, TILE)
  // Tall lancet windows every fourth column, lit faintly from outside.
  if (tx % 4 === 2 && ty % 6 >= 2 && ty % 6 <= 4) {
    const top = ty % 6 === 2
    ctx.fillStyle = PAL.k
    ctx.fillRect(ox + 4, oy + (top ? 6 : 0), 8, top ? 10 : 16)
    if (top) {
      ctx.fillRect(ox + 5, oy + 4, 6, 2)
      ctx.fillRect(ox + 6, oy + 3, 4, 1)
      ctx.fillRect(ox + 7, oy + 2, 2, 1)
    }
    ctx.fillStyle = 'rgba(90,80,140,0.22)'
    ctx.fillRect(ox + 5, oy + (top ? 6 : 0), 6, top ? 10 : 16)
    ctx.fillStyle = PAL.s
    ctx.fillRect(ox + 7, oy + (top ? 5 : 0), 1, top ? 11 : 16)
  }
}
