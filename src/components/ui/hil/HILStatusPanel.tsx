/**
 * ============================================================================
 * HIL Status Panel - Human-in-the-Loop 状态面板
 * ============================================================================
 * 
 * 【组件职责】
 * - 显示当前执行状态和检查点
 * - 提供时间回溯功能入口
 * - 展示HIL中断历史
 * - 监控执行进度和健康状态
 * 
 * 【功能特性】
 * ✅ 实时状态监控
 * ✅ 检查点时间线显示
 * ✅ 一键时间回溯
 * ✅ 中断历史管理
 * ✅ 执行控制操作
 */

import React, { useState, useCallback } from 'react';
import { HILExecutionStatusData, HILCheckpointData, HILInterruptData } from '../../../types/aguiTypes';

// ================================================================================
// 类型定义
// ================================================================================

export interface HILStatusPanelProps {
  status: HILExecutionStatusData | null;
  checkpoints: HILCheckpointData[];
  interrupts: HILInterruptData[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  onRollback: (checkpointId: string) => void;
  onPauseExecution: () => void;
  onResumeExecution: () => void;
  onViewInterrupt: (interrupt: HILInterruptData) => void;
  inRightPanel?: boolean; // 新增：标识是否在RightPanel中
}

interface StatusIndicatorProps {
  status: HILExecutionStatusData['status'];
  className?: string;
}

// ================================================================================
// 状态指示器组件
// ================================================================================

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = "" }) => {
  const getStatusConfig = (status: HILExecutionStatusData['status']) => {
    switch (status) {
      case 'ready':
        return { color: 'text-green-500', bg: 'bg-green-100', icon: '✅', text: 'Ready' };
      case 'running':
        return { color: 'text-blue-500', bg: 'bg-blue-100', icon: '⚡', text: 'Running' };
      case 'interrupted':
        return { color: 'text-amber-500', bg: 'bg-amber-100', icon: '⏸️', text: 'Interrupted' };
      case 'completed':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: '🎉', text: 'Completed' };
      case 'error':
        return { color: 'text-red-500', bg: 'bg-red-100', icon: '❌', text: 'Error' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-100', icon: 'ℹ️', text: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`p-1.5 rounded-full ${config.bg}`}>
        <span className="text-sm">{config.icon}</span>
      </div>
      <span className={`font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};

// ================================================================================
// 检查点时间线组件
// ================================================================================

const CheckpointTimeline: React.FC<{
  checkpoints: HILCheckpointData[];
  onRollback: (checkpointId: string) => void;
}> = ({ checkpoints, onRollback }) => {
  const [expanded, setExpanded] = useState(false);

  if (checkpoints.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No checkpoints available
      </div>
    );
  }

  const displayedCheckpoints = expanded ? checkpoints : checkpoints.slice(0, 3);

  return (
    <div className="space-y-3">
      {displayedCheckpoints.map((checkpoint, index) => (
        <div key={checkpoint.checkpoint_id} className="flex items-center space-x-3 group">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            {index < displayedCheckpoints.length - 1 && (
              <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
            )}
          </div>
          
          {/* Checkpoint info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{checkpoint.node}</p>
                <p className="text-xs text-gray-500">{checkpoint.state_summary}</p>
                <p className="text-xs text-gray-400">
                  {new Date(checkpoint.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              {/* Rollback button */}
              {checkpoint.can_rollback && (
                <button
                  onClick={() => onRollback(checkpoint.checkpoint_id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 p-1 rounded"
                  title="Rollback to this checkpoint"
                >
                  <span className="text-sm">🔄</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {checkpoints.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1"
        >
          {expanded ? <span className="text-sm">⌄</span> : <span className="text-sm">⌃</span>}
          <span>{expanded ? 'Show less' : `Show ${checkpoints.length - 3} more`}</span>
        </button>
      )}
    </div>
  );
};

// ================================================================================
// 中断历史组件
// ================================================================================

const InterruptHistory: React.FC<{
  interrupts: HILInterruptData[];
  onViewInterrupt: (interrupt: HILInterruptData) => void;
}> = ({ interrupts, onViewInterrupt }) => {
  const [expanded, setExpanded] = useState(false);

  if (interrupts.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No interrupts in history
      </div>
    );
  }

  const displayedInterrupts = expanded ? interrupts : interrupts.slice(0, 3);

  const getInterruptTypeColor = (type: HILInterruptData['type']) => {
    switch (type) {
      case 'approval': return 'text-blue-600 bg-blue-100';
      case 'review_edit': return 'text-amber-600 bg-amber-100';
      case 'input_validation': return 'text-green-600 bg-green-100';
      case 'tool_authorization': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-2">
      {displayedInterrupts.map((interrupt) => (
        <div 
          key={interrupt.id} 
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onViewInterrupt(interrupt)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getInterruptTypeColor(interrupt.type)}`}>
              {interrupt.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(interrupt.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900">{interrupt.title}</p>
          <p className="text-xs text-gray-600 truncate">{interrupt.message}</p>
        </div>
      ))}
      
      {interrupts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1"
        >
          {expanded ? <span className="text-sm">⌄</span> : <span className="text-sm">⌃</span>}
          <span>{expanded ? 'Show less' : `Show ${interrupts.length - 3} more`}</span>
        </button>
      )}
    </div>
  );
};

// ================================================================================
// HIL Status Panel 主组件
// ================================================================================

export const HILStatusPanel: React.FC<HILStatusPanelProps> = ({
  status,
  checkpoints,
  interrupts,
  isVisible,
  onToggleVisibility,
  onRollback,
  onPauseExecution,
  onResumeExecution,
  onViewInterrupt,
  inRightPanel = false
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'checkpoints' | 'history'>('status');

  const handleExecutionControl = useCallback(() => {
    if (!status) return;
    
    if (status.status === 'running') {
      onPauseExecution();
    } else if (status.status === 'interrupted' || status.status === 'ready') {
      onResumeExecution();
    }
  }, [status, onPauseExecution, onResumeExecution]);

  // 如果在RightPanel中，不需要切换显示逻辑
  if (inRightPanel) {
    return (
      <div className="w-full bg-gray-800/30 rounded-lg border border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center space-x-2">
              <span className="text-blue-400">📊</span>
              <span>HIL Status</span>
            </h3>
          </div>
          
          {/* Current status */}
          {status && (
            <div className="mt-3 flex items-center justify-between">
              <StatusIndicator status={status.status} />
              
              {/* Control button */}
              {(status.status === 'running' || status.status === 'interrupted' || status.status === 'ready') && (
                <button
                  onClick={handleExecutionControl}
                  className={`p-2 rounded-lg transition-colors ${
                    status.status === 'running' 
                      ? 'bg-amber-100/20 hover:bg-amber-200/20 text-amber-400'
                      : 'bg-blue-100/20 hover:bg-blue-200/20 text-blue-400'
                  }`}
                  title={status.status === 'running' ? 'Pause execution' : 'Resume execution'}
                >
                  {status.status === 'running' ? (
                    <span className="text-sm">⏸️</span>
                  ) : (
                    <span className="text-sm">▶️</span>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Thread info */}
          {status && (
            <div className="mt-2 text-xs text-white/60">
              <p>Thread: {status.thread_id}</p>
              <p>Node: {status.current_node}</p>
              {status.checkpoints > 0 && <p>Checkpoints: {status.checkpoints}</p>}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'status'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'checkpoints'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="text-sm mr-1">🕒</span>
            Checkpoints ({checkpoints.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="text-sm mr-1">📜</span>
            History ({interrupts.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {status ? (
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-white mb-2">Current State</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-white/60">Status:</span> <span className="text-white">{status.status}</span></p>
                      <p><span className="text-white/60">Node:</span> <span className="text-white">{status.current_node}</span></p>
                      <p><span className="text-white/60">Durable:</span> <span className="text-white">{status.durable ? 'Yes' : 'No'}</span></p>
                      {status.last_checkpoint && (
                        <p><span className="text-white/60">Last Checkpoint:</span> <span className="text-white">{status.last_checkpoint}</span></p>
                      )}
                    </div>
                  </div>
                  
                  {status.interrupts.length > 0 && (
                    <div className="bg-amber-500/20 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-amber-200 mb-2">Active Interrupts</h4>
                      <p className="text-sm text-amber-300">{status.interrupts.length} interrupt(s) pending</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  <span className="text-4xl mx-auto mb-2 opacity-50">📊</span>
                  <p>No execution status available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checkpoints' && (
            <CheckpointTimeline checkpoints={checkpoints} onRollback={onRollback} />
          )}

          {activeTab === 'history' && (
            <InterruptHistory interrupts={interrupts} onViewInterrupt={onViewInterrupt} />
          )}
        </div>
      </div>
    );
  }

  if (!isVisible) {
    // 收起状态显示一个小按钮 - 适合header布局
    return (
      <button
        onClick={onToggleVisibility}
        className="relative bg-white shadow-sm rounded-lg px-3 py-2 hover:shadow-md transition-shadow border border-gray-200 flex items-center space-x-2"
        title="Show HIL Status"
      >
        <span className="text-blue-600">📊</span>
        <span className="text-sm font-medium text-gray-700">HIL</span>
        {(status?.status === 'interrupted' || interrupts.length > 0) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </button>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span className="text-blue-600">📊</span>
            <span>HIL Status</span>
          </h3>
          <button
            onClick={onToggleVisibility}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-sm">⌄</span>
          </button>
        </div>
        
        {/* Current status */}
        {status && (
          <div className="mt-3 flex items-center justify-between">
            <StatusIndicator status={status.status} />
            
            {/* Control button */}
            {(status.status === 'running' || status.status === 'interrupted' || status.status === 'ready') && (
              <button
                onClick={handleExecutionControl}
                className={`p-2 rounded-lg transition-colors ${
                  status.status === 'running' 
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title={status.status === 'running' ? 'Pause execution' : 'Resume execution'}
              >
                {status.status === 'running' ? (
                  <span className="text-sm">⏸️</span>
                ) : (
                  <span className="text-sm">▶️</span>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Thread info */}
        {status && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Thread: {status.thread_id}</p>
            <p>Node: {status.current_node}</p>
            {status.checkpoints > 0 && <p>Checkpoints: {status.checkpoints}</p>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'status'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Status
        </button>
        <button
          onClick={() => setActiveTab('checkpoints')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'checkpoints'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-sm mr-1">🕒</span>
          Checkpoints ({checkpoints.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-sm mr-1">📜</span>
          History ({interrupts.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'status' && (
          <div className="space-y-4">
            {status ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Current State</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Status:</span> {status.status}</p>
                    <p><span className="text-gray-600">Node:</span> {status.current_node}</p>
                    <p><span className="text-gray-600">Durable:</span> {status.durable ? 'Yes' : 'No'}</p>
                    {status.last_checkpoint && (
                      <p><span className="text-gray-600">Last Checkpoint:</span> {status.last_checkpoint}</p>
                    )}
                  </div>
                </div>
                
                {status.interrupts.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-amber-900 mb-2">Active Interrupts</h4>
                    <p className="text-sm text-amber-700">{status.interrupts.length} interrupt(s) pending</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <span className="text-4xl mx-auto mb-2 opacity-50">📊</span>
                <p>No execution status available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkpoints' && (
          <CheckpointTimeline checkpoints={checkpoints} onRollback={onRollback} />
        )}

        {activeTab === 'history' && (
          <InterruptHistory interrupts={interrupts} onViewInterrupt={onViewInterrupt} />
        )}
      </div>
    </div>
  );
};

export default HILStatusPanel;