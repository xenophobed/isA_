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
    switch (type) {
      case 'image':
        return (
          <img 
            src={content} 
            alt="Output" 
            className="max-w-full h-auto rounded border border-white/10"
          />
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
      default:
        return (
          <div className="text-sm text-white/80">
            {typeof content === 'string' ? content : JSON.stringify(content)}
          </div>
        );
    }
  };

  // Get currently displayed output item
  const displayOutput = currentOutput || (selectedOutputId ? 
    outputHistory.find(item => item.id === selectedOutputId) : 
    outputHistory[0]
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
        <div className={`${showHistory ? 'w-1/4' : 'w-12'} border-r border-white/10 transition-all duration-200`}>
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
                       displayOutput.type === 'data' ? '📊' : 
                       displayOutput.type === 'error' ? '❌' : '📝'}
                    </span>
                    <span className="text-sm text-white/80 truncate">
                      {displayOutput.title}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
                    {displayOutput.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Content Display */}
              <div className="flex-1 p-3 overflow-auto">
                {renderOutputContent(displayOutput.content, displayOutput.type)}
              </div>

              {/* Streaming Status Display */}
              {isStreaming && streamingContent && (
                <div className="border-t border-white/10 p-2 bg-blue-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-300">Real-time Output</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 max-h-20 overflow-y-auto">
                    <div className="text-xs text-gray-300 whitespace-pre-wrap">
                      {streamingContent}
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
                  className="w-full p-2 rounded hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={action.label}
                >
                  <div className="text-center">
                    <div className="text-sm">{action.icon}</div>
                    <div className="text-xs text-white/60 mt-1">
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