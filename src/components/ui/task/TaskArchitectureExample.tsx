/**
 * ============================================================================
 * 任务管理架构示例 (TaskArchitectureExample.tsx) - 展示正确的架构设计
 * ============================================================================
 * 
 * 【架构说明】
 * 1. SSEParser.ts - 负责解析SSE事件中的任务信息
 * 2. useTask.ts - Hook监听任务store状态变化
 * 3. TaskHandler.tsx - 处理用户操作事件并发布给store
 * 4. useTaskStore.ts - 管理任务状态
 * 
 * 【数据流向】
 * SSE事件 → SSEParser → TaskHandler → useTaskStore → useTask → UI组件
 * 用户操作 → TaskHandler → useTaskStore → useTask → UI组件
 */

import React from 'react';
import { TaskHandler, useTaskHandler } from '../../core/TaskHandler';
import { useTask } from '../../../hooks/useTask';
import { TaskPanelIntegration } from './TaskPanelIntegration';
import { logger, LogCategory } from '../../../utils/logger';

// ================================================================================
// 任务管理架构示例组件
// ================================================================================

export const TaskArchitectureExample: React.FC = () => {
  return (
    <TaskHandler>
      <TaskArchitectureContent />
    </TaskHandler>
  );
};

const TaskArchitectureContent: React.FC = () => {
  // 使用useTask hook监听任务状态
  const { 
    tasks, 
    activeTasks, 
    completedTasks, 
    taskCounts, 
    taskActions 
  } = useTask();

  // 使用TaskHandler处理用户操作
  const { handleUserTaskAction, handleBatchTaskAction, parseTaskFromSSE, handleTaskEvent } = useTaskHandler();

  // ================================================================================
  // 示例：处理SSE事件
  // ================================================================================

  const handleSSEEvent = (sseData: any) => {
    // 从SSE事件中解析任务信息
    const taskEvent = parseTaskFromSSE(sseData);
    if (taskEvent) {
      handleTaskEvent(taskEvent);
    }
  };

  // ================================================================================
  // 示例：用户操作处理
  // ================================================================================

  const handleStartTask = (taskId: string) => {
    handleUserTaskAction(taskId, 'start');
  };

  const handlePauseTask = (taskId: string) => {
    handleUserTaskAction(taskId, 'pause');
  };

  const handleCancelTask = (taskId: string) => {
    handleUserTaskAction(taskId, 'cancel');
  };

  const handlePauseAllTasks = () => {
    handleBatchTaskAction('pause');
  };

  // ================================================================================
  // 渲染
  // ================================================================================

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          任务管理架构示例
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              架构说明
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>✅ <strong>SSEParser.ts</strong> - 解析SSE事件中的任务信息</p>
              <p>✅ <strong>useTask.ts</strong> - Hook监听任务store状态变化</p>
              <p>✅ <strong>TaskHandler.tsx</strong> - 处理用户操作事件并发布给store</p>
              <p>✅ <strong>useTaskStore.ts</strong> - 管理任务状态</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              数据流向
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>🔄 <strong>SSE事件</strong> → SSEParser → TaskHandler → useTaskStore → useTask → UI组件</p>
              <p>🔄 <strong>用户操作</strong> → TaskHandler → useTaskStore → useTask → UI组件</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              当前状态
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{taskCounts.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">总任务</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{taskCounts.active}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">活跃任务</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{taskCounts.completed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{taskCounts.failed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              操作示例
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const taskId = taskActions.createTask('示例任务', 'custom', { source: 'example' });
                  logger.info(LogCategory.TASK_MANAGEMENT, 'Created example task', { taskId });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                创建任务
              </button>
              
              <button
                onClick={handlePauseAllTasks}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                暂停全部
              </button>
              
              <button
                onClick={() => taskActions.clearTasks()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                清空任务
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 任务面板集成 */}
      <TaskPanelIntegration
        position="right"
        showToggle={true}
        defaultVisible={false}
      />
    </div>
  );
};

 