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
// 使用全局实例获取函数而不是直接导入
import { getChatServiceInstance } from '../hooks/useChatService';
import { ChatMetadata, ChatMessage, StreamingStatus } from '../types/chatTypes';
import { useUserStore } from './useUserStore';
import { useSessionStore } from './useSessionStore';
import { TaskItem, TaskProgress } from '../api/SSEParser';

interface ChatStoreState {
  // 聊天消息
  messages: ChatMessage[];
  
  // 聊天状态
  isTyping: boolean;
  chatLoading: boolean;
  
  // 任务管理状态
  currentTasks: TaskItem[];
  taskProgress: TaskProgress | null;
  isExecutingPlan: boolean;
  
  // 流式消息状态已集成到messages中
}

interface ChatActions {
  // 消息操作
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  loadMessagesFromSession: (sessionId?: string) => void;
  
  // 消息发送
  sendMessage: (content: string, metadata?: ChatMetadata, token?: string) => Promise<void>;
  sendMultimodalMessage: (content: string, files: File[], metadata?: ChatMetadata) => Promise<void>;
  
  // 聊天状态
  setIsTyping: (typing: boolean) => void;
  setChatLoading: (loading: boolean) => void;
  
  // 任务管理操作
  updateTaskList: (tasks: TaskItem[]) => void;
  updateTaskProgress: (progress: TaskProgress | null) => void;
  updateTaskStatus: (taskId: string, status: TaskItem['status'], result?: any) => void;
  setExecutingPlan: (executing: boolean) => void;
  clearTasks: () => void;
  
  // 流式消息操作
  startStreamingMessage: (id: string, status?: string) => void;
  appendToStreamingMessage: (content: string) => void;
  finishStreamingMessage: () => void;
  updateStreamingStatus: (status: StreamingStatus | string) => void;
}

export type ChatStore = ChatStoreState & ChatActions;

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    messages: [],
    isTyping: false,
    chatLoading: false,
    
    // 任务管理初始状态
    currentTasks: [],
    taskProgress: null,
    isExecutingPlan: false,
    
    // 消息操作
    addMessage: (message) => {
      set((state) => {
        // Check if message with same ID already exists
        const existingIndex = state.messages.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          // Update existing message
          const newMessages = [...state.messages];
          newMessages[existingIndex] = message;
          return { messages: newMessages };
        } else {
          // Add new message
          return { messages: [...state.messages, message] };
        }
      });
      
      // 同时将消息添加到当前session（防止循环调用）
      if (!message.metadata?._skipSessionSync) {
        const sessionStore = useSessionStore.getState();
        const currentSession = sessionStore.getCurrentSession();
        if (currentSession) {
          // 添加标记防止循环调用
          const messageWithFlag = { ...message, metadata: { ...message.metadata, _skipSessionSync: true } };
          sessionStore.addMessage(currentSession.id, messageWithFlag);
        }
      }
      
      logger.info(LogCategory.CHAT_FLOW, 'Message added/updated in chat store and session', { 
        messageId: message.id, 
        role: message.role, 
        contentLength: message.content.length 
      });
    },

    clearMessages: () => {
      set({ messages: [] });
      
      // 同时清空当前session的消息
      const sessionStore = useSessionStore.getState();
      const currentSession = sessionStore.getCurrentSession();
      if (currentSession) {
        sessionStore.clearMessages(currentSession.id);
      }
      
      logger.info(LogCategory.CHAT_FLOW, 'Messages cleared from chat store and session', {
        sessionId: currentSession?.id
      });
    },
    
    // 新增：从session加载消息到chat store
    loadMessagesFromSession: (sessionId?: string) => {
      const sessionStore = useSessionStore.getState();
      const session = sessionId 
        ? sessionStore.getSessionById(sessionId)
        : sessionStore.getCurrentSession();
      
      if (session?.messages) {
        // 直接设置消息，不触发addMessage的同步逻辑
        const messagesWithFlag = session.messages.map(msg => ({
          ...msg,
          metadata: { ...msg.metadata, _skipSessionSync: true }
        }));
        set({ messages: messagesWithFlag });
        logger.info(LogCategory.CHAT_FLOW, 'Messages loaded from session to chat store', {
          sessionId: session.id,
          messageCount: session.messages.length
        });
      } else {
        set({ messages: [] });
        logger.info(LogCategory.CHAT_FLOW, 'No messages to load from session', {
          sessionId: session?.id || 'none'
        });
      }
    },

    // 消息发送 - 添加初始化检查和重试机制以及token支持
    sendMessage: async (content, metadata = {}, token?: string) => {
      const { 
        setChatLoading, 
        setIsTyping, 
        startStreamingMessage, 
        appendToStreamingMessage, 
        updateStreamingStatus, 
        finishStreamingMessage,
        updateTaskProgress,
        updateTaskList,
        updateTaskStatus,
        setExecutingPlan
      } = get();

      setChatLoading(true);
      setIsTyping(true);

      try {
        // 获取 ChatService 实例 - 添加重试机制
        let chatService = getChatServiceInstance();
        console.log('💬 useChatStore.sendMessage: ChatService check', { 
          hasChatService: !!chatService,
          serviceType: chatService?.constructor?.name,
          timestamp: new Date().toISOString()
        });
        
        // 如果 ChatService 不可用，等待一下再重试
        if (!chatService) {
          console.warn('💬 useChatStore.sendMessage: ChatService not ready, waiting 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          chatService = getChatServiceInstance();
          
          if (!chatService) {
            console.warn('💬 useChatStore.sendMessage: ChatService still not ready, waiting 1000ms...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            chatService = getChatServiceInstance();
          }
        }
        
        if (!chatService) {
          const errorMsg = 'ChatService not initialized after retries - AIProvider may have failed to initialize';
          console.error('💬 useChatStore.sendMessage: ChatService missing after retries', {
            error: errorMsg,
            timestamp: new Date().toISOString()
          });
          throw new Error(errorMsg);
        }

        console.log('💬 useChatStore.sendMessage: Using ChatService instance', {
          serviceReady: true,
          timestamp: new Date().toISOString()
        });

        logger.info(LogCategory.CHAT_FLOW, 'Sending message via chatService', {
          contentLength: content.length,
          hasMetadata: Object.keys(metadata).length > 0,
          hasToken: !!token
        });
        
        // 使用 chatService 实例，现在需要token参数
        const authToken = token || 'dev_key_test'; // 如果没有提供token，使用默认值作为fallback
        
        await chatService.sendMessage(content, metadata, authToken, {
          onStreamStart: (messageId: string, status?: string) => {
            startStreamingMessage(messageId, status);
            setExecutingPlan(true); // 开始执行计划
          },
          onStreamContent: (contentChunk: string) => {
            appendToStreamingMessage(contentChunk);
          },
          onStreamStatus: (status: string) => {
            updateStreamingStatus(status);
          },
          onStreamComplete: () => {
            finishStreamingMessage();
            setChatLoading(false);
            setIsTyping(false);
            setExecutingPlan(false); // 完成执行计划
            logger.info(LogCategory.CHAT_FLOW, 'Message sending completed successfully');
          },
          onBillingUpdate: (billingData: { creditsRemaining: number; totalCredits: number; modelCalls: number; toolCalls: number }) => {
            // 更新用户credit余额
            logger.info(LogCategory.CHAT_FLOW, 'Billing update received', billingData);
            const userStore = useUserStore.getState();
            userStore.updateCredits(billingData.creditsRemaining);
          },
          onTaskProgress: (progress: TaskProgress) => {
            updateTaskProgress(progress);
          },
          onTaskListUpdate: (tasks: TaskItem[]) => {
            updateTaskList(tasks);
          },
          onTaskStatusUpdate: (taskId: string, status: string, result?: any) => {
            updateTaskStatus(taskId, status as TaskItem['status'], result);
          },
          onError: (error: Error) => {
            logger.error(LogCategory.CHAT_FLOW, 'Message sending failed', { error: error.message });
            setChatLoading(false);
            setIsTyping(false);
            setExecutingPlan(false); // 错误时停止执行
          }
        });
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to send message', { error });
        setChatLoading(false);
        setIsTyping(false);
        setExecutingPlan(false);
      }
    },

    sendMultimodalMessage: async (content, files, metadata = {}, token?: string) => {
      const { 
        setChatLoading, 
        setIsTyping, 
        startStreamingMessage, 
        appendToStreamingMessage, 
        finishStreamingMessage, 
        updateStreamingStatus,
        updateTaskProgress,
        updateTaskList,
        updateTaskStatus,
        setExecutingPlan
      } = get();
      
      setChatLoading(true);
      setIsTyping(true);
      
      try {
        logger.info(LogCategory.CHAT_FLOW, 'Sending multimodal message via chatService', {
          contentLength: content.length,
          fileCount: files.length,
          hasMetadata: Object.keys(metadata).length > 0,
          hasToken: !!token
        });
        
        // 使用 chatService 实例，现在需要token参数
        const authToken = token || 'dev_key_test'; // 如果没有提供token，使用默认值作为fallback
        
        // 获取 ChatService 实例 - 添加重试机制
        let chatService = getChatServiceInstance();
        console.log('💬 useChatStore.sendMultimodalMessage: ChatService check', { 
          hasChatService: !!chatService,
          serviceType: chatService?.constructor?.name,
          timestamp: new Date().toISOString()
        });
        
        // 如果 ChatService 不可用，等待一下再重试
        if (!chatService) {
          console.warn('💬 useChatStore.sendMultimodalMessage: ChatService not ready, waiting 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          chatService = getChatServiceInstance();
          
          if (!chatService) {
            console.warn('💬 useChatStore.sendMultimodalMessage: ChatService still not ready, waiting 1000ms...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            chatService = getChatServiceInstance();
          }
        }
        
        if (!chatService) {
          const errorMsg = 'ChatService not initialized after retries - AIProvider may have failed to initialize';
          console.error('💬 useChatStore.sendMultimodalMessage: ChatService missing after retries', {
            error: errorMsg,
            timestamp: new Date().toISOString()
          });
          throw new Error(errorMsg);
        }
        
        // 使用 chatService 实例
        await chatService.sendMultimodalMessage(content, files, metadata, authToken, {
          onStreamStart: (messageId: string, status?: string) => {
            startStreamingMessage(messageId, status);
            setExecutingPlan(true);
          },
          onStreamContent: (contentChunk: string) => {
            appendToStreamingMessage(contentChunk);
          },
          onStreamStatus: (status: string) => {
            updateStreamingStatus(status);
          },
          onStreamComplete: () => {
            finishStreamingMessage();
            setChatLoading(false);
            setIsTyping(false);
            setExecutingPlan(false);
            logger.info(LogCategory.CHAT_FLOW, 'Multimodal message sending completed successfully');
          },
          onBillingUpdate: (billingData: { creditsRemaining: number; totalCredits: number; modelCalls: number; toolCalls: number }) => {
            // 更新用户credit余额
            logger.info(LogCategory.CHAT_FLOW, 'Billing update received', billingData);
            const userStore = useUserStore.getState();
            userStore.updateCredits(billingData.creditsRemaining);
          },
          onTaskProgress: (progress: TaskProgress) => {
            updateTaskProgress(progress);
          },
          onTaskListUpdate: (tasks: TaskItem[]) => {
            updateTaskList(tasks);
          },
          onTaskStatusUpdate: (taskId: string, status: string, result?: any) => {
            updateTaskStatus(taskId, status as TaskItem['status'], result);
          },
          onError: (error) => {
            logger.error(LogCategory.CHAT_FLOW, 'Multimodal message sending failed', { error: error.message });
            setChatLoading(false);
            setIsTyping(false);
            setExecutingPlan(false);
          }
        });
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

    // 任务管理操作
    updateTaskList: (tasks) => {
      set({ currentTasks: tasks });
      logger.info(LogCategory.CHAT_FLOW, 'Task list updated', { taskCount: tasks.length });
    },

    updateTaskProgress: (progress) => {
      set({ taskProgress: progress });
      if (progress) {
        logger.info(LogCategory.CHAT_FLOW, 'Task progress updated', { 
          toolName: progress.toolName, 
          status: progress.status,
          step: progress.currentStep,
          total: progress.totalSteps
        });
      }
    },

    updateTaskStatus: (taskId, status, result) => {
      set((state) => ({
        currentTasks: state.currentTasks.map(task => 
          task.id === taskId 
            ? { ...task, status, result, updatedAt: new Date().toISOString() }
            : task
        )
      }));
      logger.info(LogCategory.CHAT_FLOW, 'Task status updated', { taskId, status });
    },

    setExecutingPlan: (executing) => {
      set({ isExecutingPlan: executing });
      logger.info(LogCategory.CHAT_FLOW, `Plan execution ${executing ? 'started' : 'stopped'}`);
    },

    clearTasks: () => {
      set({ currentTasks: [], taskProgress: null, isExecutingPlan: false });
      logger.info(LogCategory.CHAT_FLOW, 'Tasks cleared');
    },

    // 流式消息操作
    startStreamingMessage: (id, status = '正在生成回应') => {
      set((state) => {
        // 检查是否已经有流式助手消息，避免重复创建
        const hasStreamingAssistantMessage = state.messages.some(m => m.isStreaming && m.role === 'assistant');
        if (hasStreamingAssistantMessage) {
          console.warn('⚠️ CHAT_STORE: Streaming assistant message already exists, skipping creation');
          return state;
        }
        
        console.log('🔥 CHAT_STORE: Creating streaming message', { id, status, currentMessageCount: state.messages.length });
        
        // Get current session for proper session ID
        const sessionStore = useSessionStore.getState();
        const currentSession = sessionStore.getCurrentSession();
        
        const streamingMessage: ChatMessage = {
          id,
          role: 'assistant' as const,
          type: 'regular',
          content: '',
          timestamp: new Date().toISOString(),
          sessionId: currentSession?.id || 'default',
          isStreaming: true,
          streamingStatus: status
        };
        
        // 不要在开始时同步到session，只有完成时才同步
        // 这样避免创建两条消息：一条空的，一条完整的
        
        const newMessages = [...state.messages, streamingMessage];
        console.log('🔥 CHAT_STORE: New messages array length:', newMessages.length);
        
        return {
          messages: newMessages
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
        
        // Handle both RegularMessage and ArtifactMessage types
        if (lastMessage.type === 'regular') {
          console.log('📋 CHAT_STORE: Last message details (regular):', {
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
        } else if (lastMessage.type === 'artifact') {
          console.log('📋 CHAT_STORE: Last message details (artifact):', {
            id: lastMessage.id,
            role: lastMessage.role,
            isStreaming: lastMessage.isStreaming,
            artifactContent: lastMessage.artifact.content,
            hasStreamingStatus: !!lastMessage.streamingStatus
          });
          
          if (!lastMessage.isStreaming) {
            console.log('❌ CHAT_STORE: Last artifact message is not streaming - cannot append');
            return state;
          }
          
          // For artifact messages, append to the artifact content
          const currentArtifactContent = typeof lastMessage.artifact.content === 'string' ? lastMessage.artifact.content : '';
          const newArtifactContent = currentArtifactContent + content;
          
          console.log('✅ CHAT_STORE: Appending content to artifact successfully', { 
            messageId: lastMessage.id,
            appendedContent: content,
            oldLength: currentArtifactContent.length,
            newLength: newArtifactContent.length
          });
          
          const updatedMessages = [...state.messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            artifact: {
              ...lastMessage.artifact,
              content: newArtifactContent
            }
          };
          
          return { messages: updatedMessages };
        } else {
          console.log('❌ CHAT_STORE: Unknown message type - cannot append');
          return state;
        }
      });
    },

    finishStreamingMessage: () => {
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage || !lastMessage.isStreaming) return state;
        
        const finishedMessage = {
          ...lastMessage,
          isStreaming: false,
          streamingStatus: undefined
        };
        
        const updatedMessages = [...state.messages];
        updatedMessages[updatedMessages.length - 1] = finishedMessage;
        
        // 重要：将完成的AI消息同步到session
        const sessionStore = useSessionStore.getState();
        const currentSession = sessionStore.getCurrentSession();
        if (currentSession) {
          let messageWithFlag: ChatMessage;
          
          if (finishedMessage.type === 'regular') {
            messageWithFlag = { 
              ...finishedMessage, 
              metadata: { ...finishedMessage.metadata, _skipSessionSync: true } 
            };
          } else {
            // For artifact messages, we don't have metadata property, so just add the flag directly
            messageWithFlag = { 
              ...finishedMessage,
              // Add a temporary property to indicate session sync (this might need to be handled differently)
            } as ChatMessage;
          }
          
          sessionStore.addMessage(currentSession.id, messageWithFlag);
          logger.debug(LogCategory.CHAT_FLOW, 'Finished streaming message synced to session', {
            messageId: finishedMessage.id,
            sessionId: currentSession.id
          });
        }
        
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

// 任务管理选择器
export const useCurrentTasks = () => useChatStore(state => state.currentTasks);
export const useTaskProgress = () => useChatStore(state => state.taskProgress);
export const useIsExecutingPlan = () => useChatStore(state => state.isExecutingPlan);

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

// 任务管理操作
export const useTaskActions = () => useChatStore(state => ({
  updateTaskList: state.updateTaskList,
  updateTaskProgress: state.updateTaskProgress,
  updateTaskStatus: state.updateTaskStatus,
  setExecutingPlan: state.setExecutingPlan,
  clearTasks: state.clearTasks
}));

// ================================================================================
// Reactive Widget Trigger - Check for widget triggers and handle routing
// ================================================================================

// Import app store for widget management - using dynamic import to avoid circular dependency
const getAppStore = async () => {
  const { useAppStore } = await import('./useAppStore');
  return useAppStore;
};

// Simple keyword-based widget detection
const detectWidgetByKeywords = (userInput: string, hasFiles: boolean = false): string | null => {
  // If files are uploaded, always suggest knowledge widget
  if (hasFiles) {
    return 'knowledge';
  }

  const input = userInput.toLowerCase();
  
  // Widget detection rules - order matters (most specific first)
  const rules = [
    { 
      widget: 'dream', 
      keywords: ['image', 'picture', 'photo', 'draw', 'art', 'visual'] 
    },
    { 
      widget: 'hunt', 
      keywords: ['search', 'find', 'buy', 'shop', 'product', 'price'] 
    },
    { 
      widget: 'data-scientist', 
      keywords: ['analyze', 'data', 'chart', 'graph', 'statistics', 'plot'] 
    },
    { 
      widget: 'omni', 
      keywords: ['write', 'content', 'article', 'blog', 'draft', 'story'] 
    },
    { 
      widget: 'knowledge', 
      keywords: ['document', 'pdf', 'file', 'summarize', 'extract'] 
    }
  ];
  
  // Check each rule
  for (const rule of rules) {
    const hasKeyword = rule.keywords.some(keyword => input.includes(keyword));
    
    if (hasKeyword) {
      console.log('🎯 KEYWORD_TRIGGER: Detected widget:', rule.widget, 'for input:', userInput);
      return rule.widget;
    }
  }
  
  // No widget triggered
  return null;
};

// Available apps configuration
const AVAILABLE_APPS = [
  { id: 'dream', name: 'DreamForge AI' },
  { id: 'hunt', name: 'HuntAI' },
  { id: 'omni', name: 'Omni Content' },
  { id: 'assistant', name: 'AI Assistant' },
  { id: 'data-scientist', name: 'DataWise Analytics' },
  { id: 'knowledge', name: 'Knowledge Hub' }
];

// 移除：Reactive subscriber 不再需要，因为现在消息流程改为：
// ChatModule.handleSendMessage → useChatStore.addMessage → 直接调用 sendMessage
// 不再需要监听 messages 数组的变化来触发 API 调用