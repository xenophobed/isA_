import React, { useState, useEffect } from 'react';
import { SimpleAIClient } from '../../services/SimpleAIClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * Test component for debugging Knowledge streaming issues
 */
export const TestKnowledgeStream: React.FC = () => {
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState('add_documents');
  const [selectedFileType, setSelectedFileType] = useState('pdf');
  const { user } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('KNOWLEDGE TEST LOG:', logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Setup event listeners
  useEffect(() => {
    if (!client) return;

    addLog('Setting up Knowledge event listeners...');

    const events = [
      'streaming:start',
      'streaming:status', 
      'streaming:finish',
      'streaming:end',
      'token:received',
      'message:received',
      'typing:changed',
      'custom_event',
      'tool:result',
      'error'
    ];

    const unsubscribers: Array<() => void> = [];

    events.forEach(eventName => {
      const unsubscribe = client.on(eventName, (data) => {
        addLog(`EVENT [${eventName}]: ${JSON.stringify(data, null, 2)}`);
        
        if (eventName === 'message:received') {
          setResult(data);
          setIsProcessing(false);
          addLog('Set isProcessing = false (from message:received)');
        }
      });
      
      if (unsubscribe) {
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      addLog('Cleaning up Knowledge event listeners...');
      unsubscribers.forEach(cleanup => cleanup?.());
    };
  }, [client]);

  const handleTest = async () => {
    if (!client || isProcessing) return;

    // Clear previous logs and results
    setLogs([]);
    setResult(null);
    setError(null);
    setIsProcessing(true);
    
    addLog('Starting Knowledge test request...');
    addLog(`User ID: ${user?.user_id || 'anonymous'}`);
    addLog(`Selected Mode: ${selectedMode}`);
    addLog(`Selected File Type: ${selectedFileType}`);

    try {
      let requestMetadata;
      let prompt;

      // Configure request based on knowledge mode
      switch (selectedMode) {
        case 'add_documents':
          prompt = `Process test_document.${selectedFileType} into knowledge base`;
          requestMetadata = {
            sender: 'knowledge-app',
            template_parameters: {
              app_id: "knowledge",
              template_id: selectedFileType === 'pdf' 
                ? "process_pdf_to_knowledge_graph_prompt"
                : "process_text_to_vector_store_prompt",
              prompt_args: {
                file_path: `test_document.${selectedFileType}`,
                user_id: user?.user_id || 'anonymous',
                processing_mode: "automatic",
                source_metadata: JSON.stringify({
                  title: `Test Document ${selectedFileType.toUpperCase()}`,
                  type: 'document',
                  size: 1024000
                })
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'knowledge_test_session',
            metadata: {
              sender: 'knowledge-app',
              app: 'knowledge',
              requestType: 'document_processing'
            }
          };
          break;

        case 'ask_question':
          prompt = 'What are the main topics covered in the uploaded documents?';
          requestMetadata = {
            sender: 'knowledge-app',
            template_parameters: {
              app_id: "knowledge",
              template_id: "query_knowledge_base_prompt",
              prompt_args: {
                query: prompt,
                search_type: "semantic",
                max_results: 5,
                include_metadata: true
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'knowledge_test_session',
            metadata: {
              sender: 'knowledge-app',
              app: 'knowledge',
              requestType: 'knowledge_query'
            }
          };
          break;

        case 'browse_documents':
          prompt = 'List all documents in the knowledge base with their metadata';
          requestMetadata = {
            sender: 'knowledge-app',
            template_parameters: {
              app_id: "knowledge",
              template_id: "browse_knowledge_base_prompt",
              prompt_args: {
                list_type: "all_documents",
                include_preview: true,
                sort_by: "upload_date",
                limit: 20
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'knowledge_test_session',
            metadata: {
              sender: 'knowledge-app',
              app: 'knowledge',
              requestType: 'knowledge_browse'
            }
          };
          break;

        case 'search_documents':
          prompt = 'Search for documents related to machine learning and AI';
          requestMetadata = {
            sender: 'knowledge-app',
            template_parameters: {
              app_id: "knowledge",
              template_id: "search_knowledge_documents_prompt",
              prompt_args: {
                search_query: prompt,
                search_type: "hybrid",
                filters: {
                  document_type: ["pdf", "text"],
                  date_range: "last_30_days"
                },
                max_results: 10
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'knowledge_test_session',
            metadata: {
              sender: 'knowledge-app',
              app: 'knowledge',
              requestType: 'document_search'
            }
          };
          break;

        default:
          prompt = 'Generate summary of knowledge base contents';
          requestMetadata = {
            sender: 'knowledge-app',
            template_parameters: {
              app_id: "knowledge",
              template_id: "summarize_knowledge_base_prompt",
              prompt_args: {
                summary_type: "comprehensive",
                include_statistics: true,
                group_by_topic: true
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'knowledge_test_session',
            metadata: {
              sender: 'knowledge-app',
              app: 'knowledge',
              requestType: 'knowledge_summary'
            }
          };
      }

      addLog('Sending request with metadata: ' + JSON.stringify(requestMetadata, null, 2));

      const messageId = await client.sendMessage(prompt, requestMetadata);
      addLog(`Request sent, message ID: ${messageId}`);
      
    } catch (err: any) {
      const errorMessage = err.message || String(err);
      addLog(`Request failed: ${errorMessage}`);
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const knowledgeModes = [
    { id: 'add_documents', name: 'Add Documents', icon: '=Á' },
    { id: 'ask_question', name: 'Ask Question', icon: 'S' },
    { id: 'browse_documents', name: 'Browse Documents', icon: '=Ú' },
    { id: 'search_documents', name: 'Search Documents', icon: '=' },
    { id: 'summarize', name: 'Summarize', icon: '=Ý' }
  ];

  const fileTypes = [
    { id: 'pdf', name: 'PDF Document', icon: '=Ä' },
    { id: 'txt', name: 'Text File', icon: '=Ý' },
    { id: 'docx', name: 'Word Document', icon: '=Ø' },
    { id: 'md', name: 'Markdown', icon: '=Ö' }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white h-screen overflow-hidden">
      <h1 className="text-2xl font-bold mb-4">=Ú Test: Knowledge Stream</h1>
      
      {/* Control Panel */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Knowledge Mode:</label>
            <select 
              value={selectedMode} 
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              {knowledgeModes.map(mode => (
                <option key={mode.id} value={mode.id}>
                  {mode.icon} {mode.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMode === 'add_documents' && (
            <div>
              <label className="block text-sm font-medium mb-2">File Type:</label>
              <select 
                value={selectedFileType} 
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                {fileTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleTest}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded"
          >
            {isProcessing ? 'Processing...' : 'Run Knowledge Test'}
          </button>
          
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Clear Logs
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Processing:</span>
            <span className={isProcessing ? 'text-yellow-400' : 'text-green-400'}>
              {isProcessing ? ' Yes' : ' No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Has Result:</span>
            <span className={result ? 'text-green-400' : 'text-gray-500'}>
              {result ? ' Yes' : ' No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Has Error:</span>
            <span className={error ? 'text-red-400' : 'text-gray-500'}>
              {error ? ' Yes' : ' No'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-280px)]">
        {/* Logs Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Event Logs ({logs.length})</h3>
          <div className="bg-black rounded p-2 h-[calc(100%-40px)] overflow-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click Run Knowledge Test to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Result/Error Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Result/Error</h3>
          <div className="bg-black rounded p-2 h-[calc(100%-40px)] overflow-auto">
            {error && (
              <div className="mb-4">
                <h4 className="text-red-400 font-bold mb-2">Error:</h4>
                <pre className="text-red-300 text-xs whitespace-pre-wrap">{error}</pre>
              </div>
            )}
            
            {result && (
              <div>
                <h4 className="text-green-400 font-bold mb-2">Final Result:</h4>
                <div className="space-y-2 text-xs">
                  <div className="text-gray-400">
                    <div>Role: <span className="text-white">{result.role}</span></div>
                    <div>ID: <span className="text-white">{result.id}</span></div>
                    <div>Sender: <span className="text-white">{result.metadata?.sender || 'none'}</span></div>
                    <div>Content Length: <span className="text-white">{result.content?.length || 0}</span></div>
                  </div>
                  
                  <div className="border-t border-gray-600 pt-2">
                    <div className="text-gray-400 mb-1">Content:</div>
                    <pre className="text-white whitespace-pre-wrap bg-gray-900 p-2 rounded max-h-32 overflow-auto">
                      {result.content}
                    </pre>
                  </div>
                  
                  {result.metadata && (
                    <div className="border-t border-gray-600 pt-2">
                      <div className="text-gray-400 mb-1">Metadata:</div>
                      <pre className="text-gray-300 whitespace-pre-wrap bg-gray-900 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!result && !error && (
              <div className="text-gray-500">No result yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};