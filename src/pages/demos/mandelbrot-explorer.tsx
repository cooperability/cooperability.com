import dynamic from 'next/dynamic'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'

// Dynamic import with loading skeleton for better FCP/LCP
// MandelbrotExplorer is computationally intensive, so lazy loading improves initial page load
const MandelbrotExplorer = dynamic(
  () => import('@/src/components/mandelbrot-explorer/MandelbrotExplorer'),
  {
    loading: () => (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="text-center mb-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto" />
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-[500px] h-[500px] bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ),
    ssr: false, // Client-only - canvas rendering requires browser APIs
  }
)

const MandelbrotExplorerPage: NextPageWithLayout = () => {
  return (
    <Layout skipManifest={true}>
      <Head>
        <title>Mandelbrot Explorer | Cooper Reed</title>
        <meta
          name="description"
          content="Interactive visualization of the Mandelbrot set fractal using the iterative equation z(n+1) = z(n)^2 + c"
        />
        <meta
          name="keywords"
          content="Mandelbrot set, fractal, complex numbers, visualization, interactive math, TypeScript, Canvas API"
        />
        <meta property="og:title" content="Mandelbrot Explorer" />
        <meta
          property="og:description"
          content="Interactive fractal visualization - click to zoom into the infinite complexity of the Mandelbrot set"
        />
        <meta property="og:type" content="website" />
        {/* PWA-specific manifest for this applet */}
        <link rel="manifest" href="/icons/mandelbrot-explorer.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS-specific meta tags for standalone app */}
        <meta name="apple-mobile-web-app-title" content="Mandelbrot Explorer" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#60a5fa" />
      </Head>
      <div className="page-container">
        <MandelbrotExplorer />
      </div>
    </Layout>
  )
}

export default MandelbrotExplorerPage
