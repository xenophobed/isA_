import React, { useState } from 'react';
import { SimpleAIClient } from '../services/SimpleAIClient';
import { logger, LogCategory } from '../utils/logger';

interface HuntSidebarProps {
  triggeredInput?: string;
}

// Web Tools modes based on documentation
interface WebTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  placeholder: string;
  features: string[];
  estimatedTime: string;
}

const webTools: WebTool[] = [
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information with advanced capabilities',
    icon: '🔍',
    placeholder: 'Search for products, reviews, prices, trends...',
    features: ['Multiple perspectives', 'Trending content', 'Research topics'],
    estimatedTime: '1-3 seconds'
  },
  {
    id: 'web_crawl',
    name: 'Web Crawl',
    description: 'Intelligently analyze and extract data from web pages',
    icon: '🕷️',
    placeholder: 'URL to analyze or compare (comma-separated for multiple)',
    features: ['Product specs', 'Price extraction', 'Content analysis', 'Multi-site comparison'],
    estimatedTime: '1-15 seconds'
  },
  {
    id: 'web_automation',
    name: 'Web Automation',
    description: 'Automate browser interactions and complex workflows',
    icon: '🤖',
    placeholder: 'Task: search for airpods, fill contact form...',
    features: ['Form filling', 'Navigation', 'Data collection', 'Workflow testing'],
    estimatedTime: '15-30 seconds'
  }
];

// Analysis types for richer outputs
const analysisTypes = [
  { id: 'product_analysis', name: 'Product Analysis', icon: '📱', desc: 'Specs, pricing, reviews' },
  { id: 'sentiment_analysis', name: 'Sentiment Analysis', icon: '😊', desc: 'User opinions, ratings' },
  { id: 'market_research', name: 'Market Research', icon: '📊', desc: 'Trends, competitors' },
  { id: 'price_comparison', name: 'Price Comparison', icon: '💰', desc: 'Best deals, price history' },
  { id: 'social_analysis', name: 'Social Analysis', icon: '🌐', desc: 'Social mentions, buzz' },
  { id: 'feature_comparison', name: 'Feature Comparison', icon: '⚖️', desc: 'Side-by-side analysis' }
];

/**
 * Hunt AI - Advanced Web Intelligence
 * Web Search, Crawl, and Automation with rich analysis capabilities
 */
export const HuntSidebar: React.FC<HuntSidebarProps> = ({ triggeredInput }) => {
  // Use dedicated AI client for Hunt sidebar (independent from main app)
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [selectedTool, setSelectedTool] = useState<WebTool>(webTools[0]);
  const [input, setInput] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string[]>(['product_analysis']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Auto-fill input from triggered input
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== input) {
      logger.info(LogCategory.USER_INPUT, 'Hunt sidebar received triggered input', {
        input: triggeredInput.substring(0, 100)
      });
      setInput(triggeredInput);
      
      // Smart tool detection based on input
      if (triggeredInput.includes('http') || triggeredInput.includes('www.')) {
        setSelectedTool(webTools[1]); // web_crawl for URLs
      } else if (triggeredInput.toLowerCase().includes('automate') || triggeredInput.toLowerCase().includes('fill')) {
        setSelectedTool(webTools[2]); // web_automation for tasks
      } else {
        setSelectedTool(webTools[0]); // web_search for queries
      }
    }
  }, [triggeredInput, input]);

  // Handle analysis type selection
  const toggleAnalysisType = (analysisId: string) => {
    setSelectedAnalysis(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  // Execute web tool based on Web Tools Documentation
  const handleWebToolExecution = async () => {
    if (!input.trim() || !client || isProcessing) return;

    const traceId = logger.startTrace('WEB_TOOL_EXECUTION');
    logger.info(LogCategory.USER_INPUT, 'Starting web tool execution', {
      tool: selectedTool.id,
      inputLength: input.length,
      analysisTypes: selectedAnalysis
    });

    setIsProcessing(true);
    setProcessingStatus(`Processing with ${selectedTool.name}...`);

    try {
      let serviceFunction = '';
      let serviceArgs: any = {};

      // Configure based on selected tool
      switch (selectedTool.id) {
        case 'web_search':
          serviceFunction = 'web_search';
          serviceArgs = {
            query: input,
            count: 10
          };
          break;
        
        case 'web_crawl':
          serviceFunction = 'web_crawl';
          // Check if multiple URLs for comparison
          const urls = input.split(',').map(url => url.trim()).filter(url => url.length > 0);
          if (urls.length > 1) {
            serviceArgs = {
              url: JSON.stringify(urls),
              analysis_request: `Analyze and compare: ${selectedAnalysis.join(', ')}`
            };
          } else {
            serviceArgs = {
              url: input,
              analysis_request: `Extract data for: ${selectedAnalysis.join(', ')}`
            };
          }
          break;
        
        case 'web_automation':
          serviceFunction = 'web_automation';
          // Extract URL and task from input
          const parts = input.split(' ', 2);
          const url = parts[0].includes('http') ? parts[0] : 'https://google.com';
          const task = parts[0].includes('http') ? parts.slice(1).join(' ') : input;
          serviceArgs = {
            url: url,
            task: task
          };
          break;
      }

      const requestId = `hunt-${selectedTool.id}-${Date.now()}`;
      const messageData = {
        template_parameters: {
          app_id: "hunt",
          template_id: `${selectedTool.id}_prompt`,
          prompt_args: {
            user_query: input,
            service_function: serviceFunction,
            service_args: serviceArgs,
            web_tool: selectedTool.id,
            analysis_types: selectedAnalysis
          }
        },
        metadata: {
          sender: 'hunt-app',
          app: 'hunt',
          requestId,
          expected_outputs: ['analysis_results', 'extracted_data', 'rich_content'],
          estimated_time: selectedTool.estimatedTime,
          original_input: input
        }
      };

      logger.trackAPICall('sendMessage', 'POST', messageData);

      // Send request to Web Tools service
      await client.sendMessage(input, messageData);

      console.log('🚀 Web Tools: Request sent with tool:', selectedTool.name);
    } catch (error) {
      logger.error(LogCategory.API_CALL, 'Web tool execution failed', {
        error: error instanceof Error ? error.message : String(error),
        tool: selectedTool.id
      });
      console.error('Web tool execution failed:', error);
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }

    logger.endTrace();
  };

  return (
    <div className="space-y-3">
      {/* Compact Tool Header */}
      <div className="flex items-center gap-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
        <span className="text-lg">{selectedTool.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{selectedTool.name}</div>
          <div className="flex gap-2 text-xs text-white/50">
            <span>{selectedTool.estimatedTime}</span>
            <span>{selectedTool.features.length} features</span>
          </div>
        </div>
      </div>

      {/* Compact Input */}
      <div>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            logger.debug(LogCategory.USER_INPUT, 'Hunt input changed', {
              length: e.target.value.length,
              tool: selectedTool.id
            });
          }}
          placeholder={selectedTool.placeholder}
          className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-sm"
          rows={2}
        />
      </div>

      {/* Compact Tool Selector */}
      <div>
        <div className="text-xs text-white/60 mb-1">🛠️ Web Tools</div>
        <div className="grid grid-cols-3 gap-1">
          {webTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool);
                logger.info(LogCategory.SIDEBAR_INTERACTION, 'Web tool selected', {
                  toolId: tool.id,
                  toolName: tool.name
                });
              }}
              className={`p-2 rounded border transition-all text-center ${
                selectedTool.id === tool.id
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
              }`}
              title={`${tool.name} - ${tool.description} (${tool.estimatedTime})`}
            >
              <div className="text-sm mb-1">{tool.icon}</div>
              <div className="text-xs font-medium truncate">{tool.name.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Analysis Types */}
      <div>
        <div className="text-xs text-white/60 mb-1">📊 Analysis ({selectedAnalysis.length} selected)</div>
        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
          {analysisTypes.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => toggleAnalysisType(analysis.id)}
              className={`p-1 rounded border transition-all text-left ${
                selectedAnalysis.includes(analysis.id)
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
              }`}
              title={analysis.desc}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">{analysis.icon}</span>
                <span className="text-xs font-medium truncate">{analysis.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Execute Button */}
      <button
        onClick={handleWebToolExecution}
        disabled={isProcessing || !input.trim()}
        className={`w-full p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded text-white font-medium transition-all text-sm hover:from-blue-600 hover:to-green-600 flex items-center justify-center gap-2 ${
          isProcessing ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <span>{selectedTool.icon}</span>
            Execute {selectedTool.name}
          </>
        )}
      </button>

      {/* Compact Processing Status */}
      {isProcessing && (
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-xs text-blue-300">{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Compact Quick Actions */}
      <div>
        <div className="text-xs text-white/60 mb-1">💡 Quick examples</div>
        <div className="grid grid-cols-1 gap-1">
          <button 
            onClick={() => {
              setInput("gaming laptop under $1500");
              setSelectedTool(webTools[0]); // web_search
              setSelectedAnalysis(['product_analysis', 'price_comparison']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🎮 Gaming laptop research
          </button>
          <button 
            onClick={() => {
              setInput("https://amazon.com/product");
              setSelectedTool(webTools[1]); // web_crawl
              setSelectedAnalysis(['product_analysis', 'sentiment_analysis']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🕷️ Amazon product analysis
          </button>
          <button 
            onClick={() => {
              setInput("https://google.com search for airpods");
              setSelectedTool(webTools[2]); // web_automation
              setSelectedAnalysis(['price_comparison']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🤖 Automate Google search
          </button>
        </div>
      </div>

      {/* Compact Features Info */}
      <div className="p-2 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded">
        <div className="text-blue-300 text-xs font-medium mb-1">🚀 Web Intelligence</div>
        <div className="text-blue-200/80 text-xs space-y-1">
          <div>• Search, crawl, automate any website</div>
          <div>• Rich outputs: text, images, videos</div>
          <div>• Product sentiment & social analysis</div>
          <div>• Multi-site comparison & extraction</div>
        </div>
      </div>
    </div>
  );
};