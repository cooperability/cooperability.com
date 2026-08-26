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
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>
        <p>
          Hi, I&apos;m <b>Cooper!</b> To me, <b>Co-Operability</b>&nbsp; means
          long-term synergy between my ambitions and morals. I&apos;ve spent 5
          years writing software with real-world impact. I open-source my{' '}
          <Link href="/demos">tools</Link> and{' '}
          <Link href="/resources">knowledge</Link>. My{' '}
          <a href="https://www.youtube.com/@cooperability">interviews</a> follow
          the same spirit.
        </p>

        <Link
          href="/demos/prompt-composer"
          className={styles.promptComposerLink}
        >
          <div className={styles.promptComposerWrapper}>
            Try 🧩 Prompt Composer →
          </div>
        </Link>
        <Link
          href="/demos/mandelbrot-explorer"
          className={styles.promptComposerLink}
        >
          <div className={styles.promptComposerWrapper}>
            Try ♾️ Mandelbrot Explorer →
          </div>
        </Link>

        <QuoteBox initialQuote={initialQuote} />
      </section>
    </>
  )
}
