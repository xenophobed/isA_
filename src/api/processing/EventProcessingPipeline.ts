/**
 * ============================================================================
 * Event Processing Pipeline - 事件处理管道
 * ============================================================================
 * 
 * 核心职责:
 * - 管理事件处理器链
 * - 按优先级顺序执行处理器
 * - 处理错误和失败恢复
 * - 性能监控和统计
 */

import { EventHandler, HandlerResult, sortHandlersByPriority, createHandlerStats } from './EventHandler';

// ================================================================================
// 管道配置
// ================================================================================

export interface PipelineConfig {
  /** 是否在第一个处理器失败时停止 */
  stopOnFirstError?: boolean;
  
  /** 是否在任何处理器返回 continue: false 时停止 */
  stopOnContinueFalse?: boolean;
  
  /** 最大处理时间 (毫秒) */
  maxProcessingTime?: number;
  
  /** 是否收集详细统计信息 */
  collectStats?: boolean;
  
  /** 是否启用调试日志 */
  enableDebugLogging?: boolean;
}

export interface PipelineResult {
  success: boolean;
  processedCount: number;
  results: HandlerResult[];
  totalDuration: number;
  stats?: ReturnType<typeof createHandlerStats>;
  error?: Error;
}

// ================================================================================
// 事件处理管道实现
// ================================================================================

export class EventProcessingPipeline {
  private handlers: EventHandler[] = [];
  private readonly config: Required<PipelineConfig>;
  private isDisposed = false;
  
  constructor(config: PipelineConfig = {}) {
    this.config = {
      stopOnFirstError: false,
      stopOnContinueFalse: true,
      maxProcessingTime: 60000, // 60秒
      collectStats: true,
      enableDebugLogging: false,
      ...config
    };
  }
  
  /**
   * 添加处理器到管道
   */
  addHandler(handler: EventHandler): void {
    if (this.isDisposed) {
      throw new Error('Cannot add handler to disposed pipeline');
    }
    
    this.handlers.push(handler);
    this.sortHandlers();
    
    if (this.config.enableDebugLogging) {
      console.log(`Pipeline: Added handler ${handler.name} with priority ${handler.priority}`);
    }
  }
  
  /**
   * 移除处理器
   */
  removeHandler(handlerName: string): boolean {
    const index = this.handlers.findIndex(h => h.name === handlerName);
    if (index >= 0) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * 获取所有处理器
   */
  getHandlers(): Readonly<EventHandler[]> {
    return [...this.handlers];
  }
  
  /**
   * 处理事件
   */
  async process<TEvent>(event: TEvent): Promise<PipelineResult> {
    if (this.isDisposed) {
      throw new Error('Cannot process event on disposed pipeline');
    }
    
    const startTime = Date.now();
    const results: HandlerResult[] = [];
    let processedCount = 0;
    let pipelineError: Error | undefined;
    
    if (this.config.enableDebugLogging) {
      console.log(`Pipeline: Processing event through ${this.handlers.length} handlers`);
    }
    
    try {
      // 创建超时Promise
      const timeoutPromise = this.config.maxProcessingTime > 0 
        ? this.createTimeoutPromise(this.config.maxProcessingTime)
        : null;
      
      // 处理事件的主逻辑
      const processingPromise = this.processEventInternal(event, results);
      
      // 等待处理完成或超时
      if (timeoutPromise) {
        await Promise.race([processingPromise, timeoutPromise]);
      } else {
        await processingPromise;
      }
      
      processedCount = results.length;
      
    } catch (error) {
      pipelineError = error instanceof Error ? error : new Error(String(error));
      console.error('Pipeline: Processing failed:', pipelineError);
    }
    
    const totalDuration = Date.now() - startTime;
    const success = !pipelineError && results.every(r => r.success);
    
    if (this.config.enableDebugLogging) {
      console.log(`Pipeline: Completed processing in ${totalDuration}ms, success: ${success}`);
    }
    
    return {
      success,
      processedCount,
      results,
      totalDuration,
      stats: this.config.collectStats ? createHandlerStats(results) : undefined,
      error: pipelineError
    };
  }
  
  /**
   * 内部事件处理逻辑
   */
  private async processEventInternal<TEvent>(event: TEvent, results: HandlerResult[]): Promise<void> {
    for (const handler of this.handlers) {
      try {
        // 检查处理器是否能处理此事件
        if (!handler.canHandle(event)) {
          if (this.config.enableDebugLogging) {
            console.log(`Pipeline: Handler ${handler.name} cannot handle event, skipping`);
          }
          continue;
        }
        
        if (this.config.enableDebugLogging) {
          console.log(`Pipeline: Processing with handler ${handler.name}`);
        }
        
        // 处理事件
        const result = await handler.processEvent(event);
        results.push(result);
        
        if (this.config.enableDebugLogging) {
          console.log(`Pipeline: Handler ${handler.name} completed:`, {
            success: result.success,
            duration: result.duration,
            continue: result.continue
          });
        }
        
        // 检查是否应该停止处理
        if (!result.success && this.config.stopOnFirstError) {
          if (this.config.enableDebugLogging) {
            console.log(`Pipeline: Stopping due to error in ${handler.name}`);
          }
          break;
        }
        
        if (!result.continue && this.config.stopOnContinueFalse) {
          if (this.config.enableDebugLogging) {
            console.log(`Pipeline: Stopping due to continue=false from ${handler.name}`);
          }
          break;
        }
        
      } catch (error) {
        const handlerError = error instanceof Error ? error : new Error(String(error));
        
        const errorResult: HandlerResult = {
          success: false,
          continue: false,
          duration: 0,
          handledBy: handler.name,
          error: handlerError
        };
        
        results.push(errorResult);
        
        console.error(`Pipeline: Handler ${handler.name} threw error:`, handlerError);
        
        if (this.config.stopOnFirstError) {
          break;
        }
      }
    }
  }
  
  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Pipeline processing timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
  
  /**
   * 按优先级排序处理器
   */
  private sortHandlers(): void {
    this.handlers = sortHandlersByPriority(this.handlers);
  }
  
  /**
   * 批量处理事件
   */
  async processBatch<TEvent>(events: TEvent[]): Promise<PipelineResult[]> {
    if (this.isDisposed) {
      throw new Error('Cannot process batch on disposed pipeline');
    }
    
    const results: PipelineResult[] = [];
    
    for (const event of events) {
      try {
        const result = await this.process(event);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          processedCount: 0,
          results: [],
          totalDuration: 0,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    
    return results;
  }
  
  /**
   * 获取管道统计信息
   */
  getStats(): {
    handlerCount: number;
    handlerNames: string[];
    config: PipelineConfig;
  } {
    return {
      handlerCount: this.handlers.length,
      handlerNames: this.handlers.map(h => h.name),
      config: { ...this.config }
    };
  }
  
  /**
   * 清理管道资源
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) return;
    
    console.log('Pipeline: Disposing pipeline and handlers...');
    
    // 清理所有处理器
    const disposalPromises = this.handlers.map(handler => 
      handler.dispose?.().catch(error => 
        console.warn(`Pipeline: Failed to dispose handler ${handler.name}:`, error)
      )
    );
    
    await Promise.allSettled(disposalPromises);
    
    this.handlers = [];
    this.isDisposed = true;
    
    console.log('Pipeline: Disposal completed');
  }
}

// ================================================================================
// 工厂函数和工具
// ================================================================================

/**
 * 创建标准配置的管道
 */
export const createStandardPipeline = (): EventProcessingPipeline => {
  return new EventProcessingPipeline({
    stopOnFirstError: false,
    stopOnContinueFalse: true,
    maxProcessingTime: 30000,
    collectStats: true,
    enableDebugLogging: false
  });
};

/**
 * 创建调试模式的管道
 */
export const createDebugPipeline = (): EventProcessingPipeline => {
  return new EventProcessingPipeline({
    stopOnFirstError: false,
    stopOnContinueFalse: true,
    maxProcessingTime: 60000,
    collectStats: true,
    enableDebugLogging: true
  });
};

/**
 * 创建严格模式的管道（第一个错误就停止）
 */
export const createStrictPipeline = (): EventProcessingPipeline => {
  return new EventProcessingPipeline({
    stopOnFirstError: true,
    stopOnContinueFalse: true,
    maxProcessingTime: 10000,
    collectStats: true,
    enableDebugLogging: false
  });
};