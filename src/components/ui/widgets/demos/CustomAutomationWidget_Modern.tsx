/**
 * ============================================================================
 * CustomAutomationWidget - Modern Card-based Demo
 * ============================================================================
 * 
 * 现代卡片风格：
 * - 卡片化的工作流程布局
 * - 拖拽式任务配置
 * - 可视化的流程步骤展示
 */

import React, { useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { Button } from '../../../shared/ui/Button';

interface FlowStep {
  id: string;
  name: string;
  type: 'input' | 'processing' | 'decision' | 'output';
  status: 'pending' | 'running' | 'completed' | 'error';
  config?: any;
  icon: string;
}

interface SmartAutomation {
  id: string;
  title: string;
  category: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  steps: FlowStep[];
  tags: string[];
}

const ModernAutomationDemo: React.FC = () => {
  const [selectedAutomation, setSelectedAutomation] = useState<SmartAutomation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);

  // Smart automation templates
  const automations: SmartAutomation[] = [
    {
      id: 'data-analysis',
      title: '智能数据分析',
      category: '数据处理',
      description: '自动分析上传数据，生成洞察报告和可视化图表',
      complexity: 'medium',
      estimatedTime: '3-8分钟',
      tags: ['数据科学', 'AI分析', '报告生成'],
      steps: [
        { id: 'upload', name: '数据上传', type: 'input', status: 'pending', icon: '📤' },
        { id: 'validate', name: '数据验证', type: 'processing', status: 'pending', icon: '✅' },
        { id: 'analyze', name: 'AI分析', type: 'processing', status: 'pending', icon: '🧠' },
        { id: 'visualize', name: '生成图表', type: 'processing', status: 'pending', icon: '📊' },
        { id: 'report', name: '报告输出', type: 'output', status: 'pending', icon: '📋' }
      ]
    },
    {
      id: 'content-creation',
      title: '内容创作助手',
      category: '创意工具',
      description: '基于主题和风格要求，自动生成多媒体内容',
      complexity: 'simple',
      estimatedTime: '2-5分钟',
      tags: ['内容创作', 'AI写作', '多媒体'],
      steps: [
        { id: 'brief', name: '需求输入', type: 'input', status: 'pending', icon: '✍️' },
        { id: 'research', name: '素材研究', type: 'processing', status: 'pending', icon: '🔍' },
        { id: 'generate', name: 'AI创作', type: 'processing', status: 'pending', icon: '🎨' },
        { id: 'review', name: '质量检查', type: 'decision', status: 'pending', icon: '👀' },
        { id: 'deliver', name: '内容交付', type: 'output', status: 'pending', icon: '🚀' }
      ]
    },
    {
      id: 'workflow-optimization',
      title: '流程优化顾问',
      category: '业务流程',
      description: '分析现有业务流程，提供智能优化建议',
      complexity: 'complex',
      estimatedTime: '10-20分钟',
      tags: ['流程分析', 'BPM', '效率提升'],
      steps: [
        { id: 'mapping', name: '流程映射', type: 'input', status: 'pending', icon: '🗺️' },
        { id: 'bottleneck', name: '瓶颈识别', type: 'processing', status: 'pending', icon: '🔍' },
        { id: 'simulate', name: '场景模拟', type: 'processing', status: 'pending', icon: '🎭' },
        { id: 'optimize', name: '方案生成', type: 'processing', status: 'pending', icon: '⚡' },
        { id: 'roadmap', name: '实施路线', type: 'output', status: 'pending', icon: '🛤️' }
      ]
    }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'complex': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'running': return 'bg-blue-500 text-white animate-pulse';
      case 'error': return 'bg-red-500 text-white';
      default: return 'bg-white/10 text-white/60';
    }
  };

  const executeAutomation = async () => {
    if (!selectedAutomation) return;
    
    setIsExecuting(true);
    setExecutionStep(0);

    // Simulate step-by-step execution
    for (let i = 0; i < selectedAutomation.steps.length; i++) {
      setExecutionStep(i);
      selectedAutomation.steps[i].status = 'running';
      await new Promise(resolve => setTimeout(resolve, 1500));
      selectedAutomation.steps[i].status = 'completed';
    }

    setIsExecuting(false);
  };

  const managementActions = [
    {
      id: 'execute',
      label: '执行自动化',
      icon: '🚀',
      onClick: executeAutomation,
      variant: 'primary' as const,
      disabled: !selectedAutomation || isExecuting
    },
    {
      id: 'customize',
      label: '自定义流程',
      icon: '⚙️',
      onClick: () => console.log('Customize'),
      variant: 'secondary' as const
    },
    {
      id: 'templates',
      label: '模板库',
      icon: '📚',
      onClick: () => console.log('Templates'),
      variant: 'secondary' as const
    },
    {
      id: 'monitor',
      label: '执行监控',
      icon: '📊',
      onClick: () => console.log('Monitor'),
      variant: 'secondary' as const
    }
  ];

  return (
    <BaseWidget
      title="智能自动化工作台"
      icon="🤖"
      isProcessing={isExecuting}
      managementActions={managementActions}
      emptyStateConfig={{
        icon: '⚡',
        title: 'AI驱动的自动化',
        description: '选择预设模板或创建自定义工作流，让AI帮您完成复杂任务'
      }}
    >
      {/* Input Area */}
      <div className="p-6 space-y-6">
        {/* Automation Selection Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🎯</span>
            选择自动化模板
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automations.map((automation) => (
              <div
                key={automation.id}
                onClick={() => setSelectedAutomation(automation)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                  selectedAutomation?.id === automation.id
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-white text-sm">{automation.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getComplexityColor(automation.complexity)}`}>
                      {automation.complexity === 'simple' ? '简单' : 
                       automation.complexity === 'medium' ? '中等' : '复杂'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-white/60 leading-relaxed">{automation.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">预计用时: {automation.estimatedTime}</span>
                    <span className="text-blue-300">{automation.steps.length}个步骤</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {automation.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Automation Details */}
        {selectedAutomation && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>⚡</span>
                  {selectedAutomation.title}
                </h3>
                <p className="text-sm text-white/70 mt-1">{selectedAutomation.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                  <span>类别: {selectedAutomation.category}</span>
                  <span>•</span>
                  <span>预计时间: {selectedAutomation.estimatedTime}</span>
                </div>
              </div>
            </div>

            {/* Execution Flow Visualization */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                <span>🔄</span>
                执行流程
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {selectedAutomation.steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${getStepStatusColor(step.status)}`}>
                        <span>{step.icon}</span>
                      </div>
                      <div className="text-xs text-center">
                        <div className="text-white/80 font-medium">{step.name}</div>
                        <div className="text-white/50 capitalize">{step.status === 'pending' ? '待执行' : step.status === 'running' ? '执行中' : step.status === 'completed' ? '已完成' : '错误'}</div>
                      </div>
                    </div>
                    {index < selectedAutomation.steps.length - 1 && (
                      <div className="w-8 h-0.5 bg-white/20 flex-shrink-0 mx-2"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Execution Status */}
            {isExecuting && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <div className="text-sm font-medium text-blue-200">正在执行自动化流程...</div>
                    <div className="text-xs text-blue-300 mt-1">
                      当前步骤: {selectedAutomation.steps[executionStep]?.name}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">输出格式</label>
                <select className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400">
                  <option value="detailed">详细报告</option>
                  <option value="summary">摘要版本</option>
                  <option value="raw">原始数据</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">通知方式</label>
                <select className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400">
                  <option value="email">邮件通知</option>
                  <option value="webhook">Webhook</option>
                  <option value="none">无通知</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default ModernAutomationDemo;