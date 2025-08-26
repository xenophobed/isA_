/**
 * GlassInput Component - Ultra-modern glassmorphism input field
 * Perfect for chat interfaces with glassmorphism design
 */
import React, { useState, useRef, useEffect } from 'react';

export interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'search' | 'textarea';
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rows?: number;
  maxRows?: number;
  autoResize?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: () => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
  success = false,
  icon,
  iconPosition = 'left',
  rows = 1,
  maxRows = 10,
  autoResize = false,
  className = '',
  onFocus,
  onBlur,
  onEnter
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (autoResize && type === 'textarea' && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24;
      const maxHeight = lineHeight * maxRows;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value, autoResize, maxRows, type]);

  const getStateStyles = () => {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (error) {
      return `
        ${isDark ? 'bg-red-500/10' : 'bg-red-50/80'}
        border-red-500/50 ring-red-500/20
        focus:border-red-500/70 focus:ring-red-500/30
      `;
    }
    
    if (success) {
      return `
        ${isDark ? 'bg-green-500/10' : 'bg-green-50/80'}
        border-green-500/50 ring-green-500/20
        focus:border-green-500/70 focus:ring-green-500/30
      `;
    }
    
    return `
      ${isDark ? 'bg-white/10' : 'bg-white/30'}
      border-white/20 dark:border-white/10
      focus:border-blue-500/50 focus:ring-blue-500/20
      ${isFocused ? 'bg-white/15 dark:bg-white/15' : ''}
    `;
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  const baseStyles = `
    glass-input
    w-full backdrop-blur-md
    border rounded-xl
    transition-all duration-300 ease-out
    placeholder-gray-500/70 dark:placeholder-gray-400/70
    text-gray-800 dark:text-gray-100
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    ${getStateStyles()}
  `;

  const inputStyles = `
    px-4 py-3
    ${icon && iconPosition === 'left' ? 'pl-12' : ''}
    ${icon && iconPosition === 'right' ? 'pr-12' : ''}
  `;

  const textareaStyles = `
    px-4 py-3 resize-none
    ${icon && iconPosition === 'left' ? 'pl-12' : ''}
    ${icon && iconPosition === 'right' ? 'pr-12' : ''}
    ${autoResize ? 'overflow-hidden' : ''}
  `;

  return (
    <div className={`glass-input-container relative ${className}`}>
      
      {/* Input or Textarea */}
      {type === 'textarea' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${baseStyles} ${textareaStyles}`}
          style={{
            minHeight: `${rows * 24 + 24}px`,
            maxHeight: autoResize ? `${maxRows * 24 + 24}px` : undefined
          }}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseStyles} ${inputStyles}`}
        />
      )}

      {/* Icon */}
      {icon && (
        <div className={`
          absolute top-1/2 transform -translate-y-1/2
          text-gray-500/70 dark:text-gray-400/70
          ${iconPosition === 'left' ? 'left-4' : 'right-4'}
        `}>
          {icon}
        </div>
      )}

      {/* Glass Overlay Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />
      
      {/* Focus Ring Enhancement */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-blue-400/30 dark:ring-purple-400/30 pointer-events-none" />
      )}
    </div>
  );
};