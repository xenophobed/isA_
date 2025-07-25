/**
 * ============================================================================
 * UserPortal Component - Pure UI Component
 * ============================================================================
 * 
 * Refactored to be a pure UI component using userHandler for actions.
 * Comprehensive user management portal with account, billing, and usage tabs.
 * 
 * Architecture Integration:
 * ✅ Pure UI component (no business logic)
 * ✅ Uses userHandler for all actions
 * ✅ Uses PRICING_PLANS from UserModule
 * ✅ Clean separation of concerns
 * ✅ Proper error handling and loading states
 */

import React, { useState } from 'react';
import { useUserHandler, formatCredits, getCreditColor, getPlanDisplayName } from '../../core/userHandler';
import { PRICING_PLANS } from '../../../modules/UserModule';
import { PlanType } from '../../../types/userTypes';

interface UserPortalProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarWidth?: string | number; // Allow dynamic sidebar width
}

export const UserPortal: React.FC<UserPortalProps> = ({ isOpen, onClose, sidebarWidth = '16.67%' }) => {
  const userHandler = useUserHandler();
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'usage'>('account');
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  // Don't render if not open or not authenticated
  if (!isOpen || !userHandler.isAuthenticated || !userHandler.user) {
    return null;
  }

  const user = userHandler.user;
  const credits = userHandler.credits;
  const totalCredits = userHandler.totalCredits;
  const hasCredits = userHandler.hasCredits;
  const currentPlan = userHandler.currentPlan;
  const usagePercentage = userHandler.usagePercentage;

  // Handle plan upgrade
  const handleUpgrade = async (planType: PlanType) => {
    try {
      setUpgradingPlan(planType);
      await userHandler.handleUpgrade(planType);
    } catch (error) {
      userHandler.handleError(error as Error, 'upgrade plan');
    } finally {
      setUpgradingPlan(null);
    }
  };

  // Handle user refresh
  const handleRefreshUser = async () => {
    try {
      await userHandler.handleRefreshUser();
    } catch (error) {
      userHandler.handleError(error as Error, 'refresh user');
    }
  };

  // Handle logout
  const handleLogout = () => {
    userHandler.handleLogout();
    onClose();
  };

  // Calculate positioning based on sidebar width
  const formattedSidebarWidth = typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth;
  const portalLeftPosition = `calc(${formattedSidebarWidth})`;

  return (
    <>
      {/* Backdrop - covers area to the right of sidebar */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300 z-40"
        style={{ left: portalLeftPosition }}
        onClick={onClose}
      />

      {/* Drawer - positioned AFTER the left sidebar */}
      <div 
        className="fixed top-0 h-full w-96 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out z-50 border-l border-white/20"
        style={{ 
          left: portalLeftPosition, // Start right after the left sidebar
          backdropFilter: 'blur(20px)',
        }}
      >
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name || 'Unknown User'}</h2>
              <p className="text-blue-300">{user.email || 'No email'}</p>
              <p className="text-sm text-purple-300 capitalize font-medium">{getPlanDisplayName(currentPlan)} Plan</p>
            </div>
          </div>
        </div>

        {/* Credits Overview */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">{formatCredits(credits)}</div>
              <div className="text-sm text-green-300">Credits Left</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">{formatCredits(totalCredits)}</div>
              <div className="text-sm text-blue-300">Total Credits</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Usage</span>
              <span>{usagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          {/* Low Credits Warning */}
          {!hasCredits && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-300 text-sm font-medium">No credits remaining</span>
              </div>
              <p className="text-red-200 text-xs mt-1">Upgrade your plan to continue using AI features</p>
            </div>
          )}

          {/* Error Display */}
          {userHandler.error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">❌</span>
                <span className="text-red-300 text-sm font-medium">Error</span>
              </div>
              <p className="text-red-200 text-xs mt-1">{userHandler.error}</p>
              <button
                onClick={userHandler.handleClearErrors}
                className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
              >
                Clear Error
              </button>
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
            <AccountTab 
              user={user}
              isLoading={userHandler.isLoading}
              onRefresh={handleRefreshUser}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab 
              currentPlan={currentPlan}
              pricingPlans={PRICING_PLANS}
              upgradingPlan={upgradingPlan}
              onUpgrade={handleUpgrade}
              onViewPricing={userHandler.handleViewPricing}
              onManageSubscription={userHandler.handleManageSubscription}
            />
          )}

          {activeTab === 'usage' && (
            <UsageTab 
              credits={credits}
              totalCredits={totalCredits}
              hasCredits={hasCredits}
              usagePercentage={usagePercentage}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ================================================================================
// Tab Components
// ================================================================================

const AccountTab: React.FC<{
  user: any;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}> = ({ user, isLoading, onRefresh, onLogout }) => (
  <div className="space-y-4">
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-white font-medium mb-2">Account Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">User ID</span>
          <span className="text-white font-mono text-xs">{user.user_id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Status</span>
          <span className="text-green-400">{user.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Email</span>
          <span className="text-white text-xs">{user.email || 'N/A'}</span>
        </div>
      </div>
    </div>

    <button
      onClick={onRefresh}
      disabled={isLoading}
      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
    >
      {isLoading ? '🔄 Refreshing...' : '🔄 Refresh Account Data'}
    </button>
    
    <button
      onClick={onLogout}
      className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl transition-all font-medium"
    >
      🚪 Sign Out
    </button>
  </div>
);

const BillingTab: React.FC<{
  currentPlan: string;
  pricingPlans: typeof PRICING_PLANS;
  upgradingPlan: string | null;
  onUpgrade: (planType: PlanType) => void;
  onViewPricing: () => void;
  onManageSubscription: () => void;
}> = ({ currentPlan, pricingPlans, upgradingPlan, onUpgrade, onViewPricing, onManageSubscription }) => (
  <div className="space-y-6">
    {/* Current Plan */}
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
      <h3 className="text-white font-medium mb-2">Current Plan</h3>
      <div className="flex items-center justify-between">
        <span className="text-purple-300 capitalize font-medium">{getPlanDisplayName(currentPlan)}</span>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Active</span>
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
        const isUpgrading = upgradingPlan === plan.id;
        
        return (
          <div
            key={plan.id}
            className={`relative bg-white/5 border rounded-lg p-3 transition-all ${
              (plan as any).popular
                ? 'border-blue-500/50 shadow-lg'
                : 'border-white/10'
            }`}
          >
            {/* Badges */}
            {(plan as any).popular && (
              <div className="absolute -top-2 right-4">
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Popular
                </span>
              </div>
            )}

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
              onClick={() => canUpgrade ? onUpgrade(plan.id) : undefined}
              disabled={!canUpgrade || isUpgrading}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isCurrentPlan
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default'
                  : canUpgrade
                  ? (plan as any).popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                  : 'bg-gray-600/20 border border-gray-600/30 text-gray-500 cursor-default'
              } ${isUpgrading ? 'opacity-75' : ''}`}
            >
              {isUpgrading ? (
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
        onClick={onViewPricing}
        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all font-medium text-sm"
      >
        🌐 View Full Pricing Page
      </button>
      
      <button
        onClick={onManageSubscription}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all font-medium text-sm"
      >
        🏢 Manage Subscription
      </button>
    </div>
  </div>
);

const UsageTab: React.FC<{
  credits: number;
  totalCredits: number;
  hasCredits: boolean;
  usagePercentage: number;
}> = ({ credits, totalCredits, usagePercentage }) => (
  <div className="space-y-4">
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-white font-medium mb-4">Usage Statistics</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Credits Used</span>
          <span className="text-white font-medium">{formatCredits(totalCredits - credits)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Credits Remaining</span>
          <span className={`font-medium ${getCreditColor(credits)}`}>
            {formatCredits(credits)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Usage Rate</span>
          <span className="text-blue-400">{usagePercentage}%</span>
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
);