import Head from 'next/head'
import styles from '../styles/utils.module.css'
import Providers from './providers'
import Header from '../sections/Header'
import Footer from '../sections/Footer'

export const siteTitle = 'Cooper Reed | Co-Operability'

export default function Layout({
  children,
  skipManifest = false,
}: {
  children: React.ReactNode
  skipManifest?: boolean
}) {
  return (
    <div className={styles.container}>
      <Header />
      <Providers>
        <Head>
          <html lang="en" />
          <title>Cooper Reed | Co-Operability</title>
          <link rel="icon" type="image/ico" href="/icon.ico" />
          {/* Manifest and PWA meta tags - can be overridden by pages with skipManifest prop */}
          {!skipManifest && (
            <>
              <link rel="manifest" href="/icons/site.webmanifest" />
              <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
              <meta name="theme-color" content="#ffffff" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta
                name="apple-mobile-web-app-status-bar-style"
                content="default"
              />
              <meta
                name="apple-mobile-web-app-title"
                content="Co-Operability"
              />
            </>
          )}
          <meta name="og:title" content={siteTitle} />
          <meta name="description" content="Cooper's portfolio website" />
        </Head>
        <main>{children}</main>
      </Providers>
      <Footer />
    </div>
  )
}
