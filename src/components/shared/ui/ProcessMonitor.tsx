/**
 * ============================================================================
 * Process Monitor Component - 进度监控组件
 * ============================================================================
 * 
 * 用于监控自动化流程执行进度的专业组件
 * 支持实时进度更新、错误统计、性能监控等功能
 * 
 * Features:
 * - 实时进度跟踪
 * - 步骤状态可视化
 * - 错误统计和处理
 * - 性能指标监控
 * - 批量任务统计
 * - 日志查看功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

export interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress: number; // 0-100
  startTime?: string;
  endTime?: string;
  duration?: number; // in milliseconds
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  logs?: LogEntry[];
  metadata?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
  details?: any;
}

export interface ProcessExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0-100
  currentStep?: string;
  totalSteps: number;
  completedSteps: number;
  errorSteps: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: ProcessStep[];
  logs: LogEntry[];
  performance: {
    avgStepTime: number;
    throughput: number; // items per minute
    memoryUsage?: number;
    cpuUsage?: number;
  };
  metadata: {
    templateId: string;
    userId?: string;
    batchId?: string;
    inputData?: any;
  };
}

export interface ProcessMonitorProps {
  execution: ProcessExecution;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  showLogs?: boolean;
  showPerformance?: boolean;
  className?: string;
  onStepClick?: (step: ProcessStep) => void;
  onCancel?: () => void;
  onRetry?: (stepId?: string) => void;
  onRefresh?: () => void;
}

export const ProcessMonitor: React.FC<ProcessMonitorProps> = ({
  execution,
  autoRefresh = false,
  refreshInterval = 3000,
  showLogs = true,
  showPerformance = true,
  className = '',
  onStepClick,
  onCancel,
  onRetry,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'logs' | 'performance'>('progress');
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && execution.status === 'running' && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, execution.status, refreshInterval, onRefresh]);

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'skipped': return '⏭️';
      case 'cancelled': return '🚫';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-gray-400 bg-gray-500/20';
      case 'running': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'skipped': return 'text-yellow-400 bg-yellow-500/20';
      case 'cancelled': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'debug': return 'text-gray-400';
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const filteredLogs = execution.logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  const handleStepClick = useCallback((step: ProcessStep) => {
    setSelectedStep(step);
    if (onStepClick) {
      onStepClick(step);
    }
  }, [onStepClick]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{getStatusIcon(execution.status)}</span>
            {execution.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>ID: {execution.id.slice(0, 8)}</span>
            <span>开始: {formatTimestamp(execution.startTime)}</span>
            {execution.duration && <span>耗时: {formatDuration(execution.duration)}</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
            {execution.status.toUpperCase()}
          </div>
          
          {/* Progress Badge */}
          <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
            {execution.completedSteps}/{execution.totalSteps} 步骤
          </div>
          
          {/* Actions */}
          <div className="flex gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔄"
                onClick={onRefresh}
              >
                刷新
              </Button>
            )}
            {onRetry && execution.status === 'error' && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔁"
                onClick={() => onRetry()}
              >
                重试
              </Button>
            )}
            {onCancel && execution.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                icon="⏹️"
                onClick={onCancel}
              >
                取消
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">总体进度</span>
          <span className="text-white font-medium">{execution.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              execution.status === 'error' ? 'bg-red-500' :
              execution.status === 'completed' ? 'bg-green-500' :
              'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${execution.progress}%` }}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'progress', label: '步骤进度', icon: '📊' },
          ...(showLogs ? [{ key: 'logs', label: '执行日志', icon: '📜' }] : []),
          ...(showPerformance ? [{ key: 'performance', label: '性能指标', icon: '⚡' }] : [])
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'progress' && (
        <div className="space-y-3">
          {execution.steps.map((step, index) => (
            <GlassCard 
              key={step.id} 
              className={`p-4 cursor-pointer transition-all hover:bg-white/10 ${
                selectedStep?.id === step.id ? 'ring-1 ring-blue-500/50' : ''
              }`}
              onClick={() => handleStepClick(step)}
            >
              <div className="space-y-3">
                {/* Step Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{step.name}</div>
                      {step.description && (
                        <div className="text-sm text-white/60">{step.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {step.duration && (
                      <span className="text-xs text-white/50">
                        {formatDuration(step.duration)}
                      </span>
                    )}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                      {getStatusIcon(step.status)} {step.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {step.status === 'running' || step.progress > 0 && step.progress < 100 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">进度</span>
                      <span className="text-white/80">{step.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Error Display */}
                {step.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="text-sm font-medium text-red-400 mb-1">
                      错误: {step.error.code}
                    </div>
                    <div className="text-xs text-red-300">
                      {step.error.message}
                    </div>
                  </div>
                )}

                {/* Step Logs */}
                {selectedStep?.id === step.id && step.logs && step.logs.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs font-medium text-white/70 mb-2">步骤日志:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {step.logs.map((log) => (
                        <div key={log.id} className="flex gap-2 text-xs">
                          <span className="text-white/40">{formatTimestamp(log.timestamp)}</span>
                          <span className={getLogLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>
                          <span className="text-white/80">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <GlassCard className="p-4">
          <div className="space-y-4">
            {/* Log Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">筛选:</span>
              <div className="flex gap-1">
                {['all', 'error', 'warn', 'info'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level as any)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      logFilter === level
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-white/10 text-white/60 hover:text-white/80'
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Entries */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto bg-black/20 rounded-lg p-3 font-mono">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex gap-2 text-xs">
                  <span className="text-white/40 shrink-0">{formatTimestamp(log.timestamp)}</span>
                  <span className={`${getLogLevelColor(log.level)} shrink-0`}>[{log.level.toUpperCase()}]</span>
                  <span className="text-white/80">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <h4 className="font-medium text-white mb-3">执行性能</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">平均步骤耗时</span>
                <span className="font-medium text-white">
                  {formatDuration(execution.performance.avgStepTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">处理吞吐量</span>
                <span className="font-medium text-white">
                  {execution.performance.throughput.toFixed(1)} 项/分钟
                </span>
              </div>
              {execution.performance.memoryUsage && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">内存使用</span>
                  <span className="font-medium text-white">
                    {execution.performance.memoryUsage.toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h4 className="font-medium text-white mb-3">执行统计</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">总步骤数</span>
                <span className="font-medium text-white">{execution.totalSteps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">已完成</span>
                <span className="font-medium text-green-400">{execution.completedSteps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">错误步骤</span>
                <span className="font-medium text-red-400">{execution.errorSteps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">成功率</span>
                <span className="font-medium text-white">
                  {((execution.completedSteps / execution.totalSteps) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ProcessMonitor;