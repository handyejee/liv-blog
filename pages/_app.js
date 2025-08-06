import '@/css/tailwind.css'
import '@/css/prism.css'
import 'katex/dist/katex.css'

import '@fontsource/inter/variable-full.css'

import { ThemeProvider } from 'next-themes'
import Head from 'next/head'

import siteMetadata from '@/data/siteMetadata'
import Analytics from '@/components/analytics'
import LayoutWrapper from '@/components/LayoutWrapper'
import { ClientReload } from '@/components/ClientReload'

const isDevelopment = process.env.NODE_ENV === 'development'
const isSocket = process.env.SOCKET

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute='class' defaultTheme={siteMetadata.theme}>
      <Head>
        <link rel='icon' href='/static/favicons/favicon.ico' />
        <link rel='apple-touch-icon' sizes='76x76' href='/static/favicons/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/static/favicons/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/static/favicons/favicon-16x16.png' />
        <link rel='manifest' href='/static/favicons/site.webmanifest' />
        <link rel='mask-icon' href='/static/favicons/safari-pinned-tab.svg' color='#5bbad5' />

        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      {isDevelopment && isSocket && <ClientReload />}
      <Analytics />
      <LayoutWrapper>
        <Component {...pageProps} />
      </LayoutWrapper>
    </ThemeProvider>
  )
}
