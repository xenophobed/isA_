/**
 * ============================================================================
 * 聊天类型定义 (chat_types.ts) - 聊天相关的类型定义
 * ============================================================================
 * 
 * 【核心职责】
 * - 定义聊天消息的数据结构
 * - 定义流式消息的状态类型
 * - 定义聊天会话的相关接口
 * - 聊天功能相关的类型集合
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - ChatMessage 聊天消息接口
 *   - 流式消息状态类型
 *   - 聊天相关的枚举和常量
 *   - 聊天会话数据结构
 * 
 * ❌ 不负责：
 *   - 应用工件类型（由app_types.ts处理）
 *   - 小部件状态类型（由widget_types.ts处理）
 *   - 用户认证类型（由auth_types.ts处理）
 */

// 基础消息接口
export interface BaseMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sessionId: string;
  // Streaming properties that all messages can have
  isStreaming?: boolean;
  streamingStatus?: string;
}

// 常规聊天消息接口 (包含流式消息功能)
export interface RegularMessage extends BaseMessage {
  type: 'regular';
  content: string;
  metadata?: {
    sender?: string;
    app?: string;
    session_id?: string;
    user_id?: string;
    media_items?: Array<{
      type: string;
      url: string;
      title?: string;
    }>;
    [key: string]: unknown;
  };
  // Store相关字段
  processed?: boolean; // 标记用户消息是否已发送到API
  files?: File[]; // 用户上传的文件
}

// 工件消息接口 - 用于显示小部件生成的工件
export interface ArtifactMessage extends BaseMessage {
  type: 'artifact';
  userPrompt: string; // 触发此工件生成的原始用户输入
  artifact: {
    id: string;
    widgetType: string; // 'dream', 'hunt', 'omni', etc.
    widgetName?: string; // 显示名称
    version: number;
    contentType: 'image' | 'text' | 'data' | 'analysis' | 'knowledge';
    content: any; // 工件的实际内容 - can be 'Loading...' during streaming
    metadata?: {
      originalInput?: string;
      parameters?: Record<string, any>;
      processingTime?: number;
      [key: string]: any;
    };
  };
  // Note: isStreaming and streamingStatus are inherited from BaseMessage
  // This allows artifact messages to show streaming status during generation
}

// 联合类型 - 所有消息类型
export type ChatMessage = RegularMessage | ArtifactMessage;

// 聊天会话接口
export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  artifacts: string[];
  messages: ChatMessage[];
  metadata?: {
    apps_used?: string[];
    total_messages?: number;
    last_activity?: string;
    [key: string]: unknown;
  };
}

// 流式消息状态枚举
export type StreamingStatus = 
  | 'connecting'
  | 'processing'
  | 'generating'
  | 'finalizing'
  | 'completed'
  | 'error';

// 聊天状态枚举
export type ChatState = 
  | 'idle'
  | 'loading'
  | 'typing'
  | 'streaming'
  | 'error';

// 消息类型枚举
export type MessageType = 'text' | 'multimodal' | 'system' | 'error';

// ChatService相关接口
export interface ChatServiceCallbacks {
  onMessageStart?: (messageId: string, status?: string) => void;
  onMessageContent?: (content: string) => void;
  onMessageStatus?: (status: string) => void; 
  onMessageComplete?: (completeMessage?: string) => void; // Now receives complete message content
  onError?: (error: Error) => void;
  onArtifactCreated?: (artifact: { id?: string; type: string; content: string }) => void;
  onBillingUpdate?: (billingData: { creditsRemaining: number; totalCredits: number; modelCalls: number; toolCalls: number }) => void;
}

export interface ChatMetadata {
  session_id?: string;
  auth0_id?: string;
  template_parameters?: Record<string, any>;
  [key: string]: any;
}

// Chat Hook Interface - for useChat hook return type
export interface ChatHookState {
  // 聊天核心数据
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  
  // 应用导航上下文
  currentApp: string | null;
  showRightSidebar: boolean;
  
  // 工件数据
  artifacts: any[]; // Will be properly typed from appTypes.ts
  latestWidgetArtifact: any | null; // Latest artifact from widget stores
  
  // Widget状态聚合
  widgetStates: any; // Widget states aggregated from useAllWidgetStates
  isAnyWidgetGenerating: boolean; // True if any widget is generating content
  
  // HIL状态聚合
  hilStatus: 'idle' | 'waiting_for_human' | 'processing_response' | 'error';
  currentHILInterrupt: any | null; // HILInterruptDetectedEvent from aguiTypes
  hilHistory: any[]; // HILInterruptDetectedEvent[] from aguiTypes
  hilCheckpoints: any[]; // HILCheckpointCreatedEvent[] from aguiTypes
  currentThreadId: string | null;
  
  // 派生状态
  hasStreamingMessage: boolean;
  streamingMessage: ChatMessage | undefined;
  // HIL派生状态
  isHILActive: boolean;
  hasActiveHILInterrupt: boolean;
  hilInterruptCount: number;
  hilCheckpointCount: number;
}