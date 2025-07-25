/**
 * ============================================================================
 * 聊天输入处理器 (ChatInputHandler.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 处理用户输入并决定消息路由
 * - 检测应用触发词并自动打开相应应用
 * - 管理用户消息的添加和API调用控制
 * 
 * 【关键逻辑】
 * onBeforeSend函数的处理流程：
 * 1. 第44行：addMessage(userMessage) - 添加用户消息到聊天
 * 2. 检查是否包含应用触发词
 * 3. 如果触发应用 → 打开应用，返回null阻止聊天API调用
 * 4. 如果不触发 → 返回message，让聊天继续API调用
 * 
 * 【消息创建】
 * 第37-44行：创建用户消息并添加到store
 * 这是用户消息的唯一创建源头
 * 
 * 【重要】这里不会创建AI回复消息，只处理用户输入
 */
import React, { useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useChatActions } from '../../stores/useChatStore';
import { AppId } from '../../types/appTypes';
import { logger, LogCategory } from '../../utils/logger';

interface ChatInputHandlerProps {
  availableApps: Array<{
    id: string;
    name: string;
    triggers: string[];
  }>;
  children: (handlers: {
    onBeforeSend: (message: string) => string | null;
    onFileSelect: (files: FileList) => void;
  }) => React.ReactNode;
}

export const ChatInputHandler: React.FC<ChatInputHandlerProps> = ({
  availableApps,
  children
}) => {
  const {
    currentApp,
    showRightSidebar,
    setCurrentApp,
    setShowRightSidebar,
    setTriggeredAppInput
  } = useAppStore();
  const { addMessage } = useChatActions();

  const onBeforeSend = useCallback((message: string): string | null => {
    const traceId = logger.startTrace('USER_INPUT_PROCESSING');
    logger.trackUserInput(message, { currentApp, showRightSidebar });
    console.log('🚀 State check: Current state:', { currentApp, showRightSidebar });
    
    // Always add user message to chat first
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {}
    };
    addMessage(userMessage);
    
    // Check if message contains app trigger words
    const lowerMessage = message.toLowerCase();
    
    for (const app of availableApps) {
      const matchingTrigger = app.triggers.find(trigger => lowerMessage.includes(trigger));
      if (matchingTrigger) {
        logger.trackAppTrigger(app.id, matchingTrigger, message);
        console.log('🎯 App trigger detected!', { 
          app: app.name, 
          trigger: matchingTrigger, 
          currentApp, 
          showRightSidebar 
        });
        
        // If the app is already open, let chat send normally
        if (currentApp === app.id && showRightSidebar) {
          logger.info(LogCategory.USER_INPUT, 'App already open, chat sends to API', { appId: app.id });
          console.log('✅ App already open, chat will send to API');
          logger.endTrace();
          return message;
        }
        
        // If app is not open, open it and let APP handle the API request
        logger.info(LogCategory.APP_TRIGGER, 'Opening app, app will handle API request', { 
          appId: app.id, 
          trigger: matchingTrigger 
        });
        console.log('📱 Opening app, blocking chat API request - app will handle');
        setTimeout(() => {
          setCurrentApp(app.id as AppId);
          setShowRightSidebar(true);
          setTriggeredAppInput(message);
          logger.info(LogCategory.APP_TRIGGER, 'App opened successfully', { appId: app.id });
          console.log('✨ App opened and will handle API request:', app.id);
        }, 1000);
        
        // BLOCK chat API call since app will handle it
        logger.endTrace();
        return null;
      }
    }
    
    // No app triggered, current state is chat, let chat send to API
    logger.info(LogCategory.USER_INPUT, 'No app trigger detected, chat sends to API', { 
      messageLength: message.length 
    });
    logger.endTrace();
    return message;
  }, [currentApp, showRightSidebar, availableApps, addMessage, setCurrentApp, setShowRightSidebar, setTriggeredAppInput]);

  const onFileSelect = useCallback((files: FileList) => {
    logger.info(LogCategory.USER_INPUT, 'Files selected', { 
      fileCount: files.length,
      fileNames: Array.from(files).map(f => f.name)
    });
    console.log('📎 Files selected:', files);
    if (files.length > 0) {
      const fileMessage = `Analyze ${files.length} document${files.length > 1 ? 's' : ''}: ${Array.from(files).map(f => f.name).join(', ')}`;
      setTimeout(() => {
        setCurrentApp('knowledge' as AppId);
        setShowRightSidebar(true);
        setTriggeredAppInput(fileMessage);
        logger.info(LogCategory.APP_TRIGGER, 'Opened knowledge app for files', { fileCount: files.length });
        console.log('🧠 Opened knowledge app for files');
      }, 500);
    }
  }, [setCurrentApp, setShowRightSidebar, setTriggeredAppInput]);

  return <>{children({ onBeforeSend, onFileSelect })}</>;
};