/**
 * ============================================================================
 * 任务进度消息组件 (TaskProgressMessage.tsx) - 在Chat中显示任务进度
 * ============================================================================
 * 
 * 【核心职责】
 * - 在聊天界面中显示任务执行进度
 * - 与streaming消息集成，显示实时任务状态
 * - 提供任务操作控制（暂停、取消等）
 * - 美观地展示任务进度和状态
 * 
 * 【集成方式】
 * - 作为消息的附加组件显示在streaming消息下方
 * - 根据当前活跃任务自动显示/隐藏
 * - 与TaskHandler集成，处理用户操作
 */

import React, { useMemo } from 'react';
import { useTask } from '../../../hooks/useTask';
import { TaskItemComponent } from '../task/TaskItem';
import { TaskProgressBar } from '../task/TaskProgress';
import { TaskAction } from '../../../types/taskTypes';
import { useTaskHandler } from '../../core/TaskHandler';

// ================================================================================
// 任务进度消息Props接口
// ================================================================================

export interface TaskProgressMessageProps {
  messageId?: string;
  className?: string;
  compact?: boolean;
  showControls?: boolean;
}

// ================================================================================
// 任务进度消息组件
// ================================================================================

export const TaskProgressMessage: React.FC<TaskProgressMessageProps> = ({
  messageId,
  className = '',
  compact = false,
  showControls = true
}) => {
  const { activeTasks, taskCounts } = useTask();
  const { handleUserTaskAction } = useTaskHandler();

  // 获取与当前消息相关的任务
  const relevantTasks = useMemo(() => {
    if (messageId) {
      return activeTasks.filter(task => 
        task.metadata?.messageId === messageId || 
        task.metadata?.source === 'chat_module'
      );
    }
    return activeTasks.filter(task => task.metadata?.source === 'chat_module');
  }, [activeTasks, messageId]);

  // 如果没有相关任务，不显示
  if (relevantTasks.length === 0) {
    return null;
  }

  // ================================================================================
  // 事件处理
  // ================================================================================

  const handleTaskAction = (taskId: string, action: TaskAction) => {
    handleUserTaskAction(taskId, action);
  };

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderCompactView = () => {
    const currentTask = relevantTasks[0]; // 只显示第一个任务
    if (!currentTask) return null;

    return (
      <div className="task-progress-mobile flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="text-sm font-medium text-gray-300 truncate">
            {currentTask.title}
          </span>
        </div>
        
        <div className="flex-1 sm:flex-none sm:w-24">
          <TaskProgressBar 
            progress={currentTask.progress}
            status={currentTask.status}
            showDetails={false}
            size="small"
          />
        </div>
        
        {showControls && currentTask.canPause && (
          <div className="flex space-x-2 justify-end sm:justify-start">
            <button
              onClick={() => handleTaskAction(currentTask.id, 'pause')}
              className="p-2 text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded transition-colors"
              title="暂停"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <button
              onClick={() => handleTaskAction(currentTask.id, 'cancel')}
              className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded transition-colors"
              title="取消"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderExpandedView = () => (
    <div className="space-y-2 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-300">
          正在处理 ({relevantTasks.length})
        </h4>
        <div className="text-xs text-gray-500">
          {taskCounts.active} 个活跃任务
        </div>
      </div>
      
      <div className="space-y-2">
        {relevantTasks.map(task => (
          <div key={task.id} className="bg-gray-700/30 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">{task.title}</span>
              </div>
              {showControls && (
                <div className="flex space-x-1">
                  {task.canPause && task.status === 'running' && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'pause')}
                      className="p-1 text-xs text-gray-400 hover:text-gray-200"
                      title="暂停"
                    >
                      ⏸️
                    </button>
                  )}
                  {task.canResume && task.status === 'paused' && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'resume')}
                      className="p-1 text-xs text-gray-400 hover:text-green-400"
                      title="继续"
                    >
                      ▶️
                    </button>
                  )}
                  {task.canCancel && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'cancel')}
                      className="p-1 text-xs text-gray-400 hover:text-red-400"
                      title="取消"
                    >
                      ❌
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <TaskProgressBar 
              progress={task.progress}
              status={task.status}
              showDetails={true}
              size="small"
            />
          </div>
        ))}
      </div>
    </div>
  );

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <div className={`mt-2 task-progress-container ${className}`}>
      {compact ? renderCompactView() : renderExpandedView()}
    </div>
  );
};