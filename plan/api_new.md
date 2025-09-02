# 新API架构重构计划 - 协议无关的传输和解析层

## 🎯 目标

基于当前使用模式，设计**协议无关的传输和解析架构**，支持SSE、HTTP、WebSocket、gRPC等多种协议，保持**100%向后兼容**的同时为未来扩展奠定基础。

## 📁 文件架构 (8个核心文件)

```
src/api/
├── transport/                      # 传输层抽象
│   ├── Transport.ts               # 传输协议接口定义
│   ├── HttpTransport.ts           # HTTP/Fetch实现
│   ├── SSETransport.ts            # SSE流传输实现
│   └── WebSocketTransport.ts      # WebSocket传输实现
│
├── parsing/                       # 解析层抽象  
│   ├── Parser.ts                  # 解析器接口定义
│   ├── SSEEventParser.ts          # SSE格式解析器
│   ├── JSONParser.ts              # JSON格式解析器
│   └── AGUIEventParser.ts         # AGUI标准化解析器
│
├── processing/
│   ├── MessageProcessor.ts        # 消息处理管道
│   └── EventHandler.ts           # 事件处理器接口
│
├── ChatService.ts                 # 重构后的服务编排层
└── legacy/
    ├── LegacySSEParser.ts         # 当前SSEParser (保持兼容)
    └── CallbackAdapter.ts         # 回调系统适配器
```

## 🔄 实施阶段

### 阶段1: 基础接口定义 (不影响现有代码)

**目标**: 定义核心接口，不修改任何现有文件
**文件**: Transport.ts, Parser.ts, MessageProcessor.ts, EventHandler.ts

### 阶段2: 传输层实现 (并行开发)

**目标**: 实现具体的传输协议
**文件**: SSETransport.ts, HttpTransport.ts, WebSocketTransport.ts

### 阶段3: 解析层实现 (基于现有SSEParser)

**目标**: 重构现有解析逻辑为新架构
**文件**: SSEEventParser.ts, JSONParser.ts, AGUIEventParser.ts

### 阶段4: 兼容层开发 (关键!)

**目标**: 确保现有代码零修改可用
**文件**: CallbackAdapter.ts, 重构ChatService.ts

### 阶段5: 渐进式迁移

**目标**: 逐步切换到新架构，保持功能一致性

## 🧩 核心接口设计

### Transport接口 - 协议抽象
```typescript
export interface Transport {
  readonly name: string;
  connect(config: TransportConfig): Promise<Connection>;
}

export interface Connection {
  send<TRequest>(data: TRequest): Promise<void>;
  onData<TResponse>(callback: (data: TResponse) => void): Subscription;
  onError(callback: (error: Error) => void): Subscription;
  close(): Promise<void>;
  readonly isConnected: boolean;
}

export interface TransportConfig {
  endpoint: string;
  auth?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}
```

### Parser接口 - 格式抽象
```typescript
export interface Parser<TInput, TOutput> {
  readonly name: string;
  canParse(data: TInput): boolean;
  parse(data: TInput): TOutput | null;
  validate?(data: TOutput): boolean;
}

export interface EventHandler<T> {
  readonly name: string;
  canHandle(event: T): boolean;
  handle(event: T): Promise<void> | void;
}
```

### MessageProcessor - 管道处理
```typescript
export class MessageProcessor<T> {
  private parsers: Parser<any, any>[] = [];
  private handlers: EventHandler<T>[] = [];
  private middlewares: Middleware<T>[] = [];

  // 链式API - 类似Python装饰器模式
  withParser<U>(parser: Parser<T, U>): MessageProcessor<U>;
  withHandler(handler: EventHandler<T>): MessageProcessor<T>;
  withMiddleware(middleware: Middleware<T>): MessageProcessor<T>;

  async process(rawData: any): Promise<ProcessingResult<T>>;
}
```

## 🔌 具体实现设计

### SSETransport实现
```typescript
export class SSETransport implements Transport {
  readonly name = 'sse';

  async connect(config: TransportConfig): Promise<Connection> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${config.auth}`,
        ...config.headers
      },
      body: JSON.stringify(config.body)
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    return new SSEConnection(response.body!);
  }
}

class SSEConnection implements Connection {
  private subscriptions: Subscription[] = [];
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();

  constructor(private stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
    this.startReading();
  }

  onData<T>(callback: (data: T) => void): Subscription {
    // SSE数据监听实现
  }

  private async startReading(): Promise<void> {
    // 读取SSE流的实现
  }
}
```

### SSEEventParser实现 (基于现有SSEParser)
```typescript
export class SSEEventParser implements Parser<string, SSEEvent> {
  readonly name = 'sse_event';

  canParse(data: string): boolean {
    return data.trim().startsWith('data: ') && 
           !data.includes('[DONE]');
  }

  parse(data: string): SSEEvent | null {
    try {
      const eventData = data.slice(6).trim(); // Remove 'data: '
      const parsed = JSON.parse(eventData);
      
      return {
        type: parsed.type || 'unknown',
        content: parsed.content,
        metadata: parsed.metadata || {},
        timestamp: new Date().toISOString(),
        raw: parsed
      };
    } catch (error) {
      return null;
    }
  }
}
```

## 📦 向后兼容策略

### 1. ChatService接口保持不变
```typescript
// 现有接口完全保持
export class ChatService {
  // 保持现有构造函数
  constructor(apiService?: BaseApiService) { }

  // 保持现有方法签名
  async sendMessage(
    message: string,
    metadata: ChatMetadata = {},
    token: string,
    callbacks: SSEParserCallbacks
  ): Promise<void> {
    // 内部使用新架构实现
    return this.newArchitectureImpl(message, metadata, token, callbacks);
  }

  async sendMultimodalMessage(
    content: string,
    files: File[] = [],
    metadata: ChatMetadata = {},
    token: string,
    callbacks: SSEParserCallbacks
  ): Promise<void> {
    // 内部使用新架构实现
  }

  // 新架构实现 (私有方法)
  private async newArchitectureImpl(...): Promise<void> {
    const transport = new SSETransport();
    const processor = new MessageProcessor()
      .withParser(new SSEEventParser())
      .withParser(new AGUIEventParser())
      .withHandler(new CallbackAdapter(callbacks));
      
    // ... 处理逻辑
  }
}
```

### 2. 回调系统适配器
```typescript
export class CallbackAdapter implements EventHandler<AGUIEvent> {
  constructor(private legacyCallbacks: SSEParserCallbacks) {}

  canHandle(event: AGUIEvent): boolean {
    return true; // 处理所有事件类型
  }

  handle(event: AGUIEvent): void {
    // 自动转换新事件格式到旧回调接口
    switch (event.type) {
      case 'text_message_content':
        this.legacyCallbacks.onStreamContent?.(event.delta);
        break;
      case 'text_message_start':
        this.legacyCallbacks.onStreamStart?.(event.message_id);
        break;
      case 'hil_interrupt_detected':
        this.legacyCallbacks.onHILInterruptDetected?.(event.interrupt);
        break;
      // ... 其他事件类型转换
    }
  }
}
```

### 3. 现有SSEParser保持可用
```typescript
// 重命名现有文件为 legacy/LegacySSEParser.ts
export { SSEParser as LegacySSEParser } from './legacy/LegacySSEParser';

// 保持导出兼容
export const SSEParser = {
  // 保持现有静态方法
  parseSSEEvent: LegacySSEParser.parseSSEEvent,
  parseForChatService: LegacySSEParser.parseForChatService,
  registerGlobalHILCallbacks: LegacySSEParser.registerGlobalHILCallbacks,
  
  // 新增：使用新架构的方法
  createProcessor(): MessageProcessor<AGUIEvent> {
    return new MessageProcessor()
      .withParser(new SSEEventParser())
      .withParser(new AGUIEventParser());
  }
};
```

## 🚀 实施步骤

### Step 1: 基础接口 (1-2天) ✅ **已完成**
- [x] 创建 `Transport.ts` 接口定义
- [x] 创建 `Parser.ts` 接口定义  
- [x] 创建 `MessageProcessor.ts` 基础实现
- [x] 创建 `EventHandler.ts` 接口定义
- [x] **验证**: 所有现有代码正常编译

### Step 2: 传输层实现 (2-3天) ✅ **已完成**
- [x] 实现 `SSETransport.ts` (基于现有fetch逻辑)
- [x] 实现 `HttpTransport.ts` (REST API支持)
- [x] 实现 `WebSocketTransport.ts` (未来支持)
- [x] **验证**: 单元测试通过

### Step 3: 解析层实现 (2-3天)  
- [ ] 实现 `SSEEventParser.ts` (基于现有SSEParser逻辑)
- [ ] 实现 `JSONParser.ts` (通用JSON解析)
- [ ] 实现 `AGUIEventParser.ts` (基于现有AGUIEventProcessor)
- [ ] **验证**: 与现有解析结果一致

### Step 4: 兼容层开发 (3-4天) **最关键**
- [ ] 实现 `CallbackAdapter.ts` (新→旧回调转换)
- [ ] 重构 `ChatService.ts` (内部使用新架构)
- [ ] 移动现有SSEParser到legacy目录
- [ ] **验证**: 所有现有功能正常工作

### Step 5: 集成测试 (2-3天)
- [ ] ChatModule集成测试
- [ ] useChatStore集成测试  
- [ ] HIL系统集成测试
- [ ] 多模态消息测试
- [ ] **验证**: 端到端功能完整

### Step 6: 渐进式启用 (1-2天)
- [ ] 添加功能开关控制新/旧架构
- [ ] 监控和性能对比
- [ ] 文档更新
- [ ] **验证**: 生产环境稳定

## 🧪 测试策略

### 兼容性测试
```typescript
// 确保现有调用模式继续工作
describe('Backward Compatibility', () => {
  it('should support existing ChatModule usage', async () => {
    const chatActions = useChatActions();
    await chatActions.sendMessage(content, metadata, token);
    // 验证结果与之前一致
  });

  it('should support existing callback system', () => {
    const callbacks: SSEParserCallbacks = {
      onStreamStart: jest.fn(),
      onStreamContent: jest.fn(),
      onHILInterruptDetected: jest.fn(),
    };
    // 验证回调正常触发
  });
});
```

### 新功能测试
```typescript
describe('New Architecture Features', () => {
  it('should support WebSocket transport', async () => {
    const chatService = new ChatService('websocket');
    // 验证WebSocket功能
  });

  it('should support custom parsers', () => {
    const processor = new MessageProcessor()
      .withParser(new CustomParser());
    // 验证自定义解析器
  });
});
```

## 🎛️ 配置和控制

### 功能开关
```typescript
// config.ts
export const FEATURE_FLAGS = {
  NEW_API_ARCHITECTURE: process.env.NODE_ENV === 'development' ? true : false,
  WEBSOCKET_SUPPORT: false,
  GRPC_SUPPORT: false
};

// ChatService.ts
constructor(options: ChatServiceOptions = {}) {
  if (FEATURE_FLAGS.NEW_API_ARCHITECTURE) {
    this.useNewArchitecture(options);
  } else {
    this.useLegacyArchitecture(options);
  }
}
```

### 监控和指标
```typescript
export class PerformanceMonitor {
  static trackTransportLatency(transport: string, duration: number): void;
  static trackParsingTime(parser: string, duration: number): void;
  static trackErrorRate(component: string, errorRate: number): void;
}
```

## 📈 预期收益

### 技术收益
- **可扩展性**: 轻松添加新协议 (WebSocket, gRPC)
- **可测试性**: 每层独立可测试
- **可维护性**: 职责清晰，代码解耦
- **性能**: 管道式处理，支持并行

### 业务收益  
- **零停机**: 渐进式升级，风险可控
- **未来就绪**: 支持实时通信、高性能场景
- **开发效率**: 新功能开发更简单

## ⚠️ 风险和缓解

### 主要风险
1. **兼容性破坏**: 现有功能停止工作
2. **性能回退**: 新架构性能不如旧版
3. **复杂度增加**: 过度设计导致维护困难

### 缓解措施
1. **全面测试**: 每步都有完整的回归测试
2. **功能开关**: 可以快速回退到旧架构
3. **增量实施**: 分步骤实施，每步验证
4. **监控告警**: 实时监控关键指标

## 📋 成功标准

### 必须达成
- [ ] 所有现有功能正常工作 (100%兼容)
- [ ] 性能不低于现有架构 (响应时间<+10%)
- [ ] 所有现有测试通过 (0个回归缺陷)
- [ ] 代码覆盖率保持 >90%

### 期望达成  
- [ ] 支持至少2种新传输协议 (WebSocket + HTTP)
- [ ] 新增功能开发时间减少30%
- [ ] 代码可读性和维护性显著提升
- [ ] 为未来AI功能扩展奠定基础

---

**实施负责人**: Development Team  
**预计工期**: 2-3周  
**上线时间**: 待定 (基于测试结果)  
**回退计划**: 保持现有代码，通过功能开关切换