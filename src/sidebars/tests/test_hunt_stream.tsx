import React, { useState, useEffect } from 'react';
import { SimpleAIClient } from '../../services/SimpleAIClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * Test component for debugging Hunt (Web Tools) streaming issues
 */
export const TestHuntStream: React.FC = () => {
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState('web_search');
  const [selectedAnalysis, setSelectedAnalysis] = useState(['product_analysis']);
  const { user } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('HUNT TEST LOG:', logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Setup event listeners
  useEffect(() => {
    if (!client) return;

    addLog('Setting up Hunt (Web Tools) event listeners...');

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
      addLog('Cleaning up Hunt event listeners...');
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
    
    addLog('Starting Hunt (Web Tools) test request...');
    addLog(`User ID: ${user?.user_id || 'anonymous'}`);
    addLog(`Selected Tool: ${selectedTool}`);
    addLog(`Selected Analysis: ${selectedAnalysis.join(', ')}`);

    try {
      let requestMetadata;
      let prompt;

      // Configure request based on web tool
      switch (selectedTool) {
        case 'web_search':
          prompt = 'Search for AirPods Pro 3rd generation reviews and pricing';
          requestMetadata = {
            sender: 'hunt-app',
            template_parameters: {
              app_id: "hunt",
              template_id: "web_search_prompt",
              prompt_args: {
                tool: "web_search",
                query: prompt,
                analysis_types: selectedAnalysis,
                search_depth: "comprehensive",
                include_recent: true
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'hunt_test_session',
            metadata: {
              sender: 'hunt-app',
              app: 'hunt',
              requestType: 'web_search'
            }
          };
          break;

        case 'web_crawl':
          prompt = 'Analyze https://www.apple.com/airpods-pro/ for product specifications and pricing';
          requestMetadata = {
            sender: 'hunt-app',
            template_parameters: {
              app_id: "hunt",
              template_id: "web_crawl_prompt",
              prompt_args: {
                tool: "web_crawl",
                urls: ["https://www.apple.com/airpods-pro/"],
                analysis_types: selectedAnalysis,
                extract_data: ["specs", "pricing", "features"],
                comparison_mode: false
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'hunt_test_session',
            metadata: {
              sender: 'hunt-app',
              app: 'hunt',
              requestType: 'web_crawling'
            }
          };
          break;

        case 'web_automation':
          prompt = 'Automate filling contact form on website with test data';
          requestMetadata = {
            sender: 'hunt-app',
            template_parameters: {
              app_id: "hunt",
              template_id: "web_automation_prompt",
              prompt_args: {
                tool: "web_automation",
                task_description: prompt,
                automation_type: "form_filling",
                target_url: "https://example.com/contact",
                test_data: {
                  name: "John Doe",
                  email: "john@example.com",
                  message: "Test automation message"
                }
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'hunt_test_session',
            metadata: {
              sender: 'hunt-app',
              app: 'hunt',
              requestType: 'web_automation'
            }
          };
          break;

        default:
          prompt = 'Perform comprehensive web research on smartphone market trends';
          requestMetadata = {
            sender: 'hunt-app',
            template_parameters: {
              app_id: "hunt",
              template_id: "comprehensive_research_prompt",
              prompt_args: {
                research_topic: prompt,
                analysis_types: selectedAnalysis,
                tools_used: ["web_search", "web_crawl"],
                depth: "deep"
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'hunt_test_session',
            metadata: {
              sender: 'hunt-app',
              app: 'hunt',
              requestType: 'comprehensive_research'
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

  const webTools = [
    { id: 'web_search', name: 'Web Search', icon: '=' },
    { id: 'web_crawl', name: 'Web Crawl', icon: '=w' },
    { id: 'web_automation', name: 'Web Automation', icon: '>' }
  ];

  const analysisTypes = [
    { id: 'product_analysis', name: 'Product Analysis', icon: '=�' },
    { id: 'sentiment_analysis', name: 'Sentiment Analysis', icon: '=
' },
    { id: 'market_research', name: 'Market Research', icon: '=�' },
    { id: 'price_comparison', name: 'Price Comparison', icon: '=�' },
    { id: 'social_analysis', name: 'Social Analysis', icon: '<' },
    { id: 'feature_comparison', name: 'Feature Comparison', icon: '�' }
  ];

  const toggleAnalysisType = (analysisId: string) => {
    setSelectedAnalysis(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-white h-screen overflow-hidden">
      <h1 className="text-2xl font-bold mb-4">= Test: Hunt Stream (Web Tools)</h1>
      
      {/* Control Panel */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        {/* Tool Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Web Tool:</label>
          <select 
            value={selectedTool} 
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
          >
            {webTools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.icon} {tool.name}
              </option>
            ))}
          </select>
        </div>

        {/* Analysis Types */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Analysis Types:</label>
          <div className="flex flex-wrap gap-2">
            {analysisTypes.map(analysis => (
              <button
                key={analysis.id}
                onClick={() => toggleAnalysisType(analysis.id)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedAnalysis.includes(analysis.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {analysis.icon} {analysis.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleTest}
            disabled={isProcessing}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded"
          >
            {isProcessing ? 'Hunting...' : 'Run Hunt Test'}
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
              <div className="text-gray-500">No logs yet. Click Run Hunt Test to start.</div>
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