'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:') return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
