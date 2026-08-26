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

  it('removes its resize listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useResponsive())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
