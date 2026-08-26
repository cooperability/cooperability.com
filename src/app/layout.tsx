import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '../sections/Header'
import Footer from '../sections/Footer'
import Providers from './providers'
import ServiceWorkerRegistration from './service-worker'
import styles from '../styles/utils.module.css'
import '../styles/global.css'

// Not exported: Next type-checks route files against a fixed set of allowed
// exports, and any extra one fails the build.
const siteTitle = 'Cooper Reed | Co-Operability'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cooperability.com'),
  title: {
    default: siteTitle,
    template: '%s | Cooper Reed | Co-Operability',
  },
  description: "Cooper's portfolio website",
  icons: { icon: '/icon.ico', apple: '/icons/apple-touch-icon.png' },
  manifest: '/icons/site.webmanifest',
  // Inherited verbatim by any route that does not set its own — a `template`
  // here does not help, because it only applies when the child supplies an
  // `openGraph.title` of its own. Hence every content route sets one.
  openGraph: { title: siteTitle },
  appleWebApp: {
    capable: true,
    title: 'Co-Operability',
    statusBarStyle: 'default',
  },
  // Next renders appleWebApp.capable as `mobile-web-app-capable` only. iOS
  // before 17 needs the apple-prefixed name to launch standalone.
  other: { 'apple-mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // next-themes swaps the class on <html> before paint, which the server
    // markup cannot know about.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className={styles.container}>
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
          <ServiceWorkerRegistration />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
