import { buzz } from '../../components/game/haptics'

// jsdom has neither the Vibration API nor gamepads, so both are stubbed per
// test and removed after.
let vibrate: jest.Mock
let pads: (Gamepad | null)[]

const padWith = (playEffect: jest.Mock) =>
  ({ vibrationActuator: { playEffect } }) as unknown as Gamepad

beforeEach(() => {
  vibrate = jest.fn()
  pads = []
  Object.defineProperty(navigator, 'vibrate', {
    value: vibrate,
    configurable: true,
  })
  Object.defineProperty(navigator, 'getGamepads', {
    value: () => pads,
    configurable: true,
  })
})

afterEach(() => {
  // @ts-expect-error removing the stubs again
  delete navigator.vibrate
  // @ts-expect-error removing the stubs again
  delete navigator.getGamepads
})

// Milliseconds the motor runs: the odd entries of a pattern are pauses.
const onTime = (pattern: number | number[]) =>
  [pattern].flat().reduce((sum, ms, i) => (i % 2 ? sum : sum + ms), 0)

describe('buzz', () => {
  it('vibrates a phone, longer for a hit taken than a hit landed', () => {
    buzz('hurt', 'touch')
    buzz('hit', 'touch')
    expect(vibrate).toHaveBeenCalledTimes(2)
    const [[hurt], [hit]] = vibrate.mock.calls
    expect(onTime(hurt)).toBeGreaterThan(onTime(hit))
  })

  it('rumbles every connected pad, harder for a hit taken', () => {
    const one = jest.fn(() => Promise.resolve('complete'))
    const two = jest.fn(() => Promise.resolve('complete'))
    pads = [padWith(one), null, padWith(two)]
    buzz('hurt', 'pad')
    buzz('hit', 'pad')
    expect(vibrate).not.toHaveBeenCalled()
    for (const play of [one, two]) {
      expect(play).toHaveBeenCalledTimes(2)
      const [[kind, hurt], [, hit]] = play.mock.calls as unknown as [
        string,
        GamepadEffectParameters,
      ][]
      expect(kind).toBe('dual-rumble')
      expect(hurt.strongMagnitude!).toBeGreaterThan(hit.strongMagnitude!)
      expect(hurt.duration!).toBeGreaterThan(hit.duration!)
    }
  })

  it('stays still for a keyboard player', () => {
    const play = jest.fn(() => Promise.resolve('complete'))
    pads = [padWith(play)]
    buzz('hurt', 'key')
    expect(vibrate).not.toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
  })

  it('carries on past a pad that throws or rejects', async () => {
    const throws = jest.fn(() => {
      throw new DOMException('unsupported', 'NotSupportedError')
    })
    const rejects = jest.fn(() => Promise.reject(new Error('busy')))
    const works = jest.fn(() => Promise.resolve('complete'))
    pads = [padWith(throws), padWith(rejects), padWith(works)]
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    try {
      expect(() => buzz('hit', 'pad')).not.toThrow()
      expect(works).toHaveBeenCalledTimes(1)
      // Node reports an unhandled rejection a turn after it settles.
      await new Promise((resolve) => setTimeout(resolve, 10))
    } finally {
      process.off('unhandledRejection', unhandled)
    }
    expect(unhandled).not.toHaveBeenCalled()
  })
})
