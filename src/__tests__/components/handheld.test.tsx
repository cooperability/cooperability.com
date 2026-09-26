import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Handheld from '../../components/game/Handheld'

// jsdom has no canvas, layout or media queries, so each is stubbed to the
// narrowest thing the component touches.
const noop = () => {}
const ctx = new Proxy({}, { get: () => noop, set: () => true })

function setTouchPoints(n: number) {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: n,
    configurable: true,
  })
}

beforeEach(() => {
  setTouchPoints(5)
  localStorage.clear()
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  window.matchMedia = jest.fn(() => ({
    matches: false,
  })) as unknown as typeof window.matchMedia
  window.ResizeObserver = class {
    observe = noop
    disconnect = noop
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  jest.restoreAllMocks()
  // @ts-expect-error removing the iOS-only property again
  delete navigator.standalone
})

const root = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement

describe('Handheld', () => {
  it('shows the touch controls on a touch screen', () => {
    const { container } = render(<Handheld />)
    expect(root(container)).toHaveAttribute('data-mode', 'touch')
  })

  it('starts with the screen alone where there is no touch screen', () => {
    setTouchPoints(0)
    const { container } = render(<Handheld />)
    expect(root(container)).toHaveAttribute('data-mode', 'external')
  })

  it('hands the whole shell to the screen once a key is pressed', () => {
    const { container } = render(<Handheld />)
    act(() => {
      fireEvent.keyDown(window, { code: 'ArrowUp' })
    })
    expect(root(container)).toHaveAttribute('data-mode', 'external')
  })

  it('brings the touch controls back on the next touch anywhere', () => {
    const { container } = render(<Handheld />)
    act(() => {
      fireEvent.keyDown(window, { code: 'ArrowUp' })
    })
    // The pad is hidden now, so the touch lands on the screen instead.
    // jsdom has no PointerEvent, so pointerType is attached by hand.
    const touch = new MouseEvent('pointerdown', { bubbles: true })
    Object.defineProperty(touch, 'pointerType', { value: 'touch' })
    act(() => {
      screen.getByRole('img').dispatchEvent(touch)
    })
    expect(root(container)).toHaveAttribute('data-mode', 'touch')
  })

  it('releases a key even when a modifier is down at release', async () => {
    const { container } = render(<Handheld />)
    const dpad = container.querySelector('.dpad')!
    fireEvent.keyDown(window, { code: 'ArrowLeft' })
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe('left'))
    fireEvent.keyUp(window, { code: 'ArrowLeft', ctrlKey: true })
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe(''))
  })

  it('takes the site chrome out of reach while the game is up', () => {
    const header = document.createElement('header')
    document.body.prepend(header)
    const { unmount } = render(<Handheld />)
    expect(header).toHaveAttribute('inert')
    unmount()
    expect(header).not.toHaveAttribute('inert')
    header.remove()
  })

  it('keeps the touch controls when a controller connects but is not used', () => {
    // Browsers report connections for devices nobody is holding, and some
    // fire the event on page load.
    const { container } = render(<Handheld />)
    act(() => {
      window.dispatchEvent(new Event('gamepadconnected'))
    })
    expect(root(container)).toHaveAttribute('data-mode', 'touch')
  })

  it('offers Add to Home Screen in iOS Safari, once', () => {
    Object.defineProperty(navigator, 'standalone', {
      value: false,
      configurable: true,
    })
    const first = render(<Handheld />)
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss hint/i }))
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
    first.unmount()

    render(<Handheld />)
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
  })

  it('keeps the hint out of browsers that cannot add to the home screen', () => {
    render(<Handheld />)
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /demos/i })).toBeInTheDocument()
  })

  it('drops the exit link when launched from the home screen', () => {
    Object.defineProperty(navigator, 'standalone', {
      value: true,
      configurable: true,
    })
    render(<Handheld />)
    expect(
      screen.queryByRole('link', { name: /demos/i })
    ).not.toBeInTheDocument()
  })
})
