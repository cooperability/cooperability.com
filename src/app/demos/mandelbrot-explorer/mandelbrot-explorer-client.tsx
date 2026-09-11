'use client'

import dynamic from 'next/dynamic'

const MandelbrotExplorer = dynamic(
  () => import('@/src/components/mandelbrot-explorer/MandelbrotExplorer'),
  {
    loading: () => (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="text-center mb-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto" />
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-[500px] h-[500px] bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ),
    // Canvas rendering needs browser APIs.
    ssr: false,
  }
)

export default function MandelbrotExplorerClient() {
  return <MandelbrotExplorer />
}
