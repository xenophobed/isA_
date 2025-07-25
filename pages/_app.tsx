import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Auth0Provider } from '../src/providers/Auth0Provider'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isMarketingSite, setIsMarketingSite] = useState(false)

  useEffect(() => {
    // 检测是否为营销站点
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isMarketing = hostname === 'www.iapro.ai' || hostname.includes('www.')
      setIsMarketingSite(isMarketing)
      console.log(`🌍 _app.tsx: hostname=${hostname}, isMarketing=${isMarketing}`)
    }
  }, [])

  // 如果是营销站点，直接渲染，不使用 Auth0
  if (isMarketingSite || pageProps.isMarketingSite) {
    console.log('📄 Rendering without Auth0 for marketing site')
    return <Component {...pageProps} />
  }

  // 否则使用 Auth0 Provider
  console.log('🔐 Rendering with Auth0 for main app')
  return (
    <Auth0Provider>
      <Component {...pageProps} />
    </Auth0Provider>
  )
}