import React, { useState } from 'react';
import { SimpleAIClient } from '../services/SimpleAIClient';

interface DataScientistSidebarProps {
  triggeredInput?: string;
}

// Data processing workflow state
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

/**
 * Data Scientist Sidebar
 * Modern data analytics interface using Data Analytics Service
 */
export const DataScientistSidebar: React.FC<DataScientistSidebarProps> = ({ triggeredInput }) => {
  // Use dedicated AI client for Data Scientist sidebar (independent from main app)
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Data workflow state
  const [workflow, setWorkflow] = useState<DataWorkflow>({
    mode: 'combined',
    dataSource: {
      status: 'none'
    },
    query: ''
  });

  // Auto-fill query when triggered
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== workflow.query) {
      setWorkflow(prev => ({ ...prev, query: triggeredInput }));
    }
  }, [triggeredInput]);

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
    if (!workflow.dataSource.file || isProcessing || !client) return;

    setIsProcessing(true);
    try {
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'processing' }
      });

      const response = await client.sendMessage('', {
        template_parameters: {
          app_id: "data-scientist",
          template_id: "ingest_data_source_prompt",
          prompt_args: {
            source_path: workflow.dataSource.file.name,
            source_type: workflow.dataSource.type,
            file_data: workflow.dataSource.file
          }
        },
        metadata: {
          sender: 'data-analytics',
          requestType: 'data_ingestion',
          requestId: `ingest-${Date.now()}`,
          expected_outputs: [
            'sqlite_database_path',
            'pgvector_database', 
            'metadata_pipeline',
            'processing_time_ms'
          ]
        }
      });

      // Extract database paths from response for subsequent queries
      let responseData: any = {};
      try {
        responseData = typeof response === 'string' ? JSON.parse(response) : response;
      } catch (e) {
        console.warn('Failed to parse response:', e);
      }
      
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'ready' },
        sqliteDbPath: responseData.sqlite_database_path,
        pgvectorDb: responseData.pgvector_database
      });
    } catch (error) {
      console.error('Data ingestion failed:', error);
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'error' }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Query processing (Function 2)
  const handleQueryProcessing = async () => {
    if (!workflow.query.trim() || !workflow.sqliteDbPath || isProcessing || !client) return;

    setIsProcessing(true);
    try {
      await client.sendMessage('', {
        template_parameters: {
          app_id: "data-scientist",
          template_id: "query_with_language_prompt",
          prompt_args: {
            natural_language_query: workflow.query,
            sqlite_database_path: workflow.sqliteDbPath,
            pgvector_database: workflow.pgvectorDb
          }
        },
        metadata: {
          sender: 'data-analytics',
          requestType: 'query_processing',
          requestId: `query-${Date.now()}`,
          expected_outputs: [
            'query_processing',
            'results',
            'generated_sql',
            'sql_explanation'
          ]
        }
      });
    } catch (error) {
      console.error('Query processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Combined workflow (Function 1 + Function 2)
  const handleCombinedAnalysis = async () => {
    if (!workflow.dataSource.file || !workflow.query.trim() || isProcessing || !client) return;

    setIsProcessing(true);
    try {
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'processing' }
      });

      await client.sendMessage('', {
        template_parameters: {
          app_id: "data-scientist",
          template_id: "process_data_source_and_query_prompt",
          prompt_args: {
            source_path: workflow.dataSource.file.name,
            source_type: workflow.dataSource.type,
            natural_language_query: workflow.query,
            file_data: workflow.dataSource.file
          }
        },
        metadata: {
          sender: 'data-analytics',
          requestType: 'combined_analysis',
          requestId: `combined-${Date.now()}`,
          expected_outputs: [
            'ingestion_result',
            'query_result', 
            'generated_sql',
            'data_insights',
            'visualizations'
          ]
        }
      });

      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'ready' }
      });
    } catch (error) {
      console.error('Combined analysis failed:', error);
      updateWorkflow({
        dataSource: { ...workflow.dataSource, status: 'error' }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Supported file types
  const supportedTypes = [
    { ext: 'csv', name: 'CSV Files', icon: '📊' },
    { ext: 'xlsx', name: 'Excel Files', icon: '📈' },
    { ext: 'json', name: 'JSON Files', icon: '📋' },
    { ext: 'db', name: 'Database Files', icon: '🗄️' }
  ];

  // Quick analysis templates
  const quickQueries = [
    'Show me the trends in this data',
    'Find anomalies and outliers',
    'What are the key insights?',
    'Summarize the data by categories',
    'Show top 10 records by value',
    'Calculate averages and totals'
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
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
            disabled={!workflow.dataSource.file || isProcessing}
            className={`w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isProcessing ? 'animate-pulse' : 'hover:from-blue-600 hover:to-cyan-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
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
            disabled={!workflow.query.trim() || isProcessing}
            className={`w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isProcessing ? 'animate-pulse' : 'hover:from-purple-600 hover:to-pink-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
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
            disabled={!workflow.dataSource.file || !workflow.query.trim() || isProcessing}
            className={`w-full p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
              isProcessing ? 'animate-pulse' : 'hover:from-cyan-600 hover:to-purple-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
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

      {/* Processing Status */}
      {isProcessing && (
        <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <span className="text-sm text-cyan-300 font-medium">Data Analytics Service Working...</span>
          </div>
          <div className="text-xs text-white/60 space-y-1">
            {workflow.mode === 'combined' && (
              <>
                <div>• Ingesting and processing data files</div>
                <div>• Creating SQLite database and embeddings</div>
                <div>• Generating SQL from natural language</div>
                <div>• Executing query and analyzing results</div>
              </>
            )}
            {workflow.mode === 'upload' && (
              <>
                <div>• Processing data file structure</div>
                <div>• Creating searchable database</div>
                <div>• Generating semantic embeddings</div>
              </>
            )}
            {workflow.mode === 'query' && (
              <>
                <div>• Processing natural language query</div>
                <div>• Generating optimized SQL</div>
                <div>• Executing and formatting results</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};