import React, { useEffect, useState } from 'react';
import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';

interface Auth0ProviderProps {
  children: React.ReactNode;
}

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  
  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 服务端渲染时显示加载状态
  if (!isClient) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE;
  const redirectUri = process.env.REACT_APP_BASE_URL || window.location.origin;

  if (!domain || !clientId) {
    console.error('Auth0 configuration missing:', { domain, clientId, audience });
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center text-red-400">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>Auth0 settings are missing. Please check environment variables.</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Domain: {domain || 'Missing'}</p>
            <p>Client ID: {clientId ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email read:users update:users create:users'
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderBase>
  );
};