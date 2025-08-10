/**
 * ============================================================================
 * Artifact Module (ArtifactModule.tsx) - Pure Business Logic
 * ============================================================================
 * 
 * 【核心职责】
 * - 工件管理的业务逻辑模块
 * - 使用useChat hook获取widget生成的artifacts
 * - 提供artifact相关的业务逻辑和回调处理
 * - 纯业务逻辑，不涉及UI渲染和React组件
 * 
 * 【架构定位】
 * - Widget generates content → useWidgetStores → useChat → ArtifactModule (business logic) → UI Components
 * - 只处理数据和业务逻辑，UI渲染由MessageList + ArtifactComponent处理
 * - 与Widget生成流程配合，提供artifact相关的业务操作
 * 
 * 【重要】
 * - 不包含任何UI组件或JSX渲染
 * - 使用React hooks进行状态管理和性能优化
 */
import { useCallback, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useAppStore } from '../stores/useAppStore';
import { useSessionStore } from '../stores/useSessionStore';
import { ChatMessage, ArtifactMessage } from '../types/chatTypes';
import { AppArtifact } from '../types/appTypes';

/**
 * Modern Artifact Business Logic Hook
 * 
 * Provides unified business logic for handling both legacy AppArtifacts and new ArtifactMessages
 * Used by UI components to get artifact data and handle artifact actions
 */
export const useArtifactLogic = () => {
  // Legacy artifact system
  const { artifacts: legacyArtifacts, latestWidgetArtifact, isAnyWidgetGenerating } = useChat();
  const { setCurrentApp, setShowRightSidebar } = useAppStore();
  
  // New artifact message system
  const { getCurrentSession, getArtifactMessages } = useSessionStore();
  
  // Get current session's artifact messages
  const currentSession = getCurrentSession();
  const artifactMessages = currentSession ? getArtifactMessages(currentSession.id) : [];
  
  console.log('🎨 ARTIFACT_MODULE: Combined artifact state:', {
    legacyArtifacts: legacyArtifacts?.length || 0,
    artifactMessages: artifactMessages.length,
    currentSessionId: currentSession?.id
  });

  // Business logic: Handle artifact reopening - supports both legacy and new system
  const handleReopenArtifact = useCallback((artifactId: string) => {
    // First try legacy system
    const legacyArtifact = legacyArtifacts?.find(a => a.id === artifactId);
    if (legacyArtifact) {
      console.log('📱 ARTIFACT_MODULE: Reopening legacy artifact app:', legacyArtifact.appId);
      setCurrentApp(legacyArtifact.appId);
      setShowRightSidebar(true);
      return;
    }
    
    // Then try artifact message system
    const artifactMessage = artifactMessages.find(am => am.artifact.id === artifactId);
    if (artifactMessage) {
      console.log('📱 ARTIFACT_MODULE: Reopening artifact from message:', artifactMessage.artifact.widgetType);
      // Map widget type to app ID
      const appId = artifactMessage.artifact.widgetType; // 'dream', 'hunt', etc.
      setCurrentApp(appId as any); // TODO: Fix type casting
      setShowRightSidebar(true);
    }
  }, [legacyArtifacts, artifactMessages, setCurrentApp, setShowRightSidebar]);

  // Business logic: Get artifacts for message - includes both legacy and new system
  const getArtifactsForMessage = useCallback((index: number, allMessages: ChatMessage[]) => {
    // Show artifacts after the last message to avoid duplication
    const isLastMessage = index === allMessages.length - 1;
    
    if (!isLastMessage) {
      return { legacy: [], messages: [] };
    }

    return {
      legacy: legacyArtifacts || [],
      messages: artifactMessages
    };
  }, [legacyArtifacts, artifactMessages]);

  // Business logic: Get artifact generation status
  const getGenerationStatus = useCallback(() => {
    return {
      isGenerating: isAnyWidgetGenerating,
      latestArtifact: latestWidgetArtifact,
      totalLegacyArtifacts: legacyArtifacts?.length || 0,
      totalArtifactMessages: artifactMessages.length,
      totalArtifacts: (legacyArtifacts?.length || 0) + artifactMessages.length
    };
  }, [isAnyWidgetGenerating, latestWidgetArtifact, legacyArtifacts?.length, artifactMessages.length]);

  // 移除这个导致无限循环的 console.log
  // console.log('🎨 ARTIFACT_MODULE: Business logic state:', {
  //   artifactsCount: artifacts?.length || 0,
  //   latestArtifact: latestWidgetArtifact?.appName,
  //   isGenerating: isAnyWidgetGenerating
  // });

  // 完全禁用日志以解决无限循环问题
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('🎨 ARTIFACT_MODULE: State changed:', {
  //       artifactsCount: artifacts?.length || 0,
  //       latestArtifact: latestWidgetArtifact?.appName,
  //       isGenerating: isAnyWidgetGenerating
  //     });
  //   }
  // }, [artifacts?.length, latestWidgetArtifact?.appName, isAnyWidgetGenerating]);

  return {
    // Legacy data (for backward compatibility)
    artifacts: legacyArtifacts || [],
    latestWidgetArtifact,
    isAnyWidgetGenerating,
    
    // New artifact message data
    artifactMessages,
    currentSession,
    
    // Business logic functions
    handleReopenArtifact,
    getArtifactsForMessage,
    getGenerationStatus
  };
};

/**
 * Legacy Artifact Business Logic Hook (Deprecated)
 * 
 * Maintains the original interface for backward compatibility
 * New code should use useArtifactLogic() instead
 */
export const useArtifactLogicLegacy = () => {
  const { artifacts, latestWidgetArtifact, isAnyWidgetGenerating, handleReopenArtifact, getArtifactsForMessage, getGenerationStatus } = useArtifactLogic();
  
  return {
    // Legacy data format
    artifacts,
    latestWidgetArtifact,
    isAnyWidgetGenerating,
    
    // Legacy business logic functions
    handleReopenArtifact,
    getArtifactsForMessage: (index: number, allMessages: ChatMessage[]) => {
      const result = getArtifactsForMessage(index, allMessages);
      return result.legacy; // Return only legacy artifacts for backward compatibility
    },
    getGenerationStatus
  };
};

// Legacy interface for backward compatibility
export interface ArtifactModuleProps {
  reopenApp: (artifactId: string) => void;
}

// This module is now purely business logic - no React components
// UI rendering is handled by MessageList + ArtifactComponent + ArtifactMessageComponent