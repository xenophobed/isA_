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

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  inline?: boolean; // 新增：是否为内联模式（显示在消息头部）
  isStreaming?: boolean; // 新增：当前消息是否正在流式传输
}

// ================================================================================
// 任务进度消息组件
// ================================================================================

export const TaskProgressMessage: React.FC<TaskProgressMessageProps> = ({
  messageId,
  className = '',
  compact = false,
  showControls = true,
  inline = false,
  isStreaming = false
}) => {
  const { activeTasks, taskCounts, completedTasks } = useTask();
  const { handleUserTaskAction } = useTaskHandler();
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTaskDetails(false);
      }
    };

    if (showTaskDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTaskDetails]);

  // 获取与当前消息相关的任务
  const relevantTasks = useMemo(() => {
    if (messageId) {
      return activeTasks.filter(task => 
        task.metadata?.messageId === messageId || 
        task.metadata?.source === 'chat_module' ||
        task.metadata?.source === 'sse_event'
      );
    }
    return activeTasks.filter(task => 
      task.metadata?.source === 'chat_module' ||
      task.metadata?.source === 'sse_event'
    );
  }, [activeTasks, messageId]);

  // 如果没有相关任务，不显示（内联模式在无任务时仍然显示占位符）
  if (relevantTasks.length === 0 && !inline) {
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

  // 内联模式：在消息头部显示的精简任务状态
  const renderInlineView = () => {
    const currentTask = relevantTasks[0]; // 只显示第一个任务
    
    // 如果没有实际任务，根据流式状态显示不同内容
    if (!currentTask) {
      if (isStreaming) {
        // 正在流式传输时显示处理中
        return (
          <div className="flex items-center space-x-2 px-2 py-1 rounded-full" style={{
            background: 'rgba(66, 133, 244, 0.08)',
            border: '1px solid rgba(66, 133, 244, 0.12)'
          }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
              backgroundColor: '#4285f4'
            }}></div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Processing...
            </span>
            <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(66, 133, 244, 0.2)' }}>
              <div 
                className="h-full rounded-full transition-all duration-300 animate-pulse"
                style={{ 
                  width: '60%',
                  backgroundColor: '#4285f4'
                }}
              ></div>
            </div>
          </div>
        );
      } else {
        // 流式完成后显示已完成状态 - 可点击查看详情
        return (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowTaskDetails(!showTaskDetails)}
              className="flex items-center space-x-2 px-2 py-1 rounded-full transition-all hover:scale-105"
              style={{
                background: 'rgba(52, 168, 83, 0.08)',
                border: '1px solid rgba(52, 168, 83, 0.12)'
              }}
              title="Click to view task details"
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{
                backgroundColor: '#34a853'
              }}></div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Completed
              </span>
              <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(52, 168, 83, 0.2)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: '100%',
                    backgroundColor: '#34a853'
                  }}
                ></div>
              </div>
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${showTaskDetails ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </button>
            
            {/* Task Details Dropdown */}
            {showTaskDetails && (
              <div 
                className="absolute top-full left-0 mt-2 min-w-[300px] max-w-[400px] p-3 rounded-lg border shadow-lg z-50"
                style={{
                  background: 'var(--glass-primary)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Task Execution Summary
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {completedTasks.length > 0 ? completedTasks.slice(-3).map((task) => (
                    <div key={task.id} className="p-2 rounded border" style={{ 
                      background: 'var(--glass-secondary)',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                          background: task.status === 'completed' ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                          color: task.status === 'completed' ? '#34a853' : '#ea4335'
                        }}>
                          {task.status}
                        </span>
                      </div>
                      {task.result && task.result.success && (
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          ✅ {task.result.data || 'Task completed successfully'}
                        </div>
                      )}
                      {task.result && !task.result.success && task.result.error && (
                        <div className="text-xs" style={{ color: '#ea4335' }}>
                          ❌ {task.result.error}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      No completed tasks to show
                    </div>
                  )}
                </div>
                {completedTasks.length > 3 && (
                  <div className="text-xs mt-2 pt-2 border-t" style={{ 
                    color: 'var(--text-muted)',
                    borderColor: 'var(--glass-border)'
                  }}>
                    Showing last 3 tasks ({completedTasks.length} total)
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }

    // 有实际任务时，根据任务状态决定是否可点击
    const isTaskCompleted = currentTask.status === 'completed';
    
    if (isTaskCompleted) {
      // 已完成的实际任务 - 可点击查看详情
      return (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowTaskDetails(!showTaskDetails)}
            className="flex items-center space-x-2 px-2 py-1 rounded-full transition-all hover:scale-105"
            style={{
              background: 'rgba(52, 168, 83, 0.08)',
              border: '1px solid rgba(52, 168, 83, 0.12)'
            }}
            title="Click to view task details"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{
              backgroundColor: '#34a853'
            }}></div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {currentTask.title.length > 15 ? currentTask.title.substring(0, 15) + '...' : currentTask.title}
            </span>
            <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(52, 168, 83, 0.2)' }}>
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: '100%',
                  backgroundColor: '#34a853'
                }}
              ></div>
            </div>
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${showTaskDetails ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          </button>
          
          {/* Task Details Dropdown */}
          {showTaskDetails && (
            <div 
              className="absolute top-full left-0 mt-2 min-w-[300px] max-w-[400px] p-3 rounded-lg border shadow-lg z-50"
              style={{
                background: 'var(--glass-primary)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Task Execution Summary
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Show current task first */}
                <div className="p-2 rounded border" style={{ 
                  background: 'var(--glass-secondary)',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {currentTask.title}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                      background: 'rgba(52, 168, 83, 0.1)',
                      color: '#34a853'
                    }}>
                      {currentTask.status}
                    </span>
                  </div>
                  {currentTask.result && currentTask.result.success && (
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      ✅ {currentTask.result.data || 'Task completed successfully'}
                    </div>
                  )}
                  {currentTask.result && !currentTask.result.success && currentTask.result.error && (
                    <div className="text-xs" style={{ color: '#ea4335' }}>
                      ❌ {currentTask.result.error}
                    </div>
                  )}
                </div>
                
                {/* Show other completed tasks */}
                {completedTasks.filter(task => task.id !== currentTask.id).slice(-2).map((task) => (
                  <div key={task.id} className="p-2 rounded border" style={{ 
                    background: 'var(--glass-secondary)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                        background: task.status === 'completed' ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                        color: task.status === 'completed' ? '#34a853' : '#ea4335'
                      }}>
                        {task.status}
                      </span>
                    </div>
                    {task.result && task.result.success && (
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        ✅ {task.result.data || 'Task completed successfully'}
                      </div>
                    )}
                    {task.result && !task.result.success && task.result.error && (
                      <div className="text-xs" style={{ color: '#ea4335' }}>
                        ❌ {task.result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {completedTasks.length > 3 && (
                <div className="text-xs mt-2 pt-2 border-t" style={{ 
                  color: 'var(--text-muted)',
                  borderColor: 'var(--glass-border)'
                }}>
                  Showing recent tasks ({completedTasks.length} total)
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else {
      // 进行中的任务 - 不可点击
      return (
        <div className="flex items-center space-x-2 px-2 py-1 rounded-full" style={{
          background: 'rgba(66, 133, 244, 0.08)',
          border: '1px solid rgba(66, 133, 244, 0.12)'
        }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
            backgroundColor: currentTask.status === 'running' ? '#4285f4' : 
                            currentTask.status === 'error' ? '#ea4335' : '#fbbc04'
          }}></div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {currentTask.title.length > 20 ? currentTask.title.substring(0, 20) + '...' : currentTask.title}
          </span>
          {currentTask.progress !== undefined && (
            <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(66, 133, 244, 0.2)' }}>
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${currentTask.progress}%`,
                  backgroundColor: '#4285f4'
                }}
              ></div>
            </div>
          )}
        </div>
      );
    }
  };

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

  // 内联模式：总是显示，无论是否有实际任务
  if (inline) {
    return (
      <div className={className}>
        {renderInlineView()}
      </div>
    );
  }

  return (
    <div className={`mt-2 task-progress-container ${className}`}>
      {compact ? renderCompactView() : renderExpandedView()}
    </div>
  );
};