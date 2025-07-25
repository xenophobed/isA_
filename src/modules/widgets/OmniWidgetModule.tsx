/**
 * ============================================================================
 * Omni Widget Module (OmniWidgetModule.tsx) - Omni小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理Omni小部件的所有业务逻辑
 * - 管理多用途内容生成的流程
 * - 封装内容生成参数处理和结果管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Omni小部件业务逻辑的统一管理
 *   - AI内容生成和状态管理的集成
 *   - 内容生成请求的协调
 *   - 用户输入的处理和验证
 *   - 生成结果的处理和格式化
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由OmniWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → OmniWidgetModule → OmniWidget UI
 * hooks → OmniWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { OmniWidgetParams, OmniWidgetResult } from '../../types/widgetTypes';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';

interface OmniWidgetModuleProps {
  triggeredInput?: string;
  onContentGenerated?: (result: OmniWidgetResult) => void;
  children: (moduleProps: {
    isGenerating: boolean;
    generatedContent: string | null;
    lastParams: OmniWidgetParams | null;
    onGenerateContent: (params: OmniWidgetParams) => Promise<void>;
    onClearContent: () => void;
  }) => React.ReactNode;
}

/**
 * Omni Widget Module - Business logic module for Omni widget
 * 
 * This module:
 * - Uses hooks to get omni widget state and AI client
 * - Handles all content generation business logic
 * - Manages user input processing and validation
 * - Passes pure data and callbacks to Omni UI component
 * - Keeps Omni UI component pure
 */
export const OmniWidgetModule: React.FC<OmniWidgetModuleProps> = ({
  triggeredInput,
  onContentGenerated,
  children
}) => {
  // Get omni widget state using hooks
  const { omniState } = useWidget();
  const { omni: omniActions } = useWidgetActions();
  
  console.log('⚡ OMNI_MODULE: Providing data to Omni UI:', {
    isGenerating: omniState.isGenerating,
    hasContent: !!omniState.generatedContent,
    hasParams: !!omniState.lastParams,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Analyze input and determine content generation parameters
  const analyzeInputAndCreateParams = (input: string): OmniWidgetParams | null => {
    const lowerInput = input.toLowerCase();
    
    // Determine content type based on keywords
    let contentType: 'text' | 'code' | 'markdown' | 'email' | 'social' = 'text';
    let tone: 'professional' | 'casual' | 'creative' | 'technical' = 'professional';
    let length: 'short' | 'medium' | 'long' = 'medium';
    
    // Content type detection
    if (lowerInput.includes('code') || lowerInput.includes('program') || lowerInput.includes('script')) {
      contentType = 'code';
      tone = 'technical';
    } else if (lowerInput.includes('email') || lowerInput.includes('letter')) {
      contentType = 'email';
      tone = 'professional';
    } else if (lowerInput.includes('social') || lowerInput.includes('post') || lowerInput.includes('tweet')) {
      contentType = 'social';
      tone = 'casual';
      length = 'short';
    } else if (lowerInput.includes('markdown') || lowerInput.includes('documentation') || lowerInput.includes('readme')) {
      contentType = 'markdown';
      tone = 'technical';
    }
    
    // Tone detection
    if (lowerInput.includes('casual') || lowerInput.includes('friendly') || lowerInput.includes('informal')) {
      tone = 'casual';
    } else if (lowerInput.includes('creative') || lowerInput.includes('artistic') || lowerInput.includes('fun')) {
      tone = 'creative';
    } else if (lowerInput.includes('technical') || lowerInput.includes('formal') || lowerInput.includes('detailed')) {
      tone = 'technical';
    }
    
    // Length detection
    if (lowerInput.includes('short') || lowerInput.includes('brief') || lowerInput.includes('quick')) {
      length = 'short';
    } else if (lowerInput.includes('long') || lowerInput.includes('detailed') || lowerInput.includes('comprehensive')) {
      length = 'long';
    }
    
    return {
      prompt: input,
      contentType,
      tone,
      length
    };
  };
  
  // Business logic: Handle content generation via useWidget actions
  const handleGenerateContent = useCallback(async (params: OmniWidgetParams) => {
    console.log('⚡ OMNI_MODULE: generateContent called with:', params);
    
    if (!params.prompt) {
      console.error('❌ OMNI_MODULE: No prompt provided');
      return;
    }
    
    try {
      logger.info(LogCategory.ARTIFACT_CREATION, 'Starting content generation via omniActions', { params });
      
      // Use omni actions from useWidget hook
      await omniActions.triggerOmniGeneration(params);
      
      logger.info(LogCategory.ARTIFACT_CREATION, 'Content generation request sent via omniActions');
      console.log('✅ OMNI_MODULE: Content generation request processed');
      
    } catch (error) {
      console.error('❌ OMNI_MODULE: Content generation failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Content generation failed', { error, params });
    }
  }, [omniActions]);
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !omniState.isGenerating) {
      console.log('⚡ OMNI_MODULE: Processing triggered input:', triggeredInput);
      
      // Analyze input to determine content type and generate parameters
      const params = analyzeInputAndCreateParams(triggeredInput);
      if (params) {
        handleGenerateContent(params);
      }
    }
  }, [triggeredInput, omniState.isGenerating, handleGenerateContent]);
  
  // Monitor omni state changes to notify parent component
  useEffect(() => {
    if (omniState.generatedContent && omniState.lastParams && !omniState.isGenerating) {
      // Create result and notify parent component when content is generated
      const result: OmniWidgetResult = {
        content: omniState.generatedContent,
        contentType: omniState.lastParams.contentType || 'text',
        metadata: {
          wordCount: omniState.generatedContent.split(' ').length,
          tone: omniState.lastParams.tone || 'professional',
          generatedAt: new Date().toISOString()
        }
      };
      
      onContentGenerated?.(result);
      logger.info(LogCategory.ARTIFACT_CREATION, 'Omni content generation completed, parent notified');
    }
  }, [omniState.generatedContent, omniState.lastParams, omniState.isGenerating, onContentGenerated]);
  
  // Business logic: Clear generated content
  const handleClearContent = useCallback(() => {
    console.log('⚡ OMNI_MODULE: Clearing content');
    omniActions.clearOmniData();
    logger.info(LogCategory.ARTIFACT_CREATION, 'Omni content cleared');
  }, [omniActions]);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isGenerating: omniState.isGenerating,
        generatedContent: omniState.generatedContent,
        lastParams: omniState.lastParams,
        onGenerateContent: handleGenerateContent,
        onClearContent: handleClearContent
      })}
    </>
  );
};