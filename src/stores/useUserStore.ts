/**
 * ============================================================================
 * User Store (useUserStore.ts) - User State Management
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Centralized user state management with Zustand
 * - External user data storage and synchronization
 * - Subscription and billing state management
 * - Credits tracking and consumption state
 * - Error state management for user operations
 * 
 * Architecture Integration:
 * - Used by useUser hook for state bridge
 * - Integrated with UserModule for business logic
 * - Connected to userService for API operations
 * - Clean separation from authentication (handled by useAuth)
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - User data state storage and mutations
 *   - Subscription state management
 *   - Credits state tracking
 *   - Loading and error states
 *   - State persistence and hydration
 * 
 * ❌ Not responsible for:
 *   - API calls (handled by userService)
 *   - Business logic (handled by UserModule)
 *   - UI rendering (handled by components)
 *   - Authentication (handled by useAuth)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  ExternalUser, 
  ExternalSubscription,
  CreditConsumption 
} from '../types/userTypes';
import { logger, LogCategory } from '../utils/logger';

// ================================================================================
// Store State Interface
// ================================================================================

export interface UserStore {
  // User Data
  externalUser: ExternalUser | null;
  subscription: ExternalSubscription | null;
  
  // Loading States
  isLoading: boolean;
  
  // Error States
  userError: string | null;
  creditsError: string | null;
  subscriptionError: string | null;
  
  // Actions - User Management
  setExternalUser: (user: ExternalUser | null) => void;
  setSubscription: (subscription: ExternalSubscription | null) => void;
  clearUserState: () => void;
  
  // Actions - Loading States
  setLoading: (loading: boolean) => void;
  
  // Actions - Error Management
  setUserError: (error: string | null) => void;
  setCreditsError: (error: string | null) => void;
  setSubscriptionError: (error: string | null) => void;
  clearErrors: () => void;
  
  // Actions - Credits Management
  updateCredits: (credits: number) => void;
  consumeCreditsOptimistic: (consumption: CreditConsumption) => void;
  revertCreditsOptimistic: () => void;
}

// ================================================================================
// Initial State
// ================================================================================

const initialState = {
  // User Data
  externalUser: null,
  subscription: null,
  
  // Loading States
  isLoading: false,
  
  // Error States
  userError: null,
  creditsError: null,
  subscriptionError: null,
};

// ================================================================================
// Store Implementation
// ================================================================================

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // ================================================================================
    // User Management Actions
    // ================================================================================
    
    setExternalUser: (user: ExternalUser | null) => {
      logger.info(LogCategory.USER_AUTH, 'Setting external user', { 
        auth0_id: user?.auth0_id,
        email: user?.email,
        credits: user?.credits 
      });
      
      set({ 
        externalUser: user,
        userError: null // Clear error on successful user set
      });
    },
    
    setSubscription: (subscription: ExternalSubscription | null) => {
      logger.info(LogCategory.USER_AUTH, 'Setting user subscription', { 
        subscriptionId: subscription?.id,
        planType: subscription?.plan_type,
        status: subscription?.status 
      });
      
      set({ 
        subscription,
        subscriptionError: null // Clear error on successful subscription set
      });
    },
    
    clearUserState: () => {
      logger.info(LogCategory.USER_AUTH, 'Clearing all user state');
      set(initialState);
    },
    
    // ================================================================================
    // Loading State Actions
    // ================================================================================
    
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
    
    // ================================================================================
    // Error Management Actions
    // ================================================================================
    
    setUserError: (error: string | null) => {
      if (error) {
        logger.error(LogCategory.USER_AUTH, 'User error set', { error });
      }
      set({ userError: error });
    },
    
    setCreditsError: (error: string | null) => {
      if (error) {
        logger.error(LogCategory.USER_AUTH, 'Credits error set', { error });
      }
      set({ creditsError: error });
    },
    
    setSubscriptionError: (error: string | null) => {
      if (error) {
        logger.error(LogCategory.USER_AUTH, 'Subscription error set', { error });
      }
      set({ subscriptionError: error });
    },
    
    clearErrors: () => {
      logger.info(LogCategory.USER_AUTH, 'Clearing all user errors');
      set({ 
        userError: null,
        creditsError: null,
        subscriptionError: null 
      });
    },
    
    // ================================================================================
    // Credits Management Actions
    // ================================================================================
    
    updateCredits: (credits: number) => {
      const currentUser = get().externalUser;
      if (currentUser) {
        console.log('💳 USER_STORE: Updating credits', { 
          auth0_id: currentUser.auth0_id,
          oldCredits: currentUser.credits,
          newCredits: credits,
          difference: currentUser.credits - credits
        });
        
        logger.info(LogCategory.USER_AUTH, 'Updating user credits', { 
          auth0_id: currentUser.auth0_id,
          oldCredits: currentUser.credits,
          newCredits: credits 
        });
        
        set({ 
          externalUser: { 
            ...currentUser, 
            credits 
          },
          creditsError: null // Clear error on successful update
        });
      }
    },
    
    consumeCreditsOptimistic: (consumption: CreditConsumption) => {
      const currentUser = get().externalUser;
      if (currentUser) {
        const newCredits = Math.max(0, currentUser.credits - consumption.amount);
        
        logger.info(LogCategory.USER_AUTH, 'Optimistic credits consumption', { 
          auth0_id: currentUser.auth0_id,
          consumption: consumption.amount,
          reason: consumption.reason,
          oldCredits: currentUser.credits,
          newCredits 
        });
        
        set({ 
          externalUser: { 
            ...currentUser, 
            credits: newCredits 
          }
        });
      }
    },
    
    revertCreditsOptimistic: () => {
      // This would need to store original credits value
      // For now, just log the revert attempt
      logger.warn(LogCategory.USER_AUTH, 'Credits optimistic revert requested - implement if needed');
    },
  }))
);

// ================================================================================
// Store Selectors (Optional convenience selectors)
// ================================================================================

// User selectors
export const selectExternalUser = (state: UserStore) => state.externalUser;
export const selectSubscription = (state: UserStore) => state.subscription;
export const selectIsLoading = (state: UserStore) => state.isLoading;

// Credits selectors
export const selectCredits = (state: UserStore) => state.externalUser?.credits || 0;
export const selectTotalCredits = (state: UserStore) => state.externalUser?.credits_total || 0;
export const selectHasCredits = (state: UserStore) => (state.externalUser?.credits || 0) > 0;
export const selectCurrentPlan = (state: UserStore) => state.externalUser?.plan || 'free';

// Error selectors
export const selectUserError = (state: UserStore) => state.userError;
export const selectCreditsError = (state: UserStore) => state.creditsError;
export const selectSubscriptionError = (state: UserStore) => state.subscriptionError;
export const selectHasErrors = (state: UserStore) => 
  !!(state.userError || state.creditsError || state.subscriptionError);

// ================================================================================
// Store Event Subscriptions (Optional)
// ================================================================================

// Subscribe to user changes for logging
useUserStore.subscribe(
  (state) => state.externalUser,
  (user, previousUser) => {
    if (user && !previousUser) {
      logger.info(LogCategory.USER_AUTH, 'User logged in', { auth0_id: user.auth0_id });
    } else if (!user && previousUser) {
      logger.info(LogCategory.USER_AUTH, 'User logged out', { auth0_id: previousUser.auth0_id });
    } else if (user && previousUser && user.credits !== previousUser.credits) {
      logger.info(LogCategory.USER_AUTH, 'User credits changed', { 
        auth0_id: user.auth0_id,
        oldCredits: previousUser.credits,
        newCredits: user.credits,
        change: user.credits - previousUser.credits
      });
    }
  }
);

export default useUserStore;