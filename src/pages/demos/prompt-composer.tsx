import dynamic from 'next/dynamic'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'

// Dynamic import with loading skeleton for better FCP/LCP
const PromptComposer = dynamic(
  () => import('@/src/components/prompt-composer/PromptComposer'),
  {
    loading: () => (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="text-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto" />
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    ),
    ssr: false, // Client-only to reduce server bundle
  }
)

const PromptComposerPage: NextPageWithLayout = () => {
  return (
    <Layout skipManifest={true}>
      <Head>
        <title>Prompt Composer | Cooper Reed | Co-Operability</title>
        <meta
          name="description"
          content="A visual prompt building tool that demonstrates the modular nature of effective prompts for AI interactions."
        />
        {/* PWA-specific manifest for this applet */}
        <link rel="manifest" href="/icons/prompt-composer.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS-specific meta tags for standalone app */}
        <meta name="apple-mobile-web-app-title" content="Prompt Composer" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#3b82f6" />
      </Head>
      <div className="min-h-screen">
        <PromptComposer />
      </div>
    </Layout>
  )
}

export default PromptComposerPage
