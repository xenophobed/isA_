/**
 * ============================================================================
 * 聊天状态管理 (useChatStore.ts) - 专注于聊天功能的状态管理
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理聊天消息数组，包括流式消息
 * - 处理消息的发送、接收、流式更新
 * - 管理聊天相关的加载和输入状态
 * - 提供统一的聊天操作接口
 * 
 * 【架构改进】
 * ✅ 新架构：useChatStore → chatService (BaseApiService + SSEParser)
 * ✅ 消除了window.streamingParser全局依赖
 * ✅ 统一了传输和解析逻辑
 * ✅ 清晰的回调接口和类型安全
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 聊天消息的存储和管理
 *   - 流式消息的创建、更新、完成
 *   - 聊天状态（typing, loading）
 *   - chatService回调处理
 * 
 * ❌ 不负责：
 *   - HTTP传输（由chatService/BaseApiService处理）
 *   - SSE解析（由chatService/SSEParser处理）
 *   - 会话管理（由useSessionStore处理）
 *   - 应用导航（由useAppStore处理）
 *   - 工件管理（由useArtifactStore处理）
 *   - 界面状态（由useAppStore处理）
 * 
 * 【消息结构】
 * ChatMessage {
 *   id: string
 *   role: 'user' | 'assistant'
 *   content: string
 *   timestamp: string
 *   metadata?: object
 *   isStreaming?: boolean - 标记流式消息
 *   streamingStatus?: string - 流式状态描述
 * }
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger, LogCategory } from '../utils/logger';
import { chatService } from '../api/chatService';
import { ChatMetadata } from '../types/chatTypes';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
  isStreaming?: boolean; // 标记是否为流式消息
  streamingStatus?: string; // 流式状态描述
  processed?: boolean; // 标记用户消息是否已发送到API
}

interface ChatState {
  // 聊天消息
  messages: ChatMessage[];
  
  // 聊天状态
  isTyping: boolean;
  chatLoading: boolean;
  
  // 流式消息状态已集成到messages中
}

interface ChatActions {
  // 消息操作
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  // 消息发送
  sendMessage: (content: string, metadata?: ChatMetadata) => Promise<void>;
  sendMultimodalMessage: (content: string, files: File[], metadata?: ChatMetadata) => Promise<void>;
  
  // 聊天状态
  setIsTyping: (typing: boolean) => void;
  setChatLoading: (loading: boolean) => void;
  
  // 流式消息操作
  startStreamingMessage: (id: string, status?: string) => void;
  appendToStreamingMessage: (content: string) => void;
  finishStreamingMessage: () => void;
  updateStreamingStatus: (status: string) => void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    messages: [],
    isTyping: false,
    chatLoading: false,
    
    // 消息操作
    addMessage: (message) => {
      set((state) => ({
        messages: [...state.messages, message]
      }));
      logger.info(LogCategory.CHAT_FLOW, 'Message added to chat store', { 
        messageId: message.id, 
        role: message.role, 
        contentLength: message.content.length 
      });
    },

    clearMessages: () => {
      set({ messages: [] });
      logger.info(LogCategory.CHAT_FLOW, 'Messages cleared from chat store');
    },

    // 消息发送
    sendMessage: async (content, metadata = {}) => {
      const { 
        setChatLoading, 
        setIsTyping, 
        startStreamingMessage, 
        appendToStreamingMessage, 
        finishStreamingMessage, 
        updateStreamingStatus 
      } = get();
      
      setChatLoading(true);
      setIsTyping(true);
      
      try {
        logger.info(LogCategory.CHAT_FLOW, 'Sending message via chatService', {
          contentLength: content.length,
          hasMetadata: Object.keys(metadata).length > 0
        });

        // 使用新的chatService
        await chatService.sendMessage(content, {
          onMessageStart: (messageId, status) => {
            startStreamingMessage(messageId, status);
          },
          onMessageContent: (contentChunk) => {
            appendToStreamingMessage(contentChunk);
          },
          onMessageStatus: (status) => {
            updateStreamingStatus(status);
          },
          onMessageComplete: () => {
            finishStreamingMessage();
            setChatLoading(false);
            setIsTyping(false);
            logger.info(LogCategory.CHAT_FLOW, 'Message sending completed successfully');
          },
          onError: (error) => {
            logger.error(LogCategory.CHAT_FLOW, 'Message sending failed', { error: error.message });
            setChatLoading(false);
            setIsTyping(false);
          }
        }, metadata);
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to send message', { error });
        setChatLoading(false);
        setIsTyping(false);
      }
    },

    sendMultimodalMessage: async (content, files, metadata = {}) => {
      const { 
        setChatLoading, 
        setIsTyping, 
        startStreamingMessage, 
        appendToStreamingMessage, 
        finishStreamingMessage, 
        updateStreamingStatus 
      } = get();
      
      setChatLoading(true);
      setIsTyping(true);
      
      try {
        logger.info(LogCategory.CHAT_FLOW, 'Sending multimodal message via chatService', {
          contentLength: content.length,
          fileCount: files.length,
          fileTypes: files.map(f => f.type),
          hasMetadata: Object.keys(metadata).length > 0
        });

        // 使用新的chatService
        await chatService.sendMultimodalMessage(content, files, {
          onMessageStart: (messageId, status) => {
            startStreamingMessage(messageId, status);
          },
          onMessageContent: (contentChunk) => {
            appendToStreamingMessage(contentChunk);
          },
          onMessageStatus: (status) => {
            updateStreamingStatus(status);
          },
          onMessageComplete: () => {
            finishStreamingMessage();
            setChatLoading(false);
            setIsTyping(false);
            logger.info(LogCategory.CHAT_FLOW, 'Multimodal message sending completed successfully');
          },
          onError: (error) => {
            logger.error(LogCategory.CHAT_FLOW, 'Multimodal message sending failed', { error: error.message });
            setChatLoading(false);
            setIsTyping(false);
          }
        }, metadata);
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to send multimodal message', { error });
        setChatLoading(false);
        setIsTyping(false);
      }
    },

    // 聊天状态
    setIsTyping: (typing) => {
      set({ isTyping: typing });
    },

    setChatLoading: (loading) => {
      set({ chatLoading: loading });
    },

    // 流式消息操作
    startStreamingMessage: (id, status = '正在生成回应') => {
      set((state) => {
        // 检查是否已经有流式消息，避免重复创建
        const hasStreamingMessage = state.messages.some(m => m.isStreaming);
        if (hasStreamingMessage) {
          console.warn('⚠️ CHAT_STORE: Streaming message already exists, skipping creation');
          return state;
        }
        
        return {
          messages: [...state.messages, {
            id,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
            streamingStatus: status
          }]
        };
      });
      logger.debug(LogCategory.CHAT_FLOW, 'Streaming message started in chat store', { id, status });
    },

    appendToStreamingMessage: (content) => {
      set((state) => {
        console.log('📝 CHAT_STORE: appendToStreamingMessage called with content:', content);
        console.log('📋 CHAT_STORE: Current messages count:', state.messages.length);
        
        const lastMessage = state.messages[state.messages.length - 1];
        
        if (!lastMessage) {
          console.log('❌ CHAT_STORE: No messages in array - cannot append');
          return state;
        }
        
        console.log('📋 CHAT_STORE: Last message details:', {
          id: lastMessage.id,
          role: lastMessage.role,
          isStreaming: lastMessage.isStreaming,
          contentLength: lastMessage.content.length,
          hasStreamingStatus: !!lastMessage.streamingStatus
        });
        
        if (!lastMessage.isStreaming) {
          console.log('❌ CHAT_STORE: Last message is not streaming - cannot append');
          return state;
        }
        
        const newContent = lastMessage.content + content;
        console.log('✅ CHAT_STORE: Appending content successfully', { 
          messageId: lastMessage.id,
          appendedContent: content,
          oldLength: lastMessage.content.length,
          newLength: newContent.length,
          totalContent: newContent.substring(0, 50) + '...'
        });
        
        const updatedMessages = [...state.messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: newContent
        };
        
        return { messages: updatedMessages };
      });
    },

    finishStreamingMessage: () => {
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage || !lastMessage.isStreaming) return state;
        
        const updatedMessages = [...state.messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          isStreaming: false,
          streamingStatus: undefined
        };
        
        return { messages: updatedMessages };
      });
      logger.debug(LogCategory.CHAT_FLOW, 'Streaming message finished in chat store');
    },

    updateStreamingStatus: (status) => {
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage || !lastMessage.isStreaming) return state;
        
        const updatedMessages = [...state.messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          streamingStatus: status
        };
        
        return { messages: updatedMessages };
      });
      logger.debug(LogCategory.CHAT_FLOW, 'Streaming status updated in chat store', { status });
    }
  }))
);

// Chat选择器
export const useChatMessages = () => useChatStore(state => state.messages);
export const useChatTyping = () => useChatStore(state => state.isTyping);
export const useChatLoading = () => useChatStore(state => state.chatLoading);

// Chat操作
export const useChatActions = () => useChatStore(state => ({
  addMessage: state.addMessage,
  sendMessage: state.sendMessage,
  sendMultimodalMessage: state.sendMultimodalMessage,
  setIsTyping: state.setIsTyping,
  setChatLoading: state.setChatLoading,
  clearMessages: state.clearMessages,
  startStreamingMessage: state.startStreamingMessage,
  finishStreamingMessage: state.finishStreamingMessage,
  appendToStreamingMessage: state.appendToStreamingMessage,
  updateStreamingStatus: state.updateStreamingStatus
}));

// ================================================================================
// Reactive Widget Trigger - Check for widget triggers and handle routing
// ================================================================================

// Import app store for widget management - using dynamic import to avoid circular dependency
const getAppStore = async () => {
  const { useAppStore } = await import('./useAppStore');
  return useAppStore;
};

// Available apps configuration
const AVAILABLE_APPS = [
  { id: 'dream', name: 'DreamForge AI', triggers: ['create image', 'generate image', 'make picture', 'draw'] },
  { id: 'hunt', name: 'HuntAI', triggers: ['search product', 'find item', 'compare prices', 'shop'] },
  { id: 'omni', name: 'Omni Content', triggers: ['generate content', 'create text', 'write', 'compose'] },
  { id: 'assistant', name: 'AI Assistant', triggers: ['help', 'assist', 'question', 'ask'] },
  { id: 'data-scientist', name: 'DataWise Analytics', triggers: ['analyze data', 'create chart', 'statistics'] },
  { id: 'knowledge', name: 'Knowledge Hub', triggers: ['analyze document', 'summarize', 'extract'] }
];

// Subscribe to message changes for widget triggers and API calls
useChatStore.subscribe(
  (state) => state.messages,
  (messages, previousMessages) => {
    // Find newly added user messages that haven't been processed
    const newUserMessages = messages.filter((message, index) => {
      // Check if this is a new message (not in previous state)
      const isNewMessage = !previousMessages || index >= previousMessages.length;
      // Check if it's a user message that hasn't been processed
      const isUnprocessedUserMessage = message.role === 'user' && !message.processed;
      
      return isNewMessage && isUnprocessedUserMessage;
    });
    
    // Process each new user message
    newUserMessages.forEach(async (userMessage) => {
      console.log('🚀 REACTIVE_TRIGGER: Processing user message:', userMessage.content);
      logger.info(LogCategory.CHAT_FLOW, 'Reactive trigger: Processing user message', {
        messageId: userMessage.id,
        contentLength: userMessage.content.length
      });
      
      try {
        // Mark message as processed immediately to prevent duplicate calls
        const state = useChatStore.getState();
        const updatedMessages = state.messages.map(msg => 
          msg.id === userMessage.id ? { ...msg, processed: true } : msg
        );
        useChatStore.setState({ messages: updatedMessages });
        
        // Check for widget triggers
        const lowerMessage = userMessage.content.toLowerCase();
        let triggeredApp = null;
        
        for (const app of AVAILABLE_APPS) {
          const matchingTrigger = app.triggers.find(trigger => lowerMessage.includes(trigger));
          if (matchingTrigger) {
            triggeredApp = app;
            logger.info(LogCategory.APP_TRIGGER, 'Widget trigger detected', { 
              appId: app.id, 
              trigger: matchingTrigger 
            });
            console.log('🎯 REACTIVE_TRIGGER: Widget trigger detected!', { 
              app: app.name, 
              trigger: matchingTrigger 
            });
            break;
          }
        }
        
        if (triggeredApp) {
          // Open widget and block chat API call
          const appStore = await getAppStore();
          const { currentApp, showRightSidebar, setCurrentApp, setShowRightSidebar, setTriggeredAppInput } = appStore.getState();
          
          // If the app is already open, send to both widget and chat
          if (currentApp === triggeredApp.id && showRightSidebar) {
            console.log('✅ REACTIVE_TRIGGER: App already open, sending to both widget and chat');
            // TODO: Send to widget AND continue with chat API
            await state.sendMessage(userMessage.content, userMessage.metadata || {});
          } else {
            // Open widget and let widget handle the request
            console.log('📱 REACTIVE_TRIGGER: Opening widget, blocking chat API');
            setTimeout(() => {
              setCurrentApp(triggeredApp.id as any); // Cast to AppId type
              setShowRightSidebar(true);
              setTriggeredAppInput(userMessage.content);
              console.log('✨ REACTIVE_TRIGGER: Widget opened successfully:', triggeredApp.id);
            }, 100); // Reduced delay for better UX
            
            // Don't send to chat API - widget will handle
          }
        } else {
          // No widget triggered, send to chat API normally
          console.log('💬 REACTIVE_TRIGGER: No widget trigger, sending to chat API');
          await state.sendMessage(userMessage.content, userMessage.metadata || {});
        }
        
        console.log('✅ REACTIVE_TRIGGER: Message processing completed');
      } catch (error) {
        console.error('❌ REACTIVE_TRIGGER: Failed to process message:', error);
        logger.error(LogCategory.CHAT_FLOW, 'Reactive trigger failed', { 
          error: error instanceof Error ? error.message : String(error),
          messageId: userMessage.id 
        });
      }
    });
  }
);