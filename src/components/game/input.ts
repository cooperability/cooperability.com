export const BUTTONS = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'x',
  'y',
  'select',
  'start',
] as const

export type Button = (typeof BUTTONS)[number]
export type ButtonSet = Set<Button>

export const KEY_MAP: Record<string, Button> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  // IJKL mirrors the pad's face diamond: I top (Y), J left (X), L right
  // (B), K bottom (A).
  KeyK: 'a',
  KeyL: 'b',
  KeyJ: 'x',
  KeyI: 'y',
  Space: 'a',
  ShiftLeft: 'b',
  ShiftRight: 'b',
  Enter: 'start',
  Escape: 'start',
  Backspace: 'select',
}

// W3C "standard" gamepad layout, which is the Xbox face diamond.
const PAD_MAP: [number, Button][] = [
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
  [0, 'a'],
  [1, 'b'],
  [2, 'x'],
  [3, 'y'],
  [8, 'select'],
  [9, 'start'],
]

const STICK_DEADZONE = 0.5

type PadLike = Pick<Gamepad, 'buttons' | 'axes'>

export function readGamepad(pad: PadLike, into: ButtonSet): void {
  for (const [index, button] of PAD_MAP) {
    if (pad.buttons[index]?.pressed) into.add(button)
  }
  const [x = 0, y = 0] = pad.axes
  if (x <= -STICK_DEADZONE) into.add('left')
  if (x >= STICK_DEADZONE) into.add('right')
  if (y <= -STICK_DEADZONE) into.add('up')
  if (y >= STICK_DEADZONE) into.add('down')
}

// Merges keyboard, touch and gamepads into one reading per fixed update.
export class Controls {
  private keys: ButtonSet = new Set()
  private touches = new Map<number, Button[]>()
  // Presses since the last update. A tap shorter than one update (16ms) would
  // otherwise land between two readings and never reach the game.
  private taps: ButtonSet = new Set()
  private previous: ButtonSet = new Set()

  key(button: Button, down: boolean) {
    if (down) {
      this.keys.add(button)
      this.taps.add(button)
    } else this.keys.delete(button)
  }

  clearKeys() {
    this.keys.clear()
  }

  // Returns true when the pointer pressed something it was not already on.
  touch(pointerId: number, buttons: Button[]): boolean {
    const before = this.touches.get(pointerId) ?? []
    const fresh = buttons.filter((b) => !before.includes(b))
    fresh.forEach((b) => this.taps.add(b))
    this.touches.set(pointerId, buttons)
    return fresh.length > 0
  }

  lift(pointerId: number) {
    this.touches.delete(pointerId)
  }

  tracking(pointerId: number) {
    return this.touches.has(pointerId)
  }

  read(pads: Iterable<PadLike | null>): Frame & { padActive: boolean } {
    const held: ButtonSet = new Set([...this.keys, ...this.taps])
    this.taps.clear()
    for (const buttons of this.touches.values())
      buttons.forEach((b) => held.add(b))
    let padActive = false
    for (const pad of pads) {
      if (!pad) continue
      const before = held.size
      readGamepad(pad, held)
      if (held.size > before) padActive = true
    }
    const pressed: ButtonSet = new Set(
      [...held].filter((b) => !this.previous.has(b))
    )
    this.previous = held
    return { held, pressed, padActive }
  }
}

export type Frame = { held: ButtonSet; pressed: ButtonSet }

// Offsets are relative to the D-pad centre, normalised so 1 is its edge.
// Eight equal sectors, so a thumb resting between two arms presses both, as
// on a real rocker pad.
export function dpadFromPoint(dx: number, dy: number): Button[] {
  if (Math.hypot(dx, dy) < 0.2) return []
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
  const dirs: Record<number, Button[]> = {
    0: ['right'],
    1: ['down', 'right'],
    2: ['down'],
    3: ['down', 'left'],
    4: ['left'],
    [-4]: ['left'],
    [-3]: ['up', 'left'],
    [-2]: ['up'],
    [-1]: ['up', 'right'],
  }
  return dirs[sector]
}

// Face-button centres in the diamond zone's own normalised space, Xbox
// layout. Adjacent buttons sit close enough that a thumb on the gap between
// two presses both, and the diamond's centre presses nothing.
export const FACE_LAYOUT: Record<
  'a' | 'b' | 'x' | 'y',
  { x: number; y: number }
> = {
  y: { x: 0.5, y: 0.18 },
  x: { x: 0.18, y: 0.5 },
  b: { x: 0.82, y: 0.5 },
  a: { x: 0.5, y: 0.82 },
}
export const FACE_REACH = 0.25

export function faceFromPoint(x: number, y: number): Button[] {
  return (Object.keys(FACE_LAYOUT) as (keyof typeof FACE_LAYOUT)[]).filter(
    (b) => Math.hypot(x - FACE_LAYOUT[b].x, y - FACE_LAYOUT[b].y) < FACE_REACH
  )
}
