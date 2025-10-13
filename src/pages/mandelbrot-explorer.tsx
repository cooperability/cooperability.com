import MandelbrotExplorer from '@/src/components/mandelbrot-explorer/MandelbrotExplorer'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from './_app'
import Head from 'next/head'

const MandelbrotExplorerPage: NextPageWithLayout = () => {
  return (
    <Layout>
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
        <meta name="theme-color" content="#60a5fa" />
      </Head>
      <div className="page-container">
        <MandelbrotExplorer />
      </div>
    </Layout>
  )
}

export default MandelbrotExplorerPage

