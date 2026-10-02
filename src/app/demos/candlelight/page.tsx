import type { Metadata, Viewport } from 'next'
import HardLoad from '@/src/components/HardLoad'
import { GAME_ASSET_DIR, splashImages } from '@/src/components/game/splash'
import GameClient from './game-client'

export const metadata: Metadata = {
  title: { absolute: 'Candlelight | Cooper Reed' },
  description:
    'Candlelight, a survival horror platformer built to be added to the home screen.',
  openGraph: { title: 'Candlelight | Cooper Reed', type: 'website' },
  manifest: '/icons/game.webmanifest',
  // Versioned, like the manifest's icons: iOS caches an icon per URL, and an
  // install that once failed to fetch it shows a "C" from then on.
  icons: {
    icon: '/icon.ico',
    apple: {
      url: `${GAME_ASSET_DIR}/apple-touch-icon-v2.png`,
      sizes: '180x180',
      type: 'image/png',
    },
  },
  appleWebApp: {
    capable: true,
    title: 'Candlelight',
    // Draws under the status bar. The shell pads itself with the safe-area
    // insets, which viewportFit: 'cover' below makes non-zero.
    statusBarStyle: 'black-translucent',
    startupImage: splashImages(),
  },
  // `other` replaces the layout's rather than merging, so the pre-iOS 17 tag
  // has to be restated here.
  other: { 'apple-mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1b1b22',
}

export default function GamePage() {
  return (
    <>
      <HardLoad />
      <GameClient />
    </>
  )
}
