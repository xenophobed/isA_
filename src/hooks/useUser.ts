/**
 * ============================================================================
 * User Hook (useUser.ts) - User State Management Hook
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Bridge between business logic and user state store
 * - Provide clean interface for user data operations
 * - Handle user state changes and side effects
 * - Abstract store implementation details from business logic
 * 
 * Architecture Integration:
 * - Modules -> useUser -> useUserStore (State)
 * - Components -> useUser -> useUserStore (State)
 * - Clean separation: Business logic doesn't know about store internals
 * - Hook handles all state synchronization and side effects
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - User state access and mutations
 *   - External API integration via userService
 *   - State synchronization and validation
 *   - Error handling and recovery
 *   - Business logic abstractions
 * 
 * ❌ Not responsible for:
 *   - UI rendering (handled by components)
 *   - Raw state storage (handled by useUserStore)
 *   - HTTP transport (handled by userService)
 *   - Authentication logic (handled by useAuth)
 */

import { useCallback } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { userService } from '../api/userService';
import { logger, LogCategory } from '../utils/logger';
import { 
  ExternalUser, 
  CreateExternalUserData, 
  CreditConsumption,
  PlanType,
  ExternalSubscription 
} from '../types/userTypes';

// ================================================================================
// Hook Interface
// ================================================================================

export interface UseUserReturn {
  // User State
  externalUser: ExternalUser | null;
  subscription: ExternalSubscription | null;
  isLoading: boolean;
  userError: string | null;
  creditsError: string | null;
  subscriptionError: string | null;
  
  // Computed Values
  credits: number;
  totalCredits: number;
  hasCredits: boolean;
  currentPlan: string;
  usagePercentage: number;
  
  // User Actions
  ensureUser: (userData: CreateExternalUserData, accessToken: string) => Promise<void>;
  fetchCurrentUser: (accessToken: string) => Promise<void>;
  clearUser: () => void;
  
  // Credits Actions
  consumeCredits: (auth0_id: string, consumption: CreditConsumption, accessToken: string) => Promise<void>;
  
  // Subscription Actions
  fetchSubscription: (auth0_id: string, accessToken: string) => Promise<void>;
  createCheckout: (planType: PlanType, accessToken: string) => Promise<string>;
}

// ================================================================================
// Main Hook Implementation
// ================================================================================

export const useUser = (): UseUserReturn => {
  // Store state access
  const {
    externalUser,
    subscription,
    isLoading,
    userError,
    creditsError,  
    subscriptionError,
    setExternalUser,
    setSubscription,
    setLoading,
    setUserError,
    setCreditsError,
    setSubscriptionError,
    clearUserState
  } = useUserStore();

  // ================================================================================
  // Computed Values
  // ================================================================================

  const credits = externalUser?.credits || 0;
  const totalCredits = externalUser?.credits_total || 0;
  const hasCredits = credits > 0;
  const currentPlan = externalUser?.plan || 'free';
  const usagePercentage = totalCredits > 0 ? Math.round(((totalCredits - credits) / totalCredits) * 100) : 0;

  // ================================================================================
  // User Management Actions
  // ================================================================================

  const ensureUser = useCallback(async (userData: CreateExternalUserData, accessToken: string) => {
    try {
      setLoading(true);
      setUserError(null);
      
      logger.info(LogCategory.USER_AUTH, 'Ensuring external user exists', { email: userData.email });
      
      // TODO: This function is deprecated, UserModule now handles user initialization
      throw new Error('This function is deprecated, UserModule handles user initialization automatically');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to ensure user';
      logger.error(LogCategory.USER_AUTH, 'Failed to ensure user', { error });
      setUserError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUserError, setExternalUser]);

  const fetchCurrentUser = useCallback(async (accessToken: string) => {
    try {
      setLoading(true);
      setUserError(null);
      
      logger.info(LogCategory.USER_AUTH, 'Fetching current user');
      
      // TODO: Use authenticated userService from UserModule
      const user = await userService.getCurrentUser();
      
      if (user) {
        setExternalUser(user);
        logger.info(LogCategory.USER_AUTH, 'Current user fetched successfully', { auth0_id: user.auth0_id });
      } else {
        logger.warn(LogCategory.USER_AUTH, 'No current user found');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      logger.error(LogCategory.USER_AUTH, 'Failed to fetch current user', { error });
      setUserError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUserError, setExternalUser]);

  const clearUser = useCallback(() => {
    logger.info(LogCategory.USER_AUTH, 'Clearing user state');
    clearUserState();
  }, [clearUserState]);

  // ================================================================================
  // Credits Management Actions
  // ================================================================================

  const consumeCredits = useCallback(async (auth0_id: string, consumption: CreditConsumption, accessToken: string) => {
    try {
      setCreditsError(null);
      
      logger.info(LogCategory.USER_AUTH, 'Consuming user credits', { auth0_id, amount: consumption.amount });
      
      // TODO: Use authenticated userService from UserModule
      const consumptionResult = await userService.consumeCredits(auth0_id, consumption);
      
      // Update user with remaining credits from result
      if (externalUser) {
        const updatedExternalUser = { ...externalUser, credits: consumptionResult.remaining_credits };
        setExternalUser(updatedExternalUser);
        logger.info(LogCategory.USER_AUTH, 'Credits consumed successfully', { 
          auth0_id, 
          remainingCredits: consumptionResult.remaining_credits 
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to consume credits';
      logger.error(LogCategory.USER_AUTH, 'Failed to consume credits', { error, auth0_id });
      setCreditsError(errorMessage);
      throw error;
    }
  }, [setCreditsError, setExternalUser]);

  // ================================================================================
  // Subscription Management Actions
  // ================================================================================

  const fetchSubscription = useCallback(async (auth0_id: string, accessToken: string) => {
    try {
      setSubscriptionError(null);
      
      logger.info(LogCategory.USER_AUTH, 'Fetching user subscription', { auth0_id });
      
      // TODO: Use authenticated userService from UserModule
      const subscription = await userService.getUserSubscription(auth0_id);
      
      setSubscription(subscription);
      logger.info(LogCategory.USER_AUTH, 'Subscription fetched successfully', { 
        auth0_id, 
        plan: subscription?.plan_type 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription';
      logger.error(LogCategory.USER_AUTH, 'Failed to fetch subscription', { error, auth0_id });
      setSubscriptionError(errorMessage);
      // Don't throw - subscription is optional
    }
  }, [setSubscriptionError, setSubscription]);

  const createCheckout = useCallback(async (planType: PlanType, accessToken: string): Promise<string> => {
    try {
      setSubscriptionError(null);
      
      logger.info(LogCategory.USER_AUTH, 'Creating checkout session', { planType });
      
      // TODO: Use authenticated userService from UserModule
      const checkoutSession = await userService.createCheckoutSession(planType);
      
      logger.info(LogCategory.USER_AUTH, 'Checkout session created successfully', { planType });
      return checkoutSession.url;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout';
      logger.error(LogCategory.USER_AUTH, 'Failed to create checkout', { error, planType });
      setSubscriptionError(errorMessage);
      throw error;
    }
  }, [setSubscriptionError]);

  // ================================================================================
  // Return Hook Interface
  // ================================================================================

  return {
    // User State
    externalUser,
    subscription,
    isLoading,
    userError,
    creditsError,
    subscriptionError,
    
    // Computed Values
    credits,
    totalCredits,
    hasCredits,
    currentPlan,
    usagePercentage,
    
    // User Actions
    ensureUser,
    fetchCurrentUser,
    clearUser,
    
    // Credits Actions
    consumeCredits,
    
    // Subscription Actions
    fetchSubscription,
    createCheckout
  };
};