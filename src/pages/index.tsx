import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import styles from '../styles/utils.module.css'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { useState } from 'react'
import { ReactElement } from 'react'
import React from 'react'
import { quotes, getRandomQuote } from '../lib/quotes'
import { GetServerSideProps } from 'next'
import { Button } from '@/components/ui/button'

interface HomeProps {
  initialQuote: string
}

export default function Home({ initialQuote }: HomeProps) {
  const [quote, setQuote] = useState(initialQuote)

  return (
    <React.Fragment>
      <Head>
        <title>Cooper Reed | Full Stack Engineer | Co-Operability</title>
        <meta
          name="description"
          content="Cooper Reed - 5+ years building web applications with React, Next.js, TypeScript. Full stack engineer who codes, writes, and interviews."
        />
        <meta
          name="keywords"
          content="Cooper Reed, full stack developer, React developer, Next.js, TypeScript, web development, open source, prompt engineering, JavaScript, Co-Operability"
        />
        <meta name="author" content="Cooper Reed" />
        <meta
          property="og:title"
          content="Cooper Reed | Full Stack Developer | Co-Operability"
        />
        <meta
          property="og:description"
          content="5+ years building web applications. Creator of open-source tools. Full stack developer who codes, writes, and interviews."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/profile.jpg" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Cooper Reed | Full Stack Developer"
        />
        <meta
          name="twitter:description"
          content="7+ years building web applications. Creator of open-source tools."
        />
        <link rel="canonical" href="https://cooperability.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Cooper Reed',
              jobTitle: 'Full Stack Developer',
              url: 'https://cooperability.com',
              image: '/images/profile.jpg',
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
            }),
          }}
        />
      </Head>
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
          Hi, I&apos;m <b>Cooper!</b> To me, <b>Co-Operability</b> means
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
      </section>
    </React.Fragment>
  )
}

Home.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  return {
    props: {
      initialQuote: getRandomQuote(),
    },
  }
}
