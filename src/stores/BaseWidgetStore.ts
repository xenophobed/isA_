/**
 * ============================================================================
 * 基础小部件状态管理 (BaseWidgetStore.ts) - Widget Store工厂函数
 * ============================================================================
 * 
 * 【核心职责】
 * - 提供通用的Widget Store创建工厂函数
 * - 统一处理所有Widget的共同逻辑
 * - 减少代码重复，提高可维护性
 * 
 * 【通用逻辑包括】
 * - recordWidgetUsage 记录
 * - chatService 调用和回调处理
 * - 错误处理和状态管理
 * - markWidgetWithArtifacts 标记
 * - 统一的日志记录
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger, LogCategory } from '../utils/logger';
import { chatService } from '../api/chatService';
import { useAppStore } from './useAppStore';
import { useSessionStore } from './useSessionStore';
import {
  BaseWidgetConfig,
  BaseWidgetState,
  BaseWidgetActions,
  BaseWidgetStore,
  CustomResultHandlers,
  WidgetHelpers,
  ChatServiceCallbacks,
  ChatServiceOptions
} from '../types/widgetTypes';

/**
 * 创建统一的ChatService回调处理器
 */
function createChatServiceCallbacks(
  config: BaseWidgetConfig,
  params: any,
  helpers: WidgetHelpers,
  customHandlers: CustomResultHandlers,
  get: any
): ChatServiceCallbacks {
  return {
    onMessageStart: (messageId, status = '') => {
      logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} message started`, { 
        messageId, 
        status 
      });
    },

    onMessageContent: (contentChunk) => {
      logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} content chunk`, { 
        contentChunk 
      });
    },

    onMessageStatus: (status) => {
      if (customHandlers.onMessageStatus) {
        customHandlers.onMessageStatus(status, params, helpers, get);
      }
      logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} status update`, { 
        status 
      });
    },

    onMessageComplete: (completeMessage?: string) => {
      helpers.setProcessing(false);
      
      if (completeMessage && completeMessage.trim()) {
        if (customHandlers.onMessageComplete) {
          customHandlers.onMessageComplete(completeMessage, params, helpers, get);
        }
        
        // ✅ Widget在Independent模式下运行时，不需要更新Chat消息
        // 只有在Plugin模式下，才需要更新Chat消息
        // 当前Widget是独立运行的，所以跳过Chat消息更新
        logger.debug(LogCategory.CHAT_FLOW, `${config.logEmoji} Widget running in independent mode, skipping chat message update`);
        
        logger.info(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} message completed`, {
          contentLength: completeMessage.length,
          contentPreview: completeMessage.substring(0, 100) + '...'
        });
      } else {
        console.log(`${config.logEmoji} ${config.widgetType.toUpperCase()}_STORE: No complete message content provided`);
      }
    },

    onArtifactCreated: (artifact) => {
      // 只处理特定类型的 artifacts，避免重复
      const shouldProcess = config.widgetType === 'dream' 
        ? (artifact.type === 'image' || artifact.type === 'data') // Dream 处理 image 和 data 类型
        : true; // 其他 Widget 处理所有类型
      
      if (!shouldProcess) {
        logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Skipping artifact type: ${artifact.type}`);
        return;
      }

      // 简化重复检测逻辑 - 基于内容和类型
      const state = get();
      const artifactKey = `${artifact.type}_${artifact.content}`;
      if (state._lastProcessedArtifact === artifactKey) {
        logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Duplicate artifact detected, skipping`);
        return;
      }

      // 记录已处理的 artifact - 使用更安全的方式
      try {
        const currentState = get();
        if (currentState && typeof currentState === 'object') {
          (currentState as any)._lastProcessedArtifact = artifactKey;
        }
      } catch (error) {
        console.warn('Failed to update _lastProcessedArtifact:', error);
      }

      if (customHandlers.onArtifactCreated) {
        customHandlers.onArtifactCreated(artifact, params, helpers, get);
      }
      
      // 🆕 在Plugin模式下跳过artifact同步，因为ChatModule已经负责创建artifact
      // 检测是否在Plugin模式下运行（简单方法：检查当前是否有ChatModule在运行）
      const isPluginMode = typeof window !== 'undefined' && 
        (window as any).__CHAT_MODULE_PLUGIN_MODE__ === true;
      
      if (isPluginMode) {
        logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Plugin mode detected, skipping artifact sync (ChatModule handles this)`);
        return;
      }
      
      // 🆕 同步 Artifact 到 Session (只同步一次)
      try {
        const { useSessionStore } = require('./useSessionStore');
        const { getCurrentSession, addArtifactMessage, getArtifactMessages } = useSessionStore.getState();
        
        const currentSession = getCurrentSession();
        if (currentSession && params) {
          // 检查是否已经有相同内容的 artifact message
          const existingArtifacts = getArtifactMessages(currentSession.id);
          const duplicateExists = existingArtifacts.some((existing: any) => 
            existing.artifact.content === artifact.content &&
            existing.artifact.widgetType === config.widgetType
          );
          
          if (duplicateExists) {
            logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Duplicate artifact message detected, skipping sync`);
            return;
          }

          // Map artifact types to consistent contentType values
          const mapContentType = (artifactType: string): 'image' | 'text' | 'data' | 'analysis' | 'knowledge' => {
            switch (artifactType) {
              case 'search_results': return 'analysis';
              case 'search': return 'analysis';
              case 'data': return 'data';
              case 'image': return 'image';
              case 'knowledge': return 'knowledge';
              default: return 'text';
            }
          };

          // 创建 Artifact Message
          const artifactMessage = {
            id: `msg_${Date.now()}`,
            type: 'artifact' as const,
            role: 'assistant' as const,
            content: `Generated ${config.widgetType} artifact`,
            timestamp: new Date().toISOString(),
            userPrompt: params.prompt || params.query || 'Generated artifact',
            artifact: {
              id: artifact.id || `${config.widgetType}_${Date.now()}`,
              widgetType: config.widgetType,
              widgetName: config.widgetType.charAt(0).toUpperCase() + config.widgetType.slice(1),
              version: 1,
              contentType: mapContentType(artifact.type || 'text'),
              content: artifact.content,
              thumbnail: artifact.thumbnail,
              metadata: {
                processingTime: Date.now(),
                createdBy: 'widget'
              }
            }
          };
          
          addArtifactMessage(currentSession.id, artifactMessage);
          
          logger.info(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Artifact synced to session`, {
            sessionId: currentSession.id,
            artifactId: artifactMessage.artifact.id,
            widgetType: config.widgetType,
            contentType: artifact.type
          });
        }
      } catch (error) {
        logger.error(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Failed to sync artifact to session`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      logger.info(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} artifact created`, {
        artifactId: artifact.id,
        artifactType: artifact.type
      });
    },

    onError: (error) => {
      helpers.setProcessing(false);
      
      if (customHandlers.onError) {
        customHandlers.onError(error, params, helpers, get);
      } else {
        logger.error(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} failed`, {
          error: error.message,
          params
        });
      }
    }
  };
}

/**
 * 构建ChatService请求选项
 */
function buildChatServiceOptions(
  config: BaseWidgetConfig,
  params: any,
  customHandlers: CustomResultHandlers
): ChatServiceOptions {
  // 使用自定义模板参数构建器，或使用默认
  let templateParams;
  if (customHandlers.buildTemplateParams) {
    templateParams = customHandlers.buildTemplateParams(params);
  } else {
    // 默认模板参数结构
    templateParams = {
      template_id: config.defaultTemplateName,
      prompt_args: {
        prompt: params.prompt || params.query || 'General request',
        ...params
      }
    };
  }

  return {
    session_id: `${config.widgetType}_widget_${Date.now()}`,
    user_id: 'user_123', // TODO: Get from auth store
    template_parameters: templateParams
  };
}

/**
 * BaseWidget Store工厂函数
 * 
 * @param config Widget配置
 * @param specificInitialState 特定Widget的初始状态
 * @param specificActions 特定Widget的Actions工厂函数
 * @param customHandlers 自定义处理回调
 * @returns Zustand store
 */
export function createBaseWidgetStore<TSpecificState, TSpecificActions>(
  config: BaseWidgetConfig,
  specificInitialState: TSpecificState,
  specificActions: (
    set: any, 
    get: any, 
    helpers: WidgetHelpers
  ) => TSpecificActions,
  customHandlers: CustomResultHandlers = {}
): any {
  
  return create<BaseWidgetStore<TSpecificState, TSpecificActions>>()(
    subscribeWithSelector((set, get) => {
      
      // 创建辅助工具
      const helpers: WidgetHelpers = {
        setProcessing: (isProcessing: boolean) => {
          set((state) => ({ ...state, isProcessing }));
          logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} processing state changed`, { 
            isProcessing 
          });
        },
        markWithArtifacts: () => {
          const { markWidgetWithArtifacts } = useAppStore.getState();
          markWidgetWithArtifacts(config.widgetType);
        },
        logger,
        config
      };

      // 基础状态和Actions
      const baseState: BaseWidgetState = {
        isProcessing: false,
        lastParams: null
      };

      const baseActions: BaseWidgetActions = {
        setProcessing: helpers.setProcessing,
        
        setParams: (params) => {
          set((state) => {
            // 浅比较，如果内容相同就不更新，避免不必要的引用变化
            if (JSON.stringify(state.lastParams) === JSON.stringify(params)) {
              console.log('🚨DEBUG_DUPLICATE🚨 setParams 跳过更新，内容相同');
              return state; // 不更新，保持引用不变
            }
            console.log('🚨DEBUG_DUPLICATE🚨 setParams 更新参数:', params);
            return { ...state, lastParams: params };
          });
          logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} params updated`, { 
            params 
          });
        },

        clearData: () => {
          // 清除基础状态
          set((state) => ({ 
            ...state,
            isProcessing: false, 
            lastParams: null,
            // 同时清除特定状态 - 通过重置为初始状态
            ...specificInitialState
          }));
          logger.debug(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} data cleared`);
        },

        triggerAction: async (params) => {
          const { setProcessing, setParams } = get();
          
          // 记录widget使用（用户真正使用了功能）
          const { recordWidgetUsage } = useAppStore.getState();
          recordWidgetUsage(config.widgetType);
          
          // 设置处理状态和参数
          setProcessing(true);
          setParams(params);
          
          // ❌ REMOVED: Message creation logic moved to Widget Modules
          // Widget stores should only manage state, not create chat messages
          // Message creation is now handled by individual widget modules
          
          try {
            // 检查是否有来自Module的模板参数
            if (params.templateParams) {
            }
            
            // 构建提示词 - 始终使用用户的原始 prompt
            const prompt = params.prompt || params.query || `${config.widgetType} request`;
            
            logger.info(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} Starting ${config.widgetType} via chatService`, {
              params,
              hasTemplateParams: !!params.templateParams
            });
            
            // 构建ChatService选项
            const chatOptions = buildChatServiceOptions(config, params, customHandlers);
            
            // 如果有来自Module的模板参数，使用它们
            if (params.templateParams) {
              chatOptions.prompt_name = params.templateParams.template_id;
              chatOptions.prompt_args = params.templateParams.prompt_args;
              // 移除template_parameters，使用新格式
              delete chatOptions.template_parameters;
            }
            
            // 创建回调处理器
            const callbacks = createChatServiceCallbacks(config, params, helpers, customHandlers, get);
            
            // 调用chatService
            console.log('🔥MODULE_DATA_FLOW🔥 BaseWidgetStore 发送到 chatService:', {
              prompt,
              widgetType: config.widgetType,
              'chatOptions.prompt_name': chatOptions.prompt_name,
              'chatOptions.prompt_args': chatOptions.prompt_args,
              'chatOptions.template_parameters': chatOptions.template_parameters,
              'chatOptions完整': chatOptions
            });
            // chatService.sendMessage expects: (message, metadata, token, callbacks)
            // Use default token like in useChatStore.ts - real token should come from UserModule
            const token = 'dev_key_test';
            await chatService.sendMessage(prompt, chatOptions, token, callbacks);
            
          } catch (error) {
            setProcessing(false);
            logger.error(LogCategory.ARTIFACT_CREATION, `${config.logEmoji} ${config.widgetType} request failed`, { 
              error, 
              params 
            });
          }
        }
      };

      // 获取特定Actions
      const specificActionsInstance = specificActions(set, get, helpers);

      // 合并所有状态和Actions
      return {
        ...baseState,
        ...specificInitialState,
        ...baseActions,
        ...specificActionsInstance
      };
    })
  );
}