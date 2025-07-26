/**
 * ============================================================================
 * Session Hook (useSessionHook.ts) - Session Store 状态监听 Hook
 * ============================================================================
 * 
 * 【核心职责】
 * - 监听 Session Store 的状态变化
 * - 提供响应式的 Session 数据和状态
 * - 封装 Session 相关的派生状态逻辑
 * - 为 SessionModule 提供数据和状态监听
 * 
 * 【架构流程】
 * SessionStore → SessionHook (监听变化) → SessionModule (业务逻辑) → UI Components
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Store 状态的响应式监听
 *   - 派生状态的计算和缓存
 *   - 状态变化的事件触发
 *   - 数据格式化和过滤
 * 
 * ❌ 不负责：
 *   - 业务逻辑处理（由 SessionModule 处理）
 *   - 用户事件处理（由 SessionHandler 处理）
 *   - API 调用（由 SessionStore 处理）
 *   - UI 渲染（由 UI 组件处理）
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  useSessions, 
  useCurrentSession, 
  useCurrentSessionId, 
  useSessionCount, 
  useIsLoadingSession,
  useSyncStatus,
  useIsSyncingToAPI,
  useLastSyncError,
  useSessionActions,
  ChatSession
} from '../stores/useSessionStore';
import { logger, LogCategory } from '../utils/logger';

// ================================================================================
// Hook 回调类型定义
// ================================================================================

export interface SessionHookCallbacks {
  // Session 变化事件
  onSessionsChanged?: (sessions: ChatSession[]) => void;
  onCurrentSessionChanged?: (session: ChatSession | undefined, previousSessionId?: string) => void;
  onSessionCountChanged?: (count: number, previousCount: number) => void;
  
  // 加载状态事件
  onLoadingStateChanged?: (isLoading: boolean) => void;
  onSyncStatusChanged?: (status: string, error?: string | null) => void;
  
  // Session 生命周期事件
  onSessionCreated?: (session: ChatSession) => void;
  onSessionDeleted?: (sessionId: string) => void;
  onSessionSelected?: (sessionId: string, session?: ChatSession) => void;
  onSessionRenamed?: (sessionId: string, newTitle: string, oldTitle?: string) => void;
  
  // 消息相关事件
  onMessageAdded?: (sessionId: string, message: any) => void;
  onMessagesCleared?: (sessionId: string) => void;
  
  // API 同步事件
  onSyncStarted?: () => void;
  onSyncCompleted?: (success: boolean, error?: string) => void;
  onSessionSynced?: (sessionId: string, apiSessionId: string) => void;
}

export interface SessionHookOptions {
  // 监听选项
  enableSessionMonitoring?: boolean;
  enableSyncMonitoring?: boolean;
  enableLifecycleMonitoring?: boolean;
  
  // 性能选项
  debounceMs?: number;
  enableDeepComparison?: boolean;
  
  // 过滤选项
  filterLocalSessions?: boolean;
  filterAPISessions?: boolean;
  filterSyncedSessions?: boolean;
}

export interface SessionHookState {
  // 基础数据
  sessions: ChatSession[];
  currentSession: ChatSession | undefined;
  currentSessionId: string;
  sessionCount: number;
  
  // 状态数据
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: string;
  lastSyncError: string | null;
  
  // 派生数据
  localSessions: ChatSession[];
  apiSessions: ChatSession[];
  syncedSessions: ChatSession[];
  unsyncedSessions: ChatSession[];
  
  // 统计数据
  stats: {
    totalSessions: number;
    localOnlySessions: number;
    syncedSessions: number;
    failedSyncSessions: number;
    lastActivity: string | null;
  };
}

// ================================================================================
// Session Hook 实现
// ================================================================================

export const useSessionHook = (
  callbacks?: SessionHookCallbacks,
  options: SessionHookOptions = {}
) => {
  // 默认选项
  const {
    enableSessionMonitoring = true,
    enableSyncMonitoring = true,
    enableLifecycleMonitoring = true,
    debounceMs = 100,
    enableDeepComparison = false,
    filterLocalSessions = false,
    filterAPISessions = false,
    filterSyncedSessions = false
  } = options;

  // Store 状态订阅
  const sessions = useSessions();
  const currentSession = useCurrentSession();
  const currentSessionId = useCurrentSessionId();
  const sessionCount = useSessionCount();
  const isLoading = useIsLoadingSession();
  const isSyncing = useIsSyncingToAPI();
  const syncStatus = useSyncStatus();
  const lastSyncError = useLastSyncError();
  const sessionActions = useSessionActions();

  // 前一次状态的引用
  const prevStateRef = useRef<{
    sessions: ChatSession[];
    currentSessionId: string;
    sessionCount: number;
    isLoading: boolean;
    syncStatus: string;
  }>({
    sessions: [],
    currentSessionId: '',
    sessionCount: 0,
    isLoading: false,
    syncStatus: 'idle'
  });

  // ================================================================================
  // 派生状态计算
  // ================================================================================

  const computeDerivedState = useCallback(() => {
    // 过滤不同类型的会话
    const localSessions = sessions.filter(session => 
      !session.metadata?.api_session_id
    );
    
    const apiSessions = sessions.filter(session => 
      session.metadata?.api_session_id
    );
    
    const syncedSessions = sessions.filter(session => 
      session.metadata?.sync_status === 'synced'
    );
    
    const unsyncedSessions = sessions.filter(session => 
      session.metadata?.sync_status === 'local_only' || 
      session.metadata?.sync_failed
    );

    // 计算统计数据
    const stats = {
      totalSessions: sessions.length,
      localOnlySessions: localSessions.length,
      syncedSessions: syncedSessions.length,
      failedSyncSessions: sessions.filter(s => s.metadata?.sync_failed).length,
      lastActivity: sessions.length > 0 
        ? sessions.reduce((latest, session) => 
            !latest || session.timestamp > latest ? session.timestamp : latest
          , null as string | null)
        : null
    };

    return {
      localSessions,
      apiSessions,
      syncedSessions,
      unsyncedSessions,
      stats
    };
  }, [sessions]);

  const derivedState = computeDerivedState();

  // ================================================================================
  // 状态变化监听
  // ================================================================================

  // 监听 Sessions 变化
  useEffect(() => {
    if (!enableSessionMonitoring) return;

    const prevSessions = prevStateRef.current.sessions;
    
    if (enableDeepComparison) {
      // 深度比较（性能较差但更准确）
      if (JSON.stringify(sessions) !== JSON.stringify(prevSessions)) {
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions changed (deep comparison)', {
          previousCount: prevSessions.length,
          currentCount: sessions.length
        });
        
        callbacks?.onSessionsChanged?.(sessions);
      }
    } else {
      // 浅层比较（仅比较数量和ID）
      if (sessions.length !== prevSessions.length || 
          sessions.some((s, i) => s.id !== prevSessions[i]?.id)) {
        
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions changed (shallow comparison)', {
          previousCount: prevSessions.length,
          currentCount: sessions.length
        });
        
        callbacks?.onSessionsChanged?.(sessions);
      }
    }

    prevStateRef.current.sessions = [...sessions];
  }, [sessions, enableSessionMonitoring, enableDeepComparison, callbacks]);

  // 监听当前会话变化
  useEffect(() => {
    if (!enableLifecycleMonitoring) return;

    const prevSessionId = prevStateRef.current.currentSessionId;
    
    if (currentSessionId !== prevSessionId) {
      logger.debug(LogCategory.CHAT_FLOW, 'Current session changed', {
        previousSessionId: prevSessionId,
        currentSessionId,
        sessionTitle: currentSession?.title
      });
      
      callbacks?.onCurrentSessionChanged?.(currentSession, prevSessionId);
      callbacks?.onSessionSelected?.(currentSessionId, currentSession);
    }

    prevStateRef.current.currentSessionId = currentSessionId;
  }, [currentSessionId, currentSession, enableLifecycleMonitoring, callbacks]);

  // 监听会话数量变化
  useEffect(() => {
    if (!enableSessionMonitoring) return;

    const prevCount = prevStateRef.current.sessionCount;
    
    if (sessionCount !== prevCount) {
      logger.debug(LogCategory.CHAT_FLOW, 'Session count changed', {
        previousCount: prevCount,
        currentCount: sessionCount
      });
      
      callbacks?.onSessionCountChanged?.(sessionCount, prevCount);
      
      // 检测新增或删除
      if (sessionCount > prevCount) {
        // 可能有新会话创建
        const newSessions = sessions.slice(prevCount);
        newSessions.forEach(session => {
          callbacks?.onSessionCreated?.(session);
        });
      }
    }

    prevStateRef.current.sessionCount = sessionCount;
  }, [sessionCount, sessions, enableSessionMonitoring, callbacks]);

  // 监听加载状态变化
  useEffect(() => {
    if (!enableSyncMonitoring) return;

    const prevLoading = prevStateRef.current.isLoading;
    
    if (isLoading !== prevLoading) {
      logger.debug(LogCategory.CHAT_FLOW, 'Loading state changed', {
        isLoading
      });
      
      callbacks?.onLoadingStateChanged?.(isLoading);
    }

    prevStateRef.current.isLoading = isLoading;
  }, [isLoading, enableSyncMonitoring, callbacks]);

  // 监听同步状态变化
  useEffect(() => {
    if (!enableSyncMonitoring) return;

    const prevSyncStatus = prevStateRef.current.syncStatus;
    
    if (syncStatus !== prevSyncStatus) {
      logger.debug(LogCategory.CHAT_FLOW, 'Sync status changed', {
        previousStatus: prevSyncStatus,
        currentStatus: syncStatus,
        error: lastSyncError
      });
      
      callbacks?.onSyncStatusChanged?.(syncStatus, lastSyncError);
      
      // 触发同步事件
      if (syncStatus === 'syncing' && prevSyncStatus !== 'syncing') {
        callbacks?.onSyncStarted?.();
      } else if (prevSyncStatus === 'syncing' && syncStatus !== 'syncing') {
        const success = syncStatus === 'success';
        callbacks?.onSyncCompleted?.(success, lastSyncError || undefined);
      }
    }

    prevStateRef.current.syncStatus = syncStatus;
  }, [syncStatus, lastSyncError, enableSyncMonitoring, callbacks]);

  // ================================================================================
  // 返回状态和方法
  // ================================================================================

  const hookState: SessionHookState = {
    // 基础数据
    sessions: filterLocalSessions ? derivedState.localSessions :
              filterAPISessions ? derivedState.apiSessions :
              filterSyncedSessions ? derivedState.syncedSessions : sessions,
    currentSession,
    currentSessionId,
    sessionCount,
    
    // 状态数据
    isLoading,
    isSyncing,
    syncStatus,
    lastSyncError,
    
    // 派生数据
    localSessions: derivedState.localSessions,
    apiSessions: derivedState.apiSessions,
    syncedSessions: derivedState.syncedSessions,
    unsyncedSessions: derivedState.unsyncedSessions,
    
    // 统计数据
    stats: derivedState.stats
  };

  // 便捷方法
  const methods = {
    // 获取特定会话
    getSessionById: (sessionId: string) => 
      sessions.find(session => session.id === sessionId),
    
    // 检查会话是否已同步
    isSessionSynced: (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      return session?.metadata?.sync_status === 'synced';
    },
    
    // 检查是否有未同步的会话
    hasUnsyncedSessions: () => derivedState.unsyncedSessions.length > 0,
    
    // 获取最近活动的会话
    getMostRecentSession: () => 
      sessions.length > 0 
        ? sessions.reduce((latest, session) => 
            session.timestamp > latest.timestamp ? session : latest
          )
        : undefined,
    
    // 刷新状态（强制重新计算）
    refresh: () => {
      logger.debug(LogCategory.CHAT_FLOW, 'SessionHook state refreshed');
      callbacks?.onSessionsChanged?.(sessions);
    }
  };

  return {
    ...hookState,
    ...methods,
    sessionActions
  };
};

export default useSessionHook;