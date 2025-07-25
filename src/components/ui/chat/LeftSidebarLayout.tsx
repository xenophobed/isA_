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

import React, { useState, memo, useCallback } from 'react';
import { ChatSession } from '../../../hooks/useSession';
import { UserButton } from '../user/UserButton';
import { UserPortal } from '../user/UserPortal';
import { UserHandler } from '../../core/userHandler';

export interface LeftSidebarLayoutProps {
  // Layout configuration
  className?: string;
  sidebarWidth?: string | number; // Pass sidebar width for UserPortal positioning
  
  // Data props - provided by SessionModule
  sessions?: ChatSession[];
  currentSessionId?: string;
  isLoadingSession?: boolean;
  
  // Event callbacks - handled by SessionModule
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  
  // Additional content
  children?: React.ReactNode;
}

/**
 * Pure UI LeftSidebarLayout component
 * Receives all data and callbacks as props from SessionModule
 * No direct business logic or state management
 */
export const LeftSidebarLayout = memo<LeftSidebarLayoutProps>(({
  className = '',
  sidebarWidth = '16.67%',
  sessions = [],
  currentSessionId = 'default',
  isLoadingSession = false,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  children
}) => {
  // Local UI state for editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  // User portal state
  const [showUserPortal, setShowUserPortal] = useState<boolean>(false);
  
  // UI state handlers
  const startRenameSession = useCallback((sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }, []);
  
  const saveRename = useCallback(() => {
    if (!editingSessionId || !editingTitle.trim()) return;
    
    onRenameSession?.(editingSessionId, editingTitle.trim());
    setEditingSessionId(null);
    setEditingTitle('');
  }, [editingSessionId, editingTitle, onRenameSession]);
  
  const cancelRename = useCallback(() => {
    setEditingSessionId(null);
    setEditingTitle('');
  }, []);
  
  // UI helpers
  const getSessionDisplayInfo = useCallback((session: ChatSession) => {
    const timeAgo = getTimeAgo(session.timestamp);
    const appsUsed = session.metadata?.apps_used || [];
    
    return {
      timeAgo,
      appsUsed: appsUsed.slice(0, 3), // Show max 3 apps
      hasMoreApps: appsUsed.length > 3
    };
  }, []);
  
  const getTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);
  
  const getAppIcon = useCallback((appId: string) => {
    const icons: Record<string, string> = {
      dream: '🎨',
      hunt: '🔍',
      omni: '⚡',
      digitalhub: '📁',
      assistant: '🤖',
      'data-scientist': '📊',
      doc: '📄'
    };
    return icons[appId] || '🔧';
  }, []);
  
  return (
    <div className={`session-sidebar ${className} h-full flex flex-col p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
        <button
          onClick={onNewSession}
          disabled={isLoadingSession}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
          title="New Chat Session"
        >
          {isLoadingSession ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          New
        </button>
      </div>
      
      {/* Sessions List */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {sessions.map((session) => {
          const displayInfo = getSessionDisplayInfo(session);
          const isActive = session.id === currentSessionId;
          
          return (
            <div
              key={session.id}
              onClick={() => onSessionSelect?.(session.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all group relative cursor-pointer ${
                isActive 
                  ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        className="text-sm font-medium bg-white/10 border border-white/20 rounded px-2 py-1 text-white w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div 
                        className={`text-sm font-medium truncate cursor-pointer ${
                          isActive ? 'text-blue-300' : 'text-white'
                        }`}
                        onDoubleClick={(e) => startRenameSession(session.id, session.title, e)}
                      >
                        {session.title}
                      </div>
                    )}
                    {isActive && editingSessionId !== session.id && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  
                  {editingSessionId !== session.id && (
                    <div className="text-gray-400 text-xs truncate mb-2">
                      {session.messages && session.messages.length > 0 
                        ? (() => {
                            const lastMsg = session.messages[session.messages.length - 1].content;
                            // Show only first 60 chars and handle very long messages efficiently
                            return lastMsg.length > 60 ? lastMsg.substring(0, 60) + '...' : lastMsg;
                          })()
                        : session.lastMessage
                      }
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{displayInfo.timeAgo}</span>
                    </div>
                    
                    {displayInfo.appsUsed.length > 0 && (
                      <div className="flex items-center gap-1">
                        {displayInfo.appsUsed.map((appId, index) => (
                          <span key={index} className="text-xs" title={appId}>
                            {getAppIcon(appId)}
                          </span>
                        ))}
                        {displayInfo.hasMoreApps && (
                          <span className="text-xs text-gray-400">+{displayInfo.appsUsed.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {session.id !== 'default' && editingSessionId !== session.id && (
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRenameSession(session.id, session.title, e)}
                      className="p-1 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300"
                      title="Rename session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession?.(session.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                      title="Delete session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-8 flex-1 flex items-center justify-center">
          <div>
            <div className="text-gray-400 text-sm">No sessions yet</div>
            <div className="text-gray-500 text-xs mt-1">Create your first chat session</div>
          </div>
        </div>
      )}
      
      {/* Session stats */}
      <div className="mt-auto pt-4 border-t border-white/10 flex-shrink-0">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Total Sessions: {sessions.length}</div>
          <div>Current: {sessions.find(s => s.id === currentSessionId)?.title || 'None'}</div>
        </div>
      </div>
      
      {/* User Section at Bottom */}
      <UserHandler>
        <div className="pt-4 border-t border-white/10 flex-shrink-0">
          <UserButton 
            onToggleDrawer={() => setShowUserPortal(!showUserPortal)}
            showDrawer={showUserPortal}
          />
        </div>
        
        {/* User Portal Modal */}
        <UserPortal
          isOpen={showUserPortal}
          onClose={() => setShowUserPortal(false)}
          sidebarWidth={sidebarWidth}
        />
      </UserHandler>
      
      {/* Additional content */}
      {children}
    </div>
  );
});