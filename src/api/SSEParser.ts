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
  onArtifactCreated?: (artifact: { id?: string; type: string; content: string }) => void;
  onMessageExtracted?: (extractedContent: string) => void; // 新增：用于传递提取的纯净内容
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
      onArtifactCreated: callbacks.onArtifactCreated
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

    // 处理工具执行进度
    if (content.data && content.type === 'progress') {
      console.log(`🔧 SSE_PARSER: Tool progress: ${content.data}`);
      callbacks.onStreamStatus?.(content.data);
      return;
    }

    console.log('🔄 SSE_PARSER: Unknown custom_stream content:', content);
  }

  private static handleMessageStreamEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    if (!content) return;

    // 处理LangChain消息信息（如工具调用）
    if (content.raw_message) {
      console.log(`📨 SSE_PARSER: Message stream: ${content.raw_message}`);
      
      // 提取content="..."部分的纯净内容
      let extractedContent = content.raw_message;
      const contentMatch = content.raw_message.match(/content="([^"]*(?:\\"[^"]*)*)"/);
      if (contentMatch) {
        extractedContent = contentMatch[1];
        // Unescape quotes
        extractedContent = extractedContent.replace(/\\"/g, '"').replace(/\\'/g, "'");
        console.log(`📨 SSE_PARSER: Extracted pure content: ${extractedContent.substring(0, 100)}...`);
        
        // 通知chatService使用提取的纯净内容
        if (extractedContent && extractedContent.trim() && !extractedContent.includes('tool_calls')) {
          callbacks.onMessageExtracted?.(extractedContent);
        }
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

  private static handleErrorEvent(eventData: SSEEventData, callbacks: SSEParserCallbacks): void {
    const content = (eventData as any).content;
    console.error('❌ SSE_PARSER: Error event:', content);
    callbacks.onError?.(new Error(`API Error: ${content}`));
  }
}

export default SSEParser;