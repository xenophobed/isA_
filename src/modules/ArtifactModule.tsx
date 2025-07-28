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
import { ChatMessage } from '../types/chatTypes';

/**
 * Artifact Business Logic Hook
 * 
 * Provides business logic for handling artifacts in the chat interface
 * Used by UI components to get artifact data and handle artifact actions
 */
export const useArtifactLogic = () => {
  const { artifacts, latestWidgetArtifact, isAnyWidgetGenerating } = useChat();
  const { setCurrentApp, setShowRightSidebar } = useAppStore();

  // Business logic: Handle artifact reopening
  const handleReopenArtifact = useCallback((artifactId: string) => {
    const artifact = artifacts?.find(a => a.id === artifactId);
    if (artifact) {
      console.log('📱 ARTIFACT_MODULE: Reopening artifact app:', artifact.appId);
      setCurrentApp(artifact.appId);
      setShowRightSidebar(true);
    }
  }, [artifacts, setCurrentApp, setShowRightSidebar]);

  // Business logic: Check if message should show artifacts
  const getArtifactsForMessage = useCallback((index: number, allMessages: ChatMessage[]) => {
    // Show artifacts after the last message to avoid duplication
    const isLastMessage = index === allMessages.length - 1;
    
    if (!isLastMessage || !artifacts || artifacts.length === 0) {
      return [];
    }

    // Return all artifacts for now - you can customize this logic
    return artifacts;
  }, [artifacts]);

  // Business logic: Get artifact generation status
  const getGenerationStatus = useCallback(() => {
    return {
      isGenerating: isAnyWidgetGenerating,
      latestArtifact: latestWidgetArtifact,
      totalArtifacts: artifacts?.length || 0
    };
  }, [isAnyWidgetGenerating, latestWidgetArtifact, artifacts?.length]);

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
    // Data
    artifacts: artifacts || [],
    latestWidgetArtifact,
    isAnyWidgetGenerating,
    
    // Business logic functions
    handleReopenArtifact,
    getArtifactsForMessage,
    getGenerationStatus
  };
};

// Legacy interface for backward compatibility
export interface ArtifactModuleProps {
  reopenApp: (artifactId: string) => void;
}

// This module is now purely business logic - no React components
// UI rendering is handled by MessageList + ArtifactComponent