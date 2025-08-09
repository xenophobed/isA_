/**
 * ============================================================================
 * 任务进度条组件 (TaskProgress.tsx) - 任务进度显示
 * ============================================================================
 * 
 * 【核心职责】
 * - 显示任务进度条
 * - 显示当前步骤信息
 * - 显示预计剩余时间
 * - 提供进度动画效果
 * 
 * 【功能特性】
 * ✅ 可视化进度条
 * ✅ 步骤信息显示
 * ✅ 预计时间显示
 * ✅ 进度动画
 * ✅ 状态颜色区分
 */

import React from 'react';
import { TaskProgress as TaskProgressType, TaskStatus } from '../../../types/taskTypes';

// ================================================================================
// 任务进度条Props接口
// ================================================================================

export interface TaskProgressProps {
  progress: TaskProgressType;
  status: TaskStatus;
  showDetails?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// ================================================================================
// 任务进度条组件
// ================================================================================

export const TaskProgressBar: React.FC<TaskProgressProps> = ({
  progress,
  status,
  showDetails = true,
  className = '',
  size = 'medium'
}) => {
  // ================================================================================
  // 样式配置
  // ================================================================================

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'h-2',
          text: 'text-xs',
          details: 'text-xs'
        };
      case 'large':
        return {
          container: 'h-4',
          text: 'text-sm',
          details: 'text-sm'
        };
      default:
        return {
          container: 'h-3',
          text: 'text-xs',
          details: 'text-xs'
        };
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'starting':
      case 'resuming':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-600';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'running':
        return 'bg-green-100';
      case 'starting':
      case 'resuming':
        return 'bg-blue-100';
      case 'paused':
        return 'bg-yellow-100';
      case 'completed':
        return 'bg-green-100';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  // ================================================================================
  // 工具函数
  // ================================================================================

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  };

  const getProgressText = () => {
    if (progress.totalSteps <= 1) {
      return `${Math.round(progress.percentage)}%`;
    }
    return `${progress.currentStep}/${progress.totalSteps} (${Math.round(progress.percentage)}%)`;
  };

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderProgressBar = () => {
    const sizeClasses = getSizeClasses();
    const statusColor = getStatusColor();
    const bgColor = getBackgroundColor();
    
    return (
      <div className={`w-full ${sizeClasses.container} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
        <div 
          className={`h-full ${statusColor} transition-all duration-500 ease-out rounded-full relative`}
          style={{ width: `${progress.percentage}%` }}
        >
          {/* 动画效果 */}
          {status === 'running' && (
            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
          )}
        </div>
      </div>
    );
  };

  const renderProgressText = () => {
    const sizeClasses = getSizeClasses();
    
    return (
      <div className={`flex items-center justify-between ${sizeClasses.text} text-gray-600 dark:text-gray-400`}>
        <span>{progress.currentStepName}</span>
        <span>{getProgressText()}</span>
      </div>
    );
  };

  const renderDetails = () => {
    if (!showDetails) return null;
    
    const sizeClasses = getSizeClasses();
    
    return (
      <div className={`mt-1 ${sizeClasses.details} text-gray-500 dark:text-gray-400`}>
        <div className="flex items-center justify-between">
          <span>
            {progress.details && (
              <span className="mr-2">{progress.details}</span>
            )}
          </span>
          {progress.estimatedTimeRemaining && (
            <span>
              预计剩余: {formatTime(progress.estimatedTimeRemaining)}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <div className="flex-1 min-w-0">
      {renderProgressBar()}
      {renderProgressText()}
      {renderDetails()}
    </div>
  );
}; 