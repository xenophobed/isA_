import React from 'react';
import { ChatSession } from '../../../hooks/useSession';
import { GlassButton } from '../../shared';

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
    <div className={`session-history ${className} flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">Chat Sessions</h3>
        {showCreateButton && (
          <button
            onClick={onNewSession}
            disabled={isLoading}
            className="
              px-3 py-2 rounded-xl flex items-center gap-2
              bg-white/10 hover:bg-white/15 backdrop-blur-sm
              border border-white/20 hover:border-white/30
              text-white/90 hover:text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              text-sm font-medium
            "
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

      {/* Sessions List - Fixed scrolling */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {!Array.isArray(sessions) || sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-white/70 text-sm font-medium">No sessions yet</div>
              <div className="text-white/50 text-xs mt-1">Create your first chat session</div>
            </div>
          </div>
        ) : (
          sessions.filter(session => session && typeof session === 'object' && session.id).map((session) => {
            const isActive = session.id === currentSessionId;
            
            return (
              <div
                key={session.id}
                className={`w-full text-left p-3 rounded-lg transition-all group relative cursor-pointer border ${
                  isActive 
                    ? 'bg-blue-500/20 text-white border-blue-400/40 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30' 
                    : 'hover:bg-white/8 text-white/85 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Click handler for the entire session */}
                <div onClick={() => onSessionSelect?.(session.id)} className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
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
                          className="text-sm font-medium bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white w-full focus:bg-white/15 focus:border-white/30 transition-colors"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 
                          className={`text-sm font-semibold ${
                            isActive ? 'text-white' : 'text-white/95'
                          } leading-tight truncate`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onStartRename?.(session.id, session.title);
                          }}
                          title={String(session.title || 'Untitled Session')}
                        >
                          {String(session.title || 'Untitled Session')}
                        </h4>
                      )}
                      {isActive && editingSessionId !== session.id && (
                        <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse flex-shrink-0 shadow-sm shadow-blue-400/50" />
                      )}
                    </div>
                    
                    {editingSessionId !== session.id && (
                        <div className="text-white/60 text-xs leading-relaxed mb-1 line-clamp-1">
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
                                return session.lastMessage.length > 60 ? session.lastMessage.substring(0, 60) + '...' : session.lastMessage;
                              }
                              return 'No messages yet';
                            } catch (error) {
                              console.error('Error rendering session message:', error);
                              return 'Error loading message';
                            }
                          })()}
                        </div>
                      )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-xs font-medium">
                          {session.timestamp ? (() => {
                            const date = new Date(session.timestamp);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - date.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays === 1) return 'Today';
                            if (diffDays === 2) return 'Yesterday';
                            if (diffDays <= 7) return `${diffDays - 1} days ago`;
                            return date.toLocaleDateString();
                          })() : 'New Session'}
                        </span>
                        {session.messages && session.messages.length > 0 && (
                          <span className="text-white/40 text-xs">
                            • {session.messages.length} {session.messages.length === 1 ? 'message' : 'messages'}
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - only show on hover */}
                  {editingSessionId !== session.id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRename?.(session.id, session.title);
                        }}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center"
                        title="Rename session"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession?.(session.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/30 text-white/70 hover:text-red-400 transition-all duration-200 flex items-center justify-center"
                        title="Delete session"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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