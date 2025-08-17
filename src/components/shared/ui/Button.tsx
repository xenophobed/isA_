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

import React, { memo, forwardRef, useMemo } from 'react';

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
  // Accessibility props
  'aria-label'?: string;        // ARIA label
  'aria-describedby'?: string;  // ARIA description reference
  'aria-expanded'?: boolean;    // For toggle buttons
  'aria-pressed'?: boolean;     // For toggle state
  'aria-controls'?: string;     // Controls relationship
  role?: string;                // Custom role
}

// ================================================================================
// 样式配置
// ================================================================================

// Optimized variant classes using design system tokens
const VARIANT_CLASSES = {
  primary: 'bg-gradient-secondary text-white font-semibold border-0 shadow-lg hover:shadow-xl hover:shadow-primary/30 interactive-scale',
  secondary: 'glass-secondary text-white font-medium hover:shadow-lg hover:shadow-white/10 interactive-scale',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold border-0 shadow-lg hover:shadow-xl hover:shadow-green-500/30 interactive-scale',
  danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold border-0 shadow-lg hover:shadow-xl hover:shadow-red-500/30 interactive-scale',
  warning: 'bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-semibold border-0 shadow-lg hover:shadow-xl hover:shadow-orange-500/30 interactive-scale',
  ghost: 'bg-transparent hover:bg-white/8 border border-transparent hover:border-glass-border-hover text-white/80 hover:text-white hover:shadow-md interactive-scale',
  link: 'bg-transparent hover:bg-primary/10 border-0 text-primary hover:text-primary-hover underline hover:no-underline interactive-scale',
  icon: 'glass-secondary text-white/90 hover:text-white hover:shadow-md interactive-scale'
} as const;

const getVariantClasses = (variant: ButtonVariant): string => {
  return VARIANT_CLASSES[variant];
};

// Optimized size classes using design system tokens
const SIZE_CLASSES = {
  icon: {
    xs: 'w-6 h-6 p-xs',
    sm: 'w-8 h-8 p-sm',
    md: 'w-10 h-10 p-md',
    lg: 'w-12 h-12 p-lg',
    xl: 'w-14 h-14 p-xl'
  },
  button: {
    xs: 'px-md py-xs text-xs',
    sm: 'px-lg py-sm text-sm',
    md: 'px-xl py-md text-base',
    lg: 'px-2xl py-lg text-lg',
    xl: 'px-3xl py-xl text-xl'
  }
} as const;

const getSizeClasses = (size: ButtonSize, onlyIcon: boolean): string => {
  return onlyIcon ? SIZE_CLASSES.icon[size] : SIZE_CLASSES.button[size];
};

// Optimized state classes
const STATE_CLASSES = {
  normal: '',
  loading: 'opacity-80 cursor-wait pointer-events-none',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  pressed: 'scale-95'
} as const;

const getStateClasses = (state: ButtonState, loading: boolean): string => {
  if (loading) return STATE_CLASSES.loading;
  return STATE_CLASSES[state];
};

// ================================================================================
// 子组件
// ================================================================================

// Optimized loading spinner with design system
const SPINNER_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6'
} as const;

const LoadingSpinner: React.FC<{ size: ButtonSize }> = memo(({ size }) => (
  <div className={`${SPINNER_SIZES[size]} animate-spin`}>
    <div className="w-full h-full border-2 border-transparent border-t-current rounded-full" />
  </div>
));

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

  // Optimized class building using useMemo
  const finalClassName = useMemo(() => {
    const baseClasses = 'layout-center rounded-xl transition-all duration-normal ease-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent font-medium select-none backdrop-blur-md';
    
    const classes = [
      baseClasses,
      getVariantClasses(variant),
      getSizeClasses(size, onlyIcon),
      getStateClasses(finalState, isLoading),
      fullWidth && 'w-full',
      rounded && 'rounded-full',
      elevated && 'shadow-2xl hover:shadow-3xl',
      className
    ];

    return classes.filter(Boolean).join(' ');
  }, [variant, size, onlyIcon, finalState, isLoading, fullWidth, rounded, elevated, className]);

  // Optimized content rendering with useMemo
  const buttonContent = useMemo(() => {
    // Icon-only mode
    if (onlyIcon) {
      return isLoading ? <LoadingSpinner size={size} /> : icon;
    }

    // Regular mode
    const content = isLoading && loadingText ? loadingText : children;
    const displayIcon = isLoading ? <LoadingSpinner size={size} /> : icon;

    if (!displayIcon) {
      return content;
    }

    return (
      <>
        {iconPosition === 'left' && (
          <span className={content ? 'mr-md' : ''}>
            {displayIcon}
          </span>
        )}
        {content}
        {iconPosition === 'right' && (
          <span className={content ? 'ml-md' : ''}>
            {displayIcon}
          </span>
        )}
      </>
    );
  }, [onlyIcon, isLoading, size, icon, loadingText, children, iconPosition]);

  // Enhanced accessibility attributes
  const accessibilityProps = useMemo(() => {
    const ariaProps: Record<string, any> = {};
    
    // Set aria-label for icon-only buttons or if explicitly provided
    if (onlyIcon && !props['aria-label'] && !tooltipText) {
      ariaProps['aria-label'] = 'Button';
    } else if (props['aria-label']) {
      ariaProps['aria-label'] = props['aria-label'];
    }
    
    // Loading state accessibility
    if (isLoading) {
      ariaProps['aria-busy'] = true;
      ariaProps['aria-live'] = 'polite';
      if (loadingText) {
        ariaProps['aria-label'] = loadingText;
      }
    }
    
    // Disabled state
    if (disabled) {
      ariaProps['aria-disabled'] = true;
    }
    
    // Toggle button states
    if (props['aria-pressed'] !== undefined) {
      ariaProps['aria-pressed'] = props['aria-pressed'];
    }
    
    if (props['aria-expanded'] !== undefined) {
      ariaProps['aria-expanded'] = props['aria-expanded'];
    }
    
    // Other ARIA props
    if (props['aria-describedby']) {
      ariaProps['aria-describedby'] = props['aria-describedby'];
    }
    
    if (props['aria-controls']) {
      ariaProps['aria-controls'] = props['aria-controls'];
    }
    
    return ariaProps;
  }, [onlyIcon, props, tooltipText, isLoading, loadingText, disabled]);

  return (
    <button
      ref={ref}
      className={finalClassName}
      disabled={disabled || isLoading}
      title={tooltipText}
      role={props.role || 'button'}
      {...accessibilityProps}
      {...props}
    >
      {buttonContent}
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