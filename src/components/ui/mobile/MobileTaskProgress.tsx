/**
 * Mobile-Optimized Task Progress Components
 * Designed specifically for mobile AI chat interfaces following ChatGPT/Claude patterns
 */
import React, { useState } from 'react';

// ================================================================================
// Mobile Task Progress Indicator - Compact inline display
// ================================================================================

export interface MobileTaskProgressProps {
  status: 'idle' | 'processing' | 'completed' | 'error';
  taskTitle?: string;
  progress?: number;
  isStreaming?: boolean;
  onTap?: () => void;
  compact?: boolean;
}

export const MobileTaskProgress: React.FC<MobileTaskProgressProps> = ({
  status,
  taskTitle,
  progress = 0,
  isStreaming = false,
  onTap,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: '⚡',
          pulse: true
        };
      case 'completed':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: '✓',
          pulse: false
        };
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: '!',
          pulse: false
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: '•',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" 
           style={{ background: config.bgColor }}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        {progress > 0 && progress < 100 && (
          <span className={config.textColor}>{progress}%</span>
        )}
        {status === 'completed' && (
          <span className={config.textColor}>Done</span>
        )}
        {status === 'processing' && isStreaming && (
          <span className={config.textColor}>Processing...</span>
        )}
      </div>
    );
  }

  return (
    <div className="mobile-task-progress">
      <button
        onClick={() => {
          setShowDetails(!showDetails);
          onTap?.();
        }}
        className={`
          w-full flex items-center justify-between p-3 rounded-xl
          ${config.bgColor} ${config.borderColor}
          border backdrop-blur-sm
          active:scale-[0.98] transition-all duration-150
          touch-manipulation
        `}
      >
        {/* Left: Status and Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`
            w-8 h-8 rounded-full ${config.color} 
            flex items-center justify-center text-white text-sm font-bold
            ${config.pulse ? 'animate-pulse' : ''}
            shadow-sm
          `}>
            {config.icon}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-medium ${config.textColor} truncate`}>
              {taskTitle || 'Task'}
            </div>
            {status === 'processing' && progress > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${config.color} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={`text-xs ${config.textColor} tabular-nums`}>
                  {progress}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chevron if expandable */}
        {onTap && (
          <div className={`
            w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 
            flex items-center justify-center
            transition-transform duration-200
            ${showDetails ? 'rotate-180' : ''}
          `}>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Expandable Details */}
      {showDetails && onTap && (
        <div className={`
          mt-2 p-3 rounded-lg 
          ${config.bgColor} ${config.borderColor}
          border-l-4 border-l-current
          animate-slideDown
        `}>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>Status: {status}</div>
            {progress > 0 && <div>Progress: {progress}%</div>}
            {isStreaming && <div>Streaming: Active</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================================
// Mobile Typing Indicator - ChatGPT/Claude style
// ================================================================================

export interface MobileTypingIndicatorProps {
  show: boolean;
  message?: string;
  variant?: 'dots' | 'pulse' | 'wave';
}

export const MobileTypingIndicator: React.FC<MobileTypingIndicatorProps> = ({
  show,
  message = 'AI is typing',
  variant = 'dots'
}) => {
  if (!show) return null;

  const renderAnimation = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        );
      case 'wave':
        return (
          <div className="flex items-end gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-blue-500 rounded-full animate-bounce"
                style={{ 
                  height: `${8 + Math.sin(i) * 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        );
      default: // dots
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        );
    }
  };

  return (
    <div className="mobile-typing-indicator flex items-center gap-3 p-3 mx-4 mb-2 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-fadeIn">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      
      <div className="flex-1 flex items-center gap-3">
        {renderAnimation()}
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </span>
      </div>
    </div>
  );
};

// ================================================================================
// Mobile Loading States - Various loading indicators
// ================================================================================

export interface MobileLoadingStateProps {
  type: 'initial' | 'processing' | 'streaming' | 'uploading';
  message?: string;
  progress?: number;
  show: boolean;
}

export const MobileLoadingState: React.FC<MobileLoadingStateProps> = ({
  type,
  message,
  progress,
  show
}) => {
  if (!show) return null;

  const getConfig = () => {
    switch (type) {
      case 'initial':
        return {
          title: 'Starting AI Assistant',
          icon: '🤖',
          color: 'from-blue-500 to-purple-600',
          bgColor: 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
        };
      case 'processing':
        return {
          title: 'Processing your request',
          icon: '⚡',
          color: 'from-green-500 to-blue-500',
          bgColor: 'from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20'
        };
      case 'streaming':
        return {
          title: 'Generating response',
          icon: '✨',
          color: 'from-purple-500 to-pink-500',
          bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
        };
      case 'uploading':
        return {
          title: 'Uploading files',
          icon: '📤',
          color: 'from-orange-500 to-red-500',
          bgColor: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
        };
    }
  };

  const config = getConfig();

  if (type === 'initial') {
    // Full screen overlay for initial loading
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Animated logo */}
          <div className={`w-20 h-20 bg-gradient-to-br ${config.color} rounded-3xl flex items-center justify-center mb-6 animate-pulse shadow-2xl shadow-blue-500/25`}>
            <span className="text-3xl animate-bounce">{config.icon}</span>
          </div>
          
          {/* Loading dots */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          <p className="text-center text-gray-600 dark:text-gray-400 font-medium">
            {message || config.title}
          </p>
        </div>
      </div>
    );
  }

  // Inline loading states
  return (
    <div className={`mobile-loading-state mx-4 mb-3 p-4 rounded-2xl bg-gradient-to-r ${config.bgColor} border border-white/20 dark:border-gray-700/30 backdrop-blur-sm animate-fadeIn`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-xl flex items-center justify-center shadow-sm animate-pulse`}>
          <span className="text-lg">{config.icon}</span>
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {message || config.title}
          </div>
          
          {progress !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${config.color} transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums min-w-[3ch]">
                {progress}%
              </span>
            </div>
          )}
          
          {progress === undefined && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};