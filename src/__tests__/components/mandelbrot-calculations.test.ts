import {
  mandelbrotIterations,
  pixelToComplex,
  iterationsToColor,
  DEFAULT_VIEWPORT,
} from '../../components/mandelbrot-explorer/utils/calculations'

/**
 * Assertions here come from the algorithm's math (z_(n+1) = z^2 + c, escape at
 * |z| >= 2), not from running the current implementation and copying its
 * output, so a mutation that breaks the math has somewhere to fail.
 */
describe('mandelbrotIterations', () => {
  it('never escapes at the origin, which sits at the center of the main cardioid', () => {
    // z stays 0 forever when c = 0, so the loop always runs to maxIterations.
    expect(mandelbrotIterations(0, 0, 50)).toBe(50)
    expect(mandelbrotIterations(0, 0, 500)).toBe(500)
  })

  it('stays bounded at c = -1, the center of the period-2 bulb', () => {
    // The orbit cycles 0 -> -1 -> 0 -> -1 forever, so |z| never reaches 2.
    expect(mandelbrotIterations(-1, 0, 1000)).toBe(1000)
  })

  it('escapes within the first iteration far outside the set', () => {
    // z1 = c = (2, 2); |z1|^2 = 8 >= 4, so the loop stops after iteration 1
    // for any maxIterations >= 1.
    expect(mandelbrotIterations(2, 2, 10)).toBe(1)
    expect(mandelbrotIterations(2, 2, 1000)).toBe(1)
    expect(mandelbrotIterations(10, 10, 1000)).toBe(1)
  })

  it('is symmetric about the real axis, because conjugating c conjugates the whole orbit', () => {
    // z'_n = conj(z_n) when c' = conj(c), by induction on z -> z^2 + c, so
    // |z'_n| = |z_n| and both sequences escape at the same iteration.
    const points: Array<[number, number]> = [
      [0.3, 0.4],
      [-0.7, 0.3],
      [1, 1],
      [-1.2, 0.6],
      [0.25, 0.6],
    ]
    for (const [cx, cy] of points) {
      expect(mandelbrotIterations(cx, cy, 200)).toBe(
        mandelbrotIterations(cx, -cy, 200)
      )
    }
  })

  it('never returns a count outside [0, maxIterations]', () => {
    const samples: Array<[number, number]> = [
      [0, 0],
      [-1, 0],
      [2, 2],
      [0.3, 0.5],
      [-2, 0],
    ]
    for (const [cx, cy] of samples) {
      const result = mandelbrotIterations(cx, cy, 80)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(80)
    }
  })
})

describe('pixelToComplex', () => {
  it('maps pixel 0 to the minimum of the range', () => {
    expect(pixelToComplex(0, 500, -2, 2)).toBe(-2)
  })

  it('maps the far edge of the canvas to the maximum of the range', () => {
    expect(pixelToComplex(500, 500, -2, 2)).toBe(2)
  })

  it('maps the midpoint pixel to the midpoint of the range', () => {
    expect(pixelToComplex(250, 500, -2, 2)).toBe(0)
    expect(pixelToComplex(50, 100, -1, 3)).toBe(1)
  })

  it('is a monotonically increasing function of pixel for min < max', () => {
    const size = 400
    const values = [0, 50, 100, 200, 300, 400].map((pixel) =>
      pixelToComplex(pixel, size, -2, 2)
    )
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})

describe('iterationsToColor', () => {
  it('returns pure white for a bounded point (iterations === maxIterations)', () => {
    expect(iterationsToColor(100, 100)).toEqual([255, 255, 255])
    expect(iterationsToColor(1, 1)).toEqual([255, 255, 255])
  })

  it('returns black for immediate divergence', () => {
    expect(iterationsToColor(0, 100)).toEqual([0, 0, 0])
  })

  it('never exceeds the documented channel ranges for a diverging point', () => {
    // Per the doc comment: r,g = floor(ratio*50), b = floor(ratio*100), so
    // r,g are always <= 50 and b is always <= 100 for iterations < maxIterations.
    for (const iterations of [1, 10, 25, 50, 99]) {
      const [r, g, b] = iterationsToColor(iterations, 100)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(50)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(50)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(100)
    }
  })

  it('darkens monotonically as divergence happens sooner', () => {
    const slow = iterationsToColor(80, 100)
    const fast = iterationsToColor(20, 100)
    expect(fast[0]).toBeLessThanOrEqual(slow[0])
    expect(fast[1]).toBeLessThanOrEqual(slow[1])
    expect(fast[2]).toBeLessThanOrEqual(slow[2])
  })

  it('always returns a non-white color for a diverging point', () => {
    for (const iterations of [0, 1, 50, 99]) {
      const color = iterationsToColor(iterations, 100)
      expect(color).not.toEqual([255, 255, 255])
    }
  })
})

describe('DEFAULT_VIEWPORT', () => {
  it('is centered on the origin and spans the documented -2..2 square', () => {
    expect(DEFAULT_VIEWPORT.minReal).toBe(-2)
    expect(DEFAULT_VIEWPORT.maxReal).toBe(2)
    expect(DEFAULT_VIEWPORT.minImag).toBe(-2)
    expect(DEFAULT_VIEWPORT.maxImag).toBe(2)
  })
})
