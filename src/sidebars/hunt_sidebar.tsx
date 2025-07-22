import React, { useState } from 'react';
import { BaseSidebar } from '../components/ui/BaseSidebar';
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

interface BaseSidebarInjectedProps {
  isProcessing?: boolean;
  error?: string | null;
  result?: any;
  onProcess?: (input: string, templateParams?: any, metadata?: any) => Promise<void>;
  onReset?: () => void;
  client?: any;
}

type HuntContentProps = BaseSidebarInjectedProps;

const HuntContent: React.FC<HuntContentProps> = ({
  isProcessing,
  onProcess
}) => {
  const [selectedTool, setSelectedTool] = useState<WebTool>(webTools[0]);
  const [input, setInput] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string[]>(['product_analysis']);
  const [processingStatus, setProcessingStatus] = useState('');

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
    if (!input.trim() || !onProcess || isProcessing) return;

    const traceId = logger.startTrace('WEB_TOOL_EXECUTION');
    logger.info(LogCategory.USER_INPUT, 'Starting web tool execution', {
      tool: selectedTool.id,
      inputLength: input.length,
      analysisTypes: selectedAnalysis
    });

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
      
      await onProcess(input, {
        app_id: "hunt",
        template_id: `${selectedTool.id}_prompt`,
        prompt_args: {
          user_query: input,
          service_function: serviceFunction,
          service_args: serviceArgs,
          web_tool: selectedTool.id,
          analysis_types: selectedAnalysis
        }
      }, {
        sender: 'hunt-app',
        app: 'hunt',
        requestId,
        expected_outputs: ['analysis_results', 'extracted_data', 'rich_content'],
        estimated_time: selectedTool.estimatedTime,
        original_input: input
      });

      console.log('🚀 Web Tools: Request sent with tool:', selectedTool.name);
    } catch (error) {
      logger.error(LogCategory.API_CALL, 'Web tool execution failed', {
        error: error instanceof Error ? error.message : String(error),
        tool: selectedTool.id
      });
      console.error('Web tool execution failed:', error);
      setProcessingStatus('');
    }

    logger.endTrace();
  };

  return (
    <div className="space-y-3 p-3">
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
            Hunt
          </>
        )}
      </button>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-300">
              {processingStatus || `Processing ${selectedTool.name}...`}
            </span>
          </div>
        </div>
      )}

      {/* Quick Search Templates */}
      <div>
        <div className="text-xs text-white/60 mb-1">💡 Quick Searches</div>
        <div className="grid grid-cols-1 gap-1">
          <button
            onClick={() => {
              setInput("Find best wireless earbuds under $100");
              setSelectedTool(webTools[0]);
              setSelectedAnalysis(['product_analysis', 'price_comparison']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🎧 Best wireless earbuds
          </button>
          <button
            onClick={() => {
              setInput("Compare iPhone vs Android reviews");
              setSelectedTool(webTools[0]);
              setSelectedAnalysis(['sentiment_analysis', 'feature_comparison']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            📱 Phone comparison
          </button>
          <button
            onClick={() => {
              setInput("Track price history for Tesla Model 3");
              setSelectedTool(webTools[1]);
              setSelectedAnalysis(['price_comparison', 'market_research']);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🚗 Price tracking
          </button>
        </div>
      </div>
    </div>
  );
};

export const HuntSidebar: React.FC<HuntSidebarProps> = ({ triggeredInput }) => {
  return (
    <BaseSidebar
      title="Hunt AI"
      icon="🔍"
      triggeredInput={triggeredInput}
      onResult={(result) => {
        console.log('🔍 Hunt result:', result);
      }}
      onError={(error) => {
        console.error('❌ Hunt error:', error);
      }}
    >
      <HuntContent />
    </BaseSidebar>
  );
};