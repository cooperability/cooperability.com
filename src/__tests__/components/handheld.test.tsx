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

type Finger = { id: number; on: Element; x: number; y: number }

// jsdom has no Touch, so each finger is a plain object carrying what the
// shell reads, listed the way the browser lists every finger still down.
function touch(type: string, at: Element, fingers: Finger[]) {
  const e = new Event(type, { bubbles: true })
  Object.defineProperty(e, 'touches', {
    value: fingers.map((f) => ({
      identifier: f.id,
      target: f.on,
      clientX: f.x,
      clientY: f.y,
    })),
  })
  act(() => {
    at.dispatchEvent(e)
  })
}

// The D-pad laid out as a 100px square at the origin, with its two side arms.
function dpadOf(container: HTMLElement) {
  const dpad = container.querySelector<HTMLElement>('[data-zone="dpad"]')!
  jest.spyOn(dpad, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  } as DOMRect)
  return {
    dpad,
    left: dpad.querySelector('[data-button="left"]')!,
    right: dpad.querySelector('[data-button="right"]')!,
  }
}

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

  it('lets go of a D-pad arm whose finger the browser stopped listing', async () => {
    const { container } = render(<Handheld />)
    const { dpad, left, right } = dpadOf(container)
    touch('touchstart', right, [{ id: 1, on: right, x: 90, y: 50 }])
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe('right'))
    // Its touchend never came: the next touch lists only the new finger.
    touch('touchstart', left, [{ id: 2, on: left, x: 10, y: 50 }])
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe('left'))
  })

  it('lets go of every finger when the page hides or loses focus', async () => {
    const { container } = render(<Handheld />)
    const { dpad, right } = dpadOf(container)
    const hold = () =>
      touch('touchstart', right, [{ id: 1, on: right, x: 90, y: 50 }])
    hold()
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe('right'))
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    })
    try {
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await waitFor(() => expect(dpad.getAttribute('data-held')).toBe(''))
    } finally {
      // @ts-expect-error removing the stub, back to jsdom's own getter
      delete document.hidden
    }
    touch('touchend', right, [])
    hold()
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe('right'))
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    await waitFor(() => expect(dpad.getAttribute('data-held')).toBe(''))
  })

  it('ticks on every cap press until the menu turns it off', async () => {
    const vibrate = jest.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrate,
      configurable: true,
    })
    const { container } = render(<Handheld />)
    const { right } = dpadOf(container)
    touch('touchstart', right, [{ id: 1, on: right, x: 90, y: 50 }])
    expect(vibrate).toHaveBeenCalledTimes(1)
    touch('touchend', right, [])

    fireEvent.keyDown(window, { code: 'Backspace' })
    fireEvent.keyUp(window, { code: 'Backspace' })
    const box = await screen.findByRole('checkbox', { name: /haptic tick/i })
    expect(box).toBeChecked()
    // One invisible switch under each of the ten caps, for iOS.
    expect(container.querySelectorAll('input[switch]')).toHaveLength(10)
    fireEvent.click(box)
    expect(box).not.toBeChecked()
    expect(localStorage.getItem('game:tap-haptics')).toBe('off')
    expect(container.querySelectorAll('input[switch]')).toHaveLength(0)

    touch('touchstart', right, [{ id: 2, on: right, x: 90, y: 50 }])
    expect(vibrate).toHaveBeenCalledTimes(1)
    // @ts-expect-error removing the stub again
    delete navigator.vibrate
  })

  it('fills a desktop window edge to edge, the view taking its shape', () => {
    setTouchPoints(0)
    let fire = (width: number, height: number) => {
      void [width, height]
    }
    window.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        fire = (width, height) =>
          callback(
            [{ contentRect: { width, height } } as ResizeObserverEntry],
            this as unknown as ResizeObserver
          )
      }
      observe = noop
      disconnect = noop
    } as unknown as typeof ResizeObserver
    render(<Handheld />)
    const canvas = screen.getByRole('img') as HTMLCanvasElement
    const size = () => [canvas.width, canvas.style.width, canvas.style.height]
    // 180 game pixels tall in 950: 364 across fill 1920.
    act(() => fire(1920, 950))
    expect(size()).toEqual([364, '1920px', '950px'])
    act(() => fire(1440, 900))
    expect(size()).toEqual([288, '1440px', '900px'])
    // Past 2.4:1 the view stops widening, and the sides keep bars.
    act(() => fire(3440, 1000))
    expect(size()).toEqual([432, '2400px', '1000px'])
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

  it('opens the menu on select, with a debug checkbox Space can toggle', async () => {
    render(<Handheld />)
    fireEvent.keyDown(window, { code: 'Backspace' })
    fireEvent.keyUp(window, { code: 'Backspace' })
    const box = await screen.findByRole('checkbox', { name: /debug view/i })
    expect(box).not.toBeChecked()
    fireEvent.click(box)
    expect(box).toBeChecked()
    // Space on the checkbox goes to it, not to the game as a jump that
    // would close the menu.
    const press = new KeyboardEvent('keydown', {
      code: 'Space',
      bubbles: true,
      cancelable: true,
    })
    box.dispatchEvent(press)
    expect(press.defaultPrevented).toBe(false)
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

  it('plays the layout picked in the legend, and remembers it', async () => {
    setTouchPoints(0)
    const first = render(<Handheld />)
    const keys = first.container.querySelector('.keys')!
    const tap = async (code: string, held: string) => {
      fireEvent.keyDown(window, { code })
      await waitFor(() => expect(keys.getAttribute('data-held')).toBe(held))
      fireEvent.keyUp(window, { code })
      await waitFor(() => expect(keys.getAttribute('data-held')).toBe(''))
    }
    // Arrows + WASD first, where W throws the torch.
    await tap('KeyW', 'y')
    // Typing on the other layout's keys does not switch to it.
    fireEvent.keyDown(window, { code: 'KeyJ' })
    fireEvent.keyUp(window, { code: 'KeyJ' })
    fireEvent.click(screen.getByRole('button', { name: /arrows \+ wasd/i }))
    await tap('KeyW', 'up')
    first.unmount()
    render(<Handheld />)
    expect(
      screen.getByRole('button', { name: /wasd \+ ijkl/i })
    ).toBeInTheDocument()
  })

  it('lets go of a held key when the layout changes', async () => {
    setTouchPoints(0)
    const { container } = render(<Handheld />)
    const keys = container.querySelector('.keys')!
    fireEvent.keyDown(window, { code: 'KeyW' })
    await waitFor(() => expect(keys.getAttribute('data-held')).toBe('y'))
    fireEvent.click(screen.getByRole('button', { name: /arrows \+ wasd/i }))
    // In WASD + IJKL the same key lets go of up, so torch must not stay held.
    fireEvent.keyUp(window, { code: 'KeyW' })
    await waitFor(() => expect(keys.getAttribute('data-held')).toBe(''))
  })

  it('lets Space and Enter reach a focused button instead of the game', () => {
    Object.defineProperty(navigator, 'standalone', {
      value: false,
      configurable: true,
    })
    render(<Handheld />)
    const dismiss = screen.getByRole('button', { name: /dismiss hint/i })
    for (const code of ['Space', 'Enter']) {
      const press = new KeyboardEvent('keydown', {
        code,
        bubbles: true,
        cancelable: true,
      })
      dismiss.dispatchEvent(press)
      expect(press.defaultPrevented).toBe(false)
    }
  })

  it('releases a wake lock granted after the game has closed', async () => {
    const release = jest.fn(() => Promise.resolve())
    let grant: (lock: { release: typeof release }) => void = () => {}
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: () => new Promise((resolve) => (grant = resolve)) },
      configurable: true,
    })
    const { unmount } = render(<Handheld />)
    unmount()
    await act(async () => grant({ release }))
    expect(release).toHaveBeenCalled()
    // @ts-expect-error removing the stub again
    delete navigator.wakeLock
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
