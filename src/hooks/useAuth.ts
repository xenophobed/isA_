import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect, useCallback } from 'react';
import { 
  ensureExternalUserExists, 
  getCurrentExternalUser, 
  ExternalUser,
  checkExternalServiceHealth 
} from '../services/userService';
import { logger, LogCategory } from '../utils/logger';

export const useAuth = () => {
  const { 
    user: auth0User, 
    isLoading: auth0Loading, 
    error: auth0Error, 
    isAuthenticated,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  } = useAuth0();
  
  const [externalUser, setExternalUser] = useState<ExternalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const accessToken = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email read:users update:users create:users'
        }
      });

      if (!accessToken) {
        throw new Error('No access token received');
      }

      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }, [getAccessTokenSilently]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email read:users update:users create:users'
        }
      });
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }, [getAccessTokenSilently]);

  const initializeUser = useCallback(async () => {
    if (!auth0User?.email || !auth0User?.name) {
      setError('Auth0 user data incomplete');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Starting user initialization...', { 
        email: auth0User.email,
        name: auth0User.name 
      });

      const accessToken = await getAccessToken();
      console.log('🎟️ Got access token:', accessToken ? 'Token received' : 'No token');

      logger.info(LogCategory.AUTH, 'Initializing external user', { 
        email: auth0User.email,
        name: auth0User.name,
        hasToken: !!accessToken
      });

      // 测试API连接
      console.log('🌐 Testing API connection to:', process.env.REACT_APP_EXTERNAL_API_BASE_URL);

      // 确保用户存在
      const externalUser = await ensureExternalUserExists({
        email: auth0User.email,
        name: auth0User.name
      }, accessToken);

      console.log('✅ User initialized successfully:', externalUser);
      setExternalUser(externalUser);
      logger.info(LogCategory.AUTH, 'User initialized successfully', { 
        userId: externalUser.user_id,
        credits: externalUser.credits,
        plan: externalUser.plan
      });
    } catch (err: any) {
      console.error('❌ Failed to initialize user:', err);
      console.error('❌ Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setError(err.message || 'Failed to initialize user');
      logger.error(LogCategory.AUTH, 'User initialization failed', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [auth0User, getAccessToken]);

  const refreshUser = useCallback(async () => {
    if (!auth0User) return;

    try {
      const accessToken = await getAccessToken();
      const updatedUser = await getCurrentExternalUser(accessToken);
      setExternalUser(updatedUser);
      logger.info(LogCategory.AUTH, 'User refreshed', { 
        userId: updatedUser.user_id,
        credits: updatedUser.credits 
      });
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      setError(err.message || 'Failed to refresh user');
    }
  }, [auth0User, getAccessToken]);

  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      if (response.status === 401) {
        // Token过期，重新登录
        await loginWithRedirect();
        return;
      }

      return response;
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }, [getAuthHeaders, loginWithRedirect]);

  useEffect(() => {
    if (!auth0Loading && isAuthenticated && auth0User) {
      initializeUser();
    } else if (!auth0Loading && !isAuthenticated) {
      setIsLoading(false);
      setExternalUser(null);
    }
  }, [auth0Loading, isAuthenticated, auth0User, initializeUser]);

  // 健康检查函数
  const checkHealth = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      return await checkExternalServiceHealth(accessToken);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }, [getAccessToken]);

  // 登录函数
  const login = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login'
      }
    });
  }, [loginWithRedirect]);

  // 注册函数
  const signup = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  }, [loginWithRedirect]);

  // 登出函数
  const handleLogout = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    setExternalUser(null);
  }, [logout]);

  return {
    // Auth0 数据
    auth0User,
    auth0Loading,
    auth0Error,
    isAuthenticated,

    // 外部用户数据
    externalUser,
    user: externalUser, // 别名，保持向后兼容
    isLoading,
    error,

    // 方法
    getAuthHeaders,
    getAccessToken,
    getAccessTokenSilently: getAccessToken, // 别名，为了兼容
    makeAuthenticatedRequest,
    refreshUser,
    initializeUser,
    checkHealth,
    
    // 登录登出
    login,
    signup,
    logout: handleLogout,

    // 便捷属性
    creditsRemaining: externalUser?.credits || 0,
    currentPlan: externalUser?.plan || 'free',
    hasCredits: (externalUser?.credits || 0) > 0,
    isPremium: externalUser?.plan !== 'free',
  };
};