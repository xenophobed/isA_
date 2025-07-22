// React应用的Stripe Checkout Session创建API
// 这个文件模拟Next.js API路由的功能

export interface CheckoutSessionRequest {
  priceId: string;
  planType: string;
}

export interface CheckoutSessionResponse {
  url: string;
}

// 价格ID映射 - 使用营销网站的实际Stripe Price IDs
const PRICE_IDS = {
  'pro': 'price_1RbchvL7y127fTKemRuw8Elz',
  'enterprise': 'price_1RbciEL7y127fTKexyDAX9JA'
};

export const createCheckoutSession = async (
  request: CheckoutSessionRequest,
  accessToken: string
): Promise<CheckoutSessionResponse> => {
  try {
    console.log('🔄 Creating checkout session for:', request);
    
    // 获取用户信息从Auth0 token
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid access token format');
    }
    
    // 解码JWT payload (简单版本，生产环境应该用专业的JWT库)
    const payload = JSON.parse(atob(tokenParts[1]));
    console.log('👤 User from token:', { sub: payload.sub, email: payload.email });
    
    // 准备Stripe checkout session数据
    const checkoutData = {
      priceId: PRICE_IDS[request.planType as keyof typeof PRICE_IDS] || request.priceId,
      planType: request.planType,
      userEmail: payload.email,
      userId: payload.sub,
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/subscription/cancel`
    };
    
    console.log('💳 Checkout data prepared:', checkoutData);
    
    // 调用营销网站的API (如果可用) 或者直接调用Stripe
    // 这里我们先返回一个模拟的URL用于测试
    
    // 实际实现: 调用你的营销网站API
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(checkoutData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Checkout API error:', errorData);
      throw new Error(`Checkout API error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    console.log('✅ Checkout session created:', result);
    
    return { url: result.url };
    
  } catch (error) {
    console.error('❌ Error in createCheckoutSession:', error);
    throw error;
  }
};