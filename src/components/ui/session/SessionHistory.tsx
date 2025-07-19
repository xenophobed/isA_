import React, { useState } from 'react';

export interface SessionHistoryProps {
  onSessionSelect?: (session: any) => void;
  showCreateButton?: boolean;
  className?: string;
}

/**
 * Simple SessionHistory component for main_app
 * Standalone version without SDK dependencies
 */
export const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelect,
  showCreateButton = true,
  className = ''
}) => {
  const [sessions] = useState([
    {
      id: '1',
      title: 'Image Generation Chat',
      lastMessage: 'Generated a beautiful landscape',
      timestamp: new Date().toISOString(),
      messageCount: 5
    },
    {
      id: '2', 
      title: 'Product Research',
      lastMessage: 'Found wireless headphones under $100',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      messageCount: 12
    },
    {
      id: '3',
      title: 'Content Writing',
      lastMessage: 'Created blog post about AI trends',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      messageCount: 8
    }
  ]);

  const handleSessionClick = (session: any) => {
    console.log('📋 Session selected:', session);
    onSessionSelect?.(session);
  };

  const handleNewSession = () => {
    console.log('🆕 Creating new session');
    // This would typically create a new session
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
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSessionClick(session)}
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
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
                </div>
              </div>
              
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">No chat history yet</div>
          <div className="text-gray-500 text-xs mt-1">Start a conversation to see it here</div>
        </div>
      )}
    </div>
  );
};