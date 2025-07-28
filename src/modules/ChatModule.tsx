/**
 * ============================================================================
 * 聊天模块 (ChatModule.tsx) - 聊天功能的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理聊天相关的所有业务逻辑和副作用
 * - 管理AI客户端交互和消息发送
 * - 监听Widget状态变化并创建相应的聊天消息
 * - 封装用户认证和会话管理逻辑
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 聊天业务逻辑的统一管理
 *   - Widget状态监听和消息创建
 *   - AI客户端和状态管理的集成
 *   - 消息发送和接收的协调
 *   - 用户认证和权限管理
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由ChatLayout处理）
 *   - 组件的直接渲染（由components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 *   - 数据解析（由services处理）
 * 
 * 【数据流向】
 * main_app → ChatModule → ChatLayout
 * hooks → ChatModule → 事件回调 → stores → api/services
 */
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChatLayout, ChatLayoutProps } from '../components/ui/chat/ChatLayout';
import { ChatMessage } from '../types/chatTypes';
import { useChat } from '../hooks/useChat';
import { useChatActions } from '../stores/useChatStore';
import { useAuth } from '../hooks/useAuth';
import { useArtifactLogic } from './ArtifactModule';
import { ArtifactComponent } from '../components/ui/chat/ArtifactComponent';
import { useCurrentSession, useSessionActions } from '../stores/useSessionStore';
import { ChatSession } from '../stores/useSessionStore';
import { logger, LogCategory } from '../utils/logger';
import { useUserModule } from './UserModule';
import { UpgradeModal } from '../components/ui/UpgradeModal';

interface ChatModuleProps extends Omit<ChatLayoutProps, 'messages' | 'isLoading' | 'isTyping' | 'onSendMessage' | 'onSendMultimodal'> {
  // All ChatLayout props except the data and callback props that we'll provide from business logic
}

/**
 * Chat Module - Business logic module for ChatLayout
 * 
 * This module:
 * - Uses hooks to get chat state and AI client
 * - Handles all message sending business logic
 * - Manages user authentication and session data
 * - Monitors Widget states and creates chat messages
 * - Passes pure data and callbacks to ChatLayout
 * - Keeps ChatLayout as pure UI component
 */
export const ChatModule: React.FC<ChatModuleProps> = (props) => {
  // Module state for upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Get chat interface state using the hook (now pure state aggregation)
  const chatInterface = useChat();
  
  // Get authentication state
  const { auth0User } = useAuth();
  
  // Get session management
  const currentSession = useCurrentSession();
  const sessionActions = useSessionActions();
  
  // Get chat actions from store
  const chatActions = useChatActions();
  
  // Get user module for credit validation
  const userModule = useUserModule();

  // 使用ref跟踪已处理的Widget状态，避免重复处理
  const processedStatesRef = useRef<{
    hunt: { lastQuery: string; timestamp: number } | null;
    omni: { lastPrompt: string; timestamp: number } | null;
    dataScientist: { lastQuery: string; timestamp: number } | null;
    knowledge: { lastQuery: string; timestamp: number } | null;
  }>({
    hunt: null,
    omni: null,
    dataScientist: null,
    knowledge: null
  });
  
  // ================================================================================
  // 防止无限渲染循环的优化措施
  // ================================================================================
  
  // 稳定的chatActions回调，避免依赖项变化
  const stableChatActions = useMemo(() => ({
    addMessage: chatActions.addMessage,
    sendMessage: chatActions.sendMessage
  }), [chatActions.addMessage, chatActions.sendMessage]);
  
  // 完全禁用日志以解决无限循环问题
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     const interval = setInterval(() => {
  //       console.log('📦 CHAT_MODULE: Status check:', {
  //         messagesCount: chatInterface.messages.length,
  //         isLoading: chatInterface.isLoading,
  //         isTyping: chatInterface.isTyping,
  //         artifactsCount: artifactLogic.artifacts.length
  //       });
  //     }, 5000);
  //     
  //     return () => clearInterval(interval);
  //   }
  // }, [chatInterface.messages.length, chatInterface.isLoading, chatInterface.isTyping, artifactLogic.artifacts.length]);

  // ================================================================================
  // Widget状态监听和聊天消息创建 - 优化版本，防止无限渲染
  // ================================================================================

  // 监听Hunt Widget状态变化 - 创建搜索消息
  useEffect(() => {
    const huntState = chatInterface.widgetStates.hunt;
    const currentQuery = huntState.lastQuery;
    const isSearching = huntState.isSearching;
    
    // 检查是否已处理过这个查询
    const lastProcessed = processedStatesRef.current.hunt;
    const stateKey = `${currentQuery}-${isSearching}`;
    
    if (!currentQuery) return;
    
    // 避免重复处理相同状态
    if (lastProcessed?.lastQuery === stateKey) return;
    
    // 开始搜索时创建消息
    if (isSearching && currentQuery) {
      const artifactId = `hunt-${currentQuery}-searching`;
      const userMessageId = `hunt-user-${currentQuery}-${Date.now()}`;
      
      // 检查消息是否已存在（从当前messages中检查）
      const messages = chatInterface.messages;
      const hasArtifact = messages.some(m => m.id === artifactId);
      const hasUserMessage = messages.some(m => 
        m.metadata?.appId === 'hunt' && m.metadata?.userInput === currentQuery
      );
      
      if (!hasArtifact && !hasUserMessage) {
        // Create user message
        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: currentQuery,
          timestamp: new Date().toISOString(),
          processed: true,
          metadata: {
            type: 'user_input',
            appId: 'hunt',
            appName: 'Hunt',
            appIcon: '🔍'
          }
        };
        stableChatActions.addMessage(userMessage);
        
        // Create artifact message
        const artifactMessage: ChatMessage = {
          id: artifactId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'artifact',
            appId: 'hunt',
            appName: 'Hunt',
            appIcon: '🔍',
            title: 'Searching...',
            userInput: currentQuery,
            artifactData: {
              type: 'search_results',
              content: [],
              metadata: { 
                query: currentQuery, 
                isSearching: true,
                resultCount: 0
              }
            }
          },
          isStreaming: true,
          streamingStatus: 'Searching...'
        };
        stableChatActions.addMessage(artifactMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Hunt search messages created', {
          query: currentQuery,
          userMessageId,
          artifactMessageId: artifactId
        });
      }
      
      // 更新已处理状态
      processedStatesRef.current.hunt = {
        lastQuery: stateKey,
        timestamp: Date.now()
      };
    }
  }, [
    chatInterface.widgetStates.hunt.isSearching,
    chatInterface.widgetStates.hunt.lastQuery,
    stableChatActions
  ]);

  // 监听Hunt搜索完成 - 更新搜索结果
  useEffect(() => {
    const huntState = chatInterface.widgetStates.hunt;
    const currentQuery = huntState.lastQuery;
    const isSearching = huntState.isSearching;
    const searchResults = huntState.searchResults;
    
    // 搜索完成时更新结果
    if (!isSearching && currentQuery && searchResults.length > 0) {
      const messageId = `hunt-${currentQuery}-searching`;
      const messages = chatInterface.messages;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: `Found ${searchResults.length} search results for "${currentQuery}"`,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: `Search Results: ${currentQuery}`,
            artifactData: {
              type: 'search_results',
              content: searchResults,
              metadata: { 
                query: currentQuery, 
                isSearching: false,
                resultCount: searchResults.length
              }
            }
          }
        };
        stableChatActions.addMessage(updatedMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Hunt search results updated', {
          query: currentQuery,
          resultCount: searchResults.length,
          messageId
        });
      }
    }
  }, [
    chatInterface.widgetStates.hunt.isSearching,
    chatInterface.widgetStates.hunt.lastQuery,
    chatInterface.widgetStates.hunt.searchResults.length, // 只监听长度变化
    stableChatActions
  ]);

  // 监听Omni Widget状态变化 - 创建内容生成消息
  useEffect(() => {
    const omniState = chatInterface.widgetStates.omni;
    const currentPrompt = omniState.lastParams?.prompt;
    const isGenerating = omniState.isGenerating;
    
    if (!currentPrompt) return;
    
    const stateKey = `${currentPrompt}-${isGenerating}`;
    const lastProcessed = processedStatesRef.current.omni;
    
    if (lastProcessed?.lastPrompt === stateKey) return;
    
    if (isGenerating) {
      const artifactId = `omni-${currentPrompt}-generating`;
      const userMessageId = `omni-user-${currentPrompt}-${Date.now()}`;
      
      const messages = chatInterface.messages;
      const hasMessages = messages.some(m => 
        m.id === artifactId || (m.metadata?.appId === 'omni' && m.metadata?.userInput === currentPrompt)
      );
      
      if (!hasMessages) {
        // Create user message
        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: currentPrompt,
          timestamp: new Date().toISOString(),
          processed: true,
          metadata: {
            type: 'user_input',
            appId: 'omni',
            appName: 'Omni Content',
            appIcon: '⚡'
          }
        };
        stableChatActions.addMessage(userMessage);
        
        // Create artifact message
        const artifactMessage: ChatMessage = {
          id: artifactId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'artifact',
            appId: 'omni',
            appName: 'Omni Content',
            appIcon: '⚡',
            title: 'Generating Content...',
            userInput: currentPrompt,
            artifactData: {
              type: 'text',
              content: 'Loading...',
              metadata: omniState.lastParams
            }
          },
          isStreaming: true,
          streamingStatus: 'Generating content...'
        };
        stableChatActions.addMessage(artifactMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Omni generation messages created', {
          prompt: currentPrompt,
          userMessageId,
          artifactMessageId: artifactId
        });
      }
      
      processedStatesRef.current.omni = {
        lastPrompt: stateKey,
        timestamp: Date.now()
      };
    }
  }, [
    chatInterface.widgetStates.omni.isGenerating,
    chatInterface.widgetStates.omni.lastParams?.prompt,
    stableChatActions
  ]);

  // 监听Omni生成完成 - 更新生成内容
  useEffect(() => {
    const omniState = chatInterface.widgetStates.omni;
    const currentPrompt = omniState.lastParams?.prompt;
    const isGenerating = omniState.isGenerating;
    const generatedContent = omniState.generatedContent;
    
    if (!isGenerating && currentPrompt && generatedContent) {
      const messageId = `omni-${currentPrompt}-generating`;
      const messages = chatInterface.messages;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: generatedContent,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Generated Content',
            artifactData: {
              type: 'text',
              content: generatedContent,
              metadata: omniState.lastParams
            }
          }
        };
        stableChatActions.addMessage(updatedMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Omni content generation completed', {
          prompt: currentPrompt,
          contentLength: generatedContent.length,
          messageId
        });
      }
    }
  }, [
    chatInterface.widgetStates.omni.isGenerating,
    chatInterface.widgetStates.omni.lastParams?.prompt,
    chatInterface.widgetStates.omni.generatedContent,
    stableChatActions
  ]);

  // 监听DataScientist Widget状态变化 - 创建数据分析消息
  useEffect(() => {
    const dataScientistState = chatInterface.widgetStates.dataScientist;
    const currentQuery = dataScientistState.lastParams?.query;
    const isAnalyzing = dataScientistState.isAnalyzing;
    
    if (!currentQuery) return;
    
    const stateKey = `${currentQuery}-${isAnalyzing}`;
    const lastProcessed = processedStatesRef.current.dataScientist;
    
    if (lastProcessed?.lastQuery === stateKey) return;
    
    if (isAnalyzing) {
      const artifactId = `data-scientist-${currentQuery}-analyzing`;
      const userMessageId = `data-scientist-user-${currentQuery}-${Date.now()}`;
      
      const messages = chatInterface.messages;
      const hasMessages = messages.some(m => 
        m.id === artifactId || (m.metadata?.appId === 'data_scientist' && m.metadata?.userInput === currentQuery)
      );
      
      if (!hasMessages) {
        // Create user message
        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: currentQuery,
          timestamp: new Date().toISOString(),
          processed: true,
          metadata: {
            type: 'user_input',
            appId: 'data_scientist',
            appName: 'DataWise Analytics',
            appIcon: '📊'
          }
        };
        stableChatActions.addMessage(userMessage);
        
        // Create artifact message
        const artifactMessage: ChatMessage = {
          id: artifactId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'artifact',
            appId: 'data_scientist',
            appName: 'DataWise Analytics',
            appIcon: '📊',
            title: 'Analyzing Data...',
            userInput: currentQuery,
            artifactData: {
              type: 'data_analysis',
              content: { 
                analysis: { summary: 'Loading...', insights: [], recommendations: [] }, 
                visualizations: [], 
                statistics: {} 
              },
              metadata: dataScientistState.lastParams
            }
          },
          isStreaming: true,
          streamingStatus: 'Analyzing data...'
        };
        stableChatActions.addMessage(artifactMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'DataScientist analysis messages created', {
          query: currentQuery,
          userMessageId,
          artifactMessageId: artifactId
        });
      }
      
      processedStatesRef.current.dataScientist = {
        lastQuery: stateKey,
        timestamp: Date.now()
      };
    }
  }, [
    chatInterface.widgetStates.dataScientist.isAnalyzing,
    chatInterface.widgetStates.dataScientist.lastParams?.query,
    stableChatActions
  ]);

  // 监听DataScientist分析完成 - 更新分析结果
  useEffect(() => {
    const dataScientistState = chatInterface.widgetStates.dataScientist;
    const currentQuery = dataScientistState.lastParams?.query;
    const isAnalyzing = dataScientistState.isAnalyzing;
    const analysisResult = dataScientistState.analysisResult;
    
    if (!isAnalyzing && currentQuery && analysisResult) {
      const messageId = `data-scientist-${currentQuery}-analyzing`;
      const messages = chatInterface.messages;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: analysisResult.analysis?.summary || 'Analysis completed',
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Data Analysis Results',
            artifactData: {
              type: 'data_analysis',
              content: analysisResult,
              metadata: dataScientistState.lastParams
            }
          }
        };
        stableChatActions.addMessage(updatedMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'DataScientist analysis completed', {
          query: currentQuery,
          messageId
        });
      }
    }
  }, [
    chatInterface.widgetStates.dataScientist.isAnalyzing,
    chatInterface.widgetStates.dataScientist.lastParams?.query,
    chatInterface.widgetStates.dataScientist.analysisResult,
    stableChatActions
  ]);

  // 监听Knowledge Widget状态变化 - 创建文档分析消息
  useEffect(() => {
    const knowledgeState = chatInterface.widgetStates.knowledge;
    const currentQuery = knowledgeState.lastParams?.query;
    const isProcessing = knowledgeState.isProcessing;
    
    if (!currentQuery) return;
    
    const stateKey = `${currentQuery}-${isProcessing}`;
    const lastProcessed = processedStatesRef.current.knowledge;
    
    if (lastProcessed?.lastQuery === stateKey) return;
    
    if (isProcessing) {
      const artifactId = `knowledge-${currentQuery}-processing`;
      const userMessageId = `knowledge-user-${currentQuery}-${Date.now()}`;
      
      const messages = chatInterface.messages;
      const hasMessages = messages.some(m => 
        m.id === artifactId || (m.metadata?.appId === 'knowledge' && m.metadata?.userInput === currentQuery)
      );
      
      if (!hasMessages) {
        // Create user message
        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: currentQuery,
          timestamp: new Date().toISOString(),
          processed: true,
          metadata: {
            type: 'user_input',
            appId: 'knowledge',
            appName: 'Knowledge Hub',
            appIcon: '📚'
          }
        };
        stableChatActions.addMessage(userMessage);
        
        // Create artifact message
        const artifactMessage: ChatMessage = {
          id: artifactId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'artifact',
            appId: 'knowledge',
            appName: 'Knowledge Hub',
            appIcon: '📚',
            title: 'Analyzing Documents...',
            userInput: currentQuery,
            artifactData: {
              type: 'document_analysis',
              content: 'Loading...',
              metadata: { 
                ...knowledgeState.lastParams,
                documentCount: knowledgeState.documents.length
              }
            }
          },
          isStreaming: true,
          streamingStatus: 'Analyzing documents...'
        };
        stableChatActions.addMessage(artifactMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Knowledge analysis messages created', {
          query: currentQuery,
          documentCount: knowledgeState.documents.length,
          userMessageId,
          artifactMessageId: artifactId
        });
      }
      
      processedStatesRef.current.knowledge = {
        lastQuery: stateKey,
        timestamp: Date.now()
      };
    }
  }, [
    chatInterface.widgetStates.knowledge.isProcessing,
    chatInterface.widgetStates.knowledge.lastParams?.query,
    chatInterface.widgetStates.knowledge.documents.length, // 只监听长度变化
    stableChatActions
  ]);

  // 监听Knowledge分析完成 - 更新分析结果
  useEffect(() => {
    const knowledgeState = chatInterface.widgetStates.knowledge;
    const currentQuery = knowledgeState.lastParams?.query;
    const isProcessing = knowledgeState.isProcessing;
    const analysisResult = knowledgeState.analysisResult;
    
    if (!isProcessing && currentQuery && analysisResult) {
      const messageId = `knowledge-${currentQuery}-processing`;
      const messages = chatInterface.messages;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: analysisResult,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Document Analysis Results',
            artifactData: {
              type: 'document_analysis',
              content: analysisResult,
              metadata: { 
                ...knowledgeState.lastParams,
                documentCount: knowledgeState.documents.length
              }
            }
          }
        };
        stableChatActions.addMessage(updatedMessage);
        
        logger.info(LogCategory.CHAT_FLOW, 'Knowledge analysis completed', {
          query: currentQuery,
          documentCount: knowledgeState.documents.length,
          messageId
        });
      }
    }
  }, [
    chatInterface.widgetStates.knowledge.isProcessing,
    chatInterface.widgetStates.knowledge.lastParams?.query,
    chatInterface.widgetStates.knowledge.analysisResult,
    chatInterface.widgetStates.knowledge.documents.length, // 只监听长度变化
    stableChatActions
  ]);

  // ================================================================================
  // 消息发送业务逻辑 - 原有的消息发送处理
  // ================================================================================
  
  // Business logic: Handle message sending
  const handleSendMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    
    // CRITICAL: Check user credits before sending message
    
    if (!userModule.hasCredits) {
      console.warn('💳 CHAT_MODULE: User has no credits, blocking message send');
      
      // Show elegant upgrade modal instead of window.confirm
      setShowUpgradeModal(true);
      
      // Prevent message from being sent
      return;
    }
    
    
    // Ensure we have a valid session before sending message
    let sessionId = currentSession?.id;
    
    if (!currentSession || !sessionId) {
      // Auto-create a new session if none exists
      const newSessionTitle = `New Chat ${new Date().toLocaleTimeString()}`;
      const newSession = sessionActions.createSession(newSessionTitle);
      sessionActions.selectSession(newSession.id);
      sessionId = newSession.id;
      
      logger.info(LogCategory.CHAT_FLOW, 'Auto-creating session for message sending', {
        sessionId: newSession.id,
        messagePreview: content.substring(0, 50)
      });
      
      console.log('📝 CHAT_MODULE: Auto-created new session for message:', {
        sessionId: newSession.id,
        title: newSession.title
      });
    }
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      auth0_id: auth0User?.sub || 'anonymous',
      session_id: sessionId
    };
    
    // Create user message and add to store
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      metadata: enrichedMetadata,
      processed: true // Mark as processed since we're handling it directly
    };
    
    console.log('📨 CHAT_MODULE: Adding user message to store');
    chatActions.addMessage(userMessage);
    
    // 直接调用 sendMessage API，不再依赖 reactive subscriber
    console.log('📨 CHAT_MODULE: Calling sendMessage API directly');
    
    try {
      // 获取用户token用于API认证
      const token = await userModule.getAccessToken();
      console.log('🔑 CHAT_MODULE: Retrieved access token for API call');
      
      await chatActions.sendMessage(content, enrichedMetadata, token);
      console.log('✅ CHAT_MODULE: Message sent successfully');
    } catch (error) {
      console.error('❌ CHAT_MODULE: Failed to send message:', error);
      throw error; // Re-throw to let the UI handle the error
    }
  }, [stableChatActions, auth0User, currentSession, sessionActions, userModule]);

  // Business logic: Handle multimodal message sending
  const handleSendMultimodal = useCallback(async (content: string, files: File[], metadata?: Record<string, any>) => {
    console.log('📨 CHAT_MODULE: sendMultimodalMessage called with:', content, files.length, 'files');
    
    // CRITICAL: Check user credits before sending multimodal message
    if (!userModule.hasCredits) {
      console.warn('💳 CHAT_MODULE: User has no credits, blocking multimodal message send');
      
      // Show elegant upgrade prompt for multimodal
      const shouldUpgrade = window.confirm(
        `💳 No Credits Remaining\n\n` +
        `You've used all your available credits. Multimodal messages (with files) require credits to process.\n\n` +
        `Current Plan: ${userModule.currentPlan.toUpperCase()}\n` +
        `Credits: ${userModule.credits} / ${userModule.totalCredits}\n\n` +
        `Would you like to upgrade your plan now?`
      );
      
      if (shouldUpgrade) {
        // Navigate to pricing page or open upgrade modal
        try {
          const checkoutUrl = await userModule.createCheckout('pro');
          window.open(checkoutUrl, '_blank');
        } catch (error) {
          console.error('Failed to create checkout:', error);
          // Fallback to pricing page
          window.open('/pricing', '_blank');
        }
      }
      
      // Prevent message from being sent
      return;
    }
    
    console.log('✅ CHAT_MODULE: Credit check passed for multimodal, proceeding with message send');
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      auth0_id: auth0User?.sub || 'anonymous',
      session_id: metadata?.session_id || 'default',
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })) // Add file info to metadata
    };
    
    // Create user message and add to store
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      metadata: enrichedMetadata,
      processed: true // Mark as processed since we're handling it directly
    };
    
    console.log('📨 CHAT_MODULE: Adding multimodal user message to store');
    chatActions.addMessage(userMessage);
    
    // 直接调用 sendMessage API (multimodal is handled by metadata)
    console.log('📨 CHAT_MODULE: Calling sendMessage API for multimodal content');
    
    try {
      // 获取用户token用于API认证
      const token = await userModule.getAccessToken();
      console.log('🔑 CHAT_MODULE: Retrieved access token for multimodal API call');
      
      await chatActions.sendMessage(content, enrichedMetadata, token);
      console.log('✅ CHAT_MODULE: Multimodal message sent successfully');
    } catch (error) {
      console.error('❌ CHAT_MODULE: Failed to send multimodal message:', error);
      throw error;
    }
  }, [chatActions, auth0User, userModule]);

  // Handle upgrade modal actions
  const handleUpgrade = useCallback(async (planType: 'pro' | 'enterprise') => {
    try {
      const checkoutUrl = await userModule.createCheckout(planType);
      window.open(checkoutUrl, '_blank');
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Failed to create checkout:', error);
      // Fallback to pricing page
      window.open('/pricing', '_blank');
      setShowUpgradeModal(false);
    }
  }, [userModule]);

  const handleViewPricing = useCallback(() => {
    window.open('/pricing', '_blank');
    setShowUpgradeModal(false);
  }, []);

  // Pass all data and business logic callbacks as props to pure UI component
  return (
    <>
      <ChatLayout
        {...props}
        messages={chatInterface.messages}
        isLoading={chatInterface.isLoading}
        isTyping={chatInterface.isTyping}
        onSendMessage={handleSendMessage}
        onSendMultimodal={handleSendMultimodal}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userModule.currentPlan}
        credits={userModule.credits}
        totalCredits={userModule.totalCredits}
        onUpgrade={handleUpgrade}
        onViewPricing={handleViewPricing}
      />
    </>
  );
};