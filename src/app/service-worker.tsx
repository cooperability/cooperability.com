'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // The platform's own definition, rather than re-deriving it from the
    // protocol: service workers are allowed on https *and* on http://localhost,
    // and a hand-rolled `protocol !== 'https:'` check silently disables them in
    // local development, where they most need testing.
    if (!window.isSecureContext) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
