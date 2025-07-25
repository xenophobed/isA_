/**
 * ============================================================================
 * Hunt Widget UI (HuntWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Web tools service interface using standardized BaseWidget layout
 * - Network search, web crawling, and automation capabilities
 * - Analysis type selection and comprehensive analysis functions
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in search results history management
 * - Consistent edit and management actions for web content
 * - Streaming status display for search progress
 * - Web-specific actions (bookmark, share, analyze)
 */
import React, { useState } from 'react';
import { HuntWidgetParams } from '../../../types/widgetTypes';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

// Web Tools modes based on documentation (copied from hunt_sidebar.tsx)
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

// Analysis types for richer outputs (copied from hunt_sidebar.tsx)
const analysisTypes = [
  { id: 'product_analysis', name: 'Product Analysis', icon: '📱', desc: 'Specs, pricing, reviews' },
  { id: 'sentiment_analysis', name: 'Sentiment Analysis', icon: '😊', desc: 'User opinions, ratings' },
  { id: 'market_research', name: 'Market Research', icon: '📊', desc: 'Trends, competitors' },
  { id: 'price_comparison', name: 'Price Comparison', icon: '💰', desc: 'Best deals, price history' },
  { id: 'social_analysis', name: 'Social Analysis', icon: '🌐', desc: 'Social mentions, buzz' },
  { id: 'feature_comparison', name: 'Feature Comparison', icon: '⚖️', desc: 'Side-by-side analysis' }
];

interface HuntWidgetProps {
  isSearching: boolean;
  searchResults: any[];
  lastQuery: string;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onSearch: (params: HuntWidgetParams) => Promise<void>;
  onClearResults: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
}

/**
 * Hunt Widget Input Area - Content that goes inside BaseWidget
 */
const HuntInputArea: React.FC<HuntWidgetProps> = ({
  isSearching,
  searchResults,
  lastQuery,
  triggeredInput,
  onSearch,
  onClearResults
}) => {
  const [selectedTool, setSelectedTool] = useState<WebTool>(webTools[0]);
  const [input, setInput] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string[]>(['product_analysis']);

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
    if (!input.trim() || !onSearch || isSearching) return;

    console.log('🔍 Starting web tool execution:', selectedTool.id);

    try {
      const params: HuntWidgetParams = {
        query: input.trim(),
        category: selectedTool.id
      };
      
      await onSearch(params);
      console.log('🚀 Web Tools: Request sent with tool:', selectedTool.name);
    } catch (error) {
      console.error('Web tool execution failed:', error);
    }
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
            console.log('🔍 Hunt input changed:', e.target.value.length);
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
                console.log('🔍 Web tool selected:', tool.name);
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
        disabled={isSearching || !input.trim()}
        className={`w-full p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded text-white font-medium transition-all text-sm hover:from-blue-600 hover:to-green-600 flex items-center justify-center gap-2 ${
          isSearching ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSearching ? (
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
      {isSearching && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-300">
              Processing {selectedTool.name}...
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

/**
 * Hunt Widget with BaseWidget - New standardized layout
 */
export const HuntWidget: React.FC<HuntWidgetProps> = ({
  isSearching,
  searchResults,
  lastQuery,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onSearch,
  onClearResults,
  onSelectOutput,
  onClearHistory
}) => {
  
  // Custom edit actions for search results
  const editActions: EditAction[] = [
    {
      id: 'bookmark',
      label: 'Bookmark',
      icon: '🔖',
      onClick: (content) => {
        // Save search result as bookmark
        console.log('Bookmarking search result:', content);
        // Could integrate with browser bookmarks or local storage
      }
    },
    {
      id: 'share_link',
      label: 'Share',
      icon: '📤',
      onClick: (content) => {
        // Share search result URL or content
        if (typeof content === 'object' && content !== null) {
          const shareText = JSON.stringify(content, null, 2);
          navigator.clipboard.writeText(shareText);
        }
      }
    },
    {
      id: 'analyze_further',
      label: 'Analyze',
      icon: '🔍',
      onClick: (content) => {
        // Trigger further analysis of the search result
        console.log('Analyzing search result further:', content);
      }
    }
  ];

  // Custom management actions for web search
  const managementActions: ManagementAction[] = [
    {
      id: 'web_search',
      label: 'Search',
      icon: '🔍',
      onClick: () => onSearch({ 
        query: 'Quick web search'
      }),
      disabled: isSearching
    },
    {
      id: 'web_crawl',
      label: 'Crawl',
      icon: '🕷️',
      onClick: () => onSearch({ 
        query: 'Web crawl analysis'
      }),
      disabled: isSearching
    },
    {
      id: 'automation',
      label: 'Automate',
      icon: '🤖',
      onClick: () => onSearch({ 
        query: 'Web automation task'
      }),
      disabled: isSearching
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearResults();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isSearching
    }
  ];

  return (
    <BaseWidget
      title="Web Hunt"
      icon="🕷️"
      isProcessing={isSearching}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
    >
      <HuntInputArea
        isSearching={isSearching}
        searchResults={searchResults}
        lastQuery={lastQuery}
        triggeredInput={triggeredInput}
        onSearch={onSearch}
        onClearResults={onClearResults}
      />
    </BaseWidget>
  );
};