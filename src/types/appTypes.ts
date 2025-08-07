/**
 * 应用类型定义
 */

// 内容类型枚举
export type ContentType = 'image' | 'text' | 'file' | 'data' | 'video' | 'audio' | 'search_results' | 'analysis' | 'knowledge';

// 应用ID类型
export type AppId = 'dream' | 'hunt' | 'omni' | 'digitalhub' | 'data_scientist' | 'doc' | 'knowledge';

// 内容元数据接口
export interface ContentMetadata {
  generatedAt?: string;
  prompt?: string;
  aiResponse?: string;
  messageId?: string;
  wordCount?: number;
  total_tokens?: number;
  searchType?: string;
  responseType?: string;
  analysisType?: string;
  processingType?: string;
  [key: string]: unknown; // 允许扩展属性
}

export interface AppArtifact {
  id: string;
  appId: AppId;
  appName: string;
  appIcon: string;
  title: string;
  userInput: string;
  createdAt: string;
  isOpen: boolean;
  generatedContent?: {
    type: ContentType;
    content: string;
    thumbnail?: string;
    metadata?: ContentMetadata;
  };
}

export interface AvailableApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggers: string[];
  category: string;
}

// AI消息接口
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sender?: string;
    app?: string;
    media_items?: Array<{
      type: string;
      url: string;
      title?: string;
    }>;
    [key: string]: unknown;
  };
}

// 待处理工件接口
export interface PendingArtifact {
  imageUrl?: string;
  textContent?: string;
  userInput: string;
  timestamp: number;
  aiResponse?: string;
  messageId?: string;
}

export interface AppTriggerParams {
  message: string;
  setCurrentApp: (app: AppId | null) => void;
  setShowRightSidebar: (show: boolean) => void;
  setTriggeredAppInput: (input: string) => void;
}

export interface MessageHandlerParams {
  message: AIMessage;
  currentApp: AppId | null;
  showRightSidebar: boolean;
  triggeredAppInput: string;
  artifacts: AppArtifact[];
  setPendingArtifact: (artifact: PendingArtifact | null) => void;
}

export interface MessageRendererParams {
  message: AIMessage;
  artifacts: AppArtifact[];
  reopenApp: (artifactId: string) => void;
}