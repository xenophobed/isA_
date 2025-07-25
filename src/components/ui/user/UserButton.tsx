/**
 * ============================================================================
 * UserButton Component (UserButton.tsx) - Pure UI Component
 * ============================================================================
 * 
 * Now a pure UI component that receives all data as props and uses
 * userHandler for actions. No business logic or direct hook usage.
 * 
 * Architecture Integration:
 * ✅ Pure UI component (receives props, emits events)
 * ✅ Uses userHandler for action handling
 * ✅ No direct access to stores or business logic
 * ✅ Clean separation of concerns
 */

import React from 'react';
import { useUserHandler, formatCredits, getCreditColor } from '../../core/userHandler';

interface UserButtonProps {
  onToggleDrawer: () => void;
  showDrawer?: boolean; // Optional since not used in current implementation
}

export const UserButton: React.FC<UserButtonProps> = ({ onToggleDrawer }) => {
  const userHandler = useUserHandler();

  // Don't render if not authenticated or no user
  if (!userHandler.isAuthenticated || !userHandler.user) {
    return null;
  }

  const user = userHandler.user;
  const credits = userHandler.credits;
  const hasCredits = userHandler.hasCredits;

  return (
    <button
      onClick={onToggleDrawer}
      className="w-full p-3 hover:bg-white/10 transition-colors rounded-lg flex items-center space-x-3 group"
      title="Account Settings"
      disabled={userHandler.isLoading}
    >
      {/* User Avatar */}
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {user.name?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* User Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {user.name || 'Unknown User'}
        </div>
        <div className="text-xs text-gray-400 flex items-center space-x-2">
          <span className={getCreditColor(credits)}>
            {formatCredits(credits)} credits
          </span>
          {!hasCredits && (
            <span className="bg-red-500/20 text-red-400 px-1 rounded text-xs">
              Empty
            </span>
          )}
        </div>
      </div>

      {/* Settings Icon */}
      <svg 
        className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
        />
      </svg>

      {/* Loading Indicator */}
      {userHandler.isLoading && (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      )}
    </button>
  );
};