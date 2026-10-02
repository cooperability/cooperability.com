import { context, makeCanvas, type Canvas } from './pixels'

// A 5x7 pixel face, uppercase only, so screens stay on the pixel grid
// instead of the browser's anti-aliased text.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
}

// One character's rows, '#' lit, for art built from the letters.
export const glyphRows = (ch: string) => GLYPHS[ch.toUpperCase()] ?? GLYPHS[' ']

// Width of one character in font pixels, before scaling.
export const glyphWidth = (ch: string) => glyphRows(ch)[0].length

// Debug labels change every frame, so the cache starts over once it holds
// this many strings instead of keeping every one ever drawn.
export const TEXT_CACHE_MAX = 256
const cache = new Map<string, Canvas>()
export const textCacheSize = () => cache.size

function bakeText(text: string, color: string, scale: number): Canvas {
  const glyphs = [...text.toUpperCase()].map((ch) => GLYPHS[ch] ?? GLYPHS[' '])
  const width = glyphs.reduce((w, g) => w + g[0].length + 1, -1)
  const c = makeCanvas(Math.max(1, width * scale), 7 * scale)
  const ctx = context(c)
  ctx.fillStyle = color
  let ox = 0
  for (const g of glyphs) {
    g.forEach((row, y) => {
      for (let x = 0; x < row.length; x++)
        if (row[x] === '#')
          ctx.fillRect((ox + x) * scale, y * scale, scale, scale)
    })
    ox += g[0].length + 1
  }
  return c
}

// Draws text centred on x (or from x, left-aligned), top at y.
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: 'center' | 'left' | 'right' = 'center'
) {
  const key = `${text}|${color}|${scale}`
  let img = cache.get(key)
  if (!img) {
    if (cache.size >= TEXT_CACHE_MAX) cache.clear()
    cache.set(key, (img = bakeText(text, color, scale)))
  }
  const left =
    align === 'center'
      ? x - Math.floor(img.width / 2)
      : align === 'right'
        ? x - img.width
        : x
  ctx.drawImage(img, left, y)
}
