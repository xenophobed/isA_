/**
 * Mobile Header Component
 * Optimized header for mobile chat interface
 */
import React from 'react';

// Simple SVG icon components
const Menu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MoreVertical = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export interface MobileHeaderProps {
  content?: React.ReactNode;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  isNativeApp?: boolean;
  refreshing?: boolean;
  title?: string;
  
  // Enhanced mobile props
  subtitle?: string;
  showUserAvatar?: boolean;
  userAvatarUrl?: string;
  userName?: string;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  showNotifications?: boolean;
  notificationCount?: number;
  onUserAvatarClick?: () => void;
  onNotificationsClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  content,
  showLeftSidebar = false,
  showRightSidebar = false,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isNativeApp = false,
  refreshing = false,
  title = 'AI Assistant',
  subtitle,
  showUserAvatar = false,
  userAvatarUrl,
  userName,
  connectionStatus = 'connected',
  showNotifications = false,
  notificationCount = 0,
  onUserAvatarClick,
  onNotificationsClick
}) => {
  // Connection status indicator
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'connecting': return 'bg-yellow-400 animate-pulse';
      case 'disconnected': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <header 
      className={`
        mobile-header
        flex flex-col
        bg-gradient-to-r from-black/30 via-black/20 to-black/30
        backdrop-blur-xl border-b border-white/10
        relative z-30 overflow-hidden
        ${isNativeApp ? 'native-header pt-safe' : ''}
      `}
      style={{
        paddingTop: isNativeApp ? 'env(safe-area-inset-top)' : undefined
      }}
    >
      {/* Main header row */}
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left section - Menu button */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onToggleLeftSidebar}
            className={`
              mobile-menu-btn
              w-11 h-11 rounded-xl
              flex items-center justify-center
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10 hover:border-white/20
              transition-all duration-200 flex-shrink-0
              ${showLeftSidebar ? 'bg-blue-500/20 border-blue-500/30' : ''}
            `}
            aria-label="Toggle menu"
          >
            {showLeftSidebar ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Title and status section */}
          <div className="flex-1 min-w-0 ml-2">
            {content || (
              <div className="flex flex-col justify-center min-h-11">
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-semibold text-lg truncate leading-tight">
                    {title}
                  </h1>
                  
                  {/* Connection status indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
                    {refreshing && (
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    )}
                  </div>
                </div>
                
                {/* Subtitle or connection status */}
                {(subtitle || connectionStatus !== 'connected') && (
                  <p className="text-white/60 text-sm truncate leading-tight -mt-0.5">
                    {subtitle || getConnectionText()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notifications button */}
          {showNotifications && (
            <button
              onClick={onNotificationsClick}
              className="
                relative
                w-11 h-11 rounded-xl
                flex items-center justify-center
                bg-white/5 hover:bg-white/10 active:bg-white/15
                border border-white/10 hover:border-white/20
                transition-all duration-200
              "
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <div className="
                  absolute -top-1 -right-1
                  min-w-5 h-5 px-1
                  bg-red-500 rounded-full
                  flex items-center justify-center
                  text-white text-xs font-medium
                ">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </div>
              )}
            </button>
          )}
          
          {/* User avatar */}
          {showUserAvatar && (
            <button
              onClick={onUserAvatarClick}
              className="
                w-11 h-11 rounded-xl
                flex items-center justify-center
                bg-white/5 hover:bg-white/10 active:bg-white/15
                border border-white/10 hover:border-white/20
                transition-all duration-200 overflow-hidden
              "
              aria-label={`User menu - ${userName || 'Profile'}`}
            >
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt={userName || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          
          {/* More options menu */}
          <button
            onClick={onToggleRightSidebar}
            className={`
              mobile-menu-btn
              w-11 h-11 rounded-xl
              flex items-center justify-center
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10 hover:border-white/20
              transition-all duration-200
              ${showRightSidebar ? 'bg-blue-500/20 border-blue-500/30' : ''}
            `}
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Optional bottom border with gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
};