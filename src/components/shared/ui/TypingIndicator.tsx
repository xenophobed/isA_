/**
 * TypingIndicator Component - Animated typing indicator for AI responses
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React from 'react';
import { Avatar } from './Avatar';

export interface TypingIndicatorProps {
  message?: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  variant?: 'dots' | 'pulse' | 'wave' | 'modern';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  message = 'AI is thinking',
  showAvatar = true,
  avatarSrc,
  variant = 'modern',
  size = 'md',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-sm px-3 py-2';
      case 'lg': return 'text-base px-6 py-4';
      default: return 'text-sm px-4 py-3';
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'lg': return 'w-3 h-3';
      default: return 'w-2.5 h-2.5';
    }
  };

  const renderDots = () => {
    const dotClass = `${getDotSize()} rounded-full`;
    
    switch (variant) {
      case 'dots':
        return (
          <div className="flex gap-1">
            <div className={`${dotClass} bg-gray-400 animate-bounce`} style={{ animationDelay: '0ms' }} />
            <div className={`${dotClass} bg-gray-400 animate-bounce`} style={{ animationDelay: '150ms' }} />
            <div className={`${dotClass} bg-gray-400 animate-bounce`} style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      case 'pulse':
        return (
          <div className="flex gap-1">
            <div className={`${dotClass} bg-blue-500 animate-pulse`} />
            <div className={`${dotClass} bg-purple-500 animate-pulse`} style={{ animationDelay: '200ms' }} />
            <div className={`${dotClass} bg-blue-500 animate-pulse`} style={{ animationDelay: '400ms' }} />
          </div>
        );
      
      case 'wave':
        return (
          <div className="flex gap-0.5 items-end">
            <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-pulse h-3" style={{ animationDelay: '0ms' }} />
            <div className="w-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full animate-pulse h-4" style={{ animationDelay: '100ms' }} />
            <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-pulse h-5" style={{ animationDelay: '200ms' }} />
            <div className="w-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full animate-pulse h-4" style={{ animationDelay: '300ms' }} />
            <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-pulse h-3" style={{ animationDelay: '400ms' }} />
          </div>
        );
      
      case 'modern':
      default:
        return (
          <div className="flex gap-1.5">
            <div className={`${dotClass} bg-gradient-to-br from-blue-400 to-blue-600 animate-bounce shadow-sm`} style={{ animationDelay: '0ms' }} />
            <div className={`${dotClass} bg-gradient-to-br from-purple-400 to-purple-600 animate-bounce shadow-sm`} style={{ animationDelay: '150ms' }} />
            <div className={`${dotClass} bg-gradient-to-br from-blue-400 to-blue-600 animate-bounce shadow-sm`} style={{ animationDelay: '300ms' }} />
          </div>
        );
    }
  };

  return (
    <div className={`typing-indicator flex gap-4 items-start mb-6 animate-fadeIn ${className}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 mt-0.5">
          <Avatar
            src={avatarSrc}
            variant="assistant"
            status="thinking"
            showStatus={true}
            size="md"
          />
        </div>
      )}
      
      {/* Typing Animation */}
      <div className="message-content flex-1 max-w-[80%]">
        <div className={`
          message-bubble relative 
          ${getSizeClasses()}
          rounded-3xl rounded-bl-lg 
          bg-white dark:bg-gray-800/90 
          shadow-sm border border-gray-200/60 dark:border-gray-700/60 
          backdrop-blur-xl
        `}>
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 rounded-3xl rounded-bl-lg bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/10 dark:via-transparent dark:to-black/10" />
          
          <div className="relative flex items-center gap-3">
            {/* Typing dots */}
            <div className="typing-dots">
              {renderDots()}
            </div>
            
            {/* Typing message */}
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <span className="inline-block animate-pulse">{message}</span>
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
  );
};