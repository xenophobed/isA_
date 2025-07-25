/**
 * ============================================================================
 * Assistant Widget Module (AssistantWidgetModule.tsx) - Assistant小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理Assistant小部件的所有业务逻辑
 * - 管理AI对话和上下文的流程
 * - 封装用户输入处理和结果管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Assistant小部件业务逻辑的统一管理
 *   - AI客户端和状态管理的集成
 *   - 对话请求的协调
 *   - 用户输入的处理和验证
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由AssistantWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → AssistantWidgetModule → AssistantWidget UI
 * hooks → AssistantWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { AssistantWidgetParams, AssistantWidgetResult } from '../../types/widgetTypes';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';

interface AssistantWidgetModuleProps {
  triggeredInput?: string;
  onResponseGenerated?: (result: AssistantWidgetResult) => void;
  children: (moduleProps: {
    isProcessing: boolean;
    conversationContext: any;
    onSendMessage: (params: AssistantWidgetParams) => Promise<void>;
    onClearContext: () => void;
  }) => React.ReactNode;
}

/**
 * Assistant Widget Module - Business logic module for Assistant widget
 * 
 * This module:
 * - Uses hooks to get assistant widget state and AI client
 * - Handles all AI conversation business logic
 * - Manages user input processing and context
 * - Passes pure data and callbacks to Assistant UI component
 * - Keeps Assistant UI component pure
 */
export const AssistantWidgetModule: React.FC<AssistantWidgetModuleProps> = ({
  triggeredInput,
  onResponseGenerated,
  children
}) => {
  // Get assistant widget state using hooks
  const { assistantState } = useWidget();
  const { assistant: assistantActions } = useWidgetActions();
  
  console.log('🤖 ASSISTANT_MODULE: Providing data to Assistant UI:', {
    isProcessing: assistantState.isProcessing,
    hasContext: !!assistantState.conversationContext,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !assistantState.isProcessing) {
      console.log('🤖 ASSISTANT_MODULE: Processing triggered input:', triggeredInput);
      
      const params: AssistantWidgetParams = {
        task: triggeredInput,
        context: assistantState.conversationContext
      };
      
      handleSendMessage(params);
    }
  }, [triggeredInput, assistantState.isProcessing]);
  
  // Business logic: Handle assistant message via WidgetHandler
  const handleSendMessage = useCallback(async (params: AssistantWidgetParams) => {
    console.log('🤖 ASSISTANT_MODULE: sendMessage called with:', params);
    
    if (!params.task) {
      console.error('❌ ASSISTANT_MODULE: No task provided');
      return;
    }
    
    // Use WidgetHandler to route request to store → chatService → API
    console.log('🔄 ASSISTANT_MODULE: Routing request via WidgetHandler');
    logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant module routing request via WidgetHandler', { params });
    
    try {
      await widgetHandler.processRequest({
        type: 'assistant',
        params,
        sessionId: 'assistant_widget',
        userId: 'widget_user'
      });
      
      console.log('✅ ASSISTANT_MODULE: Request successfully routed to store');
    } catch (error) {
      console.error('❌ ASSISTANT_MODULE: WidgetHandler request failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Assistant WidgetHandler request failed', { error, params });
    }
    
  }, []);
  
  // Monitor assistant state changes to notify parent component
  useEffect(() => {
    if (assistantState.conversationContext && !assistantState.isProcessing) {
      // Notify parent component when response is generated
      const result: AssistantWidgetResult = {
        response: assistantState.conversationContext.response || '',
        confidence: 0.8,
        suggestions: [],
        followUpQuestions: [],
        context: assistantState.conversationContext
      };
      onResponseGenerated?.(result);
      logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant response completed, parent notified');
    }
  }, [assistantState.conversationContext, assistantState.isProcessing, onResponseGenerated]);
  
  // Business logic: Clear conversation context
  const handleClearContext = useCallback(() => {
    console.log('🤖 ASSISTANT_MODULE: Clearing context');
    assistantActions.clearAssistantData();
    logger.info(LogCategory.ARTIFACT_CREATION, 'Assistant context cleared');
  }, [assistantActions]);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isProcessing: assistantState.isProcessing,
        conversationContext: assistantState.conversationContext,
        onSendMessage: handleSendMessage,
        onClearContext: handleClearContext
      })}
    </>
  );
};