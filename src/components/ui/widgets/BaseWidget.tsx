/**
 * ============================================================================
 * Base Widget UI (BaseWidget.tsx) - Standardized Widget Layout Component
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provides standardized three-area layout: Output, Input, Management
 * - Unifies widget UI structure and interaction patterns
 * - Supports streaming status display and multi-output management
 * - Simplifies code complexity across individual widgets
 * 
 * Three-Area Design:
 * 1. Output Area (Top): Output History | Content Display | Edit Actions
 * 2. Input Area (Middle): Main operation and input interface
 * 3. Management Area (Bottom): Quick action menu and toolbar
 */
import React, { useState, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Output history item interface
interface OutputHistoryItem {
  id: string;
  timestamp: Date;
  type: 'text' | 'image' | 'data' | 'error';
  title: string;
  content: any;
  params?: any;
  isStreaming?: boolean;
}

// Edit action interface
interface EditAction {
  id: string;
  label: string;
  icon: string;
  onClick: (content: any) => void;
  disabled?: boolean;
}

// Management action interface
interface ManagementAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// BaseWidget props interface
interface BaseWidgetProps {
  // Output area configuration
  outputHistory: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  editActions?: EditAction[];
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
  
  // Input area content
  children: ReactNode;
  
  // Management area configuration
  managementActions?: ManagementAction[];
  
  // Overall state
  isProcessing?: boolean;
  title?: string;
  icon?: string;
}

/**
 * BaseWidget - Standardized Widget Layout Component
 */
export const BaseWidget: React.FC<BaseWidgetProps> = ({
  outputHistory,
  currentOutput,
  isStreaming = false,
  streamingContent,
  editActions = [],
  onSelectOutput,
  onClearHistory,
  children,
  managementActions = [],
  isProcessing = false,
  title,
  icon
}) => {
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(
    currentOutput?.id || null
  );
  const [showHistory, setShowHistory] = useState(false);

  // Select output item
  const handleSelectOutput = (item: OutputHistoryItem) => {
    setSelectedOutputId(item.id);
    onSelectOutput?.(item);
  };

  // Render output content
  const renderOutputContent = (content: any, type: string) => {
    console.log('🖼️ BASEWIDGET: Rendering content:', { type, content, hasContent: !!content });
    
    switch (type) {
      case 'image':
        return (
          <img 
            src={content} 
            alt="Output" 
            className="max-w-full h-auto rounded border border-white/10"
            onLoad={() => console.log('🖼️ BASEWIDGET: Image loaded successfully:', content)}
            onError={(e) => console.error('🖼️ BASEWIDGET: Image load error:', e, content)}
          />
        );
      case 'search_results':
        // Perplexity-style search results display
        return (
          <div className="space-y-3">
            {Array.isArray(content) ? content.map((result, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                {/* Result Title */}
                {result.title && (
                  <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                    {result.title}
                  </h3>
                )}
                
                {/* Result URL */}
                {result.url && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-blue-400">🔗</span>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate"
                    >
                      {result.url}
                    </a>
                  </div>
                )}
                
                {/* Result Description/Content with Markdown */}
                {result.description && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-xs text-white/70 leading-relaxed mb-1 line-clamp-3">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ol>,
                        li: ({children}) => <li className="text-white/70 text-xs">{children}</li>,
                        a: ({href, children}) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 underline text-xs"
                          >
                            {children}
                          </a>
                        ),
                        code: ({children}) => (
                          <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre className="bg-gray-800 p-1 rounded text-xs overflow-x-auto mb-1">
                            {children}
                          </pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-blue-500 pl-1 text-white/60 italic text-xs mb-1">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>
                      }}
                    >
                      {result.description}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* Full content with markdown if available */}
                {result.content && result.content !== result.description && (
                  <div className="prose prose-invert prose-sm max-w-none mt-2">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-xs text-white/70 leading-relaxed mb-1 line-clamp-3">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ol>,
                        li: ({children}) => <li className="text-white/70 text-xs">{children}</li>,
                        a: ({href, children}) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 underline text-xs"
                          >
                            {children}
                          </a>
                        ),
                        code: ({children}) => (
                          <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre className="bg-gray-800 p-1 rounded text-xs overflow-x-auto mb-1">
                            {children}
                          </pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-blue-500 pl-1 text-white/60 italic text-xs mb-1">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>
                      }}
                    >
                      {result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* Additional metadata */}
                {(result.source || result.date) && (
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    {result.source && (
                      <span className="flex items-center gap-1">
                        <span>📰</span>
                        {result.source}
                      </span>
                    )}
                    {result.date && (
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        {result.date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-sm text-white/80">
                {typeof content === 'string' ? content : JSON.stringify(content)}
              </div>
            )}
          </div>
        );
      case 'data':
        return (
          <div className="bg-black/20 rounded p-2 max-h-32 overflow-y-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
            <div className="text-xs text-red-300">{content}</div>
          </div>
        );
      case 'text':
      default:
        return (
          <div className="prose prose-invert prose-sm max-w-none overflow-auto max-h-96">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-lg font-bold text-white mb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium text-white mb-2">{children}</h3>,
                p: ({children}) => <p className="text-sm text-white/80 leading-relaxed mb-2">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside text-white/80 text-sm space-y-1 mb-2 ml-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-white/80 text-sm space-y-1 mb-2 ml-2">{children}</ol>,
                li: ({children}) => <li className="text-white/80 text-sm">{children}</li>,
                a: ({href, children}) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    {children}
                  </a>
                ),
                code: ({children}) => (
                  <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-sm">
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-2 border-blue-500 pl-3 text-white/70 italic text-sm mb-2">
                    {children}
                  </blockquote>
                ),
                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-white/90">{children}</em>,
                table: ({children}) => (
                  <table className="min-w-full text-sm border-collapse border border-white/20 mb-2">
                    {children}
                  </table>
                ),
                thead: ({children}) => (
                  <thead className="bg-white/10">
                    {children}
                  </thead>
                ),
                tbody: ({children}) => (
                  <tbody>
                    {children}
                  </tbody>
                ),
                tr: ({children}) => (
                  <tr className="border-b border-white/10">
                    {children}
                  </tr>
                ),
                th: ({children}) => (
                  <th className="border border-white/20 px-2 py-1 text-left font-medium text-white">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="border border-white/20 px-2 py-1 text-white/80">
                    {children}
                  </td>
                )
              }}
            >
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </ReactMarkdown>
          </div>
        );
    }
  };

  // Get currently displayed output item
  const displayOutput = currentOutput || (selectedOutputId ? 
    outputHistory.find(item => item.id === selectedOutputId) : 
    outputHistory?.[0]
  );

  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-lg overflow-hidden">
      {/* Title Bar */}
      {(title || icon) && (
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          {icon && <span className="text-lg">{icon}</span>}
          {title && <span className="text-sm font-medium text-white/80">{title}</span>}
          {isProcessing && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-300">Processing...</span>
            </div>
          )}
        </div>
      )}

      {/* Output Area (Top) */}
      <div className="flex-1 min-h-0 flex relative">
        {/* Output History (Left Side) */}
        <div className={`${showHistory ? 'w-48' : 'w-12'} border-r border-white/10 transition-all duration-200`}>
          <div className="h-full flex flex-col">
            {/* History Toggle Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 border-b border-white/10 hover:bg-white/5 transition-all"
              title={showHistory ? "Hide History" : "Show History"}
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">📋</span>
                {showHistory && (
                  <span className="ml-2 text-xs text-white/60">
                    {outputHistory.length}
                  </span>
                )}
              </div>
            </button>

            {/* History List */}
            {showHistory && (
              <div className="flex-1 overflow-y-auto">
                {outputHistory.length === 0 ? (
                  <div className="p-2 text-xs text-white/40 text-center">
                    No output history
                  </div>
                ) : (
                  <div className="space-y-1 p-1">
                    {outputHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectOutput(item)}
                        className={`w-full p-2 rounded text-left transition-all ${
                          selectedOutputId === item.id
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">
                            {item.type === 'image' ? '🖼️' : 
                             item.type === 'data' ? '📊' : 
                             item.type === 'error' ? '❌' : '📝'}
                          </span>
                          {item.isStreaming && (
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="text-xs text-white/80 truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-white/40">
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Clear History Button */}
                {outputHistory.length > 0 && onClearHistory && (
                  <div className="border-t border-white/10 p-1">
                    <button
                      onClick={onClearHistory}
                      className="w-full p-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                    >
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Display Area (Middle) */}
        <div className="flex-1 min-w-0 flex flex-col">
          {displayOutput ? (
            <>
              {/* Content Title */}
              <div className="p-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {displayOutput.type === 'image' ? '🖼️' : 
                       displayOutput.type === 'search_results' ? '🔍' : 
                       displayOutput.type === 'data' ? '📊' : 
                       displayOutput.type === 'error' ? '❌' : '📝'}
                    </span>
                    <span className="text-sm text-white/80 truncate">
                      {displayOutput.title}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
                    {typeof displayOutput.timestamp === 'string' 
                      ? new Date(displayOutput.timestamp).toLocaleTimeString()
                      : displayOutput.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Content Display */}
              <div className="flex-1 p-3 overflow-auto">
                {displayOutput ? (
                  renderOutputContent(displayOutput.content, displayOutput.type)
                ) : (
                  <div className="text-center text-white/40 py-8">
                    No output to display
                  </div>
                )}
              </div>

              {/* Streaming Status Display with Markdown */}
              {isStreaming && streamingContent && (
                <div className="border-t border-white/10 p-2 bg-blue-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-300">Real-time Output</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 max-h-20 overflow-y-auto">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-sm font-bold text-white mb-1">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                          h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                          p: ({children}) => <p className="text-xs text-gray-300 leading-relaxed mb-1">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-300 text-xs space-y-0.5 mb-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 text-xs space-y-0.5 mb-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-300 text-xs">{children}</li>,
                          code: ({children}) => (
                            <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                              {children}
                            </code>
                          ),
                          pre: ({children}) => (
                            <pre className="bg-gray-800 p-1 rounded text-xs overflow-x-auto mb-1">
                              {children}
                            </pre>
                          ),
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-white/90">{children}</em>
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                      <span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              No output content
            </div>
          )}
        </div>

        {/* Edit Actions Area (Right Side) */}
        {editActions.length > 0 && (
          <div className="w-16 border-l border-white/10 bg-white/5">
            <div className="p-1 space-y-1">
              {editActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => displayOutput && action.onClick(displayOutput.content)}
                  disabled={action.disabled || !displayOutput}
                  className="w-full p-1.5 rounded hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={action.label}
                >
                  <div className="text-center">
                    <div className="text-sm">{action.icon}</div>
                    <div className="text-xs text-white/60 mt-0.5 leading-tight">
                      {action.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-black/60 rounded-lg p-4 flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-300 font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Middle) */}
      <div className="border-t border-white/10">
        {children}
      </div>

      {/* Management Area (Bottom) */}
      {managementActions.length > 0 && (
        <div className="border-t border-white/10 p-2 bg-white/5">
          <div className="grid grid-cols-4 gap-1">
            {managementActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`p-2 rounded transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  action.variant === 'primary' 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                    : action.variant === 'danger'
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
                title={action.label}
              >
                <div className="text-sm">{action.icon}</div>
                <div className="text-xs text-white/80 truncate">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export related types for use by other components
export type {
  OutputHistoryItem,
  EditAction,
  ManagementAction,
  BaseWidgetProps
};