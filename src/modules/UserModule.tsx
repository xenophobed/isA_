/**
 * ============================================================================
 * User Module (UserModule.tsx) - User Business Logic Orchestrator
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Orchestrate Auth0 authentication with external user management
 * - Bridge useAuth hook with useUserStore state management
 * - Handle user initialization and synchronization flows
 * - Provide clean business logic interfaces for UI components
 * - Manage user subscription and billing workflows
 * 
 * Architecture Integration:
 *  Auth Layer: useAuth (Auth0) � UserModule � useUserStore (External)
 *  Business Logic: Complex user flows handled here, not in UI
 *  Service Integration: Uses new userService class instead of deprecated functions
 *  State Coordination: Synchronizes Auth0 state with external user state
 * 
 * Separation of Concerns:
 *  Responsible for:
 *   - User authentication flow coordination
 *   - External user data synchronization
 *   - Subscription and billing business logic
 *   - User action orchestration
 *   - Error handling and recovery
 * 
 * L Not responsible for:
 *   - UI rendering (handled by UI components)
 *   - Direct API calls (handled by userService)
 *   - Raw state management (handled by useUserStore)
 *   - Auth0 token management (handled by useAuth)
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserStore } from '../stores/useUserStore';
import { UserService } from '../api/userService';
import { logger, LogCategory } from '../utils/logger';
import { PlanType, CreateExternalUserData, CreditConsumption } from '../types/userTypes';

// ================================================================================
// UserModule Interface
// ================================================================================

export interface UserModuleInterface {
  // Auth State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User Data
  auth0User: any;
  externalUser: any;
  subscription: any;
  
  // Credits & Billing
  credits: number;
  totalCredits: number;
  hasCredits: boolean;
  currentPlan: string;
  
  // Actions
  login: () => void;
  signup: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  consumeUserCredits: (consumption: CreditConsumption) => Promise<void>;
  createCheckout: (planType: PlanType) => Promise<string>;
  
  // Utils
  getAccessToken: () => Promise<string>;
  checkHealth: () => Promise<any>;
}

// ================================================================================
// Pricing Configuration
// ================================================================================

export const PRICING_PLANS = [
  {
    id: 'free' as PlanType,
    name: 'Free',
    price: 0,
    credits: 1000,
    features: ['1,000 AI credits/month', 'Basic AI models', 'Email support'],
    stripePriceId: ''
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro', 
    price: 29,
    credits: 10000,
    features: ['10,000 AI credits/month', 'Advanced AI models', 'Priority support', 'API access'],
    stripePriceId: 'price_1RbchvL7y127fTKemRuw8Elz',
    popular: true
  },
  {
    id: 'enterprise' as PlanType,
    name: 'Enterprise',
    price: 99,
    credits: 50000,
    features: ['50,000 AI credits/month', 'All AI models', 'Dedicated support', 'Custom training'],
    stripePriceId: 'price_1RbciEL7y127fTKexyDAX9JA'
  }
] as const;

// ================================================================================
// UserModule Context
// ================================================================================

const UserModuleContext = React.createContext<UserModuleInterface | null>(null);

// ================================================================================
// UserModule Provider Component
// ================================================================================

export const UserModule: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth0 Integration
  const {
    user: auth0User,
    isLoading: auth0Loading,
    error: auth0Error,
    isAuthenticated,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  // User Store Integration  
  const {
    externalUser,
    subscription,
    isLoading: userLoading,
    userError,
    creditsError,
    subscriptionError,
    setExternalUser,
    setSubscription,
    clearUserState
  } = useUserStore();

  // Computed user values
  const credits = externalUser?.credits || 0;
  const totalCredits = externalUser?.credits_total || 0;
  const hasCredits = credits > 0;
  const currentPlan = subscription?.plan_type || externalUser?.plan || 'free';

  // Create authenticated userService instance
  const userService = useMemo(() => {
    
    const getAuthHeaders = async () => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email read:users update:users create:users'
        }
      });
      logger.debug(LogCategory.USER_AUTH, 'Auth0 access token retrieved', { tokenLength: token?.length });
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    };
    
    return new UserService(undefined, getAuthHeaders);
  }, [isAuthenticated, getAccessTokenSilently]);

  // ================================================================================
  // Authentication Methods
  // ================================================================================

  const getAccessToken = useCallback(async (): Promise<string> => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email read:users update:users create:users'
        }
      });
    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'Failed to get access token', { error });
      
      // If token refresh fails, user needs to re-authenticate
      if (error instanceof Error && error.message.includes('Missing Refresh Token')) {
        logger.info(LogCategory.USER_AUTH, 'Refresh token missing, redirecting to login');
        loginWithRedirect();
        throw new Error('Authentication required');
      }
      
      throw error;
    }
  }, [getAccessTokenSilently, loginWithRedirect]);

  const login = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login'
      }
    });
  }, [loginWithRedirect]);

  const signup = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    clearUserState();
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }, [clearUserState, auth0Logout]);

  // ================================================================================
  // User Synchronization Logic
  // ================================================================================

  const initializeUser = useCallback(async () => {
    if (!auth0User?.sub || !auth0User?.email || !auth0User?.name || !isAuthenticated) {
      return;
    }

    try {
      logger.info(LogCategory.USER_AUTH, 'Starting user initialization', {
        auth0_id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name
      });

      const userData: CreateExternalUserData = {
        auth0_id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name
      };

      // Ensure external user exists and sync with store
      try {
        const userResult = await userService.ensureUserExists(userData);
        setExternalUser(userResult);
        logger.info(LogCategory.USER_AUTH, 'External user ensured successfully', { auth0_id: userResult.auth0_id });
      } catch (error) {
        logger.error(LogCategory.USER_AUTH, 'Failed to ensure user exists', { error });
        throw error;
      }

      // Since user data already contains plan info, we can skip subscription API for now
      // Only fetch detailed subscription when needed (e.g., for billing info)
      
      // For now, we'll rely on the plan info in the user data
      // TODO: Only fetch subscription details when accessing billing/upgrade features

    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'User initialization failed', { error });
    }
  }, [auth0User, isAuthenticated, getAccessToken]);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const currentUser = await userService.getCurrentUser();
      setExternalUser(currentUser);
      
      // User data already contains plan info, so we don't need to fetch subscription
      // unless we specifically need detailed billing information
      
    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'Failed to refresh user', { error });
      throw error;
    }
  }, [isAuthenticated, userService]);

  // ================================================================================
  // Business Logic Methods
  // ================================================================================

  const consumeUserCredits = useCallback(async (consumption: CreditConsumption) => {
    if (!externalUser?.auth0_id || !isAuthenticated) {
      throw new Error('User not authenticated or auth0_id missing');
    }

    try {
      await userService.consumeCredits(externalUser.auth0_id, consumption);
      // Update user state after consuming credits
      await refreshUser();
    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'Failed to consume credits', { error, consumption });
      throw error;
    }
  }, [externalUser?.auth0_id, isAuthenticated, userService, refreshUser]);

  const createCheckout = useCallback(async (planType: PlanType): Promise<string> => {
    if (!isAuthenticated || !externalUser?.auth0_id) {
      throw new Error('User not authenticated or auth0_id missing');
    }

    try {
      const plan = PRICING_PLANS.find(p => p.id === planType);
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }
      
      const result = await userService.createCheckoutSession(planType);
      
      return result.url || '';
    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'Failed to create checkout', { error, planType });
      throw error;
    }
  }, [isAuthenticated, externalUser?.auth0_id, userService]);

  const checkHealth = useCallback(async () => {
    try {
      return await userService.checkServiceHealth();
    } catch (error) {
      logger.error(LogCategory.USER_AUTH, 'Health check failed', { error });
      throw error;
    }
  }, [userService]);

  // ================================================================================
  // Effects
  // ================================================================================

  // Initialize user when Auth0 authentication completes
  useEffect(() => {
    if (!auth0Loading && isAuthenticated && auth0User) {
      initializeUser();
    } else if (!auth0Loading && !isAuthenticated) {
      clearUserState();
    }
  }, [auth0Loading, isAuthenticated, auth0User, initializeUser]);

  // ================================================================================
  // Computed Values
  // ================================================================================

  const moduleInterface: UserModuleInterface = useMemo(() => ({
    // Auth State
    isAuthenticated,
    isLoading: auth0Loading || userLoading,
    error: auth0Error?.message || userError || creditsError || subscriptionError,
    
    // User Data
    auth0User,
    externalUser,
    subscription,
    
    // Credits & Billing
    credits,
    totalCredits,
    hasCredits,
    currentPlan,
    
    // Actions
    login,
    signup,
    logout,
    refreshUser,
    consumeUserCredits,
    createCheckout,
    
    // Utils
    getAccessToken,
    checkHealth
  }), [
    isAuthenticated,
    auth0Loading,
    userLoading,
    auth0Error,
    userError,
    creditsError,
    subscriptionError,
    auth0User,
    externalUser,
    subscription,
    credits,
    totalCredits,
    hasCredits,
    currentPlan,
    login,
    signup,
    logout,
    refreshUser,
    consumeUserCredits,
    createCheckout,
    getAccessToken,
    checkHealth
  ]);

  return (
    <UserModuleContext.Provider value={moduleInterface}>
      {children}
    </UserModuleContext.Provider>
  );
};

// ================================================================================
// Hook for accessing UserModule
// ================================================================================

export const useUserModule = (): UserModuleInterface => {
  const context = React.useContext(UserModuleContext);
  if (!context) {
    throw new Error('useUserModule must be used within UserModule provider');
  }
  return context;
};

// ================================================================================
// Utilities
// ================================================================================

export const getPlanById = (planId: string) => {
  return PRICING_PLANS.find(plan => plan.id === planId) || PRICING_PLANS[0];
};

export const canUpgradeTo = (currentPlan: string, targetPlan: string): boolean => {
  const currentIndex = PRICING_PLANS.findIndex(p => p.id === currentPlan);
  const targetIndex = PRICING_PLANS.findIndex(p => p.id === targetPlan);
  return targetIndex > currentIndex;
};

export const formatCredits = (credits: number): string => {
  return credits.toLocaleString();
};

export default UserModule;