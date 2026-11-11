import type { Metadata } from 'next'
import PersonalPalette from '@/src/components/personal-palette/PersonalPalette'

export const metadata: Metadata = {
  title: 'Personal Palette',
  description:
    'Personal color analysis from your eye, skin and hair colors. Get a palette, with optional seasonal analysis, and save it as a swatch card in JPG or PDF.',
  openGraph: {
    title: 'Personal Palette | Cooper Reed | Co-Operability',
  },
}

export default function PersonalPalettePage() {
  return <PersonalPalette />
}
