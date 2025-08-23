/**
 * Mobile Task Bar - Consolidated task management UI for mobile
 * Modern, touch-friendly design following ChatGPT/Claude patterns
 */
import React, { useState, useCallback, useMemo } from 'react';
import { MobileTaskProgress, MobileTypingIndicator, MobileLoadingState } from './MobileTaskProgress';
import { MobileStatusBar, MobileActivityIndicator } from './MobileStatusBar';

// ================================================================================
// Types and Interfaces
// ================================================================================

export interface TaskInfo {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

export interface MobileTaskBarProps {
  // Current active tasks
  activeTasks?: TaskInfo[];
  
  // Overall states
  isLoading?: boolean;
  isTyping?: boolean;
  isStreaming?: boolean;
  
  // Connection status
  connectionStatus?: 'online' | 'connecting' | 'offline';
  
  // Messages and feedback
  statusMessage?: string;
  typingMessage?: string;
  
  // UI preferences
  position?: 'top' | 'bottom' | 'floating';
  compact?: boolean;
  autoCollapse?: boolean;
  
  // Callbacks
  onTaskClick?: (taskId: string) => void;
  onClearCompleted?: () => void;
  onPauseAll?: () => void;
  onRetryFailed?: () => void;
}

// ================================================================================
// Main Mobile Task Bar Component
// ================================================================================

export const MobileTaskBar: React.FC<MobileTaskBarProps> = ({
  activeTasks = [],
  isLoading = false,
  isTyping = false,
  isStreaming = false,
  connectionStatus = 'online',
  statusMessage,
  typingMessage,
  position = 'top',
  compact = false,
  autoCollapse = true,
  onTaskClick,
  onClearCompleted,
  onPauseAll,
  onRetryFailed
}) => {
  const [collapsed, setCollapsed] = useState(autoCollapse && activeTasks.length === 0);
  const [showDetails, setShowDetails] = useState(false);

  // Computed values
  const taskStats = useMemo(() => {
    const total = activeTasks.length;
    const running = activeTasks.filter(t => t.status === 'running').length;
    const completed = activeTasks.filter(t => t.status === 'completed').length;
    const failed = activeTasks.filter(t => t.status === 'failed').length;
    const pending = activeTasks.filter(t => t.status === 'pending').length;
    
    const overallProgress = total > 0 
      ? Math.round(activeTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / total)
      : 0;

    return { total, running, completed, failed, pending, overallProgress };
  }, [activeTasks]);

  const hasActivity = useMemo(() => {
    return isLoading || isTyping || isStreaming || taskStats.total > 0 || connectionStatus !== 'online';
  }, [isLoading, isTyping, isStreaming, taskStats.total, connectionStatus]);

  // Auto-collapse when no activity
  React.useEffect(() => {
    if (autoCollapse && !hasActivity) {
      const timer = setTimeout(() => setCollapsed(true), 2000);
      return () => clearTimeout(timer);
    } else if (hasActivity) {
      setCollapsed(false);
    }
  }, [hasActivity, autoCollapse]);

  // Handle task click
  const handleTaskClick = useCallback((taskId: string) => {
    onTaskClick?.(taskId);
  }, [onTaskClick]);

  // Handle quick actions
  const quickActions = useMemo(() => {
    const actions = [];

    if (taskStats.running > 0 && onPauseAll) {
      actions.push({
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
          </svg>
        ),
        label: 'Pause all tasks',
        onClick: onPauseAll
      });
    }

    if (taskStats.completed > 0 && onClearCompleted) {
      actions.push({
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        label: 'Clear completed',
        onClick: onClearCompleted
      });
    }

    if (taskStats.failed > 0 && onRetryFailed) {
      actions.push({
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        label: 'Retry failed tasks',
        onClick: onRetryFailed
      });
    }

    return actions;
  }, [taskStats, onPauseAll, onClearCompleted, onRetryFailed]);

  // Don't render if no activity and collapsed
  if (collapsed && !hasActivity) {
    return null;
  }

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    floating: 'top-4'
  };

  return (
    <div className={`
      mobile-task-bar relative z-30
      ${position === 'floating' ? 'fixed left-4 right-4' : 'relative'}
      ${positionClasses[position]}
      transition-all duration-300
    `}>
      
      {/* Consolidated Status - Only show ONE status at a time */}
      {(connectionStatus !== 'online' || isLoading || isTyping) && (
        <MobileStatusBar
          status={
            connectionStatus !== 'online' ? connectionStatus :
            isLoading ? 'processing' :
            isTyping ? 'processing' : 'online'
          }
          message={
            connectionStatus !== 'online' ? statusMessage :
            isLoading ? 'Processing your request...' :
            isTyping ? 'AI is typing...' :
            'Connected'
          }
          actions={quickActions}
          autoHide={false}
        />
      )}

      {/* Main Task Bar */}
      {(taskStats.total > 0 || isStreaming) && (
        <div className="mx-4 mb-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`
              w-full p-3 rounded-xl
              bg-white/90 dark:bg-gray-900/90
              border border-gray-200/30 dark:border-gray-700/30
              backdrop-blur-sm shadow-lg shadow-black/5
              active:scale-[0.98] transition-all duration-150
              touch-manipulation
            `}
          >
            <div className="flex items-center justify-between">
              {/* Left: Summary */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status indicator */}
                <div className="relative">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${taskStats.running > 0 || isStreaming ? 'bg-blue-500 animate-pulse' :
                      taskStats.failed > 0 ? 'bg-red-500' :
                      taskStats.completed > 0 ? 'bg-green-500' : 'bg-gray-400'}
                  `} />
                  {(taskStats.running > 0 || isStreaming) && (
                    <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75" />
                  )}
                </div>

                {/* Summary text */}
                <div className="flex-1 text-left">
                  {compact ? (
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {taskStats.running > 0 ? `${taskStats.running} active` :
                       taskStats.failed > 0 ? `${taskStats.failed} failed` :
                       taskStats.completed > 0 ? `${taskStats.completed} completed` :
                       isStreaming ? 'Streaming...' : 'Tasks'}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {isStreaming ? 'Generating response...' :
                         taskStats.total === 1 ? activeTasks[0]?.title || 'Task' :
                         `${taskStats.total} tasks`}
                      </div>
                      {taskStats.total > 0 && !isStreaming && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {taskStats.running} running • {taskStats.completed} done
                          {taskStats.failed > 0 && ` • ${taskStats.failed} failed`}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: Progress and chevron */}
              <div className="flex items-center gap-3">
                {/* Progress indicator */}
                {(taskStats.running > 0 || isStreaming) && !compact && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${isStreaming ? 65 : taskStats.overallProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums min-w-[3ch]">
                      {isStreaming ? '65%' : `${taskStats.overallProgress}%`}
                    </span>
                  </div>
                )}

                {/* Chevron */}
                <div className={`
                  w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800
                  flex items-center justify-center
                  transition-transform duration-200
                  ${showDetails ? 'rotate-180' : ''}
                `}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* Expandable Task Details */}
          {showDetails && (
            <div className="mt-2 space-y-2 animate-slideDown">
              {activeTasks.map((task) => (
                <MobileTaskProgress
                  key={task.id}
                  status={
                    task.status === 'running' ? 'processing' :
                    task.status === 'completed' ? 'completed' :
                    task.status === 'failed' ? 'error' : 'idle'
                  }
                  taskTitle={task.title}
                  progress={task.progress}
                  onTap={() => handleTaskClick(task.id)}
                  compact={false}
                />
              ))}

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
                      title={action.label}
                    >
                      {action.icon}
                      <span className="text-xs font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Indicator removed - handled by consolidated status bar above */}
    </div>
  );
};

// ================================================================================
// Floating Quick Actions - For always-visible task controls
// ================================================================================

export interface FloatingTaskActionsProps {
  show: boolean;
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
}

export const FloatingTaskActions: React.FC<FloatingTaskActionsProps> = ({
  show,
  actions
}) => {
  if (!show || actions.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 animate-fadeIn">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`
            w-12 h-12 rounded-full shadow-lg
            ${action.color || 'bg-blue-500 hover:bg-blue-600'}
            text-white
            flex items-center justify-center
            active:scale-95 transition-all duration-150
            touch-manipulation
          `}
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};