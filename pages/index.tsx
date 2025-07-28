import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import MarketingHome from './home';

interface IndexPageProps {
  isMarketingSite: boolean;
  hostname: string;
}

/**
 * Next.js pages directory index page
 * 根据域名决定显示营销页面还是重定向到应用页面
 */
const IndexPage: React.FC<IndexPageProps> = ({ isMarketingSite, hostname }) => {
  const router = useRouter();
  
  console.log(`🌐 Index page rendering for hostname: ${hostname}, isMarketingSite: ${isMarketingSite}`);
  
  useEffect(() => {
    // 如果不是营销站点，重定向到 /app 页面
    if (!isMarketingSite) {
      console.log('🔄 Redirecting to /app for main application');
      router.replace('/app');
      return;
    }
  }, [isMarketingSite, router]);
  
  // 营销页面直接返回
  if (isMarketingSite) {
    console.log('🏠 Rendering marketing home page');
    return <MarketingHome />;
  }
  
  // 非营销站点显示重定向中...
  return (
    <div className="h-screen flex items-center justify-center text-white bg-gray-900">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <div className="text-xl font-bold mb-2">Redirecting to Application...</div>
        <div className="text-gray-400">Loading main app...</div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<IndexPageProps> = async (context) => {
  const hostname = context.req.headers.host || '';
  const isMarketingSite = hostname === 'www.iapro.ai' || hostname.includes('www.');
  
  // 详细日志记录
  console.log(`🔍 Server-side detection:`, {
    hostname,
    allHeaders: context.req.headers,
    isMarketingSite,
    userAgent: context.req.headers['user-agent']
  });
  
  return {
    props: {
      isMarketingSite,
      hostname
    }
  };
};

export default IndexPage;