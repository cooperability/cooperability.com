import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getRandomQuote } from '../lib/quotes'
import styles from '../styles/utils.module.css'
import QuoteBox from './quote-box'

// The quote is re-rolled per request, which getServerSideProps used to give us
// for free. Without this the page prerenders and the quote freezes at build.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Cooper Reed | Full Stack Engineer | Co-Operability' },
  description:
    'Cooper Reed - 5+ years building web applications with React, Next.js, TypeScript. Full stack engineer who codes, writes, and interviews.',
  keywords: [
    'Cooper Reed',
    'full stack developer',
    'React developer',
    'Next.js',
    'TypeScript',
    'web development',
    'open source',
    'prompt engineering',
    'JavaScript',
    'Co-Operability',
  ],
  authors: [{ name: 'Cooper Reed' }],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Cooper Reed | Full Stack Developer | Co-Operability',
    description:
      '5+ years building web applications. Creator of open-source tools. Full stack developer who codes, writes, and interviews.',
    type: 'website',
    images: ['/images/profile.jpg'],
  },
  twitter: {
    card: 'summary',
    title: 'Cooper Reed | Full Stack Developer',
    description:
      '7+ years building web applications. Creator of open-source tools.',
  },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Cooper Reed',
  jobTitle: 'Full Stack Developer',
  // Must agree with `metadataBase` in the root layout, or the canonical link
  // and the structured data claim two different hosts.
  url: 'https://www.cooperability.com',
  image: 'https://www.cooperability.com/images/profile.jpg',
  sameAs: [
    'https://github.com/cooperability',
    'https://cooperability.substack.com/',
    'https://www.youtube.com/@cooperability',
  ],
  knowsAbout: [
    'JavaScript',
    'React',
    'Next.js',
    'TypeScript',
    'Web Development',
    'Prompt Engineering',
  ],
  description:
    'Full stack developer with 7+ years of experience building web applications and open-source tools',
}

export default function Home() {
  const initialQuote = getRandomQuote()

  return (
    <>
      {/* The Metadata API has no key for arbitrary JSON-LD; Next's documented
          approach is a script tag in the page body. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <h1 className="visually-hidden">
        Cooper Reed - Full Stack Engineer Portfolio | Co-Operability
      </h1>
      <section className={styles.headingMd}>
        <div className={styles.imageContainer}>
          <Image
            priority
            src="/images/profile.jpg"
            className={styles.borderCircle}
            height={150}
            width={150}
            alt="Cooper Reed - Full Stack Engineer"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCKG3uTpsCRFmaRjsYNgH1zVc2Wog4Nu2R15Fa2m/8AIOiHYR8e3LVs2yqbWEkAkopJI9qFHQTZ/9k="
          />
        </div>
        <p>
          Hi, I&apos;m <b>Cooper!</b> To me, <b>Co-Operability</b> means
          long-term synergy between my ambitions and morals. I&apos;ve spent 5
          years writing software with real-world impact. I open-source my{' '}
          <Link href="/demos">personal projects</Link> and{' '}
          <Link href="/resources">knowledge</Link>. My{' '}
          <a href="https://www.youtube.com/@cooperability">interviews</a> follow
          the same spirit.
        </p>

        <a href="/demos/prompt-composer" className={styles.promptComposerLink}>
          <div className={styles.promptComposerWrapper}>
            🧩 Prompt Composer →
          </div>
        </a>
        <a
          href="/demos/mandelbrot-explorer"
          className={styles.promptComposerLink}
        >
          <div className={styles.promptComposerWrapper}>
            ♾️ Mandelbrot Explorer →
          </div>
        </a>
        <a href="/demos/candlelight" className={styles.promptComposerLink}>
          <div className={styles.promptComposerWrapper}>🎮 Candlelight →</div>
        </a>

        <QuoteBox initialQuote={initialQuote} />
      </section>
    </>
  )
}
