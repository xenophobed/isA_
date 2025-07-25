/**
 * ============================================================================
 * 小部件类型定义 (widgetTypes.ts) - 小部件相关的类型定义
 * ============================================================================
 * 
 * 【核心职责】
 * - 定义小部件的数据结构和配置
 * - 定义小部件状态和操作接口
 * - 小部件配置和元数据类型
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Widget 小部件基础接口
 *   - 小部件配置和元数据
 *   - 小部件状态枚举
 *   - 特定小部件的参数类型
 * 
 * ❌ 不负责：
 *   - 聊天消息类型（由chatTypes.ts处理）
 *   - 应用工件类型（由appTypes.ts处理）
 *   - 用户认证类型（由authTypes.ts处理）
 */

import { AppId } from './appTypes';

// 小部件配置接口
export interface WidgetConfig {
  id: AppId;
  title: string;
  icon: string;
  description: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

// 小部件状态枚举
export type WidgetState = 
  | 'idle'
  | 'loading'
  | 'generating'
  | 'processing'
  | 'completed'
  | 'error';

// Dream小部件特定类型
export interface DreamWidgetParams {
  prompt?: string;
  style?: string;
  size?: string;
  quality?: string;
  mode?: string;
}

export interface DreamWidgetResult {
  imageUrl: string;
  prompt: string;
  metadata?: {
    style?: string;
    size?: string;
    generatedAt: string;
  };
}

// Hunt小部件特定类型
export interface HuntWidgetParams {
  query?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface HuntWidgetResult {
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    url: string;
    rating?: number;
  }>;
  totalResults: number;
  searchQuery: string;
}

// Omni小部件特定类型
export interface OmniWidgetParams {
  prompt?: string;
  contentType?: 'text' | 'code' | 'markdown' | 'email' | 'social' | 'research';
  tone?: 'professional' | 'casual' | 'creative' | 'technical' | 'academic';
  length?: 'short' | 'medium' | 'long';
}

export interface OmniWidgetResult {
  content: string;
  contentType: string;
  metadata?: {
    wordCount: number;
    tone: string;
    generatedAt: string;
  };
}

// Assistant小部件特定类型
export interface AssistantWidgetParams {
  context?: string;
  task?: string;
  specialInstructions?: string;
}

export interface AssistantWidgetResult {
  response: string;
  suggestions?: string[];
  followUpQuestions?: string[];
  confidence?: number;
  context?: any;
}

// DataScientist小部件特定类型
export interface DataScientistWidgetParams {
  data?: File | string;
  analysisType?: 'descriptive' | 'predictive' | 'prescriptive' | 'exploratory';
  visualizationType?: 'chart' | 'graph' | 'table' | 'dashboard';
  query?: string;
}

export interface DataScientistWidgetResult {
  analysis: {
    summary: string;
    insights: string[];
    recommendations: string[];
  };
  visualizations: Array<{
    type: string;
    title: string;
    data: any;
    chartConfig?: any;
  }>;
  statistics: {
    dataPoints: number;
    columns: string[];
    correlations?: any;
  };
}

// Knowledge小部件特定类型
export interface KnowledgeWidgetParams {
  query?: string;
  topic?: string;
  task?: string;
  sources?: string[];
  searchDepth?: 'shallow' | 'deep' | 'comprehensive';
  files?: File[];
}

export interface KnowledgeWidgetResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  relatedQuestions: string[];
  confidence: number;
}

// 通用小部件接口
export interface Widget<TParams = any, TResult = any> {
  id: string;
  config: WidgetConfig;
  state: WidgetState;
  params?: TParams;
  result?: TResult;
  error?: string;
  triggeredInput?: string;
}

// 小部件管理器属性
export interface WidgetManagerProps {
  currentApp: AppId | null;
  showRightSidebar: boolean;
  triggeredAppInput: string;
  onCloseApp: () => void;
  onAppSelect?: (appId: string) => void;
}