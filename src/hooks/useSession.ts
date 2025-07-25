/**
 * ============================================================================
 * Session Hook (useSession.ts) - 会话状态监听钩子
 * ============================================================================
 * 
 * 【核心职责】
 * - 监听和获取会话相关的状态数据
 * - 提供会话状态的响应式接口
 * - 连接业务逻辑模块和状态管理器
 * - 不包含业务逻辑，仅负责状态监听
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 从stores获取会话状态数据
 *   - 提供响应式的状态接口
 *   - 状态变化的监听和通知
 *   - 状态选择器的封装
 * 
 * ❌ 不负责：
 *   - 会话的创建、删除、切换逻辑（由SessionModule处理）
 *   - UI组件的渲染（由LeftSidebarLayout处理）
 *   - 数据持久化逻辑（由SessionModule处理）
 *   - 业务规则和验证（由SessionModule处理）
 * 
 * 【数据流向】
 * SessionModule → stores → useSession → UI组件
 */

import { useSessionStore } from '../stores/useSessionStore';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  artifacts: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: any;
  }>;
  metadata?: {
    apps_used?: string[];
    total_messages?: number;
    last_activity?: string;
  };
}

/**
 * Hook to access session state from the store
 * Pure state listener - no business logic
 */
export const useSession = () => {
  // Listen to session-related state from the store
  const sessions = useSessionStore(state => state.sessions || []);
  const currentSessionId = useSessionStore(state => state.currentSessionId || 'default');
  const isLoadingSession = useSessionStore(state => state.isLoadingSession || false);
  
  // Derived state
  const currentSession = sessions.find(session => session.id === currentSessionId);
  const sessionCount = sessions.length;
  
  return {
    // Session data
    sessions,
    currentSession,
    currentSessionId,
    sessionCount,
    
    // Loading states
    isLoadingSession,
    
    // Computed values
    hasMultipleSessions: sessionCount > 1,
    isDefaultSession: currentSessionId === 'default'
  };
};

/**
 * Hook to access session actions from the store
 * These are bound to business logic in SessionModule
 */
export const useSessionActions = () => useSessionStore(state => ({
  createSession: state.createSession,
  selectSession: state.selectSession,
  deleteSession: state.deleteSession,
  renameSession: state.renameSession,
  updateCurrentSession: state.updateCurrentSession,
  setLoadingSession: state.setLoadingSession
}));