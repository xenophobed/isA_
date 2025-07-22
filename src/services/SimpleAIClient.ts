/**
 * ============================================================================
 * 简易AI客户端 (SimpleAIClient.ts) - 纯数据传输层
 * ============================================================================
 * 
 * 【核心功能】
 * - 与后端API进行通信，支持文本和多模态消息
 * - 处理服务器推送事件(SSE)流式响应
 * - 返回原始SSE数据流，不做任何解析
 * - 提供回调机制供外部处理数据
 * 
 * 【职责边界】
 * - ✅ 网络请求和连接管理
 * - ✅ SSE数据接收和分块处理
 * - ✅ 错误处理和重连机制
 * - ❌ 不解析事件内容
 * - ❌ 不发送应用层事件
 * - ❌ 不管理消息状态
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sender?: string;
    app?: string;
    media_items?: Array<{
      type: string;
      url: string;
      title?: string;
    }>;
    [key: string]: any;
  };
}

// 原始SSE事件数据接口
export interface RawSSEEvent {
  type: string;
  data: string;
  timestamp: Date;
}

// 数据回调函数类型
type DataCallback = (event: RawSSEEvent) => void;
type ErrorCallback = (error: Error) => void;
type CompleteCallback = () => void;

export class SimpleAIClient {
  private apiEndpoint: string;
  private destroyed: boolean = false;
  private activeRequests: Set<AbortController> = new Set();

  constructor(apiEndpoint: string = 'http://localhost:8080') {
    this.apiEndpoint = apiEndpoint;
    console.log('🔧 SimpleAI: Client created with endpoint:', apiEndpoint);
  }

  // 简单的流式数据处理方法
  async sendMessageWithCallback(
    content: string, 
    callbacks: {
      onData?: DataCallback;
      onError?: ErrorCallback;
      onComplete?: CompleteCallback;
    },
    metadata: any = {}
  ): Promise<void> {
    return this.sendMultimodalMessageWithCallback(content, [], callbacks, metadata);
  }

  // 销毁客户端实例，清理所有资源
  destroy(): void {
    console.log('🧹 SimpleAI: Destroying client and cleaning up resources');
    
    this.destroyed = true;
    
    // 取消所有活跃的请求
    this.activeRequests.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        console.warn('SimpleAI: Error aborting request:', error);
      }
    });
    this.activeRequests.clear();
    
    console.log('✅ SimpleAI: Client destroyed successfully');
  }

  // 检查客户端是否已销毁
  isDestroyed(): boolean {
    return this.destroyed;
  }

  // Send multimodal message with files and callbacks
  async sendMultimodalMessageWithCallback(
    content: string, 
    files: File[] = [], 
    callbacks: {
      onData?: DataCallback;
      onError?: ErrorCallback;
      onComplete?: CompleteCallback;
    },
    metadata: any = {}
  ): Promise<void> {
    if (this.destroyed) {
      const error = new Error('SimpleAI: Client is destroyed, cannot send message');
      callbacks.onError?.(error);
      return;
    }

    const controller = new AbortController();
    this.activeRequests.add(controller);

    try {
      let response: Response;

      if (files.length === 0) {
        response = await fetch(`${this.apiEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            session_id: metadata.session_id || 'default',
            user_id: metadata.user_id || 'test_user',
            use_streaming: true,
            template_parameters: metadata.template_parameters
          }),
          signal: controller.signal
        });
      } else {
        const formData = new FormData();
        formData.append('message', content);
        formData.append('session_id', metadata.session_id || 'default');
        formData.append('user_id', metadata.user_id || 'test_user');
        formData.append('use_streaming', 'true');
        
        if (metadata.template_parameters) {
          Object.entries(metadata.template_parameters).forEach(([key, value]) => {
            formData.append(`template_parameters[${key}]`, value as string);
          });
        }
        
        files.forEach((file, index) => {
          if (file.type.startsWith('audio/')) {
            formData.append('audio', file);
          } else {
            formData.append(`file_${index}`, file);
          }
        });

        response = await fetch(`${this.apiEndpoint}/api/chat`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 处理流式响应 - 只返回原始数据
      await this.handleRawStreamingResponse(response, callbacks);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError?.(err);
    } finally {
      this.activeRequests.delete(controller);
    }
  }

  // 新的纯数据处理方法 - 只返回原始SSE事件
  private async handleRawStreamingResponse(
    response: Response, 
    callbacks: {
      onData?: DataCallback;
      onError?: ErrorCallback;
      onComplete?: CompleteCallback;
    }
  ) {
    if (!response.body) {
      const error = new Error('No response body');
      callbacks.onError?.(error);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            
            // Handle [DONE] marker
            if (dataContent === '[DONE]') {
              callbacks.onComplete?.();
              continue;
            }
            
            // 直接传递原始数据，完全不做解析
            const sseEvent: RawSSEEvent = {
              type: 'raw', // 设为raw，让StreamingHandler来决定类型
              data: dataContent, // 原始JSON字符串
              timestamp: new Date()
            };
            
            callbacks.onData?.(sseEvent);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 保持向后兼容的旧方法 - 将来可以移除
  async sendMessage(content: string, metadata: any = {}): Promise<string> {
    console.warn('SimpleAI: sendMessage is deprecated, use sendMessageWithCallback');
    return `legacy-${Date.now()}`;
  }

  // 保持向后兼容的旧方法 - 将来可以移除  
  async sendMultimodalMessage(content: string, files: File[] = [], metadata: any = {}): Promise<string> {
    console.warn('SimpleAI: sendMultimodalMessage is deprecated, use sendMultimodalMessageWithCallback');
    return `legacy-${Date.now()}`;
  }

  // 兼容旧的事件系统 - 将来可以移除
  on(event: string, callback: any): () => void {
    console.warn('SimpleAI: Event system is deprecated, use callback-based methods');
    return () => {};
  }
}