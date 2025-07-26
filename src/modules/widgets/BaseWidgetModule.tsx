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
import React, { useCallback, useEffect, useState, ReactNode } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';
import { 
  BaseWidget, 
  OutputHistoryItem, 
  EditAction, 
  ManagementAction 
} from '../../components/ui/widgets/BaseWidget';

// Generic widget params interface
interface BaseWidgetParams {
  [key: string]: any;
}

// Generic widget result interface
interface BaseWidgetResult {
  [key: string]: any;
}

// Widget module configuration
interface WidgetModuleConfig<TParams = BaseWidgetParams, TResult = BaseWidgetResult> {
  // Widget identification
  type: string;
  title: string;
  icon: string;
  
  // Processing configuration
  sessionIdPrefix: string;
  
  // Output management
  maxHistoryItems?: number;
  
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
  
  console.log(`🔧 ${config.type.toUpperCase()}_MODULE: Initializing with config:`, {
    type: config.type,
    title: config.title,
    maxHistory: config.maxHistoryItems,
    hasTriggeredInput: !!triggeredInput
  });
  
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
    if (!currentOutput) return;
    
    const updatedOutput = { ...currentOutput, ...updates };
    setCurrentOutput(updatedOutput);
    
    // Update in history as well
    setOutputHistory(prev =>
      prev.map(item => item.id === currentOutput.id ? updatedOutput : item)
    );
  }, [currentOutput]);
  
  // Start processing with streaming support
  const startProcessing = useCallback(async (params: TParams): Promise<void> => {
    console.log(`🚀 ${config.type.toUpperCase()}_MODULE: Starting processing with params:`, params);
    
    setIsProcessing(true);
    setIsStreaming(true);
    setStreamingContent('');
    
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
      console.log(`🔄 ${config.type.toUpperCase()}_MODULE: Routing request via WidgetHandler`);
      logger.info(LogCategory.ARTIFACT_CREATION, `${config.type} module routing request via WidgetHandler`, { params });
      
      await widgetHandler.processRequest({
        type: config.type as any, // Type assertion needed for WidgetType compatibility
        params,
        sessionId: `${config.sessionIdPrefix}_${Date.now()}`,
        userId: 'widget_user'
      });
      
      console.log(`✅ ${config.type.toUpperCase()}_MODULE: Request successfully routed to store`);
      
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
      
      config.onProcessError?.(error instanceof Error ? error : new Error('Unknown error'));
      
      setIsProcessing(false);
      setIsStreaming(false);
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
  
  useEffect(() => {
    // Monitor actual widget state changes instead of using placeholder timer
    if (config.type === widget.currentApp) {
      const wasProcessing = isProcessing;
      const isCurrentlyProcessing = widgetState !== 'idle';
      
      // If processing just completed
      if (wasProcessing && !isCurrentlyProcessing && currentOutput) {
        console.log(`✅ ${config.type.toUpperCase()}_MODULE: Real processing completed, updating output`);
        
        // Get actual result from widget data
        let finalResult = null;
        let outputType = 'text';
        let outputContent = 'Processing completed successfully';
        
        if (config.type === 'dream' && widgetData?.generatedImage) {
          finalResult = { imageUrl: widgetData.generatedImage, prompt: widgetData.params?.prompt };
          outputType = 'image';
          outputContent = widgetData.generatedImage;
          console.log(`🎨 ${config.type.toUpperCase()}_MODULE: Found generated image, updating output:`, { imageUrl: widgetData.generatedImage });
        } else if (config.type === 'hunt' && widgetData?.searchResults && widgetData.searchResults.length > 0) {
          finalResult = { searchResults: widgetData.searchResults, query: widgetData.lastQuery };
          outputType = 'data';
          outputContent = widgetData.searchResults[0]?.content || JSON.stringify(widgetData.searchResults);
          console.log(`🔍 ${config.type.toUpperCase()}_MODULE: Found search results, updating output:`, { 
            resultCount: widgetData.searchResults.length,
            firstResult: widgetData.searchResults[0]?.title 
          });
        } else if (config.type === 'omni' && widgetData?.generatedContent) {
          finalResult = { content: widgetData.generatedContent, params: widgetData.params };
          outputType = 'text';
          outputContent = widgetData.generatedContent;
        }
        
        // Update output with actual results
        if (currentOutput) {
          const updatedOutput = {
            ...currentOutput,
            type: outputType as any,
            title: `${config.type} processing completed`,
            content: outputContent,
            isStreaming: false
          };
          
          setCurrentOutput(updatedOutput);
          
          // Update in history as well
          setOutputHistory(prev =>
            prev.map(item => item.id === currentOutput.id ? updatedOutput : item)
          );
        }
        
        setIsProcessing(false);
        setIsStreaming(false);
        setStreamingContent('');
        
        // Notify parent with real results
        if (finalResult) {
          config.onProcessComplete?.(finalResult as TResult);
          onResultGenerated?.(finalResult as TResult);
        }
        
        logger.info(LogCategory.ARTIFACT_CREATION, `${config.type} real processing completed, parent notified`);
      }
    }
  }, [isProcessing, widgetState, widgetData?.generatedImage, widgetData?.searchResults, widgetData?.generatedContent, widgetData?.lastQuery, currentOutput?.id, config.type, widget.currentApp]);
  
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