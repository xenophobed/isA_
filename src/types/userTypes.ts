/**
 * ============================================================================
 * User Types (userTypes.ts) - User-related type definitions
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Define user data structures
 * - Define subscription and billing types
 * - Define user operation interfaces
 * - Define user service callback types
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - ExternalUser user data interface
 *   - Subscription and billing related types
 *   - User operation callback types
 *   - API request/response types
 * 
 * ❌ Not responsible for:
 *   - Chat related types (handled by chatTypes.ts)
 *   - App artifact types (handled by appTypes.ts)
 *   - Widget types (handled by widgetTypes.ts)
 */

import { User } from '@auth0/auth0-react';

// ================================================================================
// Basic User Data Types
// ================================================================================

export interface CreateExternalUserData {
  auth0_id: string;
  email: string;
  name: string;
}

export interface ExternalUser {
  auth0_id: string;
  email: string;
  name: string;
  credits: number;
  credits_total: number;
  plan: string;
  is_active: boolean;
}

// ================================================================================
// Subscription and Billing Types
// ================================================================================

export interface ExternalSubscription {
  id: number;
  auth0_id: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'incomplete' | 'past_due';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalUsageRecord {
  id: number;
  auth0_id: string;
  endpoint: string;
  tokens_used: number;
  request_data?: any;
  response_data?: any;
  created_at: string;
}

// ================================================================================
// User Operation Types
// ================================================================================

export interface CreditConsumption {
  amount: number;
  reason: string;
}

export interface CreditConsumptionResult {
  success: boolean;
  remaining_credits: number;
}

export interface CheckoutSession {
  url: string;
}

export interface CheckoutParams {
  plan_type: string;
  success_url: string;
  cancel_url: string;
}

export interface HealthCheckResult {
  status: string;
  timestamp: string;
}

// ================================================================================
// User Service Callback Types
// ================================================================================

export interface UserServiceCallbacks {
  onUserUpdated?: (user: ExternalUser) => void;
  onCreditsChanged?: (credits: number) => void;
  onSubscriptionChanged?: (subscription: ExternalSubscription | null) => void;
  onError?: (error: Error) => void;
}

// ================================================================================
// User State Types
// ================================================================================

export type UserLoadingState = 'idle' | 'loading' | 'success' | 'error';

export type PlanType = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'past_due';

// Auth state that combines Auth0 and external user data
export interface UserAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | undefined;
  externalUser: ExternalUser | null;
  subscription: ExternalSubscription | null;
  error: string | null;
}

// ================================================================================
// User Management UI Types
// ================================================================================

export interface UserManagementState {
  activeTab: 'profile' | 'subscription' | 'usage' | 'settings';
  isEditing: boolean;
  isSaving: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    dataCollection: boolean;
  };
}

export interface UserDashboardData {
  user: ExternalUser;
  subscription: ExternalSubscription | null;
  usage: {
    thisMonth: number;
    lastMonth: number;
    totalCredits: number;
    remainingCredits: number;
  };
  recentActivity: ExternalUsageRecord[];
}

// ================================================================================
// User Action Parameters
// ================================================================================

export interface UserActionParams {
  auth0_id?: string;
  accessToken: string;
}

export interface SubscriptionParams extends UserActionParams {
  planType: string;
}

// ================================================================================
// User Action Enums
// ================================================================================

export enum UserAction {
  FETCH_USER = 'FETCH_USER',
  UPDATE_USER = 'UPDATE_USER',
  CONSUME_CREDITS = 'CONSUME_CREDITS',
  FETCH_SUBSCRIPTION = 'FETCH_SUBSCRIPTION',
  CREATE_CHECKOUT = 'CREATE_CHECKOUT',
  HEALTH_CHECK = 'HEALTH_CHECK'
}