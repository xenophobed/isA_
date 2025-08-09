/**
 * ============================================================================
 * 任务管理类型定义 (taskTypes.ts)
 * ============================================================================
 * 
 * 【核心职责】
 * - 定义任务状态和进度类型
 * - 定义任务操作和事件类型
 * - 定义任务UI组件接口
 * - 定义任务管理相关的数据结构
 */

// ================================================================================
// 任务状态定义
// ================================================================================

export type TaskStatus = 
  | 'pending'      // 等待开始
  | 'starting'     // 正在启动
  | 'running'      // 正在执行
  | 'paused'       // 已暂停
  | 'resuming'     // 正在恢复
  | 'completed'    // 已完成
  | 'failed'       // 执行失败
  | 'cancelled'    // 已取消
  | 'interrupted'; // 被中断

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskType = 
  | 'chat_response'     // 聊天响应
  | 'tool_execution'    // 工具执行
  | 'plan_execution'    // 计划执行
  | 'image_generation'  // 图像生成
  | 'web_search'        // 网页搜索
  | 'data_analysis'     // 数据分析
  | 'content_creation'  // 内容创作
  | 'custom';           // 自定义任务

// ================================================================================
// 任务数据结构
// ================================================================================

export interface TaskProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  currentStepName: string;
  estimatedTimeRemaining?: number; // 秒
  details?: string;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  artifacts?: string[]; // 生成的工件ID列表
  metadata?: Record<string, any>;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  progress: TaskProgress;
  result?: TaskResult;
  
  // 时间信息
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  
  // 关联信息
  sessionId?: string;
  messageId?: string;
  parentTaskId?: string;
  childTaskIds?: string[];
  
  // 用户交互
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
  canRetry: boolean;
  
  // 元数据
  metadata?: Record<string, any>;
}

// ================================================================================
// 任务操作类型
// ================================================================================

export type TaskAction = 
  | 'start'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'retry'
  | 'complete'
  | 'fail';

export interface TaskActionEvent {
  taskId: string;
  action: TaskAction;
  timestamp: string;
  userId?: string;
  reason?: string;
}

// ================================================================================
// 任务管理状态
// ================================================================================

export interface TaskManagerState {
  // 任务列表
  tasks: TaskItem[];
  activeTasks: TaskItem[];
  completedTasks: TaskItem[];
  
  // 当前执行状态
  isExecutingPlan: boolean;
  currentPlanId?: string;
  
  // 任务统计
  totalTasks: number;
  completedTasksCount: number;
  failedTasksCount: number;
  
  // UI状态
  showTaskPanel: boolean;
  selectedTaskId?: string;
}

// ================================================================================
// 任务事件类型
// ================================================================================

export interface TaskEvent {
  type: 'task_created' | 'task_started' | 'task_progress' | 'task_completed' | 'task_failed' | 'task_cancelled';
  taskId: string;
  timestamp: string;
  data?: any;
}

// ================================================================================
// 任务UI组件接口
// ================================================================================

export interface TaskPanelProps {
  tasks: TaskItem[];
  selectedTaskId?: string;
  onTaskSelect: (taskId: string) => void;
  onTaskAction: (taskId: string, action: TaskAction) => void;
  className?: string;
}

export interface TaskItemProps {
  task: TaskItem;
  isSelected?: boolean;
  onSelect: (taskId: string) => void;
  onAction: (taskId: string, action: TaskAction) => void;
  className?: string;
}

export interface TaskProgressProps {
  progress: TaskProgress;
  status: TaskStatus;
  showDetails?: boolean;
  className?: string;
}

// ================================================================================
// 任务服务接口
// ================================================================================

export interface TaskServiceCallbacks {
  onTaskCreated?: (task: TaskItem) => void;
  onTaskStarted?: (taskId: string) => void;
  onTaskProgress?: (taskId: string, progress: TaskProgress) => void;
  onTaskCompleted?: (taskId: string, result: TaskResult) => void;
  onTaskFailed?: (taskId: string, error: string) => void;
  onTaskCancelled?: (taskId: string) => void;
  onTaskPaused?: (taskId: string) => void;
  onTaskResumed?: (taskId: string) => void;
}

// ================================================================================
// 任务解析器类型
// ================================================================================

export interface TaskParserResult {
  taskId: string;
  action: TaskAction;
  progress?: TaskProgress;
  result?: TaskResult;
  error?: string;
}

// ================================================================================
// 工具函数类型
// ================================================================================

export interface TaskUtils {
  createTask: (title: string, type: TaskType, metadata?: Record<string, any>) => TaskItem;
  updateTaskProgress: (taskId: string, progress: TaskProgress) => void;
  completeTask: (taskId: string, result: TaskResult) => void;
  failTask: (taskId: string, error: string) => void;
  cancelTask: (taskId: string, reason?: string) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
} 