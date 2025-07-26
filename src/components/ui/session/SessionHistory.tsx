import React from 'react';
import { useSessionHandler } from '../../core/SessionHandler';
import { useSessions, useCurrentSessionId, useIsLoadingSession } from '../../../stores/useSessionStore';
import { logger, LogCategory } from '../../../utils/logger';

export interface SessionHistoryProps {
  onSessionSelect?: (session: any) => void;
  showCreateButton?: boolean;
  className?: string;
}

/**
 * SessionHistory component - 纯UI组件，使用SessionHandler处理用户事件
 * 
 * 架构流程：
 * SessionHistory UI → SessionHandler → SessionStore → SessionHook → SessionModule
 */
export const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelect,
  showCreateButton = true,
  className = ''
}) => {
  // ================================================================================
  // 状态和Handler集成
  // ================================================================================
  
  // 从Store获取会话数据
  const sessions = useSessions();
  const currentSessionId = useCurrentSessionId();
  const isLoading = useIsLoadingSession();
  
  // 获取SessionHandler
  const sessionHandler = useSessionHandler();
  
  // ================================================================================
  // 事件处理器
  // ================================================================================

  const handleSessionClick = (session: any) => {
    logger.debug(LogCategory.CHAT_FLOW, 'SessionHistory: Session clicked', {
      sessionId: session.id,
      title: session.title
    });

    // 通过SessionHandler处理选择事件
    sessionHandler.handleSessionSelect({ sessionId: session.id });
    
    // 同时触发外部回调（保持向后兼容）
    onSessionSelect?.(session);
  };

  const handleNewSession = () => {
    logger.debug(LogCategory.CHAT_FLOW, 'SessionHistory: New session requested');
    
    // 通过SessionHandler处理创建事件
    sessionHandler.handleSessionCreate({
      title: `新会话 ${new Date().toLocaleTimeString()}`,
      metadata: {
        apps_used: [],
        total_messages: 0,
        last_activity: new Date().toISOString()
      }
    });
  };

  return (
    <div className={`session-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chat History</h3>
        {showCreateButton && (
          <button
            onClick={handleNewSession}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
            title="New Chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {isLoading && (
          <div className="text-center py-4">
            <div className="text-gray-400 text-sm">Loading sessions...</div>
          </div>
        )}
        {sessions.map((session) => {
          const isCurrentSession = session.id === currentSessionId;
          return (
            <button
              key={session.id}
              onClick={() => handleSessionClick(session)}
              className={`w-full text-left p-3 rounded-lg border transition-colors group ${
                isCurrentSession 
                  ? 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                  {session.title}
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">
                  {session.lastMessage}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-500 text-xs">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {session.messageCount} messages
                  </span>
                  {session.metadata?.apps_used && session.metadata.apps_used.length > 0 && (
                    <span className="text-blue-400 text-xs">
                      {session.metadata.apps_used.length} apps
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </button>
        );
        })}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">No chat history yet</div>
          <div className="text-gray-500 text-xs mt-1">Start a conversation to see it here</div>
        </div>
      )}
    </div>
  );
};