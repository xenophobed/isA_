/**
 * Avatar Component - User/AI profile images with status indicators
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'user' | 'assistant' | 'system';
  status?: 'online' | 'offline' | 'thinking' | 'typing';
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8', 
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const statusDotSize = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5', 
  lg: 'w-3 h-3',
  xl: 'w-4 h-4'
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  variant = 'user',
  status,
  showStatus = false,
  className = '',
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'user':
        return 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white';
      case 'assistant':
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50';
      case 'system':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      case 'thinking': return 'bg-blue-500 animate-pulse';
      case 'typing': return 'bg-purple-500 animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  const getFallbackIcon = () => {
    switch (variant) {
      case 'user':
        return (
          <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'assistant':
        return (
          <svg className="w-1/2 h-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl flex items-center justify-center overflow-hidden
          transition-all duration-300 hover:scale-105
          ${getVariantStyles()}
          ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        `}
        onClick={onClick}
      >
        {src ? (
          <img 
            src={src} 
            alt={alt || 'Avatar'} 
            className="w-full h-full object-cover"
          />
        ) : (
          getFallbackIcon()
        )}
      </div>
      
      {/* Status Indicator */}
      {showStatus && status && (
        <div className={`
          absolute -bottom-0.5 -right-0.5
          ${statusDotSize[size]}
          ${getStatusColor()}
          border-2 border-white dark:border-gray-800 rounded-full
        `} />
      )}
    </div>
  );
};