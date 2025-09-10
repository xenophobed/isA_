/**
 * ============================================================================
 * Dashboard Component - 自动化仪表板
 * ============================================================================
 * 
 * 自动化系统的综合仪表板组件
 * 显示KPI指标、活动监控、系统健康状态等
 */

import React, { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { GlassCard } from '../../../shared/ui/GlassCard';
import { 
  DASHBOARD_KPIS, 
  ACTIVITY_FEED, 
  SYSTEM_HEALTH, 
  SCHEDULED_TASKS, 
  CONNECTORS,
  NOTIFICATION_SETTINGS 
} from './data';
import type { 
  DashboardKPI, 
  ActivityItem, 
  SystemHealthItem, 
  ScheduledTask,
  ConnectorConfig,
  NotificationSetting 
} from './types';

export interface DashboardProps {
  className?: string;
  onCreateNewAutomation?: () => void;
  onViewTask?: (taskId: string) => void;
  onManageConnectors?: () => void;
  onViewSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  className = '',
  onCreateNewAutomation,
  onViewTask,
  onManageConnectors,
  onViewSettings
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'scheduled' | 'system'>('overview');

  const getKPITrendIcon = (direction: 'up' | 'down' | 'stable'): string => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getKPITrendColor = (direction: 'up' | 'down' | 'stable'): string => {
    switch (direction) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'stable': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getActivityTypeColor = (type: 'success' | 'warning' | 'error' | 'info'): string => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'error'): string => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTaskStatusColor = (status: 'active' | 'paused' | 'disabled'): string => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20';
      case 'disabled': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getConnectorStatusColor = (status: 'connected' | 'disconnected' | 'error'): string => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>📊</span>
            自动化控制台
          </h3>
          <p className="text-white/70">
            监控和管理你的自动化流程
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon="➕"
            onClick={onCreateNewAutomation}
          >
            创建自动化
          </Button>
          <Button
            variant="ghost"
            icon="⚙️"
            onClick={onViewSettings}
          >
            设置
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_KPIS.map((kpi) => (
          <GlassCard key={kpi.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{kpi.icon}</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getKPITrendColor(kpi.trend.direction)} bg-white/10`}>
                  {getKPITrendIcon(kpi.trend.direction)} {kpi.trend.percentage}%
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpi.value}
                </div>
                <div className="text-sm text-white/60">
                  {kpi.title}
                </div>
              </div>
              
              <div className="text-xs text-white/50">
                {kpi.trend.period}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'overview', label: '系统概览', icon: '📊' },
          { key: 'activity', label: '活动日志', icon: '📜' },
          { key: 'scheduled', label: '计划任务', icon: '⏰' },
          { key: 'system', label: '系统状态', icon: '🔧' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white">系统健康状态</h4>
              <Button variant="ghost" size="sm" icon="🔄">
                刷新
              </Button>
            </div>
            
            <div className="space-y-3">
              {SYSTEM_HEALTH.map((item) => (
                <div key={item.service} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-white font-medium">{item.service}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm">{item.value}</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h4 className="font-semibold text-white mb-4">快速操作</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="h-16 flex-col"
                icon="🚀"
                onClick={onCreateNewAutomation}
              >
                <span className="text-xs mt-1">新建流程</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-16 flex-col"
                icon="📋"
                onClick={() => setActiveTab('scheduled')}
              >
                <span className="text-xs mt-1">计划任务</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-16 flex-col"
                icon="🔗"
                onClick={onManageConnectors}
              >
                <span className="text-xs mt-1">连接器</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-16 flex-col"
                icon="📊"
                onClick={() => setActiveTab('activity')}
              >
                <span className="text-xs mt-1">活动日志</span>
              </Button>
            </div>

            {/* Connectors Status */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h5 className="text-sm font-medium text-white/80 mb-3">连接器状态</h5>
              <div className="space-y-2">
                {CONNECTORS.map((connector) => (
                  <div key={connector.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{connector.icon}</span>
                      <span className="text-sm text-white/70">{connector.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getConnectorStatusColor(connector.status)}`} />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'activity' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-white">最近活动</h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon="🔄">
                刷新
              </Button>
              <Button variant="ghost" size="sm" icon="📤">
                导出日志
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {ACTIVITY_FEED.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityTypeColor(activity.type)}`}>
                  {activity.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{activity.template}</span>
                    <span className="text-xs text-white/50">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-white/70">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm">
              查看更多活动
            </Button>
          </div>
        </GlassCard>
      )}

      {activeTab === 'scheduled' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-white">计划任务</h4>
            <Button variant="primary" size="sm" icon="➕">
              新建任务
            </Button>
          </div>

          <div className="space-y-3">
            {SCHEDULED_TASKS.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{task.icon}</span>
                  <div>
                    <div className="font-medium text-white">{task.name}</div>
                    <div className="text-sm text-white/60">{task.template}</div>
                    <div className="text-xs text-white/50">下次执行: {task.nextRun}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                    {task.status.toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" icon="▶️" />
                    <Button variant="ghost" size="sm" icon="⚙️" />
                    <Button variant="ghost" size="sm" icon="🗑️" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Details */}
          <GlassCard className="p-6">
            <h4 className="font-semibold text-white mb-4">系统健康详情</h4>
            
            <div className="space-y-4">
              {SYSTEM_HEALTH.map((item) => (
                <div key={item.service} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">{item.service}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.status === 'healthy' ? 'bg-green-500' :
                        item.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: item.value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notifications Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white">通知设置</h4>
              <Button variant="ghost" size="sm" icon="⚙️">
                管理
              </Button>
            </div>
            
            <div className="space-y-3">
              {NOTIFICATION_SETTINGS.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/70">{setting.label}</span>
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    setting.enabled ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      setting.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Dashboard;