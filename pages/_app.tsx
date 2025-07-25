import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Auth0Provider } from '../src/providers/Auth0Provider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Auth0Provider>
      <Component {...pageProps} />
    </Auth0Provider>
  )
}