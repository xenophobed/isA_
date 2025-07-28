/**
 * ============================================================================
 * Session Hook (useSession.ts) - Session State Subscription Hook
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Monitor and access session-related state data
 * - Provide reactive interfaces for session state
 * - Connect business logic modules with SessionProvider
 * - No business logic, only state subscription
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - Getting session state data from SessionProvider
 *   - Providing reactive state interfaces
 *   - State change monitoring and notification
 *   - State selector encapsulation
 * 
 * ❌ Not responsible for:
 *   - Session creation, deletion, switching logic (handled by SessionModule)
 *   - UI component rendering (handled by LeftSidebarLayout)
 *   - Data persistence logic (handled by SessionProvider)
 *   - Business rules and validation (handled by SessionModule)
 * 
 * Data Flow:
 * SessionProvider → useSession → SessionModule → UI components
 */

import { useCallback, useMemo } from 'react';
import { 
  useSession as useSessionContext,
  useCurrentSession as useCurrentSessionFromProvider,
  useSessions as useSessionsFromProvider,
  useSessionActions as useSessionActionsFromProvider,
  ChatSession
} from '../providers/SessionProvider';

// Re-export types for compatibility
export { ChatSession } from '../providers/SessionProvider';

/**
 * Hook to access session state from SessionProvider
 * Pure state listener - no business logic
 */
export const useSession = () => {
  // Get session state from SessionProvider
  const sessionContext = useSessionContext();
  
  if (!sessionContext) {
    throw new Error('useSession must be used within SessionProvider');
  }
  
  return sessionContext;
};

/**
 * Get current session with selective subscription
 */
export const useCurrentSession = () => {
  return useCurrentSessionFromProvider();
};

/**
 * Get all sessions with selective subscription
 */
export const useSessions = () => {
  return useSessionsFromProvider();
};

/**
 * Get session actions with memoization
 */
export const useSessionActions = () => {
  return useSessionActionsFromProvider();
};

/**
 * Get session state summary - optimized for components that need overview
 */
export const useSessionSummary = () => {
  const { sessions, currentSessionId, isLoading, error } = useSession();
  
  return useMemo(() => ({
    sessionCount: sessions.length,
    currentSessionId,
    hasCurrentSession: !!currentSessionId,
    isLoading,
    hasError: !!error,
    error
  }), [sessions.length, currentSessionId, isLoading, error]);
};

/**
 * Get specific session by ID with memoization
 */
export const useSessionById = (sessionId: string) => {
  const { sessions } = useSession();
  
  return useMemo(() => 
    sessions.find(session => session.id === sessionId) || null,
    [sessions, sessionId]
  );
};

/**
 * Get session operations with selective callbacks
 */
export const useSessionOperations = () => {
  const { 
    createSession, 
    selectSession, 
    deleteSession, 
    updateSession 
  } = useSessionActions();
  
  return useMemo(() => ({
    createSession,
    selectSession,
    deleteSession,
    updateSession
  }), [createSession, selectSession, deleteSession, updateSession]);
};

/**
 * Get session content operations
 */
export const useSessionContent = () => {
  const { addMessage, clearMessages } = useSessionActions();
  
  return useMemo(() => ({
    addMessage,
    clearMessages
  }), [addMessage, clearMessages]);
};