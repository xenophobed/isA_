import React from 'react';
import { MainAppContainer } from '../src/app';

/**
 * 主应用页面 - /app 路由
 * 这是主应用的专用页面，包含完整的 Provider 链和业务逻辑
 */
const AppPage: React.FC = () => {
  console.log('📱 AppPage: Rendering main application page at /app');
  
  return <MainAppContainer />;
};

export default AppPage;