/**
 * EmptyState Component - Welcome messages and empty states
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React from 'react';

export interface EmptyStateProps {
  variant?: 'welcome' | 'no-chats' | 'no-results' | 'error' | 'offline';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'welcome',
  title,
  description,
  icon,
  actions,
  suggestions = [],
  onSuggestionClick,
  className = ''
}) => {
  const getDefaultContent = () => {
    switch (variant) {
      case 'welcome':
        return {
          title: title || 'How can I help you today?',
          description: description || 'I\'m here to assist with coding, writing, analysis, and creative projects.',
          icon: icon || (
            <div className="relative mb-8">
              {/* Animated background circles */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-30 animate-pulse delay-150"></div>
              
              {/* Main avatar */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                
                {/* Floating particles */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-90 animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-200 rounded-full opacity-70 animate-bounce delay-300"></div>
              </div>
            </div>
          ),
          suggestions: suggestions.length > 0 ? suggestions : [
            'Help me write some code',
            'Explain a concept',
            'Analyze some data',
            'Creative brainstorming'
          ]
        };
        
      case 'no-chats':
        return {
          title: title || 'No conversations yet',
          description: description || 'Start a new conversation to begin chatting with AI.',
          icon: icon || (
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          )
        };
        
      case 'no-results':
        return {
          title: title || 'No results found',
          description: description || 'Try adjusting your search terms or filters.',
          icon: icon || (
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )
        };
        
      case 'error':
        return {
          title: title || 'Something went wrong',
          description: description || 'Please try refreshing the page or contact support if the problem persists.',
          icon: icon || (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )
        };
        
      case 'offline':
        return {
          title: title || 'You\'re offline',
          description: description || 'Check your internet connection and try again.',
          icon: icon || (
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636L5.636 18.364M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )
        };
        
      default:
        return { title: '', description: '', icon: null, suggestions: [] };
    }
  };

  const content = getDefaultContent();
  const finalSuggestions = content.suggestions || suggestions;

  return (
    <div className={`
      empty-state flex flex-col items-center justify-center
      px-8 py-16 text-center
      ${className}
    `}>
      
      {/* Icon */}
      {content.icon}
      
      {/* Title */}
      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
        {content.title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-sm mb-8">
        {content.description}
      </p>
      
      {/* Actions */}
      {actions && (
        <div className="mb-8">
          {actions}
        </div>
      )}
      
      {/* Suggestions */}
      {finalSuggestions.length > 0 && (
        <div className="w-full max-w-md">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {variant === 'welcome' ? 'Try asking about:' : 'Suggestions:'}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {finalSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="
                  px-4 py-2 
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-full
                  text-sm font-medium
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  hover:border-gray-300 dark:hover:border-gray-600
                  transition-all duration-200
                  hover:scale-105
                "
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Feature highlights for welcome state */}
      {variant === 'welcome' && (
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
      )}
    </div>
  );
};