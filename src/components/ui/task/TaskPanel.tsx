/**
 * ============================================================================
 * 任务面板组件 (TaskPanel.tsx) - 任务管理和显示界面
 * ============================================================================
 * 
 * 【核心职责】
 * - 显示任务列表和状态
 * - 提供任务操作界面（开始、暂停、继续、取消）
 * - 显示任务进度和详细信息
 * - 管理任务面板的显示/隐藏
 * 
 * 【功能特性】
 * ✅ 实时任务状态显示
 * ✅ 任务进度条和详细信息
 * ✅ 任务操作按钮（根据状态显示）
 * ✅ 任务筛选和排序
 * ✅ 批量操作支持
 * ✅ 响应式设计
 */

import React, { useState, useMemo } from 'react';
import { TaskItem, TaskAction, TaskStatus } from '../../../types/taskTypes';
import { TaskItemComponent, TaskProgressBar } from './index';
import { logger, LogCategory } from '../../../utils/logger';

// ================================================================================
// 任务面板Props接口
// ================================================================================

export interface TaskPanelProps {
  tasks: TaskItem[];
  selectedTaskId?: string;
  onTaskSelect: (taskId: string) => void;
  onTaskAction: (taskId: string, action: TaskAction) => void;
  onBatchAction?: (action: TaskAction) => void;
  className?: string;
  showCompleted?: boolean;
  showFailed?: boolean;
  maxHeight?: string;
}

// ================================================================================
// 任务面板组件
// ================================================================================

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskAction,
  onBatchAction,
  className = '',
  showCompleted = true,
  showFailed = true,
  maxHeight = '400px'
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ================================================================================
  // 任务筛选和排序
  // ================================================================================

  const filteredAndSortedTasks = useMemo(() => {
    let filteredTasks = tasks;

    // 应用筛选
    switch (filter) {
      case 'active':
        filteredTasks = tasks.filter(task => 
          ['pending', 'starting', 'running', 'paused', 'resuming'].includes(task.status)
        );
        break;
      case 'completed':
        filteredTasks = tasks.filter(task => task.status === 'completed');
        break;
      case 'failed':
        filteredTasks = tasks.filter(task => ['failed', 'cancelled'].includes(task.status));
        break;
      default:
        filteredTasks = tasks;
    }

    // 应用排序
    filteredTasks.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'status':
          const statusOrder = { 
            running: 1, starting: 2, resuming: 3, pending: 4, paused: 5, 
            completed: 6, failed: 7, cancelled: 8, interrupted: 9
          };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredTasks;
  }, [tasks, filter, sortBy, sortOrder]);

  // ================================================================================
  // 统计信息
  // ================================================================================

  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter(t => ['pending', 'starting', 'running', 'paused', 'resuming'].includes(t.status)).length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => ['failed', 'cancelled'].includes(t.status)).length;

    return { total, active, completed, failed };
  }, [tasks]);

  // ================================================================================
  // 事件处理
  // ================================================================================

  const handleTaskSelect = (taskId: string) => {
    logger.debug(LogCategory.TASK_MANAGEMENT, 'Task selected in panel', { taskId });
    onTaskSelect(taskId);
  };

  const handleTaskAction = (taskId: string, action: TaskAction) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'Task action triggered', { taskId, action });
    onTaskAction(taskId, action);
  };

  const handleBatchAction = (action: TaskAction) => {
    if (onBatchAction) {
      logger.info(LogCategory.TASK_MANAGEMENT, 'Batch action triggered', { action, taskCount: filteredAndSortedTasks.length });
      onBatchAction(action);
    }
  };

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          任务管理
        </h3>
        <div className="flex space-x-2 text-sm">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            总计: {stats.total}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
            活跃: {stats.active}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            完成: {stats.completed}
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
            失败: {stats.failed}
          </span>
        </div>
      </div>
      
      {onBatchAction && stats.active > 0 && (
        <div className="flex space-x-2">
          <button
            onClick={() => handleBatchAction('pause')}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            暂停全部
          </button>
          <button
            onClick={() => handleBatchAction('cancel')}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            取消全部
          </button>
        </div>
      )}
    </div>
  );

  const renderFilters = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部任务</option>
          <option value="active">活跃任务</option>
          <option value="completed">已完成</option>
          <option value="failed">失败/取消</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created">创建时间</option>
          <option value="updated">更新时间</option>
          <option value="priority">优先级</option>
          <option value="status">状态</option>
        </select>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      
      <div className="text-sm text-gray-500">
        显示 {filteredAndSortedTasks.length} / {tasks.length} 个任务
      </div>
    </div>
  );

  const renderTaskList = () => (
    <div 
      className="overflow-y-auto flex-1"
      style={{ maxHeight }}
    >
      {filteredAndSortedTasks.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-sm">暂无任务</div>
          </div>
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {filteredAndSortedTasks.map((task) => (
            <TaskItemComponent
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelect={handleTaskSelect}
              onAction={handleTaskAction}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {renderHeader()}
      {renderFilters()}
      {renderTaskList()}
    </div>
  );
}; 