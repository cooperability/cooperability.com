import type { Metadata, Viewport } from 'next'
import OpioidConverterClient from './opioid-converter-client'

export const metadata: Metadata = {
  title: { absolute: 'Opioid Converter Tool' },
  description:
    'Medical opioid dosage converter and morphine equivalence calculator',
  openGraph: { title: 'Opioid Converter Tool' },
  manifest: '/icons/opioid-converter.webmanifest',
  icons: { icon: '/icon.ico', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'Opioid Converter',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
}

export default function OpioidConverterPage() {
  return (
    <div className="page-container">
      <OpioidConverterClient />
    </div>
  )
}
