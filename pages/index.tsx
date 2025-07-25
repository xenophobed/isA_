import React from 'react';
import { useEffect } from 'react';
import { MainApp } from '../src/app';
import MarketingHome from './home';

/**
 * Next.js pages directory index page
 * 根据域名决定显示主应用还是营销页面
 */
const IndexPage: React.FC = () => {
  
  useEffect(() => {
    // 检测域名，如果是 www.iapro.ai 显示营销页面，否则显示主应用
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'www.iapro.ai') {
        // 营销页面域名，显示 home 内容
        return;
      } else if (hostname === 'agent.iapro.ai') {
        // 主应用域名，显示 app 内容
        return;
      }
    }
  }, []);

  // 根据域名返回对应组件
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'www.iapro.ai') {
      return <MarketingHome />;
    }
  }
  
  // 默认显示主应用（开发环境或 agent.iapro.ai）
  return <MainApp />;
};

export default IndexPage;