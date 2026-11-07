import type { Metadata } from 'next'
import SwatchGenerator from '@/src/components/swatch-generator/SwatchGenerator'

export const metadata: Metadata = {
  title: 'Personal Swatch Generator',
  description:
    'Personal color analysis from your eye, skin and hair colors. Get a palette, with optional seasonal analysis, and save it as a swatch card in JPG or PDF.',
  openGraph: {
    title: 'Personal Swatch Generator | Cooper Reed | Co-Operability',
  },
}

export default function SwatchGeneratorPage() {
  return <SwatchGenerator />
}
