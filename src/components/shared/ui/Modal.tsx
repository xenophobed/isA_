/**
 * ============================================================================
 * Modal - 通用弹窗组件系统
 * ============================================================================
 * 
 * 【核心功能】
 * - 统一的弹窗样式和行为
 * - 支持多种弹窗类型和尺寸
 * - 与现有 glassmorphism 设计风格一致
 * - 可配置的动画、遮罩、关闭行为
 * 
 * 【设计原则】
 * - 可访问性：支持键盘导航和焦点管理
 * - 灵活性：支持自定义内容和操作
 * - 性能：使用Portal和懒加载
 * - 用户体验：流畅的动画和交互
 */

import React, { memo, useEffect, useRef, useCallback, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, PrimaryButton, SecondaryButton } from './Button';

// ================================================================================
// 类型定义
// ================================================================================

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type ModalVariant = 
  | 'default'        // 默认弹窗
  | 'confirmation'   // 确认弹窗
  | 'alert'          // 警告弹窗
  | 'form'           // 表单弹窗
  | 'image'          // 图片预览弹窗
  | 'drawer';        // 抽屉弹窗

export interface ModalProps {
  isOpen: boolean;                    // 是否打开
  onClose: () => void;               // 关闭回调
  title?: string;                    // 标题
  children?: React.ReactNode;        // 内容
  footer?: React.ReactNode;          // 底部内容
  size?: ModalSize;                  // 尺寸
  variant?: ModalVariant;            // 变体
  closable?: boolean;                // 是否可关闭
  maskClosable?: boolean;            // 点击遮罩关闭
  keyboard?: boolean;                // 键盘ESC关闭
  centered?: boolean;                // 垂直居中
  destroyOnClose?: boolean;          // 关闭时销毁
  zIndex?: number;                   // 层级
  className?: string;                // 自定义类名
  overlayClassName?: string;         // 遮罩类名
  bodyClassName?: string;            // 内容区域类名
  headerClassName?: string;          // 头部类名
  footerClassName?: string;          // 底部类名
  onAfterOpen?: () => void;          // 打开后回调
  onAfterClose?: () => void;         // 关闭后回调
  // Accessibility props
  'aria-label'?: string;             // ARIA label
  'aria-describedby'?: string;       // ARIA description
  'aria-labelledby'?: string;        // ARIA label reference
  initialFocus?: React.RefObject<HTMLElement>; // Initial focus element
}

export interface ConfirmModalProps {
  title?: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okButtonProps?: any;
  cancelButtonProps?: any;
  icon?: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// ================================================================================
// 样式配置
// ================================================================================

// Optimized size and variant classes using design system
const SIZE_CLASSES = {
  xs: 'max-w-xs',
  sm: 'max-w-sm', 
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full w-full h-full'
} as const;

const VARIANT_CLASSES = {
  default: '',
  confirmation: 'text-center',
  alert: 'text-center',
  form: '',
  image: 'p-0 bg-transparent border-0',
  drawer: 'h-full max-h-full rounded-none'
} as const;

const getSizeClasses = (size: ModalSize): string => SIZE_CLASSES[size];
const getVariantClasses = (variant: ModalVariant): string => VARIANT_CLASSES[variant];

// ================================================================================
// Hooks
// ================================================================================

// Enhanced focus management Hook with accessibility improvements
const useFocusTrap = (
  isOpen: boolean, 
  modalRef: React.RefObject<HTMLElement>,
  initialFocus?: React.RefObject<HTMLElement>
) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // 获取可聚焦元素 (enhanced selector)
    const getFocusableElements = () => {
      return modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable="true"]'
      ) as NodeListOf<HTMLElement>;
    };

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus initial element or first focusable element
    const elementToFocus = initialFocus?.current || firstElement;
    elementToFocus?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // If no focusable elements, prevent default
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      // Handle single focusable element
      if (focusableElements.length === 1) {
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restore focus to previous element when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, modalRef, initialFocus]);
};

// ================================================================================
// 子组件
// ================================================================================

// Optimized overlay component
const Overlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  maskClosable: boolean;
  className?: string;
  zIndex: number;
}> = memo(({ isOpen, onClose, maskClosable, className = '', zIndex }) => {
  const handleClick = useCallback(() => {
    if (maskClosable) onClose();
  }, [maskClosable, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 glass-primary backdrop-blur-sm transition-opacity duration-slow ease-out ${className}`}
      style={{ zIndex }}
      onClick={handleClick}
    />
  );
});

// Optimized close button component
const CloseButton: React.FC<{ onClose: () => void }> = memo(({ onClose }) => (
  <button
    onClick={onClose}
    className="absolute top-lg right-lg w-8 h-8 glass-secondary hover:bg-white/20 border-glass-border hover:border-glass-border-hover rounded-lg transition-all duration-normal layout-center text-white/70 hover:text-white z-10 interactive"
    aria-label="关闭弹窗"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>
));

// ================================================================================
// 主组件
// ================================================================================

export const Modal = memo(forwardRef<HTMLDivElement, ModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'default',
  closable = true,
  maskClosable = true,
  keyboard = true,
  centered = true,
  destroyOnClose = false,
  zIndex = 1000,
  className = '',
  overlayClassName = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  onAfterOpen,
  onAfterClose,
  initialFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}, ref) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Enhanced focus management with accessibility
  useFocusTrap(isOpen, modalRef, initialFocus);

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen || !keyboard) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, keyboard, onClose]);

  // 生命周期回调
  useEffect(() => {
    if (isOpen) {
      onAfterOpen?.();
    } else {
      onAfterClose?.();
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 如果关闭时销毁且未打开，不渲染
  if (!isOpen && destroyOnClose) return null;

  const modalContent = (
    <>
      {/* 遮罩层 */}
      <Overlay
        isOpen={isOpen}
        onClose={onClose}
        maskClosable={maskClosable}
        className={overlayClassName}
        zIndex={zIndex}
      />

      {/* 弹窗内容 */}
      <div
        className={`
          fixed inset-0 flex items-center justify-center p-4
          ${centered ? 'items-center' : 'items-start pt-20'}
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        style={{ zIndex: zIndex + 1 }}
      >
        <div
          ref={modalRef}
          className={`
            glass-primary backdrop-blur-lg rounded-2xl shadow-2xl
            transform transition-all duration-slow ease-out
            ${getSizeClasses(size)}
            ${getVariantClasses(variant)}
            ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-lg opacity-0 scale-95'}
            ${className}
          `}
          style={{
            boxShadow: 'var(--shadow-2xl), 0 0 40px var(--color-primary)20'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy || (title ? 'modal-title' : undefined)}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          tabIndex={-1}
        >
          {/* 关闭按钮 */}
          {closable && variant !== 'image' && (
            <CloseButton onClose={onClose} />
          )}

          {/* 头部 */}
          {title && (
            <div className={`px-2xl py-xl border-b border-glass-border ${headerClassName}`}>
              <h2 
                id="modal-title"
                className="text-lg font-semibold text-primary"
              >
                {title}
              </h2>
            </div>
          )}

          {/* 内容区域 */}
          <div className={`
            ${title ? 'px-2xl py-xl' : 'p-2xl'}
            ${footer ? 'pb-lg' : ''}
            ${bodyClassName}
          `}>
            {children}
          </div>

          {/* 底部 */}
          {footer && (
            <div className={`px-2xl py-xl border-t border-glass-border ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // 使用Portal渲染到body
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}));

// ================================================================================
// 预设弹窗组件
// ================================================================================

// 确认弹窗
export const ConfirmModal: React.FC<ModalProps & ConfirmModalProps> = ({
  title = '确认',
  content,
  okText = '确认',
  cancelText = '取消',
  onOk,
  onCancel,
  okButtonProps = {},
  cancelButtonProps = {},
  icon,
  type = 'info',
  ...modalProps
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleOk = useCallback(async () => {
    if (!onOk) return;

    try {
      setLoading(true);
      await onOk();
      modalProps.onClose();
    } catch (error) {
      console.error('确认操作失败:', error);
    } finally {
      setLoading(false);
    }
  }, [onOk, modalProps]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    modalProps.onClose();
  }, [onCancel, modalProps]);

  const getIcon = () => {
    if (icon) return icon;
    
    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    return <span className="text-2xl mb-2">{icons[type]}</span>;
  };

  return (
    <Modal
      {...modalProps}
      variant="confirmation"
      size="sm"
      footer={
        <div className="layout-center gap-lg">
          <SecondaryButton
            onClick={handleCancel}
            {...cancelButtonProps}
          >
            {cancelText}
          </SecondaryButton>
          <PrimaryButton
            onClick={handleOk}
            loading={loading}
            {...okButtonProps}
          >
            {okText}
          </PrimaryButton>
        </div>
      }
    >
      <div className="text-center">
        {getIcon()}
        <h3 className="text-lg font-medium text-primary mb-md">{title}</h3>
        {content && (
          <div className="text-secondary">
            {content}
          </div>
        )}
      </div>
    </Modal>
  );
};

// 图片预览弹窗
export const ImageModal: React.FC<ModalProps & { src: string; alt?: string }> = ({
  src,
  alt = 'Preview image',
  ...modalProps
}) => {
  return (
    <Modal
      {...modalProps}
      variant="image"
      size="full"
      closable={true}
      className="layout-center"
    >
      <div className="relative max-w-full max-h-full">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-xl animate-scale-in"
          loading="lazy"
        />
      </div>
    </Modal>
  );
};

Modal.displayName = 'Modal';
ConfirmModal.displayName = 'ConfirmModal';
ImageModal.displayName = 'ImageModal';

// ================================================================================
// 快捷方法
// ================================================================================

export const modal = {
  confirm: (props: ConfirmModalProps & { isOpen: boolean; onClose: () => void }) => (
    <ConfirmModal {...props} />
  ),
  
  info: (props: ConfirmModalProps & { isOpen: boolean; onClose: () => void }) => (
    <ConfirmModal {...props} type="info" />
  ),
  
  success: (props: ConfirmModalProps & { isOpen: boolean; onClose: () => void }) => (
    <ConfirmModal {...props} type="success" />
  ),
  
  warning: (props: ConfirmModalProps & { isOpen: boolean; onClose: () => void }) => (
    <ConfirmModal {...props} type="warning" />
  ),
  
  error: (props: ConfirmModalProps & { isOpen: boolean; onClose: () => void }) => (
    <ConfirmModal {...props} type="error" />
  )
};