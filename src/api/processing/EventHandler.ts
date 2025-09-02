/**
 * ============================================================================
 * Event Handler Base Classes - 事件处理器基础类
 * ============================================================================
 * 
 * 核心职责:
 * - 定义统一的事件处理接口
 * - 提供错误处理和重试机制
 * - 支持异步事件处理
 * - 处理结果跟踪和性能监控
 */

// ================================================================================
// 基础类型定义
// ================================================================================

export interface HandlerResult {
  success: boolean;
  continue: boolean; // 是否继续处理链
  duration: number;
  handledBy: string;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface HandlerConfig {
  timeout?: number;
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
  priority?: number;
}

// ================================================================================
// 事件处理器接口
// ================================================================================

export interface EventHandler<TEvent = any> {
  readonly name: string;
  readonly version: string;
  readonly priority: number;
  
  canHandle(event: TEvent): boolean;
  handle(event: TEvent): Promise<HandlerResult>;
  processEvent(event: TEvent): Promise<HandlerResult>;
  dispose?(): Promise<void>;
  
  // 可选的生命周期方法
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
}

// ================================================================================
// 基础事件处理器实现
// ================================================================================

export abstract class BaseEventHandler<TEvent> implements EventHandler<TEvent> {
  abstract readonly name: string;
  abstract readonly version: string;
  
  public readonly priority: number;
  protected readonly config: HandlerConfig;
  
  private isInitialized = false;
  
  constructor(config: HandlerConfig = {}, priority = 0) {
    this.config = {
      timeout: 30000, // 30秒默认超时
      retry: {
        maxRetries: 3,
        retryDelay: 1000
      },
      ...config
    };
    this.priority = priority;
  }
  
  abstract canHandle(event: TEvent): boolean;
  abstract handle(event: TEvent): Promise<HandlerResult>;
  
  /**
   * 带超时和重试的处理包装器
   */
  async processEvent(event: TEvent): Promise<HandlerResult> {
    if (!this.isInitialized) {
      await this.ensureInitialized();
    }
    
    const startTime = Date.now();
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= (this.config.retry?.maxRetries || 0); attempt++) {
      try {
        const result = await this.executeWithTimeout(event);
        
        // 成功处理
        return {
          ...result,
          duration: Date.now() - startTime,
          handledBy: this.name
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.warn(`${this.name}: Handler attempt ${attempt + 1} failed:`, lastError);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < (this.config.retry?.maxRetries || 0)) {
          await this.delay(this.config.retry?.retryDelay || 1000);
          continue;
        }
      }
    }
    
    // 所有重试都失败了
    return {
      success: false,
      continue: false,
      duration: Date.now() - startTime,
      handledBy: this.name,
      error: lastError || new Error('Handler failed after all retries'),
      metadata: {
        attempts: (this.config.retry?.maxRetries || 0) + 1,
        finalAttemptFailed: true
      }
    };
  }
  
  /**
   * 带超时执行
   */
  private async executeWithTimeout(event: TEvent): Promise<HandlerResult> {
    const timeout = this.config.timeout || 30000;
    
    return Promise.race([
      this.handle(event),
      new Promise<HandlerResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Handler timeout after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }
  
  /**
   * 确保处理器已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      if ((this as any).initialize) {
        await (this as any).initialize();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error(`${this.name}: Initialization failed:`, error);
      throw error;
    }
  }
  
  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 创建标准成功结果
   */
  protected createSuccessResult(data?: any, metadata?: Record<string, any>): HandlerResult {
    return {
      success: true,
      continue: true,
      duration: 0, // 将在上层设置
      handledBy: this.name,
      data,
      metadata
    };
  }
  
  /**
   * 创建标准错误结果
   */
  protected createErrorResult(error: Error, metadata?: Record<string, any>): HandlerResult {
    return {
      success: false,
      continue: false,
      duration: 0, // 将在上层设置
      handledBy: this.name,
      error,
      metadata
    };
  }
  
  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    if ((this as any).cleanup) {
      try {
        await (this as any).cleanup();
      } catch (error) {
        console.warn(`${this.name}: Cleanup failed:`, error);
      }
    }
    this.isInitialized = false;
  }
}

// ================================================================================
// 特殊处理器类型
// ================================================================================

/**
 * 简单同步处理器基类
 */
export abstract class SimpleSyncHandler<TEvent> extends BaseEventHandler<TEvent> {
  abstract handleSync(event: TEvent): HandlerResult;
  
  async handle(event: TEvent): Promise<HandlerResult> {
    return this.handleSync(event);
  }
}

/**
 * 批处理器基类
 */
export abstract class BatchHandler<TEvent> extends BaseEventHandler<TEvent[]> {
  protected batchSize: number;
  protected flushInterval: number;
  private batch: TEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  
  constructor(config: HandlerConfig & { batchSize?: number; flushInterval?: number } = {}, priority = 0) {
    super(config, priority);
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000; // 5秒
  }
  
  canHandle(events: TEvent[]): boolean {
    return Array.isArray(events) && events.length > 0;
  }
  
  /**
   * 添加事件到批次
   */
  addToBatch(event: TEvent): void {
    this.batch.push(event);
    
    if (this.batch.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushBatch(), this.flushInterval);
    }
  }
  
  /**
   * 立即刷新批次
   */
  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;
    
    const currentBatch = [...this.batch];
    this.batch = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    try {
      await this.processEvent(currentBatch);
    } catch (error) {
      console.error(`${this.name}: Batch processing failed:`, error);
    }
  }
  
  async dispose(): Promise<void> {
    await this.flushBatch(); // 处理剩余批次
    await super.dispose();
  }
}

// ================================================================================
// 工具函数
// ================================================================================

/**
 * 按优先级排序处理器
 */
export const sortHandlersByPriority = <T extends EventHandler>(handlers: T[]): T[] => {
  return [...handlers].sort((a, b) => b.priority - a.priority);
};

/**
 * 创建处理器性能统计
 */
export const createHandlerStats = (results: HandlerResult[]): {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  handlerBreakdown: Record<string, { count: number; avgDuration: number; errorRate: number }>;
} => {
  const stats = {
    totalProcessed: results.length,
    successCount: results.filter(r => r.success).length,
    errorCount: results.filter(r => !r.success).length,
    averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length || 0,
    handlerBreakdown: {} as Record<string, { count: number; avgDuration: number; errorRate: number }>
  };
  
  // 按处理器分组统计
  const byHandler = new Map<string, HandlerResult[]>();
  for (const result of results) {
    const handlerResults = byHandler.get(result.handledBy) || [];
    handlerResults.push(result);
    byHandler.set(result.handledBy, handlerResults);
  }
  
  for (const [handlerName, handlerResults] of Array.from(byHandler.entries())) {
    const errors = handlerResults.filter((r: HandlerResult) => !r.success).length;
    stats.handlerBreakdown[handlerName] = {
      count: handlerResults.length,
      avgDuration: handlerResults.reduce((sum: number, r: HandlerResult) => sum + r.duration, 0) / handlerResults.length,
      errorRate: errors / handlerResults.length
    };
  }
  
  return stats;
};