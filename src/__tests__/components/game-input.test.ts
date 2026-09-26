import {
  Controls,
  dpadFromPoint,
  faceFromPoint,
  FACE_LAYOUT,
  FACE_REACH,
  KEY_MAP,
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
  const centre = (b: keyof typeof FACE_LAYOUT) =>
    [FACE_LAYOUT[b].x, FACE_LAYOUT[b].y] as const
  const between = (p: keyof typeof FACE_LAYOUT, q: keyof typeof FACE_LAYOUT) =>
    [
      (FACE_LAYOUT[p].x + FACE_LAYOUT[q].x) / 2,
      (FACE_LAYOUT[p].y + FACE_LAYOUT[q].y) / 2,
    ] as const

  it('sits in the Xbox diamond: Y top, X left, B right, A bottom', () => {
    expect(FACE_LAYOUT.y.y).toBeLessThan(FACE_LAYOUT.a.y)
    expect(FACE_LAYOUT.x.x).toBeLessThan(FACE_LAYOUT.b.x)
  })

  it.each(['a', 'b', 'x', 'y'] as const)(
    'presses %s alone at its centre',
    (b) => {
      expect(faceFromPoint(...centre(b))).toEqual([b])
    }
  )

  it('presses both of two neighbours when the thumb rolls between them', () => {
    expect(sorted(faceFromPoint(...between('a', 'x')))).toEqual(['a', 'x'])
    expect(sorted(faceFromPoint(...between('y', 'b')))).toEqual(['b', 'y'])
  })

  it('presses nothing at the centre, between opposite buttons', () => {
    expect(faceFromPoint(...between('a', 'y'))).toEqual([])
  })

  it('presses nothing out of reach of every button', () => {
    const buttons = Object.values(FACE_LAYOUT)
    let checked = 0
    for (let i = 0; i <= 50; i++) {
      for (let j = 0; j <= 50; j++) {
        const [x, y] = [i / 50, j / 50]
        const far = buttons.every(
          (b) => Math.hypot(x - b.x, y - b.y) > FACE_REACH
        )
        if (!far) continue
        checked++
        expect([x, y, faceFromPoint(x, y)]).toEqual([x, y, []])
      }
    }
    // Guards against the scan silently checking nothing.
    expect(checked).toBeGreaterThan(500)
  })
})

describe('KEY_MAP', () => {
  it('mirrors the face diamond on IJKL', () => {
    expect([KEY_MAP.KeyI, KEY_MAP.KeyJ, KEY_MAP.KeyK, KEY_MAP.KeyL]).toEqual([
      'y',
      'x',
      'a',
      'b',
    ])
  })

  it('moves on WASD and the arrows', () => {
    expect([KEY_MAP.KeyW, KEY_MAP.KeyA, KEY_MAP.KeyS, KEY_MAP.KeyD]).toEqual([
      'up',
      'left',
      'down',
      'right',
    ])
    expect(KEY_MAP.ArrowLeft).toBe('left')
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

  it('maps the standard face buttons to the Xbox diamond', () => {
    expect(read(pad([0]))).toEqual(['a'])
    expect(read(pad([1]))).toEqual(['b'])
    expect(read(pad([2]))).toEqual(['x'])
    expect(read(pad([3]))).toEqual(['y'])
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
