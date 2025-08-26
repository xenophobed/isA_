/**
 * MessageBubble Component - Unified message display for chat interfaces
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React, { useState } from 'react';
import { Avatar } from './Avatar';

export interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  isStreaming?: boolean;
  streamingStatus?: string;
  avatar?: {
    src?: string;
    alt?: string;
  };
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showActions?: boolean;
  className?: string;
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  role,
  timestamp,
  isStreaming = false,
  streamingStatus,
  avatar,
  showAvatar = true,
  showTimestamp = true,
  showActions = true,
  className = '',
  onCopy,
  onLike,
  onDislike,
  onRegenerate
}) => {
  const [showActionButtons, setShowActionButtons] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getBubbleStyles = () => {
    switch (role) {
      case 'user':
        return `
          bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
          text-white rounded-br-lg
          shadow-lg shadow-blue-500/30
          border border-blue-400/20
          hover:shadow-xl hover:shadow-blue-500/40
        `;
      case 'assistant':
        return `
          bg-white dark:bg-gray-800/90 
          text-gray-900 dark:text-gray-100
          rounded-bl-lg
          shadow-sm hover:shadow-md
          border border-gray-200/60 dark:border-gray-700/60
          backdrop-blur-xl
          hover:border-gray-300/60 dark:hover:border-gray-600/60
        `;
      case 'system':
        return `
          bg-gradient-to-br from-green-500 to-green-600
          text-white rounded-lg
          shadow-lg shadow-green-500/30
          border border-green-400/20
        `;
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
  };

  const getGlassmorphismOverlay = () => {
    switch (role) {
      case 'user':
        return 'bg-gradient-to-br from-white/10 via-transparent to-black/10';
      case 'assistant':
        return 'bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/10 dark:via-transparent dark:to-black/10';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`
        message-container group flex gap-4 items-start mb-6
        ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}
        ${className}
      `}
      onMouseEnter={() => setShowActionButtons(true)}
      onMouseLeave={() => setShowActionButtons(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 mt-0.5">
          <Avatar
            src={avatar?.src}
            alt={avatar?.alt}
            variant={role}
            status={isStreaming ? 'thinking' : 'online'}
            showStatus={role === 'assistant'}
            size="md"
          />
        </div>
      )}

      {/* Message Content */}
      <div 
        className={`
          message-content flex-1 max-w-[80%] min-w-0
          ${role === 'user' ? 'items-end' : 'items-start'}
        `}
      >
        {/* Message Bubble */}
        <div
          className={`
            message-bubble relative group/bubble
            px-5 py-3.5 rounded-3xl
            transition-all duration-300 hover:scale-[1.02]
            ${getBubbleStyles()}
          `}
        >
          {/* Glassmorphism overlay */}
          <div className={`
            absolute inset-0 rounded-3xl
            ${getGlassmorphismOverlay()}
            ${role === 'user' ? 'rounded-br-lg' : 'rounded-bl-lg'}
          `} />
          
          <div className="relative text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">
            {content}
            
            {/* Streaming indicator */}
            {isStreaming && (
              <span className="inline-flex items-center ml-2">
                <span className="w-1.5 h-4 bg-current rounded-full animate-pulse opacity-80" />
                <span className="w-1 h-3 bg-current rounded-full ml-0.5 animate-pulse opacity-60" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2 bg-current rounded-full ml-0.5 animate-pulse opacity-40" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
          
          {/* Streaming status */}
          {isStreaming && streamingStatus && (
            <div className={`
              text-xs mt-2 px-2 py-1 rounded-full backdrop-blur-sm
              ${role === 'user' 
                ? 'bg-blue-400/20 text-blue-100 border border-blue-300/20' 
                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-400/20 dark:border-gray-600/20'
              }
            `}>
              <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1.5"></span>
              {streamingStatus}
            </div>
          )}
          
          {/* Message actions */}
          {showActions && showActionButtons && role !== 'system' && (
            <div className="absolute -top-2 right-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                {onCopy && (
                  <button 
                    onClick={onCopy}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Copy"
                  >
                    <span className="text-xs">📋</span>
                  </button>
                )}
                {role === 'assistant' && onLike && (
                  <button 
                    onClick={onLike}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Like"
                  >
                    <span className="text-xs">👍</span>
                  </button>
                )}
                {role === 'assistant' && onDislike && (
                  <button 
                    onClick={onDislike}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Dislike"
                  >
                    <span className="text-xs">👎</span>
                  </button>
                )}
                {role === 'assistant' && onRegenerate && (
                  <button 
                    onClick={onRegenerate}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Regenerate"
                  >
                    <span className="text-xs">🔄</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div 
            className={`
              text-xs text-gray-500 dark:text-gray-400 mt-2 px-2
              opacity-0 group-hover:opacity-100 transition-all duration-200
              ${role === 'user' ? 'text-right' : 'text-left'}
            `}
          >
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};