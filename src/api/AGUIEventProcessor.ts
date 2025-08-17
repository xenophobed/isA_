/**
 * ============================================================================
 * AGUI Event Processor - 标准化AI事件处理器
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理AGUI标准事件并转换为应用内部格式
 * - 与现有SSEParser协同工作，提供渐进式升级路径
 * - 支持双向事件流（Agent→UI, UI→Agent）
 * - 管理事件生命周期和状态
 * 
 * 【设计原则】
 * ✅ 向后兼容：不破坏现有SSEParser功能
 * ✅ 渐进升级：可选择性启用AGUI标准化
 * ✅ 类型安全：完整TypeScript类型支持
 * ✅ 可扩展：易于添加新的事件类型
 * 
 * 【集成策略】
 * 1. 双重处理：同时支持legacy和AGUI事件
 * 2. 事件桥接：自动转换legacy→AGUI
 * 3. 状态同步：与现有Store系统集成
 * 4. UI适配：为现有UI组件提供标准化数据
 */

import { 
  AGUIEvent, 
  AGUIEventType, 
  AGUIEventCallbacks,
  AGUIEventBuilder,
  convertLegacyToAGUI,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallEndEvent,
  HILInterruptDetectedEvent,
  HILApprovalRequiredEvent,
  HILCheckpointCreatedEvent
} from '../types/aguiTypes';

import { SSEParserCallbacks, SSEEventData } from './SSEParser';
import { logger, LogCategory } from '../utils/logger';

// ================================================================================
// Event State Management - 事件状态管理
// ================================================================================

interface ActiveRun {
  run_id: string;
  thread_id: string;
  status: 'running' | 'paused' | 'completed' | 'error' | 'cancelled';
  started_at: string;
  current_message_id?: string;
  active_tool_calls: Set<string>;
  checkpoints: string[];
  interrupts: string[];
}

interface ActiveMessage {
  message_id: string;
  role: 'assistant' | 'user' | 'system';
  content_chunks: string[];
  started_at: string;
  completed: boolean;
}

// ================================================================================
// AGUI Event Processor Class
// ================================================================================

export class AGUIEventProcessor {
  private activeRuns = new Map<string, ActiveRun>();
  private activeMessages = new Map<string, ActiveMessage>();
  private eventCallbacks: AGUIEventCallbacks = {};
  private legacyCallbacks: SSEParserCallbacks = {};
  
  // 配置选项
  private options = {
    enableAGUIStandardization: true,
    enableLegacyCompatibility: true,
    enableEventLogging: true,
    enableStateTracking: true
  };

  constructor(options?: Partial<typeof AGUIEventProcessor.prototype.options>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  // ================================================================================
  // Callback Registration - 回调注册
  // ================================================================================

  /**
   * 注册AGUI标准事件回调
   */
  registerAGUICallbacks(callbacks: AGUIEventCallbacks): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
    logger.info(LogCategory.CHAT_FLOW, 'AGUI callbacks registered', {
      callbackCount: Object.keys(callbacks).length
    });
  }

  /**
   * 注册Legacy SSE回调（向后兼容）
   */
  registerLegacyCallbacks(callbacks: SSEParserCallbacks): void {
    this.legacyCallbacks = { ...this.legacyCallbacks, ...callbacks };
    logger.info(LogCategory.CHAT_FLOW, 'Legacy SSE callbacks registered', {
      callbackCount: Object.keys(callbacks).length
    });
  }

  // ================================================================================
  // Event Processing - 事件处理
  // ================================================================================

  /**
   * 处理AGUI标准事件
   */
  processAGUIEvent(event: AGUIEvent): void {
    if (this.options.enableEventLogging) {
      logger.debug(LogCategory.CHAT_FLOW, 'Processing AGUI event', {
        type: event.type,
        thread_id: event.thread_id,
        timestamp: event.timestamp
      });
    }

    // 更新内部状态
    if (this.options.enableStateTracking) {
      this.updateStateFromAGUIEvent(event);
    }

    // 调用相应的回调函数
    this.dispatchAGUIEvent(event);

    // 如果启用了legacy兼容性，同时触发legacy回调
    if (this.options.enableLegacyCompatibility) {
      this.bridgeToLegacyCallbacks(event);
    }
  }

  /**
   * 处理Legacy SSE事件并转换为AGUI标准
   */
  processLegacyEvent(legacyData: string, threadId: string): void {
    try {
      const legacyEvent: SSEEventData = JSON.parse(legacyData);
      
      if (this.options.enableEventLogging) {
        logger.debug(LogCategory.CHAT_FLOW, 'Processing legacy event', {
          type: legacyEvent.type,
          thread_id: threadId
        });
      }

      // 首先触发legacy回调（保持现有功能）
      if (this.options.enableLegacyCompatibility) {
        // 这里可以调用现有的SSEParser.parseSSEEvent逻辑
        // SSEParser.parseSSEEvent(legacyData, this.legacyCallbacks);
      }

      // 如果启用AGUI标准化，转换并处理AGUI事件
      if (this.options.enableAGUIStandardization) {
        const aguiEvent = convertLegacyToAGUI(legacyEvent, threadId);
        if (aguiEvent) {
          this.processAGUIEvent(aguiEvent);
        }
      }

    } catch (error) {
      logger.error(LogCategory.CHAT_FLOW, 'Failed to process legacy event', {
        error: error instanceof Error ? error.message : String(error),
        thread_id: threadId
      });
    }
  }

  // ================================================================================
  // State Management - 状态管理
  // ================================================================================

  private updateStateFromAGUIEvent(event: AGUIEvent): void {
    switch (event.type) {
      case 'run_started':
        this.handleRunStarted(event as RunStartedEvent);
        break;
      case 'run_finished':
      case 'run_error':
      case 'run_cancelled':
        this.handleRunEnded(event);
        break;
      case 'text_message_start':
        this.handleMessageStarted(event as TextMessageStartEvent);
        break;
      case 'text_message_content':
        this.handleMessageContent(event as TextMessageContentEvent);
        break;
      case 'text_message_end':
        this.handleMessageEnded(event as TextMessageEndEvent);
        break;
      case 'tool_call_start':
        this.handleToolCallStarted(event as ToolCallStartEvent);
        break;
      case 'tool_call_end':
        this.handleToolCallEnded(event as ToolCallEndEvent);
        break;
      case 'hil_checkpoint_created':
        this.handleCheckpointCreated(event as HILCheckpointCreatedEvent);
        break;
      case 'hil_interrupt_detected':
        this.handleInterruptDetected(event as HILInterruptDetectedEvent);
        break;
    }
  }

  private handleRunStarted(event: RunStartedEvent): void {
    const run: ActiveRun = {
      run_id: event.run_id || `run_${Date.now()}`,
      thread_id: event.thread_id,
      status: 'running',
      started_at: event.timestamp,
      active_tool_calls: new Set(),
      checkpoints: [],
      interrupts: []
    };
    
    this.activeRuns.set(event.thread_id, run);
    
    logger.info(LogCategory.CHAT_FLOW, 'Run started', {
      thread_id: event.thread_id,
      run_id: run.run_id
    });
  }

  private handleRunEnded(event: AGUIEvent): void {
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.status = event.type === 'run_finished' ? 'completed' : 
                   event.type === 'run_error' ? 'error' : 'cancelled';
      
      logger.info(LogCategory.CHAT_FLOW, 'Run ended', {
        thread_id: event.thread_id,
        status: run.status
      });
    }
  }

  private handleMessageStarted(event: TextMessageStartEvent): void {
    const message: ActiveMessage = {
      message_id: event.message_id,
      role: event.role,
      content_chunks: [],
      started_at: event.timestamp,
      completed: false
    };
    
    this.activeMessages.set(event.message_id, message);
    
    // 更新run状态
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.current_message_id = event.message_id;
    }
  }

  private handleMessageContent(event: TextMessageContentEvent): void {
    const message = this.activeMessages.get(event.message_id);
    if (message) {
      message.content_chunks.push(event.delta);
    }
  }

  private handleMessageEnded(event: TextMessageEndEvent): void {
    const message = this.activeMessages.get(event.message_id);
    if (message) {
      message.completed = true;
    }
    
    // 清理run的当前消息
    const run = this.activeRuns.get(event.thread_id);
    if (run && run.current_message_id === event.message_id) {
      run.current_message_id = undefined;
    }
  }

  private handleToolCallStarted(event: ToolCallStartEvent): void {
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.active_tool_calls.add(event.tool_call_id);
    }
  }

  private handleToolCallEnded(event: ToolCallEndEvent): void {
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.active_tool_calls.delete(event.tool_call_id);
    }
  }

  private handleCheckpointCreated(event: HILCheckpointCreatedEvent): void {
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.checkpoints.push(event.checkpoint.id);
    }
  }

  private handleInterruptDetected(event: HILInterruptDetectedEvent): void {
    const run = this.activeRuns.get(event.thread_id);
    if (run) {
      run.status = 'paused';
      run.interrupts.push(event.interrupt.id);
    }
  }

  // ================================================================================
  // Event Dispatching - 事件分发
  // ================================================================================

  private dispatchAGUIEvent(event: AGUIEvent): void {
    const callbackName = this.getCallbackName(event.type);
    const callback = this.eventCallbacks[callbackName as keyof AGUIEventCallbacks];
    
    if (callback) {
      try {
        (callback as any)(event);
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'AGUI event callback failed', {
          type: event.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private getCallbackName(eventType: AGUIEventType): string {
    // 将 snake_case 转换为 camelCase 回调名称
    // 例如: 'run_started' → 'onRunStarted'
    return 'on' + eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  // ================================================================================
  // Legacy Bridge - Legacy桥接
  // ================================================================================

  private bridgeToLegacyCallbacks(event: AGUIEvent): void {
    // 将AGUI事件转换为legacy回调调用
    switch (event.type) {
      case 'run_started':
        this.legacyCallbacks.onStreamStart?.(
          event.run_id || `run_${Date.now()}`,
          'Starting...'
        );
        break;
        
      case 'text_message_content':
        const contentEvent = event as TextMessageContentEvent;
        this.legacyCallbacks.onStreamContent?.(contentEvent.delta);
        break;
        
      case 'text_message_end':
        this.legacyCallbacks.onStreamComplete?.();
        break;
        
      case 'run_finished':
        this.legacyCallbacks.onStreamComplete?.();
        break;
        
      case 'run_error':
        const errorEvent = event as RunErrorEvent;
        this.legacyCallbacks.onError?.(new Error(errorEvent.error.message));
        break;
        
      case 'tool_call_start':
        const toolStartEvent = event as ToolCallStartEvent;
        this.legacyCallbacks.onStreamStatus?.(`🔧 Calling ${toolStartEvent.tool_name}...`);
        break;
        
      case 'hil_interrupt_detected':
        const interruptEvent = event as HILInterruptDetectedEvent;
        this.legacyCallbacks.onStreamStatus?.(`⏸️ ${interruptEvent.interrupt.title}`);
        break;
    }
  }

  // ================================================================================
  // Utility Methods - 工具方法
  // ================================================================================

  /**
   * 获取活跃运行状态
   */
  getActiveRun(threadId: string): ActiveRun | undefined {
    return this.activeRuns.get(threadId);
  }

  /**
   * 获取活跃消息状态
   */
  getActiveMessage(messageId: string): ActiveMessage | undefined {
    return this.activeMessages.get(messageId);
  }

  /**
   * 清理已完成的运行和消息
   */
  cleanup(maxAge: number = 300000): void { // 5分钟
    const now = Date.now();
    
    // 清理旧的运行
    for (const [threadId, run] of Array.from(this.activeRuns.entries())) {
      const age = now - new Date(run.started_at).getTime();
      if (age > maxAge && ['completed', 'error', 'cancelled'].includes(run.status)) {
        this.activeRuns.delete(threadId);
      }
    }
    
    // 清理旧的消息
    for (const [messageId, message] of Array.from(this.activeMessages.entries())) {
      const age = now - new Date(message.started_at).getTime();
      if (age > maxAge && message.completed) {
        this.activeMessages.delete(messageId);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      active_runs: this.activeRuns.size,
      active_messages: this.activeMessages.size,
      enabled_features: {
        agui_standardization: this.options.enableAGUIStandardization,
        legacy_compatibility: this.options.enableLegacyCompatibility,
        event_logging: this.options.enableEventLogging,
        state_tracking: this.options.enableStateTracking
      }
    };
  }
}

// ================================================================================
// Factory and Utilities
// ================================================================================

/**
 * 创建AGUI事件处理器实例
 */
export function createAGUIEventProcessor(options?: {
  enableAGUIStandardization?: boolean;
  enableLegacyCompatibility?: boolean;
  enableEventLogging?: boolean;
  enableStateTracking?: boolean;
}): AGUIEventProcessor {
  return new AGUIEventProcessor(options);
}

/**
 * 创建AGUI事件构建器
 */
export function createAGUIEventBuilder(threadId: string, runId?: string): AGUIEventBuilder {
  return new AGUIEventBuilder(threadId, runId);
}

// ================================================================================
// 默认实例导出
// ================================================================================

// 创建默认的全局实例
export const defaultAGUIProcessor = createAGUIEventProcessor({
  enableAGUIStandardization: true,
  enableLegacyCompatibility: true,
  enableEventLogging: true,
  enableStateTracking: true
});

export default AGUIEventProcessor;