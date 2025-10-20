import PromptComposer from '@/src/components/prompt-composer/PromptComposer'
import Layout from '@/src/components/layout'
import type { NextPageWithLayout } from './_app'
import Head from 'next/head'

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
