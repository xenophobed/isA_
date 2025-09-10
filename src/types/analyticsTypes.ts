// 用户行为事件类型定义
export interface UserBehaviorEvent {
  event: string;
  properties?: Record<string, any>;
  context?: EventContext;
}

export interface EventContext {
  sessionId?: string;
  userId?: string;
  anonymousId?: string;
  timestamp: string;
  page?: PageContext;
  device?: DeviceContext;
  location?: LocationContext;
}

export interface PageContext {
  url: string;
  path: string;
  title: string;
  referrer?: string;
  search?: string;
}

export interface DeviceContext {
  userAgent: string;
  language: string;
  screen: {
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
  };
}

export interface LocationContext {
  country?: string;
  region?: string;
  city?: string;
  timezone: string;
}

// 预定义的事件名称
export enum AnalyticsEvents {
  // 页面事件
  PAGE_VIEW = 'Page Viewed',
  PAGE_EXIT = 'Page Exited',
  
  // 用户认证事件
  USER_SIGNED_UP = 'User Signed Up',
  USER_LOGGED_IN = 'User Logged In',
  USER_LOGGED_OUT = 'User Logged Out',
  
  // 聊天相关事件
  CHAT_MESSAGE_SENT = 'Chat Message Sent',
  CHAT_MESSAGE_RECEIVED = 'Chat Message Received',
  CHAT_SESSION_STARTED = 'Chat Session Started',
  CHAT_SESSION_ENDED = 'Chat Session Ended',
  
  // Widget 交互事件
  WIDGET_OPENED = 'Widget Opened',
  WIDGET_CLOSED = 'Widget Closed',
  WIDGET_INTERACTION = 'Widget Interaction',
  WIDGET_TASK_STARTED = 'Widget Task Started',
  WIDGET_TASK_COMPLETED = 'Widget Task Completed',
  
  // 文件操作事件
  FILE_UPLOADED = 'File Uploaded',
  FILE_DOWNLOADED = 'File Downloaded',
  FILE_DELETED = 'File Deleted',
  
  // 搜索事件
  SEARCH_PERFORMED = 'Search Performed',
  SEARCH_RESULT_CLICKED = 'Search Result Clicked',
  
  // 错误事件
  ERROR_OCCURRED = 'Error Occurred',
  API_ERROR = 'API Error',
  
  // 性能事件
  PAGE_LOAD_TIME = 'Page Load Time',
  API_RESPONSE_TIME = 'API Response Time',
  
  // 功能使用事件
  FEATURE_USED = 'Feature Used',
  BUTTON_CLICKED = 'Button Clicked',
  FORM_SUBMITTED = 'Form Submitted',
  
  // 业务事件
  TASK_CREATED = 'Task Created',
  TASK_COMPLETED = 'Task Completed',
  TASK_CANCELLED = 'Task Cancelled',
}

// 事件属性接口
export interface PageViewProperties {
  page_name?: string;
  page_category?: string;
  previous_page?: string;
  load_time?: number;
}

export interface UserAuthProperties {
  method?: 'email' | 'social' | 'sso';
  provider?: string;
  user_type?: 'free' | 'premium' | 'enterprise';
}

export interface ChatProperties {
  message_length?: number;
  message_type?: 'text' | 'file' | 'image';
  session_id?: string;
  widget_type?: string;
  response_time?: number;
}

export interface WidgetProperties {
  widget_type: string;
  widget_id?: string;
  action?: string;
  interaction_type?: 'click' | 'hover' | 'keyboard' | 'voice';
  duration?: number;
}

export interface FileProperties {
  file_type?: string;
  file_size?: number;
  file_name?: string;
  upload_duration?: number;
}

export interface SearchProperties {
  query?: string;
  results_count?: number;
  search_type?: 'text' | 'voice' | 'image';
  response_time?: number;
}

export interface ErrorProperties {
  error_type?: string;
  error_message?: string;
  error_code?: string;
  stack_trace?: string;
  context?: Record<string, any>;
}

export interface PerformanceProperties {
  duration: number;
  endpoint?: string;
  method?: string;
  status_code?: number;
}

export interface FeatureProperties {
  feature_name: string;
  feature_category?: string;
  user_type?: string;
  experiment_variant?: string;
}

export interface TaskProperties {
  task_id?: string;
  task_type?: string;
  task_category?: string;
  duration?: number;
  success?: boolean;
  error_reason?: string;
}