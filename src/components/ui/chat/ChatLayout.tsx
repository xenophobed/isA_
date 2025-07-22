/**
 * ============================================================================
 * 聊天布局组件 (ChatLayout.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 提供聊天界面的整体布局结构
 * - 集成聊天内容区域和输入区域
 * - 管理侧边栏显示和响应式布局
 * - 协调消息发送和文件上传功能
 * 
 * 【布局结构】
 * - Header: 应用头部
 * - Left Sidebar: 会话管理
 * - Chat Content: 消息显示区域
 * - Input Area: 消息输入区域
 * - Right Sidebar: 应用功能区
 * 
 * 【消息处理】
 * 第78行：调用 chatActions.sendMessage(content, client, enrichedMetadata)
 * 第98行：调用 chatActions.sendMultimodalMessage(content, files, client, enrichedMetadata)
 * 
 * 【重要】这里只是调用发送，不处理消息显示
 * 消息显示由 ChatContentLayout → ConversationStreamModule 处理
 */
import React, { useState, memo, useCallback, useMemo } from 'react';
import { ChatContentLayout } from './ChatContentLayout';
import { InputAreaLayout } from '../input/InputAreaLayout';
import { useChatMessages, useChatActions } from '../../../stores/useAppStore';
import { useSimpleAI } from '../../../providers/SimpleAIProvider';
import { useAuth } from '../../../hooks/useAuth';

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
export const ChatLayout = memo<ChatLayoutProps>(({
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
  
  // Get user info from Auth hook
  const { user } = useAuth();
  
  console.log('🔍 ChatLayout: client status:', client ? (client.isDestroyed() ? 'destroyed' : 'active') : 'null');
  
  // Create a wrapper that includes the client
  const sendMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    console.log('📨 ChatLayout: sendMessage called with:', content);
    if (!client) {
      console.error('❌ ChatLayout: No AI client available');
      return;
    }
    console.log('📨 ChatLayout: Calling chatActions.sendMessage');
    
    // Include user ID in metadata
    const enrichedMetadata = {
      ...metadata,
      user_id: user?.user_id || 'anonymous',
      session_id: metadata?.session_id || 'default'
    };
    
    await chatActions.sendMessage(content, client, enrichedMetadata);
    console.log('✅ ChatLayout: chatActions.sendMessage completed');
  }, [client, chatActions, user]);

  // Create multimodal wrapper for file uploads
  const sendMultimodalMessage = useCallback(async (content: string, files: File[], metadata?: Record<string, any>) => {
    console.log('📨 ChatLayout: sendMultimodalMessage called with:', content, files.length, 'files');
    if (!client) {
      console.error('❌ ChatLayout: No AI client available');
      return;
    }
    console.log('📨 ChatLayout: Calling chatActions.sendMultimodalMessage');
    
    // Include user ID in metadata
    const enrichedMetadata = {
      ...metadata,
      user_id: user?.user_id || 'anonymous',
      session_id: metadata?.session_id || 'default'
    };
    
    await chatActions.sendMultimodalMessage(content, files, client, enrichedMetadata);
    console.log('✅ ChatLayout: chatActions.sendMultimodalMessage completed');
  }, [client, chatActions, user]);
  
  // Handle exclusive sidebar logic
  const actualShowLeftSidebar = useMemo(() => 
    sidebarMode === 'exclusive' ? (showSidebar && !showRightSidebar) : showSidebar,
    [sidebarMode, showSidebar, showRightSidebar]
  );
    
  const actualShowRightSidebar = useMemo(() => 
    sidebarMode === 'exclusive' ? showRightSidebar : showRightSidebar,
    [sidebarMode, showRightSidebar]
  );
  
  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    
    if (onFullscreenToggle) {
      onFullscreenToggle(newValue);
    }
  }, [isFullscreen, onFullscreenToggle]);
  
  // Format sidebar width to CSS value
  const formattedSidebarWidth = useMemo(() => 
    typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth,
    [sidebarWidth]
  );
    
  const formattedRightSidebarWidth = useMemo(() => 
    typeof rightSidebarWidth === 'number' ? `${rightSidebarWidth}px` : rightSidebarWidth,
    [rightSidebarWidth]
  );
  
  // Determine layout classes
  const layoutClass = useMemo(() => 
    `isa-chat-layout ${className} ${isFullscreen ? 'isa-fullscreen' : ''}`,
    [className, isFullscreen]
  );
  
  const sidebarClass = useMemo(() => 
    `isa-chat-sidebar isa-sidebar-${sidebarPosition}`,
    [sidebarPosition]
  );
  
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
            onSendMultimodal={sendMultimodalMessage}
            suggestionsContent={inputSuggestionsContent}
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
});