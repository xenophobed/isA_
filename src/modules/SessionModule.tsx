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
import { useAppStore } from '../stores/useAppStore';
import { useChatMessages, useChatActions, useChatStore } from '../stores/useChatStore';
import { useArtifactStore } from '../stores/useArtifactStore';
import { 
  useDreamActions, 
  useHuntActions, 
  useOmniActions, 
  useDataScientistActions, 
  useKnowledgeActions 
} from '../stores/useWidgetStores';
import { useAuth } from '../hooks/useAuth';
import { logger, LogCategory } from '../utils/logger';
import { useSessionHandler } from '../components/core/SessionHandler';
// 直接使用useSessionStore，不再依赖SessionProvider
import { ChatSession } from '../hooks/useSession'; // 只导入类型
import { 
  useCurrentSessionId,
  useCurrentSession, // 使用store版本
  useSessions, // 使用store版本
  useSessionCount,
  useIsLoadingSession,
  useIsSyncingToAPI,
  useSyncStatus,
  useLastSyncError,
  useSessionCRUDActions,
  useSessionStorageActions,
  useSessionAPIActions
} from '../stores/useSessionStore';

interface SessionModuleProps extends Omit<LeftSidebarLayoutProps, 'sessions' | 'currentSessionId' | 'onSessionSelect' | 'onNewSession' | 'onDeleteSession' | 'onRenameSession'> {
  // All LeftSidebarLayout props except the data and callback props that we'll provide from business logic
  // Include userContent to be passed through to LeftSidebarLayout
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
  
  // 防止重复点击的状态锁
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Rename UI state management
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const { auth0User, getAuthHeaders, isAuthenticated } = useAuth();
  const { currentApp, startNewChat, setTriggeredAppInput, closeApp } = useAppStore();
  const messages = useChatMessages();
  const { addMessage: addChatMessage, clearMessages } = useChatActions();
  const { artifacts, setArtifacts } = useArtifactStore();
  
  // Widget store actions for state cleanup when switching sessions
  const dreamActions = useDreamActions();
  const huntActions = useHuntActions();
  const omniActions = useOmniActions();
  const dataScientistActions = useDataScientistActions();
  const knowledgeActions = useKnowledgeActions();
  
  // ================================================================================
  // SessionHandler 集成
  // ================================================================================
  
  const sessionHandler = useSessionHandler();
  
  // ================================================================================
  // 直接使用Store Selectors - 避免SessionHook的循环依赖
  // ================================================================================
  
  // 直接订阅store状态，避免SessionHook的复杂性和循环依赖
  const sessions = useSessions();
  const currentSession = useCurrentSession();
  const currentSessionId = useCurrentSessionId();
  const sessionCount = useSessionCount();
  const isLoading = useIsLoadingSession();
  const isSyncing = useIsSyncingToAPI();
  const syncStatus = useSyncStatus();
  const lastSyncError = useLastSyncError();
  
  // Use selective action hooks for better performance
  const sessionCRUDActions = useSessionCRUDActions();
  const sessionStorageActions = useSessionStorageActions();
  const sessionAPIActions = useSessionAPIActions();
  
  // ================================================================================
  // 业务逻辑方法
  // ================================================================================
  
  // 加载会话数据（消息和工件）
  const handleLoadSessionData = useCallback((session: ChatSession) => {
    try {
      // 使用新的loadMessagesFromSession方法，直接从session加载消息
      const { loadMessagesFromSession } = useChatStore.getState();
      loadMessagesFromSession(session.id);
      
      // 清空并加载工件
      setArtifacts([]);
      
      logger.debug(LogCategory.CHAT_FLOW, 'Session data loaded via loadMessagesFromSession', {
        sessionId: session.id,
        messagesLoaded: session.messages?.length || 0
      });
    } catch (error) {
      logger.error(LogCategory.CHAT_FLOW, 'Failed to load session data', {
        sessionId: session.id,
        error
      });
    }
  }, [setArtifacts]);
  
  // 同步会话到API
  const handleSyncSessionToAPI = useCallback(async (session: ChatSession) => {
    if (!auth0User?.sub) return;
    
    // TODO: Implement API sync when needed
    // For now, just log that sync would happen
    logger.info(LogCategory.CHAT_FLOW, 'Session sync to API (simplified)', {
      sessionId: session.id,
      userId: auth0User.sub
    });
  }, [auth0User?.sub]);
  
  // 更新当前会话数据
  const handleUpdateCurrentSession = useCallback(() => {
    if (!currentSession) return;
    
    const appsUsed = new Set(currentSession.metadata?.apps_used || []);
    if (currentApp) appsUsed.add(currentApp);
    
    // 优化消息存储 - 确保所有消息都标记为已处理
    const optimizedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: ('content' in msg && msg.content) ? (msg.content.length > 2000 ? msg.content.substring(0, 2000) + '...[truncated]' : msg.content) : '',
      timestamp: msg.timestamp || new Date().toISOString(),
      metadata: ('metadata' in msg) ? msg.metadata : undefined,
      processed: true // 重要：确保保存到会话的消息都标记为已处理
    }));
    
    // 只保留最近50条消息
    const recentMessages = optimizedMessages.slice(-50);
    
    // 获取最后一条消息内容作为会话摘要
    let lastMessageContent = currentSession.lastMessage;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const content = ('content' in lastMessage && lastMessage.content) ? lastMessage.content : '';
      if (lastMessage.role === 'assistant' && content) {
        // 如果最后一条是AI回复，使用AI回复作为摘要
        lastMessageContent = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      } else if (lastMessage.role === 'user') {
        // 如果最后一条是用户消息，显示"等待回复"
        lastMessageContent = `${content.substring(0, 50)}${content.length > 50 ? '...' : ''} (等待回复)`;
      }
    } else if (artifacts.length > 0) {
      lastMessageContent = `Generated ${artifacts[artifacts.length - 1].appName} content`;
    }
    
    const updatedSession: ChatSession = {
      ...currentSession,
      lastMessage: lastMessageContent,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      artifacts: artifacts.map(a => a.id),
      messages: recentMessages as any, // TODO: Fix type compatibility
      metadata: {
        ...currentSession.metadata,
        apps_used: Array.from(appsUsed),
        total_messages: messages.length,
        last_activity: new Date().toISOString()
      }
    };
    
    sessionCRUDActions.updateSession(updatedSession);
    sessionStorageActions.saveToStorage();
    
    logger.debug(LogCategory.CHAT_FLOW, 'Current session updated', {
      sessionId: currentSession.id,
      messageCount: messages.length,
      recentMessagesCount: recentMessages.length
    });
  }, [currentSession, currentApp, messages, artifacts, sessionCRUDActions, sessionStorageActions]);
  
  // ================================================================================
  // UI事件处理器（连接SessionHandler）
  // ================================================================================
  
  const handleSessionSelect = useCallback((sessionId: string) => {
    // 如果选择的是当前会话，不需要处理
    if (sessionId === currentSessionId) return;
    
    // 保存当前会话数据
    handleUpdateCurrentSession();
    
    // 清理状态 - 防止会话间状态污染
    setTriggeredAppInput(''); // 清理触发的输入
    closeApp(); // 关闭当前打开的应用
    
    // 清理所有widget状态，防止跨会话的状态污染
    dreamActions.clearDreamData?.();
    huntActions.clearHuntData?.();
    omniActions.clearOmniData?.();
    dataScientistActions.clearDataScientistData?.();
    knowledgeActions.clearKnowledgeData?.();
    
    // 通过SessionHandler处理选择事件
    sessionHandler.handleSessionSelect({ sessionId });
    
    // 加载选中会话的数据
    const selectedSession = sessions.find((s: ChatSession) => s.id === sessionId);
    if (selectedSession) {
      handleLoadSessionData(selectedSession);
      // 移除 startNewChat() 调用，因为这会重置聊天状态并可能触发新的API调用
      // startNewChat(); // 这行代码导致了重复API调用的问题
    }
    
    logger.info(LogCategory.CHAT_FLOW, 'Session switched with state cleanup', {
      from: currentSessionId,
      to: sessionId,
      messagesLoaded: selectedSession?.messages?.length || 0
    });
  }, [
    currentSessionId, 
    handleUpdateCurrentSession, 
    setTriggeredAppInput, 
    closeApp,
    dreamActions, 
    huntActions, 
    omniActions, 
    dataScientistActions, 
    knowledgeActions,
    sessionHandler, 
    sessions, 
    handleLoadSessionData
    // 移除 startNewChat 依赖
  ]);
  
  const handleNewSession = useCallback(() => {
    // 防止重复点击
    if (isCreatingSession) {
      logger.warn(LogCategory.CHAT_FLOW, 'Session creation already in progress, skipping');
      return;
    }
    
    // 防抖：检查是否刚刚创建了一个会话（1秒内）
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && (Date.now() - new Date(lastSession.timestamp).getTime()) < 1000) {
      logger.warn(LogCategory.CHAT_FLOW, 'Session creation too frequent, skipping');
      return;
    }
    
    setIsCreatingSession(true);
    
    // 创建会话 - createSession会返回完整的session对象
    const newSession = sessionCRUDActions.createSession(`Chat Session ${sessionCount + 1}`);
    
    // 手动保存到localStorage
    sessionStorageActions.saveToStorage();
    
    // 如果用户已认证，尝试同步到API
    if (auth0User?.sub && !newSession.metadata?.api_session_id) {
      handleSyncSessionToAPI(newSession);
    }
    
    // 不要调用SessionHandler.handleSessionCreate，因为我们已经直接创建了session
    // sessionHandler.handleSessionCreate只是为了其他监听器，但会导致重复创建
    
    // 重置创建状态锁
    setTimeout(() => setIsCreatingSession(false), 500);
  }, [sessionCount, sessionCRUDActions, sessionStorageActions, auth0User?.sub, isCreatingSession, sessions, handleSyncSessionToAPI]);
  
  const handleDeleteSession = useCallback((sessionId: string) => {
    // 使用store actions删除会话
    sessionCRUDActions.deleteSession(sessionId);
    
    // 如果删除的是当前会话，切换到默认会话或第一个会话
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter((s: ChatSession) => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        sessionCRUDActions.selectSession(remainingSessions[0].id);
      } else {
        // 如果没有会话了，创建一个默认会话，但避免重复创建
        setTimeout(() => {
          if (sessions.length === 0) { // 再次检查确保没有会话
            handleNewSession();
          }
        }, 0);
        return; // 避免重复保存
      }
    }
    
    // 手动保存到localStorage
    sessionStorageActions.saveToStorage();
    
    // 通过SessionHandler处理删除事件（可选，用于其他监听器）
    sessionHandler.handleSessionDelete({ sessionId });
  }, [sessionHandler, sessionCRUDActions, sessionStorageActions, currentSessionId, sessions, handleNewSession]);
  
  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    // 找到要重命名的会话
    const sessionToUpdate = sessions.find((s: ChatSession) => s.id === sessionId);
    if (!sessionToUpdate) return;
    
    // 使用store actions更新会话
    const updatedSession = { ...sessionToUpdate, title: newTitle.trim() };
    sessionCRUDActions.updateSession(updatedSession);
    
    // 手动保存到localStorage
    sessionStorageActions.saveToStorage();
    
    // Clear editing state
    setEditingSessionId(null);
    setEditingTitle('');
    
    // 通过SessionHandler处理重命名事件（可选，用于其他监听器）
    sessionHandler.handleSessionRename({ 
      sessionId, 
      newTitle: newTitle.trim() 
    });
  }, [sessionHandler, sessionCRUDActions, sessionStorageActions, sessions]);

  const handleStartRename = useCallback((sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingSessionId(null);
    setEditingTitle('');
  }, []);

  const handleEditingTitleChange = useCallback((title: string) => {
    setEditingTitle(title);
  }, []);
  
  // ================================================================================
  // 生命周期管理 - 修复无限循环问题
  // ================================================================================
  
  // 仅在组件挂载时初始化一次，移除可能导致循环的依赖
  useEffect(() => {
    console.log('🗂️ SessionModule: Initializing sessions (mount only)');
    
    // 从localStorage加载会话（内部已包含去重逻辑）
    sessionStorageActions.loadFromStorage();
    
    // 不需要立即保存，loadFromStorage 内部会处理
    // setTimeout(() => {
    //   sessionStorageActions.saveToStorage();
    // }, 100);
  }, []); // 空依赖数组，只在挂载时执行一次
  
  // 当用户认证状态变化时，初始化Session API认证
  useEffect(() => {
    if (isAuthenticated && auth0User?.sub) {
      // TODO: Initialize API auth when needed
      // For now, just log authentication
      logger.info(LogCategory.CHAT_FLOW, 'Session store authenticated for user (simplified)', {
        userId: auth0User.sub
      });
    }
  }, [isAuthenticated, auth0User?.sub, getAuthHeaders]); // 移除sessionActions依赖
  
  // 移除：自动保存逻辑不再需要，因为useChatStore.addMessage已经自动同步到session了
  // 这个useEffect导致了无限循环，因为messages现在来自currentSession.messages
  
  // 新增：当session加载完成后，自动加载当前session的消息到chat store
  useEffect(() => {
    console.log('🔍 SessionModule: Auto-load effect triggered', {
      isLoading,
      sessionsLength: sessions.length,
      hasCurrentSession: !!currentSession,
      currentSessionId: currentSession?.id,
    });
    
    // 当sessions加载完成且有当前session时，自动加载消息
    if (!isLoading && currentSession) {
      console.log('📋 SessionModule: Auto-loading current session messages', {
        sessionId: currentSession.id,
        sessionMessageCount: currentSession.messages?.length || 0
      });
      
      // 使用延迟加载，防止立即触发状态更新循环
      setTimeout(() => {
        const { loadMessagesFromSession } = useChatStore.getState();
        loadMessagesFromSession(currentSession.id);
      }, 0);
    }
  }, [isLoading, currentSession?.id]);
  
  // 移除：不再需要复杂的消息加载逻辑，因为现在使用统一的loadMessagesFromSession
  
  // 新增：处理session store初始化延迟的问题
  useEffect(() => {
    // 如果sessions已加载但没有currentSession，强制选择第一个
    if (!isLoading && sessions.length > 0 && !currentSession) {
      console.log('⚠️ SessionModule: Sessions loaded but no current session, selecting first', {
        sessionsLength: sessions.length,
        firstSessionId: sessions[0]?.id
      });
      
      const firstSession = sessions[0];
      if (firstSession) {
        // 使用延迟选择，防止立即触发状态更新循环
        setTimeout(() => {
          sessionCRUDActions.selectSession(firstSession.id);
        }, 0);
      }
    }
  }, [isLoading, sessions.length, currentSession, sessionCRUDActions]);
  
  // 移除自动保存逻辑，改为手动保存
  // 这样可以避免频繁的重渲染和循环依赖
  
  // ================================================================================
  // 调试信息
  // ================================================================================
  
  // 移除调试日志以减少性能影响
  
  // ================================================================================
  // 渲染UI组件
  // ================================================================================
  
  return (
    <LeftSidebarLayout
      {...props}
      sessions={sessions}
      currentSessionId={currentSessionId}
      isLoadingSession={isLoading || isCreatingSession}
      editingSessionId={editingSessionId}
      editingTitle={editingTitle}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
      onStartRename={handleStartRename}
      onCancelRename={handleCancelRename}
      onEditingTitleChange={handleEditingTitleChange}
      userContent={props.userContent}
    />
  );
};