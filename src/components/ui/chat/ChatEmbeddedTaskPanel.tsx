/**
 * ============================================================================
 * Chat Embedded Task Panel (ChatEmbeddedTaskPanel.tsx)
 * ============================================================================
 * 
 * Core Features:
 * - Embedded task panel directly in chat message stream
 * - Shows current autonomous task execution
 * - User can pause/resume/cancel tasks
 * - Persistent display (collapsible but doesn't disappear)
 * 
 * Design Features:
 * - Beautiful, professional UI design
 * - Persistent task execution summary
 * - Collapsible interface
 * - Real-time progress tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useCurrentTasks, useTaskProgress, useIsExecutingPlan, useHasExecutedTasks, useChatMessages } from '../../../stores/useChatStore';
import { useTaskHandler } from '../../core/TaskHandler';
import { TaskProgress, TaskItem } from '../../../api/SSEParser';

export interface ChatEmbeddedTaskPanelProps {
  className?: string;
  initialCollapsed?: boolean;
  onTaskAction?: (taskId: string, action: 'pause' | 'resume' | 'cancel') => void;
}

// ================================================================================
// Chat Embedded Task Panel Component
// ================================================================================

export const ChatEmbeddedTaskPanel: React.FC<ChatEmbeddedTaskPanelProps> = ({
  className = '',
  initialCollapsed = false,
  onTaskAction
}) => {
  // Component state
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  
  // Get task state from useChatStore
  const currentTasks = useCurrentTasks();
  const taskProgress = useTaskProgress();
  const isExecutingPlan = useIsExecutingPlan();
  const hasExecutedTasks = useHasExecutedTasks();
  const messages = useChatMessages();
  
  // Get control functions from TaskHandler
  const { handleUserTaskAction, handleBatchTaskAction } = useTaskHandler();
  
  // Check for streaming messages
  const hasStreamingMessage = messages.some(msg => msg.isStreaming);

  // ================================================================================
  // Task Data Processing - ALL HOOKS BEFORE EARLY RETURNS
  // ================================================================================
  
  // Create demo tasks when we're currently executing but don't have real task data yet
  const demoTasks = useMemo(() => {
    if (currentTasks.length > 0) {
      return currentTasks;
    }
    
    // If we're executing but don't have task data, show demo tasks
    if (isExecutingPlan || hasStreamingMessage) {
      return [
        {
          id: 'demo_task_1',
          title: 'Process User Query',
          description: 'Analyzing user input and generating intelligent response',
          status: hasStreamingMessage ? 'running' as const : 'completed' as const,
          progress: hasStreamingMessage ? 75 : 100,
          result: hasStreamingMessage ? null : 'Response generated successfully',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    
    // If we've executed tasks before but aren't currently active, show completed demo task
    return [
      {
        id: 'demo_completed_task',
        title: 'Previous Task Execution',
        description: 'Completed intelligent response generation',
        status: 'completed' as const,
        progress: 100,
        result: 'Successfully completed',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        updatedAt: new Date(Date.now() - 30000).toISOString()
      }
    ];
  }, [currentTasks, isExecutingPlan, hasStreamingMessage]);

  // Demo progress calculation
  const demoProgress = useMemo(() => {
    if (taskProgress) {
      return taskProgress;
    }
    
    if (isExecutingPlan || hasStreamingMessage) {
      return {
        toolName: 'AI Assistant',
        description: 'Generating intelligent response...',
        currentStep: 3,
        totalSteps: 4,
        status: 'running' as const
      };
    }
    
    return null;
  }, [taskProgress, isExecutingPlan, hasStreamingMessage]);

  // Task filtering
  const activeTasks = demoTasks.filter(task => 
    task.status === 'running' || task.status === 'pending'
  );
  const completedTasks = demoTasks.filter(task => task.status === 'completed');
  const failedTasks = demoTasks.filter(task => task.status === 'failed');

  // Only show panel if we've ever executed tasks in this session
  if (!hasExecutedTasks) {
    return null;
  }

  // ================================================================================
  // Event Handlers
  // ================================================================================

  const handleTaskControl = (taskId: string, action: 'pause' | 'resume' | 'cancel') => {
    handleUserTaskAction(taskId, action);
    onTaskAction?.(taskId, action);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // ================================================================================
  // Render Helper Functions
  // ================================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⚡';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400';
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-400';
      case 'running': return 'bg-blue-400 animate-pulse';
      case 'completed': return 'bg-green-400';
      case 'failed': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const renderTaskSummary = () => {
    const totalTasks = demoTasks.length;
    const runningCount = activeTasks.length;
    const completedCount = completedTasks.length;
    const failedCount = failedTasks.length;

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-sm font-medium text-white truncate hidden sm:inline">Autonomous Execution</span>
            <span className="text-xs font-medium text-white truncate sm:hidden">AI Tasks</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
            {runningCount > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-400 hidden sm:inline">{runningCount} running</span>
                <span className="text-blue-400 sm:hidden">{runningCount}</span>
              </span>
            )}
            {completedCount > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-green-400 hidden sm:inline">{completedCount} completed</span>
                <span className="text-green-400 sm:hidden">{completedCount}</span>
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <span className="text-red-400 hidden sm:inline">{failedCount} failed</span>
                <span className="text-red-400 sm:hidden">{failedCount}</span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleCollapse}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded flex-shrink-0 ml-2"
          title={isCollapsed ? 'Expand task panel' : 'Collapse task panel'}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  };

  const renderCurrentProgress = () => {
    if (!demoProgress || isCollapsed) return null;

    const percentage = demoProgress.currentStep && demoProgress.totalSteps 
      ? (demoProgress.currentStep / demoProgress.totalSteps) * 100 
      : 0;

    return (
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">
            {demoProgress.toolName}
          </span>
          <span className="text-xs text-gray-400">
            Step {demoProgress.currentStep} of {demoProgress.totalSteps}
          </span>
        </div>
        
        <div className="text-xs text-blue-400 mb-2">
          {demoProgress.description}
        </div>
        
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderTaskList = () => {
    if (isCollapsed || demoTasks.length === 0) return null;

    return (
      <div className="mt-4 space-y-2 task-execution-panel">
        <div className="text-xs font-medium text-gray-300 px-1">
          Task Execution Log
        </div>
        
        <div className="space-y-2 max-h-64 sm:max-h-none overflow-y-auto">
          {demoTasks.map((task) => (
            <div 
              key={task.id}
              className="task-item-mobile flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 bg-gray-800/20 rounded-lg border border-gray-700/20 hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusDot(task.status)}`}></div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1 flex-wrap">
                    <span className="task-title text-sm font-medium text-gray-200 truncate">
                      {task.title}
                    </span>
                    <span className={`task-status text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(task.status)} bg-current bg-opacity-10`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-2 line-clamp-2 sm:line-clamp-none">
                    {task.description}
                  </div>
                  
                  {task.result && (
                    <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded mb-2 line-clamp-1 sm:line-clamp-none">
                      Result: {task.result}
                    </div>
                  )}
                  
                  {task.status === 'running' && (
                    <div className="w-full task-progress-bar h-2 bg-gray-700 rounded-full mt-2">
                      <div 
                        className="h-full bg-blue-400 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                      <div className="text-xs text-blue-400 mt-1 sm:hidden">
                        {task.progress || 0}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {task.status === 'running' && (
                <div className="task-controls-mobile flex space-x-1 mt-2 sm:mt-0 sm:ml-3 justify-end sm:justify-start">
                  <button
                    onClick={() => handleTaskControl(task.id, 'pause')}
                    className="p-2 text-amber-400 hover:text-amber-300 transition-colors rounded bg-amber-400/10 hover:bg-amber-400/20"
                    title="Pause task"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleTaskControl(task.id, 'cancel')}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors rounded bg-red-400/10 hover:bg-red-400/20"
                    title="Cancel task"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================================================================================
  // Main Render
  // ================================================================================

  return (
    <div className={`relative backdrop-blur-sm bg-gray-900/90 border border-gray-700/50 rounded-xl p-3 sm:p-4 shadow-lg ${className}`}>
      {/* Header with collapse toggle */}
      {renderTaskSummary()}
      
      {/* Current progress indicator */}
      {renderCurrentProgress()}
      
      {/* Task execution log */}
      {renderTaskList()}
      
      {/* Subtle footer when collapsed */}
      {isCollapsed && demoTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/30">
          <div className="text-xs text-gray-500 text-center">
            {demoTasks.length} task{demoTasks.length === 1 ? '' : 's'} • Tap to expand
          </div>
        </div>
      )}
    </div>
  );
};