import {
  Controls,
  dpadFromPoint,
  faceFromPoint,
  FACE_LAYOUT,
  readGamepad,
  type ButtonSet,
} from '../../components/game/input'
import { consume, MAX_STEPS, STEP_MS } from '../../components/game/loop'

const sorted = (list: string[]) => [...list].sort()

describe('dpadFromPoint', () => {
  it('ignores a thumb resting on the hub', () => {
    expect(dpadFromPoint(0.1, -0.1)).toEqual([])
  })

  it('reads screen-space y, so negative is up', () => {
    expect(dpadFromPoint(0, -0.8)).toEqual(['up'])
    expect(dpadFromPoint(0, 0.8)).toEqual(['down'])
  })

  it('maps each arm and each diagonal', () => {
    expect(dpadFromPoint(0.8, 0)).toEqual(['right'])
    expect(dpadFromPoint(-0.8, 0)).toEqual(['left'])
    expect(sorted(dpadFromPoint(0.6, -0.6))).toEqual(['right', 'up'])
    expect(sorted(dpadFromPoint(-0.6, 0.6))).toEqual(['down', 'left'])
  })

  it('keeps a thumb that slides off the edge pressing that arm', () => {
    // Pointer capture delivers coordinates outside the element.
    expect(dpadFromPoint(-3, 0.2)).toEqual(['left'])
  })
})

describe('faceFromPoint', () => {
  it('presses the button under the thumb', () => {
    expect(faceFromPoint(FACE_LAYOUT.a.x, FACE_LAYOUT.a.y)).toEqual(['a'])
    expect(faceFromPoint(FACE_LAYOUT.b.x, FACE_LAYOUT.b.y)).toEqual(['b'])
  })

  it('presses both when the thumb rolls onto the gap between them', () => {
    const midX = (FACE_LAYOUT.a.x + FACE_LAYOUT.b.x) / 2
    const midY = (FACE_LAYOUT.a.y + FACE_LAYOUT.b.y) / 2
    expect(sorted(faceFromPoint(midX, midY))).toEqual(['a', 'b'])
  })

  it('presses nothing well away from both buttons', () => {
    const { a, b, radius } = FACE_LAYOUT
    const reach = radius + 0.05
    for (let i = 0; i <= 50; i++) {
      for (let j = 0; j <= 50; j++) {
        const [x, y] = [i / 50, j / 50]
        const far =
          Math.hypot(x - a.x, y - a.y) > reach &&
          Math.hypot(x - b.x, y - b.y) > reach
        if (far) expect([x, y, faceFromPoint(x, y)]).toEqual([x, y, []])
      }
    }
  })

  it('presses nothing in the empty corners', () => {
    expect(faceFromPoint(0.02, 0.02)).toEqual([])
    expect(faceFromPoint(0.98, 0.98)).toEqual([])
  })
})

describe('readGamepad', () => {
  const pad = (pressed: number[], axes = [0, 0]) => ({
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: pressed.includes(i),
      touched: false,
      value: pressed.includes(i) ? 1 : 0,
    })),
    axes,
  })

  const read = (p: ReturnType<typeof pad>) => {
    const set: ButtonSet = new Set()
    readGamepad(p, set)
    return sorted([...set])
  }

  it('puts Game Boy A on the right face button and B on the bottom one', () => {
    expect(read(pad([1]))).toEqual(['a'])
    expect(read(pad([0]))).toEqual(['b'])
  })

  it('maps the D-pad and the centre buttons', () => {
    expect(read(pad([12, 15, 8, 9]))).toEqual([
      'right',
      'select',
      'start',
      'up',
    ])
  })

  it('treats the left stick as a D-pad past the deadzone only', () => {
    expect(read(pad([], [0.3, -0.3]))).toEqual([])
    expect(read(pad([], [-0.9, 0.9]))).toEqual(['down', 'left'])
  })
})

describe('consume', () => {
  it('runs one update per elapsed step and carries the remainder', () => {
    const { steps, carry } = consume(0, STEP_MS * 2.5)
    expect(steps).toBe(2)
    expect(carry).toBeCloseTo(STEP_MS * 0.5)
  })

  it('spends the carried remainder on the next frame', () => {
    expect(consume(STEP_MS * 0.6, STEP_MS * 0.6).steps).toBe(1)
  })

  it('drops the backlog after a long stall instead of fast-forwarding', () => {
    expect(consume(0, 10_000)).toEqual({ steps: MAX_STEPS, carry: 0 })
  })
})

describe('Controls', () => {
  const sorted2 = (set: Set<string>) => [...set].sort()

  it('delivers a touch tap that starts and ends between two updates', () => {
    const controls = new Controls()
    controls.touch(1, ['a'])
    controls.lift(1)
    const frame = controls.read([])
    expect(sorted2(frame.pressed)).toEqual(['a'])
  })

  it('delivers a key tap that starts and ends between two updates', () => {
    const controls = new Controls()
    controls.key('start', true)
    controls.key('start', false)
    expect(sorted2(controls.read([]).pressed)).toEqual(['start'])
    expect(controls.read([]).held.size).toBe(0)
  })

  it('reports a held button as pressed on its first update only', () => {
    const controls = new Controls()
    controls.touch(7, ['left'])
    expect(sorted2(controls.read([]).pressed)).toEqual(['left'])
    const next = controls.read([])
    expect(sorted2(next.held)).toEqual(['left'])
    expect(next.pressed.size).toBe(0)
  })

  it('flags a controller only when it is actually being used', () => {
    const controls = new Controls()
    const idle = { buttons: [], axes: [0.1, -0.1] }
    const moving = { buttons: [], axes: [0.9, 0] }
    expect(controls.read([null, idle]).padActive).toBe(false)
    expect(controls.read([moving]).padActive).toBe(true)
  })
})
