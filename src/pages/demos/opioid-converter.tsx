import dynamic from 'next/dynamic'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'

// Dynamic import with loading skeleton for better FCP/LCP
const OpioidConverter = dynamic(
  () => import('@/src/components/opioid-converter/OpioidConverter'),
  {
    loading: () => (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="text-center mb-6">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto" />
        </div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ),
    ssr: false, // Client-only to reduce server bundle
  }
)

const OpioidConverterPage: NextPageWithLayout = () => {
  return (
    <Layout skipManifest={true}>
      <Head>
        <title>Opioid Converter Tool</title>
        <meta
          name="description"
          content="Medical opioid dosage converter and morphine equivalence calculator"
        />
        {/* PWA-specific manifest for this applet */}
        <link rel="manifest" href="/icons/opioid-converter.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS-specific meta tags for standalone app */}
        <meta name="apple-mobile-web-app-title" content="Opioid Converter" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#10b981" />
      </Head>
      <div className="page-container">
        <OpioidConverter />
      </div>
    </Layout>
  )
}

export default OpioidConverterPage
