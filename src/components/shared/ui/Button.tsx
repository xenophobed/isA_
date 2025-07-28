/**
 * ============================================================================
 * Button - 通用按钮组件系统
 * ============================================================================
 * 
 * 【核心功能】
 * - 统一的按钮样式和行为
 * - 支持多种变体和状态
 * - 与现有 glassmorphism 设计风格一致
 * - 可配置的图标、加载状态、禁用状态
 * 
 * 【设计原则】
 * - 一致性：统一的按钮风格
 * - 可访问性：支持键盘导航和屏幕阅读器
 * - 可配置：通过 props 控制样式和行为
 * - 可扩展：易于添加新的按钮类型
 */

import React, { memo, forwardRef } from 'react';

// ================================================================================
// 类型定义
// ================================================================================

export type ButtonVariant = 
  | 'primary'        // 主要按钮
  | 'secondary'      // 次要按钮
  | 'success'        // 成功按钮
  | 'danger'         // 危险按钮
  | 'warning'        // 警告按钮
  | 'ghost'          // 透明按钮
  | 'link'           // 链接样式按钮
  | 'icon';          // 图标按钮

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonState = 'normal' | 'loading' | 'disabled' | 'pressed';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;        // 按钮变体
  size?: ButtonSize;             // 按钮尺寸
  state?: ButtonState;           // 按钮状态
  icon?: React.ReactNode;        // 图标
  iconPosition?: 'left' | 'right'; // 图标位置
  loading?: boolean;             // 加载状态
  loadingText?: string;          // 加载时显示的文本
  fullWidth?: boolean;           // 全宽按钮
  rounded?: boolean;             // 圆角按钮
  elevated?: boolean;            // 提升效果
  onlyIcon?: boolean;           // 仅显示图标
  tooltipText?: string;         // 工具提示文本
  children?: React.ReactNode;   // 按钮内容
}

// ================================================================================
// 样式配置
// ================================================================================

const getVariantClasses = (variant: ButtonVariant): string => {
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500 to-purple-600
      hover:from-blue-600 hover:to-purple-700
      border-0
      text-white font-semibold
      shadow-lg hover:shadow-xl
      hover:shadow-blue-500/30
      active:scale-95
    `,
    secondary: `
      bg-white/8 backdrop-blur-lg
      hover:bg-white/12
      border border-white/20 hover:border-white/30
      text-white font-medium
      hover:shadow-lg hover:shadow-white/10
      active:scale-95
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-600
      hover:from-green-600 hover:to-emerald-700
      border-0
      text-white font-semibold
      shadow-lg hover:shadow-xl
      hover:shadow-green-500/30
      active:scale-95
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-pink-600
      hover:from-red-600 hover:to-pink-700
      border-0
      text-white font-semibold
      shadow-lg hover:shadow-xl
      hover:shadow-red-500/30
      active:scale-95
    `,
    warning: `
      bg-gradient-to-r from-orange-500 to-yellow-600
      hover:from-orange-600 hover:to-yellow-700
      border-0
      text-white font-semibold
      shadow-lg hover:shadow-xl
      hover:shadow-orange-500/30
      active:scale-95
    `,
    ghost: `
      bg-transparent hover:bg-white/8
      border border-transparent hover:border-white/20
      text-white/80 hover:text-white
      hover:shadow-md
      active:scale-95
    `,
    link: `
      bg-transparent hover:bg-blue-500/10
      border-0
      text-blue-400 hover:text-blue-300
      underline hover:no-underline
      active:scale-95
    `,
    icon: `
      bg-white/8 hover:bg-white/15
      border border-white/20 hover:border-white/30
      text-white/90 hover:text-white
      hover:shadow-md
      active:scale-95
    `
  };

  return variants[variant].replace(/\s+/g, ' ').trim();
};

const getSizeClasses = (size: ButtonSize, onlyIcon: boolean): string => {
  if (onlyIcon) {
    const iconSizes = {
      xs: 'w-6 h-6 p-1',
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-2.5',
      xl: 'w-14 h-14 p-3'
    };
    return iconSizes[size];
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-2.5 text-lg',
    xl: 'px-8 py-3 text-xl'
  };

  return sizes[size];
};

const getStateClasses = (state: ButtonState, loading: boolean): string => {
  if (loading) {
    return 'opacity-80 cursor-wait pointer-events-none';
  }

  const states = {
    normal: '',
    loading: 'opacity-80 cursor-wait pointer-events-none',
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    pressed: 'scale-95'
  };

  return states[state];
};

// ================================================================================
// 子组件
// ================================================================================

// 加载动画组件
const LoadingSpinner: React.FC<{ size: ButtonSize }> = memo(({ size }) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  return (
    <div className={`${sizeMap[size]} animate-spin`}>
      <div className="w-full h-full border-2 border-transparent border-t-current rounded-full" />
    </div>
  );
});

// ================================================================================
// 主组件
// ================================================================================

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  state = 'normal',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText,
  fullWidth = false,
  rounded = false,
  elevated = false,
  onlyIcon = false,
  tooltipText,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  // 确定最终状态
  const finalState = disabled ? 'disabled' : loading ? 'loading' : state;
  const isLoading = loading || finalState === 'loading';

  // 构建类名
  const baseClasses = `
    inline-flex items-center justify-center
    rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent
    font-medium
    select-none
    backdrop-blur-md
    transform hover:scale-105
  `;

  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size, onlyIcon);
  const stateClasses = getStateClasses(finalState, isLoading);
  
  const conditionalClasses = [
    fullWidth && 'w-full',
    rounded && 'rounded-full',
    elevated && 'shadow-2xl hover:shadow-3xl',
    onlyIcon && 'rounded-xl'
  ].filter(Boolean).join(' ');

  const finalClassName = `
    ${baseClasses}
    ${variantClasses}
    ${sizeClasses}
    ${stateClasses}
    ${conditionalClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  // 渲染内容
  const renderContent = () => {
    // 仅图标模式
    if (onlyIcon) {
      if (isLoading) {
        return <LoadingSpinner size={size} />;
      }
      return icon;
    }

    // 常规模式
    const content = isLoading && loadingText ? loadingText : children;
    const displayIcon = isLoading ? <LoadingSpinner size={size} /> : icon;

    if (!displayIcon) {
      return content;
    }

    return (
      <>
        {iconPosition === 'left' && (
          <span className={content ? 'mr-2' : ''}>
            {displayIcon}
          </span>
        )}
        {content}
        {iconPosition === 'right' && (
          <span className={content ? 'ml-2' : ''}>
            {displayIcon}
          </span>
        )}
      </>
    );
  };

  return (
    <button
      ref={ref}
      className={finalClassName}
      disabled={disabled || isLoading}
      title={tooltipText}
      {...props}
    >
      {renderContent()}
    </button>
  );
}));

Button.displayName = 'Button';

// ================================================================================
// 预设按钮组件
// ================================================================================

// 主要按钮
export const PrimaryButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
));

// 次要按钮
export const SecondaryButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
));

// 成功按钮
export const SuccessButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="success" {...props} />
));

// 危险按钮
export const DangerButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
));

// 图标按钮
export const IconButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'onlyIcon'>>(
  (props, ref) => <Button ref={ref} variant="icon" onlyIcon {...props} />
));

// 链接按钮
export const LinkButton = memo(forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="link" {...props} />
));

PrimaryButton.displayName = 'PrimaryButton';
SecondaryButton.displayName = 'SecondaryButton';
SuccessButton.displayName = 'SuccessButton';
DangerButton.displayName = 'DangerButton';
IconButton.displayName = 'IconButton';
LinkButton.displayName = 'LinkButton';