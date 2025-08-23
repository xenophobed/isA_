/**
 * Modern Mobile Input Area Component
 * Following ChatGPT, Claude, Gemini input design patterns
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

// Simple SVG icon components
const Send = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const Paperclip = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

export interface ModernMobileInputAreaProps {
  onSendMessage?: (content: string, metadata?: Record<string, any>) => Promise<void>;
  onSendMultimodalMessage?: (content: string, files: File[], metadata?: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  keyboardHeight?: number;
  isNativeApp?: boolean;
  placeholder?: string;
  maxLength?: number;
  suggestions?: string[];
}

export const ModernMobileInputArea: React.FC<ModernMobileInputAreaProps> = ({
  onSendMessage,
  onSendMultimodalMessage,
  isLoading = false,
  keyboardHeight = 0,
  isNativeApp = false,
  placeholder = "Message AI Assistant...",
  maxLength = 2000,
  suggestions = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '20px'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 100; // Max ~4 lines
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    try {
      if (attachedFiles.length > 0) {
        await onSendMultimodalMessage?.(inputValue, attachedFiles);
      } else {
        await onSendMessage?.(inputValue);
      }
      
      setInputValue('');
      setAttachedFiles([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputValue, attachedFiles, isLoading, onSendMessage, onSendMultimodalMessage]);

  // Handle file attachment
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setInputValue(value);
      setShowSuggestions(value.length === 0);
    }
  }, [maxLength]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const canSend = inputValue.trim() || attachedFiles.length > 0;

  return (
    <div 
      className="
        modern-mobile-input-area relative
        bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl
        border-t border-gray-200/30 dark:border-gray-700/30
        px-5 py-4
        shadow-2xl shadow-black/5
      "
      style={{ 
        paddingBottom: isNativeApp ? Math.max(20, keyboardHeight) : 20,
        marginBottom: isNativeApp ? 'env(safe-area-inset-bottom)' : 0
      }}
    >
      {/* Premium glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/60 to-white/40 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 pointer-events-none" />
      <div className="relative z-10">

        {/* Premium Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2.5">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="
                  group inline-flex items-center gap-3 px-4 py-2.5
                  bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40
                  text-blue-700 dark:text-blue-300
                  text-sm font-medium rounded-2xl
                  border border-blue-200/60 dark:border-blue-700/60
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  backdrop-blur-sm
                  animate-slideIn
                "
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate max-w-24 text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
                <button
                  onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="
                    w-6 h-6 rounded-full 
                    bg-blue-500/10 dark:bg-blue-400/10
                    hover:bg-blue-500/20 dark:hover:bg-blue-400/20
                    flex items-center justify-center
                    transition-all duration-150
                    hover:scale-110 active:scale-95
                    group-hover:bg-red-500/10 group-hover:text-red-600 dark:group-hover:text-red-400
                  "
                >
                  <span className="text-sm leading-none">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Premium Input Container - Properly Aligned */}
        <div className="flex items-center gap-3">
          {/* Premium Attachment Button - Aligned to input height */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              group w-10 h-10 rounded-full flex items-center justify-center
              bg-gray-100 dark:bg-gray-800
              hover:bg-gray-200 dark:hover:bg-gray-700
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            "
            aria-label="Attach files"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
          </button>

          {/* Premium Input Field */}
          <div className="flex-1 relative group">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="
                w-full resize-none
                px-4 py-3 pr-12
                bg-gray-50 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-full text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
                text-base leading-5
              "
              style={{ 
                fontSize: 16,
                minHeight: 40,
                maxHeight: 120
              }}
              rows={1}
            />
            
            {/* Character Count */}
            {inputValue.length > maxLength * 0.8 && (
              <div className="absolute bottom-2 right-12 text-xs text-gray-400 dark:text-gray-500">
                {inputValue.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send Button - Aligned to input height */}
          <button
            onClick={handleSend}
            disabled={!canSend || isLoading}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-150 flex-shrink-0
              ${canSend && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};