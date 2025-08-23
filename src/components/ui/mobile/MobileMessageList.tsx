/**
 * Mobile Message List Component
 * Optimized message display for mobile devices with pull-to-refresh
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ChatMessage } from '../chat/ChatLayout';

// Simple SVG icon components
const Bot = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export interface MobileMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isTyping?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  isMobile?: boolean;
}

export const MobileMessageList: React.FC<MobileMessageListProps> = ({
  messages,
  isLoading = false,
  isTyping = false,
  enablePullToRefresh = true,
  onRefresh,
  refreshing = false,
  isMobile = true
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling] = useState(false);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Note: Pull to refresh gestures would be implemented here
  // Currently simplified for compatibility

  // Format timestamp for mobile
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format message content for mobile display
  const formatMessageContent = (content: string) => {
    if (content.length > 300 && isMobile) {
      return content.substring(0, 300) + '...';
    }
    return content;
  };

  return (
    <div 
      ref={containerRef}
      className="
        mobile-message-list
        flex-1 overflow-y-auto
        px-4 py-4
        scroll-smooth
      "
      {...(enablePullToRefresh ? {} : {})}
    >
      {/* Pull to refresh indicator */}
      {enablePullToRefresh && (refreshing || isPulling) && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-white/70">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">
              {refreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`
              mobile-message
              flex gap-3
              ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
            `}
          >
            {/* Avatar */}
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                flex-shrink-0 mt-1
                ${message.role === 'user' 
                  ? 'bg-blue-500/20 border-blue-500/30' 
                  : 'bg-purple-500/20 border-purple-500/30'
                }
                border
              `}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-blue-400" />
              ) : (
                <Bot className="w-4 h-4 text-purple-400" />
              )}
            </div>

            {/* Message bubble */}
            <div 
              className={`
                message-bubble
                flex-1 max-w-[85%]
                ${message.role === 'user' ? 'items-end' : 'items-start'}
              `}
            >
              {/* Message content */}
              <div
                className={`
                  px-4 py-3 rounded-2xl
                  ${message.role === 'user'
                    ? 'bg-blue-500/20 border-blue-500/30 rounded-br-md'
                    : 'bg-white/5 border-white/10 rounded-bl-md'
                  }
                  border backdrop-blur-sm
                `}
              >
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {formatMessageContent(message.content)}
                  
                  {/* Streaming indicator */}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                  )}
                </div>
                
                {/* Streaming status */}
                {message.isStreaming && message.streamingStatus && (
                  <div className="text-xs text-white/50 mt-1">
                    {message.streamingStatus}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div 
                className={`
                  text-xs text-white/40 mt-1 px-1
                  ${message.role === 'user' ? 'text-right' : 'text-left'}
                `}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="mobile-message flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border-purple-500/30 border flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            
            <div className="flex-1">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/5 border-white/10 border backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};