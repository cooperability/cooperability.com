import type { Metadata, Viewport } from 'next'
import PromptComposerClient from './prompt-composer-client'

// Overrides the root layout's manifest so this route installs as its own PWA.
export const metadata: Metadata = {
  title: 'Prompt Composer',
  description:
    'A visual prompt building tool that demonstrates the modular nature of effective prompts for AI interactions.',
  openGraph: { title: 'Prompt Composer | Cooper Reed | Co-Operability' },
  manifest: '/icons/prompt-composer.webmanifest',
  // Metadata keys replace the parent's value rather than merging into it, so
  // the root layout's favicon has to be restated here.
  icons: { icon: '/icon.ico', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'Prompt Composer',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
}

export default function PromptComposerPage() {
  return (
    <div className="min-h-screen">
      <PromptComposerClient />
    </div>
  )
}
