/**
 * Mandelbrot Set Calculations
 *
 * Core algorithm: z₍ₙ₊₁₎ = z²ₙ + c
 *
 * For each point c in the complex plane, we iterate starting with z₀ = 0.
 * If the sequence remains bounded (magnitude < 2), the point is in the Mandelbrot set.
 * If it diverges to infinity, it's not in the set.
 */

/**
 * Calculates iterations until a point diverges from the Mandelbrot set.
 *
 * Starting with z = 0, repeatedly applies z = z² + c until either:
 * - The magnitude exceeds 2 (diverges) → return iteration count
 * - Max iterations reached (bounded) → return maxIterations
 *
 * Example: For c = 1 + 2i with maxIterations = 256:
 * - z₀ = 0 + 0i
 * - z₁ = 0² + (1+2i) = 1 + 2i, |z| = 2.236
 * - z₂ = (1+2i)² + (1+2i) = -2 + 6i, |z| = 6.325
 * - Continues diverging → returns ~3 iterations
 *
 * @param cx - Real component of complex number c
 * @param cy - Imaginary component of complex number c
 * @param maxIterations - Maximum iterations before considering point bounded
 * @returns Iteration count at divergence, or maxIterations if bounded
 */
export function mandelbrotIterations(
  cx: number,
  cy: number,
  maxIterations: number
): number {
  let zx = 0 // Real part of z
  let zy = 0 // Imaginary part of z
  let iteration = 0

  // Loop until divergence or max iterations
  // Note: We check if |z|² < 4 (equivalent to |z| < 2, but faster without sqrt)
  while (iteration < maxIterations && zx * zx + zy * zy < 4) {
    // Complex multiplication: (zx + zy·i)² = zx² - zy² + 2·zx·zy·i
    // Then add c: result = (zx² - zy²) + cx + (2·zx·zy + cy)i
    const xtemp = zx * zx - zy * zy + cx
    zy = 2 * zx * zy + cy
    zx = xtemp
    iteration++
  }

  return iteration
}

/**
 * Maps a pixel coordinate to its corresponding position in the complex plane.
 *
 * Linear interpolation: converts screen space [0, size] to complex plane [min, max]
 *
 * Example: For pixel 250 in a 500px canvas with range [-2, 2]:
 *   250 / 500 = 0.5 (halfway across)
 *   -2 + 0.5 × (2 - (-2)) = -2 + 0.5 × 4 = 0.0 (center of complex plane)
 *
 * @param pixel - Pixel position (0 to size-1)
 * @param size - Total size of the canvas dimension
 * @param min - Minimum value in complex plane (e.g., -2)
 * @param max - Maximum value in complex plane (e.g., 2)
 * @returns Corresponding position in the complex plane
 */
export function pixelToComplex(
  pixel: number,
  size: number,
  min: number,
  max: number
): number {
  return min + (pixel / size) * (max - min)
}

/**
 * Default viewport showing the classic Mandelbrot set.
 *
 * Complex plane from -2-2i to 2+2i captures the entire set with some margin.
 * The main cardioid and circular bulb are centered near the origin.
 */
export const DEFAULT_VIEWPORT = {
  minReal: -2,
  maxReal: 2,
  minImag: -2,
  maxImag: 2,
}

/**
 * Maps iteration count to an RGB color.
 *
 * Assignment requirement:
 * - LIGHT color for bounded points (in the set)
 * - DARK color for diverging points (not in the set)
 *
 * Implementation:
 * - Bounded (iterations === maxIterations): White (255, 255, 255)
 * - Diverging: Dark gradient from black to dark blue based on how quickly it diverged
 *
 * @param iterations - Number of iterations before divergence
 * @param maxIterations - Maximum possible iterations
 * @returns RGB color as [red, green, blue] tuple
 */
export function iterationsToColor(
  iterations: number,
  maxIterations: number
): [number, number, number] {
  if (iterations === maxIterations) {
    // Bounded → LIGHT (white)
    return [255, 255, 255]
  } else {
    // Diverging → DARK gradient (black to dark blue)
    // Faster divergence = darker, slower = slightly lighter
    const ratio = iterations / maxIterations
    const r = Math.floor(ratio * 50)
    const g = Math.floor(ratio * 50)
    const b = Math.floor(ratio * 100)
    return [r, g, b]
  }
}
