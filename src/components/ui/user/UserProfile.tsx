/**
 * ============================================================================
 * UserProfile Component (UserProfile.tsx) - Pure UI Component
 * ============================================================================
 * 
 * Refactored to be a pure UI component using userHandler for actions.
 * Clean dropdown profile component with user info and actions.
 * 
 * Architecture Integration:
 * ✅ Pure UI component (no business logic)
 * ✅ Uses userHandler for all actions
 * ✅ Clean separation of concerns
 * ✅ Proper error handling and loading states
 */

import React, { useState } from 'react';
import { useUserHandler, formatCredits, getCreditColor, getPlanDisplayName } from '../../core/userHandler';

export const UserProfile: React.FC = () => {
  const userHandler = useUserHandler();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if not authenticated
  if (!userHandler.isAuthenticated || !userHandler.user) {
    return null;
  }

  const user = userHandler.user;
  const credits = userHandler.credits;
  const hasCredits = userHandler.hasCredits;
  const currentPlan = userHandler.currentPlan;

  const handleRefreshUser = async () => {
    try {
      await userHandler.handleRefreshUser();
    } catch (error) {
      userHandler.handleError(error as Error, 'refresh user');
    }
  };

  const handleLogout = () => {
    userHandler.handleLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
        disabled={userHandler.isLoading}
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">
            {user.name || 'Unknown User'}
          </div>
          <div className="text-xs text-gray-300">
            {formatCredits(credits)} credits • {getPlanDisplayName(currentPlan)}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className="w-4 h-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>

        {/* Loading Indicator */}
        {userHandler.isLoading && (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-sm font-medium text-white">
              {user.name || 'Unknown User'}
            </div>
            <div className="text-xs text-gray-400">
              {user.email || 'No email'}
            </div>
          </div>
          
          {/* Credits & Plan Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Credits</span>
              <span className={`text-sm font-medium ${getCreditColor(credits)}`}>
                {formatCredits(credits)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Plan</span>
              <span className="text-sm font-medium text-blue-400 capitalize">
                {getPlanDisplayName(currentPlan)}
              </span>
            </div>
            
            {/* Low Credits Warning */}
            {!hasCredits && (
              <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
                No credits remaining. Upgrade your plan to continue.
              </div>
            )}

            {/* Error Display */}
            {userHandler.error && (
              <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
                {userHandler.error}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="p-2">
            <button
              onClick={handleRefreshUser}
              disabled={userHandler.isLoading}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            >
              🔄 Refresh Account
            </button>
            
            <button
              onClick={userHandler.handleViewPricing}
              className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors"
            >
              ⬆️ Upgrade Plan
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded transition-colors"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};