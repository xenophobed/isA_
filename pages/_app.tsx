import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { AnalyticsProvider } from '../src/providers/AnalyticsProvider'

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

  // 移除重复的 Auth0Provider 包装
  // Auth0Provider 现在只在 src/app.tsx 中使用，避免双重包装
  // Rendering with AnalyticsProvider
  
  return (
    <AnalyticsProvider>
      <Component {...pageProps} />
    </AnalyticsProvider>
  )
}