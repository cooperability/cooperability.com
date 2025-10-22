import OpioidConverter from '@/src/components/opioid-converter/OpioidConverter'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'

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
