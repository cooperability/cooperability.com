export const BUTTONS = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
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
  KeyX: 'a',
  Space: 'a',
  KeyZ: 'b',
  Enter: 'start',
  ShiftLeft: 'select',
  ShiftRight: 'select',
  Backspace: 'select',
}

// W3C "standard" gamepad layout. Game Boy A sits to the right of B, which is
// the right face button (1) on every standard pad, and B the bottom one (0).
const PAD_MAP: [number, Button][] = [
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
  [1, 'a'],
  [0, 'b'],
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

// A and B centres in the face-button zone's own normalised space. A thumb
// between the two, the classic roll, presses both.
export const FACE_LAYOUT = {
  a: { x: 0.72, y: 0.36 },
  b: { x: 0.28, y: 0.64 },
  radius: 0.3,
}

export function faceFromPoint(x: number, y: number): Button[] {
  const { a, b, radius } = FACE_LAYOUT
  const da = Math.hypot(x - a.x, y - a.y)
  const db = Math.hypot(x - b.x, y - b.y)
  const gap = Math.hypot(a.x - b.x, a.y - b.y)
  if (Math.abs(da - db) < gap * 0.2 && da < gap) return ['a', 'b']
  if (da <= radius && da <= db) return ['a']
  if (db <= radius) return ['b']
  return []
}
