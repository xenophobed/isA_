/**
 * Modern Mobile Header Component
 * Inspired by ChatGPT, Claude, Gemini, and Grok mobile designs
 */
import React from 'react';

// Simple SVG icon components
const Menu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export interface ModernMobileHeaderProps {
  title?: string;
  subtitle?: string;
  showNewChatButton?: boolean;
  showUserAvatar?: boolean;
  userAvatarUrl?: string;
  userName?: string;
  onMenuClick?: () => void;
  onNewChatClick?: () => void;
  onUserAvatarClick?: () => void;
  isNativeApp?: boolean;
}

export const ModernMobileHeader: React.FC<ModernMobileHeaderProps> = ({
  title = "AI Assistant",
  subtitle,
  showNewChatButton = true,
  showUserAvatar = true,
  userAvatarUrl,
  userName,
  onMenuClick,
  onNewChatClick,
  onUserAvatarClick,
  isNativeApp = false
}) => {
  return (
    <header 
      className={`
        modern-mobile-header relative
        flex items-center justify-between
        h-16 px-5
        bg-white/90 dark:bg-gray-900/90
        backdrop-blur-2xl 
        border-b border-gray-200/30 dark:border-gray-700/30
        shadow-lg shadow-black/5
        z-50
        ${isNativeApp ? 'pt-safe' : ''}
      `}
      style={{
        paddingTop: isNativeApp ? 'env(safe-area-inset-top)' : undefined
      }}
    >
      {/* Premium glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/40 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 pointer-events-none" />
      
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-gray-300/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Premium Left section - Menu button */}
        <button
          onClick={(e) => {
            console.log('🔥🔥🔥 MENU BUTTON CLICKED - Raw Event', e);
            onMenuClick?.();
          }}
          className="
            group w-11 h-11 rounded-2xl
            flex items-center justify-center
            bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700
            hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30
            active:scale-95
            transition-all duration-200
            shadow-sm hover:shadow-md
            border border-gray-200/60 dark:border-gray-700/60
            hover:border-blue-300/60 dark:hover:border-blue-600/60
            relative z-10
            cursor-pointer
          "
          aria-label="Open menu"
          style={{ pointerEvents: 'auto' }}
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </button>

        {/* Premium Center section - Title */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-6">
          <h1 className="text-gray-900 dark:text-white font-bold text-lg truncate leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <div className="flex items-center gap-2 mt-0.5">
              {subtitle.toLowerCase().includes('online') && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
              )}
              {subtitle.toLowerCase().includes('typing') && (
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium truncate leading-tight">
                {subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Premium Right section - Actions */}
        <div className="flex items-center gap-3">
          {/* Premium New Chat button */}
          {showNewChatButton && (
            <button
              onClick={onNewChatClick}
              className="
                group w-11 h-11 rounded-2xl
                flex items-center justify-center
                bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700
                hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30
                active:scale-95
                transition-all duration-200
                shadow-sm hover:shadow-md
                border border-gray-200/60 dark:border-gray-700/60
                hover:border-green-300/60 dark:hover:border-green-600/60
              "
              aria-label="New chat"
            >
              <Edit className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          )}
          
          {/* Premium User avatar */}
          {showUserAvatar && (
            <button
              onClick={(e) => {
                console.log('🔥🔥🔥 USER AVATAR CLICKED - Raw Event', e);
                onUserAvatarClick?.();
              }}
              className="
                group relative w-10 h-10 rounded-2xl
                flex items-center justify-center
                overflow-hidden
                bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600
                hover:from-blue-600 hover:via-blue-700 hover:to-purple-700
                shadow-lg shadow-blue-500/25
                hover:shadow-xl hover:shadow-blue-600/30
                hover:scale-105 active:scale-95
                transition-all duration-200
                border-2 border-white/20 hover:border-white/30
                relative z-10
                cursor-pointer
              "
              aria-label={`User menu - ${userName || 'Profile'}`}
              style={{ pointerEvents: 'auto' }}
            >
              {/* Avatar content */}
              <div className="relative z-10">
                {userAvatarUrl ? (
                  <img 
                    src={userAvatarUrl} 
                    alt={userName || 'User'} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <User className="w-5 h-5 text-white drop-shadow-sm" />
                )}
              </div>
              
              {/* Premium overlay effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
              
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm animate-pulse pointer-events-none"></div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};