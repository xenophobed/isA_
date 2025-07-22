import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createExternalCheckoutSession } from '../../services/userService';

interface UserManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementDrawer: React.FC<UserManagementDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    logout, 
    creditsRemaining, 
    currentPlan, 
    hasCredits,
    refreshUser,
    getAccessTokenSilently
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'usage'>('account');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // 价格计划定义 - 使用营销网站的价格
  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: 1000,
      features: ['1,000 AI credits/month', 'Basic AI models', 'Email support'],
      stripePriceId: ''
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      credits: 10000,
      features: ['10,000 AI credits/month', 'Advanced AI models', 'Priority support', 'API access'],
      stripePriceId: 'price_1RbchvL7y127fTKemRuw8Elz',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      credits: 50000,
      features: ['50,000 AI credits/month', 'All AI models', 'Dedicated support', 'Custom training'],
      stripePriceId: 'price_1RbciEL7y127fTKexyDAX9JA'
    }
  ];

  // 处理计划升级
  const handleUpgrade = async (plan: typeof pricingPlans[0]) => {
    if (!user || !plan.stripePriceId) return;

    try {
      setIsLoading(plan.id);
      
      // 获取访问令牌
      const accessToken = await getAccessTokenSilently();
      
      // 创建 Stripe Checkout 会话
      const { url } = await createExternalCheckoutSession(plan.id, accessToken);
      
      if (!url) {
        throw new Error('No checkout URL received from server');
      }
      
      // 重定向到 Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  if (!user) return null;

  console.log('🔍 UserManagementDrawer render:', { isOpen, user: user.name });

  // 如果未打开，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black opacity-50 transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      {/* Drawer - 从左侧边栏右侧滑入 */}
      <div 
        className="fixed top-0 h-full w-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl transition-all duration-300 ease-out z-50 border-r border-white/20"
        style={{ 
          left: '16.67%', // 紧贴左侧边栏右边
        }}
      >
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 Close button clicked');
              onClose();
            }}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <p className="text-blue-300">{user.email}</p>
              <p className="text-sm text-purple-300 capitalize font-medium">{currentPlan} Plan</p>
            </div>
          </div>
        </div>

        {/* Credits Overview */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">{creditsRemaining}</div>
              <div className="text-sm text-green-300">Credits Left</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">{user.credits_total}</div>
              <div className="text-sm text-blue-300">Total Credits</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Usage</span>
              <span>{Math.round(((user.credits_total - creditsRemaining) / user.credits_total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${user.credits_total > 0 ? ((user.credits_total - creditsRemaining) / user.credits_total) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          {!hasCredits && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-300 text-sm font-medium">No credits remaining</span>
              </div>
              <p className="text-red-200 text-xs mt-1">Upgrade your plan to continue using AI features</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'account', label: 'Account', icon: '👤' },
            { id: 'billing', label: 'Billing', icon: '💳' },
            { id: 'usage', label: 'Usage', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID</span>
                    <span className="text-white font-mono text-xs">{user.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white">Recently</span>
                  </div>
                </div>
              </div>

              <button
                onClick={refreshUser}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium"
              >
                🔄 Refresh Account Data
              </button>
              
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl transition-all font-medium"
              >
                🚪 Sign Out
              </button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
                <h3 className="text-white font-medium mb-2">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 capitalize font-medium">{currentPlan}</span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    Active
                  </span>
                </div>
                <p className="text-sm text-purple-200 mt-2">
                  {currentPlan === 'free' 
                    ? 'Limited credits per month with basic features' 
                    : 'Premium features with more credits'
                  }
                </p>
              </div>

              {/* Pricing Plans */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Upgrade Plans</h4>
                {pricingPlans.map((plan) => {
                  const isCurrentPlan = currentPlan === plan.id;
                  const canUpgrade = plan.id !== 'free' && !isCurrentPlan;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative bg-white/5 border rounded-lg p-3 transition-all ${
                        plan.popular
                          ? 'border-blue-500/50 shadow-lg'
                          : 'border-white/10'
                      }`}
                    >
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-2 right-4">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Popular
                          </span>
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrentPlan && (
                        <div className="absolute -top-2 left-4">
                          <span className="bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-1 rounded text-xs font-medium">
                            Current
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="text-white font-medium text-sm">{plan.name}</h5>
                          <div className="flex items-baseline">
                            <span className="text-xl font-bold text-white">${plan.price}</span>
                            {plan.price > 0 && <span className="text-gray-400 ml-1 text-xs">/month</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-medium text-sm">
                            {plan.credits.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">credits</div>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-1 mb-3">
                        {plan.features.slice(0, 2).map((feature, index) => (
                          <li key={index} className="flex items-center text-xs text-gray-300">
                            <svg className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      <button
                        onClick={() => canUpgrade ? handleUpgrade(plan) : undefined}
                        disabled={!canUpgrade || isLoading === plan.id}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          isCurrentPlan
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default'
                            : canUpgrade
                            ? plan.popular
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                              : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                            : 'bg-gray-600/20 border border-gray-600/30 text-gray-500 cursor-default'
                        } ${isLoading === plan.id ? 'opacity-75' : ''}`}
                      >
                        {isLoading === plan.id ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : canUpgrade ? (
                          `Upgrade - $${plan.price}/mo`
                        ) : (
                          'Downgrade'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Additional Actions */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => window.open('https://iapro.ai/pricing', '_blank')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all font-medium text-sm"
                >
                  🌐 View Full Pricing Page
                </button>
                
                <button
                  onClick={() => window.open('https://iapro.ai/dashboard', '_blank')}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all font-medium text-sm"
                >
                  🏢 Manage Subscription
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-4">Usage Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Credits Used</span>
                    <span className="text-white font-medium">{user.credits_total - creditsRemaining}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Credits Remaining</span>
                    <span className={`font-medium ${hasCredits ? 'text-green-400' : 'text-red-400'}`}>
                      {creditsRemaining}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Usage Rate</span>
                    <span className="text-blue-400">
                      {Math.round(((user.credits_total - creditsRemaining) / user.credits_total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="text-white font-medium mb-2">💡 Usage Tips</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Each AI chat interaction consumes 1-5 credits</li>
                  <li>• Image generation uses 10-20 credits per image</li>
                  <li>• Document analysis varies by size</li>
                  <li>• Upgrade for unlimited usage</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};