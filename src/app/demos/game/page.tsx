import type { Metadata, Viewport } from 'next'
import { GAME_ASSET_DIR, splashImages } from '@/src/components/game/splash'
import GameClient from './game-client'

export const metadata: Metadata = {
  title: { absolute: 'Game | Cooper Reed' },
  description: 'A handheld-style game, built to be added to the home screen.',
  openGraph: { title: 'Game | Cooper Reed', type: 'website' },
  manifest: '/icons/game.webmanifest',
  icons: { icon: '/icon.ico', apple: `${GAME_ASSET_DIR}/apple-touch-icon.png` },
  appleWebApp: {
    capable: true,
    title: 'Game',
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
  return <GameClient />
}
