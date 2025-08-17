/**
 * ============================================================================
 * SSE Parser (SSEParser.ts) - SSE事件解析工具类
 * ============================================================================
 * 
 * 【核心职责】
 * - 提供可重用的SSE事件解析逻辑
 * - 从SSEProcessor.tsx中提取的纯函数解析器
 * - 支持不同的回调接口适配
 * - 无React依赖，可在任何环境使用
 * 
 * 【架构优势】
 * ✅ 可重用：SSEProcessor和ChatService都能使用
 * ✅ 无依赖：纯TypeScript实现，无React hooks
 * ✅ 类型安全：完整的TypeScript类型定义
 * ✅ 测试友好：纯函数易于单元测试
 * 
 * 【解析事件类型】
 * - start事件 → 初始化流式消息
 * - custom_event.response_batch → 追加流式内容
 * - custom_event.response_token(completed) → 完成流式消息
 * - node_update → 更新处理状态
 * - end事件 → 结束流式会话
 * - content事件 → 处理最终内容
 */

import { ChatServiceCallbacks } from '../types/chatTypes';
import { HILInterruptData, HILCheckpointData, HILExecutionStatusData } from '../types/aguiTypes';

// ================================================================================
// 类型定义
// ================================================================================

export interface SSEEventData {
  type: string;
  metadata?: {
    raw_chunk?: any;
    node_name?: string;
    credits_used?: number;
    messages_count?: number;
    [key: string]: any;
  };
  content?: string;
  [key: string]: any;
}

// Task management types
export interface TaskProgress {
  toolName: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  status: 'starting' | 'running' | 'completed' | 'failed';
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number; // 0-100
  result?: any;
  createdAt: string;
  updatedAt: string;
}

// 🆕 Autonomous task management types
export interface AutonomousTaskData {
  id: string;
  toolName: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  status: 'detected' | 'starting' | 'running' | 'completed' | 'failed';
  executionMode: 'autonomous' | 'manual' | 'semi-autonomous';
  canPause: boolean;
  canRetry: boolean;
  metadata?: Record<string, any>;
}

export interface AutonomousTaskUpdate {
  status?: AutonomousTaskData['status'];
  currentStep?: number;
  totalSteps?: number;
  description?: string;
  progress?: number;
  result?: any;
  error?: string;
}

// HIL 类型现在从 aguiTypes.ts 导入

export interface SSEParserCallbacks {
  onStreamStart?: (messageId: string, status?: string) => void;
  onStreamContent?: (content: string) => void;
  onStreamStatus?: (status: string) => void;
  onStreamComplete?: () => void;
  onMessageComplete?: (completeMessage?: string) => void; // Add missing callback for message completion
  onError?: (error: Error) => void;
  onArtifactCreated?: (artifact: { id?: string; type: string; content: string }) => void;
  onBillingUpdate?: (billingData: { creditsRemaining: number; totalCredits: number; modelCalls: number; toolCalls: number }) => void;
  
  // Task management callbacks
  onTaskProgress?: (progress: TaskProgress) => void;
  onTaskListUpdate?: (tasks: TaskItem[]) => void;
  onTaskStatusUpdate?: (taskId: string, status: string, result?: any) => void;
  
  // 🆕 Autonomous task callbacks
  onAutonomousTaskDetected?: (taskData: AutonomousTaskData) => void;
  onAutonomousTaskUpdate?: (taskId: string, update: AutonomousTaskUpdate) => void;
  
  // 🆕 HIL (Human-in-the-Loop) callbacks
  onHILInterruptDetected?: (interrupt: HILInterruptData) => void;
  onHILCheckpointCreated?: (checkpoint: HILCheckpointData) => void;
  onHILExecutionStatusChanged?: (status: HILExecutionStatusData) => void;
  onHILApprovalRequired?: (approval: any) => void;
  onHILReviewRequired?: (review: any) => void;
  onHILInputRequired?: (input: any) => void;
}

// ================================================================================
// SSE解析器类
// ================================================================================

export class SSEParser {
  
  // ================================================================================
  // 全局HIL回调注册
  // ================================================================================
  
  private static globalHILCallbacks: {
    onHILInterruptDetected?: (interrupt: any) => void;
    onHILCheckpointCreated?: (checkpoint: any) => void;
    onHILExecutionStatusChanged?: (status: any) => void;
    onHILApprovalRequired?: (approval: any) => void;
    onHILReviewRequired?: (review: any) => void;
    onHILInputRequired?: (input: any) => void;
  } = {};
  
  public static registerGlobalHILCallbacks(callbacks: {
    onHILInterruptDetected?: (interrupt: any) => void;
    onHILCheckpointCreated?: (checkpoint: any) => void;
    onHILExecutionStatusChanged?: (status: any) => void;
    onHILApprovalRequired?: (approval: any) => void;
    onHILReviewRequired?: (review: any) => void;
    onHILInputRequired?: (input: any) => void;
  }) {
    this.globalHILCallbacks = { ...this.globalHILCallbacks, ...callbacks };
    console.log('✅ SSE_PARSER: Global HIL callbacks registered:', Object.keys(callbacks));
  }
  
  // ================================================================================
  // 状态映射配置
  // ================================================================================
  
  // 状态映射配置
  private static readonly WORKFLOW_STATUS_MAP: Record<string, string> = {
    'entry_preparation': '🔸 Preparing request...',
    'reasonnode': '🧠 Processing with AI...',
    'model_call': '⚡ AI Model working...',
    'routing': '🔄 Analyzing response...',
    'responsenode': '📝 Formatting response...',
    'response_formatting': '📝 Formatting response...',
    'memory_revision': '💾 Storing memory...'
  };

  private static readonly NODE_STATUS_MAP: Record<string, string> = {
    'entry_preparation': '🔸 Preparing request...',
    'reason_model': '🧠 Processing with AI...',
    'should_continue': '🔄 Analyzing response...',
    'format_response': '📝 Formatting response...',
    'memory_revision': '💾 Storing memory...'
  };

  // ================================================================================
  // 公共解析方法
  // ================================================================================

  /**
   * 解析SSE数据字符串并调用相应的回调函数
   */
  static parseSSEEvent(data: string, callbacks: SSEParserCallbacks): void {
    try {
      const eventData: SSEEventData = JSON.parse(data);
      const eventType = eventData.type || 'unknown';
      
      console.log('🔍 SSE_PARSER: Processing event:', eventType, eventData);

      switch (eventType) {
        case 'start':
          this.handleStartEvent(eventData, callbacks);
          break;
        case 'custom_event':
          this.handleCustomEvent(eventData, callbacks);
          break;
        case 'custom_stream':
          this.handleCustomStreamEvent(eventData, callbacks);
          break;
        case 'message_stream':
          this.handleMessageStreamEvent(eventData, callbacks);
          break;
        case 'graph_update':
          this.handleGraphUpdateEvent(eventData, callbacks);
          break;
        case 'memory_update':
          this.handleMemoryUpdateEvent(eventData, callbacks);
          break;
        case 'billing':
          this.handleBillingEvent(eventData, callbacks);
          break;
        case 'node_update':
          this.handleNodeUpdate(eventData, callbacks);
          break;
        case 'content':
          this.handleContentEvent(eventData, callbacks);
          break;
        case 'end':
          this.handleEndEvent(eventData, callbacks);
          break;
        case 'error':
          this.handleErrorEvent(eventData, callbacks);
          break;
        case 'credits':
          console.log('💰 SSE_PARSER: Credits event:', eventData.content);
          break;
        // 🆕 HIL (Human-in-the-Loop) 事件处理
        case 'hil_interrupt':
          this.handleHILInterruptEvent(eventData, callbacks);
          break;
        case 'hil_checkpoint':
          this.handleHILCheckpointEvent(eventData, callbacks);
          break;
        case 'hil_status':
          this.handleHILStatusEvent(eventData, callbacks);
          break;
        case 'hil_approval_required':
          this.handleHILApprovalEvent(eventData, callbacks);
          break;
        case 'hil_review_required':
          this.handleHILReviewEvent(eventData, callbacks);
          break;
        case 'hil_input_required':
          this.handleHILInputEvent(eventData, callbacks);
          break;
        default:
          console.log('🔄 SSE_PARSER: Unknown event type:', eventType);
      }
    } catch (error) {
      console.error('❌ SSE_PARSER: Failed to parse SSE event:', error);
      callbacks.onError?.(new Error(`SSE parsing failed: ${error}`));
    }
  }

  /**
   * 适配ChatService回调接口
   */
  static parseForChatService(data: string, callbacks: ChatServiceCallbacks): void {
    const adaptedCallbacks: SSEParserCallbacks = {
      onStreamStart: callbacks.onMessageStart,
      onStreamContent: callbacks.onMessageContent,
      onStreamStatus: callbacks.onMessageStatus,
      onStreamComplete: callbacks.onMessageComplete,
      onError: callbacks.onError,
      onArtifactCreated: callbacks.onArtifactCreated,
      onBillingUpdate: callbacks.onBillingUpdate
    };

    this.parseSSEEvent(data, adaptedCallbacks);
  }

  // ================================================================================
  // 私有事件处理方法
  // ================================================================================

  private static handleStartEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('🎬 SSE_PARSER: Stream started');
    const messageId = `streaming-${Date.now()}`;
    callbacks.onStreamStart?.(messageId, 'Connecting to AI...');
  }

  private static handleCustomEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const chunk = eventData.metadata?.raw_chunk;
    if (!chunk) return;

    // 处理批量token流式数据
    if (chunk.response_batch && chunk.response_batch.status === 'streaming') {
      const { tokens, start_index, count, total_index } = chunk.response_batch;
      console.log(`🚀 SSE_PARSER: Batch token ${start_index}-${start_index + count}: "${tokens}"`);
      
      callbacks.onStreamContent?.(tokens);
      callbacks.onStreamStatus?.(`🚀 Streaming... (${total_index} chars)`);
      return;
    }

    // 处理单个token完成标志
    if (chunk.response_token && chunk.response_token.status === 'completed') {
      console.log('✅ SSE_PARSER: Token streaming completed');
      callbacks.onStreamComplete?.();
      return;
    }

    // 处理工作流状态更新
    this.handleWorkflowStatus(chunk, callbacks);
  }

  private static handleNodeUpdate(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const { node_name } = eventData.metadata || {};
    const status = this.NODE_STATUS_MAP[node_name as keyof typeof this.NODE_STATUS_MAP] || `Processing ${node_name}...`;
    
    callbacks.onStreamStatus?.(status);
    console.log(`📊 SSE_PARSER: Node update - ${node_name}: ${status}`);
  }

  private static handleWorkflowStatus(chunk: any, callbacks: SSEParserCallbacks): void {
    for (const [key, value] of Object.entries(chunk)) {
      if (typeof value === 'object' && value && 'status' in value) {
        const status = this.WORKFLOW_STATUS_MAP[key] || `Processing ${key}...`;
        const statusValue = (value as any).status;
        if (statusValue === 'starting' || statusValue === 'deciding') {
          callbacks.onStreamStatus?.(status);
          console.log(`🔄 SSE_PARSER: Workflow status - ${key}: ${status}`);
        }
        break;
      }
    }
  }

  private static handleContentEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('📄 SSE_PARSER: Content event received');
    
    if (eventData.content) {
      console.log('📄 SSE_PARSER: Final content available:', eventData.content.substring(0, 100) + '...');
      
      // Extract image URLs from final content as well (for cases where streaming didn't catch it)
      const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
      const imageMatches = eventData.content.match(imageRegex);
      
      if (imageMatches && callbacks.onArtifactCreated) {
        console.log('🖼️ SSE_PARSER: Found images in final content event:', imageMatches.length);
        imageMatches.forEach((match: string, index: number) => {
          const urlMatch = match.match(/\((https?:\/\/[^\)]+)\)/);
          if (urlMatch && urlMatch[1]) {
            const imageUrl = urlMatch[1];
            console.log(`🖼️ SSE_PARSER: Extracting image from content event: ${imageUrl}`);
            callbacks.onArtifactCreated?.({
              id: `content_image_${Date.now()}_${index}`,
              type: 'image',
              content: imageUrl
            });
          }
        });
      } else {
        console.log('ℹ️ SSE_PARSER: No images found in content event');
      }
    }
  }

  private static handleEndEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('🏁 SSE_PARSER: Stream ended');
    callbacks.onStreamComplete?.();
  }

  // ================================================================================
  // 新API事件处理方法
  // ================================================================================

  private static handleCustomStreamEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    if (!content) return;

    // 处理LLM token流
    if (content.custom_llm_chunk) {
      console.log(`🚀 SSE_PARSER: Custom LLM chunk: "${content.custom_llm_chunk}"`);
      callbacks.onStreamContent?.(content.custom_llm_chunk);
      return;
    }

    // 🆕 处理任务状态更新 - 基于真实API结构
    if (content.task_state) {
      console.log(`📊 SSE_PARSER: Task State Update:`, content.task_state);
      const taskState = content.task_state;
      
      // 转换为TaskProgress格式
      const taskProgress: TaskProgress = {
        toolName: taskState.current_task_name || 'Task Execution',
        description: `Executing ${taskState.current_task_name || 'tasks'} (${taskState.completed_tasks + 1}/${taskState.total_tasks})`,
        currentStep: taskState.current_task_index + 1,
        totalSteps: taskState.total_tasks,
        status: taskState.status === 'executing' ? 'running' : 
                taskState.status === 'task_completed' ? 'completed' : 'running'
      };
      
      callbacks.onTaskProgress?.(taskProgress);
      
      // 创建任务列表
      if (taskState.task_names && taskState.task_names.length > 0) {
        const tasks: TaskItem[] = taskState.task_names.map((name: string, index: number) => ({
          id: `task_${index + 1}`,
          title: name,
          description: `Task ${index + 1}: ${name}`,
          status: index < taskState.completed_tasks ? 'completed' :
                  index === taskState.current_task_index ? 'running' : 'pending',
          progress: index < taskState.completed_tasks ? 100 : 
                   index === taskState.current_task_index ? 50 : 0,
          result: index < taskState.completed_tasks ? 'Completed successfully' : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        callbacks.onTaskListUpdate?.(tasks);
      }
      return;
    }

    // 🆕 处理单个任务完成通知
    if (content.task_completed) {
      console.log(`✅ SSE_PARSER: Task Completed:`, content.task_completed);
      const taskCompleted = content.task_completed;
      
      callbacks.onTaskStatusUpdate?.(
        `task_${taskCompleted.task_index + 1}`,
        'completed',
        {
          title: taskCompleted.task_title,
          status: taskCompleted.status,
          remaining_tasks: taskCompleted.remaining_tasks
        }
      );
      return;
    }

    // 🆕 处理Agent执行状态
    if (content.agent_execution) {
      console.log(`🤖 SSE_PARSER: Agent Execution Status:`, content.agent_execution);
      const agentExecution = content.agent_execution;
      
      // 更新整体状态
      callbacks.onStreamStatus?.(
        `Agent Status: ${agentExecution.status} (${agentExecution.completed}/${agentExecution.total_tasks} tasks)`
      );
      return;
    }

    // 处理工具执行进度和任务管理 (legacy support)
    if (content.data && content.type === 'progress') {
      console.log(`🔧 SSE_PARSER: Tool progress: ${content.data}`);
      
      // 🆕 解析任务进度信息并创建任务事件
      const taskEvent = this.parseTaskEventFromProgress(content.data);
      if (taskEvent) {
        console.log(`📋 SSE_PARSER: Parsed task event:`, taskEvent);
        // 调用任务事件回调
        callbacks.onTaskProgress?.(taskEvent);
      }
      
      callbacks.onStreamStatus?.(content.data);
      return;
    }

    // 处理任务列表更新 (legacy support)
    if (content.type === 'task_list' && content.tasks) {
      console.log(`📝 SSE_PARSER: Task list update:`, content.tasks);
      callbacks.onTaskListUpdate?.(content.tasks);
      return;
    }

    // 处理任务状态更新 (legacy support)
    if (content.type === 'task_status' && content.task_id) {
      console.log(`🔄 SSE_PARSER: Task status update:`, content);
      callbacks.onTaskStatusUpdate?.(content.task_id, content.status, content.result);
      return;
    }

    console.log('🔄 SSE_PARSER: Unknown custom_stream content:', content);
  }

  /**
   * 🆕 从进度信息解析任务事件
   */
  private static parseTaskEventFromProgress(progressText: string): TaskProgress | null {
    // 解析格式如: "[web_search] Starting execution (1/3)"
    const match = progressText.match(/\[([^\]]+)\]\s+(.+?)\s*(?:\((\d+)\/(\d+)\))?/);
    if (match) {
      const [, toolName, description, current, total] = match;
      
      // 确定任务状态
      let status: 'starting' | 'running' | 'completed' | 'failed';
      if (description.toLowerCase().includes('starting')) {
        status = 'starting';
      } else if (description.toLowerCase().includes('completed')) {
        status = 'completed';
      } else if (description.toLowerCase().includes('failed')) {
        status = 'failed';
      } else {
        status = 'running';
      }
      
      return {
        toolName,
        description,
        currentStep: current ? parseInt(current) : undefined,
        totalSteps: total ? parseInt(total) : undefined,
        status
      };
    }
    return null;
  }

  private static handleMessageStreamEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    if (!content) return;

    // 处理LangChain消息信息（如工具调用）
    if (content.raw_message) {
      console.log(`📨 SSE_PARSER: Message stream: ${content.raw_message}`);
      
      // 提取content="..."部分的纯净内容
      let extractedContent = content.raw_message;
      // 先尝试双引号，再尝试单引号
      const doubleQuoteMatch = content.raw_message.match(/content="([^"]*(?:\\"[^"]*)*)"/);
      const singleQuoteMatch = content.raw_message.match(/content='([^']*(?:\\'[^']*)*)'/);
      const contentMatch = doubleQuoteMatch || singleQuoteMatch;
      
      if (contentMatch) {
        extractedContent = contentMatch[1];
        // Unescape quotes
        extractedContent = extractedContent.replace(/\\"/g, '"').replace(/\\'/g, "'");
        console.log(`📨 SSE_PARSER: Extracted pure content: ${extractedContent.substring(0, 100)}...`);
        
        // 日志记录提取的内容
        if (extractedContent && extractedContent.trim() && !extractedContent.includes('tool_calls')) {
          console.log(`📨 SSE_PARSER: Extracted pure content: ${extractedContent.substring(0, 100)}...`);
        }
      } else {
        console.log(`⚠️ SSE_PARSER: Could not extract content from raw_message: ${content.raw_message}`);
      }
      
      // 解析图片URL - 检查markdown格式的图片
      const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
      const imageMatches = extractedContent.match(imageRegex);
      
      if (imageMatches && callbacks.onArtifactCreated) {
        imageMatches.forEach((match: string, index: number) => {
          const urlMatch = match.match(/\((https?:\/\/[^\)]+)\)/);
          if (urlMatch && urlMatch[1]) {
            const imageUrl = urlMatch[1];
            console.log(`🖼️ SSE_PARSER: Found image artifact: ${imageUrl}`);
            callbacks.onArtifactCreated?.({
              id: `image_${Date.now()}_${index}`,
              type: 'image',
              content: imageUrl
            });
          }
        });
      }
      
      // 🆕 检测ask_human工具调用并触发HIL中断
      if (content.raw_message.includes('ask_human') && content.raw_message.includes('tool_calls')) {
        console.log('🚨 SSE_PARSER: Detected ask_human tool call - triggering HIL interrupt');
        
        try {
          // 提取工具调用信息
          const toolCallMatch = content.raw_message.match(/tool_calls=\[(.*?)\]/);
          if (toolCallMatch) {
            // 尝试解析工具调用
            const toolCallStr = toolCallMatch[1];
            
            // 简单的参数提取
            const questionMatch = toolCallStr.match(/'question': '([^']+)'/);
            const question = questionMatch ? questionMatch[1] : 'Human input required';
            
            // 创建HIL中断事件
            const hilInterrupt = {
              id: `hil_interrupt_${Date.now()}`,
              type: 'input_validation' as const,
              title: 'Human Input Required',
              message: question,
              timestamp: eventData.timestamp || new Date().toISOString(),
              thread_id: 'current_session', // 将在ChatModule中被实际的session ID替换
              data: {
                question: question,
                tool_name: 'ask_human',
                context: extractedContent,
                raw_tool_call: toolCallStr
              }
            };
            
            console.log('🚨 SSE_PARSER: Created HIL interrupt:', hilInterrupt);
            
            // 触发HIL中断回调（优先使用传入的回调，否则使用全局回调）
            if (callbacks.onHILInterruptDetected) {
              callbacks.onHILInterruptDetected(hilInterrupt);
              callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
            } else if (this.globalHILCallbacks.onHILInterruptDetected) {
              this.globalHILCallbacks.onHILInterruptDetected(hilInterrupt);
              callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
            }
          }
        } catch (error) {
          console.error('❌ SSE_PARSER: Failed to parse ask_human tool call:', error);
        }
      }
      
      // 检查其他类型的artifacts (JSON、数据等)
      try {
        // 尝试解析结构化数据
        if (extractedContent.includes('{') && extractedContent.includes('}')) {
          const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            if (jsonData && callbacks.onArtifactCreated) {
              console.log(`📊 SSE_PARSER: Found data artifact`);
              callbacks.onArtifactCreated?.({
                id: `data_${Date.now()}`,
                type: 'data',
                content: JSON.stringify(jsonData)
              });
            }
          }
        }
      } catch (e) {
        // 忽略JSON解析错误
      }
      
      callbacks.onStreamStatus?.('🔧 Processing tools...');
      return;
    }

    console.log('🔄 SSE_PARSER: Unknown message_stream content:', content);
  }

  private static handleGraphUpdateEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    const data = (eventData as any).data;
    
    console.log(`📊 SSE_PARSER: Graph update: ${content}`);
    
    // 🆕 优先检测真实的__interrupt__格式 (基于2025-08-16测试文档)
    if (data && data.__interrupt__) {
      const interruptData = data.__interrupt__;
      console.log('🚨 SSE_PARSER: Real HIL interrupt detected in graph_update:', interruptData);
      
      // 转换为AGUI标准格式的HIL中断事件
      const hilInterrupt = {
        id: `hil_interrupt_${Date.now()}`,
        type: interruptData.type === 'ask_human' ? 'ask_human' as const : 
              interruptData.type === 'authorization' ? 'authorization' as const : 
              'input_validation' as const,
        title: interruptData.type === 'ask_human' ? 'Human Input Required' : 
               interruptData.type === 'authorization' ? 'Authorization Required' : 
               'Human Approval Required',
        message: interruptData.question || interruptData.instruction || 'Human interaction required',
        timestamp: interruptData.timestamp || eventData.timestamp || new Date().toISOString(),
        thread_id: (eventData as any).session_id || 'current_session',
        data: {
          question: interruptData.question || '',
          tool_name: interruptData.tool_name || '',
          tool_args: interruptData.tool_args || {},
          context: interruptData.context || '',
          user_id: interruptData.user_id || 'default',
          instruction: interruptData.instruction || '',
          original_response: interruptData.original_response || {},
          // 保留原始数据以备调试
          raw_interrupt: interruptData
        }
      };
      
      console.log('🚨 SSE_PARSER: Created AGUI HIL interrupt from real interrupt:', hilInterrupt);
      
      // 触发HIL中断回调
      if (callbacks.onHILInterruptDetected) {
        callbacks.onHILInterruptDetected(hilInterrupt);
        callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
      } else if (this.globalHILCallbacks.onHILInterruptDetected) {
        this.globalHILCallbacks.onHILInterruptDetected(hilInterrupt);
        callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
      }
      
      return; // 检测到真实HIL中断后立即返回
    }
    
    // 🆕 检测graph_update中的ask_human工具调用 (fallback支持)
    if (data) {
      for (const [nodeKey, nodeValue] of Object.entries(data)) {
        if (nodeValue && typeof nodeValue === 'object' && 'messages' in nodeValue) {
          const messages = (nodeValue as any).messages;
          if (Array.isArray(messages)) {
            for (const message of messages) {
              if (message.tool_calls && Array.isArray(message.tool_calls)) {
                for (const toolCall of message.tool_calls) {
                  if (toolCall.name === 'ask_human') {
                    console.log('🚨 SSE_PARSER: ask_human tool call detected in graph_update');
                    
                    // 创建HIL中断事件
                    const hilInterrupt = {
                      id: `hil_interrupt_${Date.now()}`,
                      type: 'input_validation' as const,
                      title: 'Human Input Required',
                      message: toolCall.args?.question || 'Human input required',
                      timestamp: eventData.timestamp || new Date().toISOString(),
                      thread_id: 'current_session',
                      data: {
                        question: toolCall.args?.question || 'Human input required',
                        tool_name: 'ask_human',
                        tool_call_id: toolCall.id,
                        context: '',
                        raw_tool_call: JSON.stringify(toolCall)
                      }
                    };
                    
                    console.log('🚨 SSE_PARSER: Created HIL interrupt from graph_update:', hilInterrupt);
                    
                    // 触发HIL中断回调
                    if (callbacks.onHILInterruptDetected) {
                      callbacks.onHILInterruptDetected(hilInterrupt);
                      callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
                    } else if (this.globalHILCallbacks.onHILInterruptDetected) {
                      this.globalHILCallbacks.onHILInterruptDetected(hilInterrupt);
                      callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
                    }
                    
                    return; // 检测到ask_human后立即返回，不继续处理其他逻辑
                  }
                }
              }
            }
          }
        }
      }
    }
    
    try {
      // 尝试解析content作为JSON来获取任务列表
      const graphData = JSON.parse(content);
      
      // 🆕 从call_tool节点获取任务列表
      if (graphData.call_tool && graphData.call_tool.task_list) {
        console.log(`📋 SSE_PARSER: Found task list in call_tool:`, graphData.call_tool.task_list);
        const taskList = graphData.call_tool.task_list;
        
        // 转换为标准TaskItem格式
        const tasks: TaskItem[] = taskList.map((task: any, index: number) => ({
          id: task.id?.toString() || `task_${index + 1}`,
          title: task.title || `Task ${index + 1}`,
          description: task.description || '',
          status: 'pending' as const,
          progress: 0,
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        callbacks.onTaskListUpdate?.(tasks);
      }
      
      // 🆕 从agent_executor节点也可以获取任务列表
      if (graphData.agent_executor && graphData.agent_executor.task_list) {
        console.log(`📋 SSE_PARSER: Found task list in agent_executor:`, graphData.agent_executor.task_list);
        const taskList = graphData.agent_executor.task_list;
        
        // 转换为标准TaskItem格式
        const tasks: TaskItem[] = taskList.map((task: any, index: number) => ({
          id: task.id?.toString() || `task_${index + 1}`,
          title: task.title || `Task ${index + 1}`,
          description: task.description || '',
          status: 'pending' as const,
          progress: 0,
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        callbacks.onTaskListUpdate?.(tasks);
      }
    } catch (parseError) {
      // 如果JSON解析失败，继续使用原有逻辑
      console.log('📊 SSE_PARSER: Could not parse graph content as JSON, using fallback logic');
    }
    
    // 原有的状态处理逻辑
    if (data?.reason_model?.next_action) {
      const action = data.reason_model.next_action;
      const status = action === 'call_tool' ? '🔧 Calling tools...' : 
                    action === 'respond' ? '📝 Preparing response...' : 
                    `🔄 Processing: ${action}`;
      callbacks.onStreamStatus?.(status);
    } else {
      callbacks.onStreamStatus?.('🧠 AI processing...');
    }
  }

  private static handleMemoryUpdateEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    const data = (eventData as any).data;
    
    console.log(`💾 SSE_PARSER: Memory update: ${content}`);
    
    if (data?.memories_stored) {
      callbacks.onStreamStatus?.(`💾 Stored ${data.memories_stored} memories`);
    } else {
      callbacks.onStreamStatus?.('💾 Updating memory...');
    }
  }

  private static handleBillingEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    const data = (eventData as any).data;
    
    console.log(`💰 SSE_PARSER: Billing update: ${content}`, data);
    
    if (data?.success && data.credits_remaining !== undefined) {
      const billingData = {
        creditsRemaining: data.credits_remaining,
        totalCredits: data.total_credits || 1, // 本次消耗的积分，不是用户总积分
        modelCalls: data.model_calls || 0,
        toolCalls: data.tool_calls || 0
      };
      
      console.log(`💰 SSE_PARSER: Updating user credits:`, billingData);
      callbacks.onBillingUpdate?.(billingData);
      callbacks.onStreamStatus?.(`💰 Credits used: ${data.total_credits || 1}, Remaining: ${data.credits_remaining}`);
    } else if (data?.error_message) {
      console.error(`💰 SSE_PARSER: Billing error: ${data.error_message}`);
      callbacks.onError?.(new Error(`Billing Error: ${data.error_message}`));
    }
  }

  private static handleErrorEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    console.error('❌ SSE_PARSER: Error event:', content);
    callbacks.onError?.(new Error(`API Error: ${content}`));
  }

  // ================================================================================
  // 🆕 HIL (Human-in-the-Loop) 事件处理方法
  // ================================================================================

  /**
   * 处理HIL中断检测事件
   */
  private static handleHILInterruptEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('⏸️ SSE_PARSER: HIL interrupt detected:', eventData);
    
    const interruptData = (eventData as any).content || (eventData as any).data;
    
    if (interruptData && callbacks.onHILInterruptDetected) {
      const hilInterrupt: HILInterruptData = {
        id: interruptData.id || `interrupt_${Date.now()}`,
        type: interruptData.type || 'approval',
        timestamp: eventData.timestamp || new Date().toISOString(),
        thread_id: interruptData.thread_id || 'unknown',
        title: interruptData.title || 'Human intervention required',
        message: interruptData.message || 'Please review and approve the next action',
        data: interruptData.data || {},
        reason: interruptData.reason,
        tool_name: interruptData.tool_name,
        tool_args: interruptData.tool_args
      };
      
      callbacks.onHILInterruptDetected(hilInterrupt);
      callbacks.onStreamStatus?.(`⏸️ ${hilInterrupt.title}`);
      
      console.log('⏸️ SSE_PARSER: HIL interrupt processed:', hilInterrupt.id);
    }
  }

  /**
   * 处理HIL检查点创建事件
   */
  private static handleHILCheckpointEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('📍 SSE_PARSER: HIL checkpoint created:', eventData);
    
    const checkpointData = (eventData as any).content || (eventData as any).data;
    
    if (checkpointData && callbacks.onHILCheckpointCreated) {
      const hilCheckpoint: HILCheckpointData = {
        checkpoint_id: checkpointData.checkpoint_id || `checkpoint_${Date.now()}`,
        thread_id: checkpointData.thread_id || 'unknown',
        node: checkpointData.node || 'unknown_node',
        timestamp: eventData.timestamp || new Date().toISOString(),
        state_summary: checkpointData.state_summary || 'Checkpoint created',
        can_rollback: checkpointData.can_rollback !== false // 默认为true
      };
      
      callbacks.onHILCheckpointCreated(hilCheckpoint);
      callbacks.onStreamStatus?.(`📍 Checkpoint: ${hilCheckpoint.node}`);
      
      console.log('📍 SSE_PARSER: HIL checkpoint processed:', hilCheckpoint.checkpoint_id);
    }
  }

  /**
   * 处理HIL执行状态变化事件
   */
  private static handleHILStatusEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('📊 SSE_PARSER: HIL status update:', eventData);
    
    const statusData = (eventData as any).content || (eventData as any).data;
    
    if (statusData && callbacks.onHILExecutionStatusChanged) {
      const hilStatus: HILExecutionStatusData = {
        thread_id: statusData.thread_id || 'unknown',
        status: statusData.status || 'ready',
        current_node: statusData.current_node || 'unknown',
        interrupts: statusData.interrupts || [],
        checkpoints: statusData.checkpoints || 0,
        durable: statusData.durable !== false, // 默认为true
        last_checkpoint: statusData.last_checkpoint
      };
      
      callbacks.onHILExecutionStatusChanged(hilStatus);
      
      // 更新流式状态显示
      const statusText = this.formatExecutionStatus(hilStatus);
      callbacks.onStreamStatus?.(statusText);
      
      console.log('📊 SSE_PARSER: HIL status processed:', hilStatus.status);
    }
  }

  /**
   * 处理HIL审批请求事件
   */
  private static handleHILApprovalEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('✋ SSE_PARSER: HIL approval required:', eventData);
    
    const approvalData = (eventData as any).content || (eventData as any).data;
    
    if (approvalData && callbacks.onHILApprovalRequired) {
      callbacks.onHILApprovalRequired(approvalData);
      callbacks.onStreamStatus?.(`✋ Approval needed: ${approvalData.title || 'Action requires approval'}`);
      
      console.log('✋ SSE_PARSER: HIL approval processed:', approvalData.id);
    }
  }

  /**
   * 处理HIL审查请求事件
   */
  private static handleHILReviewEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('👁️ SSE_PARSER: HIL review required:', eventData);
    
    const reviewData = (eventData as any).content || (eventData as any).data;
    
    if (reviewData && callbacks.onHILReviewRequired) {
      callbacks.onHILReviewRequired(reviewData);
      callbacks.onStreamStatus?.(`👁️ Review needed: ${reviewData.title || 'Content requires review'}`);
      
      console.log('👁️ SSE_PARSER: HIL review processed:', reviewData.id);
    }
  }

  /**
   * 处理HIL输入请求事件
   */
  private static handleHILInputEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('📝 SSE_PARSER: HIL input required:', eventData);
    
    const inputData = (eventData as any).content || (eventData as any).data;
    
    if (inputData && callbacks.onHILInputRequired) {
      callbacks.onHILInputRequired(inputData);
      callbacks.onStreamStatus?.(`📝 Input needed: ${inputData.question || 'Additional information required'}`);
      
      console.log('📝 SSE_PARSER: HIL input processed:', inputData.id);
    }
  }

  /**
   * 格式化执行状态为用户友好的文本
   */
  private static formatExecutionStatus(status: HILExecutionStatusData): string {
    const statusEmojis = {
      ready: '✅',
      running: '⚡',
      interrupted: '⏸️',
      completed: '🎉',
      error: '❌'
    };
    
    const emoji = statusEmojis[status.status] || '🔄';
    const nodeText = status.current_node !== 'unknown' ? ` (${status.current_node})` : '';
    const interruptText = status.interrupts.length > 0 ? ` - ${status.interrupts.length} interrupts` : '';
    
    return `${emoji} Status: ${status.status}${nodeText}${interruptText}`;
  }
}

export default SSEParser;