'use client'

import dynamic from 'next/dynamic'

const Handheld = dynamic(() => import('@/src/components/game/Handheld'), {
  // Paints the shell colour at once so launch goes splash -> shell -> game
  // with no white flash between them.
  loading: () => (
    <div style={{ position: 'fixed', inset: 0, background: '#1b1b22' }} />
  ),
  // Canvas, input and wake lock APIs are browser-only.
  ssr: false,
})

export default function GameClient() {
  return <Handheld />
}
