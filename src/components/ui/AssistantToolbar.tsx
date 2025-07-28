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

  // Quick action suggestions
  const quickActions = [
    { icon: '✅', text: 'Create a task list', action: () => setCurrentInput('Create a task list for ') },
    { icon: '📝', text: 'Write an email', action: () => setCurrentInput('Help me write an email about ') },
    { icon: '🔍', text: 'Research topic', action: () => setCurrentInput('Research and summarize ') },
    { icon: '💡', text: 'Brainstorm ideas', action: () => setCurrentInput('Help me brainstorm ideas for ') },
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
          <span className="text-sm">🤖</span>
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
                <span className="text-lg">🤖</span>
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
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Assistant Coming Soon Notice */}
            <div className="flex flex-col">
              {/* Notice Area */}
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">🚧</div>
                <h3 className="text-lg font-semibold text-white mb-2">Assistant Coming Soon</h3>
                <p className="text-sm text-gray-400 mb-4">
                  The personal assistant feature is currently being redesigned. In the meantime, you can use our specialized widgets for specific tasks.
                </p>
                
                {/* Redirect to Main Widgets */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Try these instead:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs text-gray-300">Omni Widget</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <span className="text-sm">🧠</span>
                      <span className="text-xs text-gray-300">Knowledge</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <span className="text-sm">🎨</span>
                      <span className="text-xs text-gray-300">Dream</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/50 rounded text-left">
                      <span className="text-sm">🔍</span>
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