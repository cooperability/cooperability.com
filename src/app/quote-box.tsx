'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { quotes } from '../lib/quotes'
import styles from '../styles/utils.module.css'

export default function QuoteBox({ initialQuote }: { initialQuote: string }) {
  const [quote, setQuote] = useState(initialQuote)

  return (
    <div className="rounded-lg border border-current p-4 space-y-3">
      <div className={styles.socialIconRow}>
        <b>This spoke to me:</b>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const availableQuotes = quotes.filter((q) => q !== quote)
            setQuote(
              availableQuotes[
                Math.floor(Math.random() * availableQuotes.length)
              ]
            )
          }}
          aria-label="Get new random quote"
        >
          <ArrowPathIcon />
        </Button>
      </div>
      <span suppressHydrationWarning>{quote}</span>
    </div>
  )
}
