import React, { useEffect, useState } from 'react';
import { Auth0Provider as Auth0ProviderBase, useAuth0 } from '@auth0/auth0-react';
import { LoginScreen } from '../components/ui/LoginScreen';

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
  // 使用当前域名作为 redirectUri，支持多域名
  const redirectUri = window.location.origin;

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
      <AuthGate>{children}</AuthGate>
    </Auth0ProviderBase>
  );
};

/**
 * Auth Gate Component - Handles authentication flow
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  // Show loading while Auth0 is initializing
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => loginWithRedirect()} />;
  }

  // Show main app if authenticated
  return <>{children}</>;
};