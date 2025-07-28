/**
 * ============================================================================
 * InputGroup - 通用输入组件系统
 * ============================================================================
 * 
 * 【核心功能】
 * - 统一的输入框样式和行为
 * - 支持多种输入类型和验证状态
 * - 与现有 glassmorphism 设计风格一致
 * - 可配置的标签、帮助文本、错误状态
 * 
 * 【设计原则】
 * - 一致性：统一的输入框风格
 * - 可访问性：支持标签关联和错误提示
 * - 可配置：通过 props 控制样式和行为
 * - 可扩展：易于添加新的输入类型
 */

import React, { memo, forwardRef, useState, useCallback } from 'react';

// ================================================================================
// 类型定义
// ================================================================================

export type InputVariant = 
  | 'default'        // 默认样式
  | 'filled'         // 填充样式
  | 'outlined'       // 边框样式
  | 'underlined';    // 下划线样式

export type InputSize = 'sm' | 'md' | 'lg';

export type InputState = 'normal' | 'error' | 'success' | 'warning' | 'disabled';

export interface InputGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;                // 输入框标签
  helperText?: string;          // 帮助文本
  errorText?: string;           // 错误文本
  variant?: InputVariant;       // 输入框变体
  size?: InputSize;            // 输入框尺寸
  state?: InputState;          // 输入框状态
  leftIcon?: React.ReactNode;  // 左侧图标
  rightIcon?: React.ReactNode; // 右侧图标
  leftAddon?: React.ReactNode; // 左侧附加内容
  rightAddon?: React.ReactNode; // 右侧附加内容
  fullWidth?: boolean;         // 全宽输入框
  rounded?: boolean;           // 圆角输入框
  clearable?: boolean;         // 可清除内容
  showPasswordToggle?: boolean; // 显示密码切换（仅password类型）
  onClear?: () => void;        // 清除回调
  containerClassName?: string; // 容器类名
}

export interface TextAreaGroupProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  fullWidth?: boolean;
  rounded?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  containerClassName?: string;
}

// ================================================================================
// 样式配置
// ================================================================================

const getVariantClasses = (variant: InputVariant, state: InputState): string => {
  const baseInput = `
    bg-white/8 backdrop-filter backdrop-blur-lg
    border transition-all duration-200 ease-out
    text-white placeholder-white/50
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
  `;

  const variants = {
    default: `
      ${baseInput}
      border-white/10 focus:border-blue-400/70 focus:ring-blue-400/20
    `,
    filled: `
      ${baseInput}
      bg-white/12 border-white/15 focus:border-blue-400/70 focus:ring-blue-400/20
    `,
    outlined: `
      ${baseInput}
      bg-transparent border-white/25 focus:border-blue-400 focus:ring-blue-400/20
    `,
    underlined: `
      ${baseInput}
      bg-transparent border-0 border-b-2 border-white/25 rounded-none
      focus:border-blue-400 focus:ring-0 focus:ring-offset-0
    `
  };

  const stateColors = {
    normal: '',
    error: variant === 'underlined' 
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
      : 'border-red-400/50 focus:border-red-400 focus:ring-red-400/30',
    success: variant === 'underlined'
      ? 'border-green-400 focus:border-green-400 focus:ring-green-400/30'
      : 'border-green-400/50 focus:border-green-400 focus:ring-green-400/30',
    warning: variant === 'underlined'
      ? 'border-orange-400 focus:border-orange-400 focus:ring-orange-400/30'
      : 'border-orange-400/50 focus:border-orange-400 focus:ring-orange-400/30',
    disabled: 'opacity-50 cursor-not-allowed'
  };

  return `${variants[variant]} ${stateColors[state]}`.replace(/\s+/g, ' ').trim();
};

const getSizeClasses = (size: InputSize, variant: InputVariant): string => {
  const sizes = {
    sm: variant === 'underlined' ? 'px-0 py-1 text-sm' : 'px-4 py-2 text-sm',
    md: variant === 'underlined' ? 'px-0 py-2 text-base' : 'px-4 py-2.5 text-base', 
    lg: variant === 'underlined' ? 'px-0 py-2.5 text-lg' : 'px-5 py-3 text-lg'
  };

  const roundedSizes = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl'
  };

  return variant === 'underlined' 
    ? sizes[size] 
    : `${sizes[size]} ${roundedSizes[size]}`;
};

// ================================================================================
// 子组件
// ================================================================================

// 清除按钮
const ClearButton: React.FC<{ onClear: () => void; size: InputSize }> = memo(({ onClear, size }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      type="button"
      onClick={onClear}
      className="text-white/40 hover:text-white/70 transition-colors"
    >
      <svg className={sizeMap[size]} viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
});

// 密码显示切换按钮
const PasswordToggle: React.FC<{ 
  visible: boolean; 
  onToggle: () => void; 
  size: InputSize 
}> = memo(({ visible, onToggle, size }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-white/40 hover:text-white/70 transition-colors"
    >
      {visible ? (
        <svg className={sizeMap[size]} viewBox="0 0 24 24" fill="none">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" stroke="currentColor" strokeWidth="2"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" stroke="currentColor" strokeWidth="2"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" stroke="currentColor" strokeWidth="2"/>
          <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ) : (
        <svg className={sizeMap[size]} viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )}
    </button>
  );
});

// ================================================================================
// 主组件
// ================================================================================

export const InputGroup = memo(forwardRef<HTMLInputElement, InputGroupProps>(({
  label,
  helperText,
  errorText,
  variant = 'default',
  size = 'md',
  state = 'normal',
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  fullWidth = false,
  rounded = false,
  clearable = false,
  showPasswordToggle = false,
  onClear,
  containerClassName = '',
  className = '',
  disabled,
  type = 'text',
  value,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // 确定最终状态
  const finalState = disabled ? 'disabled' : errorText ? 'error' : state;
  const finalType = (type === 'password' && showPassword) ? 'text' : type;

  // 处理密码切换
  const handlePasswordToggle = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  // 处理清除
  const handleClear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  // 构建类名
  const inputClasses = `
    ${getVariantClasses(variant, finalState)}
    ${getSizeClasses(size, variant)}
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-full' : ''}
    ${leftIcon || leftAddon ? 'pl-10' : ''}
    ${rightIcon || rightAddon || clearable || (type === 'password' && showPasswordToggle) ? 'pr-10' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const containerClasses = `
    ${fullWidth ? 'w-full' : 'inline-block'}
    ${containerClassName}
  `.replace(/\s+/g, ' ').trim();

  // 确定是否显示清除按钮
  const showClear = clearable && value && String(value).length > 0;

  return (
    <div className={containerClasses}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-white/80 mb-2"
        >
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative">
        {/* 左侧附加内容 */}
        {leftAddon && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center">
            {leftAddon}
          </div>
        )}

        {/* 左侧图标 */}
        {leftIcon && !leftAddon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">
            {leftIcon}
          </div>
        )}

        {/* 输入框 */}
        <input
          ref={ref}
          type={finalType}
          value={value}
          disabled={disabled}
          className={inputClasses}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* 右侧内容 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* 清除按钮 */}
          {showClear && (
            <ClearButton onClear={handleClear} size={size} />
          )}

          {/* 密码切换按钮 */}
          {type === 'password' && showPasswordToggle && (
            <PasswordToggle 
              visible={showPassword} 
              onToggle={handlePasswordToggle} 
              size={size} 
            />
          )}

          {/* 右侧图标 */}
          {rightIcon && (
            <div className="text-white/40">
              {rightIcon}
            </div>
          )}
        </div>

        {/* 右侧附加内容 */}
        {rightAddon && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center">
            {rightAddon}
          </div>
        )}
      </div>

      {/* 帮助文本和错误文本 */}
      {(helperText || errorText) && (
        <div className="mt-2">
          {errorText ? (
            <p className="text-sm text-red-400">{errorText}</p>
          ) : helperText ? (
            <p className="text-sm text-white/60">{helperText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}));

// TextArea 组件
export const TextAreaGroup = memo(forwardRef<HTMLTextAreaElement, TextAreaGroupProps>(({
  label,
  helperText,
  errorText,
  variant = 'default',
  size = 'md',
  state = 'normal',
  fullWidth = false,
  rounded = false,
  resize = 'vertical',
  autoResize = false,
  containerClassName = '',
  className = '',
  disabled,
  rows = 4,
  value,
  onChange,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  // 确定最终状态
  const finalState = disabled ? 'disabled' : errorText ? 'error' : state;

  // 自动调整高度
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  }, [onChange, autoResize]);

  // 构建类名
  const textareaClasses = `
    ${getVariantClasses(variant, finalState)}
    ${getSizeClasses(size, variant)}
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-2xl' : ''}
    ${resize === 'none' ? 'resize-none' : resize === 'vertical' ? 'resize-y' : resize === 'horizontal' ? 'resize-x' : 'resize'}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const containerClasses = `
    ${fullWidth ? 'w-full' : 'inline-block'}
    ${containerClassName}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={containerClasses}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-white/80 mb-2"
        >
          {label}
        </label>
      )}

      {/* 文本域 */}
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        disabled={disabled}
        className={textareaClasses}
        onChange={handleChange}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />

      {/* 帮助文本和错误文本 */}
      {(helperText || errorText) && (
        <div className="mt-2">
          {errorText ? (
            <p className="text-sm text-red-400">{errorText}</p>
          ) : helperText ? (
            <p className="text-sm text-white/60">{helperText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}));

InputGroup.displayName = 'InputGroup';
TextAreaGroup.displayName = 'TextAreaGroup';