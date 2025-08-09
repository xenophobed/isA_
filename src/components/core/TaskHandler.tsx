/**
 * ============================================================================
 * 任务操作处理器 (TaskHandler.tsx) - 处理用户操作事件并发布给store
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理用户任务操作事件
 * - 将操作发布给任务store
 * - 处理SSE事件中的任务信息
 * - 协调任务生命周期管理
 * 
 * 【架构定位】
 * ✅ 处理用户操作事件
 * ✅ 发布操作给store
 * ✅ 处理业务逻辑
 * ✅ 放在core目录
 */

import React, { useCallback, useEffect } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { TaskAction, TaskProgress, TaskResult, TaskType } from '../../types/taskTypes';
import { logger, LogCategory } from '../../utils/logger';

// ================================================================================
// 任务事件数据接口
// ================================================================================

export interface TaskEventData {
  taskId?: string;
  taskName?: string;
  taskType?: string;
  status?: string;
  progress?: {
    currentStep?: number;
    totalSteps?: number;
    percentage?: number;
    currentStepName?: string;
    estimatedTimeRemaining?: number;
    details?: string;
  };
  result?: {
    success?: boolean;
    data?: any;
    error?: string;
    artifacts?: string[];
  };
  error?: string;
}

// ================================================================================
// TaskHandler组件
// ================================================================================

interface TaskHandlerProps {
  children?: React.ReactNode;
  onTaskEvent?: (eventData: TaskEventData) => void;
}

export const TaskHandler: React.FC<TaskHandlerProps> = ({ 
  children, 
  onTaskEvent 
}) => {
  // 获取任务操作函数
  const createTask = useTaskStore(state => state.createTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const getTask = useTaskStore(state => state.getTask);
  const updateTaskStatus = useTaskStore(state => state.updateTaskStatus);
  const updateTaskProgress = useTaskStore(state => state.updateTaskProgress);
  const completeTask = useTaskStore(state => state.completeTask);
  const failTask = useTaskStore(state => state.failTask);
  const startTask = useTaskStore(state => state.startTask);
  const pauseTask = useTaskStore(state => state.pauseTask);
  const resumeTask = useTaskStore(state => state.resumeTask);
  const cancelTask = useTaskStore(state => state.cancelTask);
  const retryTask = useTaskStore(state => state.retryTask);
  const pauseAllTasks = useTaskStore(state => state.pauseAllTasks);
  const resumeAllTasks = useTaskStore(state => state.resumeAllTasks);
  const cancelAllTasks = useTaskStore(state => state.cancelAllTasks);

  // ================================================================================
  // 任务事件处理函数
  // ================================================================================

  const handleTaskEvent = useCallback((eventData: TaskEventData) => {
    try {
      logger.debug(LogCategory.TASK_MANAGEMENT, 'TaskHandler processing task event', { eventData });

      // 如果没有任务ID，尝试从事件数据中提取或创建新任务
      let taskId = eventData.taskId;
      
      if (!taskId) {
        // 尝试从事件数据中提取任务信息
        if (eventData.taskName) {
          taskId = createTask(
            eventData.taskName,
            (eventData.taskType as TaskType) || 'custom',
            { source: 'sse_event' }
          );
          logger.info(LogCategory.TASK_MANAGEMENT, 'Created new task from SSE event', { 
            taskId, 
            taskName: eventData.taskName 
          });
        } else {
          logger.warn(LogCategory.TASK_MANAGEMENT, 'No task ID or task name in event data', { eventData });
          return;
        }
      }

      // 获取现有任务
      const existingTask = getTask(taskId);
      if (!existingTask) {
        logger.warn(LogCategory.TASK_MANAGEMENT, 'Task not found', { taskId });
        return;
      }

      // 处理状态更新
      if (eventData.status) {
        const statusMapping: Record<string, string> = {
          'starting': 'starting',
          'running': 'running',
          'paused': 'paused',
          'resuming': 'resuming',
          'completed': 'completed',
          'failed': 'failed',
          'cancelled': 'cancelled',
          'interrupted': 'interrupted'
        };

        const newStatus = statusMapping[eventData.status] || eventData.status;
        if (newStatus !== existingTask.status) {
          updateTaskStatus(taskId, newStatus as any);
          logger.info(LogCategory.TASK_MANAGEMENT, 'Task status updated', { 
            taskId, 
            oldStatus: existingTask.status, 
            newStatus 
          });
        }
      }

      // 处理进度更新
      if (eventData.progress) {
        const progress: TaskProgress = {
          currentStep: eventData.progress.currentStep || existingTask.progress.currentStep,
          totalSteps: eventData.progress.totalSteps || existingTask.progress.totalSteps,
          percentage: eventData.progress.percentage || existingTask.progress.percentage,
          currentStepName: eventData.progress.currentStepName || existingTask.progress.currentStepName,
          estimatedTimeRemaining: eventData.progress.estimatedTimeRemaining,
          details: eventData.progress.details
        };

        updateTaskProgress(taskId, progress);
        logger.debug(LogCategory.TASK_MANAGEMENT, 'Task progress updated', { 
          taskId, 
          progress: `${progress.currentStep}/${progress.totalSteps} (${progress.percentage}%)` 
        });
      }

      // 处理任务完成
      if (eventData.result) {
        const result: TaskResult = {
          success: eventData.result.success || false,
          data: eventData.result.data,
          error: eventData.result.error,
          artifacts: eventData.result.artifacts
        };

        if (result.success) {
          completeTask(taskId, result);
          logger.info(LogCategory.TASK_MANAGEMENT, 'Task completed successfully', { taskId });
        } else {
          failTask(taskId, result.error || 'Task failed');
          logger.error(LogCategory.TASK_MANAGEMENT, 'Task failed', { taskId, error: result.error });
        }
      }

      // 处理错误
      if (eventData.error) {
        failTask(taskId, eventData.error);
        logger.error(LogCategory.TASK_MANAGEMENT, 'Task error from SSE event', { 
          taskId, 
          error: eventData.error 
        });
      }

      // 调用外部回调
      onTaskEvent?.(eventData);

    } catch (error) {
      logger.error(LogCategory.TASK_MANAGEMENT, 'Error processing task event', { 
        error: error instanceof Error ? error.message : String(error),
        eventData 
      });
    }
  }, [createTask, updateTask, getTask, updateTaskStatus, updateTaskProgress, completeTask, failTask, onTaskEvent]);

  // ================================================================================
  // SSE事件解析函数
  // ================================================================================

  const parseTaskFromSSE = useCallback((sseData: any): TaskEventData | null => {
    try {
      // 解析custom_stream事件中的任务信息
      if (sseData.type === 'custom_stream' && sseData.content?.data) {
        const data = sseData.content.data;
        
        // 检查是否包含任务信息
        if (typeof data === 'string') {
          // 解析类似 "[web_search] Starting execution (1/3)" 的格式
          const taskMatch = data.match(/\[([^\]]+)\]\s+(.+?)(?:\s+\((\d+)\/(\d+)\))?/);
          if (taskMatch) {
            const [, toolName, action, currentStep, totalSteps] = taskMatch;
            
            return {
              taskName: `${toolName} - ${action}`,
              taskType: 'tool_execution',
              status: action.toLowerCase().includes('starting') ? 'starting' : 
                     action.toLowerCase().includes('completed') ? 'completed' : 'running',
              progress: {
                currentStep: currentStep ? parseInt(currentStep) : 1,
                totalSteps: totalSteps ? parseInt(totalSteps) : 1,
                percentage: currentStep && totalSteps ? (parseInt(currentStep) / parseInt(totalSteps)) * 100 : 0,
                currentStepName: action,
                details: data
              }
            };
          }
        }
      }

      // 解析message_stream事件中的工具调用
      if (sseData.type === 'message_stream' && sseData.content?.raw_message) {
        const rawMessage = sseData.content.raw_message;
        
        // 检查是否包含工具调用
        if (rawMessage.includes('tool_calls=')) {
          const toolCallsMatch = rawMessage.match(/tool_calls=\[([^\]]+)\]/);
          if (toolCallsMatch) {
            const toolCalls = toolCallsMatch[1];
            
            // 解析工具调用
            const toolMatch = toolCalls.match(/'name':\s*'([^']+)'/);
            if (toolMatch) {
              const toolName = toolMatch[1];
              
              return {
                taskName: `执行工具: ${toolName}`,
                taskType: 'tool_execution',
                status: 'starting',
                progress: {
                  currentStep: 1,
                  totalSteps: 1,
                  percentage: 0,
                  currentStepName: `准备执行 ${toolName}`,
                  details: `工具调用: ${toolName}`
                }
              };
            }
          }
        }
      }

      // 解析billing事件中的任务信息
      if (sseData.type === 'billing' && sseData.data) {
        const billingData = sseData.data;
        
        return {
          taskName: '计费处理',
          taskType: 'custom',
          status: 'completed',
          progress: {
            currentStep: 1,
            totalSteps: 1,
            percentage: 100,
            currentStepName: '计费完成',
            details: `模型调用: ${billingData.model_calls}, 工具调用: ${billingData.tool_calls}`
          },
          result: {
            success: billingData.success,
            data: billingData,
            error: billingData.error_message
          }
        };
      }

      return null;
    } catch (error) {
      logger.error(LogCategory.TASK_MANAGEMENT, 'Error parsing task from SSE', { 
        error: error instanceof Error ? error.message : String(error),
        sseData 
      });
      return null;
    }
  }, []);

  // ================================================================================
  // 用户操作处理函数
  // ================================================================================

  const handleUserTaskAction = useCallback((taskId: string, action: TaskAction, reason?: string) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'User task action', { taskId, action, reason });
    
    switch (action) {
      case 'start':
        startTask(taskId);
        break;
      case 'pause':
        pauseTask(taskId);
        break;
      case 'resume':
        resumeTask(taskId);
        break;
      case 'cancel':
        cancelTask(taskId, reason);
        break;
      case 'retry':
        retryTask(taskId);
        break;
      case 'complete':
        completeTask(taskId, { success: true, data: {} });
        break;
      case 'fail':
        failTask(taskId, reason || 'Task failed');
        break;
    }
  }, [startTask, pauseTask, resumeTask, cancelTask, retryTask, completeTask, failTask]);

  const handleBatchTaskAction = useCallback((action: TaskAction, reason?: string) => {
    logger.info(LogCategory.TASK_MANAGEMENT, 'Batch task action', { action, reason });
    
    switch (action) {
      case 'pause':
        pauseAllTasks();
        break;
      case 'resume':
        resumeAllTasks();
        break;
      case 'cancel':
        cancelAllTasks();
        break;
    }
  }, [pauseAllTasks, resumeAllTasks, cancelAllTasks]);

  // ================================================================================
  // 暴露给子组件的上下文
  // ================================================================================

  const taskHandlerContext = {
    handleTaskEvent,
    parseTaskFromSSE,
    handleUserTaskAction,
    handleBatchTaskAction
  };

  // ================================================================================
  // 渲染
  // ================================================================================

  return (
    <TaskHandlerContext.Provider value={taskHandlerContext}>
      {children}
    </TaskHandlerContext.Provider>
  );
};

// ================================================================================
// 上下文定义
// ================================================================================

interface TaskHandlerContextType {
  handleTaskEvent: (eventData: TaskEventData) => void;
  parseTaskFromSSE: (sseData: any) => TaskEventData | null;
  handleUserTaskAction: (taskId: string, action: TaskAction, reason?: string) => void;
  handleBatchTaskAction: (action: TaskAction, reason?: string) => void;
}

const TaskHandlerContext = React.createContext<TaskHandlerContextType | null>(null);

// ================================================================================
// Hook for using TaskHandler context
// ================================================================================

export const useTaskHandler = () => {
  const context = React.useContext(TaskHandlerContext);
  if (!context) {
    throw new Error('useTaskHandler must be used within a TaskHandler');
  }
  return context;
}; 