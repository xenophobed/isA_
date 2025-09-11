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
import { TaskItem, TaskProgress } from '../types/taskTypes';
import { HILInterruptDetectedEvent, HILCheckpointCreatedEvent, HILExecutionStatusData } from '../types/aguiTypes';
import { createContentParser, ParsedContent } from '../api/parsing/ContentParser';

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
  hasExecutedTasks: boolean; // 用于持久化显示任务面板
  
  // HIL (Human-in-the-Loop) 状态
  hilStatus: 'idle' | 'waiting_for_human' | 'processing_response' | 'error';
  currentHILInterrupt: HILInterruptDetectedEvent | null;
  hilHistory: HILInterruptDetectedEvent[];
  hilCheckpoints: HILCheckpointCreatedEvent[];
  currentThreadId: string | null;
  
  // 流式消息状态已集成到messages中
}

interface ChatActions {
  // 消息操作
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  loadMessagesFromSession: (sessionId?: string) => void;
  
  // 消息发送已移至 ChatModule 业务逻辑层
  
  // 聊天状态
  setIsTyping: (typing: boolean) => void;
  setChatLoading: (loading: boolean) => void;
  
  // 任务管理操作
  updateTaskList: (tasks: TaskItem[]) => void;
  updateTaskProgress: (progress: TaskProgress | null) => void;
  updateTaskStatus: (taskId: string, status: TaskItem['status'], result?: any) => void;
  setExecutingPlan: (executing: boolean) => void;
  clearTasks: () => void;
  resetTaskHistory: () => void; // 重置任务历史，用于新会话
  
  // 流式消息操作
  startStreamingMessage: (id: string, status?: string) => void;
  appendToStreamingMessage: (content: string) => void;
  finishStreamingMessage: () => void;
  updateStreamingStatus: (status: StreamingStatus | string) => void;
  
  // HIL操作
  setHILStatus: (status: 'idle' | 'waiting_for_human' | 'processing_response' | 'error') => void;
  setCurrentHILInterrupt: (interrupt: HILInterruptDetectedEvent | null) => void;
  addHILToHistory: (interrupt: HILInterruptDetectedEvent) => void;
  addHILCheckpoint: (checkpoint: HILCheckpointCreatedEvent) => void;
  setCurrentThreadId: (threadId: string | null) => void;
  clearHILState: () => void;
  // HIL Resume操作 (基于实际测试的API)
  resumeHILExecution: (sessionId: string, resumeValue: any, token?: string) => Promise<void>;
  // Execution Status监控 (基于实际测试的API)
  checkExecutionStatus: (sessionId: string, token?: string) => Promise<any>;
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
    hasExecutedTasks: false,
    
    // HIL初始状态
    hilStatus: 'idle',
    currentHILInterrupt: null,
    hilHistory: [],
    hilCheckpoints: [],
    currentThreadId: null,
    
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
      if (!('metadata' in message && message.metadata?._skipSessionSync)) {
        const sessionStore = useSessionStore.getState();
        const currentSession = sessionStore.getCurrentSession();
        if (currentSession) {
          // 添加标记防止循环调用
          const messageWithFlag = { ...message, metadata: { ...('metadata' in message ? message.metadata : {}), _skipSessionSync: true } };
          sessionStore.addMessage(currentSession.id, messageWithFlag as any); // TODO: Fix type compatibility
        }
      }
      
      logger.info(LogCategory.CHAT_FLOW, 'Message added/updated in chat store and session', { 
        messageId: message.id, 
        role: message.role, 
        contentLength: ('content' in message && message.content) ? message.content.length : 0 
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
          metadata: { ...('metadata' in msg ? msg.metadata : {}), _skipSessionSync: true }
        }));
        set({ messages: messagesWithFlag as any }); // TODO: Fix complex type compatibility
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

    // 消息发送逻辑已移至 ChatModule 业务逻辑层
    // Store 只负责纯状态管理，不处理业务逻辑


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
      set((state) => ({
        isExecutingPlan: executing,
        hasExecutedTasks: executing ? true : state.hasExecutedTasks // 一旦执行过就永远为true
      }));
      // Only log for actual plan execution, not regular message sending
      if (executing) {
        logger.debug(LogCategory.CHAT_FLOW, 'Message processing started');
      } else {
        logger.debug(LogCategory.CHAT_FLOW, 'Message processing completed');
      }
    },

    clearTasks: () => {
      set({ 
        currentTasks: [], 
        taskProgress: null, 
        isExecutingPlan: false,
        // Also clear HIL state when clearing tasks
        hilStatus: 'idle',
        currentHILInterrupt: null
      });
      logger.info(LogCategory.CHAT_FLOW, 'Tasks and HIL state cleared');
    },

    resetTaskHistory: () => {
      set({ 
        hasExecutedTasks: false, 
        currentTasks: [], 
        taskProgress: null, 
        isExecutingPlan: false,
        // Reset HIL state for new session
        hilStatus: 'idle',
        currentHILInterrupt: null,
        hilHistory: [],
        hilCheckpoints: [],
        currentThreadId: null
      });
      logger.info(LogCategory.CHAT_FLOW, 'Task history and HIL state reset for new session');
    },

    // 流式消息操作
    startStreamingMessage: (id, status = '正在生成回应') => {
      set((state) => {
        // 先完成任何现有的流式消息，然后创建新的
        let updatedMessages = [...state.messages];
        
        // 完成任何现有的流式消息
        updatedMessages = updatedMessages.map(msg => 
          msg.isStreaming ? { ...msg, isStreaming: false, streamingStatus: undefined } : msg
        );
        
        // Creating new streaming message
        
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
        
        const newMessages = [...updatedMessages, streamingMessage];
        // Messages array updated
        
        return {
          messages: newMessages
        };
      });
      logger.debug(LogCategory.CHAT_FLOW, 'Streaming message started in chat store', { id, status });
    },

    appendToStreamingMessage: (content) => {
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        
        if (!lastMessage) {
          return state;
        }
        
        // Handle both RegularMessage and ArtifactMessage types
        if (lastMessage.type === 'regular') {
          if (!lastMessage.isStreaming) {
            return state;
          }
          
          const newContent = lastMessage.content + content;
          
          const updatedMessages = [...state.messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: newContent
          };
          
          return { messages: updatedMessages };
        } else if (lastMessage.type === 'artifact') {
          if (!lastMessage.isStreaming) {
            return state;
          }
          
          // For artifact messages, append to the artifact content
          const currentArtifactContent = typeof lastMessage.artifact.content === 'string' ? lastMessage.artifact.content : '';
          const newArtifactContent = currentArtifactContent + content;
          
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
          return state;
        }
      });
    },

    finishStreamingMessage: () => {
      set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage || !lastMessage.isStreaming) return state;
        
        // 解析消息内容（仅对常规消息进行解析）
        let parsedContent: ParsedContent | undefined;
        if (lastMessage.type === 'regular' && lastMessage.content) {
          try {
            const contentParser = createContentParser();
            parsedContent = contentParser.parse(lastMessage.content) || undefined;
            // Content parsed successfully
          } catch (error) {
            console.warn('🔍 CONTENT_PARSER: Failed to parse content:', error);
          }
        }
        
        const finishedMessage = {
          ...lastMessage,
          isStreaming: false,
          streamingStatus: undefined,
          ...(lastMessage.type === 'regular' && parsedContent && {
            parsedContent
          })
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
          
          sessionStore.addMessage(currentSession.id, messageWithFlag as any); // TODO: Fix type compatibility
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
    },

    // HIL操作实现
    setHILStatus: (status) => {
      set({ hilStatus: status });
      logger.info(LogCategory.CHAT_FLOW, 'HIL status updated', { status });
    },

    setCurrentHILInterrupt: (interrupt) => {
      set({ currentHILInterrupt: interrupt });
      if (interrupt) {
        logger.info(LogCategory.CHAT_FLOW, 'Current HIL interrupt set', { 
          threadId: interrupt.thread_id,
          type: interrupt.type,
          timestamp: interrupt.timestamp
        });
      } else {
        logger.info(LogCategory.CHAT_FLOW, 'Current HIL interrupt cleared');
      }
    },

    addHILToHistory: (interrupt) => {
      set((state) => ({
        hilHistory: [...state.hilHistory, interrupt]
      }));
      logger.info(LogCategory.CHAT_FLOW, 'HIL interrupt added to history', { 
        threadId: interrupt.thread_id,
        type: interrupt.type,
        historyCount: get().hilHistory.length + 1
      });
    },

    addHILCheckpoint: (checkpoint) => {
      set((state) => ({
        hilCheckpoints: [...state.hilCheckpoints, checkpoint]
      }));
      logger.info(LogCategory.CHAT_FLOW, 'HIL checkpoint added', { 
        threadId: checkpoint.thread_id,
        type: checkpoint.type,
        checkpointCount: get().hilCheckpoints.length + 1
      });
    },

    setCurrentThreadId: (threadId) => {
      set({ currentThreadId: threadId });
      logger.info(LogCategory.CHAT_FLOW, 'Current thread ID updated', { threadId });
    },

    clearHILState: () => {
      set({
        hilStatus: 'idle',
        currentHILInterrupt: null,
        hilHistory: [],
        hilCheckpoints: [],
        currentThreadId: null
      });
      logger.info(LogCategory.CHAT_FLOW, 'HIL state cleared');
    },

    // HIL Resume执行 (基于2025-08-16实际测试API)
    resumeHILExecution: async (sessionId: string, resumeValue: any, token?: string) => {
      const { 
        setHILStatus,
        setCurrentHILInterrupt,
        startStreamingMessage, 
        appendToStreamingMessage, 
        finishStreamingMessage, 
        updateStreamingStatus,
        updateTaskProgress,
        updateTaskList,
        updateTaskStatus,
        setExecutingPlan
      } = get();

      try {
        logger.info(LogCategory.CHAT_FLOW, 'Starting HIL resume execution', {
          sessionId,
          resumeValueType: typeof resumeValue
        });

        // 更新HIL状态为处理中
        setHILStatus('processing_response');
        
        // 获取 ChatService 实例
        let chatService = getChatServiceInstance();
        if (!chatService) {
          throw new Error('ChatService not available for HIL resume');
        }

        // 使用token或默认值
        const authToken = token || 'dev_key_test';
        
        // 获取用户信息
        const userStore = useUserStore.getState();
        const userId = 'test_user'; // TODO: Fix user store access

        // 调用resumeChat API
        await chatService.resumeChat(sessionId, userId, resumeValue, authToken, {
          onStreamStart: (messageId: string, status?: string) => {
            startStreamingMessage(messageId, status || '🔄 Resuming HIL execution...');
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
            setHILStatus('idle'); // HIL完成，回到空闲状态
            setCurrentHILInterrupt(null); // 清除当前中断
            setExecutingPlan(false);
            logger.info(LogCategory.CHAT_FLOW, 'HIL resume execution completed successfully');
          },
          onTaskProgress: (progress) => {
            updateTaskProgress(progress);
          },
          onTaskListUpdate: (tasks) => {
            updateTaskList(tasks);
          },
          onTaskStatusUpdate: (taskId: string, status: string, result?: any) => {
            updateTaskStatus(taskId, status as any, result);
          },
          // HIL回调 - 处理可能的嵌套HIL中断
          onHILInterruptDetected: (hilEvent: any) => {
            setHILStatus('waiting_for_human');
            setCurrentHILInterrupt(hilEvent);
            logger.info(LogCategory.CHAT_FLOW, 'Nested HIL interrupt during resume', { 
              threadId: hilEvent.thread_id,
              type: hilEvent.type
            });
          },
          onError: (error: Error) => {
            logger.error(LogCategory.CHAT_FLOW, 'HIL resume execution failed', { 
              error: error.message,
              sessionId
            });
            setHILStatus('error');
            setExecutingPlan(false);
          }
        });

      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to start HIL resume execution', { 
          error,
          sessionId
        });
        setHILStatus('error');
        throw error;
      }
    },

    // Execution Status监控 (基于2025-08-16实际测试API)
    checkExecutionStatus: async (sessionId: string, token?: string) => {
      try {
        logger.info(LogCategory.CHAT_FLOW, 'Checking execution status', { sessionId });

        // 获取 ChatService 实例
        let chatService = getChatServiceInstance();
        if (!chatService) {
          throw new Error('ChatService not available for status check');
        }

        // 使用token或默认值
        const authToken = token || 'dev_key_test';

        // 调用getExecutionStatus API
        const statusData = await chatService.getExecutionStatus(sessionId, authToken);
        
        // 根据status数据更新HIL状态
        if (statusData.status === 'interrupted' && statusData.interrupts?.length > 0) {
          const { setHILStatus, setCurrentThreadId } = get();
          setHILStatus('waiting_for_human');
          setCurrentThreadId(statusData.thread_id);
          
          logger.info(LogCategory.CHAT_FLOW, 'Execution interrupted detected via status check', {
            sessionId,
            status: statusData.status,
            interruptCount: statusData.interrupts.length
          });
        } else if (statusData.status === 'running') {
          const { setHILStatus } = get();
          setHILStatus('idle');
        }

        return statusData;
        
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to check execution status', { 
          error,
          sessionId
        });
        throw error;
      }
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
export const useHasExecutedTasks = () => useChatStore(state => state.hasExecutedTasks);

// HIL选择器
export const useHILStatus = () => useChatStore(state => state.hilStatus);
export const useCurrentHILInterrupt = () => useChatStore(state => state.currentHILInterrupt);
export const useHILHistory = () => useChatStore(state => state.hilHistory);
export const useHILCheckpoints = () => useChatStore(state => state.hilCheckpoints);
export const useCurrentThreadId = () => useChatStore(state => state.currentThreadId);

// Chat操作 - 仅状态管理，业务逻辑已移至 ChatModule
export const useChatActions = () => useChatStore(state => ({
  addMessage: state.addMessage,
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
  clearTasks: state.clearTasks,
  resetTaskHistory: state.resetTaskHistory
}));

// HIL操作
export const useHILActions = () => useChatStore(state => ({
  setHILStatus: state.setHILStatus,
  setCurrentHILInterrupt: state.setCurrentHILInterrupt,
  addHILToHistory: state.addHILToHistory,
  addHILCheckpoint: state.addHILCheckpoint,
  setCurrentThreadId: state.setCurrentThreadId,
  clearHILState: state.clearHILState,
  resumeHILExecution: state.resumeHILExecution,
  checkExecutionStatus: state.checkExecutionStatus
}));

// ================================================================================
// Widget相关代码已移至 ChatModule 业务逻辑层
// Store 只负责纯状态管理
// ================================================================================