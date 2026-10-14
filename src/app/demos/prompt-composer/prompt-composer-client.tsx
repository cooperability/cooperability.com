'use client'

import dynamic from 'next/dynamic'

// `ssr: false` is only legal inside a Client Component, so the dynamic import
// lives here rather than in page.tsx (which has to stay a server component to
// export metadata).
const PromptComposer = dynamic(
  () => import('@/src/components/prompt-composer/PromptComposer'),
  {
    loading: () => (
      <div className="p-4 animate-pulse lg:mx-[calc(50%_-_min(50vw_-_1rem,44rem))]">
        <div className="text-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
        </div>
        {/* The composer's columns, so nothing jumps on load. */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] xl:h-[calc(100dvh-10rem)] xl:min-h-[30rem] xl:grid-cols-[16rem_minmax(0,1fr)_18rem] 2xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg xl:h-auto" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg xl:h-auto" />
          <div className="hidden h-96 bg-gray-200 dark:bg-gray-700 rounded-lg xl:block xl:h-auto" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function PromptComposerClient() {
  return <PromptComposer />
}
