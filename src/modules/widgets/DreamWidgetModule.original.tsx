/**
 * ============================================================================
 * Dream Widget Module (DreamWidgetModule.tsx) - Dream小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理Dream小部件的所有业务逻辑
 * - 管理AI图像生成的流程和状态
 * - 封装用户输入处理和结果管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Dream小部件业务逻辑的统一管理
 *   - AI客户端和状态管理的集成
 *   - 图像生成请求的协调
 *   - 用户输入的处理和验证
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由DreamWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → DreamWidgetModule → DreamWidget UI
 * hooks → DreamWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { DreamWidgetParams, DreamWidgetResult } from '../../types/widgetTypes';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';

interface DreamWidgetModuleProps {
  triggeredInput?: string;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  children: (moduleProps: {
    isGenerating: boolean;
    generatedImage: string | null;
    lastParams: DreamWidgetParams | null;
    onGenerateImage: (params: DreamWidgetParams) => Promise<void>;
    onClearImage: () => void;
  }) => React.ReactNode;
}

/**
 * Dream Widget Module - Business logic module for Dream widget
 * 
 * This module:
 * - Uses hooks to get dream widget state and AI client
 * - Handles all image generation business logic
 * - Manages user input processing and validation
 * - Passes pure data and callbacks to Dream UI component
 * - Keeps Dream UI component pure
 */
export const DreamWidgetModule: React.FC<DreamWidgetModuleProps> = ({
  triggeredInput,
  onImageGenerated,
  children
}) => {
  // Get dream widget state using hooks
  const { dreamState } = useWidget();
  const { dream: dreamActions } = useWidgetActions();
  
  console.log('🎨 DREAM_MODULE: Providing data to Dream UI:', {
    isGenerating: dreamState.isGenerating,
    hasImage: !!dreamState.generatedImage,
    hasParams: !!dreamState.lastParams,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Extract image prompt from user input
  const extractPromptFromInput = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    // Common trigger patterns for image generation
    const patterns = [
      /create (?:an? )?image (?:of )?(.+)/i,
      /generate (?:an? )?image (?:of )?(.+)/i,
      /draw (?:an? )?(.+)/i,
      /make (?:an? )?image (?:of )?(.+)/i,
      /show me (?:an? )?image (?:of )?(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches, use the input as is if it seems like an image prompt
    if (lowerInput.includes('image') || lowerInput.includes('picture') || lowerInput.includes('photo')) {
      return input;
    }
    
    return null;
  };
  
  // Business logic: Handle image generation via WidgetHandler
  const handleGenerateImage = useCallback(async (params: DreamWidgetParams) => {
    console.log('🎨 DREAM_MODULE: generateImage called with:', params);
    
    if (!params.prompt) {
      console.error('❌ DREAM_MODULE: No prompt provided');
      return;
    }
    
    // Use WidgetHandler to route request to store → chatService → API
    console.log('🔄 DREAM_MODULE: Routing request via WidgetHandler');
    logger.info(LogCategory.ARTIFACT_CREATION, 'Dream module routing request via WidgetHandler', { params });
    
    try {
      await widgetHandler.processRequest({
        type: 'dream',
        params,
        sessionId: 'dream_widget',
        userId: 'widget_user'
      });
      
      console.log('✅ DREAM_MODULE: Request successfully routed to store');
    } catch (error) {
      console.error('❌ DREAM_MODULE: WidgetHandler request failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Dream WidgetHandler request failed', { error, params });
    }
    
  }, []);
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !dreamState.isGenerating) {
      console.log('🎨 DREAM_MODULE: Processing triggered input:', triggeredInput);
      
      // Extract prompt from triggered input
      const prompt = extractPromptFromInput(triggeredInput);
      if (prompt) {
        const params: DreamWidgetParams = {
          prompt,
          style: 'realistic',
          size: '1024x1024',
          quality: 'standard'
        };
        
        handleGenerateImage(params);
      }
    }
  }, [triggeredInput, dreamState.isGenerating, handleGenerateImage]);
  
  // Monitor dream state changes to notify parent component
  useEffect(() => {
    if (dreamState.generatedImage && dreamState.lastParams && !dreamState.isGenerating) {
      // Notify parent component when image is generated
      onImageGenerated?.(dreamState.generatedImage, dreamState.lastParams.prompt);
      logger.info(LogCategory.ARTIFACT_CREATION, 'Dream image generation completed, parent notified');
    }
  }, [dreamState.generatedImage, dreamState.lastParams, dreamState.isGenerating, onImageGenerated]);
  
  // Business logic: Clear generated image
  const handleClearImage = useCallback(() => {
    console.log('🎨 DREAM_MODULE: Clearing image');
    dreamActions.clearDreamData();
    logger.info(LogCategory.ARTIFACT_CREATION, 'Dream image cleared');
  }, [dreamActions]);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isGenerating: dreamState.isGenerating,
        generatedImage: dreamState.generatedImage,
        lastParams: dreamState.lastParams,
        onGenerateImage: handleGenerateImage,
        onClearImage: handleClearImage
      })}
    </>
  );
};