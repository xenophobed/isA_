/**
 * ============================================================================
 * 会话模块 (SessionModule.tsx) - 会话管理的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理 SessionHook 和会话业务逻辑
 * - 协调 SessionHandler 事件和 Store 状态
 * - 处理 API 同步和数据一致性
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【架构流程】
 * SessionHistory UI → SessionHandler → SessionStore → SessionHook → SessionModule → Session UI
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - SessionHook 的管理和业务逻辑响应
 *   - API 同步策略和错误处理
 *   - 会话生命周期管理
 *   - 消息和工件的会话关联
 *   - 事件回调的业务逻辑处理
 * 
 * ❌ 不负责：
 *   - 用户事件处理（由SessionHandler处理）
 *   - 状态存储（由SessionStore处理）
 *   - 状态监听（由SessionHook处理）
 *   - UI渲染（由UI组件处理）
 * 
 * 【数据流向】
 * SessionHook (状态监听) → SessionModule (业务逻辑) → UI Components (纯展示)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { LeftSidebarLayout, LeftSidebarLayoutProps } from '../components/ui/chat/LeftSidebarLayout';
import { ChatSession } from '../stores/useSessionStore';
import { useAppStore } from '../stores/useAppStore';
import { useChatMessages, useChatActions } from '../stores/useChatStore';
import { useArtifactStore } from '../stores/useArtifactStore';
import { logger, LogCategory } from '../utils/logger';
import { useSessionHook, SessionHookCallbacks } from '../hooks/useSessionHook';
import { useSessionHandler } from '../components/core/SessionHandler';
import { useAuth0 } from '@auth0/auth0-react';

interface SessionModuleProps extends Omit<LeftSidebarLayoutProps, 'sessions' | 'currentSessionId' | 'onSessionSelect' | 'onNewSession' | 'onDeleteSession' | 'onRenameSession'> {
  // All LeftSidebarLayout props except the data and callback props that we'll provide from business logic
}

/**
 * Session Module - 会话业务逻辑管理模块
 * 
 * 管理 SessionHook 监听和业务逻辑处理
 * 协调用户事件、状态变化和API同步
 * 为UI组件提供纯数据和事件回调
 */
export const SessionModule: React.FC<SessionModuleProps> = (props) => {
  // ================================================================================
  // 认证和外部状态
  // ================================================================================
  
  const { user } = useAuth0();
  const { currentApp, startNewChat } = useAppStore();
  const messages = useChatMessages();
  const { addMessage: addChatMessage, clearMessages } = useChatActions();
  const { artifacts, setArtifacts } = useArtifactStore();
  
  // ================================================================================
  // SessionHandler 集成
  // ================================================================================
  
  const sessionHandler = useSessionHandler();
  
  // ================================================================================
  // SessionHook 业务逻辑回调
  // ================================================================================
  
  const sessionHookCallbacks: SessionHookCallbacks = {
    // 会话变化处理
    onSessionsChanged: useCallback((sessions: ChatSession[]) => {
      logger.debug(LogCategory.CHAT_FLOW, 'SessionModule: Sessions changed', {
        sessionCount: sessions.length
      });
    }, []),
    
    // 当前会话变化处理
    onCurrentSessionChanged: useCallback((session: ChatSession | undefined, previousSessionId?: string) => {
      logger.info(LogCategory.CHAT_FLOW, 'SessionModule: Current session changed', {
        previousSessionId,
        currentSessionId: session?.id,
        sessionTitle: session?.title
      });
      
      // 切换会话时加载对应的消息和工件
      if (session) {
        handleLoadSessionData(session);
      }
    }, []),
    
    // 会话创建处理
    onSessionCreated: useCallback((session: ChatSession) => {
      logger.info(LogCategory.CHAT_FLOW, 'SessionModule: Session created', {
        sessionId: session.id,
        title: session.title
      });
      
      // 如果用户已认证，尝试同步到API
      if (user?.sub && !session.metadata?.api_session_id) {
        handleSyncSessionToAPI(session);
      }
    }, [user?.sub]),
    
    // 会话选择处理
    onSessionSelected: useCallback((sessionId: string, session?: ChatSession) => {
      logger.info(LogCategory.CHAT_FLOW, 'SessionModule: Session selected', {
        sessionId,
        sessionTitle: session?.title
      });
      
      // 触发新对话状态
      if (session) {
        startNewChat();
      }
    }, [startNewChat]),
    
    // 同步状态变化处理
    onSyncStatusChanged: useCallback((status: string, error?: string | null) => {
      logger.debug(LogCategory.CHAT_FLOW, 'SessionModule: Sync status changed', {
        status,
        error
      });
      
      // 可以在这里处理同步状态UI反馈
      if (status === 'error' && error) {
        console.warn('Session sync failed:', error);
      }
    }, []),
    
    // 同步完成处理
    onSyncCompleted: useCallback((success: boolean, error?: string) => {
      if (success) {
        logger.info(LogCategory.CHAT_FLOW, 'SessionModule: Sync completed successfully');
      } else {
        logger.warn(LogCategory.CHAT_FLOW, 'SessionModule: Sync failed', { error });
      }
    }, [])
  };
  
  // ================================================================================
  // SessionHook 初始化
  // ================================================================================
  
  const sessionHookState = useSessionHook(sessionHookCallbacks, {
    enableSessionMonitoring: true,
    enableSyncMonitoring: true,
    enableLifecycleMonitoring: true,
    debounceMs: 100
  });
  
  const {
    sessions,
    currentSession,
    currentSessionId,
    sessionCount,
    isLoading,
    isSyncing,
    syncStatus,
    sessionActions
  } = sessionHookState;
  
  // ================================================================================
  // 业务逻辑方法
  // ================================================================================
  
  // 加载会话数据（消息和工件）
  const handleLoadSessionData = useCallback((session: ChatSession) => {
    try {
      // 清空当前消息
      clearMessages();
      
      // 加载会话消息
      if (session.messages && session.messages.length > 0) {
        session.messages.forEach(msg => {
          addChatMessage(msg);
        });
      }
      
      // 清空并加载工件
      setArtifacts([]);
      
      logger.debug(LogCategory.CHAT_FLOW, 'Session data loaded', {
        sessionId: session.id,
        messagesLoaded: session.messages?.length || 0
      });
    } catch (error) {
      logger.error(LogCategory.CHAT_FLOW, 'Failed to load session data', {
        sessionId: session.id,
        error
      });
    }
  }, [clearMessages, addChatMessage, setArtifacts]);
  
  // 同步会话到API
  const handleSyncSessionToAPI = useCallback(async (session: ChatSession) => {
    if (!user?.sub) return;
    
    try {
      await sessionActions.syncSessionToAPI(session, user.sub);
      logger.info(LogCategory.CHAT_FLOW, 'Session synced to API', {
        sessionId: session.id
      });
    } catch (error) {
      logger.warn(LogCategory.CHAT_FLOW, 'Failed to sync session to API', {
        sessionId: session.id,
        error
      });
    }
  }, [user?.sub, sessionActions]);
  
  // 更新当前会话数据
  const handleUpdateCurrentSession = useCallback(() => {
    if (!currentSession) return;
    
    const appsUsed = new Set(currentSession.metadata?.apps_used || []);
    if (currentApp) appsUsed.add(currentApp);
    
    // 优化消息存储
    const optimizedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content.length > 2000 ? msg.content.substring(0, 2000) + '...[truncated]' : msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));
    
    // 只保留最近50条消息
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
    
    sessionActions.updateCurrentSession(updatedSession);
    sessionActions.saveSessionsToStorage();
  }, [currentSession, currentApp, messages, artifacts, sessionActions]);
  
  // ================================================================================
  // UI事件处理器（连接SessionHandler）
  // ================================================================================
  
  const handleSessionSelect = useCallback((sessionId: string) => {
    // 保存当前会话数据
    handleUpdateCurrentSession();
    
    // 通过SessionHandler处理选择事件
    sessionHandler.handleSessionSelect({ sessionId });
  }, [handleUpdateCurrentSession, sessionHandler]);
  
  const handleNewSession = useCallback(() => {
    // 通过SessionHandler处理创建事件
    sessionHandler.handleSessionCreate({
      title: `Chat Session ${sessionCount + 1}`,
      metadata: {
        apps_used: [],
        total_messages: 0,
        last_activity: new Date().toISOString()
      }
    });
  }, [sessionHandler, sessionCount]);
  
  const handleDeleteSession = useCallback((sessionId: string) => {
    // 通过SessionHandler处理删除事件
    sessionHandler.handleSessionDelete({ sessionId });
  }, [sessionHandler]);
  
  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    // 通过SessionHandler处理重命名事件
    sessionHandler.handleSessionRename({ 
      sessionId, 
      newTitle: newTitle.trim() 
    });
  }, [sessionHandler]);
  
  // ================================================================================
  // 生命周期管理
  // ================================================================================
  
  // 初始化：加载会话数据
  useEffect(() => {
    const initializeSessions = async () => {
      if (user?.sub) {
        // 优先从API加载
        try {
          await sessionActions.loadSessionsFromAPI(user.sub);
        } catch (error) {
          // API失败，回退到localStorage
          sessionActions.loadSessionsFromStorage();
        }
      } else {
        // 未认证，从localStorage加载
        sessionActions.loadSessionsFromStorage();
      }
    };
    
    initializeSessions();
  }, [user?.sub, sessionActions]);
  
  // 监听消息和工件变化，自动更新当前会话
  useEffect(() => {
    if ((messages?.length || 0) > 0 || (artifacts?.length || 0) > 0) {
      handleUpdateCurrentSession();
    }
  }, [messages, artifacts, handleUpdateCurrentSession]);
  
  // ================================================================================
  // 调试信息
  // ================================================================================
  
  console.log('📦 SESSION_MODULE: Providing data to UI:', {
    sessionCount,
    currentSessionId,
    isLoading,
    isSyncing,
    syncStatus,
    messagesCount: messages?.length || 0,
    artifactsCount: artifacts?.length || 0
  });
  
  // ================================================================================
  // 渲染UI组件
  // ================================================================================
  
  return (
    <LeftSidebarLayout
      {...props}
      sessions={sessions}
      currentSessionId={currentSessionId}
      isLoadingSession={isLoading}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
    />
  );
};