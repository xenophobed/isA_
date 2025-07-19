import React, { useState, useRef, KeyboardEvent } from 'react';
import { FileUpload } from './FileUpload';

export interface InputAreaLayoutProps {
  placeholder?: string;
  multiline?: boolean;
  maxRows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onBeforeSend?: (message: string) => string;
  onAfterSend?: (message: string) => void;
  onError?: (error: Error) => void;
  onFileSelect?: (files: FileList) => void;
  onSend?: (message: string, metadata?: Record<string, any>) => Promise<void>;
  suggestionsContent?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  config?: any;
}

/**
 * Standalone InputAreaLayout for main_app
 * Simplified version without SDK dependencies
 */
export const InputAreaLayout: React.FC<InputAreaLayoutProps> = ({
  placeholder,
  multiline,
  maxRows,
  disabled,
  autoFocus,
  onBeforeSend,
  onAfterSend,
  onError,
  onFileSelect,
  onSend,
  suggestionsContent,
  className = '',
  children,
  config
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick suggestion examples
  const suggestions = [
    'Create a blog post',
    'Generate an image', 
    'Analyze some data',
    'Process a document',
    'Research products'
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !onSend) return;

    let messageToSend = inputValue;
    console.log('📤 InputAreaLayout: Sending message:', messageToSend);

    // Apply onBeforeSend transformation if provided
    if (onBeforeSend) {
      messageToSend = onBeforeSend(messageToSend);
      console.log('📤 InputAreaLayout: After onBeforeSend:', messageToSend);
    }

    setIsLoading(true);
    
    try {
      console.log('📤 InputAreaLayout: Calling onSend with:', messageToSend);
      await onSend(messageToSend);
      setInputValue('');
      console.log('✅ InputAreaLayout: Message sent successfully');
      
      // Call onAfterSend if provided
      if (onAfterSend) {
        onAfterSend(messageToSend);
      }
    } catch (error) {
      console.error('❌ InputAreaLayout: Send failed:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Send failed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className={`isa-input-area-layout p-6 bg-black/20 backdrop-blur-xl border-t border-white/10 ${className}`}
      style={{
        padding: '1.5rem !important',
        background: 'rgba(0, 0, 0, 0.2) !important',
        backdropFilter: 'blur(12px) !important',
        borderTop: '1px solid rgba(255, 255, 255, 0.1) !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        borderBottom: 'none !important',
        display: 'flex !important',
        flexDirection: 'column',
        gap: '0.75rem !important'
      }}
    >
      {/* Suggestions Content */}
      {suggestionsContent && (
        <div className="isa-input-suggestions mb-4">
          {suggestionsContent}
        </div>
      )}
      
      {/* Main Input Area */}
      <div className="isa-input-area-main relative">
        <div className="flex gap-3 items-end">
          {/* File Upload Button */}
          <FileUpload
            onFileSelect={onFileSelect || (() => {})}
            accept="image/*,application/pdf,text/*"
            multiple={true}
            className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 14l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </FileUpload>
          
          {/* Suggestions Toggle Button */}
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`w-12 h-12 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 flex-shrink-0 ${
              showSuggestions 
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/50 shadow-lg shadow-blue-500/25' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Smart suggestions"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5L19 7l-1.5 1.5M5 17l1.5-1.5L5 14l1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          {/* Chat Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Type your message..."}
              disabled={disabled || isLoading}
              autoFocus={autoFocus}
              rows={1}
              style={{ 
                maxHeight: maxRows ? `${maxRows * 1.5}rem` : '6rem',
                resize: 'none'
              }}
              className="w-full p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all resize-none overflow-auto"
            />
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Suggestions Panel */}
        {showSuggestions && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 z-50">
            <div className="text-white text-sm font-medium mb-3">Quick Suggestions</div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSuggestionClick(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="text-left p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Additional Content */}
      {children && (
        <div className="isa-input-area-extra mt-4">
          {children}
        </div>
      )}
    </div>
  );
};