/**
 * ============================================================================
 * 应用模块 (AppModule.tsx) - 主应用的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理主应用相关的所有业务逻辑
 * - 管理应用状态和侧边栏状态
 * - 协调ChatModule、SessionModule、UserModule等子模块
 * - 处理应用触发逻辑和Widget管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 应用业务逻辑的统一管理
 *   - 子模块的协调和集成
 *   - 应用触发词检测和处理
 *   - Widget状态管理
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由AppLayout处理）
 *   - 组件的直接渲染（由components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * app.tsx → AppModule → AppLayout → 子模块和组件
 * hooks → AppModule → 事件回调 → stores → api/services
 */

import React, { useCallback, useMemo } from 'react';
import { AppLayout, AppLayoutProps } from '../components/AppLayout';
import { ChatModule } from './ChatModule';
import { SessionModule } from './SessionModule';
import { UserModule } from './UserModule';
import { RightSidebarLayout } from '../components/ui/chat/RightSidebarLayout';

// Business logic hooks
import { useChat } from '../hooks/useChat';
import { useArtifactLogic } from './ArtifactModule';
import { useAppStore } from '../stores/useAppStore';
import { widgetHandler } from '../components/core/WidgetHandler';
import { logger, LogCategory } from '../utils/logger';
import { AppId } from '../types/appTypes';

// Available apps configuration
const AVAILABLE_APPS = [
  { id: 'dream', name: 'DreamForge AI', triggers: ['create image', 'generate image', 'make picture', 'draw'] },
  { id: 'hunt', name: 'HuntAI', triggers: ['search product', 'find item', 'compare prices', 'shop'] },
  { id: 'omni', name: 'Omni Content', triggers: ['generate content', 'create text', 'write', 'compose'] },
  { id: 'assistant', name: 'AI Assistant', triggers: ['help', 'assist', 'question', 'ask'] },
  { id: 'data-scientist', name: 'DataWise Analytics', triggers: ['analyze data', 'create chart', 'statistics'] },
  { id: 'knowledge', name: 'Knowledge Hub', triggers: ['analyze document', 'summarize', 'extract'] }
];

interface AppModuleProps extends Omit<AppLayoutProps, 'children'> {
  // All AppLayout props except children that we'll provide from business logic
}

/**
 * App Module - Business logic module for main application
 * 
 * This module:
 * - Coordinates all business logic across the app
 * - Manages app state and widget triggers
 * - Provides data and callbacks to pure UI components
 * - Keeps AppLayout as pure UI component
 */
export const AppModule: React.FC<AppModuleProps> = (props) => {
  // Business logic hooks
  const chatInterface = useChat();
  const artifactLogic = useArtifactLogic();
  
  // App state management
  const {
    currentApp,
    showRightSidebar,
    triggeredAppInput,
    setCurrentApp,
    setShowRightSidebar,
    setTriggeredAppInput
  } = useAppStore();

  // Reduced logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🏗️ APP_MODULE: Providing data to AppLayout', {
      messagesCount: chatInterface.messages.length,
      currentApp,
      showRightSidebar,
      availableAppsCount: AVAILABLE_APPS.length
    });
  }

  // Note: Widget trigger logic is now handled in useChatStore reactive subscriber

  // Business logic: Handle file selection
  const handleFileSelect = useCallback((files: FileList) => {
    logger.info(LogCategory.USER_INPUT, 'Files selected', { 
      fileCount: files.length,
      fileNames: Array.from(files).map(f => f.name)
    });
    console.log('📎 APP_MODULE: Files selected:', files);
    
    if (files.length > 0) {
      const fileMessage = `Analyze ${files.length} document${files.length > 1 ? 's' : ''}: ${Array.from(files).map(f => f.name).join(', ')}`;
      setTimeout(() => {
        setCurrentApp('knowledge' as AppId);
        setShowRightSidebar(true);
        setTriggeredAppInput(fileMessage);
        logger.info(LogCategory.APP_TRIGGER, 'Opened knowledge app for files', { fileCount: files.length });
        console.log('🧠 APP_MODULE: Opened knowledge app for files');
      }, 500);
    }
  }, [setCurrentApp, setShowRightSidebar, setTriggeredAppInput]);

  // Business logic: Widget management callbacks
  const handleDreamGeneration = useCallback(async (params: any) => {
    console.log('🎨 APP_MODULE: Dream generation requested via WidgetHandler');
    await widgetHandler.processRequest({
      type: 'dream',
      params,
      sessionId: 'dream_widget',
      userId: 'app_user'
    });
  }, []);
  
  const handleHuntSearch = useCallback(async (params: any) => {
    console.log('🔍 APP_MODULE: Hunt search requested via WidgetHandler');
    await widgetHandler.processRequest({
      type: 'hunt',
      params,
      sessionId: 'hunt_widget', 
      userId: 'app_user'
    });
  }, []);

  // Business logic: App management callbacks
  const handleCloseApp = useCallback(() => {
    setShowRightSidebar(false);
    setCurrentApp(null);
    setTriggeredAppInput('');
    logger.info(LogCategory.APP_TRIGGER, 'App closed', { previousApp: currentApp });
  }, [setShowRightSidebar, setCurrentApp, setTriggeredAppInput, currentApp]);

  const handleAppSelect = useCallback((appId: string) => {
    setCurrentApp(appId as AppId);
    setShowRightSidebar(true);
    logger.info(LogCategory.APP_TRIGGER, 'App selected from sidebar', { appId });
  }, [setCurrentApp, setShowRightSidebar]);

  const handleToggleSidebar = useCallback(() => {
    setShowRightSidebar(!showRightSidebar);
    logger.info(LogCategory.APP_TRIGGER, 'Sidebar toggled', { newState: !showRightSidebar });
  }, [showRightSidebar, setShowRightSidebar]);

  // Prepare data for pure UI component
  const appLayoutData = useMemo(() => ({
    // App state
    currentApp,
    showRightSidebar,
    triggeredAppInput,
    availableApps: AVAILABLE_APPS.map(app => ({ ...app, icon: '🚀' })),
    
    // App management callbacks
    onCloseApp: handleCloseApp,
    onAppSelect: handleAppSelect,
    onToggleSidebar: handleToggleSidebar,
    
    // File handling
    onFileSelect: handleFileSelect,
    
    // Widget callbacks (for direct widget operations)
    onDreamGeneration: handleDreamGeneration,
    onHuntSearch: handleHuntSearch,
    
    // Artifact data (if needed)
    artifacts: chatInterface.artifacts
  }), [
    currentApp,
    showRightSidebar,
    triggeredAppInput,
    handleCloseApp,
    handleAppSelect,
    handleToggleSidebar,
    handleFileSelect,
    handleDreamGeneration,
    handleHuntSearch,
    chatInterface.artifacts
  ]);

  // Render children as render props pattern with business logic data
  return (
    <AppLayout {...props}>
      {() => ({
        // Simplified Chat with pure module integration
        chatModule: (
          <ChatModule
            showHeader={false}
            showSidebar={true}
            showRightSidebar={showRightSidebar}
            sidebarPosition="left"
            sidebarWidth="300px"
            rightSidebarWidth="50%"
            className="w-full h-full"
            
            // Handle file selection
            inputProps={{
              onFileSelect: handleFileSelect
            }}
            
            // Left Sidebar - Session Management
            sidebarContent={
              <SessionModule sidebarWidth="300px" />
            }
            
            // Right Sidebar - Widget Management
            rightSidebarContent={
              <RightSidebarLayout
                currentApp={currentApp}
                showRightSidebar={showRightSidebar}
                triggeredAppInput={triggeredAppInput}
                onCloseApp={handleCloseApp}
                onAppSelect={handleAppSelect}
              />
            }
          />
        ),
        
        // Session Module (already integrated in chatModule sidebar)
        sessionModule: null,
        
        // User Module (already provided in app.tsx)
        userModule: null,
        
        // App data for layout
        appData: appLayoutData
      })}
    </AppLayout>
  );
};