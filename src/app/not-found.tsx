import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '../styles/utils.module.css'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <section className={styles.headingMd}>
      <h1 className={styles.headingXl}>404 — page not found</h1>
      <p>
        That URL doesn&apos;t exist. Try the <Link href="/">homepage</Link>,{' '}
        <Link href="/demos">demos</Link>, or{' '}
        <Link href="/resources">resources</Link>.
      </p>
    </section>
  )
}
