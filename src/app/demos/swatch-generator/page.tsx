import type { Metadata } from 'next'
import SwatchGenerator from '@/src/components/swatch-generator/SwatchGenerator'

export const metadata: Metadata = {
  title: 'Personal Swatch Generator',
  description:
    'Pick your eye, skin and hair colors to build a color palette, with optional seasonal analysis, then save it as a JPG or PDF.',
  openGraph: {
    title: 'Personal Swatch Generator | Cooper Reed | Co-Operability',
  },
}

export default function SwatchGeneratorPage() {
  return <SwatchGenerator />
}
