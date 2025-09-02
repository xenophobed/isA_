/**
 * ============================================================================
 * SSE Transport - Server-Sent Events 传输层实现
 * ============================================================================
 * 
 * 核心功能:
 * - 实现 SSE 连接和数据流处理
 * - 自动重连和错误恢复
 * - 流式数据读取接口
 * - 连接状态管理
 */

import { 
  BaseConnection, 
  ConnectionConfig, 
  ConnectionOptions, 
  ConnectionState, 
  ConnectionFactory 
} from './Connection';

// ================================================================================
// SSE 特定配置
// ================================================================================

export interface SSETransportConfig extends ConnectionConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  withCredentials?: boolean;
}

// ================================================================================
// SSE 连接实现
// ================================================================================

export class SSEConnection extends BaseConnection {
  private eventSource?: EventSource;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private withCredentials: boolean;
  private abortController?: AbortController;
  private streamReader?: ReadableStreamDefaultReader<Uint8Array>;
  private currentResponse?: Response;
  
  constructor(private config: SSETransportConfig) {
    super(config.url, 'sse');
    this.maxReconnectAttempts = config.maxReconnectAttempts || 3;
    this.reconnectInterval = config.reconnectInterval || 1000;
    this.withCredentials = config.withCredentials || false;
  }
  
  async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.isConnected()) {
      return;
    }
    
    this.setState(ConnectionState.CONNECTING);
    
    try {
      // 使用 fetch 而不是 EventSource 以获得更好的控制
      this.abortController = new AbortController();
      
      const requestInit: RequestInit = {
        method: options.method || 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.config.headers,
          ...options.headers
        },
        body: options.body,
        signal: this.abortController.signal,
        credentials: this.withCredentials ? 'include' : 'same-origin'
      };
      
      console.log('🔗 SSE_CONNECTION: Connecting to:', this.url);
      console.log('🔗 SSE_CONNECTION: Request config:', {
        method: requestInit.method,
        headers: requestInit.headers,
        bodyLength: requestInit.body ? String(requestInit.body).length : 0,
        hasSignal: !!requestInit.signal
      });
      
      const response = await fetch(this.url, requestInit);
      
      console.log('🔗 SSE_CONNECTION: Got response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        hasBody: !!response.body
      });
      
      if (!response.ok) {
        throw this.createError(`HTTP ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
      }
      
      if (!response.body) {
        throw this.createError('No response body received', 'NO_BODY');
      }
      
      this.currentResponse = response;
      this.streamReader = response.body.getReader();
      
      this.setState(ConnectionState.CONNECTED);
      this.setMetadata('responseStatus', response.status);
      this.setMetadata('responseHeaders', Object.fromEntries(response.headers.entries()));
      
      this.emit('open', { data: { status: response.status }, timestamp: Date.now() });
      
      console.log('🔗 SSE_CONNECTION: Connected successfully');
      
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      const connectionError = error instanceof Error ? error : new Error(String(error));
      
      console.error('🔗 SSE_CONNECTION: Connection failed:', connectionError);
      this.emit('error', { error: connectionError, timestamp: Date.now() });
      
      throw connectionError;
    }
  }
  
  async close(code?: number, reason?: string): Promise<void> {
    if (this._state === ConnectionState.CLOSED || this._state === ConnectionState.CLOSING) {
      return;
    }
    
    this.setState(ConnectionState.CLOSING);
    
    try {
      // 取消请求
      if (this.abortController) {
        this.abortController.abort();
      }
      
      // 关闭流读取器
      if (this.streamReader) {
        await this.streamReader.cancel();
        this.streamReader = undefined;
      }
      
      // 清理响应
      this.currentResponse = undefined;
      this.abortController = undefined;
      
      this.setState(ConnectionState.CLOSED);
      this.setMetadata('closeCode', code);
      this.setMetadata('closeReason', reason);
      
      this.emit('close', { 
        data: { code, reason }, 
        timestamp: Date.now() 
      });
      
      console.log('🔗 SSE_CONNECTION: Connection closed');
      
    } catch (error) {
      // AbortError 是正常的关闭行为，不应该记录为错误
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔗 SSE_CONNECTION: Connection aborted normally');
      } else {
        console.warn('🔗 SSE_CONNECTION: Error during close:', error);
      }
      this.setState(ConnectionState.CLOSED);
    }
  }
  
  async* stream(): AsyncIterable<string> {
    if (!this.streamReader) {
      throw this.createError('Connection not established', 'NOT_CONNECTED');
    }
    
    this.setState(ConnectionState.STREAMING);
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        // 检查 streamReader 是否仍然存在（避免竞态条件）
        if (!this.streamReader) {
          console.log('🔗 SSE_CONNECTION: Stream reader was closed');
          break;
        }
        
        const { done, value } = await this.streamReader.read();
        
        if (done) {
          console.log('🔗 SSE_CONNECTION: Stream ended');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理 SSE 数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一行（可能不完整）
        
        for (const line of lines) {
          if (line.trim()) {
            this.emit('data', { data: line, timestamp: Date.now() });
            yield line;
          }
        }
      }
      
      // 处理剩余的缓冲区数据
      if (buffer.trim()) {
        this.emit('data', { data: buffer, timestamp: Date.now() });
        yield buffer;
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔗 SSE_CONNECTION: Stream was aborted');
      } else {
        console.error('🔗 SSE_CONNECTION: Stream reading error:', error);
        const streamError = error instanceof Error ? error : new Error(String(error));
        this.emit('error', { error: streamError, timestamp: Date.now() });
        throw streamError;
      }
    } finally {
      if (this._state === ConnectionState.STREAMING) {
        this.setState(ConnectionState.CONNECTED);
      }
    }
  }
}

// ================================================================================
// SSE 传输工厂
// ================================================================================

export class SSETransportFactory implements ConnectionFactory {
  readonly protocol = 'sse';
  
  async createConnection(config: ConnectionConfig): Promise<SSEConnection> {
    const sseConfig: SSETransportConfig = {
      ...config,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      withCredentials: false
    };
    
    return new SSEConnection(sseConfig);
  }
  
  supportsUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

// ================================================================================
// SSE 传输管理器
// ================================================================================

export class SSETransport {
  private config: SSETransportConfig;
  private factory: SSETransportFactory;
  
  constructor(config: SSETransportConfig = { url: '' }) {
    this.config = config;
    this.factory = new SSETransportFactory();
  }
  
  /**
   * 连接到 SSE 端点
   */
  async connect(endpoint: string, options: ConnectionOptions = {}): Promise<SSEConnection> {
    const connectionConfig: SSETransportConfig = {
      ...this.config,
      url: endpoint
    };
    
    const connection = await this.factory.createConnection(connectionConfig);
    await connection.connect(options);
    
    return connection;
  }
  
  /**
   * 更新传输配置
   */
  updateConfig(newConfig: Partial<SSETransportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): Readonly<SSETransportConfig> {
    return { ...this.config };
  }
}

// ================================================================================
// 工厂函数
// ================================================================================

/**
 * 创建 SSE 传输实例
 */
export const createSSETransport = (config: SSETransportConfig = { url: '' }): SSETransport => {
  return new SSETransport(config);
};

/**
 * 创建 SSE 连接工厂
 */
export const createSSETransportFactory = (): SSETransportFactory => {
  return new SSETransportFactory();
};

// ================================================================================
// 预定义配置
// ================================================================================

/**
 * 标准 SSE 传输配置
 */
export const StandardSSEConfig: SSETransportConfig = {
  url: '',
  timeout: 300000, // 5分钟
  reconnectInterval: 1000,
  maxReconnectAttempts: 3,
  withCredentials: false,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 1.5
  }
};

/**
 * 长连接 SSE 配置
 */
export const LongLivedSSEConfig: SSETransportConfig = {
  ...StandardSSEConfig,
  timeout: 600000, // 10分钟
  maxReconnectAttempts: 5,
  reconnectInterval: 2000
};