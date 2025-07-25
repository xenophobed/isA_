/**
 * ============================================================================
 * Data Scientist Widget Module (DataScientistWidgetModule.tsx) - 数据科学小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理DataScientist小部件的所有业务逻辑
 * - 管理数据分析和可视化的流程
 * - 封装数据处理参数和结果管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - DataScientist小部件业务逻辑的统一管理
 *   - 数据分析和状态管理的集成
 *   - 数据处理请求的协调
 *   - 用户输入的处理和验证
 *   - 分析结果的处理和格式化
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由DataScientistWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → DataScientistWidgetModule → DataScientistWidget UI
 * hooks → DataScientistWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { DataScientistWidgetParams, DataScientistWidgetResult } from '../../types/widgetTypes';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';


interface DataScientistWidgetModuleProps {
  triggeredInput?: string;
  onAnalysisCompleted?: (result: DataScientistWidgetResult) => void;
  children: (moduleProps: {
    isAnalyzing: boolean;
    analysisResult: DataScientistWidgetResult | null;
    lastParams: DataScientistWidgetParams | null;
    onAnalyzeData: (params: DataScientistWidgetParams) => Promise<void>;
    onClearAnalysis: () => void;
  }) => React.ReactNode;
}

/**
 * Data Scientist Widget Module - Business logic module for Data Scientist widget
 * 
 * This module:
 * - Uses hooks to get data scientist widget state and AI client
 * - Handles all data analysis business logic
 * - Manages user input processing and validation
 * - Passes pure data and callbacks to DataScientist UI component
 * - Keeps DataScientist UI component pure
 */
export const DataScientistWidgetModule: React.FC<DataScientistWidgetModuleProps> = ({
  triggeredInput,
  onAnalysisCompleted,
  children
}) => {
  // Get data scientist widget state using hooks
  const { dataScientistState } = useWidget();
  const { dataScientist: dataScientistActions } = useWidgetActions();
  
  console.log('📊 DATA_SCIENTIST_MODULE: Providing data to DataScientist UI:', {
    isAnalyzing: dataScientistState.isAnalyzing,
    hasResult: !!dataScientistState.analysisResult,
    hasParams: !!dataScientistState.lastParams,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Handle data analysis via WidgetHandler
  const handleAnalyzeData = useCallback(async (params: DataScientistWidgetParams) => {
    console.log('📊 DATA_SCIENTIST_MODULE: analyzeData called with:', params);
    
    if (!params.query && !params.data) {
      console.error('❌ DATA_SCIENTIST_MODULE: No query or data provided');
      return;
    }
    
    // Use WidgetHandler to route request to store → chatService → API
    console.log('🔄 DATA_SCIENTIST_MODULE: Routing request via WidgetHandler');
    logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist module routing request via WidgetHandler', { params });
    
    try {
      await widgetHandler.processRequest({
        type: 'data_scientist',
        params,
        sessionId: 'data_scientist_widget',
        userId: 'widget_user'
      });
      
      console.log('✅ DATA_SCIENTIST_MODULE: Request successfully routed to store');
    } catch (error) {
      console.error('❌ DATA_SCIENTIST_MODULE: WidgetHandler request failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'DataScientist WidgetHandler request failed', { error, params });
    }
  }, []);
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !dataScientistState.isAnalyzing) {
      console.log('📊 DATA_SCIENTIST_MODULE: Processing triggered input:', triggeredInput);
      
      // Extract analysis request from triggered input
      const params = extractAnalysisFromInput(triggeredInput);
      if (params) {
        handleAnalyzeData(params);
      }
    }
  }, [triggeredInput, dataScientistState.isAnalyzing, handleAnalyzeData]);
  
  // Business logic: Extract analysis parameters from user input
  const extractAnalysisFromInput = (input: string): DataScientistWidgetParams | null => {
    const lowerInput = input.toLowerCase();
    
    // Determine analysis type based on keywords
    let analysisType: 'descriptive' | 'predictive' | 'prescriptive' | 'exploratory' = 'exploratory';
    let visualizationType: 'chart' | 'graph' | 'table' | 'dashboard' = 'chart';
    
    // Analysis type detection
    if (lowerInput.includes('predict') || lowerInput.includes('forecast') || lowerInput.includes('trend')) {
      analysisType = 'predictive';
    } else if (lowerInput.includes('recommend') || lowerInput.includes('optimize') || lowerInput.includes('suggest')) {
      analysisType = 'prescriptive';
    } else if (lowerInput.includes('describe') || lowerInput.includes('summary') || lowerInput.includes('statistics')) {
      analysisType = 'descriptive';
    }
    
    // Visualization type detection
    if (lowerInput.includes('table') || lowerInput.includes('tabular')) {
      visualizationType = 'table';
    } else if (lowerInput.includes('graph') || lowerInput.includes('network')) {
      visualizationType = 'graph';
    } else if (lowerInput.includes('dashboard') || lowerInput.includes('overview')) {
      visualizationType = 'dashboard';
    }
    
    return {
      query: input,
      analysisType,
      visualizationType
    };
  };
  
  // Monitor data scientist state changes to notify parent component
  useEffect(() => {
    if (dataScientistState.analysisResult && dataScientistState.lastParams && !dataScientistState.isAnalyzing) {
      // Notify parent component when analysis is completed
      onAnalysisCompleted?.(dataScientistState.analysisResult);
      logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis completed, parent notified');
    }
  }, [dataScientistState.analysisResult, dataScientistState.lastParams, dataScientistState.isAnalyzing, onAnalysisCompleted]);
  
  
  // Business logic: Clear analysis results
  const handleClearAnalysis = useCallback(() => {
    console.log('📊 DATA_SCIENTIST_MODULE: Clearing analysis');
    dataScientistActions.clearDataScientistData();
    logger.info(LogCategory.ARTIFACT_CREATION, 'DataScientist analysis cleared');
  }, [dataScientistActions]);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isAnalyzing: dataScientistState.isAnalyzing,
        analysisResult: dataScientistState.analysisResult,
        lastParams: dataScientistState.lastParams,
        onAnalyzeData: handleAnalyzeData,
        onClearAnalysis: handleClearAnalysis
      })}
    </>
  );
};