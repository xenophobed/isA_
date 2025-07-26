/**
 * ============================================================================
 * 聊天消息列表组件 (MessageList.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 纯UI组件，负责渲染聊天消息列表
 * - 支持用户和AI消息的显示
 * - 支持流式消息显示，实时更新内容
 * - 处理消息状态显示和时间戳
 * 
 * 【消息渲染逻辑】
 * - 如果有content内容 → 显示消息内容 + 流式光标
 * - 如果没有content但有streamingStatus → 显示状态文本(如"Processing...")
 * - 如果都没有 → 显示null
 * 
 * 【架构定位】
 * - 纯UI组件，只接收props，不使用hooks
 * - 在新架构中被ChatContentLayout使用
 * - 不处理业务逻辑，只负责消息的视觉呈现
 */
import React, { memo } from 'react';
import { ChatMessage } from '../../../types/chatTypes';
import { ArtifactComponent } from './ArtifactComponent';

export interface MessageListProps {
  showTimestamps?: boolean;
  showAvatars?: boolean;
  autoScroll?: boolean;
  welcomeMessage?: string;
  enableMessageGrouping?: boolean;
  messageGroupingTimeGap?: number;
  onMessageClick?: (message: any) => void;
  customMessageRenderer?: (message: any, index: number) => React.ReactNode;
  className?: string;
  messages?: ChatMessage[];
  isLoading?: boolean;
  isTyping?: boolean;
}

/**
 * MessageList - Pure UI component for displaying chat messages
 * Renders messages without any business logic or hooks
 */
export const MessageList = memo<MessageListProps>(({
  showTimestamps = true,
  showAvatars = true,
  welcomeMessage = "Hello! How can I help you today?",
  onMessageClick,
  customMessageRenderer,
  className = '',
  messages = [],
  isLoading = false,
  isTyping = false
}) => {
  console.log('💬 MessageList: Rendering with', messages.length, 'messages');
  
  // Debug streaming messages
  const streamingMessages = messages.filter(m => m.isStreaming);
  if (streamingMessages.length > 0) {
    console.log('🔄 MessageList: Streaming messages:', streamingMessages.map(m => ({
      id: m.id,
      contentLength: m.content.length,
      status: m.streamingStatus,
      isStreaming: m.isStreaming
    })));
  }

  // Default message renderer
  const renderMessage = (message: ChatMessage, index: number) => {
    // Use custom renderer if provided, but fall back to default if it returns null
    if (customMessageRenderer) {
      const customResult = customMessageRenderer(message, index);
      if (customResult !== null) {
        return customResult;
      }
      // If custom renderer returns null, continue to default rendering
    }

    const isStreaming = message.isStreaming;
    const hasContent = message.content && message.content.trim().length > 0;
    const hasStatus = message.streamingStatus && message.streamingStatus.trim().length > 0;
    const isArtifact = message.metadata?.type === 'artifact';
    
    // Handle artifact messages specially
    if (isArtifact) {
      const artifactData = message.metadata?.artifactData;
      const appIcon = message.metadata?.appIcon || '🤖';
      const appName = message.metadata?.appName || 'AI';
      
      return (
        <div 
          key={message.id} 
          className="mb-6"
          onClick={() => onMessageClick?.(message)}
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}
        >
          <div style={{ width: '100%', maxWidth: '100%' }}>
            {showAvatars && (
              <div className="flex items-center mb-3" style={{ justifyContent: 'flex-start' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isStreaming 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-700 text-white'
                }`}>
                  {appIcon}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">{appName}</span>
                {isStreaming && (
                  <span className="ml-2 text-xs text-blue-400 italic">{message.streamingStatus || 'Processing...'}</span>
                )}
              </div>
            )}
            
            {/* Use ArtifactComponent for artifact content */}
            <div className="ml-10" style={{ width: 'calc(100% - 2.5rem)' }}>
              <ArtifactComponent
                artifact={{
                  id: message.id,
                  appId: message.metadata?.appId || 'unknown',
                  appName: appName,
                  appIcon: appIcon,
                  title: message.metadata?.title || 'Generated Content',
                  userInput: message.metadata?.userInput || '',
                  createdAt: message.timestamp,
                  isOpen: false,
                  generatedContent: artifactData || {
                    type: 'text',
                    content: isStreaming ? 'Loading...' : (hasContent ? message.content : 'No content available'),
                    metadata: {}
                  }
                }}
                onReopen={() => {
                  // Handle artifact reopening - could emit an event or callback
                  console.log('Artifact reopened:', message.id);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Default message rendering for non-artifact messages
    return (
      <div 
        key={message.id} 
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        onClick={() => onMessageClick?.(message)}
      >
        <div className={`max-w-[80%] group`}>
          {showAvatars && (
            <div className={`flex items-center mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : isStreaming 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-700 text-white'
              }`}>
                {message.role === 'user' ? 'U' : isStreaming ? '🤖' : 'AI'}
              </div>
              {/* Show streaming status next to AI avatar */}
              {message.role === 'assistant' && isStreaming && hasStatus && (
                <div className="ml-3 flex items-center gap-2 text-blue-400 text-sm italic">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>{message.streamingStatus}</span>
                </div>
              )}
            </div>
          )}
          
          <div 
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-white border border-gray-600'
            }`}
          >
            {hasContent ? (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                )}
              </div>
            ) : isStreaming ? (
              <div className="text-gray-400 text-sm italic flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span>...</span>
              </div>
            ) : null}
            
            {showTimestamps && !isStreaming && (
              <div className={`text-xs mt-2 opacity-70 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`conversation-stream ${className}`}>
      
      {/* Welcome message when no messages */}
      {messages.length === 0 && welcomeMessage && (
        <div className="text-center py-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-md mx-auto">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <p className="text-gray-300 text-lg">{welcomeMessage}</p>
          </div>
        </div>
      )}

      {/* Messages - 现在包含流式消息 */}
      {messages.map((message, index) => renderMessage(message, index))}

      {/* Typing indicator - 只在没有流式消息时显示 */}
      {isTyping && !messages.some(m => m.isStreaming) && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[80%]">
            {showAvatars && (
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold">
                  AI
                </div>
              </div>
            )}
            
            <div className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator - 只在没有流式消息时显示 */}
      {isLoading && !isTyping && !messages.some(m => m.isStreaming) && (
        <div className="text-center py-4">
          <div className="text-gray-400 text-sm">Processing your request...</div>
        </div>
      )}
    </div>
  );
});