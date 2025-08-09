/**
 * ============================================================================
 * Autonomous任务显示组件 - 基于how_to_chat.md SSE事件格式
 * ============================================================================
 * 
 * 【基于真实SSE事件】
 * 严格按照reference/how_to_chat.md中的SSE事件格式实现：
 * - message_stream: 检测工具调用
 * - custom_stream (progress): 显示工具执行进度
 * 
 * 【示例SSE事件】
 * 工具调用: tool_calls=[{'name': 'web_search', 'args': {...}}]
 * 执行进度: "[web_search] Starting execution (1/3)"
 * 完成状态: "[web_search] Completed - 2738 chars result"
 */

import React, { useState, useEffect, useMemo } from 'react';

// ================================================================================
// 基于SSE事件的任务数据接口
// ================================================================================

export interface AutonomousTask {
  id: string;
  toolName: string;
  args: Record<string, any>;
  status: 'detected' | 'starting' | 'running' | 'completed' | 'failed';
  currentStep?: number;
  totalSteps?: number;
  progressText: string;
  result?: string;
  timestamp: string;
  // 用户控制选项
  canPause: boolean;
  canCancel: boolean;
  executionMode: 'autonomous' | 'paused' | 'cancelled';
}

export interface AutonomousTaskDisplayProps {
  streamingStatus?: string;
  lastSSEEvent?: any;
  onTaskControl?: (taskId: string, action: 'pause' | 'resume' | 'cancel') => void;
  className?: string;
}

// ================================================================================
// Autonomous任务显示组件
// ================================================================================

export const AutonomousTaskDisplay: React.FC<AutonomousTaskDisplayProps> = ({
  streamingStatus,
  lastSSEEvent,
  onTaskControl,
  className = ''
}) => {
  const [detectedTasks, setDetectedTasks] = useState<AutonomousTask[]>([]);

  // ================================================================================
  // SSE事件解析 - 严格基于how_to_chat.md格式
  // ================================================================================

  useEffect(() => {
    if (!lastSSEEvent) return;

    // 1. 检测工具调用 (message_stream事件)
    if (lastSSEEvent.type === 'message_stream' && lastSSEEvent.content?.raw_message) {
      const rawMessage = lastSSEEvent.content.raw_message;
      
      // 解析工具调用: tool_calls=[{'name': 'web_search', 'args': {...}}]
      const toolCallsMatch = rawMessage.match(/tool_calls=\[([\s\S]*?)\]/);
      if (toolCallsMatch) {
        try {
          // 简化解析 - 提取工具名称和参数
          const toolMatches = rawMessage.matchAll(/'name':\s*'([^']+)'[^}]*'args':\s*({[^}]+})/g);
          
          Array.from(toolMatches).forEach((match, index) => {
            const [, toolName, argsStr] = match as RegExpMatchArray;
            let args = {};
            
            try {
              // 简单解析args (处理基本格式)
              args = JSON.parse(argsStr.replace(/'/g, '"'));
            } catch (e) {
              args = { raw: argsStr };
            }

            const taskId = `task_${toolName}_${Date.now()}_${index}`;
            const newTask: AutonomousTask = {
              id: taskId,
              toolName,
              args,
              status: 'detected',
              progressText: `${toolName} tool detected`,
              timestamp: lastSSEEvent.timestamp,
              canPause: true,
              canCancel: true,
              executionMode: 'autonomous'
            };

            setDetectedTasks(prev => {
              // 避免重复添加相同工具
              if (prev.some(task => task.toolName === toolName && task.status === 'detected')) {
                return prev;
              }
              return [...prev, newTask];
            });
          });
        } catch (error) {
          console.error('解析工具调用失败:', error);
        }
      }
    }

    // 2. 更新工具执行进度 (custom_stream进度事件)
    if (lastSSEEvent.type === 'custom_stream' && 
        lastSSEEvent.content?.type === 'progress' && 
        lastSSEEvent.content?.data) {
      
      const progressData = lastSSEEvent.content.data;
      
      // 解析格式: "[web_search] Starting execution (1/3)"
      const progressMatch = progressData.match(/\[([^\]]+)\]\s+(.+?)(?:\s+\((\d+)\/(\d+)\))?/);
      if (progressMatch) {
        const [, toolName, description, current, total] = progressMatch;
        
        setDetectedTasks(prev => prev.map(task => {
          if (task.toolName === toolName) {
            let status: AutonomousTask['status'] = 'running';
            
            if (description.toLowerCase().includes('starting')) {
              status = 'starting';
            } else if (description.toLowerCase().includes('completed')) {
              status = 'completed';
            } else if (description.toLowerCase().includes('failed')) {
              status = 'failed';
            }
            
            return {
              ...task,
              status,
              progressText: description,
              currentStep: current ? parseInt(current) : undefined,
              totalSteps: total ? parseInt(total) : undefined,
              result: status === 'completed' ? description : task.result,
              timestamp: lastSSEEvent.timestamp
            };
          }
          return task;
        }));
      }
    }
  }, [lastSSEEvent]);

  // ================================================================================
  // 用户控制处理
  // ================================================================================

  const handleTaskControl = (taskId: string, action: 'pause' | 'resume' | 'cancel') => {
    setDetectedTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          executionMode: action === 'pause' ? 'paused' : 
                        action === 'cancel' ? 'cancelled' : 'autonomous'
        };
      }
      return task;
    }));
    
    onTaskControl?.(taskId, action);
  };

  // 只显示最近的活跃任务
  const activeTasks = useMemo(() => {
    return detectedTasks
      .filter(task => !['completed', 'failed'].includes(task.status) || 
                     (Date.now() - new Date(task.timestamp).getTime()) < 10000) // 10秒内的完成任务
      .slice(-3); // 只显示最近3个
  }, [detectedTasks]);

  if (activeTasks.length === 0) {
    return null;
  }

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const getStatusIcon = (status: AutonomousTask['status']) => {
    switch (status) {
      case 'detected': return '👁️';
      case 'starting': return '🚀';
      case 'running': return '⚡';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '🔧';
    }
  };

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      'web_search': '🔍',
      'generate_image': '🎨',
      'data_analysis': '📊',
      'file_reader': '📄',
    };
    return icons[toolName] || '🔧';
  };

  const getStatusColor = (status: AutonomousTask['status']) => {
    switch (status) {
      case 'detected': return 'text-blue-400';
      case 'starting': return 'text-blue-500';
      case 'running': return 'text-green-400';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const renderProgressBar = (task: AutonomousTask) => {
    if (!task.currentStep || !task.totalSteps) return null;
    
    const percentage = (task.currentStep / task.totalSteps) * 100;
    
    return (
      <div className="flex items-center space-x-2 mt-1">
        <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">
          {task.currentStep}/{task.totalSteps}
        </span>
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {activeTasks.map(task => (
        <div 
          key={task.id}
          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600/50"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span>{getToolIcon(task.toolName)}</span>
              <span>{getStatusIcon(task.status)}</span>
              <span className="text-sm font-medium text-gray-300">
                {task.toolName}
              </span>
              <span className={`text-xs ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              {task.executionMode !== 'autonomous' && (
                <span className="text-xs text-yellow-400">
                  ({task.executionMode})
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              {task.progressText}
            </div>
            
            {renderProgressBar(task)}
          </div>
          
          {/* 用户控制按钮 */}
          <div className="flex space-x-1 ml-3">
            {task.canPause && task.executionMode === 'autonomous' && 
             ['starting', 'running'].includes(task.status) && (
              <button
                onClick={() => handleTaskControl(task.id, 'pause')}
                className="p-1 text-xs text-yellow-400 hover:text-yellow-300"
                title="暂停任务"
              >
                ⏸️
              </button>
            )}
            
            {task.executionMode === 'paused' && (
              <button
                onClick={() => handleTaskControl(task.id, 'resume')}
                className="p-1 text-xs text-green-400 hover:text-green-300"
                title="继续任务"
              >
                ▶️
              </button>
            )}
            
            {task.canCancel && 
             !['completed', 'failed'].includes(task.status) && (
              <button
                onClick={() => handleTaskControl(task.id, 'cancel')}
                className="p-1 text-xs text-red-400 hover:text-red-300"
                title="取消任务"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};