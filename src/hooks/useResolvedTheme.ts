'use client'

import { useTheme } from 'next-themes'
import { useHydrated } from './useHydrated'

/**
 * The theme, safe to branch on inside a server-rendered client component.
 *
 * next-themes has no way to know the theme while rendering on the server, so
 * `useTheme()` returns undefined there and every consumer falls to its light
 * branch. On the client the provider has already read storage before React
 * runs, so the very first render knows the real theme. Branching on that
 * directly makes the hydration render disagree with the server markup, which
 * React reports as a mismatch and does not patch up.
 *
 * Gating on `useHydrated` holds the server's answer through hydration and
 * switches afterwards. Prefer this to reading `useTheme()` directly in
 * anything that server-renders.
 *
 * `resolvedTheme` rather than `theme`, because with `enableSystem` a user who
 * has never chosen explicitly has `theme === 'system'`, which is neither
 * 'light' nor 'dark'.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useTheme()
  const hydrated = useHydrated()

  if (!hydrated) return 'light'
  return resolvedTheme === 'dark' ? 'dark' : 'light'
}
