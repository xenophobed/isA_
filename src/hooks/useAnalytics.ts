import { useCallback, useEffect } from 'react';
import { useAnalytics as useAnalyticsContext } from '@/providers/AnalyticsProvider';
import { 
  AnalyticsEvents,
  PageViewProperties,
  UserAuthProperties,
  ChatProperties,
  WidgetProperties,
  FileProperties,
  SearchProperties,
  ErrorProperties,
  PerformanceProperties,
  TaskProperties
} from '@/types/analyticsTypes';
import {
  enrichEventProperties,
  createErrorEvent,
  createPerformanceEvent,
  createChatEvent,
  createWidgetEvent,
  createTaskEvent,
  getPageLoadTime,
  debounceEvent,
  throttleEvent
} from '@/utils/analyticsHelpers';

interface UseAnalyticsReturn {
  // 基础方法
  track: (event: string, properties?: Record<string, any>) => void;
  page: (name?: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  
  // 专用事件追踪方法
  trackPageView: (properties?: PageViewProperties) => void;
  trackUserAuth: (action: 'login' | 'logout' | 'signup', properties?: UserAuthProperties) => void;
  trackChatMessage: (type: 'sent' | 'received', content: string, properties?: ChatProperties) => void;
  trackWidgetInteraction: (widgetType: string, action: string, properties?: WidgetProperties) => void;
  trackFileOperation: (operation: 'upload' | 'download' | 'delete', properties?: FileProperties) => void;
  trackSearch: (query: string, properties?: SearchProperties) => void;
  trackError: (error: Error | string, context?: Record<string, any>) => void;
  trackPerformance: (name: string, startTime: number, endTime?: number, properties?: PerformanceProperties) => void;
  trackTask: (taskType: string, action: 'start' | 'complete' | 'cancel', properties?: TaskProperties) => void;
  
  // 营销相关追踪方法
  trackMarketingPageView: (pageName: string, properties?: Record<string, any>) => void;
  trackCTAClick: (ctaName: string, location: string, properties?: Record<string, any>) => void;
  trackPricingPlanSelected: (planId: string, planName: string, price: number, properties?: Record<string, any>) => void;
  trackSignupIntent: (trigger: string, properties?: Record<string, any>) => void;
  trackMarketingConversion: (userId: string, registrationMethod: string, properties?: Record<string, any>) => void;
  trackContentEngagement: (contentType: string, contentName: string, action: string, properties?: Record<string, any>) => void;
  trackSocialShare: (platform: string, contentType: string, properties?: Record<string, any>) => void;
  
  // 工具方法
  startPerformanceTimer: (name: string) => () => void;
  isReady: boolean;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { analytics: analyticsService, track, page, identify, isReady } = useAnalyticsContext();

  // 页面浏览追踪
  const trackPageView = useCallback((properties?: PageViewProperties) => {
    if (!isReady) return;
    
    const loadTime = getPageLoadTime();
    const enrichedProps = enrichEventProperties({
      ...properties,
      ...(loadTime > 0 && { load_time: loadTime })
    });
    
    page(properties?.page_name, enrichedProps);
  }, [page, isReady]);

  // 用户认证追踪
  const trackUserAuth = useCallback((
    action: 'login' | 'logout' | 'signup',
    properties?: UserAuthProperties
  ) => {
    if (!isReady) return;
    
    const eventMap = {
      login: AnalyticsEvents.USER_LOGGED_IN,
      logout: AnalyticsEvents.USER_LOGGED_OUT,
      signup: AnalyticsEvents.USER_SIGNED_UP
    };
    
    track(eventMap[action], enrichEventProperties(properties));
  }, [track, isReady]);

  // 聊天消息追踪
  const trackChatMessage = useCallback((
    type: 'sent' | 'received',
    content: string,
    properties?: ChatProperties
  ) => {
    if (!isReady) return;
    
    const eventName = type === 'sent' 
      ? AnalyticsEvents.CHAT_MESSAGE_SENT 
      : AnalyticsEvents.CHAT_MESSAGE_RECEIVED;
    
    const chatProps = createChatEvent(type, content, properties);
    track(eventName, enrichEventProperties(chatProps));
  }, [track, isReady]);

  // Widget 交互追踪
  const trackWidgetInteraction = useCallback((
    widgetType: string,
    action: string,
    properties?: WidgetProperties
  ) => {
    if (!isReady) return;
    
    const widgetProps = createWidgetEvent(widgetType, action, properties);
    const eventName = action === 'open' 
      ? AnalyticsEvents.WIDGET_OPENED 
      : action === 'close'
      ? AnalyticsEvents.WIDGET_CLOSED
      : AnalyticsEvents.WIDGET_INTERACTION;
    
    track(eventName, enrichEventProperties(widgetProps));
  }, [track, isReady]);

  // 文件操作追踪
  const trackFileOperation = useCallback((
    operation: 'upload' | 'download' | 'delete',
    properties?: FileProperties
  ) => {
    if (!isReady) return;
    
    const eventMap = {
      upload: AnalyticsEvents.FILE_UPLOADED,
      download: AnalyticsEvents.FILE_DOWNLOADED,
      delete: AnalyticsEvents.FILE_DELETED
    };
    
    track(eventMap[operation], enrichEventProperties(properties));
  }, [track, isReady]);

  // 搜索追踪
  const trackSearch = useCallback((
    query: string,
    properties?: SearchProperties
  ) => {
    if (!isReady) return;
    
    track(AnalyticsEvents.SEARCH_PERFORMED, enrichEventProperties({
      ...properties,
      query
    }));
  }, [track, isReady]);

  // 错误追踪
  const trackError = useCallback((
    error: Error | string,
    context?: Record<string, any>
  ) => {
    if (!isReady) return;
    
    const errorProps = createErrorEvent(error, context);
    track(AnalyticsEvents.ERROR_OCCURRED, enrichEventProperties(errorProps));
  }, [track, isReady]);

  // 性能追踪
  const trackPerformance = useCallback((
    name: string,
    startTime: number,
    endTime?: number,
    properties?: PerformanceProperties
  ) => {
    if (!isReady) return;
    
    const performanceProps = createPerformanceEvent(startTime, endTime, properties);
    track(AnalyticsEvents.API_RESPONSE_TIME, enrichEventProperties({
      ...performanceProps,
      performance_name: name
    }));
  }, [track, isReady]);

  // 任务追踪
  const trackTask = useCallback((
    taskType: string,
    action: 'start' | 'complete' | 'cancel',
    properties?: TaskProperties
  ) => {
    if (!isReady) return;
    
    const eventMap = {
      start: AnalyticsEvents.TASK_CREATED,
      complete: AnalyticsEvents.TASK_COMPLETED,
      cancel: AnalyticsEvents.TASK_CANCELLED
    };
    
    const taskProps = createTaskEvent(taskType, action === 'complete', properties);
    track(eventMap[action], enrichEventProperties(taskProps));
  }, [track, isReady]);

  // 性能计时器
  const startPerformanceTimer = useCallback((name: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      trackPerformance(name, startTime, endTime);
    };
  }, [trackPerformance]);

  // =====================================================
  // 营销相关追踪方法
  // =====================================================

  // 营销页面浏览追踪
  const trackMarketingPageView = useCallback((
    pageName: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackMarketingPageView(pageName, properties);
  }, [analyticsService, isReady]);

  // CTA 点击追踪
  const trackCTAClick = useCallback((
    ctaName: string,
    location: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackCTAClick(ctaName, location, properties);
  }, [analyticsService, isReady]);

  // 定价计划选择追踪
  const trackPricingPlanSelected = useCallback((
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackPricingPlanSelected(planId, planName, price, properties);
  }, [analyticsService, isReady]);

  // 注册意图追踪
  const trackSignupIntent = useCallback((
    trigger: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackSignupIntent(trigger, properties);
  }, [analyticsService, isReady]);

  // 营销转化追踪
  const trackMarketingConversion = useCallback((
    userId: string,
    registrationMethod: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackMarketingConversion(userId, registrationMethod, properties);
  }, [analyticsService, isReady]);

  // 内容互动追踪
  const trackContentEngagement = useCallback((
    contentType: string,
    contentName: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackContentEngagement(contentType, contentName, action, properties);
  }, [analyticsService, isReady]);

  // 社交分享追踪
  const trackSocialShare = useCallback((
    platform: string,
    contentType: string,
    properties?: Record<string, any>
  ) => {
    if (!isReady || !analyticsService) return;
    
    analyticsService.trackSocialShare(platform, contentType, properties);
  }, [analyticsService, isReady]);

  // 页面加载时自动追踪页面浏览
  useEffect(() => {
    if (isReady) {
      trackPageView();
    }
  }, [isReady, trackPageView]);

  // 页面卸载时追踪页面退出
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReady) {
        track(AnalyticsEvents.PAGE_EXIT, enrichEventProperties());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [track, isReady]);

  // 错误监听
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  return {
    track: useCallback((event: string, properties?: Record<string, any>) => {
      if (isReady) {
        track(event, enrichEventProperties(properties));
      }
    }, [track, isReady]),
    page,
    identify,
    trackPageView,
    trackUserAuth,
    trackChatMessage,
    trackWidgetInteraction,
    trackFileOperation,
    trackSearch,
    trackError,
    trackPerformance,
    trackTask,
    // 营销相关方法
    trackMarketingPageView,
    trackCTAClick,
    trackPricingPlanSelected,
    trackSignupIntent,
    trackMarketingConversion,
    trackContentEngagement,
    trackSocialShare,
    startPerformanceTimer,
    isReady
  };
}