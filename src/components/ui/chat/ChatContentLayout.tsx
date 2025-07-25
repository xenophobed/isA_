/**
 * ============================================================================
 * 聊天内容布局组件 (ChatContentLayout.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 聊天消息显示的容器组件
 * - 管理自动滚动和消息渲染
 * - 桥接ChatLayout和ConversationStreamModule
 * 
 * 【消息传递】
 * 直接将messages属性传递给ConversationStreamModule进行渲染
 * 不处理消息创建或修改，只负责显示
 * 
 * 【重要】这是纯显示组件，不会创建或修改消息
 */
import React, { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatMessage } from '../../../types/chatTypes';

export interface ChatContentLayoutProps {
  showTimestamps?: boolean;
  showAvatars?: boolean;
  autoScroll?: boolean;
  welcomeMessage?: string;
  enableMessageGrouping?: boolean;
  messageGroupingTimeGap?: number;
  onMessageClick?: (message: any) => void;
  customMessageRenderer?: (message: any, index: number) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  messages?: ChatMessage[];  // Accept messages as prop
  isLoading?: boolean;       // Accept loading state as prop
  isTyping?: boolean;        // Accept typing state as prop
}

/**
 * Standalone ChatContentLayout for main_app
 * Uses centralized useAppStore for messages
 */
export const ChatContentLayout: React.FC<ChatContentLayoutProps> = ({
  showTimestamps = true,
  showAvatars = true,
  autoScroll = true,
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?",
  enableMessageGrouping = true,
  messageGroupingTimeGap = 60000,
  onMessageClick,
  customMessageRenderer,
  className = '',
  children,
  messages = [],  // Use prop instead of context
  isLoading = false,
  isTyping = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current streaming status from the last message
  const streamingMessage = messages.find(m => m.isStreaming);
  const streamingStatus = streamingMessage?.streamingStatus;
  
  // Debug streaming status
  if (streamingMessage) {
    console.log('🔍 CHAT_CONTENT: Streaming message found:', {
      id: streamingMessage.id,
      isStreaming: streamingMessage.isStreaming,
      streamingStatus: streamingMessage.streamingStatus,
      contentLength: streamingMessage.content.length
    });
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  return (
    <div 
      className={`isa-chat-content-layout overflow-y-auto p-4 space-y-4 ${className}`}
      style={{
        flex: '1 !important',
        overflow: 'auto !important',
        background: 'transparent !important',
        padding: '1rem !important',
        display: 'block !important',
        height: '100%'
      }}
    >
      {/* Streaming Status Display - Top Right Corner */}
      {streamingMessage && streamingStatus && (
        <div className="fixed top-20 right-4 z-50 bg-blue-500/20 border border-blue-500/30 backdrop-blur-lg rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>{streamingStatus}</span>
          </div>
        </div>
      )}
      {/* Debug: Always show when there's a streaming message */}
      {streamingMessage && (
        <div className="fixed top-32 right-4 z-50 bg-red-500/20 border border-red-500/30 backdrop-blur-lg rounded-lg px-4 py-2 shadow-lg text-xs">
          DEBUG: isStreaming={String(streamingMessage.isStreaming)}, status="{streamingMessage.streamingStatus}", content={streamingMessage.content.length}
        </div>
      )}

      <MessageList
        showTimestamps={showTimestamps}
        showAvatars={showAvatars}
        autoScroll={false} // Handled by this component
        welcomeMessage={welcomeMessage}
        enableMessageGrouping={enableMessageGrouping}
        messageGroupingTimeGap={messageGroupingTimeGap}
        onMessageClick={onMessageClick}
        customMessageRenderer={customMessageRenderer}
        className="isa-conversation-stream"
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
      />

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />

      {/* Optional extra content */}
      {children && (
        <div className="isa-chat-content-extra">
          {children}
        </div>
      )}
    </div>
  );
};