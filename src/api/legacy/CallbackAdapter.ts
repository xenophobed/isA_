/**
 * ============================================================================
 * Callback Adapter - 新架构到旧回调系统的桥接器
 * ============================================================================
 * 
 * 核心职责:
 * - 将新架构的 AGUIEvent 转换为现有 SSEParserCallbacks 调用
 * - 确保现有代码零修改可用
 * - 保持完全的向后兼容性
 * - 支持渐进式升级路径
 * 
 * 设计原则:
 * - 完全透明：现有代码感觉不到任何变化
 * - 类型安全：保持所有类型定义不变
 * - 错误处理：确保错误传播与现有系统一致
 * - 性能优化：最小化转换开销
 */

import { EventHandler, BaseEventHandler, HandlerResult } from '../processing/EventHandler';
import { AGUIEvent, AGUIEventType } from '../parsing/AGUIEventParser';

// ================================================================================
// Legacy Callback Types - 基于现有 SSEParser.ts
// ================================================================================

export interface SSEParserCallbacks {
  onStreamStart?: (messageId: string, initialContent?: string) => void;
  onStreamContent?: (content: string) => void;
  onStreamComplete?: (finalContent?: string) => void;
  onStreamStatus?: (status: string) => void;
  onError?: (error: Error) => void;
  onHILInterruptDetected?: (interrupt: HILInterrupt) => void;
  onTaskProgressUpdate?: (progress: TaskProgress) => void;
  onArtifactUpdate?: (artifact: ArtifactInfo) => void;
  onGraphUpdate?: (graphData: any) => void;
  onMemoryUpdate?: (memoryData: any) => void;
  onBillingUpdate?: (billing: BillingInfo) => void;
  onCreditsUpdate?: (credits: number) => void;
  onNodeUpdate?: (nodeData: any) => void;
  onCustomEvent?: (eventData: any) => void;
}

export interface HILInterrupt {
  id: string;
  type: 'input_validation' | 'approval' | 'review_edit' | 'tool_authorization' | 'approval_required' | 'checkpoint_reached';
  title: string;
  message: string;
  timestamp: string;
  thread_id: string;
  data?: any;
}

export interface TaskProgress {
  toolName: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ArtifactInfo {
  id: string;
  title: string;
  description: string;
  type: 'code' | 'text' | 'image' | 'document' | 'data';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface BillingInfo {
  credits_used: number;
  messages_count: number;
  session_cost?: number;
  total_cost?: number;
}

// ================================================================================
// Callback Adapter Implementation
// ================================================================================

export class CallbackAdapter extends BaseEventHandler<AGUIEvent> {
  readonly name = 'callback_adapter';
  readonly version = '1.0.0';
  private hasStartedStreaming = false; // 跟踪是否已经开始流式输出
  
  constructor(private legacyCallbacks: SSEParserCallbacks) {
    super({
      timeout: 5000, // 5秒超时
      retry: {
        maxRetries: 2,
        retryDelay: 1000
      }
    }, 1000); // 高优先级
  }
  
  canHandle(event: AGUIEvent): boolean {
    // 处理所有 AGUI 事件类型
    return true;
  }
  
  async handle(event: AGUIEvent): Promise<HandlerResult> {
    try {
      console.log('🔄 CALLBACK_ADAPTER: Converting AGUI event to legacy callback:', {
        type: event.type,
        thread_id: event.thread_id,
        timestamp: event.timestamp
      });
      
      const converted = this.convertAGUIEventToLegacyCallback(event);
      
      return {
        success: true,
        continue: true,
        duration: Date.now() - new Date(event.timestamp).getTime(),
        handledBy: this.name,
        data: converted,
        metadata: {
          originalEventType: event.type,
          callbacksTriggered: converted.callbacksTriggered || 0,
          conversionTime: Date.now() - new Date(event.timestamp).getTime()
        }
      };
      
    } catch (error) {
      console.error('🔄 CALLBACK_ADAPTER: Conversion failed:', error);
      
      // 尝试触发错误回调
      if (this.legacyCallbacks.onError) {
        this.legacyCallbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
      
      return {
        success: false,
        continue: false,
        duration: Date.now() - new Date(event.timestamp).getTime(),
        handledBy: this.name,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          originalEventType: event.type,
          failedConversion: true
        }
      };
    }
  }
  
  /**
   * 将 AGUI 事件转换为对应的 legacy 回调调用
   */
  private convertAGUIEventToLegacyCallback(event: AGUIEvent): { callbacksTriggered: number } {
    let callbacksTriggered = 0;
    
    switch (event.type) {
      case 'run_started':
        if (this.legacyCallbacks.onStreamStart) {
          const runEvent = event as any;
          this.legacyCallbacks.onStreamStart(
            runEvent.run_id || `run_${Date.now()}`,
            runEvent.instructions || 'Starting conversation...'
          );
          callbacksTriggered++;
        }
        break;
        
      case 'text_message_start':
        if (this.legacyCallbacks.onStreamStart) {
          const messageEvent = event as any;
          this.legacyCallbacks.onStreamStart(
            messageEvent.message_id,
            `Starting ${messageEvent.role} message...`
          );
          callbacksTriggered++;
        }
        break;
        
      case 'text_message_content':
        if (this.legacyCallbacks.onStreamContent) {
          const contentEvent = event as any;
          
          // 🔄 CALLBACK_ADAPTER: 只处理实际的文本内容，过滤掉JSON和状态消息
          let content = '';
          
          // 检查原始数据类型，确定这是否是一个真正的文本内容事件
          const rawType = contentEvent.metadata?._raw?.type;
          console.log('🔄 CALLBACK_ADAPTER: Processing content event:', {
            eventType: contentEvent.type,
            rawType: rawType,
            hasCustomChunk: !!contentEvent.custom_llm_chunk,
            deltaType: typeof contentEvent.delta
          });
          
          // 只处理 custom_stream 类型的事件，这些包含实际的AI回复内容
          if (rawType === 'custom_stream' && contentEvent.custom_llm_chunk) {
            content = String(contentEvent.custom_llm_chunk);
          } else if (rawType === 'custom_stream' && contentEvent.delta && 
                     typeof contentEvent.delta === 'object' && 
                     contentEvent.delta.custom_llm_chunk) {
            content = String(contentEvent.delta.custom_llm_chunk);
          } else {
            // 跳过非内容事件（start, message_stream, graph_update等）
            console.log('🔄 CALLBACK_ADAPTER: Skipping non-content event:', rawType);
            return {
              success: true,
              continue: true,
              duration: Date.now() - new Date(contentEvent.timestamp).getTime(),
              handledBy: this.name,
              data: { skipped: true, reason: 'non-content-event' }
            };
          }
          
          if (content && content.trim()) {
            console.log('🔄 CALLBACK_ADAPTER: Extracted valid content:', {
              content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              length: content.length
            });
            
            // 只在第一次收到内容时更新状态
            if (!this.hasStartedStreaming && this.legacyCallbacks.onStreamStatus) {
              this.legacyCallbacks.onStreamStatus('🚀 Streaming...');
              this.hasStartedStreaming = true;
              callbacksTriggered++;
            }
            
            this.legacyCallbacks.onStreamContent(content);
            callbacksTriggered++;
          }
        }
        break;
        
      case 'text_message_end':
        if (this.legacyCallbacks.onStreamComplete) {
          const endEvent = event as any;
          this.legacyCallbacks.onStreamComplete(endEvent.final_content);
          callbacksTriggered++;
        }
        break;
        
      case 'run_finished':
        if (this.legacyCallbacks.onStreamComplete) {
          const finishedEvent = event as any;
          this.legacyCallbacks.onStreamComplete();
          callbacksTriggered++;
        }
        if (this.legacyCallbacks.onStreamStatus) {
          this.legacyCallbacks.onStreamStatus('✅ Conversation completed');
          callbacksTriggered++;
        }
        // 重置流状态跟踪
        this.hasStartedStreaming = false;
        break;
        
      case 'stream_done':
        // 处理 [DONE] 标记 - 表示流结束
        if (this.legacyCallbacks.onStreamComplete) {
          this.legacyCallbacks.onStreamComplete();
          callbacksTriggered++;
        }
        if (this.legacyCallbacks.onStreamStatus) {
          this.legacyCallbacks.onStreamStatus('✅ Stream completed');
          callbacksTriggered++;
        }
        // 重置流状态跟踪
        this.hasStartedStreaming = false;
        break;
        
      case 'run_error':
        if (this.legacyCallbacks.onError) {
          const errorEvent = event as any;
          const error = new Error(errorEvent.error?.message || 'An error occurred');
          (error as any).code = errorEvent.error?.code || 'UNKNOWN_ERROR';
          (error as any).details = errorEvent.error?.details;
          this.legacyCallbacks.onError(error);
          callbacksTriggered++;
        }
        break;
        
      case 'tool_call_start':
        if (this.legacyCallbacks.onStreamStatus) {
          const toolEvent = event as any;
          this.legacyCallbacks.onStreamStatus(`🔧 Calling ${toolEvent.tool_name}...`);
          callbacksTriggered++;
        }
        break;
        
      case 'tool_call_end':
        if (this.legacyCallbacks.onStreamStatus) {
          const toolEvent = event as any;
          const status = toolEvent.error ? 
            `❌ ${toolEvent.tool_name} failed: ${toolEvent.error}` : 
            `✅ ${toolEvent.tool_name} completed`;
          this.legacyCallbacks.onStreamStatus(status);
          callbacksTriggered++;
        }
        break;
        
      case 'hil_interrupt_detected':
        if (this.legacyCallbacks.onHILInterruptDetected) {
          const interruptEvent = event as any;
          const hilInterrupt: HILInterrupt = {
            id: interruptEvent.interrupt.id,
            type: interruptEvent.interrupt.type || 'approval_required',
            title: interruptEvent.interrupt.title,
            message: interruptEvent.interrupt.description || interruptEvent.interrupt.title,
            timestamp: event.timestamp,
            thread_id: event.thread_id,
            data: interruptEvent.interrupt.context
          };
          this.legacyCallbacks.onHILInterruptDetected(hilInterrupt);
          callbacksTriggered++;
        }
        break;
        
      case 'task_progress_update':
        if (this.legacyCallbacks.onTaskProgressUpdate) {
          const taskEvent = event as any;
          const taskProgress: TaskProgress = {
            toolName: taskEvent.task?.name || 'Unknown Task',
            description: taskEvent.task?.description || `Task progress: ${taskEvent.task?.progress}%`,
            currentStep: Math.round((taskEvent.task?.progress || 0) / 100 * 10),
            totalSteps: 10,
            status: taskEvent.task?.status || 'running'
          };
          this.legacyCallbacks.onTaskProgressUpdate(taskProgress);
          callbacksTriggered++;
        }
        break;
        
      case 'artifact_created':
      case 'artifact_updated':
        if (this.legacyCallbacks.onArtifactUpdate) {
          const artifactEvent = event as any;
          const artifact: ArtifactInfo = {
            id: artifactEvent.artifact?.id || `artifact_${Date.now()}`,
            title: artifactEvent.artifact?.title || 'Untitled Artifact',
            description: artifactEvent.artifact?.description || 'Generated artifact',
            type: artifactEvent.artifact?.type || 'text',
            content: artifactEvent.artifact?.content,
            url: artifactEvent.artifact?.url,
            metadata: artifactEvent.artifact?.metadata
          };
          this.legacyCallbacks.onArtifactUpdate(artifact);
          callbacksTriggered++;
        }
        break;
        
      case 'custom_event':
        // 处理自定义事件（如 graph_update, memory_update 等）
        const customEvent = event as any;
        const customType = customEvent.metadata?.custom_type;
        
        switch (customType) {
          case 'graph_update':
            if (this.legacyCallbacks.onGraphUpdate) {
              this.legacyCallbacks.onGraphUpdate(customEvent.metadata?.graph_data);
              callbacksTriggered++;
            }
            break;
            
          case 'memory_update':
            if (this.legacyCallbacks.onMemoryUpdate) {
              this.legacyCallbacks.onMemoryUpdate(customEvent.metadata?.memory_data);
              callbacksTriggered++;
            }
            break;
            
          case 'billing':
            // ⚠️ 暂时禁用新架构的billing处理，避免与旧架构重复计费
            console.log('🔄 CALLBACK_ADAPTER: Skipping billing event to avoid duplicate charges:', customEvent);
            break;
            
          case 'credits':
            // ⚠️ 暂时禁用新架构的credits处理，避免与旧架构重复更新
            console.log('🔄 CALLBACK_ADAPTER: Skipping credits event to avoid duplicate updates:', customEvent);
            break;
            
          case 'node_update':
            if (this.legacyCallbacks.onNodeUpdate) {
              this.legacyCallbacks.onNodeUpdate(customEvent.metadata?.node_data);
              callbacksTriggered++;
            }
            break;
            
          default:
            if (this.legacyCallbacks.onCustomEvent) {
              this.legacyCallbacks.onCustomEvent(customEvent);
              callbacksTriggered++;
            }
        }
        break;
        
      default:
        // 未知事件类型，触发自定义事件回调
        if (this.legacyCallbacks.onCustomEvent) {
          this.legacyCallbacks.onCustomEvent(event);
          callbacksTriggered++;
        }
        break;
    }
    
    return { callbacksTriggered };
  }
  
  /**
   * 更新回调函数引用
   */
  updateCallbacks(newCallbacks: Partial<SSEParserCallbacks>): void {
    this.legacyCallbacks = { ...this.legacyCallbacks, ...newCallbacks };
  }
  
  /**
   * 获取当前回调函数配置
   */
  getCallbacks(): SSEParserCallbacks {
    return { ...this.legacyCallbacks };
  }
  
  /**
   * 检查特定回调是否已配置
   */
  hasCallback(callbackName: keyof SSEParserCallbacks): boolean {
    return typeof this.legacyCallbacks[callbackName] === 'function';
  }
  
  /**
   * 获取支持的回调函数列表
   */
  getSupportedCallbacks(): (keyof SSEParserCallbacks)[] {
    return Object.keys(this.legacyCallbacks) as (keyof SSEParserCallbacks)[];
  }
}

// ================================================================================
// Factory Functions - 工厂函数
// ================================================================================

/**
 * 创建回调适配器实例
 */
export const createCallbackAdapter = (callbacks: SSEParserCallbacks): CallbackAdapter => {
  return new CallbackAdapter(callbacks);
};

/**
 * 创建空的回调适配器（用于测试）
 */
export const createEmptyCallbackAdapter = (): CallbackAdapter => {
  return new CallbackAdapter({});
};

/**
 * 从现有适配器创建新的适配器（深拷贝）
 */
export const cloneCallbackAdapter = (adapter: CallbackAdapter): CallbackAdapter => {
  const callbacks = adapter.getCallbacks();
  return new CallbackAdapter(callbacks);
};

// ================================================================================
// Utility Functions - 工具函数
// ================================================================================

/**
 * 验证回调函数配置
 */
export const validateCallbacks = (callbacks: SSEParserCallbacks): string[] => {
  const issues: string[] = [];
  
  Object.entries(callbacks).forEach(([name, callback]) => {
    if (callback !== undefined && typeof callback !== 'function') {
      issues.push(`${name} is not a function`);
    }
  });
  
  return issues;
};

/**
 * 创建默认回调配置（用于测试和开发）
 */
export const createDefaultCallbacks = (): SSEParserCallbacks => {
  return {
    onStreamStart: (messageId, content) => console.log(`🚀 Stream started: ${messageId}`, content),
    onStreamContent: (content) => console.log(`📝 Content: ${content}`),
    onStreamComplete: (content) => console.log(`✅ Stream completed`, content),
    onStreamStatus: (status) => console.log(`📊 Status: ${status}`),
    onError: (error) => console.error(`❌ Error:`, error),
    onHILInterruptDetected: (interrupt) => console.log(`⏸️ HIL Interrupt:`, interrupt),
    onTaskProgressUpdate: (progress) => console.log(`📈 Task Progress:`, progress),
    onArtifactUpdate: (artifact) => console.log(`📄 Artifact:`, artifact),
    onGraphUpdate: (graph) => console.log(`🔗 Graph Update:`, graph),
    onMemoryUpdate: (memory) => console.log(`🧠 Memory Update:`, memory),
    onBillingUpdate: (billing) => console.log(`💰 Billing:`, billing),
    onCreditsUpdate: (credits) => console.log(`🪙 Credits:`, credits),
    onNodeUpdate: (node) => console.log(`🔘 Node Update:`, node),
    onCustomEvent: (event) => console.log(`🎭 Custom Event:`, event)
  };
};