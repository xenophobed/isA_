/**
 * ============================================================================
 * Chat Service - 聊天服务
 * ============================================================================
 * 
 * 简化的3层架构:
 * 1. Transport Layer: SSETransport - 处理 SSE 连接和原始数据
 * 2. Parser Layer: AGUIEventParser - 解析事件为标准格式
 * 3. Callback Layer: 直接调用回调函数
 * 
 * 核心特性:
 * - 清晰的职责分离
 * - 高性能事件处理
 * - 完善的错误处理和连接管理
 * - 类型安全的消息处理
 */

import { createSSETransport } from './transport/SSETransport';
import { createAGUIEventParser } from './parsing/AGUIEventParser';

// 定义标准的回调接口 - 扩展支持所有事件类型
export interface ChatServiceCallbacks {
  // 基础流程回调
  onStreamStart?: (messageId: string, status?: string) => void;
  onStreamContent?: (contentChunk: string) => void;
  onStreamStatus?: (status: string) => void;
  onStreamComplete?: (finalContent?: string) => void;
  onError?: (error: Error) => void;
  
  // 工具执行回调
  onToolStart?: (toolName: string, toolCallId?: string, parameters?: any) => void;
  onToolExecuting?: (toolName: string, status?: string, progress?: number) => void;
  onToolCompleted?: (toolName: string, result?: any, error?: string, durationMs?: number) => void;
  
  // LLM相关回调
  onLLMCompleted?: (model?: string, tokenCount?: number, finishReason?: string) => void;
  
  // 系统状态回调
  onNodeUpdate?: (nodeName: string, status: 'started' | 'completed' | 'failed', data?: any) => void;
  onStateUpdate?: (stateData: any, node?: string) => void;
  onPaused?: (reason?: string, checkpointId?: string) => void;
  
  // 业务功能回调
  onMemoryUpdate?: (memoryData: any, operation: string) => void;
  onBillingUpdate?: (billingData: { creditsRemaining: number; totalCredits: number; modelCalls: number; toolCalls: number; cost?: number }) => void;
  
  // Resume相关回调
  onResumeStart?: (resumedFrom?: string, checkpointId?: string) => void;
  onResumeEnd?: (success: boolean, result?: any) => void;
  
  // 任务管理回调
  onTaskProgress?: (progress: any) => void;
  onTaskListUpdate?: (tasks: any[]) => void;
  onTaskStatusUpdate?: (taskId: string, status: string, result?: any) => void;
  
  // HIL回调
  onHILInterruptDetected?: (hilEvent: any) => void;
  onHILCheckpointCreated?: (checkpoint: any) => void;
  onHILExecutionStatusChanged?: (statusData: any) => void;
  
  // Artifact回调
  onArtifactCreated?: (artifact: any) => void;
  onArtifactUpdated?: (artifact: any) => void;
}

// ================================================================================
// 简化的 ChatService 实现
// ================================================================================

export class ChatService {
  private readonly name = 'chat_service';
  private readonly version = '3.0.0';
  
  /**
   * 发送消息 - 符合 how_to_chat.md 标准格式
   */
  async sendMessage(
    message: string,
    metadata: {
      user_id: string;
      session_id: string;
      prompt_name?: string | null;
      prompt_args?: any;
      proactive_enabled?: boolean;
      collaborative_enabled?: boolean;
      confidence_threshold?: number;
      proactive_predictions?: any;
    },
    token: string,
    callbacks: ChatServiceCallbacks
  ): Promise<void> {
    // Starting message processing
    
    try {
      // 构建标准的Chat API payload (符合 how_to_chat.md)
      const payload = {
        message,
        user_id: metadata.user_id,
        session_id: metadata.session_id,
        prompt_name: metadata.prompt_name || null,
        prompt_args: metadata.prompt_args || {},
        proactive_enabled: metadata.proactive_enabled || false,
        collaborative_enabled: metadata.collaborative_enabled || false,
        confidence_threshold: metadata.confidence_threshold || 0.7,
        proactive_predictions: metadata.proactive_predictions || null
      };

      // 使用固定的Chat API endpoint
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/chat`;
      
      // 1. 创建 SSE 传输层
      const transport = createSSETransport({
        url: endpoint,
        timeout: 300000, // 5分钟超时
        retryConfig: {
          maxRetries: 3,
          retryDelay: 1000
        }
      });
      
      // 2. 创建 AGUI 事件解析器
      const aguiParser = createAGUIEventParser({
        enableLegacyConversion: true,
        validateEventStructure: false,
        autoFillMissingFields: true,
        preserveRawData: true
      });
      
      // 3. 建立连接
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
      
      // Connection established, starting data processing
      
      // 4. 处理数据流
      return new Promise<void>((resolve, reject) => {
        let streamEnded = false;
        
        // 处理完成时关闭连接
        const handleComplete = async (finalContent?: string) => {
          if (!streamEnded) {
            streamEnded = true;
            await connection.close();
            callbacks.onStreamComplete?.(finalContent);
            resolve();
          }
        };
        
        // 处理错误时关闭连接
        const handleError = async (error: Error) => {
          if (!streamEnded) {
            streamEnded = true;
            await connection.close();
            callbacks.onError?.(error);
            reject(error);
          }
        };
        
        // 处理数据流
        const processData = async () => {
          try {
            for await (const rawData of connection.stream()) {
              
              // 解析 SSE 数据
              const lines = rawData.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataContent = line.slice(6).trim();
                  
                  // 处理结束标记
                  if (dataContent === '[DONE]') {
                    await handleComplete();
                    return;
                  }
                  
                  try {
                    const eventData = JSON.parse(dataContent);
                    
                    // 通过 AGUI 解析器处理
                    const aguiEvent = aguiParser.parse(eventData);
                    if (!aguiEvent) continue;
                    
                    // 直接调用相应的回调函数
                    this.handleAGUIEvent(aguiEvent, callbacks);
                    
                  } catch (parseError) {
                    console.warn('🔗 CHAT_SERVICE: Failed to parse event:', parseError);
                  }
                }
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('🔗 CHAT_SERVICE: Data processing aborted normally');
            } else {
              console.error('🔗 CHAT_SERVICE: Data processing error:', error);
              await handleError(error instanceof Error ? error : new Error(String(error)));
            }
          }
        };
        
        // 启动数据处理
        processData();
      });
      
    } catch (error) {
      console.error('🚀 CHAT_SERVICE: Failed to initialize:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 处理 AGUI 事件，直接调用相应回调 - 支持所有事件类型
   */
  private handleAGUIEvent(event: any, callbacks: ChatServiceCallbacks): void {
    // 记录事件处理（开发模式）
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 CHAT_SERVICE: Processing AGUI event:', event.type, event);
    }
    
    switch (event.type) {
      // 基础流程事件
      case 'run_started':
        callbacks.onStreamStart?.(event.message_id || event.run_id, 'Starting...');
        break;
        
      case 'text_message_start':
        // 只是标记开始，不创建消息。实际内容由 token 事件处理
        console.log('🎬 CHAT_SERVICE: Message generation started', event.message_id || event.run_id);
        break;
        
      case 'text_message_end':
        callbacks.onStreamComplete?.(event.content || event.result);
        break;
        
      case 'text_delta':
      case 'text_message_content':
        if (event.delta || event.content) {
          callbacks.onStreamContent?.(event.delta || event.content);
        }
        break;
        
      case 'run_finished':
      case 'run_completed':
        callbacks.onStreamComplete?.(event.content || event.result);
        break;
        
      case 'run_error':
      case 'error':
        callbacks.onError?.(new Error(event.error?.message || event.message || 'Unknown error'));
        break;
        
      case 'stream_done':
        callbacks.onStreamComplete?.();
        break;
        
      // 工具执行事件
      case 'tool_call_start':
        callbacks.onToolStart?.(event.tool_name, event.tool_call_id, event.parameters);
        break;
        
      case 'tool_executing':
        callbacks.onToolExecuting?.(event.tool_name, event.status, event.progress);
        break;
        
      case 'tool_call_end':
        callbacks.onToolCompleted?.(event.tool_name, event.result, event.error, event.duration_ms);
        break;
        
      // LLM相关事件
      case 'llm_completed':
        callbacks.onLLMCompleted?.(event.model, event.token_count, event.finish_reason);
        break;
        
      // 系统状态事件
      case 'node_update':
        callbacks.onNodeUpdate?.(event.node_name, event.status, { 
          credits: event.credits, 
          messages_count: event.messages_count, 
          data: event.data 
        });
        break;
        
      case 'state_update':
        callbacks.onStateUpdate?.(event.state_data, event.node);
        break;
        
      case 'graph_update':
        callbacks.onStateUpdate?.(event.graph_data);
        break;
        
      case 'paused':
        callbacks.onPaused?.(event.reason, event.checkpoint_id);
        break;
        
      // 业务功能事件
      case 'memory_update':
        callbacks.onMemoryUpdate?.(event.memory_data, event.operation);
        break;
        
      case 'billing':
        callbacks.onBillingUpdate?.({
          creditsRemaining: event.credits_remaining,
          totalCredits: event.total_credits,
          modelCalls: event.model_calls,
          toolCalls: event.tool_calls,
          cost: event.cost
        });
        break;
        
      // Resume事件
      case 'resume_start':
        callbacks.onResumeStart?.(event.resumed_from, event.checkpoint_id);
        break;
        
      case 'resume_end':
        callbacks.onResumeEnd?.(event.success, event.result);
        break;
        
      // 任务管理事件
      case 'task_progress_update':
        callbacks.onTaskProgress?.(event.task);
        break;
        
      // HIL事件
      case 'hil_interrupt_detected':
        callbacks.onHILInterruptDetected?.(event);
        break;
        
      case 'hil_checkpoint_created':
        callbacks.onHILCheckpointCreated?.(event);
        break;
        
      case 'hil_approval_required':
        // 使用现有的HIL interrupt回调处理approval required事件
        callbacks.onHILInterruptDetected?.(event);
        break;
        
      // 图像生成事件
      case 'image_generation_start':
        callbacks.onStreamStart?.(event.message_id || event.run_id, 'Generating image...');
        break;
        
      case 'image_generation_content':
        if (event.image_url || event.content) {
          callbacks.onStreamContent?.(event.image_url || event.content);
        }
        break;
        
      case 'image_generation_end':
        callbacks.onStreamComplete?.(event.image_url || event.result);
        break;
        
      // Artifact事件
      case 'artifact_created':
        callbacks.onArtifactCreated?.(event.artifact);
        break;
        
      case 'artifact_updated':
        callbacks.onArtifactUpdated?.(event.artifact);
        break;
        
      // 状态更新
      case 'status_update':
        callbacks.onStreamStatus?.(event.status);
        break;
        
      // 标准AGUI事件处理 - 不再处理Legacy格式
      case 'custom_event':
        // 处理Resume标记和其他自定义事件
        if (event.metadata?.resumed) {
          callbacks.onStreamStatus?.(`🔄 Resumed: ${event.metadata.custom_type || 'Unknown event'}`);
        }
        // 根据custom_type进一步处理
        if (event.metadata?.custom_type) {
          this.handleCustomEvent(event, callbacks);
        }
        break;
        
      default:
        console.warn('🚨 CHAT_SERVICE: Unhandled AGUI event type:', event.type, event);
        break;
    }
  }
  
  /**
   * 处理自定义事件类型
   */
  private handleCustomEvent(event: any, callbacks: ChatServiceCallbacks): void {
    const customType = event.metadata?.custom_type;
    const customData = event.metadata?.custom_data || {};
    
    switch (customType) {
      case 'content':
        // 处理streaming内容 - 这是关键的修复！
        if (event.metadata?.content || customData.content) {
          const content = event.metadata?.content || customData.content;
          callbacks.onStreamContent?.(content);
          console.log('🎯 CHAT_SERVICE: Streaming content forwarded to callbacks:', content.substring(0, 50) + '...');
        }
        break;
        
      case 'graph_update':
        callbacks.onStateUpdate?.(event.metadata.graph_data);
        break;
        
      case 'billing':
      case 'credits':
        callbacks.onBillingUpdate?.({
          creditsRemaining: customData.creditsRemaining || customData.credits_remaining || 0,
          totalCredits: customData.totalCredits || customData.total_credits || 0,
          modelCalls: customData.modelCalls || customData.model_calls || 0,
          toolCalls: customData.toolCalls || customData.tool_calls || 0,
          cost: customData.cost
        });
        break;
        
      default:
        console.log('🔍 CHAT_SERVICE: Custom event:', customType, customData);
        break;
    }
  }
  
  /**
   * 发送多模态消息
   */
  async sendMultimodalMessage(
    message: string,
    metadata: {
      user_id: string;
      session_id: string;
      prompt_name?: string | null;
      prompt_args?: any;
      proactive_enabled?: boolean;
      collaborative_enabled?: boolean;
      confidence_threshold?: number;
      proactive_predictions?: any;
    },
    token: string,
    callbacks: ChatServiceCallbacks,
    files?: File[]
  ): Promise<void> {
    console.log('🖼️ CHAT_SERVICE: Starting multimodal message', {
      hasFiles: !!files,
      fileCount: files?.length || 0
    });
    
    // TODO: 实现多模态文件上传逻辑
    // 目前复用text chat逻辑
    return this.sendMessage(message, metadata, token, callbacks);
  }
  
  /**
   * 恢复HIL会话
   */
  async resumeHIL(
    message: string,
    metadata: {
      user_id: string;
      session_id: string;
      prompt_name?: string | null;
      prompt_args?: any;
      proactive_enabled?: boolean;
      collaborative_enabled?: boolean;
      confidence_threshold?: number;
      proactive_predictions?: any;
    },
    token: string,
    callbacks: ChatServiceCallbacks
  ): Promise<void> {
    console.log('⏭️ CHAT_SERVICE: Resuming HIL session');
    
    // HIL恢复使用相同的架构模式
    return this.sendMessage(message, metadata, token, callbacks);
  }
}

// 导出实例
export const chatService = new ChatService();