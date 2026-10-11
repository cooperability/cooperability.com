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
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
        </div>
        {/* One column, matching the composer, so nothing jumps on load. */}
        <div className="flex flex-col gap-3">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function PromptComposerClient() {
  return <PromptComposer />
}
