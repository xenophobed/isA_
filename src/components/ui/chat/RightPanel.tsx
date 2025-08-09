/**
 * ============================================================================
 * Right Panel (RightPanel.tsx) - 会话管理面板
 * ============================================================================
 * 
 * 新的右侧面板，宽度与左侧栏相同，用于显示：
 * - 当前会话的详细信息 
 * - 任务执行历史和状态
 * - 计费信息和积分消耗
 * - 记忆存储和工具调用历史
 * - SSE事件流监控(开发模式)
 * 
 * 基于 reference/how_to_chat.md 中的数据结构设计
 */

import React, { useState, useMemo } from 'react';
import { useCurrentTasks, useTaskProgress, useIsExecutingPlan, useChatMessages } from '../../../stores/useChatStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useUserModule } from '../../../modules/UserModule';
import { TaskProgress, TaskItem } from '../../../api/SSEParser';

export interface RightPanelProps {
  className?: string;
}

interface SessionMetrics {
  totalMessages: number;
  aiResponses: number;
  toolCalls: number;
  creditsUsed: number;
  memoryUpdates: number;
  lastActivity: string;
}

interface SSEEventSummary {
  type: string;
  count: number;
  lastSeen: string;
  examples?: string[];
}

// Glass Button Style Creator for RightPanel
const createGlassIconButtonStyle = (color: string, isActive: boolean = false) => ({
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: isActive ? `rgba(${color}, 0.2)` : `rgba(${color}, 0.1)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid rgba(${color}, ${isActive ? '0.4' : '0.2'})`,
  boxShadow: `0 2px 8px rgba(${color}, 0.15)`,
  width: '32px',
  height: '32px',
  color: `rgb(${color})`
});

const createGlassIconHoverHandlers = (color: string) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = `rgba(${color}, 0.2)`;
    e.currentTarget.style.borderColor = `rgba(${color}, 0.4)`;
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = `0 4px 12px rgba(${color}, 0.25)`;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    const isActive = e.currentTarget.getAttribute('data-active') === 'true';
    e.currentTarget.style.background = isActive ? `rgba(${color}, 0.2)` : `rgba(${color}, 0.1)`;
    e.currentTarget.style.borderColor = isActive ? `rgba(${color}, 0.4)` : `rgba(${color}, 0.2)`;
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = `0 2px 8px rgba(${color}, 0.15)`;
  }
});

// Tab配置 with SVG icons
const TABS = [
  { 
    id: 'overview', 
    name: 'Overview', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    color: '34, 197, 94' // green
  },
  { 
    id: 'tasks', 
    name: 'Tasks', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '59, 130, 246' // blue
  },
  { 
    id: 'billing', 
    name: 'Billing', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '251, 191, 36' // yellow/gold
  },
  { 
    id: 'memory', 
    name: 'Memory', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 8h8v8H8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
      </svg>
    ),
    color: '139, 92, 246' // purple
  },
  { 
    id: 'events', 
    name: 'Events', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 1v22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    color: '236, 72, 153' // pink
  }
] as const;

type TabId = typeof TABS[number]['id'];

export const RightPanel: React.FC<RightPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Store状态
  const currentTasks = useCurrentTasks();
  const taskProgress = useTaskProgress();
  const isExecutingPlan = useIsExecutingPlan();
  const messages = useChatMessages();
  const { getCurrentSession } = useSessionStore();
  const currentSession = getCurrentSession();
  const { credits } = useUserModule();

  // 计算会话指标
  const sessionMetrics = useMemo((): SessionMetrics => {
    const aiMessages = messages.filter(m => m.role === 'assistant').length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    
    return {
      totalMessages: messages.length,
      aiResponses: aiMessages,
      toolCalls: currentTasks.length, // 简化计算
      creditsUsed: aiMessages * 1 + currentTasks.length * 2, // 基于计费规则估算
      memoryUpdates: Math.floor(aiMessages / 3), // 估算记忆更新次数
      lastActivity: messages[messages.length - 1]?.timestamp || new Date().toISOString()
    };
  }, [messages, currentTasks]);
  
  // 模拟SSE事件统计 - 移到组件级别
  const eventStats = useMemo(() => {
    const stats: SSEEventSummary[] = [
      { type: 'start', count: 1, lastSeen: new Date().toISOString() },
      { type: 'custom_stream', count: messages.length * 5, lastSeen: new Date().toISOString() },
      { type: 'message_stream', count: sessionMetrics.aiResponses, lastSeen: new Date().toISOString() },
      { type: 'graph_update', count: sessionMetrics.aiResponses, lastSeen: new Date().toISOString() },
      { type: 'memory_update', count: sessionMetrics.memoryUpdates, lastSeen: new Date().toISOString() },
      { type: 'billing', count: 1, lastSeen: new Date().toISOString() },
      { type: 'end', count: sessionMetrics.aiResponses, lastSeen: new Date().toISOString() }
    ].filter(stat => stat.count > 0);
    return stats;
  }, [messages.length, sessionMetrics.aiResponses, sessionMetrics.memoryUpdates]);

  // 切换展开状态
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // 渲染Overview标签页
  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* 会话基础信息 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('34, 197, 94')}
            className="mr-2"
            {...createGlassIconHoverHandlers('34, 197, 94')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          Current Session
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/60">Session ID:</span>
            <span className="text-white/80 font-mono text-[10px]">
              {currentSession?.id?.substring(0, 12) || 'N/A'}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Messages:</span>
            <span className="text-white">{sessionMetrics.totalMessages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">AI Responses:</span>
            <span className="text-white">{sessionMetrics.aiResponses}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Tool Calls:</span>
            <span className="text-white">{sessionMetrics.toolCalls}</span>
          </div>
        </div>
      </div>

      {/* 执行状态 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('59, 130, 246')}
            className="mr-2"
            {...createGlassIconHoverHandlers('59, 130, 246')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          Execution Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">Current State:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isExecutingPlan 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isExecutingPlan ? 'Active' : 'Idle'}
            </span>
          </div>
          
          {taskProgress && (
            <div className="mt-2 p-2 bg-white/5 rounded">
              <div className="text-xs text-white/80 mb-1">
                {taskProgress.toolName}: {taskProgress.description}
              </div>
              {taskProgress.currentStep && taskProgress.totalSteps && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded">
                    <div 
                      className="h-1 bg-blue-400 rounded transition-all duration-300"
                      style={{ width: `${(taskProgress.currentStep / taskProgress.totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60">
                    {taskProgress.currentStep}/{taskProgress.totalSteps}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 积分信息快览 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('251, 191, 36')}
            className="mr-2"
            {...createGlassIconHoverHandlers('251, 191, 36')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          Credits Overview
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/60">Remaining:</span>
            <span className="text-green-400 font-medium">{credits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Used (Session):</span>
            <span className="text-orange-400">{sessionMetrics.creditsUsed}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染Tasks标签页
  const renderTasksTab = () => (
    <div className="space-y-4">
      {/* 当前任务进度 */}
      {taskProgress && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium text-sm mb-2 flex items-center">
            <button
              style={createGlassIconButtonStyle('59, 130, 246')}
              className="mr-2"
              {...createGlassIconHoverHandlers('59, 130, 246')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 12h-6m-6 0H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            Current Execution
          </h3>
          <div className="space-y-2">
            <div className="text-white text-sm">{taskProgress.toolName}</div>
            <div className="text-white/70 text-xs">{taskProgress.description}</div>
            {taskProgress.currentStep && taskProgress.totalSteps && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progress</span>
                  <span>{taskProgress.currentStep}/{taskProgress.totalSteps}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${(taskProgress.currentStep / taskProgress.totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center justify-between">
          <span className="flex items-center">
            <button
              style={createGlassIconButtonStyle('59, 130, 246')}
              className="mr-2"
              {...createGlassIconHoverHandlers('59, 130, 246')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            Task History
          </span>
          <span className="text-white/60 text-xs">{currentTasks.length} tasks</span>
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {currentTasks.length > 0 ? currentTasks.map((task) => (
            <div key={task.id} className="p-2 bg-white/5 rounded border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-medium">{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  task.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                  task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {task.status}
                </span>
              </div>
              {task.description && (
                <div className="text-white/60 text-xs mb-1">{task.description}</div>
              )}
              {task.result && (
                <div className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded">
                  {task.result}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-6 text-white/40 text-xs">
              No tasks executed yet
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染Billing标签页
  const renderBillingTab = () => (
    <div className="space-y-4">
      {/* 积分余额 */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <h3 className="text-green-400 font-medium text-sm mb-2 flex items-center">
          <button
            style={createGlassIconButtonStyle('34, 197, 94')}
            className="mr-2"
            {...createGlassIconHoverHandlers('34, 197, 94')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 3h12l4 6-10 13L2 9l4-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          Credit Balance
        </h3>
        <div className="text-2xl font-bold text-white mb-1">{credits}</div>
        <div className="text-green-400/70 text-xs">credits remaining</div>
      </div>

      {/* 本次会话消耗 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('251, 191, 36')}
            className="mr-2"
            {...createGlassIconHoverHandlers('251, 191, 36')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          Session Usage
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/60">Model Calls:</span>
            <span className="text-white">{sessionMetrics.aiResponses} × 1 = {sessionMetrics.aiResponses}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Tool Calls:</span>
            <span className="text-white">{sessionMetrics.toolCalls} × 2 = {sessionMetrics.toolCalls * 2}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-white font-medium">Total Used:</span>
            <span className="text-orange-400 font-medium">{sessionMetrics.creditsUsed} credits</span>
          </div>
        </div>
      </div>

      {/* 计费规则说明 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('251, 191, 36')}
            className="mr-2"
            {...createGlassIconHoverHandlers('251, 191, 36')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          Billing Rules
        </h3>
        <div className="space-y-1 text-xs text-white/70">
          <div>• Model Call: 1 credit each</div>
          <div>• Tool Call: 2 credits each</div>
          <div>• Minimum: 1 credit per request</div>
        </div>
      </div>
    </div>
  );

  // 渲染Memory标签页
  const renderMemoryTab = () => (
    <div className="space-y-4">
      {/* 记忆统计 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center">
          <button
            style={createGlassIconButtonStyle('139, 92, 246')}
            className="mr-2"
            {...createGlassIconHoverHandlers('139, 92, 246')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 8h8v8H8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </button>
          Memory Statistics
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/60">Updates:</span>
            <span className="text-white">{sessionMetrics.memoryUpdates}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Last Update:</span>
            <span className="text-white/80">
              {sessionMetrics.memoryUpdates > 0 ? 'Recently' : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* 记忆内容预览 */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium text-sm mb-3">Recent Context</h3>
        <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
          {messages.slice(-3).map((message, index) => (
            <div key={index} className="p-2 bg-white/5 rounded">
              <div className="text-white/60 mb-1">{message.role}:</div>
              <div className="text-white/80 line-clamp-3">
                {(message as any).content && typeof (message as any).content === 'string' 
                  ? ((message as any).content as string).substring(0, 100) + (((message as any).content as string).length > 100 ? '...' : '')
                  : 'Non-text content'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染Events标签页 (开发调试用)
  const renderEventsTab = () => {

    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-medium text-sm mb-3 flex items-center">
            <button
              style={createGlassIconButtonStyle('236, 72, 153')}
              className="mr-2"
              {...createGlassIconHoverHandlers('236, 72, 153')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 1v22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            SSE Event Stream
          </h3>
          <div className="space-y-2 text-xs">
            {eventStats.map((stat) => (
              <div key={stat.type} className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-white/80 font-mono">{stat.type}</span>
                <div className="text-right">
                  <div className="text-white">{stat.count}</div>
                  <div className="text-white/60 text-[10px]">
                    {new Date(stat.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="text-amber-400 text-xs flex items-center">
            <button
              style={createGlassIconButtonStyle('251, 191, 36')}
              className="mr-2 flex-shrink-0"
              {...createGlassIconHoverHandlers('251, 191, 36')}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            This tab shows SSE event monitoring for development purposes
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex bg-gray-900/50 border-l border-white/10 ${className}`}>
      {/* 左侧垂直导航栏 */}
      <div className="w-16 flex flex-col border-r border-white/10 bg-gray-900/30">
        {/* 头部标题 */}
        <div className="p-3 border-b border-white/10 text-center">
          <button
            style={createGlassIconButtonStyle('34, 197, 94')}
            {...createGlassIconHoverHandlers('34, 197, 94')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <div className="text-white/60 text-[10px] mt-1">Session</div>
        </div>

        {/* 垂直Tab导航 */}
        <div className="flex-1 py-2">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              className={`
                w-full p-3 flex flex-col items-center transition-all duration-200
                ${activeTab === tab.id
                  ? `bg-${tab.color === '59, 130, 246' ? 'blue' : tab.color === '34, 197, 94' ? 'green' : tab.color === '251, 191, 36' ? 'yellow' : tab.color === '139, 92, 246' ? 'purple' : 'pink'}-500/20 border-r-2 border-${tab.color === '59, 130, 246' ? 'blue' : tab.color === '34, 197, 94' ? 'green' : tab.color === '251, 191, 36' ? 'yellow' : tab.color === '139, 92, 246' ? 'purple' : 'pink'}-400`
                  : 'hover:bg-white/5'
                }
              `}
              title={tab.name}
            >
              <button
                onClick={() => setActiveTab(tab.id)}
                style={createGlassIconButtonStyle(tab.color, activeTab === tab.id)}
                data-active={activeTab === tab.id}
                {...createGlassIconHoverHandlers(tab.color)}
              >
                {tab.icon}
              </button>
              <span className={`text-[10px] text-center leading-tight mt-1 ${
                activeTab === tab.id ? `text-${tab.color === '59, 130, 246' ? 'blue' : tab.color === '34, 197, 94' ? 'green' : tab.color === '251, 191, 36' ? 'yellow' : tab.color === '139, 92, 246' ? 'purple' : 'pink'}-400` : 'text-white/60'
              }`}>
                {tab.name}
              </span>
            </div>
          ))}
        </div>

        {/* 实时状态指示器 */}
        <div className="p-2 border-t border-white/10">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mb-1 ${
              isExecutingPlan ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className="text-[8px] text-white/60">
              {isExecutingPlan ? 'LIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 内容标题栏 */}
        <div className="p-4 border-b border-white/10 bg-gray-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-sm flex items-center">
              <button
              style={createGlassIconButtonStyle(TABS.find(t => t.id === activeTab)?.color || '59, 130, 246')}
              className="mr-2"
              {...createGlassIconHoverHandlers(TABS.find(t => t.id === activeTab)?.color || '59, 130, 246')}
            >
              {TABS.find(t => t.id === activeTab)?.icon}
            </button>
              {TABS.find(t => t.id === activeTab)?.name}
            </h3>
            <div className="text-white/40 text-xs">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Tab内容 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'tasks' && renderTasksTab()}
          {activeTab === 'billing' && renderBillingTab()}
          {activeTab === 'memory' && renderMemoryTab()}
          {activeTab === 'events' && renderEventsTab()}
        </div>
      </div>
    </div>
  );
};