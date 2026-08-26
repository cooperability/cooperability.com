'use client'

import { ThemeProvider } from 'next-themes'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Must be NEXT_PUBLIC_-prefixed to survive into the client bundle. Set by
  // `yarn access` so axe/Lighthouse audit a deterministic theme.
  const forcedTheme =
    process.env.NEXT_PUBLIC_AXE_FORCE_THEME === 'light' ? 'light' : undefined

  return (
    <ThemeProvider attribute="class" enableSystem forcedTheme={forcedTheme}>
      {children}
    </ThemeProvider>
  )
}
