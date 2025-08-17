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
import { SmartWidgetSelector } from '../widgets/SmartWidgetSelector';

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
  
  // 🆕 Left Panel (会话管理)
  leftPanelContent?: React.ReactNode;
  showLeftPanel?: boolean;
  leftPanelWidth?: string | number;
  
  // 🆕 Right Panel (会话信息管理)
  rightPanelContent?: React.ReactNode;
  showRightPanel?: boolean;
  rightPanelWidth?: string | number;
  
  // 🆕 Right Sidebar (Widget 弹出, 现在支持半屏/全屏模式)
  rightSidebarContent?: React.ReactNode;
  showRightSidebar?: boolean;
  rightSidebarWidth?: string | number;
  rightSidebarMode?: 'half' | 'fullscreen'; // 新增模式支持
  
  // Legacy props (保持兼容性)
  sidebarContent?: React.ReactNode;
  showSidebar?: boolean;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: string | number;
  sidebarMode?: 'exclusive' | 'inclusive';
  
  inputSuggestionsContent?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: (fullscreen: boolean) => void;
  children?: React.ReactNode;
  
  // Data props - provided by modules
  messages?: ChatMessage[];
  isLoading?: boolean;
  isTyping?: boolean;
  
  // Event callbacks - handled by modules
  onSendMessage?: (content: string, metadata?: Record<string, any>) => Promise<void>;
  onSendMultimodal?: (content: string, files: File[], metadata?: Record<string, any>) => Promise<void>;
  onMessageClick?: (message: any) => void;
  
  // 🆕 Widget System Integration
  showWidgetSelector?: boolean;
  onCloseWidgetSelector?: () => void;
  onShowWidgetSelector?: () => void;
  onWidgetSelect?: (widgetId: string, mode: 'half' | 'full') => void;
  
  // 🆕 Full-screen widget support
  showFullScreenWidget?: boolean;
  fullScreenWidget?: React.ReactNode;
  onCloseFullScreenWidget?: () => void;
  
  // 🆕 Right Panel toggle callback
  onToggleRightPanel?: () => void;
  
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
  
  // 🆕 New 3-panel layout props
  leftPanelContent,
  showLeftPanel = true,
  leftPanelWidth = '16.67%',
  
  rightPanelContent,
  showRightPanel = false,
  rightPanelWidth = '16.67%',
  
  rightSidebarContent,
  showRightSidebar = false,
  rightSidebarWidth = '50%',
  rightSidebarMode = 'half',
  
  // Legacy props (for backward compatibility)
  sidebarContent,
  showSidebar = true,
  sidebarPosition = 'left',
  sidebarWidth = '16.67%',
  sidebarMode = 'exclusive',
  
  inputSuggestionsContent,
  conversationProps = {},
  inputProps = {},
  className = '',
  fullscreen = false,
  onFullscreenToggle,
  children,
  // Data props from modules
  messages = [],
  isLoading = false,
  isTyping = false,
  
  // Event callbacks from modules
  onSendMessage,
  onSendMultimodal,
  onMessageClick,
  
  // Widget System Integration
  showWidgetSelector = false,
  onCloseWidgetSelector,
  onShowWidgetSelector,
  onWidgetSelect,
  
  // Full-screen widget support
  showFullScreenWidget = false,
  fullScreenWidget,
  onCloseFullScreenWidget,
  
  // Right Panel toggle callback
  onToggleRightPanel
}) => {
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  
  // Optimized CSS Grid layout configuration
  const gridConfig = useMemo(() => {
    // Define grid template areas and columns based on layout state
    if (showRightSidebar) {
      // Widget mode: hide sidebars, show chat + widget
      return {
        templateAreas: '"chat widget"',
        templateColumns: '1fr 1fr',
        showLeftSidebar: false,
        showRightPanel: false
      };
    }
    
    // Normal mode: configurable sidebars
    const areas = [];
    const columns = [];
    
    if (showSidebar) {
      areas.push('left');
      columns.push('1fr'); // Left sidebar takes flexible space
    }
    
    areas.push('chat');
    // Chat area takes remaining space
    columns.push(showRightPanel ? '4fr' : (showSidebar ? '5fr' : '1fr')); // Proportional space
    
    if (showRightPanel) {
      areas.push('right');
      columns.push('1fr'); // Right panel takes flexible space
    }
    
    return {
      templateAreas: `"${areas.join(' ')}"`,
      templateColumns: columns.join(' '),
      showLeftSidebar: showSidebar,
      showRightPanel: showRightPanel
    };
  }, [showSidebar, showRightPanel, showRightSidebar]);

  // Backward compatibility: map legacy props to new props
  const effectiveLeftPanelContent = leftPanelContent || (sidebarPosition === 'left' ? sidebarContent : null);
  const effectiveShowLeftPanel = gridConfig.showLeftSidebar && (leftPanelContent || (sidebarPosition === 'left' && showSidebar));
  
  // Right sidebar mode determines overlay vs inline
  const isRightSidebarFullscreen = rightSidebarMode === 'fullscreen';
  const isRightSidebarOverlay = showRightSidebar;
  
  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    
    if (onFullscreenToggle) {
      onFullscreenToggle(newValue);
    }
  }, [isFullscreen, onFullscreenToggle]);
  
  // Layout classes
  const layoutClass = useMemo(() => 
    `isa-chat-layout ${className} ${isFullscreen ? 'isa-fullscreen' : ''}`,
    [className, isFullscreen]
  );
  
  // Responsive grid styles with mobile support
  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateAreas: gridConfig.templateAreas,
    gridTemplateColumns: gridConfig.templateColumns,
    gridTemplateRows: 'minmax(0, 1fr)',
    gap: 'var(--space-lg)',
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
    // Mobile responsiveness
    '@media (max-width: 768px)': {
      gridTemplateAreas: '"chat"',
      gridTemplateColumns: '1fr',
      gap: 'var(--space-sm)'
    }
  }), [gridConfig]);
  
  // 渲染全屏Widget模式 (从ThreeColumnLayout移植)
  if (showFullScreenWidget && fullScreenWidget) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        {/* 全屏Widget头部 */}
        <div className="h-12 bg-gray-800 border-b border-white/10 flex items-center justify-between px-4">
          <div className="text-white font-medium">Widget Full Screen Mode</div>
          <button
            onClick={onCloseFullScreenWidget}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 全屏Widget内容 */}
        <div className="h-[calc(100%-3rem)] overflow-hidden">
          {fullScreenWidget}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col h-full ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      {showHeader && headerContent && (
        <div className="flex-shrink-0 border-b border-white/10">
          {headerContent}
        </div>
      )}

      {/* CSS Grid Main Content Area */}
      <div style={gridStyles} className="flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        {gridConfig.showLeftSidebar && effectiveLeftPanelContent && (
          <div 
            className="border-r border-glass-border overflow-hidden"
            style={{ gridArea: 'left' }}
          >
            {effectiveLeftPanelContent}
          </div>
        )}

        {/* Center Chat Area */}
        <div 
          className="flex flex-col overflow-hidden min-w-0"
          style={{ gridArea: 'chat' }}
        >
          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatContentLayout
              messages={messages}
              isLoading={isLoading}
              isTyping={isTyping}
              onMessageClick={onMessageClick}
              {...conversationProps}
            />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-glass-border">
            <InputAreaLayout
              onSend={onSendMessage}
              onSendMultimodal={onSendMultimodal}
              onShowWidgetSelector={onShowWidgetSelector}
              showWidgetSelector={showWidgetSelector}
              {...inputProps}
            />
          </div>
        </div>

        {/* Right Sidebar (Widget Mode) */}
        {showRightSidebar && rightSidebarContent && (
          <div 
            className="border-l border-glass-border glass-tertiary overflow-hidden"
            style={{ gridArea: 'widget' }}
          >
            {rightSidebarContent}
          </div>
        )}

        {/* Right Panel (Session Management) */}
        {gridConfig.showRightPanel && rightPanelContent && (
          <div 
            className="border-l border-glass-border overflow-hidden w-full max-w-full"
            style={{ 
              gridArea: 'right',
              minWidth: 0,
              maxWidth: '100%'
            }}
          >
            <div className="w-full h-full overflow-hidden">
              {rightPanelContent}
            </div>
          </div>
        )}

        {/* Right Panel Toggle Button */}
        {!showRightSidebar && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
            <button
              onClick={onToggleRightPanel}
              className={`w-8 h-12 glass-secondary hover:glass-border-hover border-l border-t border-b border-glass-border rounded-l-lg layout-center text-white/70 hover:text-white transition-all shadow-lg hover:shadow-xl interactive ${
                showRightPanel ? '' : 'bg-primary/80 hover:bg-primary-hover/90'
              }`}
              title={showRightPanel ? 'Hide panel' : 'Show panel'}
              aria-label={showRightPanel ? 'Hide right panel' : 'Show right panel'}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-normal ${showRightPanel ? 'rotate-0' : 'rotate-180'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Smart Widget Selector Modal */}
      {showWidgetSelector && (
        <SmartWidgetSelector
          isOpen={showWidgetSelector}
          onClose={onCloseWidgetSelector || (() => {})}
          onWidgetSelect={onWidgetSelect || (() => {})}
        />
      )}
      
      {/* Full-screen Widget Mode */}
      {showFullScreenWidget && fullScreenWidget && (
        <div className="fixed inset-0 z-50 bg-gray-900">
          <div className="h-12 bg-gray-800 border-b border-white/10 flex items-center justify-between px-4">
            <div className="text-white font-medium">Widget Full Screen Mode</div>
            <button
              onClick={onCloseFullScreenWidget}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100%-3rem)] overflow-hidden">
            {fullScreenWidget}
          </div>
        </div>
      )}

      {/* Render children for modals, overlays, etc. */}
      {children}
    </div>
  );
});