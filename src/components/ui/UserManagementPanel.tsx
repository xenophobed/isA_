import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    logout, 
    creditsRemaining, 
    currentPlan, 
    hasCredits,
    refreshUser 
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'usage'>('account');

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'account', label: 'Account', icon: '👤' },
            { id: 'billing', label: 'Billing', icon: '💳' },
            { id: 'usage', label: 'Usage', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{user.name}</h3>
                  <p className="text-gray-400">{user.email}</p>
                  <p className="text-sm text-blue-400 capitalize">{currentPlan} Plan</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{creditsRemaining}</div>
                  <div className="text-sm text-gray-400">Credits Remaining</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{user.credits_total}</div>
                  <div className="text-sm text-gray-400">Total Credits</div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={refreshUser}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Refresh Account Data
                </button>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 capitalize font-medium">{currentPlan}</span>
                  {currentPlan === 'free' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {currentPlan === 'free' 
                    ? 'Limited credits per month' 
                    : 'Unlimited usage with your subscription'
                  }
                </p>
              </div>

              {!hasCredits && (
                <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
                  <h4 className="text-red-400 font-medium mb-2">No Credits Remaining</h4>
                  <p className="text-red-300 text-sm mb-3">
                    You've used all your credits for this period. Upgrade to continue using AI features.
                  </p>
                  <button
                    onClick={() => window.open('https://iapro.ai/pricing', '_blank')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.open('https://iapro.ai/pricing', '_blank')}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  View Plans & Pricing
                </button>
                <button
                  onClick={() => window.open('https://iapro.ai/dashboard', '_blank')}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-4">Usage Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credits Used</span>
                    <span className="text-white">{user.credits_total - creditsRemaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credits Remaining</span>
                    <span className={`font-medium ${hasCredits ? 'text-green-400' : 'text-red-400'}`}>
                      {creditsRemaining}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${user.credits_total > 0 ? ((user.credits_total - creditsRemaining) / user.credits_total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Usage Tips</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Each AI interaction consumes credits</li>
                  <li>• Image generation uses more credits</li>
                  <li>• Credits reset monthly on free plan</li>
                  <li>• Upgrade for unlimited usage</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};