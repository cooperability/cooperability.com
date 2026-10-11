import { render, screen, fireEvent } from '@testing-library/react'
import MandelbrotExplorer from '../../components/mandelbrot-explorer/MandelbrotExplorer'

/**
 * Both zoom gestures target the point (-1, 1i): pixel (125, 375) on the
 * 500px canvas over the default [-2, 2] view. A 3x zoom leaves a 4/3-wide
 * window centred there, which a 2x zoom (2-wide) cannot produce.
 */

function setup() {
  // jsdom has no canvas backend. A null context makes the renderer bail early.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const { container } = render(<MandelbrotExplorer />)
  const canvas = container.querySelector('canvas')!
  jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 500,
    height: 500,
  } as DOMRect)
  return canvas
}

function expectZoomedThreeTimesOnTarget() {
  expect(screen.getByText('[-1.6667, -0.3333]')).toBeInTheDocument()
  expect(screen.getByText('[0.3333, 1.6667]')).toBeInTheDocument()
}

describe('MandelbrotExplorer zoom', () => {
  afterEach(() => jest.restoreAllMocks())

  it('zooms 3x centred on a double-clicked point', () => {
    const canvas = setup()
    fireEvent.doubleClick(canvas, { clientX: 125, clientY: 375 })
    expectZoomedThreeTimesOnTarget()
  })

  it('zooms 3x centred on a double-tapped point', () => {
    const canvas = setup()
    const now = jest.spyOn(Date, 'now')
    const tap = { touches: [{ clientX: 125, clientY: 375 }] }

    now.mockReturnValue(1000)
    fireEvent.touchStart(canvas, tap)
    fireEvent.touchEnd(canvas)
    now.mockReturnValue(1100)
    fireEvent.touchStart(canvas, tap)

    expectZoomedThreeTimesOnTarget()
  })

  it('tells the user how to pan and zoom 3x, one instruction per line', () => {
    setup()
    const lines = Array.from(document.querySelectorAll('p'), (p) =>
      p.textContent?.trim()
    )
    expect(lines).toContain('Click/tap + drag to pan')
    expect(lines).toContain('Double-click/tap to zoom 3×.')
  })
})

// A natively disabled button drops keyboard focus to <body> the moment it
// disables, so the controls must stay focusable whenever they are unavailable.
describe('MandelbrotExplorer controls', () => {
  afterEach(() => jest.restoreAllMocks())

  const iterations = () => screen.getByText('Max Iterations:').nextSibling

  it('keeps focus on a control pressed mid-render and ignores the press', () => {
    const ctx = {
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData() {},
      clearRect() {},
      drawImage() {},
    }
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    // Never schedule the next chunk, so the first render stays in progress.
    jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(0)
    render(<MandelbrotExplorer />)

    const plus = screen.getByRole('button', { name: '+ Iterations' })
    plus.focus()
    fireEvent.click(plus)

    expect(plus).toHaveFocus()
    expect(plus).toBeEnabled()
    expect(plus).toHaveAttribute('aria-disabled', 'true')
    expect(iterations()).toHaveTextContent('256')
  })

  it('keeps focus on - Iterations at its floor of 50 and ignores further presses', () => {
    setup()
    const minus = screen.getByRole('button', { name: '- Iterations' })
    minus.focus()
    for (let i = 0; i < 6; i++) fireEvent.click(minus)

    expect(iterations()).toHaveTextContent('50')
    expect(minus).toHaveFocus()
    expect(minus).toBeEnabled()
    expect(minus).toHaveAttribute('aria-disabled', 'true')
  })
})
