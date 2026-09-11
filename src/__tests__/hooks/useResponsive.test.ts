import { renderHook, act } from '@testing-library/react'
import { useResponsive } from '../../hooks/useResponsive'

/**
 * useResponsive reads the viewport through useSyncExternalStore rather than an
 * effect, so these cover the two things that rewrite could plausibly break:
 * the breakpoint boundaries, and the debounced resize subscription.
 */

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  })
}

describe('useResponsive', () => {
  const originalWidth = window.innerWidth

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    setViewport(originalWidth)
  })

  it('reports the current viewport width on first render', () => {
    setViewport(1280)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.width).toBe(1280)
  })

  it.each([
    [400, { isMobile: true, isSmall: true, isDesktop: false }],
    [525, { isMobile: true, isSmall: true, isDesktop: false }],
    [526, { isMobile: false, isSmall: true, isDesktop: false }],
    [700, { isMobile: false, isSmall: false, isDesktop: false }],
    [1024, { isMobile: false, isSmall: false, isDesktop: true }],
    [1400, { isMobile: false, isSmall: false, isDesktop: true }],
  ])('classifies %ipx correctly', (width, expected) => {
    setViewport(width)
    const { result } = renderHook(() => useResponsive())
    expect(result.current).toMatchObject(expected)
  })

  it('distinguishes medium from tablet at the Tailwind boundaries', () => {
    setViewport(700)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.isMedium).toBe(true)
    expect(result.current.isTablet).toBe(false)

    setViewport(800)
    act(() => {
      window.dispatchEvent(new Event('resize'))
      jest.advanceTimersByTime(100)
    })
    expect(result.current.isMedium).toBe(false)
    expect(result.current.isTablet).toBe(true)
  })

  it('updates after a resize, once the debounce elapses', () => {
    setViewport(1280)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.isDesktop).toBe(true)

    setViewport(400)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    // Still stale: the 100ms debounce has not fired yet.
    expect(result.current.width).toBe(1280)

    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current.width).toBe(400)
    expect(result.current.isMobile).toBe(true)
  })

  it('removes the very listener it added on unmount', () => {
    // Asserting `toHaveBeenCalledWith('resize', expect.any(Function))` passes
    // against `removeEventListener('resize', () => {})` too, which removes
    // nothing and leaks the real handler. The identity is the whole assertion.
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useResponsive())
    const added = addSpy.mock.calls.filter(([event]) => event === 'resize')
    expect(added).toHaveLength(1)

    unmount()
    const removed = removeSpy.mock.calls.filter(([event]) => event === 'resize')
    expect(removed).toHaveLength(1)
    expect(removed[0][1]).toBe(added[0][1])

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('clears a pending debounce on unmount', () => {
    // The listener going away does not help if the timer it already scheduled
    // still fires into an unmounted store.
    const { unmount } = renderHook(() => useResponsive())

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(jest.getTimerCount()).toBe(1)

    unmount()
    expect(jest.getTimerCount()).toBe(0)
  })
})
