/**
 * ============================================================================
 * 聊天输入处理器 (ChatInputHandler.tsx) - 简化版
 * ============================================================================
 * 
 * 【核心功能】
 * - 处理用户输入和文件上传
 * - 创建用户消息并添加到聊天存储
 * - 委托所有路由决策给useChatStore的响应式系统
 * 
 * 【架构更新】
 * ✅ 移除了硬编码的触发词逻辑
 * ✅ 使用AI驱动的意图检测 (在useChatStore中)
 * ✅ 统一的响应式消息路由系统
 * ✅ 支持文件上传自动触发Knowledge widget
 * 
 * 【处理流程】
 * 1. onBeforeSend: 创建用户消息 → 添加到store → 返回null
 * 2. onFileSelect: 创建带文件的消息 → 添加到store
 * 3. useChatStore响应式系统：检测意图 → 路由到widget或chat API
 * 
 * 【重要】所有消息路由现在由useChatStore的AI系统处理
 */
import React, { useCallback } from 'react';
import { useChatActions } from '../../stores/useChatStore';
import { logger, LogCategory } from '../../utils/logger';

interface ChatInputHandlerProps {
  children: (handlers: {
    onBeforeSend: (message: string) => string | null;
    onFileSelect: (files: FileList) => void;
  }) => React.ReactNode;
}

export const ChatInputHandler: React.FC<ChatInputHandlerProps> = ({
  children
}) => {
  const { addMessage } = useChatActions();

  const onBeforeSend = useCallback((message: string): string | null => {
    const traceId = logger.startTrace('USER_INPUT_PROCESSING');
    logger.trackUserInput(message, {});
    console.log('🚀 ChatInputHandler: Processing user input:', message);
    
    // Create and add user message to chat store
    // The reactive system in useChatStore will handle widget triggering and API calls
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'regular' as const,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
      sessionId: 'default',
      metadata: {},
      processed: false // Mark as unprocessed for reactive system
    };
    addMessage(userMessage);
    
    logger.info(LogCategory.USER_INPUT, 'User message added, reactive system will handle routing', { 
      messageLength: message.length 
    });
    logger.endTrace();
    
    // Always return null - the reactive system in useChatStore handles all routing
    return null;
  }, [addMessage]);

  const onFileSelect = useCallback((files: FileList) => {
    logger.info(LogCategory.USER_INPUT, 'Files selected', { 
      fileCount: files.length,
      fileNames: Array.from(files).map(f => f.name)
    });
    console.log('📎 ChatInputHandler: Files selected:', Array.from(files).map(f => f.name));
    
    if (files.length > 0) {
      // Create a message with files - the reactive system will handle knowledge widget triggering
      const fileMessage = `Analyze ${files.length} document${files.length > 1 ? 's' : ''}: ${Array.from(files).map(f => f.name).join(', ')}`;
      const userMessage = {
        id: `user-${Date.now()}`,
        type: 'regular' as const,
        role: 'user' as const,
        content: fileMessage,
        timestamp: new Date().toISOString(),
        sessionId: 'default',
        metadata: {},
        processed: false,
        files: Array.from(files) // Add files to trigger knowledge widget
      };
      
      addMessage(userMessage);
      logger.info(LogCategory.USER_INPUT, 'File message added, reactive system will trigger knowledge widget', { fileCount: files.length });
    }
  }, [addMessage]);

  return <>{children({ onBeforeSend, onFileSelect })}</>;
};