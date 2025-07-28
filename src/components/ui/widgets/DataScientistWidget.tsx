/**
 * ============================================================================
 * Data Scientist Widget UI (DataScientistWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Data workflow management system using standardized BaseWidget layout
 * - Query, visualization, and ML mode operations
 * - Support for CSV, database, URL, and other data sources
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
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction, EmptyStateConfig } from './BaseWidget';

// Data analysis modes
interface DataMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
  useCase: string;
  keywords: string[];
  isActive: boolean;
}

const dataModes: DataMode[] = [
  {
    id: 'query',
    name: 'Data Query',
    description: 'Query and explore your data with natural language',
    icon: '🔍',
    estimatedTime: '2-5 seconds',
    useCase: 'Perfect for: Data exploration, filtering, aggregation',
    keywords: ['query', 'search', 'filter', 'find', 'explore', 'analyze'],
    isActive: true
  },
  {
    id: 'visualization',
    name: 'Visualization',
    description: 'Create charts and visual representations of data',
    icon: '📊',
    estimatedTime: '3-8 seconds',
    useCase: 'Perfect for: Charts, graphs, dashboards, reports',
    keywords: ['chart', 'graph', 'plot', 'visual', 'dashboard', 'report'],
    isActive: false
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    description: 'Apply ML models for predictions and insights',
    icon: '🤖',
    estimatedTime: '10-30 seconds',
    useCase: 'Perfect for: Predictions, clustering, classification',
    keywords: ['predict', 'model', 'ml', 'machine', 'learning', 'ai'],
    isActive: false
  }
];

// Smart mode detection based on user input
const detectBestMode = (input: string): DataMode => {
  const lowerInput = input.toLowerCase();
  
  // Find active modes that match keywords
  const possibleModes = dataModes.filter(mode => {
    const keywordMatch = mode.keywords.some(keyword => lowerInput.includes(keyword));
    return keywordMatch && mode.isActive;
  });
  
  // Return best match or default to query
  return possibleModes[0] || dataModes[0];
};

interface DataScientistWidgetParams {
  data?: File | string;
  analysisType?: 'descriptive' | 'predictive' | 'prescriptive' | 'exploratory';
  visualizationType?: 'chart' | 'graph' | 'table' | 'dashboard';
  query?: string;
  mode?: string;
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
  onBack?: () => void;
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
  // Modern state management
  const [query, setQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<DataMode>(dataModes[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState('standard');

  // Real-time mode recommendations
  React.useEffect(() => {
    if (query.trim()) {
      const bestMode = detectBestMode(query);
      if (bestMode.id !== selectedMode.id) {
        setSelectedMode(bestMode);
        console.log('🔬 Mode recommendation updated:', bestMode.id);
      }
    }
  }, [query, selectedMode.id]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('🔬 Data file uploaded:', file.name);
      setUploadedFile(file);
    }
  };

  // Handle data analysis processing
  const handleDataAnalysis = async () => {
    if (!query.trim() || !onAnalyzeData || isAnalyzing) return;
    
    console.log('🔬 Starting data analysis with mode:', selectedMode.name);
    
    try {
      const params: DataScientistWidgetParams = {
        query: query,
        mode: selectedMode.id,
        data: uploadedFile || undefined,
        analysisType: selectedMode.id === 'ml' ? 'predictive' : 'exploratory'
      };
      
      await onAnalyzeData(params);
      
      console.log('🚀 Data analysis request sent with mode:', selectedMode.name);
    } catch (error) {
      console.error('Data analysis failed:', error);
    }
  };

  return (
    <div className="space-y-4 p-3">
      {/* Compact Mode Header - like other widgets */}
      <div className="flex items-center gap-3 p-2 rounded border" style={{backgroundColor: 'var(--glass-secondary)', borderColor: 'var(--glass-border)'}}>
        <span className="text-lg">{selectedMode.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{color: 'var(--text-primary)'}}>{selectedMode.name}</div>
          <div className="flex gap-3 text-xs" style={{color: 'var(--text-secondary)'}}>
            <span>{selectedMode.estimatedTime}</span>
            <span>Data Analysis</span>
          </div>
        </div>
      </div>

      {/* Compact Input Area with Upload Button */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue !== query) {
                console.log('🔬 Query changed');
              }
              setQuery(newValue);
            }}
            placeholder={`Describe your ${selectedMode.name.toLowerCase()} request...`}
            className="flex-1 p-2 rounded resize-none text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--glass-primary)',
              borderColor: 'var(--glass-border)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)'
            }}
            onFocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent-soft)'}
            onBlur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--glass-border)'}
            rows={2}
          />
          <button
            onClick={() => document.getElementById('data-upload')?.click()}
            className="px-3 py-2 rounded transition-all text-xs flex items-center gap-1"
            style={{
              backgroundColor: 'var(--glass-primary)',
              borderColor: 'var(--glass-border)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--glass-secondary)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--glass-primary)'}
          >
            📁 Upload
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json,.db,.sqlite"
          onChange={handleFileUpload}
          className="hidden"
          id="data-upload"
        />
        
        {/* Show uploaded file info */}
        {uploadedFile && (
          <div className="flex items-center gap-2 p-2 rounded border" style={{backgroundColor: 'var(--glass-primary)', borderColor: 'var(--glass-border)'}}>
            <span className="text-sm">📁</span>
            <span className="text-xs" style={{color: 'var(--text-secondary)'}}>{uploadedFile.name}</span>
            <button 
              onClick={() => setUploadedFile(null)}
              className="ml-auto text-xs"
              style={{color: 'var(--text-muted)'}}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Compact Mode Selector */}
      <div>
        <div className="text-xs mb-2" style={{color: 'var(--text-muted)'}}>🎯 Select Mode</div>
        <div className="grid grid-cols-3 gap-1">
          {dataModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                if (mode.isActive) {
                  setSelectedMode(mode);
                  console.log('🔬 Mode selected:', mode.name);
                } else {
                  console.log('🔬 Mode disabled:', mode.name);
                }
              }}
              disabled={!mode.isActive}
              className="p-1.5 rounded border transition-all text-center"
              style={{
                backgroundColor: selectedMode.id === mode.id ? 'var(--accent-soft)' : 'var(--glass-primary)',
                borderColor: selectedMode.id === mode.id ? 'var(--accent-muted)' : 'var(--glass-border)',
                color: selectedMode.id === mode.id ? 'var(--text-primary)' : (mode.isActive ? 'var(--text-primary)' : 'var(--text-muted)'),
                cursor: mode.isActive ? 'pointer' : 'not-allowed'
              }}
              onMouseEnter={(e) => {
                if (mode.isActive && selectedMode.id !== mode.id) {
                  (e.target as HTMLElement).style.backgroundColor = 'var(--glass-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode.isActive && selectedMode.id !== mode.id) {
                  (e.target as HTMLElement).style.backgroundColor = 'var(--glass-primary)';
                }
              }}
              title={`${mode.name} - ${mode.description}${!mode.isActive ? ' (Coming Soon)' : ''}`}
            >
              <div className="text-xs mb-0.5">{mode.icon}</div>
              <div className="text-xs font-medium truncate leading-tight">{mode.name}</div>
              {!mode.isActive && <div className="text-xs" style={{color: 'var(--text-muted)'}}>Soon</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options - Only Analysis Depth */}
      {selectedMode && (
        <div className="space-y-2">
          <div className="text-xs" style={{color: 'var(--text-muted)'}}>⚙️ Advanced Options</div>
          
          <div>
            <label className="block text-xs mb-1" style={{color: 'var(--text-muted)'}}>Analysis Depth</label>
            <select 
              className="w-full p-1.5 rounded text-xs"
              style={{
                backgroundColor: 'var(--glass-primary)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)'
              }} 
              value={analysisDepth} 
              onChange={(e) => setAnalysisDepth(e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="deep">Deep Analysis</option>
            </select>
          </div>
        </div>
      )}

      {/* Enhanced Process Button */}
      <button
        onClick={handleDataAnalysis}
        disabled={isAnalyzing || !query.trim()}
        className={`w-full p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded text-white font-medium transition-all hover:from-green-600 hover:to-blue-600 flex items-center justify-center gap-2 text-sm ${
          isAnalyzing ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isAnalyzing ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Analyzing...
          </>
        ) : (
          <>
            <span>{selectedMode.icon}</span>
            Analyze with {selectedMode.name}
          </>
        )}
      </button>
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
  onClearHistory,
  onBack
}) => {
  
  // Custom edit actions for data analysis results
  const editActions: EditAction[] = [
    {
      id: 'export_csv',
      label: 'Export',
      icon: '💾',
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
      icon: '📊',
      onClick: (content) => {
        // Open visualization for data
        console.log('Opening visualization for data:', content);
      }
    }
  ];

  // Custom management actions for data science - only csv file active
  const managementActions: ManagementAction[] = [
    {
      id: 'csv_file',
      label: 'CSV File',
      icon: '📁',
      onClick: () => onAnalyzeData({ 
        query: 'Process CSV file data',
        analysisType: 'descriptive'
      }),
      variant: 'primary' as const,
      disabled: false
    },
    {
      id: 'db',
      label: 'DB',
      icon: '🗋',
      onClick: () => console.log('🗋 Database mode - coming soon'),
      disabled: true
    },
    {
      id: 'url',
      label: 'URL',
      icon: '🔗',
      onClick: () => console.log('🔗 URL mode - coming soon'),
      disabled: true
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📄',
      onClick: () => console.log('📄 Other mode - coming soon'),
      disabled: true
    }
  ];

  // Custom empty state for Data Scientist Widget
  const dataScientistEmptyState: EmptyStateConfig = {
    icon: '📊',
    title: 'Ready to Analyze Data',
    description: 'Upload CSV files, connect to databases, or provide data URLs. Perform queries, create visualizations, and build ML models with AI assistance.',
    actionText: 'Upload CSV',
    onAction: () => {
      document.getElementById('csv-upload')?.click();
    }
  };

  return (
    <BaseWidget
      title="DataWise Analytics"
      icon="📊"
      isProcessing={isAnalyzing}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
      onBack={onBack}
      showBackButton={true}
      emptyStateConfig={dataScientistEmptyState}
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