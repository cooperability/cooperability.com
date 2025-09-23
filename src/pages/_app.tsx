import '../styles/global.css'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import type { NextPage } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <ThemeProvider enableSystem={true} attribute="class">
      {getLayout(<Component {...pageProps} />)}
      <Analytics />
      <SpeedInsights />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "if ('serviceWorker' in navigator && window.location.protocol === 'https:') { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }); }",
        }}
      />
    </ThemeProvider>
  )
}
