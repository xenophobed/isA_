/**
 * ============================================================================
 * 聊天布局组件 (ChatLayout.tsx) - 纯UI布局组件
 * ============================================================================
 * 
 * 【核心职责】
 * - 提供聊天界面的纯UI布局结构和响应式设计
 * - 管理侧边栏显示状态和布局切换逻辑
 * - 协调各个UI区域的空间分配和视觉效果
 * - 处理界面交互事件的传递和路由
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - UI布局结构和响应式设计
 *   - 侧边栏显示和隐藏逻辑
 *   - CSS样式和视觉效果管理
 *   - 界面事件的传递和路由
 *   - 组件间的空间分配
 * 
 * ❌ 不负责：
 *   - 业务逻辑处理（由modules处理）
 *   - 数据状态管理（由stores处理）
 *   - AI客户端操作（由modules通过hooks处理）
 *   - 消息发送逻辑（由modules处理）
 *   - 认证和用户管理（由modules处理）
 * 
 * 【布局架构】
 * - Header: 应用头部导航
 * - Left Sidebar: 会话管理和历史
 * - Chat Content: 消息列表和显示
 * - Input Area: 消息输入和文件上传
 * - Right Sidebar: 应用功能和工具
 * 
 * 【数据流向】
 * props → UI渲染
 * UI事件 → callback props → modules → business logic
 */
import React, { useState, memo, useCallback, useMemo } from 'react';
import { ChatContentLayout } from './ChatContentLayout';
import { InputAreaLayout } from './InputAreaLayout';

// Pure interface - no dependency on stores
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
  isStreaming?: boolean;
  streamingStatus?: string;
}

export interface ChatLayoutProps {
  // Layout configuration
  headerContent?: React.ReactNode;
  showHeader?: boolean;
  sidebarContent?: React.ReactNode;
  showSidebar?: boolean;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: string | number;
  rightSidebarContent?: React.ReactNode;
  rightSidebarWidth?: string | number;
  inputSuggestionsContent?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: (fullscreen: boolean) => void;
  showRightSidebar?: boolean;
  sidebarMode?: 'exclusive' | 'inclusive';
  children?: React.ReactNode;
  
  // Data props - provided by modules
  messages?: ChatMessage[];
  isLoading?: boolean;
  isTyping?: boolean;
  
  // Event callbacks - handled by modules
  onSendMessage?: (content: string, metadata?: Record<string, any>) => Promise<void>;
  onSendMultimodal?: (content: string, files: File[], metadata?: Record<string, any>) => Promise<void>;
  
  // Configuration props - passed through from modules
  conversationProps?: any;
  inputProps?: any;
}

/**
 * Pure UI ChatLayout component
 * Receives all data and callbacks as props from modules
 * No direct business logic or state management
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
  children,
  // Data props from modules
  messages = [],
  isLoading = false,
  isTyping = false,
  
  // Event callbacks from modules
  onSendMessage,
  onSendMultimodal
}) => {
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  
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
    <div className={`${layoutClass} flex flex-col h-full text-white overflow-hidden`} style={{ background: 'transparent' }}>
      
      {showHeader && (
        <header className="isa-chat-header h-16 backdrop-blur-xl flex items-center justify-between px-6 z-10" style={{ background: 'var(--glass-primary)' }}>
          {headerContent || (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-secondary)', boxShadow: '0 0 20px var(--accent-soft)' }}>
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
      
      <div className="flex flex-1 overflow-hidden" style={{ height: showHeader ? 'calc(100% - 4rem)' : '100%' }}>
        {actualShowLeftSidebar && sidebarContent && (
          <aside 
            className={`${sidebarClass} backdrop-blur-xl flex-shrink-0 order-1 z-10`}
            style={{ width: formattedSidebarWidth, background: 'var(--glass-primary)' }}
          >
            {sidebarContent}
          </aside>
        )}
        
        <div className="flex-1 flex flex-col order-2">
          {/* Chat content area */}
          <ChatContentLayout 
            {...conversationProps}
            className="flex-1"
            messages={messages}
            isLoading={isLoading}
            isTyping={isTyping}
            onSendMessage={onSendMessage}
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
            onSend={onSendMessage}
            onSendMultimodal={onSendMultimodal}
            suggestionsContent={inputSuggestionsContent}
            config={inputProps.config ? { components: inputProps.config } : undefined}
          />
        </div>
        
        {actualShowRightSidebar && rightSidebarContent && (
          <aside 
            className={`${rightSidebarClass} backdrop-blur-xl flex-shrink-0 order-3 z-20`}
            style={{ width: formattedRightSidebarWidth, background: 'var(--glass-secondary)' }}
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