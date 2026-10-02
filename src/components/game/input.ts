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

// Two keyboard layouts, one live at a time, picked from the on-screen
// legend: W moves in one and throws the torch in the other. IJKL mirrors the
// pad's face diamond: I top (Y), J left (X), L right (B), K bottom (A). Beside
// the arrows, WASD is that diamond mirrored for the left hand: W torch,
// A dash, D attack, S jump.
export type Scheme = 'arrows' | 'wasd'

const SHARED: Record<string, Button> = {
  Space: 'a',
  ShiftLeft: 'b',
  ShiftRight: 'b',
  Enter: 'start',
  Escape: 'start',
  Backspace: 'select',
}

export const SCHEMES: Record<Scheme, Record<string, Button>> = {
  arrows: {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyS: 'a',
    KeyA: 'b',
    KeyD: 'x',
    KeyW: 'y',
  },
  wasd: {
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    KeyK: 'a',
    KeyL: 'b',
    KeyJ: 'x',
    KeyI: 'y',
  },
}

// The button a key plays in `scheme`, if any.
export const keyFor = (scheme: Scheme, code: string): Button | undefined =>
  SCHEMES[scheme][code] ?? SHARED[code]

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
  // Fingers on the on-screen pad, by touch identifier. Replaced whole from
  // the browser's own list of touches on every touch event, never edited one
  // down or one up at a time, so a touchend the browser never sent (a system
  // gesture, an alert, the app switcher) holds a button only until the next
  // touch of any kind.
  private fingers = new Map<number, Button[]>()
  // A mouse or pen on the on-screen pad, by pointer id.
  private pointers = new Map<number, Button[]>()
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

  // Lets go of every finger and pointer: the page lost focus or was hidden,
  // so no release it was owed will arrive.
  releaseAll() {
    this.fingers.clear()
    this.pointers.clear()
  }

  // Every finger now down, as the browser lists them. Returns the buttons
  // pressed that their finger was not already on.
  syncTouches(next: Map<number, Button[]>): Button[] {
    const fresh: Button[] = []
    for (const [id, buttons] of next) {
      const before = this.fingers.get(id) ?? []
      for (const b of buttons)
        if (!before.includes(b)) {
          fresh.push(b)
          this.taps.add(b)
        }
    }
    this.fingers = next
    return fresh
  }

  // Returns the buttons the pointer pressed that it was not already on.
  touch(pointerId: number, buttons: Button[]): Button[] {
    const before = this.pointers.get(pointerId) ?? []
    const fresh = buttons.filter((b) => !before.includes(b))
    fresh.forEach((b) => this.taps.add(b))
    this.pointers.set(pointerId, buttons)
    return fresh
  }

  lift(pointerId: number) {
    this.pointers.delete(pointerId)
  }

  tracking(pointerId: number) {
    return this.pointers.has(pointerId)
  }

  read(pads: Iterable<PadLike | null>): Frame & { padActive: boolean } {
    const taps = this.taps
    this.taps = new Set()
    const held: ButtonSet = new Set([...this.keys, ...taps])
    for (const map of [this.fingers, this.pointers])
      for (const buttons of map.values()) buttons.forEach((b) => held.add(b))
    let padActive = false
    for (const pad of pads) {
      if (!pad) continue
      const before = held.size
      readGamepad(pad, held)
      if (held.size > before) padActive = true
    }
    // A tap is always a press, even when the same button was held at the
    // last update: a lift and a fresh tap between two updates is a new press.
    const pressed: ButtonSet = new Set(
      [...held].filter((b) => !this.previous.has(b) || taps.has(b))
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
  // A thumb on a drawn arm presses that arm alone. Only the gaps between
  // arms read as diagonals.
  const x = (dx + 1) / 2
  const y = (dy + 1) / 2
  for (const [arm, slot] of ARMS) {
    const c = FACE_LAYOUT[slot]
    if (Math.hypot(x - c.x, y - c.y) < CAP_RADIUS) return [arm]
  }
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
// A drawn cap's radius in the same space: the CSS makes each cap 34% wide.
export const CAP_RADIUS = 0.17

// The D-pad draws its arms where the face diamond draws its buttons.
const ARMS: [Button, keyof typeof FACE_LAYOUT][] = [
  ['up', 'y'],
  ['left', 'x'],
  ['right', 'b'],
  ['down', 'a'],
]

export function faceFromPoint(x: number, y: number): Button[] {
  const on = (Object.keys(FACE_LAYOUT) as (keyof typeof FACE_LAYOUT)[]).find(
    (b) => Math.hypot(x - FACE_LAYOUT[b].x, y - FACE_LAYOUT[b].y) < CAP_RADIUS
  )
  if (on) return [on]
  return (Object.keys(FACE_LAYOUT) as (keyof typeof FACE_LAYOUT)[]).filter(
    (b) => Math.hypot(x - FACE_LAYOUT[b].x, y - FACE_LAYOUT[b].y) < FACE_REACH
  )
}
