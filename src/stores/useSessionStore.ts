/**
 * ============================================================================
 * Session State Management (useSessionStore.ts) - Focused Session Management Store
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Manage chat session creation, storage and navigation
 * - Persist session data to localStorage
 * - Provide session switching and history functionality
 * - Sync current messages and artifacts to sessions
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - Session data storage and management
 *   - Session CRUD operations (Create, Read, Update, Delete)
 *   - Session persistence to localStorage
 *   - Current session state management
 *   - Session loading state
 * 
 * ❌ Not responsible for:
 *   - Chat message management (handled by useChatStore)
 *   - App navigation (handled by useAppStore)
 *   - Artifact management (handled by useArtifactStore)
 *   - UI interface state (handled by useAppStore)
 *   - Widget state (handled by useWidgetStores)
 * 
 * Session Structure:
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
import { createAuthenticatedSessionService } from '../api/sessionService';

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
    user_id?: string;
    api_session_id?: string;
    [key: string]: any;
  };
}

interface SessionState {
  // Session data
  sessions: ChatSession[];
  currentSessionId: string;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  // Session CRUD operations
  createSession: (title?: string) => ChatSession;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSession: (session: ChatSession) => void;
  
  // Session message operations
  addMessage: (sessionId: string, message: any) => void;
  clearMessages: (sessionId: string) => void;
  
  // Session state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Storage operations
  loadFromStorage: () => void;
  saveToStorage: () => void;
  loadFromAPI: (userId: string, authHeaders?: any) => Promise<void>;
  saveToAPI: (userId: string, authHeaders?: any) => Promise<void>;
  
  // Computed getters
  getCurrentSession: () => ChatSession | null;
  getSessionById: (sessionId: string) => ChatSession | null;
}

export type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    sessions: [],
    currentSessionId: 'default',
    isLoading: false,
    error: null,
    
    // Session CRUD operations
    createSession: (title = 'New Chat') => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newSession: ChatSession = {
        id: sessionId,
        title,
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
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSessionId: sessionId
      }));
      
      // Auto-save to storage
      setTimeout(() => get().saveToStorage(), 0);
      
      logger.info(LogCategory.CHAT_FLOW, 'Session created', {
        sessionId,
        title
      });
      
      return newSession;
    },
    
    selectSession: (sessionId) => {
      const currentState = get();
      
      // 防止重复设置相同的sessionId，避免无限循环
      if (currentState.currentSessionId === sessionId) {
        console.log('🚫 SESSION_STORE: Session already selected, skipping', { sessionId });
        return;
      }
      
      set({ currentSessionId: sessionId });
      localStorage.setItem('currentSessionId', sessionId);
      
      logger.debug(LogCategory.CHAT_FLOW, 'Session selected', { sessionId });
      console.log('✅ SESSION_STORE: Session selected', { 
        sessionId, 
        previousSessionId: currentState.currentSessionId 
      });
    },
    
    deleteSession: (sessionId) => {
      const state = get();
      const remainingSessions = state.sessions.filter(s => s.id !== sessionId);
      
      set({ sessions: remainingSessions });
      
      // If deleted session was current, switch to another
      if (sessionId === state.currentSessionId) {
        if (remainingSessions.length > 0) {
          get().selectSession(remainingSessions[0].id);
        } else {
          // Create a default session if none left
          get().createSession('Welcome Chat');
        }
      }
      
      get().saveToStorage();
      
      logger.debug(LogCategory.CHAT_FLOW, 'Session deleted', { sessionId });
    },
    
    updateSession: (updatedSession) => {
      set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        )
      }));
      
      get().saveToStorage();
      
      logger.debug(LogCategory.CHAT_FLOW, 'Session updated', {
        sessionId: updatedSession.id
      });
    },
    
    // Session message operations
    addMessage: (sessionId, message) => {
      set((state) => ({
        sessions: state.sessions.map(session => {
          if (session.id === sessionId) {
            const updatedMessages = [...session.messages, message];
            return {
              ...session,
              messages: updatedMessages,
              messageCount: updatedMessages.length,
              lastMessage: message.content.length > 100 
                ? message.content.substring(0, 100) + '...' 
                : message.content,
              timestamp: new Date().toISOString(),
              metadata: {
                ...session.metadata,
                total_messages: updatedMessages.length,
                last_activity: new Date().toISOString()
              }
            };
          }
          return session;
        })
      }));
      
      get().saveToStorage();
    },
    
    clearMessages: (sessionId) => {
      set((state) => ({
        sessions: state.sessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              messages: [],
              messageCount: 0,
              lastMessage: 'Session cleared',
              timestamp: new Date().toISOString(),
              metadata: {
                ...session.metadata,
                total_messages: 0,
                last_activity: new Date().toISOString()
              }
            };
          }
          return session;
        })
      }));
      
      get().saveToStorage();
    },
    
    // Session state management
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setError: (error) => {
      set({ error });
      if (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Session error set', { error });
      }
    },
    
    // Storage operations
    loadFromStorage: () => {
      // 防止重复加载
      if (get().isLoading) {
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions already loading, skipping duplicate call');
        return;
      }

      // Check if running on client side
      if (typeof window === 'undefined') {
        logger.debug(LogCategory.CHAT_FLOW, 'Skipping localStorage load - server side');
        return;
      }
      
      // 设置加载状态，防止重复调用
      set({ isLoading: true });
      
      try {
        // Client side - load from localStorage
        const savedSessions = localStorage.getItem('sessions');
        let parsedSessions: ChatSession[] = [];
        
        if (savedSessions) {
          parsedSessions = JSON.parse(savedSessions);
          set({ 
            sessions: parsedSessions,
            isLoading: false,
            error: null
          });
        } else {
          // Create default session
          const defaultSession: ChatSession = {
            id: 'default',
            title: 'Welcome Chat',
            lastMessage: 'Welcome to AI Agent SDK!',
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
          
          parsedSessions = [defaultSession];
          set({ 
            sessions: parsedSessions, 
            currentSessionId: defaultSession.id,
            isLoading: false,
            error: null
          });
          
          // 异步保存，避免立即触发状态变化
          setTimeout(() => {
            try {
              localStorage.setItem('sessions', JSON.stringify([defaultSession]));
              localStorage.setItem('currentSessionId', defaultSession.id);
              logger.debug(LogCategory.CHAT_FLOW, 'Default session saved to localStorage');
            } catch (error) {
              logger.error(LogCategory.CHAT_FLOW, 'Failed to save default session', { error });
            }
          }, 0);
        }
        
        // Load current session ID
        const savedCurrentSessionId = localStorage.getItem('currentSessionId');
        console.log('🔍 SESSION_STORE: Loading current session ID', {
          savedCurrentSessionId,
          parsedSessionsLength: parsedSessions.length,
          parsedSessionIds: parsedSessions.map((s: ChatSession) => s.id)
        });
        
        if (savedCurrentSessionId) {
          // 验证保存的session ID是否存在于加载的sessions中
          const sessionExists = parsedSessions.some((s: ChatSession) => s.id === savedCurrentSessionId);
          console.log('🔍 SESSION_STORE: Checking saved session ID', {
            savedCurrentSessionId,
            sessionExists,
            allSessionIds: parsedSessions.map((s: ChatSession) => s.id)
          });
          
          if (sessionExists) {
            set({ currentSessionId: savedCurrentSessionId });
            console.log('✅ SESSION_STORE: Using saved session ID', { currentSessionId: savedCurrentSessionId });
          } else {
            // 如果保存的session不存在，使用第一个session
            const firstSessionId = parsedSessions.length > 0 ? parsedSessions[0].id : 'default';
            set({ currentSessionId: firstSessionId });
            localStorage.setItem('currentSessionId', firstSessionId);
            console.log('⚠️ SESSION_STORE: Saved session not found, using first session', {
              savedSessionId: savedCurrentSessionId,
              newSessionId: firstSessionId
            });
            logger.warn(LogCategory.CHAT_FLOW, 'Saved session ID not found, using first session', {
              savedSessionId: savedCurrentSessionId,
              newSessionId: firstSessionId
            });
          }
        } else if (parsedSessions.length > 0) {
          // 如果没有保存的session ID，使用第一个session
          const firstSessionId = parsedSessions[0].id;
          set({ currentSessionId: firstSessionId });
          localStorage.setItem('currentSessionId', firstSessionId);
          console.log('🆕 SESSION_STORE: No saved session ID, using first session', {
            firstSessionId,
            totalSessions: parsedSessions.length
          });
        } else {
          console.log('❌ SESSION_STORE: No sessions available, cannot set current session');
        }
        
        const finalCurrentSessionId = get().currentSessionId;
        console.log('🏁 SESSION_STORE: Final session state', {
          currentSessionId: finalCurrentSessionId,
          sessionCount: parsedSessions.length,
          hasCurrentSession: !!finalCurrentSessionId
        });
        
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions loaded from localStorage', {
          sessionCount: parsedSessions.length,
          currentSessionId: finalCurrentSessionId
        });
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to load sessions from localStorage', { error });
        set({ 
          error: 'Failed to load sessions from storage',
          isLoading: false
        });
      }
    },
    
    saveToStorage: () => {
      // Check if running on client side
      if (typeof window === 'undefined') {
        logger.debug(LogCategory.CHAT_FLOW, 'Skipping localStorage save - server side');
        return;
      }
      
      try {
        const { sessions, currentSessionId } = get();
        
        // Save sessions
        localStorage.setItem('sessions', JSON.stringify(sessions));
        // Save current session ID
        localStorage.setItem('currentSessionId', currentSessionId);
        
        logger.debug(LogCategory.CHAT_FLOW, 'Sessions saved to localStorage', {
          sessionCount: sessions.length,
          currentSessionId
        });
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to save sessions to localStorage', { error });
        get().setError('Failed to save sessions to storage');
      }
    },
    
    // Computed getters
    getCurrentSession: () => {
      const { sessions, currentSessionId } = get();
      return sessions.find(session => session.id === currentSessionId) || null;
    },
    
    getSessionById: (sessionId) => {
      const { sessions } = get();
      return sessions.find(session => session.id === sessionId) || null;
    },
    
    // API operations
    loadFromAPI: async (userId, authHeaders) => {
      if (!userId || !authHeaders) {
        logger.warn(LogCategory.CHAT_FLOW, 'Missing userId or authHeaders for API load');
        return;
      }
      
      try {
        set({ isLoading: true, error: null });
        
        const sessionService = createAuthenticatedSessionService(async () => authHeaders);
        const response = await sessionService.getUserSessions(userId, { limit: 100 });
        
        if (response.success && response.data?.sessions) {
          const apiSessions = response.data.sessions.map(session => ({
            id: session.id,
            title: session.title,
            lastMessage: session.summary || 'No messages',
            timestamp: session.last_activity || session.created_at,
            messageCount: session.message_count || 0,
            artifacts: [],
            messages: [],
            metadata: {
              ...session.metadata,
              api_session_id: session.id,
              user_id: session.user_id
            }
          }));
          
          set({ sessions: apiSessions, isLoading: false });
          logger.info(LogCategory.CHAT_FLOW, 'Sessions loaded from API', {
            sessionCount: apiSessions.length
          });
        } else {
          throw new Error(response.error || 'Failed to load sessions');
        }
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to load sessions from API', { error });
        set({ isLoading: false, error: 'Failed to load sessions from API' });
      }
    },
    
    saveToAPI: async (userId, authHeaders) => {
      if (!userId || !authHeaders) {
        logger.warn(LogCategory.CHAT_FLOW, 'Missing userId or authHeaders for API save');
        return;
      }
      
      try {
        const sessionService = createAuthenticatedSessionService(async () => authHeaders);
        const { sessions, getCurrentSession } = get();
        const currentSession = getCurrentSession();
        
        // Save current session if it exists and doesn't have API ID
        if (currentSession && !currentSession.metadata?.api_session_id) {
          const response = await sessionService.createSession(
            userId,
            currentSession.title,
            currentSession.metadata
          );
          
          if (response.success && response.data?.session) {
            // Update session with API ID
            const updatedSession = {
              ...currentSession,
              metadata: {
                ...currentSession.metadata,
                api_session_id: response.data.session.id
              }
            };
            
            set(state => ({
              sessions: state.sessions.map(s => 
                s.id === currentSession.id ? updatedSession : s
              )
            }));
            
            logger.info(LogCategory.CHAT_FLOW, 'Session synced to API', {
              sessionId: currentSession.id,
              apiSessionId: response.data.session.id
            });
          }
        }
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to save session to API', { error });
      }
    }
  }))
);

// Initialize store on import - only on client side
if (typeof window !== 'undefined') {
  useSessionStore.getState().loadFromStorage();
}

// Selector hooks for performance optimization
export const useSessions = () => useSessionStore(state => state.sessions);
export const useCurrentSessionId = () => useSessionStore(state => state.currentSessionId);
export const useCurrentSession = () => useSessionStore(state => state.getCurrentSession());
export const useSessionLoading = () => useSessionStore(state => state.isLoading);
export const useSessionError = () => useSessionStore(state => state.error);

// Additional selector hooks for compatibility
export const useSessionCount = () => useSessionStore(state => state.sessions.length);
export const useIsLoadingSession = () => useSessionStore(state => state.isLoading);
export const useIsSyncingToAPI = () => useSessionStore(state => false); // Simplified for now
export const useSyncStatus = () => useSessionStore(state => 'idle'); // Simplified for now  
export const useLastSyncError = () => useSessionStore(state => state.error);

// Selective action hooks - avoid unnecessary re-renders
export const useSessionCRUDActions = () => useSessionStore(state => ({
  createSession: state.createSession,
  selectSession: state.selectSession,
  deleteSession: state.deleteSession,
  updateSession: state.updateSession
}));

export const useSessionMessageActions = () => useSessionStore(state => ({
  addMessage: state.addMessage,
  clearMessages: state.clearMessages
}));

export const useSessionStorageActions = () => useSessionStore(state => ({
  saveToStorage: state.saveToStorage,
  loadFromStorage: state.loadFromStorage
}));

export const useSessionAPIActions = () => useSessionStore(state => ({
  loadFromAPI: state.loadFromAPI,
  saveToAPI: state.saveToAPI
}));

export const useSessionStateActions = () => useSessionStore(state => ({
  setLoading: state.setLoading,
  setError: state.setError
}));

// Composite action hook for backward compatibility
export const useSessionActions = () => useSessionStore(state => ({
  createSession: state.createSession,
  selectSession: state.selectSession,
  deleteSession: state.deleteSession,
  updateSession: state.updateSession,
  addMessage: state.addMessage,
  clearMessages: state.clearMessages,
  setLoading: state.setLoading,
  setError: state.setError,
  saveToStorage: state.saveToStorage,
  loadFromStorage: state.loadFromStorage,
  loadFromAPI: state.loadFromAPI,
  saveToAPI: state.saveToAPI,
  // Compatibility methods
  saveSessionsToStorage: state.saveToStorage,
  loadSessionsFromStorage: state.loadFromStorage
}));