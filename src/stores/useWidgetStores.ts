/**
 * ============================================================================
 * 小部件状态管理 (useWidgetStores.ts) - 专注于侧边栏小部件的状态管理
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理各个小部件的特定状态（Dream, Hunt, Omni等）
 * - 处理小部件的生成状态和结果数据
 * - 提供小部件相关的操作接口
 * - 分离各小部件的关注点
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 各小部件的状态数据管理
 *   - 小部件生成状态（loading, generating等）
 *   - 小部件结果数据存储
 *   - 小部件参数管理
 *   - 小部件特有的业务状态
 * 
 * ❌ 不负责：
 *   - 聊天消息管理（由useChatStore处理）
 *   - 会话管理（由useSessionStore处理）
 *   - 应用导航（由useAppStore处理）
 *   - 工件管理（由useArtifactStore处理）
 *   - 全局UI状态（由useAppStore处理）
 * 
 * 【小部件说明】
 * - Dream: AI图像生成小部件
 * - Hunt: 产品搜索和比较小部件
 * - Omni: 多功能内容生成小部件
 * - Assistant: AI助手小部件
 * - Knowledge: 知识管理小部件
 * - DataScientist: 数据科学分析小部件
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger, LogCategory } from '../utils/logger';
import { chatService } from '../api/chatService';

// Dream Widget State
interface DreamWidgetState {
  generatedImage: string | null;
  isGenerating: boolean;
  lastParams: any;
}

interface DreamWidgetActions {
  setDreamGeneratedImage: (image: string | null) => void;
  setDreamGenerating: (isGenerating: boolean) => void;
  setDreamParams: (params: any) => void;
  clearDreamData: () => void;
  triggerDreamGeneration: (params: any) => Promise<void>;
}

export type DreamWidgetStore = DreamWidgetState & DreamWidgetActions;

export const useDreamWidgetStore = create<DreamWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    generatedImage: null,
    isGenerating: false,
    lastParams: null,
    
    // Dream操作
    setDreamGeneratedImage: (image) => {
      const oldValue = get().generatedImage;
      set({ generatedImage: image });
      logger.trackStateChange('dreamGeneratedImage', oldValue, image, 'useDreamWidgetStore');
      if (image) {
        logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream image generated in widget store', { imageUrl: image });
      }
    },
    
    setDreamGenerating: (isGenerating) => {
      set({ isGenerating });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream generating state changed', { isGenerating });
    },
    
    setDreamParams: (params) => {
      set({ lastParams: params });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream params updated', { params });
    },
    
    clearDreamData: () => {
      set({ generatedImage: null, isGenerating: false, lastParams: null });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream widget data cleared');
    },
    
    // New method: Trigger dream generation via chatService
    triggerDreamGeneration: async (params) => {
      const { setDreamGenerating, setDreamParams, setDreamGeneratedImage } = get();
      
      // Set generating state and params
      setDreamGenerating(true);
      setDreamParams(params);
      
      try {
        // Build dream-specific prompt
        const dreamPrompt = `Generate an image with the following specifications:
Prompt: ${params.prompt}
Style: ${params.style || 'realistic'}
Size: ${params.size || '1024x1024'}
Quality: ${params.quality || 'standard'}

Please create a high-quality image that matches these requirements and return it as an image artifact.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting dream generation via chatService', { params });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(dreamPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream generation message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream generation content chunk', { contentChunk });
          },
          onMessageComplete: () => {
            logger.info(LogCategory.ARTIFACT_CREATION, 'Dream generation message completed');
          },
          onArtifactCreated: (artifact) => {
            if (artifact.type === 'image' && artifact.content) {
              setDreamGeneratedImage(artifact.content);
              logger.info(LogCategory.ARTIFACT_CREATION, 'Dream image artifact created', { 
                artifactId: artifact.id,
                imageUrl: artifact.content 
              });
            }
          },
          onError: (error) => {
            setDreamGenerating(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'Dream generation failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: 'dream_widget',
          user_id: 'widget_user',
          template_parameters: {
            widget_type: 'dream',
            ...params
          }
        });
        
      } catch (error) {
        setDreamGenerating(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'Dream generation request failed', { error, params });
      }
    }
  }))
);

// Hunt Widget State
interface HuntWidgetState {
  searchResults: any[];
  isSearching: boolean;
  lastQuery: string;
}

interface HuntWidgetActions {
  setHuntSearchResults: (results: any[]) => void;
  setHuntSearching: (isSearching: boolean) => void;
  setHuntLastQuery: (query: string) => void;
  clearHuntData: () => void;
  triggerHuntSearch: (params: any) => Promise<void>;
}

export type HuntWidgetStore = HuntWidgetState & HuntWidgetActions;

export const useHuntWidgetStore = create<HuntWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    searchResults: [],
    isSearching: false,
    lastQuery: '',
    
    // Hunt操作
    setHuntSearchResults: (results) => {
      set({ searchResults: results });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search results updated', { 
        resultCount: results.length 
      });
    },
    
    setHuntSearching: (isSearching) => {
      set({ isSearching });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt searching state changed', { isSearching });
    },
    
    setHuntLastQuery: (query) => {
      set({ lastQuery: query });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt last query updated', { query });
    },
    
    clearHuntData: () => {
      set({ searchResults: [], isSearching: false, lastQuery: '' });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt widget data cleared');
    },
    
    // New method: Trigger hunt search via chatService
    triggerHuntSearch: async (params) => {
      const { setHuntSearching, setHuntLastQuery, setHuntSearchResults } = get();
      
      // Set searching state and query
      setHuntSearching(true);
      setHuntLastQuery(params.query || '');
      
      try {
        // Build hunt-specific prompt
        const huntPrompt = `Search for products matching: "${params.query}"
${params.category ? `Category: ${params.category}` : ''}
${params.priceRange ? `Price Range: ${params.priceRange.min} - ${params.priceRange.max}` : ''}
${params.filters ? `Additional Filters: ${JSON.stringify(params.filters)}` : ''}

Please provide detailed search results with product information, prices, and comparisons as a search_results artifact.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting hunt search via chatService', { params });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(huntPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search content chunk', { contentChunk });
          },
          onMessageComplete: () => {
            setHuntSearching(false);
            logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search message completed');
          },
          onArtifactCreated: (artifact) => {
            if (artifact.type === 'search_results' && artifact.content) {
              try {
                const results = JSON.parse(artifact.content);
                setHuntSearchResults(results);
                logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search results artifact created', { 
                  artifactId: artifact.id,
                  resultCount: results.length 
                });
              } catch (parseError) {
                logger.error(LogCategory.ARTIFACT_CREATION, 'Failed to parse hunt search results', { parseError });
              }
            }
          },
          onError: (error) => {
            setHuntSearching(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'Hunt search failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: 'hunt_widget',
          user_id: 'widget_user',
          template_parameters: {
            widget_type: 'hunt',
            ...params
          }
        });
        
      } catch (error) {
        setHuntSearching(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'Hunt search request failed', { error, params });
      }
    }
  }))
);

// Omni Widget State
interface OmniWidgetState {
  generatedContent: string | null;
  isGenerating: boolean;
  lastParams: any;
}

interface OmniWidgetActions {
  setOmniGeneratedContent: (content: string | null) => void;
  setOmniGenerating: (isGenerating: boolean) => void;
  setOmniParams: (params: any) => void;
  clearOmniData: () => void;
  triggerOmniGeneration: (params: any) => Promise<void>;
}

export type OmniWidgetStore = OmniWidgetState & OmniWidgetActions;

export const useOmniWidgetStore = create<OmniWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    generatedContent: null,
    isGenerating: false,
    lastParams: null,
    
    // Omni操作
    setOmniGeneratedContent: (content) => {
      set({ generatedContent: content });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni content generated in widget store', { 
        contentLength: content?.length 
      });
    },
    
    setOmniGenerating: (isGenerating) => {
      set({ isGenerating });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni generating state changed', { isGenerating });
    },
    
    setOmniParams: (params) => {
      set({ lastParams: params });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni params updated', { params });
    },
    
    clearOmniData: () => {
      set({ generatedContent: null, isGenerating: false, lastParams: null });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni widget data cleared');
    },
    
    // New method: Trigger omni content generation via chatService
    triggerOmniGeneration: async (params) => {
      const { setOmniGenerating, setOmniParams, setOmniGeneratedContent } = get();
      
      // Set generating state and params
      setOmniGenerating(true);
      setOmniParams(params);
      
      try {
        // Build omni-specific prompt
        const omniPrompt = `Generate ${params.contentType || 'text'} content for: ${params.prompt}
${params.tone ? `Tone: ${params.tone}` : ''}
${params.length ? `Length: ${params.length}` : ''}
${params.style ? `Style: ${params.style}` : ''}

Please create comprehensive content that meets these specifications and return it as a text artifact.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting omni generation via chatService', { params });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(omniPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni generation message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni generation content chunk', { contentChunk });
          },
          onMessageComplete: () => {
            setOmniGenerating(false);
            logger.info(LogCategory.ARTIFACT_CREATION, 'Omni generation message completed');
          },
          onArtifactCreated: (artifact) => {
            if (artifact.content) {
              setOmniGeneratedContent(artifact.content);
              logger.info(LogCategory.ARTIFACT_CREATION, 'Omni content artifact created', { 
                artifactId: artifact.id,
                contentLength: artifact.content.length 
              });
            }
          },
          onError: (error) => {
            setOmniGenerating(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'Omni generation failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: 'omni_widget',
          user_id: 'widget_user',
          template_parameters: {
            widget_type: 'omni',
            ...params
          }
        });
        
      } catch (error) {
        setOmniGenerating(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'Omni generation request failed', { error, params });
      }
    }
  }))
);

// Assistant Widget State (如果需要特定状态)
interface AssistantWidgetState {
  conversationContext: any;
  isProcessing: boolean;
}

interface AssistantWidgetActions {
  setAssistantContext: (context: any) => void;
  setAssistantProcessing: (isProcessing: boolean) => void;
  clearAssistantData: () => void;
  triggerAssistantRequest: (params: any) => Promise<void>;
}

export type AssistantWidgetStore = AssistantWidgetState & AssistantWidgetActions;

export const useAssistantWidgetStore = create<AssistantWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    conversationContext: null,
    isProcessing: false,
    
    // Assistant操作
    setAssistantContext: (context) => {
      set({ conversationContext: context });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant context updated');
    },
    
    setAssistantProcessing: (isProcessing) => {
      set({ isProcessing });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant processing state changed', { isProcessing });
    },
    
    clearAssistantData: () => {
      set({ conversationContext: null, isProcessing: false });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant widget data cleared');
    },
    
    // New method: Trigger assistant request via chatService
    triggerAssistantRequest: async (params) => {
      const { setAssistantProcessing, setAssistantContext } = get();
      
      // Set processing state and context
      setAssistantProcessing(true);
      setAssistantContext(params);
      
      try {
        // Build assistant-specific prompt
        const assistantPrompt = `Assistant request: ${params.query || params.prompt}
${params.context ? `Context: ${params.context}` : ''}
${params.task ? `Task: ${params.task}` : ''}

Please provide helpful assistance based on this request.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting assistant request via chatService', { params });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(assistantPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant request message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant request content chunk', { contentChunk });
          },
          onMessageComplete: () => {
            setAssistantProcessing(false);
            logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant request message completed');
          },
          onArtifactCreated: (artifact) => {
            if (artifact.content) {
              // Update context with the assistant response
              setAssistantContext({
                ...params,
                response: artifact.content,
                timestamp: new Date().toISOString()
              });
              logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant response artifact created', { 
                artifactId: artifact.id,
                contentLength: artifact.content.length 
              });
            }
          },
          onError: (error) => {
            setAssistantProcessing(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'Assistant request failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: 'assistant_widget',
          user_id: 'widget_user',
          template_parameters: {
            widget_type: 'assistant',
            ...params
          }
        });
        
      } catch (error) {
        setAssistantProcessing(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'Assistant request failed', { error, params });
      }
    }
  }))
);

// DataScientist Widget State
interface DataScientistWidgetState {
  analysisResult: any | null;
  isAnalyzing: boolean;
  lastParams: any;
}

interface DataScientistWidgetActions {
  setDataScientistAnalysisResult: (result: any | null) => void;
  setDataScientistAnalyzing: (isAnalyzing: boolean) => void;
  setDataScientistParams: (params: any) => void;
  clearDataScientistData: () => void;
  triggerDataScientistAnalysis: (params: any) => Promise<void>;
}

export type DataScientistWidgetStore = DataScientistWidgetState & DataScientistWidgetActions;

export const useDataScientistWidgetStore = create<DataScientistWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    analysisResult: null,
    isAnalyzing: false,
    lastParams: null,
    
    // DataScientist操作
    setDataScientistAnalysisResult: (result) => {
      set({ analysisResult: result });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis result updated in widget store', { 
        hasResult: !!result 
      });
    },
    
    setDataScientistAnalyzing: (isAnalyzing) => {
      set({ isAnalyzing });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analyzing state changed', { isAnalyzing });
    },
    
    setDataScientistParams: (params) => {
      set({ lastParams: params });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist params updated', { params });
    },
    
    clearDataScientistData: () => {
      set({ analysisResult: null, isAnalyzing: false, lastParams: null });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist widget data cleared');
    },
    
    // New method: Trigger data scientist analysis via chatService
    triggerDataScientistAnalysis: async (params) => {
      const { setDataScientistAnalyzing, setDataScientistParams, setDataScientistAnalysisResult } = get();
      
      // Set analyzing state and params
      setDataScientistAnalyzing(true);
      setDataScientistParams(params);
      
      try {
        // Build data scientist-specific prompt
        const dataScientistPrompt = `Perform data analysis with the following specifications:
Query: ${params.query || 'General data analysis'}
${params.analysisType ? `Analysis Type: ${params.analysisType}` : ''}
${params.visualizationType ? `Visualization Type: ${params.visualizationType}` : ''}
${params.data ? `Data: ${typeof params.data === 'string' ? params.data : 'File provided'}` : ''}

Please provide comprehensive data analysis including insights, recommendations, and visualizations as a data_analysis artifact.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting data scientist analysis via chatService', { params });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(dataScientistPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis content chunk', { contentChunk });
          },
          onMessageComplete: () => {
            setDataScientistAnalyzing(false);
            logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis message completed');
          },
          onArtifactCreated: (artifact) => {
            if (artifact.content) {
              try {
                const analysisResult = JSON.parse(artifact.content);
                setDataScientistAnalysisResult(analysisResult);
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis artifact created', { 
                  artifactId: artifact.id,
                  hasInsights: !!analysisResult.analysis?.insights?.length 
                });
              } catch (parseError) {
                // If not JSON, treat as plain text result
                setDataScientistAnalysisResult({
                  analysis: {
                    summary: artifact.content,
                    insights: [],
                    recommendations: []
                  },
                  visualizations: [],
                  statistics: {
                    dataPoints: 0,
                    columns: []
                  }
                });
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist text analysis artifact created', { 
                  artifactId: artifact.id
                });
              }
            }
          },
          onError: (error) => {
            setDataScientistAnalyzing(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: 'data_scientist_widget',
          user_id: 'widget_user',
          template_parameters: {
            widget_type: 'data_scientist',
            ...params
          }
        });
        
      } catch (error) {
        setDataScientistAnalyzing(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis request failed', { error, params });
      }
    }
  }))
);

// Widget选择器 - Dream
export const useDreamState = () => useDreamWidgetStore(state => ({
  generatedImage: state.generatedImage,
  isGenerating: state.isGenerating,
  lastParams: state.lastParams
}));

export const useDreamActions = () => useDreamWidgetStore(state => ({
  setDreamGeneratedImage: state.setDreamGeneratedImage,
  setDreamGenerating: state.setDreamGenerating,
  setDreamParams: state.setDreamParams,
  clearDreamData: state.clearDreamData,
  triggerDreamGeneration: state.triggerDreamGeneration
}));

// Widget选择器 - Hunt
export const useHuntState = () => useHuntWidgetStore(state => ({
  searchResults: state.searchResults,
  isSearching: state.isSearching,
  lastQuery: state.lastQuery
}));

export const useHuntActions = () => useHuntWidgetStore(state => ({
  setHuntSearchResults: state.setHuntSearchResults,
  setHuntSearching: state.setHuntSearching,
  setHuntLastQuery: state.setHuntLastQuery,
  clearHuntData: state.clearHuntData,
  triggerHuntSearch: state.triggerHuntSearch
}));

// Widget选择器 - Omni
export const useOmniState = () => useOmniWidgetStore(state => ({
  generatedContent: state.generatedContent,
  isGenerating: state.isGenerating,
  lastParams: state.lastParams
}));

export const useOmniActions = () => useOmniWidgetStore(state => ({
  setOmniGeneratedContent: state.setOmniGeneratedContent,
  setOmniGenerating: state.setOmniGenerating,
  setOmniParams: state.setOmniParams,
  clearOmniData: state.clearOmniData,
  triggerOmniGeneration: state.triggerOmniGeneration
}));

// Widget选择器 - Assistant
export const useAssistantState = () => useAssistantWidgetStore(state => ({
  conversationContext: state.conversationContext,
  isProcessing: state.isProcessing
}));

export const useAssistantActions = () => useAssistantWidgetStore(state => ({
  setAssistantContext: state.setAssistantContext,
  setAssistantProcessing: state.setAssistantProcessing,
  clearAssistantData: state.clearAssistantData,
  triggerAssistantRequest: state.triggerAssistantRequest
}));

// Widget选择器 - DataScientist
export const useDataScientistState = () => useDataScientistWidgetStore(state => ({
  analysisResult: state.analysisResult,
  isAnalyzing: state.isAnalyzing,
  lastParams: state.lastParams
}));

export const useDataScientistActions = () => useDataScientistWidgetStore(state => ({
  setDataScientistAnalysisResult: state.setDataScientistAnalysisResult,
  setDataScientistAnalyzing: state.setDataScientistAnalyzing,
  setDataScientistParams: state.setDataScientistParams,
  clearDataScientistData: state.clearDataScientistData,
  triggerDataScientistAnalysis: state.triggerDataScientistAnalysis
}));

// 统一的Widget清理操作
export const clearAllWidgetData = () => {
  useDreamWidgetStore.getState().clearDreamData();
  useHuntWidgetStore.getState().clearHuntData();
  useOmniWidgetStore.getState().clearOmniData();
  useAssistantWidgetStore.getState().clearAssistantData();
  useDataScientistWidgetStore.getState().clearDataScientistData();
  logger.debug(LogCategory.ARTIFACT_CREATION, 'All widget data cleared');
};