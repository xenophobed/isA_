/**
 * ============================================================================
 * Connection Interface - 连接抽象接口
 * ============================================================================
 * 
 * 核心职责:
 * - 定义统一的连接接口标准
 * - 支持多种传输协议 (SSE, WebSocket, HTTP)
 * - 提供流式数据读取接口
 * - 连接生命周期管理
 */

// ================================================================================
// 连接状态定义
// ================================================================================

export enum ConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  STREAMING = 'streaming',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error'
}

// ================================================================================
// 连接配置
// ================================================================================

export interface ConnectionConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier?: number;
  };
}

export interface ConnectionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | FormData | ArrayBuffer;
  signal?: AbortSignal;
}

// ================================================================================
// 连接事件
// ================================================================================

export interface ConnectionEvent {
  type: 'open' | 'data' | 'error' | 'close';
  data?: any;
  error?: Error;
  timestamp: number;
}

export type ConnectionEventListener = (event: ConnectionEvent) => void;

// ================================================================================
// 连接接口
// ================================================================================

export interface Connection {
  readonly id: string;
  readonly state: ConnectionState;
  readonly url: string;
  readonly protocol: string;
  
  // 连接管理
  connect(options?: ConnectionOptions): Promise<void>;
  close(code?: number, reason?: string): Promise<void>;
  
  // 数据流接口
  stream(): AsyncIterable<string>;
  
  // 事件监听
  on(event: string, listener: ConnectionEventListener): void;
  off(event: string, listener: ConnectionEventListener): void;
  
  // 状态查询
  isConnected(): boolean;
  isStreaming(): boolean;
  
  // 元数据
  getMetadata(): Record<string, any>;
}

// ================================================================================
// 基础连接实现
// ================================================================================

export abstract class BaseConnection implements Connection {
  public readonly id: string;
  public readonly url: string;
  public readonly protocol: string;
  
  protected _state: ConnectionState = ConnectionState.IDLE;
  protected listeners = new Map<string, ConnectionEventListener[]>();
  protected metadata: Record<string, any> = {};
  
  constructor(url: string, protocol: string) {
    this.id = `conn_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.url = url;
    this.protocol = protocol;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  // 抽象方法 - 子类必须实现
  abstract connect(options?: ConnectionOptions): Promise<void>;
  abstract close(code?: number, reason?: string): Promise<void>;
  abstract stream(): AsyncIterable<string>;
  
  // 事件系统
  on(event: string, listener: ConnectionEventListener): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener);
    this.listeners.set(event, eventListeners);
  }
  
  off(event: string, listener: ConnectionEventListener): void {
    const eventListeners = this.listeners.get(event) || [];
    const index = eventListeners.indexOf(listener);
    if (index >= 0) {
      eventListeners.splice(index, 1);
    }
  }
  
  // 状态查询
  isConnected(): boolean {
    return this._state === ConnectionState.CONNECTED || this._state === ConnectionState.STREAMING;
  }
  
  isStreaming(): boolean {
    return this._state === ConnectionState.STREAMING;
  }
  
  // 元数据管理
  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }
  
  protected setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
  
  // 状态管理
  protected setState(newState: ConnectionState): void {
    const oldState = this._state;
    this._state = newState;
    
    this.emit('stateChange', {
      type: 'stateChange' as any,
      data: { oldState, newState },
      timestamp: Date.now()
    });
  }
  
  // 事件触发
  protected emit(event: string, eventData: Omit<ConnectionEvent, 'type'> & { type?: any }): void {
    const listeners = this.listeners.get(event) || [];
    const connectionEvent: ConnectionEvent = {
      type: eventData.type || event as any,
      data: eventData.data,
      error: eventData.error,
      timestamp: eventData.timestamp || Date.now()
    };
    
    for (const listener of listeners) {
      try {
        listener(connectionEvent);
      } catch (error) {
        console.error(`Connection ${this.id}: Event listener error:`, error);
      }
    }
  }
  
  // 创建标准错误
  protected createError(message: string, code?: string): Error {
    const error = new Error(message);
    (error as any).code = code || 'CONNECTION_ERROR';
    (error as any).connectionId = this.id;
    return error;
  }
}

// ================================================================================
// 连接工厂接口
// ================================================================================

export interface ConnectionFactory {
  readonly protocol: string;
  createConnection(config: ConnectionConfig): Promise<Connection>;
  supportsUrl(url: string): boolean;
}

// ================================================================================
// 连接管理器
// ================================================================================

export class ConnectionManager {
  private factories = new Map<string, ConnectionFactory>();
  private connections = new Map<string, Connection>();
  
  /**
   * 注册连接工厂
   */
  registerFactory(factory: ConnectionFactory): void {
    this.factories.set(factory.protocol, factory);
  }
  
  /**
   * 创建连接
   */
  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const url = new URL(config.url);
    const protocol = url.protocol.slice(0, -1); // 移除冒号
    
    const factory = this.factories.get(protocol) || 
                   Array.from(this.factories.values()).find(f => f.supportsUrl(config.url));
    
    if (!factory) {
      throw new Error(`No factory found for protocol: ${protocol}`);
    }
    
    const connection = await factory.createConnection(config);
    this.connections.set(connection.id, connection);
    
    // 清理关闭的连接
    connection.on('close', () => {
      this.connections.delete(connection.id);
    });
    
    return connection;
  }
  
  /**
   * 获取活跃连接
   */
  getActiveConnections(): Connection[] {
    return Array.from(this.connections.values()).filter(conn => conn.isConnected());
  }
  
  /**
   * 关闭所有连接
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(conn => 
      conn.close().catch(error => 
        console.warn(`Failed to close connection ${conn.id}:`, error)
      )
    );
    
    await Promise.allSettled(closePromises);
    this.connections.clear();
  }
}

// ================================================================================
// 导出单例管理器
// ================================================================================

export const connectionManager = new ConnectionManager();