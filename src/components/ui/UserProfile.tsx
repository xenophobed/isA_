import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { 
    user, 
    logout, 
    creditsRemaining, 
    currentPlan, 
    hasCredits,
    refreshUser 
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">{user.name}</div>
          <div className="text-xs text-gray-300">
            {creditsRemaining} credits • {currentPlan}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
          
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Credits</span>
              <span className={`text-sm font-medium ${hasCredits ? 'text-green-400' : 'text-red-400'}`}>
                {creditsRemaining}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Plan</span>
              <span className="text-sm font-medium text-blue-400 capitalize">{currentPlan}</span>
            </div>
            {!hasCredits && (
              <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
                No credits remaining. Upgrade your plan to continue.
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={refreshUser}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
            >
              Refresh Account
            </button>
            <button
              onClick={() => {
                // Navigate to billing/upgrade page
                window.open('https://iapro.ai/pricing', '_blank');
              }}
              className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors"
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};