/**
 * ============================================================================
 * 任务状态监听Hook (useTask.ts) - 监听任务store的状态变化
 * ============================================================================
 * 
 * 【核心职责】
 * - 监听任务store的状态变化
 * - 提供任务相关的状态选择器
 * - 返回任务操作函数
 * - 提供任务统计信息
 * 
 * 【架构定位】
 * ✅ 监听store状态变化
 * ✅ 提供状态选择器
 * ✅ 不处理业务逻辑
 * ✅ 不处理用户操作
 */

import { useTaskStore } from '../stores/useTaskStore';

// ================================================================================
// 任务状态监听Hook
// ================================================================================

/**
 * 监听所有任务状态
 */
export const useTask = () => {
  const tasks = useTaskStore(state => state.tasks);
  const activeTasks = useTaskStore(state => state.activeTasks);
  const completedTasks = useTaskStore(state => state.completedTasks);
  const isExecutingPlan = useTaskStore(state => state.isExecutingPlan);
  const currentPlanId = useTaskStore(state => state.currentPlanId);
  const showTaskPanel = useTaskStore(state => state.showTaskPanel);
  const selectedTaskId = useTaskStore(state => state.selectedTaskId);
  
  // 获取任务统计
  const taskCounts = useTaskStore(state => state.getTaskCount());
  
  // 获取所有操作函数
  const taskActions = useTaskStore(state => ({
    createTask: state.createTask,
    updateTask: state.updateTask,
    removeTask: state.removeTask,
    clearTasks: state.clearTasks,
    startTask: state.startTask,
    pauseTask: state.pauseTask,
    resumeTask: state.resumeTask,
    cancelTask: state.cancelTask,
    retryTask: state.retryTask,
    completeTask: state.completeTask,
    failTask: state.failTask,
    updateTaskProgress: state.updateTaskProgress,
    updateTaskStatus: state.updateTaskStatus,
    setShowTaskPanel: state.setShowTaskPanel,
    setSelectedTaskId: state.setSelectedTaskId,
    addTask: state.createTask, // 为了兼容性
    clearCompletedTasks: () => {
      // 清除已完成的任务
      const completedTaskIds = state.completedTasks.map(t => t.id);
      completedTaskIds.forEach(id => state.removeTask(id));
    }
  }));

  return {
    // 状态
    tasks,
    activeTasks,
    completedTasks,
    isExecutingPlan,
    currentPlanId,
    taskCounts,
    showTaskPanel,
    selectedTaskId,
    
    // 操作
    taskActions
  };
};

/**
 * 监听活跃任务
 */
export const useActiveTask = () => {
  const activeTasks = useTaskStore(state => state.activeTasks);
  const taskActions = useTask().taskActions;
  
  return {
    activeTasks,
    taskActions
  };
};

/**
 * 监听任务统计
 */
export const useTaskStats = () => {
  const taskCounts = useTaskStore(state => state.getTaskCount());
  const isExecutingPlan = useTaskStore(state => state.isExecutingPlan);
  
  return {
    ...taskCounts,
    isExecutingPlan
  };
};

/**
 * 监听任务面板状态
 */
export const useTaskPanel = () => {
  const showTaskPanel = useTaskStore(state => state.showTaskPanel);
  const selectedTaskId = useTaskStore(state => state.selectedTaskId);
  const taskActions = useTask().taskActions;
  
  return {
    showTaskPanel,
    selectedTaskId,
    taskActions
  };
};

/**
 * 监听计划执行状态
 */
export const usePlanExecution = () => {
  const isExecutingPlan = useTaskStore(state => state.isExecutingPlan);
  const currentPlanId = useTaskStore(state => state.currentPlanId);
  const taskActions = useTask().taskActions;
  
  return {
    isExecutingPlan,
    currentPlanId,
    taskActions
  };
}; 