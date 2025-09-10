/**
 * ============================================================================
 * Automation Demo Showcase - Compare Different Automation Widget Styles
 * ============================================================================
 * 
 * 展示页面，让用户选择不同的自动化Widget风格
 */

import React, { useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { Button } from '../../../shared/ui/Button';
import ClassicAutomationDemo from './CustomAutomationWidget_Classic';
import ModernAutomationDemo from './CustomAutomationWidget_Modern';
import MinimalAutomationDemo from './CustomAutomationWidget_Minimal';

type DemoStyle = 'showcase' | 'classic' | 'modern' | 'minimal';

interface DemoOption {
  id: DemoStyle;
  title: string;
  description: string;
  features: string[];
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced';
  preview: string;
}

const AutomationDemoShowcase: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<DemoStyle>('showcase');

  const demoOptions: DemoOption[] = [
    {
      id: 'classic',
      title: '经典企业版',
      description: '传统企业级界面，专注于业务流程管理和表单操作',
      features: [
        '🏢 企业级表单设计',
        '📊 数据表格展示',
        '⚙️ 工作流程配置',
        '📈 执行统计报告',
        '🔐 权限控制集成'
      ],
      icon: '🏢',
      complexity: 'advanced',
      preview: '适合传统企业用户，熟悉的操作界面'
    },
    {
      id: 'modern',
      title: '现代卡片版',
      description: '现代化设计语言，卡片式布局，可视化流程展示',
      features: [
        '🎨 现代化UI设计',
        '🔄 可视化流程图',
        '📱 响应式布局',
        '⚡ 实时状态反馈',
        '🎯 智能模板推荐'
      ],
      icon: '🎨',
      complexity: 'medium',
      preview: '视觉效果出色，交互体验流畅'
    },
    {
      id: 'minimal',
      title: '极简对话版',
      description: '对话式交互，AI引导配置，最简化的学习成本',
      features: [
        '💬 自然语言交互',
        '🤖 AI智能引导',
        '🎯 渐进式配置',
        '📚 上下文记忆',
        '⚡ 快速上手'
      ],
      icon: '💬',
      complexity: 'simple',
      preview: '最容易上手，适合非技术用户'
    }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400 bg-green-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'advanced': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple': return '简单';
      case 'medium': return '中等';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  if (selectedStyle !== 'showcase') {
    const DemoComponent = {
      classic: ClassicAutomationDemo,
      modern: ModernAutomationDemo,
      minimal: MinimalAutomationDemo
    }[selectedStyle];

    return (
      <div className="h-full flex flex-col">
        {/* Back to showcase button */}
        <div className="p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            icon="←"
            onClick={() => setSelectedStyle('showcase')}
            className="mb-2"
          >
            返回选择页面
          </Button>
          <div className="text-lg font-semibold text-white">
            {demoOptions.find(opt => opt.id === selectedStyle)?.title} 演示
          </div>
        </div>
        
        {/* Demo Component */}
        <div className="flex-1">
          <DemoComponent />
        </div>
      </div>
    );
  }

  const managementActions = [
    {
      id: 'compare',
      label: '功能对比',
      icon: '📊',
      onClick: () => console.log('Compare features'),
      variant: 'secondary' as const
    },
    {
      id: 'customize',
      label: '自定义风格',
      icon: '🎨',
      onClick: () => console.log('Customize'),
      variant: 'secondary' as const
    },
    {
      id: 'export',
      label: '导出配置',
      icon: '📤',
      onClick: () => console.log('Export'),
      variant: 'secondary' as const
    },
    {
      id: 'docs',
      label: '开发文档',
      icon: '📚',
      onClick: () => console.log('Docs'),
      variant: 'secondary' as const
    }
  ];

  return (
    <BaseWidget
      title="自动化Widget演示中心"
      icon="🎭"
      managementActions={managementActions}
      emptyStateConfig={{
        icon: '🚀',
        title: '选择你的风格',
        description: '体验不同风格的自动化Widget，找到最适合你的交互方式'
      }}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
            <span>🎯</span>
            自定义自动化Widget
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            根据数据结构自动生成合适的UI组件，集成任务流程管理，升级传统业务管理系统为AI驱动的智能化平台
          </p>
        </div>

        {/* Demo Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoOptions.map((option) => (
            <div
              key={option.id}
              className="group bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-xl p-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer transform hover:scale-105"
              onClick={() => setSelectedStyle(option.id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{option.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(option.complexity)}`}>
                    {getComplexityText(option.complexity)}
                  </span>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{option.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{option.description}</p>
                </div>
                
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-white/80">核心特性：</h4>
                  <div className="space-y-1">
                    {option.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="text-xs text-white/70 flex items-center gap-1">
                        <span className="text-blue-400">•</span>
                        {feature}
                      </div>
                    ))}
                    {option.features.length > 3 && (
                      <div className="text-xs text-white/50">
                        +{option.features.length - 3} 更多特性
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Preview */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50 italic">{option.preview}</p>
                </div>
                
                {/* CTA Button */}
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full group-hover:bg-blue-600 transition-all"
                  icon="🎬"
                >
                  体验演示
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Core Concept Explanation */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>💡</span>
            核心设计理念
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-300">🧠 智能UI生成</div>
              <p className="text-white/60">根据数据结构自动选择最合适的UI组件：输入框、下拉菜单、搜索框等</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-purple-300">🔄 任务流程集成</div>
              <p className="text-white/60">与任务管理系统无缝集成，自动化复杂的业务流程和决策逻辑</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-green-300">📊 传统系统升级</div>
              <p className="text-white/60">将传统的业务管理系统升级为AI驱动的智能化平台</p>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🏗️</span>
            技术架构特点
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-white/80">基于 BaseWidget 架构</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• 统一的输入/输出/管理三层结构</li>
                <li>• 可复用的组件设计模式</li>
                <li>• 标准化的事件处理机制</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-white/80">智能化特性</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• 数据驱动的UI生成</li>
                <li>• AI辅助的流程设计</li>
                <li>• 自适应的用户体验</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default AutomationDemoShowcase;