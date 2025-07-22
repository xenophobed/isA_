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
import React, { useEffect } from 'react';
import { SimpleAIProvider } from './providers/SimpleAIProvider';
import { Auth0Provider } from './providers/Auth0Provider';
import { ChatLayout } from './components/ui/chat/ChatLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppHeader } from './components/ui/AppHeader';
import { ArtifactManager } from './components/managers/artifact_manager';
import { SidebarManager } from './components/managers/sidebar_manager';
import { SessionManager } from './components/managers/SessionManager';
import { StreamingHandler } from './components/core/StreamingHandler';
import { ArtifactProcessor } from './components/core/ArtifactProcessor';
import { ChatInputHandler } from './components/core/ChatInputHandler';
import { useAppStore, useChatActions } from './stores/useAppStore';
import { useAuth } from './hooks/useAuth';
import { useSimpleAI } from './providers/SimpleAIProvider';
import { UserButton } from './components/ui/UserButton';
import { LoginScreen } from './components/ui/LoginScreen';
import { UserManagementDrawer } from './components/ui/UserManagementDrawer';
import { AppArtifact, AppId } from './types/app_types';
import { logger, LogCategory } from './utils/logger';
import { LoggingDashboard } from './components/dashboard/logging_dashboard';

/**
 * Main App Content Component (inside provider)
 */
const MainAppContent: React.FC = () => {
  logger.trackComponentRender('MainApp', { timestamp: Date.now() });
  
  // Auth0 authentication state - 必须在所有条件渲染之前调用
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user: externalUser, 
    login, 
    creditsRemaining, 
    currentPlan
  } = useAuth();
  
  // App state management with Zustand - centralized
  const {
    currentApp,
    setCurrentApp,
    showRightSidebar,
    setShowRightSidebar,
    artifacts,
    setArtifacts,
    triggeredAppInput,
    setTriggeredAppInput,
    chatKey,
    showLoggingDashboard,
    setShowLoggingDashboard,
    startNewChat,
    closeApp,
    reopenApp,
    dream
  } = useAppStore();

  // 用户管理抽屉状态
  const [showUserDrawer, setShowUserDrawer] = React.useState(false);

  const dreamGeneratedImage = dream.generatedImage;

  // Initialize component logging - 必须在条件渲染之前调用
  useEffect(() => {
    logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component mounted', { 
      isAuthenticated, 
      userId: externalUser?.user_id,
      credits: creditsRemaining,
      plan: currentPlan
    });
    return () => {
      logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component unmounted');
    };
  }, [isAuthenticated, externalUser?.user_id, creditsRemaining, currentPlan]);

  // Get SimpleAI client and chat actions  
  const { setIsTyping } = useChatActions();

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

  const sidebarContent = (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1">
        <SessionManager
          onSessionSelect={(session) => {
            console.log('📋 Session selected:', session);
          }}
          onNewSession={handleNewChat}
        />
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
    
    setArtifacts(prev => [...prev, artifact]);
    // Note: setDreamGeneratedImage already called by Dream sidebar
    
    // Emit event to chat layer
    // client?.emit('artifact:created', artifact); // emit is private
  };

  const rightSidebarContent = (
    <SidebarManager 
      currentApp={currentApp}
      showRightSidebar={showRightSidebar}
      triggeredAppInput={triggeredAppInput}
      dreamGeneratedImage={dreamGeneratedImage}
      onCloseApp={closeApp}
      onDreamImageGenerated={handleDreamImageGenerated}
      onAppSelect={(appId: string) => {
        console.log('🚀 Opening app from sidebar:', appId);
        setCurrentApp(appId as AppId);
        setTriggeredAppInput(''); // Clear any previous input
      }}
    />
  );

  const headerContent = (
    <AppHeader
      currentApp={currentApp}
      availableApps={availableApps}
      showRightSidebar={showRightSidebar}
      onToggleSidebar={() => setShowRightSidebar(!showRightSidebar)}
      onShowLogs={() => setShowLoggingDashboard(true)}
    />
  );

  return (
    <>
      {/* Background handlers */}
      <StreamingHandler 
        showRightSidebar={showRightSidebar}
        currentApp={currentApp}
      />
      <ArtifactProcessor />
      
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <ChatInputHandler availableApps={availableApps}>
          {({ onBeforeSend, onFileSelect }) => (
            <ChatLayout
              key={chatKey}
              headerContent={headerContent}
              sidebarContent={sidebarContent}
              showSidebar={true}
              rightSidebarContent={rightSidebarContent}
              showRightSidebar={showRightSidebar}
              sidebarMode="exclusive"
              sidebarWidth="16.67%"
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
                  
                  return ArtifactManager.renderMessage({
                    message,
                    artifacts,
                    reopenApp
                  });
                }
              }}
            />
          )}
        </ChatInputHandler>
      </div>
      
      <LoggingDashboard 
        isOpen={showLoggingDashboard}
        onClose={() => setShowLoggingDashboard(false)}
      />
      
      <UserManagementDrawer 
        isOpen={showUserDrawer}
        onClose={() => setShowUserDrawer(false)}
      />
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
        <SimpleAIProvider apiEndpoint={process.env.REACT_APP_API_ENDPOINT || "http://localhost:8080"}>
          <MainAppContent />
        </SimpleAIProvider>
      </Auth0Provider>
    </ErrorBoundary>
  );
};