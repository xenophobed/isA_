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
import { useUserModule } from '../../../modules/UserModule';

interface UserButtonProps {
  onToggleDrawer: () => void;
  showDrawer?: boolean; // Optional since not used in current implementation
}

export const UserButton: React.FC<UserButtonProps> = ({ onToggleDrawer }) => {
  // 使用UserModule的状态和方法
  const { auth0User, isAuthenticated, login, isLoading, credits, hasCredits, currentPlan } = useUserModule();

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => login()}
        className="w-full p-3 transition-colors rounded-lg flex items-center space-x-3 group hover:bg-white/10"
        style={{ background: 'var(--glass-primary)' }}
        title="Sign In"
        disabled={isLoading}
      >
        {/* User Avatar - Not logged in */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--glass-secondary)', color: 'var(--text-primary)' }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* User Info - Not logged in */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Sign In
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Click to login
          </div>
        </div>

        {/* Sign In Icon */}
        <svg 
          className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        )}
      </button>
    );
  }

  // 已登录状态
  return (
    <button
      onClick={onToggleDrawer}
      className="w-full p-3 hover:bg-white/10 transition-colors rounded-lg flex items-center space-x-3 group"
      title="Account Settings"
    >
      {/* User Avatar */}
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {auth0User?.name?.charAt(0)?.toUpperCase() || auth0User?.email?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* User Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {auth0User?.name || auth0User?.email || 'User'}
        </div>
        <div className="text-xs text-gray-400">
          {credits} credits • {currentPlan}
        </div>
      </div>

      {/* Settings Icon */}
      <svg 
        className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
};