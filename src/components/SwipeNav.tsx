'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NAV_LINKS } from '../lib/nav'

const MIN_DISTANCE = 60
const MAX_DURATION_MS = 600
// A swipe from a screen edge is the browser's own back and forward gesture.
const EDGE = 24
// Gestures and fields that already use a horizontal drag.
const OWNS_DRAG =
  'input, textarea, select, canvas, [contenteditable], [data-no-swipe]'

function scrollsSideways(target: EventTarget | null) {
  for (let el = target as Element | null; el; el = el.parentElement) {
    const overflowX = getComputedStyle(el).overflowX
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      el.scrollWidth > el.clientWidth
    ) {
      return true
    }
  }
  return false
}

/**
 * Swipe left for the next page of the selector, right for the previous one.
 * Only on the selector's own pages: a subpage such as the Mandelbrot explorer
 * or the game uses horizontal drags itself.
 */
export default function SwipeNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const index = NAV_LINKS.findIndex(({ href }) => href === pathname)
    if (index === -1) return

    let start: { x: number; y: number; at: number } | null = null

    const onStart = (e: TouchEvent) => {
      start = null
      const touch = e.touches[0]
      if (e.touches.length !== 1 || !touch) return
      if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) {
        return
      }
      const target = e.target
      if (target instanceof Element && target.closest(OWNS_DRAG)) return
      if (scrollsSideways(target)) return
      start = { x: touch.clientX, y: touch.clientY, at: e.timeStamp }
    }

    const onEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const from = start
      start = null
      if (!from || !touch) return

      const dx = touch.clientX - from.x
      const dy = touch.clientY - from.y
      // Mostly sideways, and quick: a slow drag is a selection or a scroll.
      if (
        Math.abs(dx) < MIN_DISTANCE ||
        Math.abs(dx) < 2 * Math.abs(dy) ||
        e.timeStamp - from.at > MAX_DURATION_MS
      ) {
        return
      }

      const next = NAV_LINKS[index + (dx < 0 ? 1 : -1)]
      if (next) router.push(next.href)
    }

    const onCancel = () => {
      start = null
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [pathname, router])

  return null
}
