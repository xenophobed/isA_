import React, { useEffect, useRef } from 'react';
import { ConversationStreamModule } from '../modules/ConversationStreamModule';
import { ChatMessage, useChatLoading, useChatTyping } from '../../../stores/useAppStore';

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
  messages = []  // Use prop instead of context
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get loading and typing states from centralized store
  const isLoading = useChatLoading();
  const isTyping = useChatTyping();

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
        display: 'block !important'
      }}
    >
      <ConversationStreamModule
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