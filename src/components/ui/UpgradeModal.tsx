/**
 * ============================================================================
 * UpgradeModal Component (UpgradeModal.tsx) - Elegant Credit Upgrade Modal
 * ============================================================================
 * 
 * A beautiful modal that prompts users to upgrade when they run out of credits.
 * Provides clear pricing information and seamless upgrade flow.
 * 
 * Features:
 * ✅ Elegant design with gradients and animations
 * ✅ Clear credit status display
 * ✅ Plan comparison
 * ✅ Direct upgrade buttons
 * ✅ Responsive design
 */

import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  credits: number;
  totalCredits: number;
  onUpgrade: (planType: 'pro' | 'enterprise') => Promise<void>;
  onViewPricing: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  credits,
  totalCredits,
  onUpgrade,
  onViewPricing
}) => {
  if (!isOpen) return null;

  const usagePercentage = totalCredits > 0 ? Math.round(((totalCredits - credits) / totalCredits) * 100) : 100;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Credits Remaining</h2>
            <p className="text-gray-300">
              You've used all your available credits. Upgrade to continue using AI features.
            </p>
          </div>

          {/* Credit Status */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Current Plan</span>
              <span className="text-blue-400 font-medium capitalize">{currentPlan}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm">Credits Used</span>
              <span className="text-red-400 font-medium">{totalCredits - credits} / {totalCredits}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">{usagePercentage}% used</p>
          </div>

          {/* Upgrade Options */}
          <div className="space-y-3 mb-6">
            {/* Pro Plan */}
            <button
              onClick={() => onUpgrade('pro')}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all text-white font-medium"
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold">Pro Plan</div>
                  <div className="text-sm opacity-90">10,000 credits/month</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$29</div>
                  <div className="text-xs opacity-75">/month</div>
                </div>
              </div>
            </button>

            {/* Enterprise Plan */}
            <button
              onClick={() => onUpgrade('enterprise')}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all text-white font-medium"
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold">Enterprise Plan</div>
                  <div className="text-sm opacity-90">50,000 credits/month</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$99</div>
                  <div className="text-xs opacity-75">/month</div>
                </div>
              </div>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onViewPricing}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all text-sm"
            >
              View All Plans
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/30 text-gray-300 rounded-lg transition-all text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 