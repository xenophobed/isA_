/**
 * ============================================================================
 * Data Scientist Widget Module (DataScientistWidgetModule.tsx) - Refactored with BaseWidgetModule
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides DataScientist-specific configuration and customizations
 * - Manages CSV data analysis business logic
 * - Integrates seamlessly with BaseWidget UI components
 * 
 * Benefits of BaseWidgetModule integration:
 * - Automatic output history management for analysis results
 * - Built-in edit and management actions
 * - Streaming status display
 * - Standard error handling and logging
 * - Consistent UI patterns across all widgets
 */
import React, { ReactNode } from 'react';
import { BaseWidgetModule, createWidgetConfig } from './BaseWidgetModule';
import { DataScientistWidgetParams, DataScientistWidgetResult } from '../../types/widgetTypes';
import { EditAction, ManagementAction } from '../../components/ui/widgets/BaseWidget';
import { useDataScientistState } from '../../stores/useWidgetStores';

interface DataScientistWidgetModuleProps {
  triggeredInput?: string;
  onAnalysisCompleted?: (result: DataScientistWidgetResult) => void;
  children: ReactNode;
}

/**
 * Data Scientist Widget Module - Template mapping and configuration for CSV data analysis
 * 
 * Analysis Types:
 * - descriptive: Basic statistical analysis and summaries
 * - predictive: Machine learning and forecasting 
 * - prescriptive: Optimization and recommendations
 * - exploratory: Data exploration and visualization
 */

// DataScientist analysis type to MCP template mapping
const DATA_SCIENTIST_TEMPLATE_MAPPING = {
  'csv_analysis': {
    template_id: 'csv_analyze_prompt',
    focus: 'data_analysis'
  },
  'descriptive': {
    template_id: 'csv_analyze_prompt',
    focus: 'statistical_summary'
  },
  'predictive': {
    template_id: 'csv_analyze_prompt',
    focus: 'predictive_modeling'
  },
  'prescriptive': {
    template_id: 'csv_analyze_prompt',
    focus: 'optimization_recommendations'
  },
  'exploratory': {
    template_id: 'csv_analyze_prompt',
    focus: 'exploratory_analysis'
  }
};

// DataScientist-specific template parameter preparation
const prepareDataScientistTemplateParams = (params: DataScientistWidgetParams) => {
  const { query, analysisType = 'exploratory', visualizationType = 'chart', data } = params;
  
  const mapping = DATA_SCIENTIST_TEMPLATE_MAPPING[analysisType] || DATA_SCIENTIST_TEMPLATE_MAPPING['exploratory'];
  
  // Build prompt_args for CSV analysis
  const prompt_args = {
    query: query || 'Analyze the provided data',
    analysis_type: analysisType,
    visualization_type: visualizationType,
    data_context: data ? 'CSV data provided' : 'Request for data analysis'
  };
  
  console.log('📊 DATA_SCIENTIST_MODULE: Prepared template params for analysis type', analysisType, ':', {
    template_id: mapping.template_id,
    prompt_args
  });
  
  return {
    template_id: mapping.template_id,
    prompt_args
  };
};

// DataScientist widget configuration
const dataScientistWidgetConfig = createWidgetConfig({
  type: 'data_scientist',
  title: 'DataScientist Analysis',
  icon: '📊',
  sessionIdPrefix: 'data_scientist_widget',
  maxHistoryItems: 15,
  
  // Extract parameters from triggered input
  extractParamsFromInput: (input: string) => {
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
      query: input.trim(),
      analysisType,
      visualizationType
    };
  },
  editActions: [
    {
      id: 'export_csv',
      label: 'Export CSV',
      icon: '📋',
      onClick: (content) => {
        console.log('📋 Exporting analysis as CSV:', content);
      }
    },
    {
      id: 'view_chart', 
      label: 'Chart',
      icon: '📈',
      onClick: (content) => {
        console.log('📈 Opening chart view:', content);
      }
    },
    {
      id: 'download_report',
      label: 'Report',
      icon: '📄', 
      onClick: (content) => {
        console.log('📄 Downloading analysis report:', content);
      }
    }
  ],
  managementActions: [
    {
      id: 'upload_csv',
      label: 'Upload CSV',
      icon: '📂',
      onClick: () => console.log('📂 CSV upload dialog'),
      variant: 'primary' as const,
      disabled: false
    },
    {
      id: 'data_sources',
      label: 'Data Sources',
      icon: '🗄️',
      onClick: () => console.log('🗄️ Data sources manager'),
      disabled: false
    },
    {
      id: 'ml_models',
      label: 'ML Models', 
      icon: '🤖',
      onClick: () => console.log('🤖 ML models - coming soon'),
      disabled: true
    },
    {
      id: 'notebooks',
      label: 'Notebooks',
      icon: '📓',
      onClick: () => console.log('📓 Jupyter notebooks - coming soon'),
      disabled: true
    }
  ]
});

/**
 * Data Scientist Widget Module - Uses BaseWidgetModule with DataScientist-specific configuration
 */
export const DataScientistWidgetModule: React.FC<DataScientistWidgetModuleProps> = ({
  triggeredInput,
  onAnalysisCompleted,
  children
}) => {
  // Read state from store
  const { analysisResult, isAnalyzing, lastParams } = useDataScientistState();
  
  // Convert analysisResult to outputHistory format for BaseWidget display
  const outputHistory = React.useMemo(() => {
    if (!analysisResult) {
      return [];
    }
    
    return [{
      id: `data_scientist_result_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'data_analysis',
      title: lastParams?.query ? `Analysis: ${lastParams.query}` : 'Data Analysis Results',
      content: typeof analysisResult === 'object' ? JSON.stringify(analysisResult, null, 2) : analysisResult,
      metadata: {
        analysisType: lastParams?.analysisType || 'exploratory',
        visualizationType: lastParams?.visualizationType || 'chart',
        hasInsights: analysisResult?.analysis?.insights?.length > 0
      }
    }];
  }, [analysisResult, lastParams]);
  
  console.log('📊 DATA_SCIENTIST_MODULE: Converting analysis result to output history:', {
    hasResult: !!analysisResult,
    outputHistoryCount: outputHistory.length,
    latestResult: outputHistory[0]?.title
  });
  
  return (
    <BaseWidgetModule
      config={dataScientistWidgetConfig}
      triggeredInput={triggeredInput}
      onCompleted={onAnalysisCompleted}
    >
      {(moduleProps) => {
        // Pass store state to DataScientistWidget via props with template support
        if (React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...children.props,
            // Store state
            analysisResult,
            isAnalyzing,
            lastParams,
            // Add onAnalyzeData function with template parameter preparation
            onAnalyzeData: async (params: DataScientistWidgetParams) => {
              // Prepare template parameters based on the analysis type
              const templateParams = prepareDataScientistTemplateParams(params);
              
              // Add template information to params before sending to store
              const enrichedParams = {
                ...params,
                templateParams // Add template configuration
              };
              
              console.log('📊 DATA_SCIENTIST_MODULE: Sending enriched params to store:', enrichedParams);
              await moduleProps.startProcessing(enrichedParams);
            },
            // Add clear analysis function
            onClearAnalysis: () => {
              console.log('📊 DATA_SCIENTIST_MODULE: Clearing analysis');
              moduleProps.onClearHistory();
            },
            // BaseWidget state with converted data
            outputHistory: outputHistory,
            currentOutput: outputHistory[0] || null,
            isStreaming: moduleProps.isStreaming,
            streamingContent: moduleProps.streamingContent,
            onSelectOutput: moduleProps.onSelectOutput,
            onClearHistory: moduleProps.onClearHistory
          });
        }
        return children;
      }}
    </BaseWidgetModule>
  );
};