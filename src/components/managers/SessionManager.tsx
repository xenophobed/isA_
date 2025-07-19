import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { logger, LogCategory } from '../../utils/logger';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  artifacts: string[];
  metadata?: {
    apps_used?: string[];
    total_messages?: number;
    last_activity?: string;
  };
}

interface SessionManagerProps {
  onSessionSelect?: (session: ChatSession) => void;
  onNewSession?: () => void;
  className?: string;
}

/**
 * Session Manager Component
 * Handles chat session creation, storage, and navigation
 */
export const SessionManager: React.FC<SessionManagerProps> = ({
  onSessionSelect,
  onNewSession,
  className = ''
}) => {
  const { artifacts, currentApp, startNewChat } = useAppStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default');

  // Initialize with default sessions or load from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('main_app_sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to load sessions from localStorage', { error });
      }
    } else {
      // Create default sessions
      const defaultSessions: ChatSession[] = [
        {
          id: 'default',
          title: 'Current Session',
          lastMessage: 'Welcome to AI Agent SDK!',
          timestamp: new Date().toISOString(),
          messageCount: 1,
          artifacts: [],
          metadata: {
            apps_used: [],
            total_messages: 1,
            last_activity: new Date().toISOString()
          }
        }
      ];
      setSessions(defaultSessions);
      saveSessionsToStorage(defaultSessions);
    }
  }, []);

  // Update current session when artifacts change
  useEffect(() => {
    if (artifacts.length > 0) {
      updateCurrentSession();
    }
  }, [artifacts, currentApp]);

  const saveSessionsToStorage = (sessionsToSave: ChatSession[]) => {
    try {
      localStorage.setItem('main_app_sessions', JSON.stringify(sessionsToSave));
    } catch (error) {
      logger.error(LogCategory.CHAT_FLOW, 'Failed to save sessions to localStorage', { error });
    }
  };

  const updateCurrentSession = () => {
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === currentSessionId) {
          const appsUsed = new Set(session.metadata?.apps_used || []);
          if (currentApp) appsUsed.add(currentApp);

          return {
            ...session,
            lastMessage: artifacts.length > 0 ? 
              `Generated ${artifacts[artifacts.length - 1].appName} content` : 
              session.lastMessage,
            timestamp: new Date().toISOString(),
            messageCount: session.messageCount + 1,
            artifacts: artifacts.map(a => a.id),
            metadata: {
              ...session.metadata,
              apps_used: Array.from(appsUsed),
              total_messages: session.messageCount + 1,
              last_activity: new Date().toISOString()
            }
          };
        }
        return session;
      });
      
      saveSessionsToStorage(updated);
      return updated;
    });
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `Chat Session ${sessions.length + 1}`,
      lastMessage: 'New conversation started',
      timestamp: new Date().toISOString(),
      messageCount: 0,
      artifacts: [],
      metadata: {
        apps_used: [],
        total_messages: 0,
        last_activity: new Date().toISOString()
      }
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    saveSessionsToStorage(updatedSessions);

    // Trigger new chat in the app
    startNewChat();
    onNewSession?.();

    logger.info(LogCategory.CHAT_FLOW, 'New session created', {
      sessionId: newSession.id,
      title: newSession.title
    });
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    onSessionSelect?.(session);
    
    logger.info(LogCategory.CHAT_FLOW, 'Session selected', {
      sessionId: session.id,
      title: session.title,
      messageCount: session.messageCount
    });
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);

    // If deleting current session, switch to first available
    if (sessionId === currentSessionId && updatedSessions.length > 0) {
      setCurrentSessionId(updatedSessions[0].id);
    }

    logger.info(LogCategory.CHAT_FLOW, 'Session deleted', { sessionId });
  };

  const getSessionDisplayInfo = (session: ChatSession) => {
    const timeAgo = getTimeAgo(session.timestamp);
    const appsUsed = session.metadata?.apps_used || [];
    
    return {
      timeAgo,
      appsUsed: appsUsed.slice(0, 3), // Show max 3 apps
      hasMoreApps: appsUsed.length > 3
    };
  };

  const getTimeAgo = (timestamp: string) => {
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
  };

  const getAppIcon = (appId: string) => {
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
  };

  return (
    <div className={`session-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
        <button
          onClick={handleNewSession}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
          title="New Chat Session"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sessions.map((session) => {
          const displayInfo = getSessionDisplayInfo(session);
          const isActive = session.id === currentSessionId;
          
          return (
            <button
              key={session.id}
              onClick={() => handleSessionSelect(session)}
              className={`w-full text-left p-3 rounded-lg border transition-all group relative ${
                isActive 
                  ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`text-sm font-medium truncate ${
                      isActive ? 'text-blue-300' : 'text-white'
                    }`}>
                      {session.title}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="text-gray-400 text-xs truncate mb-2">
                    {session.lastMessage}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{displayInfo.timeAgo}</span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 text-xs">{session.messageCount} msg</span>
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
                
                {session.id !== 'default' && (
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                    title="Delete session"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">No sessions yet</div>
          <div className="text-gray-500 text-xs mt-1">Create your first chat session</div>
        </div>
      )}

      {/* Session stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Total Sessions: {sessions.length}</div>
          <div>Current: {sessions.find(s => s.id === currentSessionId)?.title || 'None'}</div>
        </div>
      </div>
    </div>
  );
};