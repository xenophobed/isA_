import React, { useState, useEffect } from 'react';
import { logger, LogLevel, LogCategory } from '../../utils/logger';

interface LoggingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoggingDashboard: React.FC<LoggingDashboardProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const refreshLogs = () => {
      const allLogs = logger.exportLogs();
      const flowSummary = logger.getFlowSummary();
      
      setLogs(allLogs);
      setSummary(flowSummary);
    };

    refreshLogs();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshLogs, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, autoRefresh]);

  const filteredLogs = logs.filter(log => {
    const categoryMatch = selectedCategory === 'ALL' || log.category === selectedCategory;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.data || {}).toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-400';
      case LogLevel.INFO: return 'text-blue-400';
      case LogLevel.WARN: return 'text-yellow-400';
      case LogLevel.ERROR: return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    const colors = {
      [LogCategory.USER_INPUT]: 'bg-green-500/20 text-green-400',
      [LogCategory.APP_TRIGGER]: 'bg-purple-500/20 text-purple-400',
      [LogCategory.STATE_CHANGE]: 'bg-blue-500/20 text-blue-400',
      [LogCategory.API_CALL]: 'bg-orange-500/20 text-orange-400',
      [LogCategory.AI_MESSAGE]: 'bg-cyan-500/20 text-cyan-400',
      [LogCategory.ARTIFACT_CREATION]: 'bg-pink-500/20 text-pink-400',
      [LogCategory.COMPONENT_RENDER]: 'bg-gray-500/20 text-gray-400',
      [LogCategory.SIDEBAR_INTERACTION]: 'bg-indigo-500/20 text-indigo-400',
      [LogCategory.EVENT_EMISSION]: 'bg-yellow-500/20 text-yellow-400',
      [LogCategory.CHAT_FLOW]: 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl border border-white/10 w-full max-w-4xl h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span>
              Logger
            </h2>
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs">
              {logs.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-white text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded w-3 h-3"
              />
              Auto
            </label>
            <button
              onClick={() => {
                logger.clearLogs();
                setLogs([]);
                setSummary(null);
              }}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-xs"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded flex items-center justify-center text-red-400 text-xl font-bold hover:text-red-300 transition-all"
              title="Close Dashboard"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0 max-h-full">
          {/* Left Panel - Summary */}
          <div className="w-1/4 border-r border-white/10 p-3 overflow-y-auto max-h-full">
            <h3 className="text-sm font-semibold text-white mb-3">Summary</h3>
            
            {summary && (
              <div className="space-y-3">
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">Session</div>
                  <div className="text-white text-xs">
                    <div>Logs: {summary.totalLogs}</div>
                    <div>Duration: {summary.timeRange.end - summary.timeRange.start}ms</div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">Categories</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(summary.categoryCounts).slice(0, 6).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-xs">
                        <span className="text-white/80 truncate">{category.split('_')[0]}</span>
                        <span className="text-white">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">Recent Traces</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {summary.traces.slice(-3).map((trace: any, index: number) => (
                      <div key={index} className="text-xs text-white bg-gray-700 rounded p-1">
                        <div className="font-mono">{trace.traceId.split('_')[2]}</div>
                        <div className="text-gray-400">{trace.duration}ms</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Logs */}
          <div className="flex-1 flex flex-col min-w-0 max-h-full overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'ALL')}
                  className="bg-gray-800 border border-white/10 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="ALL">All</option>
                  {Object.values(LogCategory).map(category => (
                    <option key={category} value={category}>{category.split('_')[0]}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-400">
                  {filteredLogs.length}/{logs.length}
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-gray-800 border border-white/10 rounded px-2 py-1 text-white text-xs placeholder-gray-400"
              />
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-full">
              {filteredLogs.slice(-30).reverse().map((log, index) => (
                <div key={index} className="bg-gray-800 rounded p-2 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className={`px-1 py-0.5 rounded text-xs ${getCategoryColor(log.category)}`}>
                        {log.category.split('_')[0]}
                      </span>
                      {log.traceId && (
                        <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-mono">
                          {log.traceId.split('_')[2]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString().slice(0, 8)}
                    </span>
                  </div>
                  
                  <div className="text-white text-xs mb-1">
                    {log.message}
                  </div>
                  
                  {log.data && (
                    <details className="text-xs">
                      <summary className="text-gray-400 cursor-pointer hover:text-white">
                        Data
                      </summary>
                      <pre className="mt-1 bg-gray-900 rounded p-1 overflow-x-auto text-gray-300 text-xs max-h-20 overflow-y-auto">
                        {JSON.stringify(log.data, null, 1)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No logs found for the selected category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};