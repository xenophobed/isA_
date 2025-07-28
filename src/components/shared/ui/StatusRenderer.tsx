/**
 * ============================================================================
 * StatusRenderer - 通用状态渲染组件
 * ============================================================================
 * 
 * 【核心功能】
 * - 统一处理各种状态的渲染（加载、处理、错误等）
 * - 支持多种显示变体和动画效果
 * - 可配置的进度显示和自定义消息
 * - 可在聊天、Widget、Artifact 等场景复用
 * 
 * 【设计原则】
 * - 一致性：统一的状态显示样式
 * - 可配置：通过 props 控制样式和行为
 * - 可扩展：易于添加新的状态类型
 * - 高性能：优化的动画和渲染
 */

import React, { memo } from 'react';

// ================================================================================
// 类型定义
// ================================================================================

export type StatusType = 
  | 'loading'        // 加载中
  | 'processing'     // 处理中
  | 'generating'     // 生成中
  | 'searching'      // 搜索中
  | 'analyzing'      // 分析中
  | 'uploading'      // 上传中
  | 'success'        // 成功
  | 'error'          // 错误
  | 'warning'        // 警告
  | 'info'           // 信息
  | 'completed';     // 完成

export type StatusVariant = 
  | 'inline'         // 内联显示
  | 'overlay'        // 覆盖层
  | 'avatar-side'    // 头像旁边
  | 'widget-header'  // Widget 头部
  | 'floating'       // 浮动显示
  | 'minimal';       // 最小化显示

export type StatusSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusRendererProps {
  status: StatusType;           // 状态类型
  message?: string;             // 状态消息
  variant?: StatusVariant;      // 显示变体
  size?: StatusSize;            // 尺寸大小
  showProgress?: boolean;       // 显示进度条
  progress?: number;            // 进度值 (0-100)
  icon?: string | React.ReactNode; // 自定义图标
  className?: string;           // 自定义类名
  animated?: boolean;           // 启用动画
  showTime?: boolean;           // 显示时间
  duration?: number;            // 持续时间（毫秒）
  onComplete?: () => void;      // 完成回调
  onCancel?: () => void;        // 取消回调
}

// ================================================================================
// 状态配置
// ================================================================================

const getStatusConfig = (status: StatusType) => {
  const configs = {
    loading: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      icon: '⏳',
      defaultMessage: 'Loading...'
    },
    processing: {
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      icon: '⚙️',
      defaultMessage: 'Processing...'
    },
    generating: {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '✨',
      defaultMessage: 'Generating...'
    },
    searching: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      icon: '🔍',
      defaultMessage: 'Searching...'
    },
    analyzing: {
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/30',
      icon: '📊',
      defaultMessage: 'Analyzing...'
    },
    uploading: {
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-500/30',
      icon: '📤',
      defaultMessage: 'Uploading...'
    },
    success: {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '✅',
      defaultMessage: 'Success!'
    },
    error: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: '❌',
      defaultMessage: 'Error occurred'
    },
    warning: {
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      icon: '⚠️',
      defaultMessage: 'Warning'
    },
    info: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      icon: 'ℹ️',
      defaultMessage: 'Information'
    },
    completed: {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '🎉',
      defaultMessage: 'Completed!'
    }
  };

  return configs[status];
};

const getVariantClasses = (variant: StatusVariant, size: StatusSize): string => {
  const baseClasses = 'status-renderer flex items-center';
  
  const variantClasses = {
    inline: 'inline-flex',
    overlay: 'fixed inset-0 bg-black/50 justify-center items-center z-50',
    'avatar-side': 'ml-3 flex items-center gap-2',
    'widget-header': 'px-3 py-2 rounded-t-lg border-b border-white/10',
    floating: 'fixed top-4 right-4 z-40 rounded-lg px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg',
    minimal: 'inline-flex items-center gap-1'
  };
  
  const sizeClasses = {
    xs: 'text-xs gap-1',
    sm: 'text-sm gap-1.5',
    md: 'text-base gap-2',
    lg: 'text-lg gap-2.5'
  };
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// ================================================================================
// 子组件
// ================================================================================

// 加载动画组件
const LoadingSpinner: React.FC<{ size: StatusSize; color: string; animated: boolean }> = memo(({ size, color, animated }) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`${sizeMap[size]} ${animated ? 'animate-spin' : ''}`}>
      <div className={`w-full h-full border-2 border-transparent border-t-current rounded-full ${color}`} />
    </div>
  );
});

// 脉冲动画组件
const PulsingDot: React.FC<{ size: StatusSize; color: string; animated: boolean }> = memo(({ size, color, animated }) => {
  const sizeMap = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`${sizeMap[size]} ${color.replace('text-', 'bg-')} rounded-full ${animated ? 'animate-pulse' : ''}`} />
  );
});

// 进度条组件
const ProgressBar: React.FC<{ 
  progress: number; 
  size: StatusSize; 
  color: string; 
  animated: boolean 
}> = memo(({ progress, size, color, animated }) => {
  const heightMap = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5'
  };

  return (
    <div className={`w-24 ${heightMap[size]} bg-white/20 rounded-full overflow-hidden`}>
      <div 
        className={`h-full ${color.replace('text-', 'bg-')} ${animated ? 'transition-all duration-300' : ''}`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
});

// 多点跳动动画
const BouncingDots: React.FC<{ size: StatusSize; color: string; animated: boolean }> = memo(({ size, color, animated }) => {
  const sizeMap = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${sizeMap[size]} 
            ${color.replace('text-', 'bg-')} 
            rounded-full 
            ${animated ? 'animate-bounce' : ''}
          `}
          style={{
            animationDelay: animated ? `${index * 0.1}s` : undefined
          }}
        />
      ))}
    </div>
  );
});

// ================================================================================
// 主组件
// ================================================================================

export const StatusRenderer: React.FC<StatusRendererProps> = memo(({
  status,
  message,
  variant = 'inline',
  size = 'md',
  showProgress = false,
  progress = 0,
  icon,
  className = '',
  animated = true,
  showTime = false,
  duration,
  onComplete,
  onCancel
}) => {
  const config = getStatusConfig(status);
  const containerClasses = `${getVariantClasses(variant, size)} ${config.bgColor} ${config.borderColor} ${className}`;
  const displayMessage = message || config.defaultMessage;
  const displayIcon = icon || config.icon;

  // 渲染动画
  const renderAnimation = () => {
    if (['loading', 'processing', 'generating', 'searching', 'analyzing', 'uploading'].includes(status)) {
      if (variant === 'minimal') {
        return <PulsingDot size={size} color={config.color} animated={animated} />;
      } else if (variant === 'avatar-side') {
        return <BouncingDots size={size} color={config.color} animated={animated} />;
      } else {
        return <LoadingSpinner size={size} color={config.color} animated={animated} />;
      }
    }
    return null;
  };

  // 渲染图标
  const renderIcon = () => {
    if (typeof displayIcon === 'string') {
      return <span className="text-lg">{displayIcon}</span>;
    } else if (React.isValidElement(displayIcon)) {
      return displayIcon;
    }
    return null;
  };

  // 格式化时间
  const formatTime = () => {
    if (!showTime) return null;
    return new Date().toLocaleTimeString();
  };

  return (
    <div className={containerClasses}>
      {/* 动画/图标 */}
      <div className="flex-shrink-0">
        {renderAnimation() || renderIcon()}
      </div>
      
      {/* 消息内容 */}
      {(displayMessage || showProgress) && (
        <div className="flex-1 min-w-0">
          {displayMessage && (
            <span className={`${config.color} font-medium`}>
              {displayMessage}
            </span>
          )}
          
          {/* 进度条 */}
          {showProgress && (
            <div className="mt-1">
              <ProgressBar 
                progress={progress} 
                size={size} 
                color={config.color} 
                animated={animated} 
              />
              {progress > 0 && (
                <span className={`text-xs ${config.color} mt-1 block`}>
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          )}
          
          {/* 时间显示 */}
          {showTime && (
            <span className="text-xs text-white/40 ml-2">
              {formatTime()}
            </span>
          )}
        </div>
      )}
      
      {/* 操作按钮 */}
      {(onCancel || onComplete) && (
        <div className="flex-shrink-0 ml-2 flex gap-1">
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded transition-colors"
              title="Cancel"
            >
              ✕
            </button>
          )}
          {onComplete && status === 'success' && (
            <button
              onClick={onComplete}
              className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded transition-colors"
              title="Complete"
            >
              ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
});

StatusRenderer.displayName = 'StatusRenderer';