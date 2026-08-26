'use client'

import dynamic from 'next/dynamic'

// `ssr: false` is only legal inside a Client Component, so the dynamic import
// lives here rather than in page.tsx (which has to stay a server component to
// export metadata).
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
    ssr: false,
  }
)

export default function PromptComposerClient() {
  return <PromptComposer />
}
