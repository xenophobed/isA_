import React, { useState } from 'react';
import { ChatContentLayout } from './ChatContentLayout';
import { InputAreaLayout } from '../input/InputAreaLayout';
import { useChatMessages, useChatActions } from '../../../stores/useAppStore';
import { useSimpleAI } from '../../../providers/SimpleAIProvider';

export interface ChatLayoutProps {
  headerContent?: React.ReactNode;
  showHeader?: boolean;
  sidebarContent?: React.ReactNode;
  showSidebar?: boolean;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: string | number;
  rightSidebarContent?: React.ReactNode;
  rightSidebarWidth?: string | number;
  inputSuggestionsContent?: React.ReactNode;
  conversationProps?: any;
  inputProps?: any;
  className?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: (fullscreen: boolean) => void;
  showRightSidebar?: boolean;
  sidebarMode?: 'exclusive' | 'inclusive';
  children?: React.ReactNode;
}

/**
 * Standalone ChatLayout component for main_app
 * Uses centralized useAppStore and SimpleAIProvider
 */
export const ChatLayout: React.FC<ChatLayoutProps> = ({
  headerContent,
  showHeader = true,
  sidebarContent,
  showSidebar = true,
  sidebarPosition = 'left',
  sidebarWidth = '16.67%',
  rightSidebarContent,
  rightSidebarWidth = '50%',
  inputSuggestionsContent,
  conversationProps = {},
  inputProps = {},
  className = '',
  fullscreen = false,
  onFullscreenToggle,
  showRightSidebar = false,
  sidebarMode = 'exclusive',
  children
}) => {
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  
  // Get shared AI client and chat actions
  const client = useSimpleAI();
  const chatActions = useChatActions();
  
  // Create a wrapper that includes the client
  const sendMessage = async (content: string, metadata?: Record<string, any>) => {
    console.log('📨 ChatLayout: sendMessage called with:', content);
    if (!client) {
      console.error('❌ ChatLayout: No AI client available');
      return;
    }
    console.log('📨 ChatLayout: Calling chatActions.sendMessage');
    await chatActions.sendMessage(content, client, metadata);
    console.log('✅ ChatLayout: chatActions.sendMessage completed');
  };
  
  // Handle exclusive sidebar logic
  const actualShowLeftSidebar = sidebarMode === 'exclusive' ? 
    (showSidebar && !showRightSidebar) : showSidebar;
    
  const actualShowRightSidebar = sidebarMode === 'exclusive' ? 
    (showRightSidebar) : showRightSidebar;
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    
    if (onFullscreenToggle) {
      onFullscreenToggle(newValue);
    }
  };
  
  // Format sidebar width to CSS value
  const formattedSidebarWidth = typeof sidebarWidth === 'number' 
    ? `${sidebarWidth}px` 
    : sidebarWidth;
    
  const formattedRightSidebarWidth = typeof rightSidebarWidth === 'number' 
    ? `${rightSidebarWidth}px` 
    : rightSidebarWidth;
  
  // Determine layout classes
  const layoutClass = `isa-chat-layout ${className} ${isFullscreen ? 'isa-fullscreen' : ''}`;
  const sidebarClass = `isa-chat-sidebar isa-sidebar-${sidebarPosition}`;
  const rightSidebarClass = 'isa-chat-sidebar isa-sidebar-right';
  
  return (
    <div className={`${layoutClass} flex flex-col h-screen text-white overflow-hidden`} style={{ background: 'transparent' }}>
      
      {showHeader && (
        <header className="isa-chat-header h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-10">
          {headerContent || (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-white">AI Agent SDK</h1>
                <p className="text-blue-200 text-sm">Smart Integration Platform</p>
              </div>
            </div>
          )}
        </header>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {actualShowLeftSidebar && sidebarContent && (
          <aside 
            className={`${sidebarClass} bg-black/20 backdrop-blur-xl border-r border-white/10 flex-shrink-0 order-1 z-10`}
            style={{ width: formattedSidebarWidth }}
          >
            {sidebarContent}
          </aside>
        )}
        
        <div className="flex-1 flex flex-col order-2">
          {/* Chat content area */}
          <ChatContentLayout 
            {...conversationProps}
            className="flex-1"
            messages={useChatMessages()}
          />
          
          {/* Input area */}
          <InputAreaLayout 
            placeholder={inputProps.placeholder}
            multiline={inputProps.multiline}
            maxRows={inputProps.maxRows}
            disabled={inputProps.disabled}
            autoFocus={inputProps.autoFocus}
            onBeforeSend={inputProps.onBeforeSend}
            onAfterSend={inputProps.onAfterSend}
            onError={inputProps.onError}
            onFileSelect={inputProps.onFileSelect}
            onSend={sendMessage}
            suggestionsContent={inputSuggestionsContent}
            className="isa-chat-input-area"
            config={inputProps.config ? { components: inputProps.config } : undefined}
          />
        </div>
        
        {actualShowRightSidebar && rightSidebarContent && (
          <aside 
            className={`${rightSidebarClass} bg-black/30 backdrop-blur-xl border-l border-white/10 flex-shrink-0 order-3 z-20`}
            style={{ width: formattedRightSidebarWidth }}
          >
            {rightSidebarContent}
          </aside>
        )}
      </div>
      
      {/* Render children for modals, overlays, etc. */}
      {children}
    </div>
  );
};