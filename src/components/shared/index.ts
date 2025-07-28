/**
 * ============================================================================
 * Shared Components Index - 统一导出
 * ============================================================================ 
 */

// 内容渲染组件
export { 
  ContentRenderer,
  type ContentRendererProps,
  type ContentType,
  type ContentVariant,
  type ContentSize,
  type ContentFeatures
} from './content/ContentRenderer';

// 状态渲染组件
export {
  StatusRenderer,
  type StatusRendererProps,
  type StatusType,
  type StatusVariant,
  type StatusSize
} from './ui/StatusRenderer';

// 按钮组件
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  IconButton,
  LinkButton,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonState
} from './ui/Button';

// 输入组件
export {
  InputGroup,
  TextAreaGroup,
  type InputGroupProps,
  type TextAreaGroupProps,
  type InputVariant,
  type InputSize,
  type InputState
} from './ui/InputGroup';

// 弹窗组件
export {
  Modal,
  ConfirmModal,
  ImageModal,
  modal,
  type ModalProps,
  type ConfirmModalProps,
  type ModalSize,
  type ModalVariant
} from './ui/Modal';

// 通知组件
export {
  ToastProvider,
  ToastContainer,
  useToast,
  toast,
  type ToastProps,
  type ToastType,
  type ToastPosition,
  type ToastContextValue,
  type ToastContainerProps
} from './ui/Toast';

// Widget 组件
export {
  Dropdown,
  useDropdown,
  FloatingAIActions,
  ContentEditingAIActions,
  TextProcessingAIActions,
  CompactFloatingAIActions,
  ScrollFollowUpActions,
  DocumentEditingActions,
  ContentReadingActions,
  MinimalScrollActions,
  useScrollTrigger,
  type DropdownOption,
  type DropdownProps,
  type AIAction,
  type FloatingAIActionsProps,
  type QuickAction,
  type ScrollFollowUpActionsProps
} from './widgets';