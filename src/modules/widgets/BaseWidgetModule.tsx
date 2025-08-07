/**
 * ============================================================================
 * Base Widget Module (BaseWidgetModule.tsx) - Standardized Widget Module Base Class
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provides standardized business logic patterns for all widget modules
 * - Manages common widget state operations and lifecycle
 * - Integrates with BaseWidget UI component seamlessly
 * - Simplifies individual widget module implementations
 * 
 * Features:
 * - Output history management
 * - Streaming status handling
 * - Standard processing patterns
 * - Triggered input processing
 * - Error handling and logging
 */
import React, { useCallback, useEffect, useState, useRef, ReactNode } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';
import { WidgetType } from '../../types/widgetTypes';
import { 
  BaseWidget, 
  OutputHistoryItem, 
  EditAction, 
  ManagementAction 
} from '../../components/ui/widgets/BaseWidget';
import {
  DreamWidgetParams,
  DreamWidgetResult,
  HuntWidgetParams,
  HuntWidgetResult,
  OmniWidgetParams,
  OmniWidgetResult,
  DataScientistWidgetParams,
  DataScientistWidgetResult,
  KnowledgeWidgetParams,
  KnowledgeWidgetResult
} from '../../types/widgetTypes';

// Generic widget params interface
interface BaseWidgetParams {
  [key: string]: any;
}

// Generic widget result interface
interface BaseWidgetResult {
  [key: string]: any;
}

// Result extraction configuration for different widget types
interface ResultExtractorConfig {
  outputType: 'text' | 'image' | 'data' | 'analysis' | 'search' | 'knowledge';
  extractResult?: (widgetData: any) => {
    finalResult: any;
    outputContent: string;
    title?: string;
  } | null;
}

// Widget module configuration
interface WidgetModuleConfig<TParams = BaseWidgetParams, TResult = BaseWidgetResult> {
  // Widget identification
  type: WidgetType;
  title: string;
  icon: string;
  
  // Processing configuration
  sessionIdPrefix: string;
  
  // Output management
  maxHistoryItems?: number;
  
  // Result processing configuration
  resultExtractor?: ResultExtractorConfig;
  
  // Callbacks
  onProcessStart?: (params: TParams) => void;
  onProcessComplete?: (result: TResult) => void;
  onProcessError?: (error: Error) => void;
  
  // Input processing
  extractParamsFromInput?: (input: string) => TParams | null;
  
  // UI customization
  editActions?: EditAction[];
  managementActions?: ManagementAction[];
}

// Base widget module props
interface BaseWidgetModuleProps<TParams = BaseWidgetParams, TResult = BaseWidgetResult> {
  config: WidgetModuleConfig<TParams, TResult>;
  triggeredInput?: string;
  onResultGenerated?: (result: TResult) => void;
  children: ReactNode | ((moduleProps: {
    isProcessing: boolean;
    outputHistory: OutputHistoryItem[];
    currentOutput: OutputHistoryItem | null;
    isStreaming: boolean;
    streamingContent: string;
    startProcessing: (params: TParams) => Promise<void>;
    onSelectOutput: (item: OutputHistoryItem) => void;
    onClearHistory: () => void;
  }) => ReactNode);
}

/**
 * BaseWidgetModule - Standardized business logic base for all widget modules
 */
export const BaseWidgetModule = <TParams extends BaseWidgetParams, TResult extends BaseWidgetResult>({
  config,
  triggeredInput,
  onResultGenerated,
  children
}: BaseWidgetModuleProps<TParams, TResult>) => {
  
  // Local state for output history and current processing
  const [outputHistory, setOutputHistory] = useState<OutputHistoryItem[]>([]);
  const [currentOutput, setCurrentOutput] = useState<OutputHistoryItem | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use refs to access current state without triggering dependencies
  const isProcessingRef = useRef(isProcessing);
  const currentOutputRef = useRef(currentOutput);
  
  // Update refs when state changes
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { currentOutputRef.current = currentOutput; }, [currentOutput]);
  
  console.log(`🔧 ${config.type.toUpperCase()}_MODULE: Initializing with config:`, {
    type: config.type,
    title: config.title,
    maxHistory: config.maxHistoryItems,
    hasTriggeredInput: !!triggeredInput
  });
  
  console.log(`🚨DEBUG_WIDGET🚨 ${config.type.toUpperCase()}_MODULE: Mounted and running`);
  
  // Add item to output history
  const addToHistory = useCallback((item: Omit<OutputHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: OutputHistoryItem = {
      ...item,
      id: `${config.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    };
    
    setOutputHistory(prev => {
      const newHistory = [historyItem, ...prev];
      const maxItems = config.maxHistoryItems || 50;
      return newHistory.slice(0, maxItems);
    });
    
    setCurrentOutput(historyItem);
    
    console.log(`📋 ${config.type.toUpperCase()}_MODULE: Added to history:`, historyItem.title);
    return historyItem;
  }, [config.type, config.maxHistoryItems]);
  
  // Update current output item
  const updateCurrentOutput = useCallback((updates: Partial<OutputHistoryItem>) => {
    console.log(`🔍 ${config.type.toUpperCase()}_MODULE: updateCurrentOutput called:`, {
      hasCurrentOutput: !!currentOutput,
      currentOutput: currentOutput,
      updates: updates
    });
    
    if (!currentOutput) {
      console.warn(`⚠️ ${config.type.toUpperCase()}_MODULE: No currentOutput to update, creating new one`);
      // 创建新的output如果不存在
      const newOutput = {
        id: `output_${Date.now()}`,
        timestamp: new Date(),
        type: 'text' as const,
        title: 'Processing...',
        content: '',
        ...updates
      };
      setCurrentOutput(newOutput);
      console.log(`📋 ${config.type.toUpperCase()}_MODULE: Created new currentOutput:`, newOutput);
      return;
    }
    
    const updatedOutput = { ...currentOutput, ...updates };
    setCurrentOutput(updatedOutput);
    
    console.log(`📋 ${config.type.toUpperCase()}_MODULE: Updated currentOutput:`, updatedOutput);
    
    // Update in history as well
    setOutputHistory(prev =>
      prev.map(item => item.id === currentOutput.id ? updatedOutput : item)
    );
  }, [currentOutput, config.type]);
  
  // Start processing with streaming support
  const startProcessing = useCallback(async (params: TParams): Promise<void> => {
    console.log(`🚀 ${config.type.toUpperCase()}_MODULE: Starting processing with params:`, params);
    
    setIsProcessing(true);
    setIsStreaming(true);
    setStreamingContent('');
    
    // Create unique message IDs to prevent duplicates
    const timestamp = Date.now();
    const uniqueId = `${config.type}_${timestamp}_${Math.random().toString(36).substring(2, 11)}`;
    
    // ❌ REMOVED: Message creation logic moved to ChatModule
    // Widget modules should NOT create messages directly
    // All message creation is now handled by ChatModule via PluginManager
    
    // Add initial output item
    const outputItem = addToHistory({
      type: 'text',
      title: `Processing ${config.type} request...`,
      content: 'Starting processing...',
      params,
      isStreaming: true
    });
    
    // Call start callback
    config.onProcessStart?.(params);
    
    try {
      // Use WidgetHandler to route request with streaming callbacks
      console.log('🔥MODULE_DATA_FLOW🔥 BaseWidgetModule 转发数据到 WidgetHandler:', {
        type: config.type,
        params,
        sessionId: `${config.sessionIdPrefix}_${Date.now()}`
      });
      logger.info(LogCategory.ARTIFACT_CREATION, `${config.type} module routing request via WidgetHandler`, { params });
      
      // 🆕 等待Plugin结果时显示loading状态
      setIsStreaming(true);
      setStreamingContent('Processing request...');
      
      const pluginResult = await widgetHandler.processRequest({
        type: config.type,
        params,
        sessionId: `${config.sessionIdPrefix}_${Date.now()}`,
        userId: 'widget_user'
      });
      
      console.log(`🔌 ${config.type.toUpperCase()}_MODULE: WidgetHandler returned:`, pluginResult);
      
      // 🆕 如果是Plugin模式，处理返回的结果
      if (pluginResult && pluginResult.content) {
        console.log(`🔌 ${config.type.toUpperCase()}_MODULE: Received Plugin result:`, pluginResult);
        
        // 更新Widget的output显示
        const outputUpdate = {
          type: pluginResult.type || 'text', // 使用Plugin返回的实际类型
          title: `${config.type} completed`,
          content: pluginResult.content,
          timestamp: new Date()
        };
        
        console.log(`🔌 ${config.type.toUpperCase()}_MODULE: Updating currentOutput with:`, outputUpdate);
        updateCurrentOutput(outputUpdate);
        
        // 🆕 清除所有loading状态
        setIsStreaming(false);
        setStreamingContent('');
        setIsProcessing(false); // 🚀 设置处理完成
        
        // 调用完成回调
        config.onProcessComplete?.(pluginResult);
        
      } else {
        console.log(`✅ ${config.type.toUpperCase()}_MODULE: Request successfully routed to store (Independent mode)`);
      }
      
    } catch (error) {
      console.error(`❌ ${config.type.toUpperCase()}_MODULE: WidgetHandler request failed:`, error);
      logger.error(LogCategory.ARTIFACT_CREATION, `${config.type} WidgetHandler request failed`, { error, params });
      
      // Update output with error
      updateCurrentOutput({
        type: 'error',
        title: `${config.type} processing failed`,
        content: error instanceof Error ? error.message : 'Unknown error occurred',
        isStreaming: false
      });
      
      // 🆕 清除loading状态 
      setIsStreaming(false);
      setStreamingContent('');
      
      config.onProcessError?.(error instanceof Error ? error : new Error('Unknown error'));
      
      setIsProcessing(false);
    }
  }, [config, addToHistory, updateCurrentOutput, onResultGenerated]);
  
  // Handle triggered input processing
  useEffect(() => {
    if (triggeredInput && !isProcessing && config.extractParamsFromInput) {
      console.log(`🎯 ${config.type.toUpperCase()}_MODULE: Processing triggered input:`, triggeredInput);
      
      const params = config.extractParamsFromInput(triggeredInput);
      if (params) {
        startProcessing(params);
      } else {
        console.log(`⚠️ ${config.type.toUpperCase()}_MODULE: Could not extract params from input:`, triggeredInput);
      }
    }
  }, [triggeredInput, isProcessing, config, startProcessing]);
  
  // Real-time monitoring of widget store states (replace placeholder timer with actual state monitoring)
  const widget = useWidget();
  const widgetState = widget.currentWidgetState;
  const widgetData = widget.currentWidgetData;
  
  // Debug: Log widget data changes with more detail
  console.log(`🔍 ${config.type.toUpperCase()}_MODULE: Widget data:`, {
    widgetState,
    widgetData,
    hasGeneratedImage: !!widgetData?.generatedImage,
    currentOutput: !!currentOutput,
    generatedImageUrl: widgetData?.generatedImage?.substring(0, 80),
    currentOutputContent: currentOutput?.content?.substring(0, 80),
    isCurrentApp: config.type === widget.currentApp
  });
  
  useEffect(() => {
    // Monitor actual widget state changes instead of using placeholder timer
    if (config.type === widget.currentApp) {
      const wasProcessing = isProcessingRef.current;
      const isCurrentlyProcessing = widgetState !== 'idle';
      const currentOutputValue = currentOutputRef.current;
      
      console.log(`🔍 ${config.type.toUpperCase()}_MODULE: State check:`, {
        wasProcessing,
        isCurrentlyProcessing,
        widgetState,
        hasWidgetData: !!widgetData,
        generatedImage: widgetData?.generatedImage?.substring(0, 50),
        currentOutputExists: !!currentOutputValue
      });
      
      // If processing just completed OR if we have new data that needs to be displayed
      const hasNewData = widgetData && (
        (widgetData.generatedImage && (!currentOutputValue || currentOutputValue.content !== widgetData.generatedImage)) ||
        (widgetData.generatedContent && (!currentOutputValue || currentOutputValue.content !== widgetData.generatedContent)) ||
        (widgetData.searchResults && widgetData.searchResults.length > 0 && (!currentOutputValue || currentOutputValue.type !== 'data')) ||
        (widgetData.analysisResult && (!currentOutputValue || currentOutputValue.type !== 'analysis'))
      );
      
      if ((wasProcessing && !isCurrentlyProcessing) || hasNewData) {
        console.log(`✅ ${config.type.toUpperCase()}_MODULE: Updating output - processing completed or new data:`, {
          wasProcessing,
          isCurrentlyProcessing, 
          hasNewData,
          hasGeneratedImage: !!widgetData?.generatedImage,
          hasCurrentOutput: !!currentOutputValue,
          currentOutputContent: currentOutputValue?.content?.substring(0, 50)
        });
        
        // Get actual result from widget data using configurable extractor
        let finalResult = null;
        let outputType = config.resultExtractor?.outputType || 'text';
        let outputContent = 'Processing completed successfully';
        let outputTitle = `${config.type} processing completed`;
        
        if (config.resultExtractor?.extractResult) {
          const extractedResult = config.resultExtractor.extractResult(widgetData);
          if (extractedResult) {
            finalResult = extractedResult.finalResult;
            outputContent = extractedResult.outputContent;
            outputTitle = extractedResult.title || outputTitle;
            console.log(`✅ ${config.type.toUpperCase()}_MODULE: Extracted result using custom extractor:`, { 
              hasResult: !!finalResult,
              contentLength: outputContent?.length 
            });
          }
        } else {
          // Fallback: use generic extraction based on widget data structure
          if (widgetData?.generatedImage) {
            finalResult = { imageUrl: widgetData.generatedImage, prompt: widgetData.params?.prompt };
            outputType = 'image';
            outputContent = widgetData.generatedImage;
          } else if (widgetData?.searchResults?.length > 0) {
            finalResult = { searchResults: widgetData?.searchResults || [], query: widgetData?.lastQuery || '' };
            outputType = 'data';
            outputContent = widgetData?.searchResults?.[0]?.content || JSON.stringify(widgetData?.searchResults || []);
          } else if (widgetData?.generatedContent) {
            finalResult = { content: widgetData.generatedContent, params: widgetData?.params };
            outputType = 'text';
            outputContent = widgetData.generatedContent;
          } else if (widgetData?.analysisResult) {
            finalResult = { analysis: widgetData.analysisResult };
            outputType = 'analysis';
            outputContent = typeof widgetData.analysisResult === 'string' ? widgetData.analysisResult : JSON.stringify(widgetData.analysisResult);
          }
        }
        
        // ❌ REMOVED: Chat message updates moved to ChatModule
        // Widget modules should only manage their internal state
        // All chat message updates are now handled by ChatModule via PluginManager callbacks
        
        // Update output with actual results (create new output if none exists)
        const updatedOutput = {
          ...(currentOutputValue || {}),
          type: outputType as any,
          title: outputTitle,
          content: outputContent,
          isStreaming: false,
          id: currentOutputValue?.id || `output_${Date.now()}`,
          timestamp: currentOutputValue?.timestamp || new Date()
        };
        
        setCurrentOutput(updatedOutput);
        
        // Update in history as well
        setOutputHistory(prev => {
          if (currentOutputValue && prev.some(item => item.id === currentOutputValue.id)) {
            // Update existing item in history
            return prev.map(item => item.id === currentOutputValue.id ? updatedOutput : item);
          } else {
            // Add new item to history
            return [updatedOutput, ...prev].slice(0, config.maxHistoryItems || 10);
          }
        });
        
        setIsProcessing(false);
        setIsStreaming(false);
        setStreamingContent('');
        
        // Notify parent with real results
        if (finalResult) {
          // Safe type conversion - we've validated the structure above
          const typedResult = finalResult as unknown as TResult;
          config.onProcessComplete?.(typedResult);
          onResultGenerated?.(typedResult);
        }
        
        logger.info(LogCategory.ARTIFACT_CREATION, `${config.type} real processing completed, parent notified`);
      }
    }
  }, [widgetState, widgetData?.generatedImage, widgetData?.searchResults, widgetData?.generatedContent, widgetData?.analysisResult, config.type, widget.currentApp]);
  
  // Clear output history
  const handleClearHistory = useCallback(() => {
    console.log(`🗑️ ${config.type.toUpperCase()}_MODULE: Clearing output history`);
    setOutputHistory([]);
    setCurrentOutput(null);
    setIsStreaming(false);
    setStreamingContent('');
    logger.info(LogCategory.ARTIFACT_CREATION, `${config.type} output history cleared`);
  }, [config.type]);
  
  // Handle output selection
  const handleSelectOutput = useCallback((item: OutputHistoryItem) => {
    console.log(`📋 ${config.type.toUpperCase()}_MODULE: Selected output:`, item.title);
    setCurrentOutput(item);
  }, [config.type]);
  
  // Default edit actions
  const defaultEditActions: EditAction[] = [
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      onClick: (content) => {
        navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content));
        console.log(`📋 ${config.type.toUpperCase()}_MODULE: Content copied to clipboard`);
      }
    },
    {
      id: 'download',
      label: 'Download',
      icon: '💾',
      onClick: (content) => {
        const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], 
          { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${config.type}_output_${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        console.log(`💾 ${config.type.toUpperCase()}_MODULE: Content downloaded`);
      }
    }
  ];
  
  // Default management actions
  const defaultManagementActions: ManagementAction[] = [
    {
      id: 'refresh',
      label: 'Refresh',
      icon: '🔄',
      onClick: () => {
        if (currentOutput?.params) {
          startProcessing(currentOutput.params);
        }
      },
      disabled: isProcessing || !currentOutput?.params
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: handleClearHistory,
      variant: 'danger' as const,
      disabled: outputHistory.length === 0
    }
  ];
  
  // Combine with custom actions
  const editActions = [...defaultEditActions, ...(config.editActions || [])];
  // Use only widget-specific management actions to avoid duplication and maintain exactly 4 buttons
  const managementActions = config.managementActions || [];
  
  // Support both render prop pattern and direct children
  if (typeof children === 'function') {
    // Render prop pattern - provide module state to children
    return (
      <>
        {children({
          isProcessing,
          outputHistory,
          currentOutput,
          isStreaming,
          streamingContent,
          startProcessing,
          onSelectOutput: handleSelectOutput,
          onClearHistory: handleClearHistory
        })}
      </>
    );
  }
  
  // Direct children pattern - wrap with BaseWidget
  return (
    <BaseWidget
      title={config.title}
      icon={config.icon}
      isProcessing={isProcessing}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={handleSelectOutput}
      onClearHistory={handleClearHistory}
    >
      {children}
    </BaseWidget>
  );
};

// Export utility function to create widget module configs
export const createWidgetConfig = <TParams extends BaseWidgetParams, TResult extends BaseWidgetResult>(
  config: WidgetModuleConfig<TParams, TResult>
): WidgetModuleConfig<TParams, TResult> => config;

// Export types for use by individual widget modules
export type {
  BaseWidgetParams,
  BaseWidgetResult,
  WidgetModuleConfig,
  BaseWidgetModuleProps
};