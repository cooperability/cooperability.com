'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import styles from '../styles/utils.module.css'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // There is no error-tracking service wired up yet, so the console is the
  // only place a production failure leaves a trace.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className={styles.headingMd}>
      <h1 className={styles.headingXl}>Something went wrong</h1>
      <p>
        This page failed to render. Retrying re-runs it without a full reload.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </section>
  )
}
