'use client'

import { useEffect } from 'react'

// True when this document was loaded at another path and reached `current`
// by a client-side navigation.
export function enteredClientSide(loadedUrl: string, current: Location) {
  return new URL(loadedUrl, current.href).pathname !== current.pathname
}

// Reloads an installable app page reached by a client-side navigation. Such a
// document keeps the head it loaded with, so iOS Add to Home Screen would
// save the previous page's manifest (the site's, start_url /) and the icon
// would open the homepage instead of the app.
export default function HardLoad() {
  useEffect(() => {
    const entry = performance.getEntriesByType?.('navigation')[0]
    if (entry && enteredClientSide(entry.name, window.location))
      window.location.reload()
  }, [])
  return null
}
