/**
 * ============================================================================
 * Widget Hook (useWidget.ts) - 小部件状态监听和管理钩子
 * ============================================================================
 * 
 * 【核心职责】
 * - 监听和获取小部件相关的状态数据
 * - 提供小部件状态的响应式接口
 * - 连接业务逻辑模块和状态管理器
 * - 不包含业务逻辑，仅负责状态监听
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 从stores获取小部件状态数据
 *   - 提供响应式的状态接口
 *   - 状态变化的监听和通知
 *   - 小部件配置的获取和管理
 * 
 * ❌ 不负责：
 *   - 小部件的业务逻辑（由WidgetModules处理）
 *   - UI组件的渲染（由Widget UI组件处理）
 *   - 数据持久化逻辑（由WidgetModules处理）
 *   - 网络请求和API调用（由WidgetModules处理）
 * 
 * 【数据流向】
 * WidgetModule → stores → useWidget → UI组件
 */

import { AppId } from '../types/appTypes';
import { WidgetConfig, WidgetState } from '../types/widgetTypes';
import { 
  useDreamState, 
  useHuntState, 
  useOmniState, 
  useAssistantState,
  useDataScientistState 
} from '../stores/useWidgetStores';
import { useCurrentApp, useShowRightSidebar, useTriggeredAppInput } from '../stores/useAppStore';

/**
 * Hook to access current widget state
 * Pure state listener - no business logic
 */
export const useWidget = () => {
  // Get main app state
  const currentApp = useCurrentApp();
  const showRightSidebar = useShowRightSidebar();
  const triggeredAppInput = useTriggeredAppInput();
  
  // Get widget-specific states
  const dreamState = useDreamState();
  const huntState = useHuntState();
  const omniState = useOmniState();
  const assistantState = useAssistantState();
  const dataScientistState = useDataScientistState();
  
  // Widget configurations
  const getWidgetConfig = (appId: AppId): WidgetConfig | null => {
    const configs: Record<AppId, WidgetConfig> = {
      dream: {
        id: 'dream',
        title: 'DreamForge AI',
        icon: '🎨',
        description: 'AI-powered image generation',
        component: null as any // Will be set by the actual component
      },
      hunt: {
        id: 'hunt',
        title: 'HuntAI',
        icon: '🔍',
        description: 'Product search and comparison',
        component: null as any
      },
      assistant: {
        id: 'assistant',
        title: 'AI Assistant',
        icon: '🤖',
        description: 'General AI assistance',
        component: null as any
      },
      omni: {
        id: 'omni',
        title: 'Omni Content Generator',
        icon: '⚡',
        description: 'Multi-purpose content creation',
        component: null as any
      },
      'data-scientist': {
        id: 'data-scientist',
        title: 'DataWise Analytics',
        icon: '📊',
        description: 'Data analysis and insights',
        component: null as any
      },
      knowledge: {
        id: 'knowledge',
        title: 'Knowledge Hub',
        icon: '🧠',
        description: 'Advanced document analysis with vector and graph RAG',
        component: null as any
      },
      digitalhub: {
        id: 'digitalhub',
        title: 'Digital Hub',
        icon: '💻',
        description: 'Digital tools and utilities',
        component: null as any
      },
      doc: {
        id: 'doc',
        title: 'Document Processor',
        icon: '📄',
        description: 'Document processing and analysis',
        component: null as any
      }
    };
    
    return configs[appId] || null;
  };
  
  // Get current widget state
  const getCurrentWidgetState = (): WidgetState => {
    if (!currentApp) return 'idle';
    
    switch (currentApp) {
      case 'dream':
        return dreamState.isGenerating ? 'generating' : 'idle';
      case 'hunt':
        return huntState.isSearching ? 'processing' : 'idle';
      case 'omni':
        return omniState.isGenerating ? 'generating' : 'idle';
      case 'assistant':
        return assistantState.isProcessing ? 'processing' : 'idle';
      case 'data-scientist':
        return dataScientistState.isAnalyzing ? 'processing' : 'idle';
      default:
        return 'idle';
    }
  };
  
  // Get current widget data
  const getCurrentWidgetData = () => {
    if (!currentApp) return null;
    
    switch (currentApp) {
      case 'dream':
        return {
          generatedImage: dreamState.generatedImage,
          params: dreamState.lastParams
        };
      case 'hunt':
        return {
          searchResults: huntState.searchResults,
          lastQuery: huntState.lastQuery
        };
      case 'omni':
        return {
          generatedContent: omniState.generatedContent,
          params: omniState.lastParams
        };
      case 'assistant':
        return {
          context: assistantState.conversationContext
        };
      case 'data-scientist':
        return {
          analysisResult: dataScientistState.analysisResult,
          params: dataScientistState.lastParams
        };
      default:
        return null;
    }
  };
  
  return {
    // Current widget info
    currentApp,
    showRightSidebar,
    triggeredAppInput,
    
    // Widget configuration
    currentWidgetConfig: currentApp ? getWidgetConfig(currentApp) : null,
    getWidgetConfig,
    
    // Widget state
    currentWidgetState: getCurrentWidgetState(),
    currentWidgetData: getCurrentWidgetData(),
    
    // Widget-specific states
    dreamState,
    huntState,
    omniState,
    assistantState,
    dataScientistState,
    
    // Computed values
    hasActiveWidget: !!(currentApp && showRightSidebar),
    isWidgetProcessing: getCurrentWidgetState() !== 'idle'
  };
};

/**
 * Hook to access widget actions
 * These are bound to business logic in WidgetModules
 */
export const useWidgetActions = () => {
  // Import actions from app store
  const appActions = require('../stores/useAppStore').useAppActions();
  
  // Import widget-specific actions
  const dreamActions = require('../stores/useWidgetStores').useDreamActions();
  const huntActions = require('../stores/useWidgetStores').useHuntActions();
  const omniActions = require('../stores/useWidgetStores').useOmniActions();
  const assistantActions = require('../stores/useWidgetStores').useAssistantActions();
  const dataScientistActions = require('../stores/useWidgetStores').useDataScientistActions();
  
  return {
    // App-level widget actions
    openWidget: appActions.setCurrentApp,
    closeWidget: appActions.closeApp,
    setTriggeredInput: appActions.setTriggeredAppInput,
    
    // Widget-specific actions
    dream: dreamActions,
    hunt: huntActions,
    omni: omniActions,
    assistant: assistantActions,
    dataScientist: dataScientistActions
  };
};