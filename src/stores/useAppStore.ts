/**
 * ============================================================================
 * 主应用状态管理 (useAppStore.ts) - 专注于主应用导航和全局UI状态
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理主应用的导航状态（当前小部件、侧边栏显示）
 * - 处理全局UI状态（加载、错误、模态框等）
 * - 管理应用级别的配置和设置
 * - 协调各个功能模块的交互
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 当前活跃小部件的导航
 *   - 侧边栏显示状态管理
 *   - 全局加载和错误状态
 *   - 应用级UI状态（模态框、仪表板等）
 *   - 小部件触发输入管理
 *   - 新聊天会话控制
 * 
 * ❌ 不负责：
 *   - 聊天消息管理（由useChatStore处理）
 *   - 会话管理（由useSessionStore处理）
 *   - 工件管理（由useArtifactStore处理）
 *   - 小部件特定状态（由useWidgetStores处理）
 *   - 流式消息处理（由useChatStore处理）
 * 
 * 【架构定位】
 * 这是应用的"交通控制中心"，负责协调各个专门的store，
 * 但不直接管理具体的业务数据。
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppId } from '../types/appTypes';
import { logger, LogCategory } from '../utils/logger';

export interface AppState {
  // 主应用导航
  currentApp: AppId | null;
  showRightSidebar: boolean;
  
  // 小部件交互
  triggeredAppInput: string;
  
  // 全局UI状态
  showLoggingDashboard: boolean;
  chatKey: number;
  
  // 全局加载和错误状态
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  // 应用导航
  setCurrentApp: (app: AppId | null) => void;
  setShowRightSidebar: (show: boolean) => void;
  closeApp: () => void;
  reopenApp: (artifactId: string) => void;
  
  // 小部件交互
  setTriggeredAppInput: (input: string) => void;
  
  // 聊天控制
  startNewChat: () => void;
  
  // UI状态
  setShowLoggingDashboard: (show: boolean) => void;
  
  // 全局状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    currentApp: null,
    showRightSidebar: false,
    triggeredAppInput: '',
    showLoggingDashboard: false,
    chatKey: 0,
    isLoading: false,
    error: null,
    
    // 应用导航
    setCurrentApp: (app) => {
      const oldApp = get().currentApp;
      logger.trackStateChange('currentApp', oldApp, app, 'useAppStore');
      set({ currentApp: app });
    },
    
    setShowRightSidebar: (show) => {
      const oldValue = get().showRightSidebar;
      const currentApp = get().currentApp;
      logger.trackStateChange('showRightSidebar', oldValue, show, 'useAppStore');
      logger.trackSidebarInteraction(show ? 'opened' : 'closed', currentApp || undefined);
      set({ showRightSidebar: show });
    },
    
    closeApp: () => {
      const currentApp = get().currentApp;
      logger.info(LogCategory.SIDEBAR_INTERACTION, 'Closing app', { currentApp });
      
      set({
        showRightSidebar: false,
        currentApp: null,
        triggeredAppInput: ''
      });
      
      // 关闭所有工件 - 通过工件store处理
      const { closeAllArtifacts } = require('./useArtifactStore').useArtifactStore.getState();
      closeAllArtifacts();
    },
    
    reopenApp: (artifactId) => {
      // 从工件store获取工件信息
      const { useArtifacts } = require('./useArtifactStore');
      const artifacts = useArtifacts.getState ? useArtifacts.getState() : [];
      const artifact = artifacts.find((a: any) => a.id === artifactId);
      
      if (!artifact) return;

      logger.info(LogCategory.SIDEBAR_INTERACTION, 'Reopening app from artifact', { 
        artifactId, 
        appId: artifact.appId,
        appName: artifact.appName
      });

      set({
        currentApp: artifact.appId as AppId,
        showRightSidebar: true,
        triggeredAppInput: artifact.userInput
      });
      
      // 打开特定工件 - 通过工件store处理
      const { openArtifact } = require('./useArtifactStore').useArtifactStore.getState();
      openArtifact(artifactId);
    },
    
    // 小部件交互
    setTriggeredAppInput: (input) => {
      const oldValue = get().triggeredAppInput;
      const currentApp = get().currentApp;
      logger.trackStateChange('triggeredAppInput', oldValue, input, 'useAppStore');
      if (input) {
        logger.trackUserInput(input, { source: 'app_trigger', currentApp });
      }
      set({ triggeredAppInput: input });
    },
    
    // 聊天控制
    startNewChat: () => {
      logger.info(LogCategory.CHAT_FLOW, 'Starting new chat session');
      set((state) => ({
        chatKey: state.chatKey + 1,
        currentApp: null,
        showRightSidebar: false,
        triggeredAppInput: '',
        error: null
      }));
    },
    
    // UI状态
    setShowLoggingDashboard: (show) => {
      logger.trackSidebarInteraction(show ? 'logging_dashboard_opened' : 'logging_dashboard_closed');
      set({ showLoggingDashboard: show });
    },
    
    // 全局状态
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setError: (error) => {
      set({ error });
      if (error) {
        logger.error(LogCategory.STATE_CHANGE, 'App error set', { error });
      }
    },
    
    clearError: () => {
      set({ error: null });
    }
  }))
);

// 主应用选择器
export const useCurrentApp = () => useAppStore(state => state.currentApp);
export const useShowRightSidebar = () => useAppStore(state => state.showRightSidebar);
export const useTriggeredAppInput = () => useAppStore(state => state.triggeredAppInput);
export const useAppLoading = () => useAppStore(state => state.isLoading);
export const useAppError = () => useAppStore(state => state.error);
export const useShowLoggingDashboard = () => useAppStore(state => state.showLoggingDashboard);
export const useChatKey = () => useAppStore(state => state.chatKey);

// 主应用操作
export const useAppActions = () => useAppStore(state => ({
  setCurrentApp: state.setCurrentApp,
  setShowRightSidebar: state.setShowRightSidebar,
  closeApp: state.closeApp,
  reopenApp: state.reopenApp,
  setTriggeredAppInput: state.setTriggeredAppInput,
  startNewChat: state.startNewChat,
  setShowLoggingDashboard: state.setShowLoggingDashboard,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError
}));