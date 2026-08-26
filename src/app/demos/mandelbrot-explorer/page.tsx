import type { Metadata, Viewport } from 'next'
import MandelbrotExplorerClient from './mandelbrot-explorer-client'

export const metadata: Metadata = {
  title: { absolute: 'Mandelbrot Explorer | Cooper Reed' },
  description:
    'Interactive visualization of the Mandelbrot set fractal using the iterative equation z(n+1) = z(n)^2 + c',
  keywords: [
    'Mandelbrot set',
    'fractal',
    'complex numbers',
    'visualization',
    'interactive math',
    'TypeScript',
    'Canvas API',
  ],
  openGraph: {
    title: 'Mandelbrot Explorer',
    description:
      'Interactive fractal visualization - click to zoom into the infinite complexity of the Mandelbrot set',
    type: 'website',
  },
  manifest: '/icons/mandelbrot-explorer.webmanifest',
  icons: { icon: '/icon.ico', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'Mandelbrot Explorer',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#60a5fa',
}

export default function MandelbrotExplorerPage() {
  return (
    <div className="page-container">
      <MandelbrotExplorerClient />
    </div>
  )
}
