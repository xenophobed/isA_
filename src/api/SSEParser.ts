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
}

// ================================================================================
// SSE解析器类
// ================================================================================

export class SSEParser {
  
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

    // 处理工具执行进度和任务管理
    if (content.data && content.type === 'progress') {
      console.log(`🔧 SSE_PARSER: Tool progress: ${content.data}`);
      
      // 解析任务进度信息
      const progressData = this.parseTaskProgress(content.data);
      if (progressData) {
        console.log(`📋 SSE_PARSER: Parsed task progress:`, progressData);
        // 调用任务进度回调（如果存在）
        callbacks.onTaskProgress?.(progressData);
      }
      
      callbacks.onStreamStatus?.(content.data);
      return;
    }

    // 处理任务列表更新
    if (content.type === 'task_list' && content.tasks) {
      console.log(`📝 SSE_PARSER: Task list update:`, content.tasks);
      callbacks.onTaskListUpdate?.(content.tasks);
      return;
    }

    // 处理任务状态更新
    if (content.type === 'task_status' && content.task_id) {
      console.log(`🔄 SSE_PARSER: Task status update:`, content);
      callbacks.onTaskStatusUpdate?.(content.task_id, content.status, content.result);
      return;
    }

    console.log('🔄 SSE_PARSER: Unknown custom_stream content:', content);
  }

  /**
   * 解析任务进度信息
   */
  private static parseTaskProgress(progressText: string): TaskProgress | null {
    // 解析格式如: "[web_search] Starting execution (1/3)"
    const match = progressText.match(/\[([^\]]+)\]\s+(.+?)\s*(?:\((\d+)\/(\d+)\))?/);
    if (match) {
      const [, toolName, description, current, total] = match;
      return {
        toolName,
        description,
        currentStep: current ? parseInt(current) : undefined,
        totalSteps: total ? parseInt(total) : undefined,
        status: description.toLowerCase().includes('starting') ? 'starting' :
                description.toLowerCase().includes('completed') ? 'completed' :
                description.toLowerCase().includes('failed') ? 'failed' : 'running'
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
        totalCredits: data.total_credits || data.credits_remaining, // fallback if total not provided
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
}

export default SSEParser;