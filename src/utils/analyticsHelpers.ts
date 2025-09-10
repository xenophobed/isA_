import { 
  AnalyticsEvents, 
  PageViewProperties, 
  ChatProperties, 
  WidgetProperties, 
  ErrorProperties,
  PerformanceProperties,
  TaskProperties 
} from '@/types/analyticsTypes';

// 获取设备信息
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: {
      width: screen.width,
      height: screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

// 获取页面信息
export function getPageInfo() {
  if (typeof window === 'undefined') return null;
  
  return {
    url: window.location.href,
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    search: window.location.search,
  };
}

// 获取用户代理信息
export function parseUserAgent(): { browser: string; os: string; device: string } {
  if (typeof navigator === 'undefined') {
    return { browser: 'unknown', os: 'unknown', device: 'unknown' };
  }
  
  const ua = navigator.userAgent;
  
  // 浏览器检测
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // 操作系统检测
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iOS')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  
  // 设备类型检测
  let device = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) device = 'mobile';
  else if (/Tablet|iPad/.test(ua)) device = 'tablet';
  
  return { browser, os, device };
}

// 计算页面加载时间
export function getPageLoadTime(): number {
  if (typeof window === 'undefined' || !window.performance) return 0;
  
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    return Math.round(navigation.loadEventEnd - navigation.fetchStart);
  }
  
  return 0;
}

// 获取会话 ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  
  return sessionId;
}

// 生成事件 ID
export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 通用事件属性增强
export function enrichEventProperties(properties: Record<string, any> = {}): Record<string, any> {
  const deviceInfo = getDeviceInfo();
  const pageInfo = getPageInfo();
  const userAgent = parseUserAgent();
  
  return {
    ...properties,
    // 时间戳
    timestamp: new Date().toISOString(),
    event_id: generateEventId(),
    session_id: getSessionId(),
    
    // 页面信息
    ...(pageInfo && {
      page_url: pageInfo.url,
      page_path: pageInfo.path,
      page_title: pageInfo.title,
      page_referrer: pageInfo.referrer,
    }),
    
    // 设备信息
    ...(deviceInfo && {
      screen_width: deviceInfo.screen.width,
      screen_height: deviceInfo.screen.height,
      viewport_width: deviceInfo.viewport.width,
      viewport_height: deviceInfo.viewport.height,
      user_language: deviceInfo.language,
    }),
    
    // 用户代理信息
    browser: userAgent.browser,
    os: userAgent.os,
    device_type: userAgent.device,
  };
}

// 错误事件辅助函数
export function createErrorEvent(error: Error | string, context?: Record<string, any>): ErrorProperties {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' && error.stack ? error.stack : undefined;
  
  return {
    error_message: errorMessage,
    error_type: typeof error === 'object' ? error.constructor.name : 'Unknown',
    stack_trace: stack,
    context: {
      ...context,
      user_agent: navigator.userAgent,
      url: window.location.href,
    },
  };
}

// 性能事件辅助函数
export function createPerformanceEvent(
  startTime: number,
  endTime?: number,
  additionalProps?: Partial<PerformanceProperties>
): PerformanceProperties {
  const duration = endTime ? endTime - startTime : performance.now() - startTime;
  
  return {
    duration: Math.round(duration),
    ...additionalProps,
  };
}

// 聊天事件辅助函数
export function createChatEvent(
  messageType: 'sent' | 'received',
  content: string,
  additionalProps?: Partial<ChatProperties>
): ChatProperties {
  return {
    message_length: content.length,
    message_type: 'text', // 默认为文本
    session_id: getSessionId(),
    ...additionalProps,
  };
}

// Widget 事件辅助函数
export function createWidgetEvent(
  widgetType: string,
  action: string,
  additionalProps?: Partial<WidgetProperties>
): WidgetProperties {
  return {
    widget_type: widgetType,
    action,
    interaction_type: 'click', // 默认为点击
    ...additionalProps,
  };
}

// 任务事件辅助函数
export function createTaskEvent(
  taskType: string,
  success?: boolean,
  additionalProps?: Partial<TaskProperties>
): TaskProperties {
  return {
    task_type: taskType,
    success,
    task_id: generateEventId(),
    ...additionalProps,
  };
}

// 防抖函数，避免重复事件
export function debounceEvent<T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 节流函数，限制事件频率
export function throttleEvent<T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let lastCall = 0;
  
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}