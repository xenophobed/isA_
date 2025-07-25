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

export interface SSEParserCallbacks {
  onStreamStart?: (messageId: string, status?: string) => void;
  onStreamContent?: (content: string) => void;
  onStreamStatus?: (status: string) => void;
  onStreamComplete?: () => void;
  onError?: (error: Error) => void;
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
        case 'node_update':
          this.handleNodeUpdate(eventData, callbacks);
          break;
        case 'content':
          this.handleContentEvent(eventData, callbacks);
          break;
        case 'end':
          this.handleEndEvent(eventData, callbacks);
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
      onError: callbacks.onError
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
      // 通常streaming tokens已经处理过内容，这里跳过
      console.log('ℹ️ SSE_PARSER: Skipping content event - already processed via streaming tokens');
    }
  }

  private static handleEndEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    console.log('🏁 SSE_PARSER: Stream ended');
    callbacks.onStreamComplete?.();
  }
}

export default SSEParser;