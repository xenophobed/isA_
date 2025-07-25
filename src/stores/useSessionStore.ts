/**
 * ============================================================================
 * 会话状态管理 (useSessionStore.ts) - 专注于会话管理的状态存储
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理聊天会话的创建、存储和导航
 * - 持久化会话数据到localStorage
 * - 提供会话切换和历史记录功能
 * - 同步当前消息和工件到会话
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 会话数据的存储和管理
 *   - 会话的CRUD操作（创建、读取、更新、删除）
 *   - 会话持久化到localStorage
 *   - 当前会话的状态管理
 *   - 会话加载状态
 * 
 * ❌ 不负责：
 *   - 聊天消息管理（由useChatStore处理）
 *   - 应用导航（由useAppStore处理）
 *   - 工件管理（由useArtifactStore处理）
 *   - UI界面状态（由useAppStore处理）
 *   - 小部件状态（由useWidgetStores处理）
 * 
 * 【会话结构】
 * ChatSession {
 *   id: string
 *   title: string
 *   lastMessage: string
 *   timestamp: string
 *   messageCount: number
 *   artifacts: string[]
 *   messages: ChatMessage[]
 *   metadata?: object
 * }
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger, LogCategory } from '../utils/logger';

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

interface SessionState {
  // 会话数据
  sessions: ChatSession[];
  currentSessionId: string;
  
  // 加载状态
  isLoadingSession: boolean;
}

interface SessionActions {
  // 会话CRUD操作
  createSession: (session: ChatSession) => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  updateCurrentSession: (session: ChatSession) => void;
  
  // 会话状态
  setLoadingSession: (loading: boolean) => void;
  
  // 会话数据操作
  loadSessionsFromStorage: () => void;
  saveSessionsToStorage: () => void;
}

export type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    sessions: [],
    currentSessionId: 'default',
    isLoadingSession: false,
    
    // 会话CRUD操作
    createSession: (session) => {
      set((state) => ({
        sessions: [...state.sessions, session]
      }));
      logger.debug(LogCategory.CHAT_FLOW, 'Session created in session store', { 
        sessionId: session.id, 
        title: session.title 
      });
    },
    
    selectSession: (sessionId) => {
      set({ currentSessionId: sessionId });
      logger.debug(LogCategory.CHAT_FLOW, 'Session selected in session store', { sessionId });
    },
    
    deleteSession: (sessionId) => {
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId)
      }));
      logger.debug(LogCategory.CHAT_FLOW, 'Session deleted from session store', { sessionId });
    },
    
    renameSession: (sessionId, newTitle) => {
      set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, title: newTitle } : s
        )
      }));
      logger.debug(LogCategory.CHAT_FLOW, 'Session renamed in session store', { sessionId, newTitle });
    },
    
    updateCurrentSession: (session) => {
      set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === session.id ? session : s
        )
      }));
      logger.debug(LogCategory.CHAT_FLOW, 'Current session updated in session store', { 
        sessionId: session.id 
      });
    },
    
    // 会话状态
    setLoadingSession: (loading) => {
      set({ isLoadingSession: loading });
    },
    
    // 会话数据操作
    loadSessionsFromStorage: () => {
      try {
        const savedSessions = localStorage.getItem('main_app_sessions');
        if (savedSessions) {
          const parsedSessions = JSON.parse(savedSessions);
          // 迁移旧会话数据，确保有messages属性
          const migratedSessions = parsedSessions.map((session: any) => ({
            ...session,
            messages: session.messages || []
          }));
          
          set({ sessions: migratedSessions });
          logger.info(LogCategory.CHAT_FLOW, 'Sessions loaded from localStorage', { 
            sessionCount: migratedSessions.length 
          });
        } else {
          // 创建默认会话
          const defaultSession: ChatSession = {
            id: 'default',
            title: 'Current Session',
            lastMessage: 'Welcome to AI Agent SDK!',
            timestamp: new Date().toISOString(),
            messageCount: 1,
            artifacts: [],
            messages: [],
            metadata: {
              apps_used: [],
              total_messages: 1,
              last_activity: new Date().toISOString()
            }
          };
          
          set({ sessions: [defaultSession] });
          get().saveSessionsToStorage();
          logger.info(LogCategory.CHAT_FLOW, 'Default session created in session store');
        }
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to load sessions from localStorage', { error });
      }
    },
    
    saveSessionsToStorage: () => {
      try {
        const { sessions } = get();
        
        // 优化存储：移除很旧的会话以防止localStorage膨胀
        const maxSessions = 20;
        const recentSessions = sessions
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, maxSessions);
        
        const dataToSave = JSON.stringify(recentSessions);
        
        // 检查localStorage大小并在变大时警告
        if (dataToSave.length > 500000) { // 500KB
          logger.warn(LogCategory.CHAT_FLOW, 'Session data getting large, consider cleanup', { 
            size: dataToSave.length,
            sessionCount: recentSessions.length 
          });
        }
        
        localStorage.setItem('main_app_sessions', dataToSave);
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions saved to localStorage', { 
          sessionCount: recentSessions.length 
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          logger.error(LogCategory.CHAT_FLOW, 'localStorage quota exceeded, clearing old sessions', { error });
          // 紧急清理：只保留最后5个会话
          const { sessions } = get();
          const emergencyCleanup = sessions.slice(0, 5);
          localStorage.setItem('main_app_sessions', JSON.stringify(emergencyCleanup));
          set({ sessions: emergencyCleanup });
        } else {
          logger.error(LogCategory.CHAT_FLOW, 'Failed to save sessions to localStorage', { error });
        }
      }
    }
  }))
);

// Session选择器
export const useSessions = () => useSessionStore(state => state.sessions);
export const useCurrentSessionId = () => useSessionStore(state => state.currentSessionId);
export const useIsLoadingSession = () => useSessionStore(state => state.isLoadingSession);

// 派生状态选择器
export const useCurrentSession = () => {
  const sessions = useSessions();
  const currentSessionId = useCurrentSessionId();
  return sessions.find(session => session.id === currentSessionId);
};

export const useSessionCount = () => {
  const sessions = useSessions();
  return sessions.length;
};

// Session操作
export const useSessionActions = () => useSessionStore(state => ({
  createSession: state.createSession,
  selectSession: state.selectSession,
  deleteSession: state.deleteSession,
  renameSession: state.renameSession,
  updateCurrentSession: state.updateCurrentSession,
  setLoadingSession: state.setLoadingSession,
  loadSessionsFromStorage: state.loadSessionsFromStorage,
  saveSessionsToStorage: state.saveSessionsToStorage
}));