/**
 * ============================================================================
 * New Chat Service Architecture - 新聊天服务架构
 * ============================================================================
 * 
 * 这是新架构的ChatService实现，采用现代化的设计模式
 * 
 * 核心改进:
 * - Protocol-agnostic transport layer (支持SSE/WebSocket/HTTP)
 * - Layered parsing architecture (SSE -> AGUI -> Legacy callbacks)
 * - Better error handling and connection lifecycle management
 * - Comprehensive event processing pipeline
 * - Type-safe message handling
 * 
 * 架构层次:
 * 1. Transport Layer: SSETransport, WebSocketTransport等
 * 2. Parser Layer: SSEEventParser -> AGUIEventParser
 * 3. Processing Layer: EventHandler chain
 * 4. Adapter Layer: CallbackAdapter (新->旧回调转换)
 * 
 * 使用方式:
 * - 通过 useNewArchitecture flag 控制启用
 * - 完全向后兼容现有代码
 * - 渐进式迁移路径
 */

import { createSSETransport } from './transport/SSETransport';
import { createSSEEventParser } from './parsing/SSEEventParser';
import { createAGUIEventParser } from './parsing/AGUIEventParser';
import { createCallbackAdapter } from './legacy/CallbackAdapter';
import { EventProcessingPipeline } from './processing/EventProcessingPipeline';
import type { SSEParserCallbacks } from './legacy/CallbackAdapter';

// ================================================================================
// 新架构的ChatService实现
// ================================================================================

export class ChatServiceNew {
  private readonly name = 'chat_service_new';
  private readonly version = '2.0.0';
  
  /**
   * 使用新架构发送消息
   */
  async sendMessageWithNewArchitecture(
    endpoint: string,
    payload: any,
    callbacks: SSEParserCallbacks,
    token?: string
  ): Promise<void> {
    console.log('🚀 NEW_ARCHITECTURE: Starting message with new transport layer');
    
    try {
      // 1. 创建传输层
      const transport = createSSETransport({
        url: endpoint,
        timeout: 300000, // 5分钟超时
        retryConfig: {
          maxRetries: 3,
          retryDelay: 1000
        }
      });
      
      // 2. 创建解析器链
      const sseParser = createSSEEventParser();
      // 使用LegacyCompatibleConfig以保留原始数据，便于内容过滤
      const aguiParser = createAGUIEventParser({
        enableLegacyConversion: true,
        validateEventStructure: false,
        autoFillMissingFields: true,
        preserveRawData: true
      });
      
      // 3. 创建回调适配器
      const callbackAdapter = createCallbackAdapter(callbacks);
      
      // 4. 创建事件处理管道
      const pipeline = new EventProcessingPipeline();
      pipeline.addHandler(callbackAdapter);
      
      // 5. 建立连接
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const connection = await transport.connect(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      console.log('🔗 NEW_ARCHITECTURE: Connection established, starting data processing...');
      
      // 6. 使用Promise控制流程，避免过早关闭连接
      return new Promise<void>((resolve, reject) => {
        let streamEnded = false;
        
        // 包装 onStreamComplete 回调
        const originalOnStreamComplete = callbacks.onStreamComplete;
        callbacks.onStreamComplete = async (finalContent?: string) => {
          if (originalOnStreamComplete) {
            originalOnStreamComplete(finalContent);
          }
          
          if (!streamEnded) {
            streamEnded = true;
            await connection.close();
            resolve();
          }
        };
        
        // 包装 onError 回调
        const originalOnError = callbacks.onError;
        callbacks.onError = async (error: Error) => {
          if (originalOnError) {
            originalOnError(error);
          }
          
          if (!streamEnded) {
            streamEnded = true;
            await connection.close();
            reject(error);
          }
        };
        
        // 7. 数据处理流程
        const processData = async () => {
          try {
            console.log('🔗 NEW_ARCHITECTURE: Starting data stream processing...');
            
            for await (const rawData of connection.stream()) {
              console.log('🔗 NEW_ARCHITECTURE: Received raw data:', rawData.substring(0, 200) + '...');
              
              // SSE 解析
              const sseEvents = sseParser.parse(rawData);
              console.log('🔗 NEW_ARCHITECTURE: Parsed SSE events:', sseEvents);
              if (!sseEvents) continue;
              
              for (const sseEvent of Array.isArray(sseEvents) ? sseEvents : [sseEvents]) {
                // AGUI 转换 - 需要转换SSEEvent为适当格式
                // 解析 SSE data 中的实际事件类型
                let parsedData: any = {};
                try {
                  parsedData = typeof sseEvent.data === 'string' ? JSON.parse(sseEvent.data) : sseEvent.data;
                } catch {
                  parsedData = { content: sseEvent.data };
                }
                
                const eventData = {
                  // 优先使用 SSE data 中的 type，然后是 SSE event，最后是 custom_event
                  type: parsedData.type || sseEvent.event || 'custom_event',
                  content: parsedData.content || sseEvent.data,
                  delta: parsedData.custom_llm_chunk || parsedData.delta || sseEvent.data,
                  custom_llm_chunk: parsedData.custom_llm_chunk || sseEvent.data,
                  // 传递原始解析的数据
                  ...parsedData,
                  // 保留 SSE metadata
                  ...sseEvent.metadata
                };
                
                const aguiEvent = aguiParser.parse(eventData);
                if (!aguiEvent) continue;
                
                // 事件处理
                await pipeline.process(aguiEvent);
              }
            }
          } catch (error) {
            // AbortError 是正常的连接关闭，不应该作为错误处理
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('🔗 NEW_ARCHITECTURE: Data processing aborted normally');
            } else {
              console.error('🔗 NEW_ARCHITECTURE: Data processing error:', error);
              if (callbacks.onError && !streamEnded) {
                callbacks.onError(error instanceof Error ? error : new Error(String(error)));
              }
            }
          }
        };
        
        // 启动数据处理
        processData();
      });
      
    } catch (error) {
      console.error('🚀 NEW_ARCHITECTURE: Failed to initialize:', error);
      if (callbacks.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }
  
  /**
   * 使用新架构发送多模态消息
   */
  async sendMultimodalMessageWithNewArchitecture(
    endpoint: string,
    payload: any,
    callbacks: SSEParserCallbacks,
    token?: string
  ): Promise<void> {
    console.log('🖼️ NEW_ARCHITECTURE: Starting multimodal message');
    
    // 复用相同的架构，只是端点和payload不同
    return this.sendMessageWithNewArchitecture(endpoint, payload, callbacks, token);
  }
  
  /**
   * 使用新架构恢复HIL会话
   */
  async resumeHILWithNewArchitecture(
    endpoint: string,
    payload: any,
    callbacks: SSEParserCallbacks,
    token?: string
  ): Promise<void> {
    console.log('⏭️ NEW_ARCHITECTURE: Resuming HIL session');
    
    // HIL恢复使用相同的架构模式
    return this.sendMessageWithNewArchitecture(endpoint, payload, callbacks, token);
  }
}

// 导出新架构实例
export const chatServiceNew = new ChatServiceNew();