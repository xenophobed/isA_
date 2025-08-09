/**
 * ============================================================================
 * 任务项组件 (TaskItem.tsx) - 单个任务显示和操作
 * ============================================================================
 * 
 * 【核心职责】
 * - 显示单个任务的详细信息
 * - 提供任务状态指示器
 * - 显示任务进度
 * - 提供任务操作按钮
 * 
 * 【功能特性】
 * ✅ 任务状态图标和颜色
 * ✅ 任务进度显示
 * ✅ 动态操作按钮
 * ✅ 任务详情展开/收起
 * ✅ 响应式设计
 */

import React, { useState } from 'react';
import { TaskItem as TaskItemType, TaskAction, TaskStatus } from '../../../types/taskTypes';
import { TaskProgressBar } from './TaskProgress';
import { logger, LogCategory } from '../../../utils/logger';

// ================================================================================
// 任务项Props接口
// ================================================================================

export interface TaskItemProps {
  task: TaskItemType;
  isSelected?: boolean;
  onSelect: (taskId: string) => void;
  onAction: (taskId: string, action: TaskAction) => void;
  className?: string;
  showDetails?: boolean;
}

// ================================================================================
// 任务项组件
// ================================================================================

export const TaskItemComponent: React.FC<TaskItemProps> = ({
  task,
  isSelected = false,
  onSelect,
  onAction,
  className = '',
  showDetails = false
}) => {
  const [expanded, setExpanded] = useState(showDetails);

  // ================================================================================
  // 状态映射
  // ================================================================================

  const getStatusConfig = (status: TaskStatus) => {
    const configs = {
      pending: { icon: '⏳', color: 'text-gray-500', bgColor: 'bg-gray-100', label: '等待中' },
      starting: { icon: '🚀', color: 'text-blue-500', bgColor: 'bg-blue-100', label: '启动中' },
      running: { icon: '⚡', color: 'text-green-500', bgColor: 'bg-green-100', label: '执行中' },
      paused: { icon: '⏸️', color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: '已暂停' },
      resuming: { icon: '🔄', color: 'text-blue-500', bgColor: 'bg-blue-100', label: '恢复中' },
      completed: { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-100', label: '已完成' },
      failed: { icon: '❌', color: 'text-red-500', bgColor: 'bg-red-100', label: '执行失败' },
      cancelled: { icon: '🚫', color: 'text-gray-500', bgColor: 'bg-gray-100', label: '已取消' },
      interrupted: { icon: '⚠️', color: 'text-orange-500', bgColor: 'bg-orange-100', label: '被中断' }
    };
    return configs[status] || configs.pending;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      chat_response: '💬',
      tool_execution: '🔧',
      plan_execution: '📋',
      image_generation: '🎨',
      web_search: '🔍',
      data_analysis: '📊',
      content_creation: '✍️',
      custom: '⚙️'
    };
    return icons[type as keyof typeof icons] || icons.custom;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-400',
      normal: 'text-gray-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  // ================================================================================
  // 事件处理
  // ================================================================================

  const handleSelect = () => {
    logger.debug(LogCategory.TASK_MANAGEMENT, 'Task item selected', { taskId: task.id });
    onSelect(task.id);
  };

  const handleAction = (action: TaskAction) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'Task action clicked', { taskId: task.id, action });
    onAction(task.id, action);
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderStatus = () => {
    const config = getStatusConfig(task.status);
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  const renderPriority = () => (
    <div className={`text-xs ${getPriorityColor(task.priority)}`}>
      {task.priority === 'urgent' && '🔥'}
      {task.priority === 'high' && '⚡'}
      {task.priority}
    </div>
  );

  const renderActions = () => {
    const actions = [];
    
    if (task.status === 'pending' || task.status === 'failed' || task.status === 'cancelled') {
      actions.push(
        <button
          key="start"
          onClick={() => handleAction('start')}
          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          title="开始任务"
        >
          开始
        </button>
      );
    }
    
    if (task.canPause && task.status === 'running') {
      actions.push(
        <button
          key="pause"
          onClick={() => handleAction('pause')}
          className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
          title="暂停任务"
        >
          暂停
        </button>
      );
    }
    
    if (task.canResume && task.status === 'paused') {
      actions.push(
        <button
          key="resume"
          onClick={() => handleAction('resume')}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          title="继续任务"
        >
          继续
        </button>
      );
    }
    
    if (task.canCancel && !['completed', 'failed', 'cancelled'].includes(task.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleAction('cancel')}
          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          title="取消任务"
        >
          取消
        </button>
      );
    }
    
    if (task.canRetry && ['failed', 'cancelled'].includes(task.status)) {
      actions.push(
        <button
          key="retry"
          onClick={() => handleAction('retry')}
          className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
          title="重试任务"
        >
          重试
        </button>
      );
    }
    
    return actions;
  };

  const renderDetails = () => {
    if (!expanded) return null;
    
    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-500">
        <div className="space-y-2 text-sm">
          {task.description && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">描述:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{task.description}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">创建时间:</span>
              <div className="text-gray-600 dark:text-gray-400">
                {new Date(task.createdAt).toLocaleString()}
              </div>
            </div>
            
            {task.startedAt && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">开始时间:</span>
                <div className="text-gray-600 dark:text-gray-400">
                  {new Date(task.startedAt).toLocaleString()}
                </div>
              </div>
            )}
            
            {task.completedAt && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">完成时间:</span>
                <div className="text-gray-600 dark:text-gray-400">
                  {new Date(task.completedAt).toLocaleString()}
                </div>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">最后更新:</span>
              <div className="text-gray-600 dark:text-gray-400">
                {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          
          {task.result && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">结果:</span>
              <div className="mt-1 p-2 bg-white dark:bg-gray-700 rounded border">
                <div className="text-sm">
                  {task.result.success ? (
                    <span className="text-green-600">✅ 成功</span>
                  ) : (
                    <span className="text-red-600">❌ 失败: {task.result.error}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${className}`}
      onClick={handleSelect}
    >
      {/* 主内容区域 */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 标题和类型 */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getTypeIcon(task.type)}</span>
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {task.title}
            </h4>
            {renderPriority()}
          </div>
          
          {/* 状态和进度 */}
          <div className="flex items-center space-x-3 mb-2">
            {renderStatus()}
            <TaskProgressBar 
              progress={task.progress} 
              status={task.status}
              showDetails={false}
            />
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            {renderActions()}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {expanded ? '收起' : '详情'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 详细信息 */}
      {renderDetails()}
    </div>
  );
}; 