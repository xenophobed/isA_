/**
 * StatusBar Component - Connection, usage, and AI status indicators
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React from 'react';

export interface StatusBarProps {
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  aiStatus?: 'ready' | 'thinking' | 'typing' | 'offline';
  tokenUsage?: {
    current: number;
    limit: number;
    resetDate?: string;
  };
  modelInfo?: {
    name: string;
    version?: string;
  };
  showTokenUsage?: boolean;
  showModelInfo?: boolean;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  connectionStatus = 'connected',
  aiStatus = 'ready',
  tokenUsage,
  modelInfo,
  showTokenUsage = true,
  showModelInfo = true,
  className = ''
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case 'disconnected':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'connecting': return 'text-yellow-600 dark:text-yellow-400';
      case 'disconnected': return 'text-gray-600 dark:text-gray-400';
      case 'error': return 'text-red-600 dark:text-red-400';
    }
  };

  const getAIStatusIcon = () => {
    switch (aiStatus) {
      case 'ready':
        return (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        );
      case 'thinking':
        return (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        );
      case 'typing':
        return (
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      case 'offline':
        return (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        );
    }
  };

  const getAIStatusText = () => {
    switch (aiStatus) {
      case 'ready': return 'AI Ready';
      case 'thinking': return 'AI Thinking';
      case 'typing': return 'AI Typing';
      case 'offline': return 'AI Offline';
    }
  };

  const getAIStatusColor = () => {
    switch (aiStatus) {
      case 'ready': return 'text-green-600 dark:text-green-400';
      case 'thinking': return 'text-blue-600 dark:text-blue-400';
      case 'typing': return 'text-purple-600 dark:text-purple-400';
      case 'offline': return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTokenUsagePercent = () => {
    if (!tokenUsage) return 0;
    return (tokenUsage.current / tokenUsage.limit) * 100;
  };

  const getTokenUsageColor = () => {
    const percent = getTokenUsagePercent();
    if (percent >= 90) return 'text-red-600 dark:text-red-400';
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`
      status-bar flex items-center justify-between
      px-4 py-2 bg-gray-50 dark:bg-gray-800/50
      border-t border-gray-200 dark:border-gray-700
      text-xs
      ${className}
    `}>
      
      {/* Left Section - Connection & AI Status */}
      <div className="flex items-center gap-6">
        
        {/* Connection Status */}
        <div className={`flex items-center gap-2 ${getConnectionColor()}`}>
          {getConnectionIcon()}
          <span className="font-medium">{getConnectionText()}</span>
        </div>
        
        {/* AI Status */}
        <div className={`flex items-center gap-2 ${getAIStatusColor()}`}>
          {getAIStatusIcon()}
          <span className="font-medium">{getAIStatusText()}</span>
        </div>
      </div>
      
      {/* Right Section - Usage & Model Info */}
      <div className="flex items-center gap-6">
        
        {/* Token Usage */}
        {showTokenUsage && tokenUsage && (
          <div className={`flex items-center gap-2 ${getTokenUsageColor()}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">
              {formatNumber(tokenUsage.current)}/{formatNumber(tokenUsage.limit)} tokens
            </span>
            {tokenUsage.resetDate && (
              <span className="text-gray-500 dark:text-gray-400">
                • Resets {new Date(tokenUsage.resetDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        
        {/* Model Info */}
        {showModelInfo && modelInfo && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {modelInfo.name}
              {modelInfo.version && (
                <span className="text-gray-500 dark:text-gray-500"> v{modelInfo.version}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};