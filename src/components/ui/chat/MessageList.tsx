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
 * - 支持消息复制等交互功能
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
import React, { memo, useEffect, useState } from 'react';
import { ChatMessage, ArtifactMessage } from '../../../types/chatTypes';
import { ArtifactComponent } from './ArtifactComponent';
import { ArtifactMessageComponent } from './ArtifactMessageComponent';
import { ContentType } from '../../../types/appTypes';
import { ContentRenderer, StatusRenderer } from '../../shared';
import { ChatWelcome } from './ChatWelcome';
import { TaskProgressMessage } from './TaskProgressMessage';
import { TaskHandler } from '../../core/TaskHandler';
import { ChatEmbeddedTaskPanel } from './ChatEmbeddedTaskPanel';

// MessageActions will be implemented later

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
  onSendMessage?: (message: string) => void;
  // Message actions will be implemented later
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
  isTyping = false,
  onSendMessage
}) => {
  // 完全禁用日志以解决无限循环问题
  
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('💬 MessageList: Messages updated, count:', messages.length);
  //   }
  // }, [messages.length]);
  
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     const streamingMessages = messages.filter(m => m.isStreaming);
  //     if (streamingMessages.length > 0) {
  //       console.log('🔄 MessageList: Streaming messages:', streamingMessages.map(m => ({
  //         id: m.id,
  //         contentLength: m.content.length,
  //         status: m.streamingStatus,
  //         isStreaming: m.isStreaming
  //       })));
  //     }
  //   }
  // }, [messages.filter(m => m.isStreaming).length]);

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

    // Check if this is a new ArtifactMessage type
    if (message.type === 'artifact') {
      const artifactMessage = message as ArtifactMessage;
      return (
        <div 
          className="mb-6"
          onClick={() => onMessageClick?.(message)}
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}
        >
          <div style={{ width: '100%', maxWidth: '100%' }}>
            {showAvatars && (
              <div className="flex items-center mb-3" style={{ justifyContent: 'flex-start' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                  background: 'var(--glass-secondary)',
                  color: 'var(--text-primary)'
                }}>
                  {artifactMessage.artifact.widgetType === 'dream' ? '🎨' : 
                   artifactMessage.artifact.widgetType === 'hunt' ? '🔍' :
                   artifactMessage.artifact.widgetType === 'omni' ? '⚡' :
                   artifactMessage.artifact.widgetType === 'knowledge' ? '🧠' :
                   artifactMessage.artifact.widgetType === 'data_scientist' ? '📊' : '🤖'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">
                  {artifactMessage.artifact.widgetName || artifactMessage.artifact.widgetType}
                </span>
              </div>
            )}
            
            {/* Use new ArtifactMessageComponent for new artifact messages */}
            <div className="ml-10" style={{ width: 'calc(100% - 2.5rem)' }}>
              <ArtifactMessageComponent
                artifactMessage={artifactMessage}
                onReopen={() => {
                  // Handle artifact reopening - delegate to message click handler
                  if (onMessageClick) {
                    onMessageClick(artifactMessage);
                  }
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Handle legacy artifact messages (for backward compatibility)
    const isStreaming = message.isStreaming;
    const hasContent = (message as any).content && (message as any).content.trim().length > 0;
    const hasStatus = message.streamingStatus && message.streamingStatus.trim().length > 0;
    const isLegacyArtifact = (message as any).metadata?.type === 'artifact';
    
    // Handle legacy artifact messages specially
    if (isLegacyArtifact) {
      const artifactData = message.metadata?.artifactData;
      const appIcon = (typeof message.metadata?.appIcon === 'string' ? message.metadata.appIcon : null) || '🤖';
      const appName = (typeof message.metadata?.appName === 'string' ? message.metadata.appName : null) || 'AI';
      
      return (
        <div 
          className="mb-6"
          onClick={() => onMessageClick?.(message)}
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}
        >
          <div style={{ width: '100%', maxWidth: '100%' }}>
            {showAvatars && (
              <div className="flex items-center mb-3" style={{ justifyContent: 'flex-start' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                  background: isStreaming ? 'var(--gradient-secondary)' : 'var(--glass-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: isStreaming ? '0 0 15px var(--accent-soft)' : 'none'
                }}>
                  {appIcon}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">{appName}</span>
                {isStreaming && (
                  <div className="ml-3 flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-sm shadow-blue-400/50"></div>
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-pulse delay-75 shadow-sm shadow-blue-300/30"></div>
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-pulse delay-150 shadow-sm shadow-blue-200/20"></div>
                    </div>
                    <span className="text-white/70 text-xs font-medium">
                      {message.streamingStatus || 'Processing...'}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Use ArtifactComponent for artifact content */}
            <div className="ml-10" style={{ width: 'calc(100% - 2.5rem)' }}>
              <ArtifactComponent
                artifact={{
                  id: message.id,
                  appId: (message.metadata?.appId as any) || 'assistant',
                  appName: appName,
                  appIcon: appIcon,
                  title: (typeof message.metadata?.title === 'string' ? message.metadata.title : null) || 'Generated Content',
                  userInput: (typeof message.metadata?.userInput === 'string' ? message.metadata.userInput : null) || '',
                  createdAt: message.timestamp,
                  isOpen: false,
                  generatedContent: (artifactData && 
                    typeof artifactData === 'object' && 
                    'type' in artifactData && 
                    'content' in artifactData &&
                    typeof artifactData.type === 'string' &&
                    typeof artifactData.content === 'string') 
                    ? (artifactData as { type: ContentType; content: string; thumbnail?: string; metadata?: any })
                    : (hasContent || isStreaming) ? {
                        type: 'text' as ContentType,
                        content: isStreaming ? 'Loading...' : message.content
                      } : undefined
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

    // Default message rendering for regular messages
    const regularMessage = message as any; // Cast to access legacy properties for now
    return (
      <div 
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        onClick={() => onMessageClick?.(message)}
      >
        <div className={`max-w-[80%] group`}>
          {showAvatars && (
            <div className={`flex items-center mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                background: message.role === 'user' 
                  ? 'var(--accent-soft)' 
                  : isStreaming 
                    ? 'var(--gradient-secondary)'
                    : 'var(--glass-secondary)',
                color: 'var(--text-primary)',
                boxShadow: isStreaming || message.role === 'user' ? '0 0 15px var(--accent-soft)' : 'none'
              }}>
                {message.role === 'user' ? 'U' : isStreaming ? '🤖' : 'AI'}
              </div>
              {/* Show streaming status next to AI avatar */}
              {message.role === 'assistant' && isStreaming && hasStatus && (
                <div className="ml-3 flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-sm shadow-blue-400/50"></div>
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-pulse delay-75 shadow-sm shadow-blue-300/30"></div>
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-pulse delay-150 shadow-sm shadow-blue-200/20"></div>
                  </div>
                  <span className="text-white/70 text-xs font-medium">
                    {message.streamingStatus}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div 
            className="p-3 rounded-lg"
            style={{
              background: message.role === 'user' 
                ? 'var(--accent-soft)' 
                : 'var(--glass-primary)',
              color: 'var(--text-primary)',
              border: message.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              boxShadow: message.role === 'user' ? '0 0 20px var(--accent-soft)30' : 'none'
            }}
          >
            {hasContent ? (
              <div className="whitespace-pre-wrap break-words">
                <ContentRenderer
                  content={(message as any).content}
                  type="markdown"  // 改为 markdown 类型以支持图片等
                  variant="chat"
                  size="sm"
                  features={{
                    markdown: true,      // 启用 markdown 渲染
                    imagePreview: true,  // 启用图片预览
                    wordBreak: true,
                    copyButton: false,   // 聊天消息不需要复制按钮
                    saveButton: true     // 图片可以保存
                  }}
                  className="inline"
                />
                {isStreaming && (
                  <span className="inline-flex items-center ml-2">
                    <div className="w-1 h-4 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                    <div className="w-1 h-3 bg-gradient-to-t from-blue-300 to-purple-300 rounded-full animate-pulse ml-0.5 delay-150 shadow-md shadow-blue-300/30"></div>
                    <div className="w-1 h-2 bg-gradient-to-t from-blue-200 to-purple-200 rounded-full animate-pulse ml-0.5 delay-300 shadow-sm shadow-blue-200/20"></div>
                  </span>
                )}
              </div>
            ) : isStreaming ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-bounce delay-100 shadow-md shadow-blue-300/30"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-bounce delay-200 shadow-sm shadow-blue-200/20"></div>
                </div>
                <span className="text-white/60 text-xs">Processing...</span>
              </div>
            ) : null}
          </div>
          
          {/* Task Progress Display for streaming assistant messages */}
          {message.role === 'assistant' && isStreaming && (
            <TaskProgressMessage 
              messageId={message.id}
              compact={true}
              showControls={true}
              className="mt-2 ml-10"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <TaskHandler>
      <div className={`conversation-stream ${className}`}>
      
      {/* Dynamic Widget-Driven Welcome */}
      {messages.length === 0 && (
        <ChatWelcome onSendMessage={onSendMessage} />
      )}

      {/* Messages - 现在包含流式消息 */}
      {messages.map((message, index) => (
        <div key={`${message.id}-${index}`}>
          {renderMessage(message, index)}
        </div>
      ))}

      {/* Chat Embedded Task Panel - Persistent task execution display */}
      <ChatEmbeddedTaskPanel 
        className="mb-6"
        initialCollapsed={false}
        onTaskAction={(taskId, action) => {
          console.log(`Task ${action} requested for task ${taskId}`);
        }}
      />

      {/* Typing indicator - 只在没有流式消息时显示 */}
      {isTyping && !messages.some(m => m.isStreaming) && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[80%]">
            {showAvatars && (
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--glass-secondary)', color: 'var(--text-primary)' }}>
                  AI
                </div>
              </div>
            )}
            
            <div className="p-3 rounded-lg" style={{ background: 'var(--glass-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-bounce delay-100 shadow-md shadow-blue-300/30"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-bounce delay-200 shadow-sm shadow-blue-200/20"></div>
                </div>
                <span className="text-white/70 text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator - 只在没有流式消息时显示 */}
      {isLoading && !isTyping && !messages.some(m => m.isStreaming) && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-bounce delay-100 shadow-md shadow-blue-300/30"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-bounce delay-200 shadow-sm shadow-blue-200/20"></div>
            </div>
            <span className="text-white/60 text-sm font-medium">Processing your request...</span>
          </div>
        </div>
      )}
      </div>
    </TaskHandler>
  );
});