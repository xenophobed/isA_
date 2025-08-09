/**
 * ============================================================================
 * Assistant Toolbar (AssistantToolbar.tsx) - macOS-style Personal Assistant
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provides macOS-style toolbar assistant integration
 * - Custom UI designed specifically for toolbar/dropdown experience
 * - Personal task management and quick AI assistance
 * - Seamless header integration without BaseWidget dependency
 * 
 * Design Philosophy:
 * - Similar to macOS Control Center or Spotlight
 * - Quick access from anywhere in the application
 * - Minimal, focused interface for productivity
 * - Custom UI optimized for toolbar context
 */
import React, { useState, useRef, useEffect } from 'react';

// Glass Button Style Creator for Assistant Toolbar
const createGlassButtonStyle = (color: string, size: 'sm' | 'md' = 'md', isDisabled: boolean = false) => ({
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: `rgba(${color}, 0.1)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid rgba(${color}, 0.2)`,
  opacity: isDisabled ? 0.4 : 1,
  boxShadow: `0 2px 8px rgba(${color}, 0.15)`,
  width: size === 'sm' ? '20px' : '24px',
  height: size === 'sm' ? '20px' : '24px',
  color: `rgb(${color})`
});

const createGlassButtonHoverHandlers = (color: string, isDisabled: boolean = false) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      e.currentTarget.style.background = `rgba(${color}, 0.2)`;
      e.currentTarget.style.borderColor = `rgba(${color}, 0.4)`;
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.boxShadow = `0 4px 12px rgba(${color}, 0.25)`;
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      e.currentTarget.style.background = `rgba(${color}, 0.1)`;
      e.currentTarget.style.borderColor = `rgba(${color}, 0.2)`;
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = `0 2px 8px rgba(${color}, 0.15)`;
    }
  }
});

interface AssistantToolbarProps {
  className?: string;
}

export const AssistantToolbar: React.FC<AssistantToolbarProps> = ({ 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Cmd+K or Cmd+/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === '/')) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleAssistant = () => {
    setIsOpen(prev => !prev);
    setHasNewNotification(false);
  };

  // Quick action suggestions with glass buttons
  const quickActions = [
    { 
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      text: 'Create a task list', 
      action: () => setCurrentInput('Create a task list for '),
      color: '34, 197, 94'
    },
    { 
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      text: 'Write an email', 
      action: () => setCurrentInput('Help me write an email about '),
      color: '59, 130, 246'
    },
    { 
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      text: 'Research topic', 
      action: () => setCurrentInput('Research and summarize '),
      color: '236, 72, 153'
    },
    { 
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ), 
      text: 'Brainstorm ideas', 
      action: () => setCurrentInput('Help me brainstorm ideas for '),
      color: '251, 191, 36'
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Assistant Toolbar Button */}
      <button
        ref={buttonRef}
        onClick={() => {}} // Disabled
        className="relative flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-500 cursor-not-allowed opacity-60"
        title="Assistant (Coming Soon)"
        disabled
      >
        {/* Assistant Icon */}
        <div className="relative">
          <button
            style={createGlassButtonStyle('107, 114, 128', 'md', true)}
            disabled
            {...createGlassButtonHoverHandlers('107, 114, 128', true)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 12h-6m-6 0H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {hasNewNotification && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">Assistant</span>
          <svg 
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Assistant Dropdown/Modal */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" />
          
          {/* Dropdown Content */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-96 bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <button
                  style={createGlassButtonStyle('139, 92, 246', 'md')}
                  {...createGlassButtonHoverHandlers('139, 92, 246')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 12h-6m-6 0H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <div>
                  <h3 className="text-sm font-semibold text-white">Personal Assistant</h3>
                  <p className="text-xs text-gray-400">Your AI productivity companion</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="Close (Esc)"
                  style={createGlassButtonStyle('239, 68, 68', 'sm')}
                  {...createGlassButtonHoverHandlers('239, 68, 68')}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Assistant Coming Soon Notice */}
            <div className="flex flex-col">
              {/* Notice Area */}
              <div className="p-6 text-center">
                <button
                  style={createGlassButtonStyle('251, 191, 36', 'md')}
                  className="mb-4"
                  {...createGlassButtonHoverHandlers('251, 191, 36')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9.32 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 17H9l-1.8-2.3c-.2-.3-.2-.7 0-1L9 11v-1c0-2.8 2.2-5 5-5s5 2.2 5 5v1l1.8 2.7c.2.3.2.7 0 1L19 17H15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-white mb-2">Assistant Coming Soon</h3>
                <p className="text-sm text-gray-400 mb-4">
                  The personal assistant feature is currently being redesigned. In the meantime, you can use our specialized widgets for specific tasks.
                </p>
                
                {/* Redirect to Main Widgets */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Try these instead:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <button
                        style={createGlassButtonStyle('59, 130, 246', 'sm')}
                        {...createGlassButtonHoverHandlers('59, 130, 246')}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-xs text-gray-300">Omni Widget</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <button
                        style={createGlassButtonStyle('139, 92, 246', 'sm')}
                        {...createGlassButtonHoverHandlers('139, 92, 246')}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 8h8v8H8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        </svg>
                      </button>
                      <span className="text-xs text-gray-300">Knowledge</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <button
                        style={createGlassButtonStyle('236, 72, 153', 'sm')}
                        {...createGlassButtonHoverHandlers('236, 72, 153')}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          <path d="M20.2 7.8l-7.7 7.7-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 3h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-xs text-gray-300">Dream</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <button
                        style={createGlassButtonStyle('34, 197, 94', 'sm')}
                        {...createGlassButtonHoverHandlers('34, 197, 94')}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-xs text-gray-300">Hunt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with shortcuts */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-800/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span>⌘K to toggle</span>
                  <span>⌘Enter to send</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Ready</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};