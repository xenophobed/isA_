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
import { useAppStore } from './useAppStore';

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
      
      // 记录widget使用（用户真正使用了功能）
      const { recordWidgetUsage } = useAppStore.getState();
      recordWidgetUsage('dream');
      
      // Set generating state and params
      setDreamGenerating(true);
      setDreamParams(params);
      
      try {
        // Check if we have template parameters from DreamWidgetModule
        if (params.templateParams) {
          console.log('🎨 DREAM_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('🎨 DREAM_STORE: No template params from module, using fallback');
        }
        
        // Use simple prompt - just the user's input, no formatting
        const dreamPrompt = params.prompt || 'Generate an image';
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting dream generation via chatService', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(dreamPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream generation message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream generation content chunk', { contentChunk });
          },
          onMessageComplete: (completeMessage) => {
            setDreamGenerating(false); // 停止生成状态
            
            // 从完整消息中提取图片URL
            if (completeMessage) {
              const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
              const imageMatches = completeMessage.match(imageRegex);
              
              if (imageMatches && imageMatches.length > 0) {
                const urlMatch = imageMatches[0].match(/\((https?:\/\/[^\)]+)\)/);
                if (urlMatch && urlMatch[1]) {
                  const imageUrl = urlMatch[1];
                  setDreamGeneratedImage(imageUrl);
                  
                  // 标记widget有artifacts
                  const { markWidgetWithArtifacts } = useAppStore.getState();
                  markWidgetWithArtifacts('dream');
                  
                  logger.info(LogCategory.ARTIFACT_CREATION, 'Dream image extracted from complete message', { 
                    imageUrl: imageUrl,
                    messageLength: completeMessage.length
                  });
                } else {
                  console.log('🎨 DREAM_STORE: No valid image URL found in complete message');
                }
              } else {
                console.log('🎨 DREAM_STORE: No image markdown found in complete message');
              }
            } else {
              console.log('🎨 DREAM_STORE: No complete message provided');
            }
            
            logger.info(LogCategory.ARTIFACT_CREATION, 'Dream generation message completed');
          },
          onArtifactCreated: (artifact) => {
            // 保留作为备用，但主要逻辑已转移到onMessageComplete
            if (artifact.type === 'image' && artifact.content && !get().generatedImage) {
              console.log('🎨 DREAM_STORE: Fallback - using artifact for image (onMessageComplete may have failed)');
              setDreamGeneratedImage(artifact.content);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('dream');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Dream image artifact created (fallback)', { 
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
          session_id: `dream_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          template_parameters: params.templateParams || {
            template_id: 'text_to_image_prompt',
            prompt_args: {
              prompt: params.prompt || dreamPrompt,
              style_preset: params.style_preset || params.style || 'photorealistic',
              quality: params.quality || 'high'
            }
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
  currentStatus: string; // 添加当前状态字段
}

interface HuntWidgetActions {
  setHuntSearchResults: (results: any[]) => void;
  setHuntSearching: (isSearching: boolean) => void;
  setHuntLastQuery: (query: string) => void;
  setHuntCurrentStatus: (status: string) => void; // 添加状态设置方法
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
    currentStatus: '',
    
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
    
    setHuntCurrentStatus: (status) => {
      set({ currentStatus: status });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt current status updated', { status });
    },
    
    clearHuntData: () => {
      set({ searchResults: [], isSearching: false, lastQuery: '' });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt widget data cleared');
    },
    
    // New method: Trigger hunt search via chatService
    triggerHuntSearch: async (params) => {
      const { setHuntSearching, setHuntLastQuery, setHuntSearchResults } = get();
      
      // 记录widget使用（用户真正使用了功能）
      const { recordWidgetUsage } = useAppStore.getState();
      recordWidgetUsage('hunt');
      
      // Set searching state and query
      setHuntSearching(true);
      setHuntLastQuery(params.query || '');
      
      try {
        // Check if we have template parameters from HuntWidgetModule
        if (params.templateParams) {
          console.log('🔍 HUNT_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('🔍 HUNT_STORE: No template params from module, using fallback');
        }
        
        // Use simple prompt - just the user's search query
        const huntPrompt = params.query || 'Search for information';
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting hunt search via chatService', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Use template parameters from HuntWidgetModule (like Dream does)
        let templateParams;
        if (params.templateParams) {
          templateParams = {
            prompt_name: params.templateParams.template_id,
            prompt_args: params.templateParams.prompt_args
          };
          console.log('🔍 HUNT_STORE: Using template params from module:', templateParams);
        } else {
          // Fallback for direct calls without module
          templateParams = {
            prompt_name: 'hunt_general_prompt',
            prompt_args: {
              query: params.query || huntPrompt,
              search_depth: params.search_depth || 'standard',
              result_format: params.result_format || 'summary'
            }
          };
          console.log('🔍 HUNT_STORE: Using fallback template params:', templateParams);
        }

        // Call chatService following useChatStore pattern
        await chatService.sendMessage(huntPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search content chunk', { contentChunk });
          },
          onMessageStatus: (status) => {
            // 这里接收SSEParser提供的详细状态信息
            console.log('🔍 HUNT_STORE: Received status update:', status);
            const { setHuntCurrentStatus } = get();
            setHuntCurrentStatus(status);
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt search status update', { status });
          },
          onMessageComplete: (completeMessage) => {
            // Process the complete search response from chatService
            if (completeMessage && completeMessage.trim()) {
              console.log('🔍 HUNT_STORE: Processing complete search response from chatService:', completeMessage.substring(0, 200) + '...');
              
              // Create search result from the complete AI response
              const searchResult = {
                title: `Search Results for: ${params.query}`,
                description: completeMessage.length > 200 ? completeMessage.substring(0, 200) + '...' : completeMessage,
                content: completeMessage,
                query: params.query,
                timestamp: new Date().toISOString(),
                type: 'search_response'
              };
              
              setHuntSearchResults([searchResult]);
              logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search completed with complete message from chatService', { 
                query: params.query,
                responseLength: completeMessage.length 
              });
            } else {
              // Fallback if no complete message was provided
              console.log('🔍 HUNT_STORE: No complete message provided, creating placeholder result');
              const placeholderResult = {
                title: `Search Results for: ${params.query}`,
                description: 'Search completed but no content was returned.',
                content: 'Search completed but no content was returned.',
                query: params.query,
                timestamp: new Date().toISOString(),
                type: 'search_response'
              };
              
              setHuntSearchResults([placeholderResult]);
            }
            
            setHuntSearching(false);
            logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search message completed');
          },
          onArtifactCreated: (artifact) => {
            // Handle any additional artifacts (images, structured data) from SSEParser
            if (artifact.content) {
              console.log('🔍 HUNT_STORE: Additional artifact created:', artifact.type, artifact.id);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('hunt');
              
              if (artifact.type === 'image') {
                // Add image artifact to search results
                const imageResult = {
                  title: 'Image Result',
                  description: 'Generated or found image',
                  content: artifact.content,
                  url: artifact.content,
                  type: 'image'
                };
                
                setHuntSearchResults(prev => [...prev, imageResult]);
                logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt image artifact added to results', { 
                  artifactId: artifact.id,
                  imageUrl: artifact.content 
                });
              } else if (artifact.type === 'data') {
                // Add structured data artifact to search results
                try {
                  const dataResult = JSON.parse(artifact.content);
                  const structuredResult = {
                    title: 'Structured Data',
                    description: 'Parsed structured search data',
                    content: artifact.content,
                    data: dataResult,
                    type: 'structured_data'
                  };
                  
                  setHuntSearchResults(prev => [...prev, structuredResult]);
                  logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt structured data artifact added to results', { 
                    artifactId: artifact.id 
                  });
                } catch (parseError) {
                  console.error('Failed to parse structured data artifact:', parseError);
                }
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
          session_id: `hunt_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          prompt_name: templateParams.prompt_name,
          prompt_args: templateParams.prompt_args
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
    
    // New method: Trigger omni content generation via chatService with template
    triggerOmniGeneration: async (params) => {
      const { setOmniGenerating, setOmniParams, setOmniGeneratedContent } = get();
      
      // 记录widget使用（用户真正使用了功能）
      const { recordWidgetUsage } = useAppStore.getState();
      recordWidgetUsage('omni');
      
      // Set generating state and params
      setOmniGenerating(true);
      setOmniParams(params);
      
      try {
        // Check if we have template parameters from OmniWidgetModule
        if (params.templateParams) {
          console.log('⚡ OMNI_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('⚡ OMNI_STORE: No template params from module, using fallback');
        }
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting omni generation via chatService with template', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Use template parameters from OmniWidgetModule (like Dream and Hunt)
        let templateParams;
        if (params.templateParams) {
          templateParams = {
            prompt_name: params.templateParams.template_id,
            prompt_args: params.templateParams.prompt_args
          };
          console.log('⚡ OMNI_STORE: Using template params from module:', templateParams);
        } else {
          // Fallback for direct calls without module
          templateParams = {
            prompt_name: 'general_content_prompt',
            prompt_args: {
              subject: params.topic || params.subject || params.prompt || 'Content generation request',
              content_type: params.contentType || 'text',
              tone: params.tone || 'professional',
              length: params.length || 'medium',
              depth: 'deep',
              reference_text: params.context || 'Generate comprehensive content based on the given topic'
            }
          };
          console.log('⚡ OMNI_STORE: Using fallback template params:', templateParams);
        }
        
        // Call chatService with template parameters (following new API format)
        await chatService.sendMessage(params.prompt || 'Generate content', {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni generation message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni generation content chunk', { contentChunk });
          },
          onMessageComplete: (completeMessage) => {
            setOmniGenerating(false);
            
            // 从完整消息中获取生成的内容
            if (completeMessage && completeMessage.trim()) {
              setOmniGeneratedContent(completeMessage);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('omni');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Omni content extracted from complete message', { 
                contentLength: completeMessage.length,
                contentPreview: completeMessage.substring(0, 100) + '...'
              });
            } else {
              console.log('⚡ OMNI_STORE: No complete message content provided');
            }
            
            logger.info(LogCategory.ARTIFACT_CREATION, 'Omni generation message completed');
          },
          onArtifactCreated: (artifact) => {
            // 保留作为备用，但主要逻辑已转移到onMessageComplete
            if (artifact.content && !get().generatedContent) {
              console.log('⚡ OMNI_STORE: Fallback - using artifact for content (onMessageComplete may have failed)');
              setOmniGeneratedContent(artifact.content);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('omni');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Omni content artifact created (fallback)', { 
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
          session_id: `omni_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          prompt_name: templateParams.prompt_name,
          prompt_args: templateParams.prompt_args
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
        // Check if we have template parameters from AssistantWidgetModule
        if (params.templateParams) {
          console.log('🤖 ASSISTANT_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('🤖 ASSISTANT_STORE: No template params from module, using fallback');
        }
        
        // Build assistant-specific prompt
        const assistantPrompt = `Assistant request: ${params.query || params.prompt}
${params.context ? `Context: ${params.context}` : ''}
${params.task ? `Task: ${params.task}` : ''}

Please provide helpful assistance based on this request.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting assistant request via chatService', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Use template parameters from AssistantWidgetModule (like other widgets)
        let templateParams;
        if (params.templateParams) {
          templateParams = {
            prompt_name: params.templateParams.template_id,
            prompt_args: params.templateParams.prompt_args
          };
          console.log('🤖 ASSISTANT_STORE: Using template params from module:', templateParams);
        } else {
          // Fallback for direct calls without module
          templateParams = {
            prompt_name: 'general_content_prompt',
            prompt_args: {
              subject: params.query || params.prompt || params.message || 'Assistant request',
              depth: 'medium',
              reference_text: params.context || '',
              user_message: params.query || params.message || 'Please provide assistance'
            }
          };
          console.log('🤖 ASSISTANT_STORE: Using fallback template params:', templateParams);
        }
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(assistantPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant request message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant request content chunk', { contentChunk });
          },
          onMessageComplete: (completeMessage) => {
            setAssistantProcessing(false);
            
            // 从完整消息中获取助手响应
            if (completeMessage && completeMessage.trim()) {
              // Update context with the assistant response
              setAssistantContext({
                ...params,
                response: completeMessage,
                timestamp: new Date().toISOString()
              });
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('assistant');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant response extracted from complete message', { 
                contentLength: completeMessage.length,
                contentPreview: completeMessage.substring(0, 100) + '...'
              });
            } else {
              console.log('🤖 ASSISTANT_STORE: No complete message content provided');
            }
            
            logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant request message completed');
          },
          onArtifactCreated: (artifact) => {
            // 保留作为备用，但主要逻辑已转移到onMessageComplete
            if (artifact.content && !get().conversationContext?.response) {
              console.log('🤖 ASSISTANT_STORE: Fallback - using artifact for response (onMessageComplete may have failed)');
              // Update context with the assistant response
              setAssistantContext({
                ...params,
                response: artifact.content,
                timestamp: new Date().toISOString()
              });
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('assistant');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant response artifact created (fallback)', { 
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
          session_id: `assistant_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          prompt_name: templateParams.prompt_name,
          prompt_args: templateParams.prompt_args
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
      
      // 记录widget使用（用户真正使用了功能）
      const { recordWidgetUsage } = useAppStore.getState();
      recordWidgetUsage('data-scientist');
      
      // Set analyzing state and params
      setDataScientistAnalyzing(true);
      setDataScientistParams(params);
      
      try {
        // Check if we have template parameters from DataScientistWidgetModule
        if (params.templateParams) {
          console.log('📊 DATA_SCIENTIST_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('📊 DATA_SCIENTIST_STORE: No template params from module, using fallback');
        }
        
        // Build data scientist-specific prompt
        const dataScientistPrompt = `Perform data analysis with the following specifications:
Query: ${params.query || 'General data analysis'}
${params.analysisType ? `Analysis Type: ${params.analysisType}` : ''}
${params.visualizationType ? `Visualization Type: ${params.visualizationType}` : ''}
${params.data ? `Data: ${typeof params.data === 'string' ? params.data : 'File provided'}` : ''}

Please provide comprehensive data analysis including insights, recommendations, and visualizations as a data_analysis artifact.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting data scientist analysis via chatService', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Use template parameters from DataScientistWidgetModule (like Dream and Hunt)
        let templateParams;
        if (params.templateParams) {
          templateParams = {
            prompt_name: params.templateParams.template_id,
            prompt_args: params.templateParams.prompt_args
          };
          console.log('📊 DATA_SCIENTIST_STORE: Using template params from module:', templateParams);
        } else {
          // Fallback for direct calls without module
          templateParams = {
            prompt_name: 'csv_analyze_prompt',
            prompt_args: {
              query: params.query || dataScientistPrompt,
              analysis_type: params.analysisType || 'exploratory',
              visualization_type: params.visualizationType || 'chart',
              data_context: params.data ? 'CSV data provided' : 'Request for data analysis'
            }
          };
          console.log('📊 DATA_SCIENTIST_STORE: Using fallback template params:', templateParams);
        }
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(dataScientistPrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis content chunk', { contentChunk });
          },
          onMessageComplete: (completeMessage) => {
            setDataScientistAnalyzing(false);
            
            // 从完整消息中获取分析结果
            if (completeMessage && completeMessage.trim()) {
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('data-scientist');
              
              try {
                // 尝试解析为JSON
                const analysisResult = JSON.parse(completeMessage);
                setDataScientistAnalysisResult(analysisResult);
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis extracted from complete message (JSON)', { 
                  hasInsights: !!analysisResult.analysis?.insights?.length,
                  contentLength: completeMessage.length
                });
              } catch (parseError) {
                // 如果不是JSON，作为纯文本存储并构建标准格式
                setDataScientistAnalysisResult({
                  analysis: {
                    summary: completeMessage,
                    insights: [],
                    recommendations: []
                  },
                  visualizations: [],
                  statistics: {
                    dataPoints: 0,
                    columns: []
                  }
                });
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis extracted from complete message (text)', { 
                  contentLength: completeMessage.length,
                  contentPreview: completeMessage.substring(0, 100) + '...'
                });
              }
            } else {
              console.log('📊 DATASCIENTIST_STORE: No complete message content provided');
            }
            
            logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis message completed');
          },
          onArtifactCreated: (artifact) => {
            // 保留作为备用，但主要逻辑已转移到onMessageComplete
            if (artifact.content && !get().analysisResult) {
              console.log('📊 DATASCIENTIST_STORE: Fallback - using artifact for analysis (onMessageComplete may have failed)');
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('data-scientist');
              
              try {
                const analysisResult = JSON.parse(artifact.content);
                setDataScientistAnalysisResult(analysisResult);
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis artifact created (fallback, JSON)', { 
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
                logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist text analysis artifact created (fallback)', { 
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
          session_id: `data_scientist_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          prompt_name: templateParams.prompt_name,
          prompt_args: templateParams.prompt_args
        });
        
      } catch (error) {
        setDataScientistAnalyzing(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis request failed', { error, params });
      }
    }
  }))
);

// Knowledge Widget State
interface KnowledgeWidgetState {
  documents: any[];
  isProcessing: boolean;
  lastParams: any;
  analysisResult: string | null;
}

interface KnowledgeWidgetActions {
  setKnowledgeDocuments: (documents: any[]) => void;
  setKnowledgeProcessing: (isProcessing: boolean) => void;
  setKnowledgeParams: (params: any) => void;
  setKnowledgeAnalysisResult: (result: string | null) => void;
  clearKnowledgeData: () => void;
  triggerKnowledgeAnalysis: (params: any) => Promise<void>;
}

export type KnowledgeWidgetStore = KnowledgeWidgetState & KnowledgeWidgetActions;

export const useKnowledgeWidgetStore = create<KnowledgeWidgetStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    documents: [],
    isProcessing: false,
    lastParams: null,
    analysisResult: null,
    
    // Knowledge操作
    setKnowledgeDocuments: (documents) => {
      set({ documents });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge documents updated', { 
        documentCount: documents.length 
      });
    },
    
    setKnowledgeProcessing: (isProcessing) => {
      set({ isProcessing });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge processing state changed', { isProcessing });
    },
    
    setKnowledgeParams: (params) => {
      set({ lastParams: params });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge params updated', { params });
    },
    
    setKnowledgeAnalysisResult: (result) => {
      set({ analysisResult: result });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis result updated', { 
        hasResult: !!result 
      });
    },
    
    clearKnowledgeData: () => {
      set({ documents: [], isProcessing: false, lastParams: null, analysisResult: null });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge widget data cleared');
    },
    
    // New method: Trigger knowledge analysis via chatService
    triggerKnowledgeAnalysis: async (params) => {
      const { setKnowledgeProcessing, setKnowledgeParams, setKnowledgeAnalysisResult, setKnowledgeDocuments } = get();
      
      // 记录widget使用（用户真正使用了功能）
      const { recordWidgetUsage } = useAppStore.getState();
      recordWidgetUsage('knowledge');
      
      // Set processing state and params
      setKnowledgeProcessing(true);
      setKnowledgeParams(params);
      
      try {
        // Check if we have template parameters from KnowledgeWidgetModule
        if (params.templateParams) {
          console.log('📚 KNOWLEDGE_STORE: Using template params from module:', params.templateParams);
        } else {
          console.log('📚 KNOWLEDGE_STORE: No template params from module, using fallback');
        }
        
        // Build knowledge-specific prompt
        const knowledgePrompt = `Analyze the following document(s) and provide insights:
Query: ${params.query || 'General document analysis'}
${params.documents ? `Documents: ${params.documents.length} file(s) provided` : ''}
${params.analysisType ? `Analysis Type: ${params.analysisType}` : ''}

Please provide comprehensive analysis and insights based on the provided content.`;
        
        logger.info(LogCategory.ARTIFACT_CREATION, 'Starting knowledge analysis via chatService', { 
          params,
          hasTemplateParams: !!params.templateParams
        });
        
        // Use template parameters from KnowledgeWidgetModule (like other widgets)
        let templateParams;
        if (params.templateParams) {
          templateParams = {
            prompt_name: params.templateParams.template_id,
            prompt_args: params.templateParams.prompt_args
          };
          console.log('📚 KNOWLEDGE_STORE: Using template params from module:', templateParams);
        } else {
          // Fallback for direct calls without module
          templateParams = {
            prompt_name: 'document_analysis_prompt',
            prompt_args: {
              query: params.query || knowledgePrompt,
              analysis_type: params.analysisType || 'comprehensive',
              document_context: params.documents ? `${params.documents.length} documents provided` : 'Document analysis request'
            }
          };
          console.log('📚 KNOWLEDGE_STORE: Using fallback template params:', templateParams);
        }
        
        // Store documents if provided
        if (params.documents && params.documents.length > 0) {
          setKnowledgeDocuments(params.documents);
        }
        
        // Call chatService following useChatStore pattern
        await chatService.sendMessage(knowledgePrompt, {
          onMessageStart: (messageId, status) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis message started', { messageId, status });
          },
          onMessageContent: (contentChunk) => {
            logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis content chunk', { contentChunk });
          },
          onMessageComplete: (completeMessage) => {
            setKnowledgeProcessing(false);
            
            // 从完整消息中获取分析结果
            if (completeMessage && completeMessage.trim()) {
              setKnowledgeAnalysisResult(completeMessage);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('knowledge');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis extracted from complete message', { 
                contentLength: completeMessage.length,
                contentPreview: completeMessage.substring(0, 100) + '...'
              });
            } else {
              console.log('📚 KNOWLEDGE_STORE: No complete message content provided');
            }
            
            logger.info(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis message completed');
          },
          onArtifactCreated: (artifact) => {
            // 保留作为备用，但主要逻辑已转移到onMessageComplete
            if (artifact.content && !get().analysisResult) {
              console.log('📚 KNOWLEDGE_STORE: Fallback - using artifact for analysis (onMessageComplete may have failed)');
              setKnowledgeAnalysisResult(artifact.content);
              
              // 标记widget有artifacts
              const { markWidgetWithArtifacts } = useAppStore.getState();
              markWidgetWithArtifacts('knowledge');
              
              logger.info(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis artifact created (fallback)', { 
                artifactId: artifact.id,
                contentLength: artifact.content.length 
              });
            }
          },
          onError: (error) => {
            setKnowledgeProcessing(false);
            logger.error(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis failed', { 
              error: error.message, 
              params 
            });
          }
        }, {
          session_id: `knowledge_widget_${Date.now()}`,
          user_id: 'user_123', // TODO: Get from auth store
          prompt_name: templateParams.prompt_name,
          prompt_args: templateParams.prompt_args
        });
        
      } catch (error) {
        setKnowledgeProcessing(false);
        logger.error(LogCategory.ARTIFACT_CREATION, 'Knowledge analysis request failed', { error, params });
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
  lastQuery: state.lastQuery,
  currentStatus: state.currentStatus
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

// Widget选择器 - Knowledge
export const useKnowledgeState = () => useKnowledgeWidgetStore(state => ({
  documents: state.documents,
  isProcessing: state.isProcessing,
  lastParams: state.lastParams,
  analysisResult: state.analysisResult
}));

export const useKnowledgeActions = () => useKnowledgeWidgetStore(state => ({
  setKnowledgeDocuments: state.setKnowledgeDocuments,
  setKnowledgeProcessing: state.setKnowledgeProcessing,
  setKnowledgeParams: state.setKnowledgeParams,
  setKnowledgeAnalysisResult: state.setKnowledgeAnalysisResult,
  clearKnowledgeData: state.clearKnowledgeData,
  triggerKnowledgeAnalysis: state.triggerKnowledgeAnalysis
}));

// 统一的Widget清理操作
export const clearAllWidgetData = () => {
  useDreamWidgetStore.getState().clearDreamData();
  useHuntWidgetStore.getState().clearHuntData();
  useOmniWidgetStore.getState().clearOmniData();
  useAssistantWidgetStore.getState().clearAssistantData();
  useDataScientistWidgetStore.getState().clearDataScientistData();
  useKnowledgeWidgetStore.getState().clearKnowledgeData();
  logger.debug(LogCategory.ARTIFACT_CREATION, 'All widget data cleared');
};