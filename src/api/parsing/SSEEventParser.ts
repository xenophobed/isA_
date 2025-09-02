/**
 * ============================================================================
 * SSE Event Parser - Server-Sent Events 解析器
 * ============================================================================
 * 
 * 核心功能:
 * - 解析SSE格式的原始数据流
 * - 提取事件类型、数据和元数据
 * - 处理多行数据和特殊格式
 * - 支持自定义事件类型映射
 */

import { BaseParser, ParseError } from './Parser';

// ================================================================================
// SSE 事件类型定义
// ================================================================================

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
  metadata?: Record<string, any>;
}

export interface SSEParserOptions {
  allowCustomEvents?: boolean;
  maxEventSize?: number;
  strictMode?: boolean;
  eventTypeMapping?: Record<string, string>;
}

// ================================================================================
// SSE Event Parser 实现
// ================================================================================

export class SSEEventParser extends BaseParser<string, SSEEvent | SSEEvent[]> {
  readonly name = 'sse_event_parser';
  readonly version = '1.0.0';
  
  protected readonly options: SSEParserOptions;
  
  constructor(options: SSEParserOptions = {}) {
    super(options);
    this.options = {
      allowCustomEvents: true,
      maxEventSize: 1024 * 1024, // 1MB
      strictMode: false,
      ...options
    };
  }
  
  canParse(data: string): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }
    
    // 检查是否包含SSE格式标识
    return data.includes('data:') || 
           data.includes('event:') || 
           data.includes('id:') ||
           data.includes('[DONE]');
  }
  
  parse(rawData: string): SSEEvent | SSEEvent[] | null {
    if (!rawData || !this.canParse(rawData)) {
      return null;
    }
    
    try {
      // 处理 [DONE] 标记
      if (rawData.trim() === '[DONE]' || rawData.includes('data: [DONE]')) {
        return {
          event: 'stream_done',
          data: '[DONE]',
          metadata: { isDoneMarker: true }
        };
      }
      
      const events = this.parseMultipleEvents(rawData);
      return events.length === 1 ? events[0] : events;
      
    } catch (error) {
      console.error('SSE_PARSER: Parse error:', error);
      return null;
    }
  }
  
  /**
   * 解析多个SSE事件
   */
  private parseMultipleEvents(rawData: string): SSEEvent[] {
    const events: SSEEvent[] = [];
    
    // 按双换行符分割事件
    const eventBlocks = rawData.split(/\n\n|\r\n\r\n/);
    
    for (const block of eventBlocks) {
      if (!block.trim()) continue;
      
      const event = this.parseSingleEvent(block);
      if (event) {
        events.push(event);
      }
    }
    
    return events;
  }
  
  /**
   * 解析单个SSE事件
   */
  private parseSingleEvent(eventBlock: string): SSEEvent | null {
    const lines = eventBlock.split(/\n|\r\n/);
    const event: Partial<SSEEvent> = { data: '' };
    const dataLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith(':')) {
        continue; // 跳过空行和注释
      }
      
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) {
        // 无冒号的行，视为字段名
        continue;
      }
      
      const field = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      
      switch (field) {
        case 'id':
          event.id = value;
          break;
        case 'event':
          event.event = this.mapEventType(value);
          break;
        case 'data':
          dataLines.push(value);
          break;
        case 'retry':
          const retryValue = parseInt(value, 10);
          if (!isNaN(retryValue)) {
            event.retry = retryValue;
          }
          break;
        default:
          // 自定义字段
          if (this.options.allowCustomEvents) {
            event.metadata = event.metadata || {};
            event.metadata[field] = value;
          }
      }
    }
    
    // 合并数据行
    event.data = dataLines.join('\n');
    
    // 验证事件
    if (!event.data && !event.event) {
      return null;
    }
    
    // 检查大小限制
    if (this.options.maxEventSize && event.data.length > this.options.maxEventSize) {
      throw new ParseError(
        `Event size exceeds limit: ${event.data.length} > ${this.options.maxEventSize}`,
        'EVENT_TOO_LARGE',
        this.name
      );
    }
    
    return event as SSEEvent;
  }
  
  /**
   * 映射事件类型
   */
  private mapEventType(eventType: string): string {
    if (this.options.eventTypeMapping && this.options.eventTypeMapping[eventType]) {
      return this.options.eventTypeMapping[eventType];
    }
    return eventType;
  }
  
  /**
   * 验证解析结果
   */
  validate(data: SSEEvent | SSEEvent[]): boolean {
    if (!data) return false;
    
    const events = Array.isArray(data) ? data : [data];
    
    for (const event of events) {
      if (!event.data && !event.event) {
        return false;
      }
      
      if (this.options.strictMode) {
        // 严格模式下需要更多验证
        if (!event.event) {
          return false;
        }
      }
    }
    
    return true;
  }
}

// ================================================================================
// 工厂函数
// ================================================================================

/**
 * 创建SSE事件解析器
 */
export const createSSEEventParser = (options?: SSEParserOptions): SSEEventParser => {
  return new SSEEventParser(options);
};

/**
 * 预定义配置
 */
export const StandardSSEParserConfig: SSEParserOptions = {
  allowCustomEvents: true,
  maxEventSize: 1024 * 1024,
  strictMode: false
};

export const StrictSSEParserConfig: SSEParserOptions = {
  allowCustomEvents: false,
  maxEventSize: 512 * 1024,
  strictMode: true
};