/**
 * ============================================================================
 * FloatingAIActions - 浮动AI操作面板
 * ============================================================================
 * 
 * 功能特性：
 * - 鼠标悬停内容区域时显示
 * - 右侧浮动位置，glassmorphism设计
 * - 多种AI操作：编辑、继续、优化、分析
 * - 平滑动画效果
 * - 可配置的操作按钮
 */

import React from 'react';
import { Button } from '../ui/Button';

// ================================================================================
// 类型定义
// ================================================================================

export interface AIAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

export interface FloatingAIActionsProps {
  isVisible: boolean;
  actions?: AIAction[];
  className?: string;
  position?: 'right' | 'left' | 'top' | 'bottom';
  onEdit?: () => void;
  onContinue?: () => void;
  onRefine?: () => void;
  onAnalyze?: () => void;
  onTranslate?: () => void;
  onSummarize?: () => void;
}

// ================================================================================
// 默认AI操作
// ================================================================================

const getDefaultActions = (props: FloatingAIActionsProps): AIAction[] => [
  ...(props.onEdit ? [{
    id: 'edit',
    label: 'Edit Content',
    icon: '✏️',
    description: 'AI-powered content editing',
    variant: 'primary' as const,
    onClick: props.onEdit,
  }] : []),
  ...(props.onContinue ? [{
    id: 'continue',
    label: 'Continue',
    icon: '➕',
    description: 'Add more content',
    variant: 'success' as const,
    onClick: props.onContinue,
  }] : []),
  ...(props.onRefine ? [{
    id: 'refine',
    label: 'Refine',
    icon: '✨',
    description: 'Improve writing style',
    variant: 'secondary' as const,
    onClick: props.onRefine,
  }] : []),
  ...(props.onAnalyze ? [{
    id: 'analyze',
    label: 'Analyze',
    icon: '🔍',
    description: 'Get content insights',
    variant: 'warning' as const,
    onClick: props.onAnalyze,
  }] : []),
  ...(props.onTranslate ? [{
    id: 'translate',
    label: 'Translate',
    icon: '🌐',
    description: 'Translate content',
    variant: 'secondary' as const,
    onClick: props.onTranslate,
  }] : []),
  ...(props.onSummarize ? [{
    id: 'summarize',
    label: 'Summarize',
    icon: '📝',
    description: 'Create summary',
    variant: 'secondary' as const,
    onClick: props.onSummarize,
  }] : []),
];

// ================================================================================
// 样式配置
// ================================================================================

const getPositionClasses = (position: string, isVisible: boolean) => {
  const baseClasses = 'fixed transition-all duration-300 z-40';
  
  const positions = {
    right: {
      base: 'right-6 top-1/2 transform -translate-y-1/2',
      visible: 'opacity-100 translate-x-0',
      hidden: 'opacity-0 translate-x-full pointer-events-none'
    },
    left: {
      base: 'left-6 top-1/2 transform -translate-y-1/2',
      visible: 'opacity-100 translate-x-0',
      hidden: 'opacity-0 -translate-x-full pointer-events-none'
    },
    top: {
      base: 'top-6 left-1/2 transform -translate-x-1/2',
      visible: 'opacity-100 translate-y-0',
      hidden: 'opacity-0 -translate-y-full pointer-events-none'
    },
    bottom: {
      base: 'bottom-6 left-1/2 transform -translate-x-1/2',
      visible: 'opacity-100 translate-y-0',
      hidden: 'opacity-0 translate-y-full pointer-events-none'
    }
  };

  const config = positions[position as keyof typeof positions] || positions.right;
  const visibilityClass = isVisible ? config.visible : config.hidden;
  
  return `${baseClasses} ${config.base} ${visibilityClass}`;
};

const getActionButtonClasses = (variant: string) => {
  const variants = {
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30',
    warning: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30',
    secondary: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30'
  };
  
  return variants[variant as keyof typeof variants] || variants.primary;
};

// ================================================================================
// 主组件
// ================================================================================

export const FloatingAIActions: React.FC<FloatingAIActionsProps> = ({
  isVisible,
  actions,
  className = '',
  position = 'right',
  ...actionProps
}) => {
  const finalActions = actions || getDefaultActions({ isVisible, actions, className, position, ...actionProps });
  
  if (finalActions.length === 0) {
    return null;
  }

  return (
    <div className={`${getPositionClasses(position, isVisible)} ${className}`}>
      <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl min-w-[160px]">
        {/* 标题 */}
        <div className="text-center mb-3">
          <div className="text-lg mb-1">🤖</div>
          <div className="text-xs text-white/80 font-medium">AI Assistant</div>
        </div>
        
        {/* 操作按钮 */}
        <div className="space-y-2">
          {finalActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm border disabled:opacity-50 disabled:cursor-not-allowed ${getActionButtonClasses(action.variant || 'primary')}`}
              title={action.description}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        
        {/* 提示文本 */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-white/50 text-center">
            Hover over content to access AI tools
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================================
// 快捷组件变体
// ================================================================================

// 内容编辑专用的AI操作面板
export const ContentEditingAIActions: React.FC<Omit<FloatingAIActionsProps, 'actions'> & {
  onEdit: () => void;
  onContinue: () => void;
  onRefine: () => void;
}> = (props) => (
  <FloatingAIActions {...props} />
);

// 文本处理专用的AI操作面板
export const TextProcessingAIActions: React.FC<Omit<FloatingAIActionsProps, 'actions'> & {
  onSummarize: () => void;
  onTranslate: () => void;
  onAnalyze: () => void;
}> = (props) => (
  <FloatingAIActions {...props} />
);

// 紧凑版AI操作面板
export const CompactFloatingAIActions: React.FC<FloatingAIActionsProps> = (props) => {
  const compactActions: AIAction[] = [
    {
      id: 'quick-edit',
      label: 'Edit',
      icon: '✏️',
      variant: 'primary',
      onClick: props.onEdit || (() => {}),
    },
    {
      id: 'quick-continue',
      label: 'Continue',
      icon: '➕',
      variant: 'success',
      onClick: props.onContinue || (() => {}),
    },
    {
      id: 'quick-refine',
      label: 'Refine',
      icon: '✨',
      variant: 'secondary',
      onClick: props.onRefine || (() => {}),
    }
  ];

  return (
    <div className={`${getPositionClasses(props.position || 'right', props.isVisible)} ${props.className || ''}`}>
      <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
        <div className="flex flex-col gap-1">
          {compactActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border ${getActionButtonClasses(action.variant || 'primary')}`}
              title={action.label}
            >
              <span className="text-sm">{action.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};