import React from 'react';
import { GetServerSideProps } from 'next';
import { MainApp } from '../src/app';
import MarketingHome from './home';

interface IndexPageProps {
  isMarketingSite: boolean;
  hostname: string;
}

/**
 * Next.js pages directory index page
 * 根据域名决定显示主应用还是营销页面
 */
const IndexPage: React.FC<IndexPageProps> = ({ isMarketingSite, hostname }) => {
  console.log(`🌐 Rendering for hostname: ${hostname}, isMarketingSite: ${isMarketingSite}`);
  
  // 营销页面直接返回，不经过 Auth0
  if (isMarketingSite) {
    return <MarketingHome />;
  }
  
  // 主应用经过完整的 Provider 链
  return <MainApp />;
};

export const getServerSideProps: GetServerSideProps<IndexPageProps> = async (context) => {
  const hostname = context.req.headers.host || '';
  const isMarketingSite = hostname === 'www.iapro.ai';
  
  console.log(`🔍 Server-side detection: hostname=${hostname}, isMarketingSite=${isMarketingSite}`);
  
  return {
    props: {
      isMarketingSite,
      hostname
    }
  };
};

export default IndexPage;