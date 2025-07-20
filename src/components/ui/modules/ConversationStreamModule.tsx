import React from 'react';
import { ChatMessage, useStreamingMessage } from '../../../stores/useAppStore';

export interface ConversationStreamModuleProps {
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
 * Simplified ConversationStreamModule for main_app
 * Displays chat messages without complex SDK dependencies
 */
export const ConversationStreamModule: React.FC<ConversationStreamModuleProps> = ({
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
  console.log('💬 ConversationStreamModule: Rendering with', messages.length, 'messages:', messages);
  
  // Get streaming message state
  const streamingMessage = useStreamingMessage();

  // Default message renderer
  const renderMessage = (message: any, index: number) => {
    // Use custom renderer if provided
    if (customMessageRenderer) {
      return customMessageRenderer(message, index);
    }

    // Default rendering
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
                  : 'bg-gray-700 text-white'
              }`}>
                {message.role === 'user' ? 'U' : 'AI'}
              </div>
            </div>
          )}
          
          <div 
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-white border border-gray-600'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            
            {showTimestamps && (
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

      {/* Messages */}
      {messages.map((message, index) => renderMessage(message, index))}

      {/* Streaming message */}
      {streamingMessage && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[80%]">
            {showAvatars && (
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  🤖
                </div>
                <div className="ml-2 text-xs text-gray-400">
                  {streamingMessage.status}...
                </div>
              </div>
            )}
            
            <div className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg">
              {/* Status indicator */}
              {streamingMessage.status && streamingMessage.status !== 'streaming' && (
                <div className="text-xs text-blue-300 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  {streamingMessage.status}
                </div>
              )}
              
              <div className="whitespace-pre-wrap">
                {streamingMessage.content}
                {streamingMessage.content && <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>}
              </div>
              
              {/* Show if no content but there's status */}
              {!streamingMessage.content && streamingMessage.status && (
                <div className="text-gray-400 italic">
                  {streamingMessage.status}...
                </div>
              )}
            </div>
            
            {showTimestamps && (
              <div className="text-xs text-gray-500 mt-1">
                <div className="flex items-center gap-2">
                  <span>正在处理</span>
                  {streamingMessage.status && (
                    <>
                      <span>•</span>
                      <span>{streamingMessage.status}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && !streamingMessage && (
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

      {/* Loading indicator */}
      {isLoading && !isTyping && (
        <div className="text-center py-4">
          <div className="text-gray-400 text-sm">Processing your request...</div>
        </div>
      )}
    </div>
  );
};