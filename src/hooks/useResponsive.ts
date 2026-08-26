import { useState, useEffect, useCallback } from 'react'

/**
 * Tailwind-aligned breakpoints for consistent responsive design
 * These match Tailwind's default breakpoints for CSS/JS alignment
 */
export const BREAKPOINTS = {
  sm: 640, // Tailwind sm
  md: 768, // Tailwind md
  lg: 1024, // Tailwind lg
  xl: 1280, // Tailwind xl
  '2xl': 1536, // Tailwind 2xl
} as const

// Legacy threshold for backwards compatibility
const MOBILE_WIDTH_THRESHOLD = 525

type BreakpointState = {
  isMobile: boolean // < 525px (legacy)
  isSmall: boolean // < 640px (sm)
  isMedium: boolean // >= 640px && < 768px
  isTablet: boolean // >= 768px && < 1024px
  isDesktop: boolean // >= 1024px
  isLargeDesktop: boolean // >= 1280px
  width: number // Current window width
}

/**
 * SSR-safe responsive hook with Tailwind-aligned breakpoints
 *
 * Usage:
 *   const { isMobile, isDesktop, width } = useResponsive()
 *
 * For CSS-first approach, prefer Tailwind classes (sm:, md:, lg:)
 * Use this hook only when you need JS-based responsive behavior
 */
export function useResponsive(): BreakpointState {
  // SSR-safe: Start with undefined width, hydrate on client
  const [width, setWidth] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  // Debounced resize handler for performance
  const handleResize = useCallback(() => {
    setWidth(window.innerWidth)
  }, [])

  useEffect(() => {
    // Mark as mounted and set initial width
    // Deliberate SSR hydration guard: the server cannot know the theme or the
    // viewport, so the first client render must match the server output and only
    // then flip to the real value. Setting state here is the point, not an
    // oversight -- which is why the rule is silenced at this one call site
    // rather than downgraded globally.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setWidth(window.innerWidth)

    // Debounce resize events
    let timeoutId: ReturnType<typeof setTimeout>
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [handleResize])

  // Return safe defaults during SSR/hydration
  if (!mounted) {
    return {
      isMobile: false,
      isSmall: false,
      isMedium: false,
      isTablet: false,
      isDesktop: true, // Default to desktop for SSR
      isLargeDesktop: false,
      width: 0,
    }
  }

  return {
    isMobile: width <= MOBILE_WIDTH_THRESHOLD,
    isSmall: width < BREAKPOINTS.sm,
    isMedium: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLargeDesktop: width >= BREAKPOINTS.xl,
    width,
  }
}
