/**
 * ============================================================================
 * Session Provider (SessionProvider.tsx) - Simplified Session Context Provider
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provide session context with minimal business logic
 * - Expose session state through React Context
 * - Bridge between session store and React components
 * - Handle provider-level initialization only
 * 
 * Architectural Principles:
 * - Session is an independent top-level state, not dependent on Chat/Widget
 * - Chat/Widget modules consume Session state through Context
 * - Event-driven communication mechanism, avoiding direct dependencies
 * - Unified Session data source and state management
 * 
 * Dependency Relationship:
 * SessionProvider (independent)
 *   ↓ provides state
 * ChatModule/WidgetModule (consumers)
 * 
 * Note: Business logic moved to SessionModule, this provider only handles React Context
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useSessionStore, ChatSession } from '../stores/useSessionStore';

// Re-export ChatSession type for consistency
export { ChatSession } from '../stores/useSessionStore';

// ================================================================================
// Context Creation
// ================================================================================

interface SessionContextValue {
  // Session state - direct store selectors
  sessions: ReturnType<typeof useSessionStore>['sessions'];
  currentSessionId: ReturnType<typeof useSessionStore>['currentSessionId'];
  currentSession: ReturnType<typeof useSessionStore>['currentSession'];
  isLoading: ReturnType<typeof useSessionStore>['isLoading'];
  error: ReturnType<typeof useSessionStore>['error'];
  
  // Session operations - direct store actions
  createSession: ReturnType<typeof useSessionStore>['createSession'];
  selectSession: ReturnType<typeof useSessionStore>['selectSession'];
  deleteSession: ReturnType<typeof useSessionStore>['deleteSession'];
  updateSession: ReturnType<typeof useSessionStore>['updateSession'];
  addMessage: ReturnType<typeof useSessionStore>['addMessage'];
  clearMessages: ReturnType<typeof useSessionStore>['clearMessages'];
  saveToStorage: ReturnType<typeof useSessionStore>['saveToStorage'];
  loadFromStorage: ReturnType<typeof useSessionStore>['loadFromStorage'];
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ================================================================================
// SessionProvider Component - Simplified
// ================================================================================

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  // Direct store access - no complex logic in provider
  const {
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    error,
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    clearMessages,
    saveToStorage,
    loadFromStorage
  } = useSessionStore();

  // Simple context value - just pass through store state and actions
  const contextValue: SessionContextValue = {
    // State
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    error,
    
    // Operations
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    clearMessages,
    saveToStorage,
    loadFromStorage
  };
  
  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// ================================================================================
// Custom Hooks - Simplified
// ================================================================================

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Convenience selector hooks
export const useCurrentSession = () => {
  const { currentSession } = useSession();
  return currentSession;
};

export const useSessions = () => {
  const { sessions } = useSession();
  return sessions;
};

export const useSessionActions = () => {
  const {
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    clearMessages,
    saveToStorage,
    loadFromStorage
  } = useSession();
  
  return {
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    addMessage,
    clearMessages,
    saveToStorage,
    loadFromStorage
  };
};

export default SessionProvider;