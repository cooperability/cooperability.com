'use client'

import dynamic from 'next/dynamic'

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
    ssr: false,
  }
)

export default function OpioidConverterClient() {
  return <OpioidConverter />
}
