/**
 * ============================================================================
 * 会话模块 (SessionModule.tsx) - 会话管理的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理会话相关的所有业务逻辑
 * - 管理会话的创建、删除、切换、重命名
 * - 处理会话数据的持久化存储
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 会话业务逻辑的统一管理
 *   - 会话数据的持久化和恢复
 *   - 会话状态变更的协调
 *   - 消息和工件的会话关联
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由LeftSidebarLayout处理）
 *   - 组件的直接渲染（由components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * main_app → SessionModule → LeftSidebarLayout
 * hooks → SessionModule → 事件回调 → stores → localStorage
 */

import React, { useCallback, useEffect } from 'react';
import { LeftSidebarLayout, LeftSidebarLayoutProps } from '../components/ui/chat/LeftSidebarLayout';
import { useSessions, useCurrentSession, useCurrentSessionId, useSessionCount, useIsLoadingSession, useSessionActions, ChatSession } from '../stores/useSessionStore';
import { useAppStore } from '../stores/useAppStore';
import { useChatMessages, useChatActions } from '../stores/useChatStore';
import { useArtifactStore } from '../stores/useArtifactStore';
import { logger, LogCategory } from '../utils/logger';

interface SessionModuleProps extends Omit<LeftSidebarLayoutProps, 'sessions' | 'currentSessionId' | 'onSessionSelect' | 'onNewSession' | 'onDeleteSession' | 'onRenameSession'> {
  // All LeftSidebarLayout props except the data and callback props that we'll provide from business logic
}

/**
 * Session Module - Business logic module for LeftSidebarLayout
 * 
 * This module:
 * - Uses useSession hook to get session state
 * - Handles all session management business logic
 * - Manages session persistence to localStorage
 * - Passes pure data and callbacks to LeftSidebarLayout
 * - Keeps LeftSidebarLayout as pure UI component
 */
export const SessionModule: React.FC<SessionModuleProps> = (props) => {
  // Get session state from useSessionStore
  const sessions = useSessions();
  const currentSession = useCurrentSession();
  const currentSessionId = useCurrentSessionId();
  const sessionCount = useSessionCount();
  const isLoadingSession = useIsLoadingSession();
  
  // Get session actions for business logic
  const {
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    updateCurrentSession,
    setLoadingSession,
    loadSessionsFromStorage,
    saveSessionsToStorage
  } = useSessionActions();
  
  // Get chat and artifact data from proper stores
  const messages = useChatMessages();
  const { addMessage: addChatMessage, clearMessages } = useChatActions();
  const { artifacts, setArtifacts } = useArtifactStore();
  
  // Get app state for session correlation
  const { currentApp, startNewChat } = useAppStore();
  
  console.log('📦 SESSION_MODULE: Providing data to LeftSidebarLayout:', {
    sessionCount,
    currentSessionId,
    isLoadingSession,
    messagesCount: messages?.length || 0,
    artifactsCount: artifacts?.length || 0
  });
  
  // Initialize sessions on mount
  useEffect(() => {
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);
  
  // Update current session when app state changes
  useEffect(() => {
    if ((messages?.length || 0) > 0 || (artifacts?.length || 0) > 0) {
      handleUpdateCurrentSession();
    }
  }, [messages, artifacts, currentApp]);
  
  
  
  // Business logic: Update current session with latest data
  const handleUpdateCurrentSession = useCallback(() => {
    if (!currentSession) return;
    
    const appsUsed = new Set(currentSession.metadata?.apps_used || []);
    if (currentApp) appsUsed.add(currentApp);
    
    // Optimize messages: only store essential data and truncate very long content
    const optimizedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content.length > 2000 ? msg.content.substring(0, 2000) + '...[truncated]' : msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));
    
    // Keep only last 50 messages to prevent memory bloat
    const recentMessages = optimizedMessages.slice(-50);
    
    const updatedSession: ChatSession = {
      ...currentSession,
      lastMessage: artifacts.length > 0 ? 
        `Generated ${artifacts[artifacts.length - 1].appName} content` : 
        (messages.length > 0 ? messages[messages.length - 1].content.substring(0, 100) + '...' : currentSession.lastMessage),
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      artifacts: artifacts.map(a => a.id),
      messages: recentMessages,
      metadata: {
        ...currentSession.metadata,
        apps_used: Array.from(appsUsed),
        total_messages: messages.length,
        last_activity: new Date().toISOString()
      }
    };
    
    updateCurrentSession(updatedSession);
    saveSessionsToStorage();
  }, [currentSession, currentApp, messages, artifacts, currentSessionId, sessions, updateCurrentSession, saveSessionsToStorage]);
  
  // Business logic: Handle new session creation
  const handleNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `Chat Session ${sessionCount + 1}`,
      lastMessage: 'New conversation started',
      timestamp: new Date().toISOString(),
      messageCount: 0,
      artifacts: [],
      messages: [],
      metadata: {
        apps_used: [],
        total_messages: 0,
        last_activity: new Date().toISOString()
      }
    };
    
    createSession(newSession);
    selectSession(newSession.id);
    saveSessionsToStorage();
    
    // Trigger new chat in the app
    startNewChat();
    
    logger.info(LogCategory.CHAT_FLOW, 'New session created', {
      sessionId: newSession.id,
      title: newSession.title
    });
  }, [sessionCount, sessions, createSession, selectSession, startNewChat, saveSessionsToStorage]);
  
  // Business logic: Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Save current session before switching
    if (currentSessionId !== sessionId) {
      handleUpdateCurrentSession();
    }
    
    setLoadingSession(true);
    
    try {
      selectSession(sessionId);
      
      // Load session messages and artifacts
      clearMessages();
      if (session.messages && session.messages.length > 0) {
        session.messages.forEach(msg => {
          addChatMessage(msg);
        });
      }
      
      // Load session artifacts
      setArtifacts([]);
      
      logger.info(LogCategory.CHAT_FLOW, 'Session selected', {
        sessionId: session.id,
        title: session.title,
        messageCount: session.messageCount,
        messagesLoaded: session.messages ? session.messages.length : 0
      });
    } finally {
      setLoadingSession(false);
    }
  }, [sessions, currentSessionId, handleUpdateCurrentSession, selectSession, clearMessages, setArtifacts, setLoadingSession, addChatMessage]);
  
  // Business logic: Handle session deletion
  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    saveSessionsToStorage();
    
    // If deleting current session, switch to first available
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        selectSession(remainingSessions[0].id);
      }
    }
    
    logger.info(LogCategory.CHAT_FLOW, 'Session deleted', { sessionId });
  }, [sessions, currentSessionId, deleteSession, selectSession, saveSessionsToStorage]);
  
  // Business logic: Handle session rename
  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    renameSession(sessionId, newTitle.trim());
    
    saveSessionsToStorage();
    
    logger.info(LogCategory.CHAT_FLOW, 'Session renamed', {
      sessionId,
      newTitle: newTitle.trim()
    });
  }, [sessions, renameSession, saveSessionsToStorage]);
  
  // Pass all data and business logic callbacks as props to pure UI component
  return (
    <LeftSidebarLayout
      {...props}
      sessions={sessions}
      currentSessionId={currentSessionId}
      isLoadingSession={isLoadingSession}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
    />
  );
};