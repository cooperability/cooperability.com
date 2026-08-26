'use client'

import { useSyncExternalStore } from 'react'

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
const RESIZE_DEBOUNCE_MS = 100

function subscribe(onStoreChange: () => void) {
  let timeoutId: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(onStoreChange, RESIZE_DEBOUNCE_MS)
  }

  window.addEventListener('resize', onResize)
  return () => {
    clearTimeout(timeoutId)
    window.removeEventListener('resize', onResize)
  }
}

const getSnapshot = () => window.innerWidth

// 0 is the "not hydrated yet" sentinel; a real viewport is never 0 wide.
const getServerSnapshot = () => 0

export function useResponsive(): BreakpointState {
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Return safe defaults during SSR/hydration
  if (width === 0) {
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
