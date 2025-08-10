/**
 * ============================================================================
 * 主应用程序入口文件 (main_app.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 应用程序的根组件，整合所有主要功能模块
 * - 管理全局状态（当前应用、侧边栏状态、聊天消息等）
 * - 提供统一的认证和AI客户端上下文
 * - 协调聊天界面、应用侧边栏、会话管理等核心功能
 * 
 * 【架构设计】
 * - 使用Provider模式提供Auth0认证和SimpleAI客户端
 * - 通过Zustand进行集中状态管理
 * - 采用组件化架构，分离关注点
 * - 支持多应用集成（Dream、Hunt、Knowledge等）
 * 
 * 【关键组件】
 * - StreamingHandler: 处理AI响应的流式数据
 * - ArtifactProcessor: 处理生成的内容工件
 * - ChatInputHandler: 处理用户输入和应用触发
 * - SidebarManager: 管理应用侧边栏
 * - SessionManager: 管理聊天会话
 * 
 * 【消息流程】
 * 用户输入 → ChatInputHandler → SimpleAIClient → StreamingHandler → 消息显示
 * 
 * 【状态管理】
 * - currentApp: 当前打开的应用
 * - showRightSidebar: 右侧边栏显示状态
 * - messages: 聊天消息数组
 * - artifacts: 生成的内容工件
 */
import React, { useEffect, useState } from 'react';
import { AIProvider } from './providers/AIProvider';
import { Auth0Provider } from './providers/Auth0Provider';
import { ChatModule } from './modules/ChatModule';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppHeader } from './components/ui/AppHeader';
// Removed ArtifactModule import - now handled by MessageList
// Removed invalid imports - SidebarManager and SessionManager don't exist
// Removed StreamingHandler import - doesn't exist
import { ChatInputHandler } from './components/core/ChatInputHandler';
import { useAppStore, useAppActions } from './stores/useAppStore';
import { useCurrentTasks, useTaskProgress, useIsExecutingPlan, useChatMessages } from './stores/useChatStore';
import { useAuth } from './hooks/useAuth';
import { useAI } from './providers/AIProvider';
import { UserButton } from './components/ui/user/UserButton';
import { LoginScreen } from './components/ui/LoginScreen';
// Removed UserManagementDrawer import - doesn't exist
import { AppArtifact, AppId } from './types/appTypes';
import { logger, LogCategory } from './utils/logger';
// Removed LoggingDashboard import - doesn't exist

/**
 * Main App Content Component (inside provider)
 */
const MainAppContent: React.FC = () => {
  logger.trackComponentRender('MainApp', { timestamp: Date.now() });
  
  // Auth0 authentication state - 必须在所有条件渲染之前调用
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    auth0User: externalUser, 
    login
  } = useAuth();
  
  // App state management with Zustand - centralized
  const {
    currentApp,
    setCurrentApp,
    showRightSidebar,
    setShowRightSidebar,
    triggeredAppInput,
    setTriggeredAppInput,
    chatKey,
    showLoggingDashboard,
    setShowLoggingDashboard,
    startNewChat,
    closeApp,
    reopenApp
  } = useAppStore();

  // 用户管理抽屉状态
  const [showUserDrawer, setShowUserDrawer] = React.useState(false);
  
  // 🆕 Widget选择器状态
  const [showWidgetSelector, setShowWidgetSelector] = React.useState(false);
  
  // 🆕 右侧面板状态
  const [showRightPanel, setShowRightPanel] = React.useState(false);

  // 🆕 Real task state from useChatStore
  const currentTasks = useCurrentTasks();
  const taskProgress = useTaskProgress();
  const isExecutingPlan = useIsExecutingPlan();
  const messages = useChatMessages();

  const dreamGeneratedImage = null; // TODO: Implement dream functionality

  // Initialize component logging - 必须在条件渲染之前调用
  useEffect(() => {
    logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component mounted', { 
      isAuthenticated, 
      userId: externalUser?.user_id,
      credits: 0, // TODO: Get from UserModule
      plan: 'unknown' // TODO: Get from UserModule
    });
    return () => {
      logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component unmounted');
    };
  }, [isAuthenticated, externalUser?.user_id]);

  // 🆕 Derive streaming status from real data
  const streamingStatus = React.useMemo(() => {
    // Check if we have streaming messages
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);
    
    if (isExecutingPlan && hasStreamingMessage) {
      return 'streaming';
    } else if (isExecutingPlan) {
      return 'processing';
    } else if (currentTasks.some(task => task.status === 'completed')) {
      return 'completed';
    }
    
    return 'idle';
  }, [isExecutingPlan, messages, currentTasks]);

  // 🆕 Create mock lastSSEEvent from real task data for TaskStatusIndicator
  const lastSSEEvent = React.useMemo(() => {
    if (!taskProgress && currentTasks.length === 0) {
      return null;
    }

    // Create a synthetic SSE event from our real task data
    return {
      type: 'custom_stream',
      timestamp: new Date().toISOString(),
      content: taskProgress ? {
        type: 'progress',
        data: `[${taskProgress.toolName}] ${taskProgress.description}${taskProgress.currentStep && taskProgress.totalSteps ? ` (${taskProgress.currentStep}/${taskProgress.totalSteps})` : ''}`
      } : {
        type: 'task_list',
        tasks: currentTasks
      }
    };
  }, [taskProgress, currentTasks]);

  // TODO: Implement typing status management

  // 如果正在加载认证状态，显示加载界面
  if (authLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // New chat (now handled by Zustand)
  const handleNewChat = () => {
    logger.info(LogCategory.CHAT_FLOW, 'Starting new chat session');
    console.log('🔄 Starting new chat...');
    startNewChat();
    logger.info(LogCategory.CHAT_FLOW, 'New chat session started', { chatKey });
    console.log('✅ New chat session started');
  };

  // 🆕 Enhanced task control handlers with real task state
  const handleTaskControl = (action: 'pause_all' | 'resume_all' | 'show_details') => {
    logger.info(LogCategory.CHAT_FLOW, 'Task control action triggered', { 
      action,
      currentTasksCount: currentTasks.length,
      isExecutingPlan,
      hasTaskProgress: !!taskProgress
    });
    console.log('🎛️ Task control action:', action, {
      currentTasks: currentTasks.length,
      executing: isExecutingPlan,
      progress: taskProgress?.toolName
    });
    
    switch (action) {
      case 'pause_all':
        console.log('⏸️ Pausing all tasks');
        // 这里可以发送暂停信号给chat service
        // 或者使用useTaskActions来暂停任务
        if (isExecutingPlan) {
          console.log('  📊 Current execution:', taskProgress?.toolName || 'Processing...');
          // TODO: Implement pause logic via chat service or task handler
        }
        break;
      case 'resume_all':
        console.log('▶️ Resuming all tasks');
        // 恢复任务执行
        if (currentTasks.some(task => task.status === 'pending')) {
          console.log('  📋 Resuming', currentTasks.filter(t => t.status === 'pending').length, 'pending tasks');
          // TODO: Implement resume logic
        }
        break;
      case 'show_details':
        console.log('📋 Showing task details');
        console.log('  📊 Current Tasks:', currentTasks.map(t => `${t.title} (${t.status})`));
        console.log('  🚀 Progress:', taskProgress ? `${taskProgress.toolName}: ${taskProgress.description}` : 'No active progress');
        console.log('  🎯 Execution Plan:', isExecutingPlan ? 'Active' : 'Idle');
        // TODO: Open detailed task management UI
        break;
    }
  };

  const sidebarContent = (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1">
        {/* TODO: Implement session management UI */}
      </div>
      
      {/* User Management at Bottom */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <UserButton 
          onToggleDrawer={() => setShowUserDrawer(!showUserDrawer)}
          showDrawer={showUserDrawer}
        />
      </div>
    </div>
  );

  // App configuration
  const availableApps = [
    {
      id: 'dream',
      name: 'Dream Generator',
      description: 'AI-powered image generation',
      icon: '🎨',
      triggers: ['image', 'generate', 'create', 'picture', 'art'],
    },
    {
      id: 'hunt',
      name: 'Hunt Search',
      description: 'Product search and comparison',
      icon: '🔍',
      triggers: ['search', 'product', 'buy', 'compare', 'shop'],
    },
    {
      id: 'knowledge',
      name: 'Knowledge Hub',
      description: 'Advanced document analysis with vector and graph RAG',
      icon: '🧠',
      triggers: ['document', 'analyze', 'knowledge', 'pdf', 'file', 'graph', 'vector', 'rag'],
    },
    {
      id: 'assistant',
      name: 'AI Assistant',
      description: 'Personal AI assistant for general tasks',
      icon: '🤖',
      triggers: ['help', 'assist', 'task', 'general'],
    },
    {
      id: 'omni',
      name: 'Omni Content Generator',
      description: 'Multi-purpose content creation',
      icon: '⚡',
      triggers: ['write', 'article', 'content', 'blog', 'text'],
    },
  ];

  // Handle image generation from Dream app
  const handleDreamImageGenerated = (imageUrl: string, prompt: string) => {
    console.log('🎨 Dream image generated:', { imageUrl, prompt });
    
    // Create artifact for the generated image
    const timestamp = Date.now();
    const artifact: AppArtifact = {
      id: `artifact-${timestamp}`,
      appId: 'dream',
      appName: 'Dream Generator',
      appIcon: '🎨',
      title: 'Dream Generation Complete',
      userInput: prompt,
      createdAt: new Date(timestamp).toISOString(),
      isOpen: true,
      generatedContent: {
        type: 'image',
        content: imageUrl,
        thumbnail: imageUrl,
        metadata: {
          generatedAt: new Date(timestamp).toISOString(),
          prompt: prompt,
          messageId: `dream-${timestamp}`
        }
      }
    };
    
    // TODO: Implement artifact management
    // Note: setDreamGeneratedImage already called by Dream sidebar
    
    // Emit event to chat layer
    // client?.emit('artifact:created', artifact); // emit is private
  };

  // 🆕 新的Widget管理系统 - 不再是直接的右侧栏，而是通过弹窗和模式选择
  const legacyRightSidebarContent = (
    <div>
      {/* TODO: Implement right sidebar content */}
    </div>
  );

  // 🆕 新的头部内容，包含 SMART WIDGET 按钮
  const enhancedHeaderContent = (
    <div className="flex items-center justify-between w-full">
      <AppHeader
        currentApp={currentApp}
        availableApps={availableApps}
        onShowLogs={() => setShowLoggingDashboard(true)}
        streamingStatus={streamingStatus}
        lastSSEEvent={lastSSEEvent}
        onTaskControl={handleTaskControl}
      />
    </div>
  );

  // 📝 移到了上面的 enhancedHeaderContent

  return (
    <>
      {/* Background handlers */}
      {/* TODO: Implement streaming handler */}
      
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <ChatInputHandler>
          {({ onBeforeSend, onFileSelect }) => (
            <ChatModule
              key={chatKey}
              headerContent={enhancedHeaderContent}
              sidebarContent={sidebarContent}
              showSidebar={true}
              sidebarWidth="16.67%"
              
              // 🆕 右侧面板状态控制
              showRightPanel={showRightPanel}
              onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
              rightPanelWidth="16.67%"
              
              // Widget 系统集成（由ChatModule内部处理）
              showWidgetSelector={showWidgetSelector}
              onCloseWidgetSelector={() => setShowWidgetSelector(false)}
              
              // 旧的 rightSidebarContent 暂时保留作为 legacy 支持
              rightSidebarContent={legacyRightSidebarContent}
              rightSidebarWidth="50%"
              inputProps={{
                placeholder: "Ask me anything... I can recommend apps to help! (try: 'help me create an image' or 'organize my files')",
                multiline: true,
                maxRows: 4,
                onBeforeSend,
                onFileSelect
              }}
              conversationProps={{
                welcomeMessage: "Hello! I'm your AI assistant with SmartAgent v3.0 integration capabilities. I can recommend and open specific apps based on your needs. Try asking me to help with creating images, organizing files, or searching for products!",
                customMessageRenderer: (message: any, index: number) => {
                  logger.trackComponentRender('MessageRenderer', { 
                    messageRole: message.role,
                    messageId: message.id,
                    index,
                    currentApp,
                    showRightSidebar
                  });
                  console.log('🔍 Custom renderer called:', { role: message.role, content: message.content?.substring(0, 50) + '...', currentApp, showRightSidebar });
                  
                  return null; // ArtifactModule is now a hook, UI handled elsewhere
                }
              }}
            />
          )}
        </ChatInputHandler>
      </div>
      
      {/* TODO: Implement logging dashboard */}
      
      {/* TODO: Implement user management drawer */}
    </>
  );
};

/**
 * Main App Component with Provider Wrapper
 */
export const MainApp: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 发送错误到监控服务（生产环境）
        console.error('Global error caught:', error, errorInfo);
      }}
    >
      <Auth0Provider>
        <AIProvider apiEndpoint={process.env.REACT_APP_API_ENDPOINT || "http://localhost:8080"}>
          <MainAppContent />
        </AIProvider>
      </Auth0Provider>
    </ErrorBoundary>
  );
};