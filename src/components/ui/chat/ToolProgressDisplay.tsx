/**
 * ============================================================================
 * 工具执行进度显示组件 (ToolProgressDisplay.tsx) - 显示SSE工具执行进度
 * ============================================================================
 * 
 * 【核心职责】
 * - 解析和显示SSE事件中的工具执行进度
 * - 显示诸如 "[web_search] Starting execution (1/3)" 的进度信息
 * - 提供美观的工具执行状态可视化
 * 
 * 【功能特性】
 * ✅ 解析SSE custom_stream 事件的工具进度
 * ✅ 显示工具名称、执行状态、进度
 * ✅ 动画效果和状态图标
 * ✅ 紧凑的显示格式
 * 
 * 【集成方式】
 * - 在streaming消息下方显示
 * - 根据最新的工具执行状态自动更新
 * - 完全基于SSE事件数据驱动
 */

import React, { useMemo } from 'react';

// ================================================================================
// 工具进度数据接口
// ================================================================================

export interface ToolProgressData {
  toolName: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  status: 'starting' | 'running' | 'completed' | 'failed';
  timestamp: string;
}

export interface ToolProgressDisplayProps {
  streamingStatus?: string;
  className?: string;
  compact?: boolean;
}

// ================================================================================
// 工具执行进度显示组件
// ================================================================================

export const ToolProgressDisplay: React.FC<ToolProgressDisplayProps> = ({
  streamingStatus,
  className = '',
  compact = true
}) => {
  // 解析streaming状态中的工具进度信息
  const toolProgress = useMemo((): ToolProgressData | null => {
    if (!streamingStatus) return null;

    // 解析类似 "[web_search] Starting execution (1/3)" 的格式
    const toolMatch = streamingStatus.match(/\[([^\]]+)\]\s+(.+?)(?:\s+\((\d+)\/(\d+)\))?/);
    if (toolMatch) {
      const [, toolName, description, current, total] = toolMatch;
      
      // 确定执行状态
      let status: ToolProgressData['status'];
      const lowerDesc = description.toLowerCase();
      if (lowerDesc.includes('starting') || lowerDesc.includes('开始')) {
        status = 'starting';
      } else if (lowerDesc.includes('completed') || lowerDesc.includes('完成')) {
        status = 'completed';
      } else if (lowerDesc.includes('failed') || lowerDesc.includes('失败')) {
        status = 'failed';
      } else {
        status = 'running';
      }
      
      return {
        toolName,
        description,
        currentStep: current ? parseInt(current) : undefined,
        totalSteps: total ? parseInt(total) : undefined,
        status,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }, [streamingStatus]);

  // 如果没有工具进度信息，不显示
  if (!toolProgress) {
    return null;
  }

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const getStatusIcon = (status: ToolProgressData['status']) => {
    switch (status) {
      case 'starting':
        return '🚀';
      case 'running':
        return '⚡';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '🔧';
    }
  };

  const getStatusColor = (status: ToolProgressData['status']) => {
    switch (status) {
      case 'starting':
        return 'text-blue-400';
      case 'running':
        return 'text-green-400';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      'web_search': '🔍',
      'generate_image': '🎨',
      'data_analysis': '📊',
      'file_reader': '📄',
      'weather': '🌤️',
      'calculator': '🧮',
    };
    return icons[toolName] || '🔧';
  };

  const renderProgress = () => {
    if (!toolProgress.currentStep || !toolProgress.totalSteps) {
      return null;
    }

    const percentage = (toolProgress.currentStep / toolProgress.totalSteps) * 100;

    return (
      <div className="flex items-center space-x-2 ml-2">
        <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">
          {toolProgress.currentStep}/{toolProgress.totalSteps}
        </span>
      </div>
    );
  };

  const renderCompactView = () => (
    <div className={`flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-600/50 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm">{getToolIcon(toolProgress.toolName)}</span>
        <span className="text-sm">{getStatusIcon(toolProgress.status)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300 truncate">
            {toolProgress.toolName}
          </span>
          <span className={`text-xs ${getStatusColor(toolProgress.status)}`}>
            {toolProgress.description}
          </span>
        </div>
      </div>
      
      {renderProgress()}
    </div>
  );

  const renderExpandedView = () => (
    <div className={`p-3 bg-gray-800/30 rounded-lg border border-gray-600/30 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getToolIcon(toolProgress.toolName)}</span>
          <span className="font-medium text-gray-300">{toolProgress.toolName}</span>
          <span className="text-lg">{getStatusIcon(toolProgress.status)}</span>
        </div>
        
        {toolProgress.currentStep && toolProgress.totalSteps && (
          <span className="text-xs text-gray-500">
            步骤 {toolProgress.currentStep} / {toolProgress.totalSteps}
          </span>
        )}
      </div>
      
      <div className="mb-2">
        <span className={`text-sm ${getStatusColor(toolProgress.status)}`}>
          {toolProgress.description}
        </span>
      </div>
      
      {renderProgress()}
    </div>
  );

  // ================================================================================
  // 主渲染
  // ================================================================================

  return compact ? renderCompactView() : renderExpandedView();
};