/**
 * Modern Mobile Message List Component
 * Following ChatGPT, Claude, Gemini design patterns
 */
import React, { useRef, useEffect, useCallback } from 'react';
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

export interface ModernMobileMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isTyping?: boolean;
  userAvatarUrl?: string;
  botAvatarUrl?: string;
}

export const ModernMobileMessageList: React.FC<ModernMobileMessageListProps> = ({
  messages,
  isLoading = false,
  isTyping = false,
  userAvatarUrl,
  botAvatarUrl
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure message uniqueness by ID
  const uniqueMessages = React.useMemo(() => {
    const seen = new Set();
    return messages.filter(msg => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });
  }, [messages]);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Format timestamp for mobile display
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

  return (
    <div 
      ref={containerRef}
      className="
        modern-mobile-message-list
        flex-1 overflow-y-auto
        px-4 py-6
        space-y-6
        scroll-smooth
        bg-white dark:bg-gray-900
      "
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Premium welcome message for empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="relative mb-8">
            {/* Animated background circles */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-30 animate-pulse delay-150"></div>
            
            {/* Main avatar */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
              <Bot className="w-10 h-10 text-white drop-shadow-lg" />
              
              {/* Floating particles */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-90 animate-bounce"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-200 rounded-full opacity-70 animate-bounce delay-300"></div>
            </div>
          </div>
          
          <div className="text-center max-w-sm">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              How can I help you today?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
              I'm here to assist with coding, writing, analysis, and creative projects.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-700">
                💡 Ideas
              </span>
              <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full border border-purple-200 dark:border-purple-700">
                ⚡ Code
              </span>
              <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full border border-green-200 dark:border-green-700">
                ✨ Create
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Premium Messages */}
      {uniqueMessages.map((message, index) => (
        <div
          key={message.id}
          className={`
            modern-message-container group
            flex gap-4 items-start mb-6
            ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
          `}
          style={{
            animationDelay: `${index * 50}ms`
          }}
        >
          {/* Premium Avatar */}
          <div className="flex-shrink-0 mt-0.5">
            <div 
              className={`
                relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden
                transition-all duration-300 group-hover:scale-105
                ${message.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200/50 dark:border-gray-600/50 shadow-sm'
                }
              `}
            >
              {message.role === 'user' ? (
                userAvatarUrl ? (
                  <img 
                    src={userAvatarUrl} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-5 h-5 text-white drop-shadow-sm" />
                )
              ) : (
                botAvatarUrl ? (
                  <img 
                    src={botAvatarUrl} 
                    alt="AI" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )
              )}
              
              {/* Online indicator for AI */}
              {message.role === 'assistant' && !message.isStreaming && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              )}
            </div>
          </div>

          {/* Premium Message Content */}
          <div 
            className={`
              message-content flex-1 max-w-[80%] min-w-0
              ${message.role === 'user' ? 'items-end' : 'items-start'}
            `}
          >
            {/* Premium Message Bubble */}
            <div
              className={`
                message-bubble relative group/bubble
                px-5 py-3.5 rounded-3xl
                transition-all duration-300 hover:scale-[1.02]
                ${message.role === 'user'
                  ? `
                    bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
                    text-white rounded-br-lg
                    shadow-lg shadow-blue-500/30
                    border border-blue-400/20
                    hover:shadow-xl hover:shadow-blue-500/40
                  `
                  : `
                    bg-white dark:bg-gray-800/90 
                    text-gray-900 dark:text-gray-100
                    rounded-bl-lg
                    shadow-sm hover:shadow-md
                    border border-gray-200/60 dark:border-gray-700/60
                    backdrop-blur-xl
                    hover:border-gray-300/60 dark:hover:border-gray-600/60
                  `
                }
              `}
            >
              {/* Glassmorphism overlay */}
              <div className={`
                absolute inset-0 rounded-3xl
                ${message.role === 'user'
                  ? 'bg-gradient-to-br from-white/10 via-transparent to-black/10'
                  : 'bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/10 dark:via-transparent dark:to-black/10'
                }
                ${message.role === 'user' ? 'rounded-br-lg' : 'rounded-bl-lg'}
              `} />
              
              <div className="relative text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">
                {message.content}
                
                {/* Premium streaming indicator */}
                {message.isStreaming && (
                  <span className="inline-flex items-center ml-2">
                    <span className="w-1.5 h-4 bg-current rounded-full animate-pulse opacity-80" />
                    <span className="w-1 h-3 bg-current rounded-full ml-0.5 animate-pulse opacity-60" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-2 bg-current rounded-full ml-0.5 animate-pulse opacity-40" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              
              {/* Premium streaming status */}
              {message.isStreaming && message.streamingStatus && (
                <div className={`
                  text-xs mt-2 px-2 py-1 rounded-full backdrop-blur-sm
                  ${message.role === 'user' 
                    ? 'bg-blue-400/20 text-blue-100 border border-blue-300/20' 
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-400/20 dark:border-gray-600/20'
                  }
                `}>
                  <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1.5"></span>
                  {message.streamingStatus}
                </div>
              )}
              
              {/* Message actions on hover */}
              <div className="absolute -top-2 right-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200">
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                  <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <span className="text-xs">👍</span>
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <span className="text-xs">👎</span>
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <span className="text-xs">📋</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Timestamp */}
            <div 
              className={`
                text-xs text-gray-500 dark:text-gray-400 mt-2 px-2
                opacity-0 group-hover:opacity-100 transition-all duration-200
                ${message.role === 'user' ? 'text-right' : 'text-left'}
              `}
            >
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {/* Premium Typing Indicator */}
      {isTyping && (
        <div className="modern-message-container flex gap-4 items-start mb-6 animate-fadeIn">
          {/* Premium AI Avatar */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200/50 dark:border-gray-600/50 shadow-sm flex items-center justify-center overflow-hidden">
              <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              
              {/* Thinking indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Premium Typing Animation */}
          <div className="message-content flex-1 max-w-[80%]">
            <div className="message-bubble relative px-5 py-3.5 rounded-3xl rounded-bl-lg bg-white dark:bg-gray-800/90 shadow-sm border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl">
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 rounded-3xl rounded-bl-lg bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/10 dark:via-transparent dark:to-black/10" />
              
              <div className="relative flex items-center gap-3">
                <div className="typing-dots flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
                </div>
                
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  <span className="inline-block animate-pulse">AI is thinking</span>
                  <span className="inline-block animate-bounce ml-1" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="inline-block animate-bounce ml-0" style={{ animationDelay: '200ms' }}>.</span>
                  <span className="inline-block animate-bounce ml-0" style={{ animationDelay: '400ms' }}>.</span>
                </div>
              </div>
              
              {/* Subtle background wave animation */}
              <div className="absolute inset-0 rounded-3xl rounded-bl-lg bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};