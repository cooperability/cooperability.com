'use client'

import { useSyncExternalStore } from 'react'

// Never fires: the value flips exactly once, when React swaps the server
// snapshot for the client one during hydration.
const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * `false` while server-rendering and during the hydration render, `true`
 * afterwards. Use it to gate anything that would otherwise produce different
 * markup on the server than on the client (theme, viewport, locale).
 *
 * Prefer this to the `useState(false)` + `useEffect(() => setMounted(true))`
 * idiom, which schedules a second render pass on every mount and trips
 * `react-hooks/set-state-in-effect`.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
