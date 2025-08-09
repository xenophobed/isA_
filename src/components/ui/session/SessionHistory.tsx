import React from 'react';
import { ChatSession } from '../../../hooks/useSession';

export interface SessionHistoryProps {
  // Data props - provided by parent
  sessions?: ChatSession[];
  currentSessionId?: string;
  isLoading?: boolean;
  editingSessionId?: string | null;
  editingTitle?: string;
  
  // Event callbacks - handled by parent
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onStartRename?: (sessionId: string, currentTitle: string) => void;
  onCancelRename?: () => void;
  onEditingTitleChange?: (title: string) => void;
  
  // UI props
  showCreateButton?: boolean;
  className?: string;
}

/**
 * SessionHistory component - 纯UI组件，只负责渲染和事件传递
 * 
 * 架构流程：
 * SessionHistory UI (events) → SessionModule (business logic) → SessionHandler → SessionStore
 */
export const SessionHistory: React.FC<SessionHistoryProps> = ({
  // Data props
  sessions = [],
  currentSessionId,
  isLoading = false,
  editingSessionId,
  editingTitle = '',
  
  // Event callbacks
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onStartRename,
  onCancelRename,
  onEditingTitleChange,
  
  // UI props
  showCreateButton = true,
  className = ''
}) => {
  

  return (
    <div className={`session-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
        {showCreateButton && (
          <button
            onClick={onNewSession}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
            title="New Chat Session"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            New
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {!Array.isArray(sessions) || sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 text-sm">No sessions yet</div>
              <div className="text-gray-500 text-xs mt-1">Create your first chat session</div>
            </div>
          </div>
        ) : (
          sessions.filter(session => session && typeof session === 'object' && session.id).map((session) => {
            const isActive = session.id === currentSessionId;
            
            return (
              <div
                key={session.id}
                onClick={() => onSessionSelect?.(session.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all group relative cursor-pointer ${
                  isActive 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => onEditingTitleChange?.(e.target.value)}
                          onBlur={() => onRenameSession?.(session.id, editingTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameSession?.(session.id, editingTitle);
                            if (e.key === 'Escape') onCancelRename?.();
                          }}
                          className="text-sm font-medium bg-white/10 border border-white/20 rounded px-2 py-1 text-white w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className={`text-sm font-medium truncate cursor-pointer ${
                            isActive ? 'text-blue-300' : 'text-white'
                          }`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onStartRename?.(session.id, session.title);
                          }}
                        >
                          {String(session.title || '')}
                        </div>
                      )}
                      {isActive && editingSessionId !== session.id && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    
                    {editingSessionId !== session.id && (
                      <div className="text-gray-400 text-xs truncate mb-2">
                        {(() => {
                          try {
                            if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
                              const lastMessage = session.messages[session.messages.length - 1];
                              const content = lastMessage?.content || '';
                              if (typeof content === 'string') {
                                return content.length > 60 ? content.substring(0, 60) + '...' : content;
                              }
                            }
                            if (session.lastMessage && typeof session.lastMessage === 'string') {
                              return session.lastMessage;
                            }
                            return '';
                          } catch (error) {
                            console.error('Error rendering session message:', error);
                            return '';
                          }
                        })()}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          {session.timestamp ? new Date(session.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {editingSessionId !== session.id && (
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRename?.(session.id, session.title);
                        }}
                        className="p-1 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300"
                        title="Rename session"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession?.(session.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                        title="Delete session"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};