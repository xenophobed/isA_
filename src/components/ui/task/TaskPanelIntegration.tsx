/**
 * ============================================================================
 * 任务面板集成组件 (TaskPanelIntegration.tsx) - 在聊天界面中集成任务管理
 * ============================================================================
 * 
 * 【核心职责】
 * - 在聊天界面中显示任务管理面板
 * - 处理任务面板的显示/隐藏
 * - 集成任务操作和聊天流程
 * - 提供任务状态的可视化
 * 
 * 【功能特性】
 * ✅ 可折叠的任务面板
 * ✅ 实时任务状态显示
 * ✅ 任务操作按钮
 * ✅ 与聊天流程集成
 * ✅ 响应式设计
 */

import React, { useState } from 'react';
import { TaskPanel } from './TaskPanel';
import { useTask } from '../../../hooks/useTask';
import { TaskAction } from '../../../types/taskTypes';
import { logger, LogCategory } from '../../../utils/logger';

// ================================================================================
// 任务面板集成Props接口
// ================================================================================

export interface TaskPanelIntegrationProps {
  className?: string;
  position?: 'left' | 'right' | 'bottom';
  maxHeight?: string;
  showToggle?: boolean;
  defaultVisible?: boolean;
}

// ================================================================================
// 任务面板集成组件
// ================================================================================

export const TaskPanelIntegration: React.FC<TaskPanelIntegrationProps> = ({
  className = '',
  position = 'right',
  maxHeight = '400px',
  showToggle = true,
  defaultVisible = false
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  
  // 获取任务状态
  const { 
    tasks, 
    showTaskPanel, 
    selectedTaskId, 
    taskActions 
  } = useTask();

  // ================================================================================
  // 事件处理
  // ================================================================================

  const handleTaskSelect = (taskId: string) => {
    logger.debug(LogCategory.TASK_MANAGEMENT, 'Task selected in integration', { taskId });
    taskActions.setSelectedTaskId(taskId);
  };

  const handleTaskAction = (taskId: string, action: TaskAction) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'Task action in integration', { taskId, action });
    
    // 这里可以添加与聊天流程的集成逻辑
    // 例如：当任务完成时，可以触发相关的聊天操作
    
    switch (action) {
      case 'start':
        taskActions.startTask(taskId);
        break;
      case 'pause':
        taskActions.pauseTask(taskId);
        break;
      case 'resume':
        taskActions.resumeTask(taskId);
        break;
      case 'cancel':
        taskActions.cancelTask(taskId);
        break;
      case 'retry':
        taskActions.retryTask(taskId);
        break;
    }
  };

  const handleBatchAction = (action: TaskAction) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'Batch action in integration', { action });
    
    switch (action) {
      case 'pause':
        // Pause all active tasks individually
        tasks.filter(task => task.status === 'running').forEach(task => {
          taskActions.pauseTask(task.id);
        });
        break;
      case 'cancel':
        // Cancel all active tasks individually
        tasks.filter(task => ['pending', 'running', 'paused'].includes(task.status)).forEach(task => {
          taskActions.cancelTask(task.id);
        });
        break;
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    taskActions.setShowTaskPanel(!isVisible);
    logger.debug(LogCategory.TASK_MANAGEMENT, 'Task panel visibility toggled', { visible: !isVisible });
  };

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderToggleButton = () => {
    if (!showToggle) return null;

    const activeTaskCount = tasks.filter((t: any) => 
      ['pending', 'starting', 'running', 'paused', 'resuming'].includes(t.status)
    ).length;

    return (
      <button
        onClick={toggleVisibility}
        className={`fixed ${position === 'right' ? 'right-4' : position === 'left' ? 'left-4' : 'bottom-4'} ${
          position === 'bottom' ? 'bottom-4' : 'top-1/2 transform -translate-y-1/2'
        } z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 ${
          activeTaskCount > 0 ? 'animate-pulse' : ''
        }`}
        title={`任务管理 (${activeTaskCount} 个活跃任务)`}
      >
        <div className="relative">
          <span className="text-lg">📋</span>
          {activeTaskCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeTaskCount > 9 ? '9+' : activeTaskCount}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderTaskPanel = () => {
    if (!isVisible) return null;

    const panelClasses = {
      left: 'left-0 top-0 h-full',
      right: 'right-0 top-0 h-full',
      bottom: 'bottom-0 left-0 right-0 h-96'
    };

    return (
      <div className={`fixed ${panelClasses[position]} z-40 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-full flex flex-col">
          {/* 面板头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              任务管理
            </h3>
            <button
              onClick={toggleVisibility}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {/* 任务面板内容 */}
          <div className="flex-1 overflow-hidden">
            <TaskPanel
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={handleTaskSelect}
              onTaskAction={handleTaskAction}
              onBatchAction={handleBatchAction}
              maxHeight={maxHeight}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  };

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <>
      {renderToggleButton()}
      {renderTaskPanel()}
    </>
  );
}; 