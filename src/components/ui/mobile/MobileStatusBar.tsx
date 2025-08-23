/**
 * Mobile Status Bar - Modern AI chat status indicators
 * Following ChatGPT, Claude, Gemini patterns for mobile interfaces
 */
import React, { useState, useEffect } from 'react';

// ================================================================================
// Mobile Status Bar - Top-level status indicator
// ================================================================================

export interface MobileStatusBarProps {
  status: 'online' | 'connecting' | 'offline' | 'processing' | 'error';
  message?: string;
  showTime?: boolean;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  autoHide?: boolean;
  duration?: number;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  status,
  message,
  showTime = false,
  actions = [],
  autoHide = false,
  duration = 3000
}) => {
  const [visible, setVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && status !== 'processing') {
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, status]);

  // Update time every second
  useEffect(() => {
    if (!showTime) return;
    
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [showTime]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          bg: 'bg-green-500/10 dark:bg-green-400/10',
          border: 'border-green-500/20 dark:border-green-400/20',
          text: 'text-green-700 dark:text-green-300',
          dot: 'bg-green-500',
          icon: '✓',
          defaultMessage: 'Connected'
        };
      case 'connecting':
        return {
          bg: 'bg-yellow-500/10 dark:bg-yellow-400/10',
          border: 'border-yellow-500/20 dark:border-yellow-400/20',
          text: 'text-yellow-700 dark:text-yellow-300',
          dot: 'bg-yellow-500',
          icon: '⟲',
          defaultMessage: 'Connecting...'
        };
      case 'processing':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-400/10',
          border: 'border-blue-500/20 dark:border-blue-400/20',
          text: 'text-blue-700 dark:text-blue-300',
          dot: 'bg-blue-500',
          icon: '⚡',
          defaultMessage: 'Processing...'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10 dark:bg-red-400/10',
          border: 'border-red-500/20 dark:border-red-400/20',
          text: 'text-red-700 dark:text-red-300',
          dot: 'bg-red-500',
          icon: '!',
          defaultMessage: 'Connection error'
        };
      default: // offline
        return {
          bg: 'bg-gray-500/10 dark:bg-gray-400/10',
          border: 'border-gray-500/20 dark:border-gray-400/20',
          text: 'text-gray-700 dark:text-gray-300',
          dot: 'bg-gray-500',
          icon: '○',
          defaultMessage: 'Offline'
        };
    }
  };

  if (!visible) return null;

  const config = getStatusConfig();

  return (
    <div className={`
      mobile-status-bar relative
      mx-4 mt-2 p-3 rounded-xl
      ${config.bg} ${config.border}
      border backdrop-blur-sm
      ${status === 'processing' ? 'animate-pulse' : ''}
      transition-all duration-300
    `}>
      <div className="flex items-center justify-between">
        {/* Left: Status indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`
              w-3 h-3 ${config.dot} rounded-full
              ${status === 'connecting' || status === 'processing' ? 'animate-pulse' : ''}
            `} />
            {(status === 'connecting' || status === 'processing') && (
              <div className={`absolute inset-0 w-3 h-3 ${config.dot} rounded-full animate-ping opacity-75`} />
            )}
          </div>
          
          <div className="flex-1">
            <div className={`text-sm font-medium ${config.text}`}>
              {message || config.defaultMessage}
            </div>
            {showTime && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {currentTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center transition-colors active:scale-95"
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}

        {/* Close button for manual dismiss */}
        {autoHide && (
          <button
            onClick={() => setVisible(false)}
            className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center text-xs transition-colors ml-2"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// ================================================================================
// Mobile Connection Status - Minimal header indicator
// ================================================================================

export interface MobileConnectionStatusProps {
  isOnline: boolean;
  showText?: boolean;
}

export const MobileConnectionStatus: React.FC<MobileConnectionStatusProps> = ({
  isOnline,
  showText = false
}) => {
  return (
    <div className="mobile-connection-status inline-flex items-center gap-2">
      <div className="relative">
        <div className={`
          w-2 h-2 rounded-full
          ${isOnline ? 'bg-green-500' : 'bg-red-500'}
          ${isOnline ? 'animate-pulse' : ''}
        `} />
        {isOnline && (
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
        )}
      </div>
      
      {showText && (
        <span className={`text-xs font-medium ${
          isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

// ================================================================================
// Mobile Network Quality Indicator
// ================================================================================

export interface MobileNetworkQualityProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  showLabel?: boolean;
}

export const MobileNetworkQuality: React.FC<MobileNetworkQualityProps> = ({
  quality,
  showLabel = false
}) => {
  const getConfig = () => {
    switch (quality) {
      case 'excellent':
        return { bars: 4, color: 'bg-green-500', label: 'Excellent' };
      case 'good':
        return { bars: 3, color: 'bg-green-500', label: 'Good' };
      case 'fair':
        return { bars: 2, color: 'bg-yellow-500', label: 'Fair' };
      default: // poor
        return { bars: 1, color: 'bg-red-500', label: 'Poor' };
    }
  };

  const config = getConfig();

  return (
    <div className="mobile-network-quality inline-flex items-center gap-2">
      {/* Signal bars */}
      <div className="flex items-end gap-0.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`
              w-1 rounded-full transition-all duration-300
              ${i < config.bars ? config.color : 'bg-gray-300 dark:bg-gray-600'}
            `}
            style={{ height: `${(i + 1) * 2 + 2}px` }}
          />
        ))}
      </div>

      {showLabel && (
        <span className={`text-xs font-medium ${
          quality === 'excellent' || quality === 'good' 
            ? 'text-green-600 dark:text-green-400'
            : quality === 'fair'
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// ================================================================================
// Mobile Activity Indicator - For ongoing processes
// ================================================================================

export interface MobileActivityIndicatorProps {
  activities: Array<{
    id: string;
    label: string;
    progress?: number;
    status: 'active' | 'completed' | 'error';
  }>;
  maxVisible?: number;
  onActivityClick?: (id: string) => void;
}

export const MobileActivityIndicator: React.FC<MobileActivityIndicatorProps> = ({
  activities,
  maxVisible = 3,
  onActivityClick
}) => {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) return null;

  const visibleActivities = expanded ? activities : activities.slice(0, maxVisible);
  const hasMore = activities.length > maxVisible;

  return (
    <div className="mobile-activity-indicator mx-4 mb-2">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 space-y-2">
        {visibleActivities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onActivityClick?.(activity.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors active:scale-[0.98]"
          >
            {/* Status indicator */}
            <div className={`
              w-2 h-2 rounded-full
              ${activity.status === 'active' ? 'bg-blue-500 animate-pulse' :
                activity.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}
            `} />
            
            {/* Activity info */}
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {activity.label}
              </div>
              
              {activity.progress !== undefined && activity.status === 'active' && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {activity.progress}%
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}

        {/* Expand/collapse button */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {expanded ? (
              <>
                Show less
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                Show {activities.length - maxVisible} more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};