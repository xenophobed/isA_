/**
 * ============================================================================
 * Data Scientist Widget UI (DataScientistWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Data workflow management system using standardized BaseWidget layout
 * - Upload, query, and combined mode operations
 * - Support for CSV, Excel, JSON, database file processing
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in data analysis history management
 * - Consistent edit and management actions for data results
 * - Streaming status display for analysis progress
 * - Data-specific actions (export, visualize, share)
 */
import React, { useState } from 'react';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

// Data processing workflow state (copied from data_scientist_sidebar.tsx)
interface DataWorkflow {
  mode: 'upload' | 'query' | 'combined';
  dataSource: {
    file?: File;
    path?: string;
    type?: string;
    status: 'none' | 'uploading' | 'processing' | 'ready' | 'error';
  };
  query: string;
  sqliteDbPath?: string;
  pgvectorDb?: string;
}

interface DataScientistWidgetParams {
  data?: File | string;
  analysisType?: 'descriptive' | 'predictive' | 'prescriptive' | 'exploratory';
  visualizationType?: 'chart' | 'graph' | 'table' | 'dashboard';
  query?: string;
}

interface DataScientistWidgetResult {
  analysis: {
    summary: string;
    insights: string[];
    recommendations: string[];
  };
  visualizations: Array<{
    type: string;
    title: string;
    data: any;
    chartConfig?: any;
  }>;
  statistics: {
    dataPoints: number;
    columns: string[];
    correlations?: any;
  };
}

interface DataScientistWidgetProps {
  isAnalyzing: boolean;
  analysisResult: DataScientistWidgetResult | null;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onAnalyzeData: (params: DataScientistWidgetParams) => Promise<void>;
  onClearAnalysis: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
}

/**
 * Data Scientist Widget Input Area - Content that goes inside BaseWidget
 */
const DataScientistInputArea: React.FC<DataScientistWidgetProps> = ({
  isAnalyzing,
  analysisResult,
  triggeredInput,
  onAnalyzeData,
  onClearAnalysis
}) => {
  // Data workflow state (exact copy from data_scientist_sidebar.tsx)
  const [workflow, setWorkflow] = useState<DataWorkflow>({
    mode: 'combined',
    dataSource: {
      status: 'none'
    },
    query: ''
  });

  // Update workflow state
  const updateWorkflow = (updates: Partial<DataWorkflow>) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
  };

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      setWorkflow(prev => ({
        ...prev,
        dataSource: {
          file: file,
          type: fileType,
          status: 'ready'
        }
      }));
    }
  };

  // Data ingestion (Function 1)
  const handleDataIngestion = async () => {
    if (!workflow.dataSource.file || isAnalyzing) return;

    try {
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'processing' }
      });

      const params: DataScientistWidgetParams = {
        data: workflow.dataSource.file,
        query: 'Ingest and process data source'
      };
      
      await onAnalyzeData(params);

      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'ready' }
      });
    } catch (error) {
      console.error('Data ingestion failed:', error);
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'error' }
      });
    }
  };

  // Query processing (Function 2)
  const handleQueryProcessing = async () => {
    if (!workflow.query.trim() || isAnalyzing) return;

    try {
      const params: DataScientistWidgetParams = {
        query: workflow.query
      };
      
      await onAnalyzeData(params);
    } catch (error) {
      console.error('Query processing failed:', error);
    }
  };

  // Combined workflow (Function 1 + Function 2)
  const handleCombinedAnalysis = async () => {
    if (!workflow.dataSource.file || !workflow.query.trim() || isAnalyzing) return;

    try {
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'processing' }
      });

      const params: DataScientistWidgetParams = {
        data: workflow.dataSource.file,
        query: workflow.query
      };
      
      await onAnalyzeData(params);

      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'ready' }
      });
    } catch (error) {
      console.error('Combined analysis failed:', error);
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'error' }
      });
    }
  };

  // Supported file types (exact copy from data_scientist_sidebar.tsx)
  const supportedTypes = [
    { ext: 'csv', name: 'CSV Files', icon: '📊' },
    { ext: 'xlsx', name: 'Excel Files', icon: '📈' },
    { ext: 'json', name: 'JSON Files', icon: '📋' },
    { ext: 'db', name: 'Database Files', icon: '🗄️' }
  ];

  // Quick analysis templates (exact copy from data_scientist_sidebar.tsx)
  const quickQueries = [
    'Show me the trends in this data',
    'Find anomalies and outliers',
    'What are the key insights?',
    'Summarize the data by categories',
    'Show top 10 records by value',
    'Calculate averages and totals'
  ];

  return (
    <div className="space-y-4 h-full flex flex-col p-3">
      {/* Workflow Mode Selection */}
      <div>
        <label className="text-sm font-medium text-white/80 mb-2 block">🔬 Analysis Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'combined', name: 'End-to-End', icon: '🚀', desc: 'Upload + Query' },
            { id: 'upload', name: 'Data Prep', icon: '📤', desc: 'Ingest Only' },
            { id: 'query', name: 'Query Only', icon: '💬', desc: 'Existing Data' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => updateWorkflow({ mode: mode.id as any })}
              className={`p-2 rounded-lg text-xs transition-all ${
                workflow.mode === mode.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="text-center">
                <div className="text-lg">{mode.icon}</div>
                <div className="font-medium">{mode.name}</div>
                <div className="text-xs opacity-80">{mode.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Upload Section */}
      {(workflow.mode === 'upload' || workflow.mode === 'combined') && (
        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">📁 Data Source</label>
          
          {/* File Upload */}
          <label className="block w-full p-4 border-2 border-dashed border-cyan-500/50 bg-cyan-500/5 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-all">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {workflow.dataSource.status === 'ready' ? '✅' : '📁'}
              </div>
              <div className="text-sm font-medium text-white/80">
                {workflow.dataSource.file ? workflow.dataSource.file.name : 'Upload Data File'}
              </div>
              <div className="text-xs text-white/60 mt-1">
                {workflow.dataSource.file ? `${(workflow.dataSource.file.size / 1024).toFixed(1)}KB` : 'CSV, Excel, JSON, Database'}
              </div>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.db,.sqlite"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Supported File Types */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {supportedTypes.map((type) => (
              <div key={type.ext} className="flex items-center gap-2 p-2 bg-white/5 rounded text-xs">
                <span>{type.icon}</span>
                <span className="text-white/80">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Input Section */}
      {(workflow.mode === 'query' || workflow.mode === 'combined') && (
        <div className="flex-1 min-h-0">
          <label className="text-sm font-medium text-white/80 mb-2 block">💬 Natural Language Query</label>
          <textarea
            value={workflow.query}
            onChange={(e) => updateWorkflow({ query: e.target.value })}
            placeholder="Ask anything about your data... e.g., 'Show revenue trends by month' or 'Find customers from China'"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 resize-none h-20"
          />

          {/* Quick Query Templates */}
          <div className="mt-2">
            <div className="text-xs text-white/60 mb-2">Quick queries:</div>
            <div className="grid grid-cols-2 gap-1">
              {quickQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => updateWorkflow({ query })}
                  className="p-1 bg-white/5 rounded text-xs text-white/70 hover:bg-cyan-500/20 transition-all text-left"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {workflow.mode === 'upload' && (
          <button
            onClick={handleDataIngestion}
            disabled={!workflow.dataSource.file || isAnalyzing}
            className={`w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isAnalyzing ? 'animate-pulse' : 'hover:from-blue-600 hover:to-cyan-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing Data...
              </>
            ) : (
              <>
                <span>📤</span>
                Ingest Data
              </>
            )}
          </button>
        )}

        {workflow.mode === 'query' && (
          <button
            onClick={handleQueryProcessing}
            disabled={!workflow.query.trim() || isAnalyzing}
            className={`w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isAnalyzing ? 'animate-pulse' : 'hover:from-purple-600 hover:to-pink-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Querying...
              </>
            ) : (
              <>
                <span>💬</span>
                Execute Query
              </>
            )}
          </button>
        )}

        {workflow.mode === 'combined' && (
          <button
            onClick={handleCombinedAnalysis}
            disabled={!workflow.dataSource.file || !workflow.query.trim() || isAnalyzing}
            className={`w-full p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isAnalyzing ? 'animate-pulse' : 'hover:from-cyan-600 hover:to-purple-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <span>🚀</span>
                Analyze Data
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};

/**
 * Data Scientist Widget with BaseWidget - New standardized layout
 */
export const DataScientistWidget: React.FC<DataScientistWidgetProps> = ({
  isAnalyzing,
  analysisResult,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onAnalyzeData,
  onClearAnalysis,
  onSelectOutput,
  onClearHistory
}) => {
  
  // Custom edit actions for data analysis results
  const editActions: EditAction[] = [
    {
      id: 'export_csv',
      label: 'Export CSV',
      icon: '📊',
      onClick: (content) => {
        // Convert data to CSV and download
        if (typeof content === 'object' && content !== null) {
          const csvContent = JSON.stringify(content, null, 2);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `data_analysis_${Date.now()}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    },
    {
      id: 'visualize',
      label: 'Visualize',
      icon: '📈',
      onClick: (content) => {
        // Open visualization for data
        console.log('Opening visualization for data:', content);
      }
    },
    {
      id: 'copy_sql',
      label: 'Copy SQL',
      icon: '🗄️',
      onClick: (content) => {
        // Extract and copy SQL query if available
        if (typeof content === 'object' && content !== null) {
          const sqlQuery = JSON.stringify(content, null, 2);
          navigator.clipboard.writeText(sqlQuery);
        }
      }
    }
  ];

  // Custom management actions for data science
  const managementActions: ManagementAction[] = [
    {
      id: 'upload_mode',
      label: 'Upload',
      icon: '📤',
      onClick: () => onAnalyzeData({ 
        analysisType: 'descriptive',
        query: 'Process uploaded data'
      }),
      disabled: isAnalyzing
    },
    {
      id: 'query_mode',
      label: 'Query',
      icon: '💬',
      onClick: () => onAnalyzeData({ 
        query: 'Analyze existing data',
        analysisType: 'exploratory'
      }),
      disabled: isAnalyzing
    },
    {
      id: 'combined_mode',
      label: 'Combined',
      icon: '🚀',
      onClick: () => onAnalyzeData({ 
        query: 'End-to-end analysis',
        analysisType: 'prescriptive'
      }),
      disabled: isAnalyzing
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearAnalysis();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isAnalyzing
    }
  ];

  return (
    <BaseWidget
      title="Data Analytics"
      icon="🔬"
      isProcessing={isAnalyzing}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
    >
      <DataScientistInputArea
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
        triggeredInput={triggeredInput}
        onAnalyzeData={onAnalyzeData}
        onClearAnalysis={onClearAnalysis}
      />
    </BaseWidget>
  );
};