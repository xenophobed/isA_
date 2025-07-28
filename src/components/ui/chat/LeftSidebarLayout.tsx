/**
 * ============================================================================
 * 左侧边栏布局组件 (LeftSidebarLayout.tsx) - 纯UI布局组件
 * ============================================================================
 * 
 * 【核心职责】
 * - 提供会话管理的纯UI布局结构和交互
 * - 管理会话列表的显示和编辑状态
 * - 处理界面交互事件的传递和路由
 * - 提供响应式的会话管理界面
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - UI布局结构和响应式设计
 *   - 会话列表的渲染和视觉效果
 *   - 交互状态管理（编辑、悬停等）
 *   - 界面事件的传递和路由
 *   - CSS样式和动画效果
 * 
 * ❌ 不负责：
 *   - 业务逻辑处理（由SessionModule处理）
 *   - 数据状态管理（由stores处理）
 *   - 会话的创建、删除逻辑（由SessionModule处理）
 *   - 数据持久化（由SessionModule处理）
 * 
 * 【数据流向】
 * props → UI渲染
 * UI事件 → callback props → SessionModule → business logic
 */

import React, { memo } from 'react';
import { SessionHistory } from '../session/SessionHistory';

export interface LeftSidebarLayoutProps {
  // Layout configuration
  className?: string;
  sidebarWidth?: string | number;
  
  // Data props - provided by SessionModule for SessionHistory
  sessions?: any[];
  currentSessionId?: string;
  isLoadingSession?: boolean;
  editingSessionId?: string | null;
  editingTitle?: string;
  
  // Event callbacks - passed to SessionHistory
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onStartRename?: (sessionId: string, currentTitle: string) => void;
  onCancelRename?: () => void;
  onEditingTitleChange?: (title: string) => void;
  
  // User content - provided by UserModule
  userContent?: React.ReactNode;
}

/**
 * Pure Layout Container - LeftSidebarLayout component
 * Only responsible for layout structure, delegates session UI to SessionHistory
 */
export const LeftSidebarLayout = memo<LeftSidebarLayoutProps>(({
  className = '',
  sidebarWidth = '16.67%',
  
  // Data props for SessionHistory
  sessions,
  currentSessionId,
  isLoadingSession,
  editingSessionId,
  editingTitle,
  
  // Event callbacks for SessionHistory
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onStartRename,
  onCancelRename,
  onEditingTitleChange,
  
  userContent
}) => {
  return (
    <div className={`session-sidebar ${className} h-full flex flex-col`}>
      {/* Session Area - Takes up most space */}
      <div className="flex-1 flex flex-col min-h-0">
        <SessionHistory
          // Pass all data props
          sessions={sessions}
          currentSessionId={currentSessionId}
          isLoading={isLoadingSession}
          editingSessionId={editingSessionId}
          editingTitle={editingTitle}
          
          // Pass all event callbacks
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onStartRename={onStartRename}
          onCancelRename={onCancelRename}
          onEditingTitleChange={onEditingTitleChange}
          
          className="flex-1 p-4"
        />
      </div>
      
      {/* User Area - 使用统一高度系统与输入区域对齐 */}
      <div 
        className="flex-shrink-0 border-t border-white/10 p-4 user-area-container" 
        style={{
          minHeight: 'var(--bottom-area-height)',
          maxHeight: 'var(--bottom-area-height)',
          background: 'var(--glass-primary)',
          backdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px var(--accent-soft)20'
        }}
      >
        <div className="h-full flex items-center justify-center">
          {userContent}
        </div>
      </div>
    </div>
  );
});