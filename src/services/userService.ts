// 与 Python User Service 交互的核心API服务
import { User } from '@auth0/auth0-react';

// 用户数据类型定义
export interface CreateExternalUserData {
  email: string;
  name: string;
}

export interface ExternalUser {
  user_id: string;
  email: string;
  name: string;
  credits: number;
  credits_total: number;
  plan: string;
  is_active: boolean;
  auth0_id: string;
}

export interface ExternalSubscription {
  id: number;
  user_id: number;
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
  user_id: number;
  endpoint: string;
  tokens_used: number;
  request_data?: any;
  response_data?: any;
  created_at: string;
}

// API 调用的基础 URL
const BASE_URL = process.env.REACT_APP_EXTERNAL_API_BASE_URL || 'http://localhost:8100';

// 1. 确保用户存在
export const ensureExternalUserExists = async (
  userData: CreateExternalUserData,
  accessToken: string
): Promise<ExternalUser> => {
  try {
    const url = `${BASE_URL}/api/v1/users/ensure`;
    console.log('🌐 Making API request to:', url);
    console.log('📝 Request payload:', userData);
    console.log('🎟️ Using token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'No token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API Success:', result);
    
    return {
      user_id: result.user_id,
      email: result.email,
      name: result.name,
      credits: result.credits,
      credits_total: result.credits_total,
      plan: result.plan,
      is_active: result.is_active,
      auth0_id: result.auth0_id
    };
  } catch (error) {
    console.error('❌ Error ensuring external user exists:', error);
    throw error;
  }
};

// 2. 获取当前用户信息
export const getCurrentExternalUser = async (
  accessToken: string
): Promise<ExternalUser> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current external user:', error);
    throw error;
  }
};

// 3. 消费积分
export const consumeCredits = async (
  userId: string,
  amount: number,
  reason: string,
  accessToken: string
): Promise<{ success: boolean; remaining_credits: number }> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/users/${userId}/credits/consume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, reason })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error consuming credits:', error);
    throw error;
  }
};

// 4. 获取用户订阅信息
export const getUserExternalSubscription = async (
  userId: string,
  accessToken: string
): Promise<ExternalSubscription | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/users/${userId}/subscription`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return null; // 用户没有订阅
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
};

// 5. 创建 Stripe Checkout 会话
export const createExternalCheckoutSession = async (
  planType: string,
  accessToken: string
): Promise<{ url: string }> => {
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      plan_type: planType,
      success_url: `${window.location.origin}/subscription/success`,
      cancel_url: `${window.location.origin}/subscription/cancel`,
    });
    
    const response = await fetch(`${BASE_URL}/api/v1/payments/create-checkout?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// 6. 健康检查
export const checkExternalServiceHealth = async (
  accessToken?: string
): Promise<{ status: string; timestamp: string }> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('External service health check failed:', error);
    throw error;
  }
};