/**
 * ============================================================================
 * 聊天模块 (ChatModule.tsx) - 聊天功能的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理聊天相关的所有业务逻辑
 * - 管理AI客户端交互和消息发送
 * - 封装用户认证和会话管理逻辑
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 聊天业务逻辑的统一管理
 *   - AI客户端和状态管理的集成
 *   - 消息发送和接收的协调
 *   - 用户认证和权限管理
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由ChatLayout处理）
 *   - 组件的直接渲染（由components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 *   - 数据解析（由services处理）
 * 
 * 【数据流向】
 * main_app → ChatModule → ChatLayout
 * hooks → ChatModule → 事件回调 → stores → api/services
 */
import React, { useCallback } from 'react';
import { ChatLayout, ChatLayoutProps } from '../components/ui/chat/ChatLayout';
import { ChatMessage } from '../types/chatTypes';
import { useChat } from '../hooks/useChat';
import { useChatActions } from '../stores/useChatStore';
import { useAuth } from '../hooks/useAuth';
import { useArtifactLogic } from './ArtifactModule';
import { ArtifactComponent } from '../components/ui/chat/ArtifactComponent';

interface ChatModuleProps extends Omit<ChatLayoutProps, 'messages' | 'isLoading' | 'isTyping' | 'onSendMessage' | 'onSendMultimodal'> {
  // All ChatLayout props except the data and callback props that we'll provide from business logic
}

/**
 * Chat Module - Business logic module for ChatLayout
 * 
 * This module:
 * - Uses hooks to get chat state and AI client
 * - Handles all message sending business logic
 * - Manages user authentication and session data
 * - Passes pure data and callbacks to ChatLayout
 * - Keeps ChatLayout as pure UI component
 */
export const ChatModule: React.FC<ChatModuleProps> = (props) => {
  // Get chat interface state using the hook
  const chatInterface = useChat();
  
  // Get chat actions for business logic (NO direct client access)
  const chatActions = useChatActions();
  
  // Get user info for metadata enrichment
  const { auth0User } = useAuth();
  
  // Get artifact logic for handling artifacts in messages
  const artifactLogic = useArtifactLogic();
  
  console.log('📦 CHAT_MODULE: Providing data to ChatLayout:', {
    messagesCount: chatInterface.messages.length,
    isLoading: chatInterface.isLoading,
    isTyping: chatInterface.isTyping,
    hasStreamingMessage: chatInterface.hasStreamingMessage,
    chatActionsAvailable: !!chatActions,
    artifactsCount: artifactLogic.artifacts.length,
    latestArtifact: artifactLogic.latestWidgetArtifact?.appName
  });
  
  // Business logic: Handle message sending
  const handleSendMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    console.log('📨 CHAT_MODULE: sendMessage called with:', content);
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      auth0_id: auth0User?.sub || 'anonymous',
      session_id: metadata?.session_id || 'default'
    };
    
    // Create user message and add to store - this will trigger the reactive subscriber
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      metadata: enrichedMetadata,
      processed: false // Important: mark as unprocessed so reactive trigger handles it
    };
    
    console.log('📨 CHAT_MODULE: Adding user message to trigger reactive flow');
    chatActions.addMessage(userMessage);
    
    // Note: The actual API call will be handled by the reactive subscriber in useChatStore
    console.log('✅ CHAT_MODULE: User message added, reactive trigger will handle API call');
  }, [chatActions, auth0User]);

  // Business logic: Handle multimodal message sending
  const handleSendMultimodal = useCallback(async (content: string, files: File[], metadata?: Record<string, any>) => {
    console.log('📨 CHAT_MODULE: sendMultimodalMessage called with:', content, files.length, 'files');
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      auth0_id: auth0User?.sub || 'anonymous',
      session_id: metadata?.session_id || 'default',
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })) // Add file info to metadata
    };
    
    // Create user message and add to store - this will trigger the reactive subscriber
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      metadata: enrichedMetadata,
      processed: false // Important: mark as unprocessed so reactive trigger handles it
    };
    
    console.log('📨 CHAT_MODULE: Adding multimodal user message to trigger reactive flow');
    chatActions.addMessage(userMessage);
    
    // Note: File handling and API call will be handled by the reactive subscriber
    console.log('✅ CHAT_MODULE: Multimodal user message added, reactive trigger will handle processing');
  }, [chatActions, auth0User]);

  // Pass all data and business logic callbacks as props to pure UI component
  return (
    <ChatLayout
      {...props}
      messages={chatInterface.messages}
      isLoading={chatInterface.isLoading}
      isTyping={chatInterface.isTyping}
      onSendMessage={handleSendMessage}
      onSendMultimodal={handleSendMultimodal}
    />
  );
};