/**
 * ============================================================================
 * App Handler (AppHandler.tsx) - Core Application Event Handler
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Handle all application-level UI events
 * - Act as event dispatcher, converting UI events to business operations
 * - Connect UI components with business logic layer
 * - Provide unified event handling interface
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - Receiving and preprocessing UI events
 *   - Event parameter validation and transformation
 *   - Calling corresponding store actions
 *   - Event logging
 * 
 * ❌ Not responsible for:
 *   - Specific business logic implementation (handled by stores)
 *   - Direct UI component rendering (handled by components)
 *   - State management (handled by stores)
 *   - Network requests (handled by services)
 */

import { useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { AppId } from '../../types/appTypes';
import { logger, LogCategory } from '../../utils/logger';

/**
 * App Handler - Core application event handler
 * Provides unified application event handling interface
 */
export const useAppHandler = () => {
  // Get store actions
  const {
    setCurrentApp,
    setShowRightSidebar,
    setTriggeredAppInput,
    closeApp,
    reopenApp,
    recordWidgetUsage,
    markWidgetWithArtifacts,
    startNewChat,
    setLoading,
    setError,
    clearError
  } = useAppStore();

  // ============================================================================
  // Application Navigation Event Handlers
  // ============================================================================

  /**
   * Handle app selection event
   */
  const handleAppSelect = useCallback((appId: string, triggeredInput?: string) => {
    logger.info(LogCategory.APP_TRIGGER, 'App selected via handler', { 
      appId, 
      triggeredInput: triggeredInput?.substring(0, 50) 
    });

    setCurrentApp(appId as AppId);
    setShowRightSidebar(true);
    
    if (triggeredInput) {
      setTriggeredAppInput(triggeredInput);
    }

    // Record widget usage
    recordWidgetUsage(appId);
  }, [setCurrentApp, setShowRightSidebar, setTriggeredAppInput, recordWidgetUsage]);

  /**
   * Handle app close event
   */
  const handleAppClose = useCallback(() => {
    const currentApp = useAppStore.getState().currentApp;
    
    logger.info(LogCategory.APP_TRIGGER, 'App closed via handler', { 
      closedApp: currentApp 
    });

    closeApp();
  }, [closeApp]);

  /**
   * Handle back to widget list event
   */
  const handleBackToList = useCallback(() => {
    const currentApp = useAppStore.getState().currentApp;
    
    logger.info(LogCategory.APP_TRIGGER, 'Back to widget list via handler', { 
      previousApp: currentApp 
    });

    setCurrentApp(null);
    setTriggeredAppInput('');
    // Keep right sidebar open to show widget list
  }, [setCurrentApp, setTriggeredAppInput]);

  /**
   * Handle sidebar toggle event
   */
  const handleSidebarToggle = useCallback(() => {
    const currentState = useAppStore.getState().showRightSidebar;
    
    logger.info(LogCategory.APP_TRIGGER, 'Sidebar toggled via handler', { 
      newState: !currentState 
    });

    setShowRightSidebar(!currentState);
  }, [setShowRightSidebar]);

  /**
   * Handle reopen app from artifact event
   */
  const handleReopenFromArtifact = useCallback((artifactId: string) => {
    logger.info(LogCategory.APP_TRIGGER, 'Reopen app from artifact via handler', { 
      artifactId 
    });

    reopenApp(artifactId);
  }, [reopenApp]);

  // ============================================================================
  // Widget Related Event Handlers
  // ============================================================================

  /**
   * Handle widget usage recording event
   */
  const handleWidgetUsage = useCallback((widgetId: string) => {
    logger.debug(LogCategory.SIDEBAR_INTERACTION, 'Widget usage recorded via handler', { 
      widgetId 
    });

    recordWidgetUsage(widgetId);
  }, [recordWidgetUsage]);

  /**
   * Handle widget artifact creation event
   */
  const handleWidgetArtifactCreated = useCallback((widgetId: string, artifactId: string) => {
    logger.info(LogCategory.ARTIFACT_CREATION, 'Widget artifact created via handler', { 
      widgetId, 
      artifactId 
    });

    markWidgetWithArtifacts(widgetId);
  }, [markWidgetWithArtifacts]);

  // ============================================================================
  // Chat Related Event Handlers
  // ============================================================================

  /**
   * Handle new chat start event
   */
  const handleNewChat = useCallback(() => {
    logger.info(LogCategory.CHAT_FLOW, 'New chat started via handler');

    startNewChat();
  }, [startNewChat]);

  // ============================================================================
  // Global State Event Handlers
  // ============================================================================

  /**
   * Handle loading state change event
   */
  const handleLoadingChange = useCallback((loading: boolean) => {
    setLoading(loading);
  }, [setLoading]);

  /**
   * Handle error event
   */
  const handleError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    logger.error(LogCategory.STATE_CHANGE, 'Error handled via handler', { 
      error: errorMessage 
    });

    setError(errorMessage);
  }, [setError]);

  /**
   * Handle error clear event
   */
  const handleClearError = useCallback(() => {
    logger.debug(LogCategory.STATE_CHANGE, 'Error cleared via handler');

    clearError();
  }, [clearError]);

  // ============================================================================
  // File Related Event Handlers
  // ============================================================================

  /**
   * Handle file selection event
   */
  const handleFileSelect = useCallback((files: FileList) => {
    logger.info(LogCategory.USER_INPUT, 'Files selected via handler', {
      fileCount: files.length,
      fileNames: Array.from(files).map(f => f.name)
    });

    // Auto trigger knowledge widget
    if (files.length > 0) {
      handleAppSelect('knowledge', `Analyze ${files.length} document(s): ${Array.from(files).map(f => f.name).join(', ')}`);
    }
  }, [handleAppSelect]);

  // ============================================================================
  // Composite Event Handlers
  // ============================================================================

  /**
   * Handle complex app trigger event (with input content analysis)
   */
  const handleAppTriggerWithAnalysis = useCallback((input: string, detectedAppId?: string) => {
    logger.info(LogCategory.APP_TRIGGER, 'App trigger with analysis via handler', {
      inputLength: input.length,
      detectedAppId
    });

    if (detectedAppId) {
      handleAppSelect(detectedAppId, input);
    } else {
      // Set input content, wait for user to manually select app
      setTriggeredAppInput(input);
      setShowRightSidebar(true);
    }
  }, [handleAppSelect, setTriggeredAppInput, setShowRightSidebar]);

  // ============================================================================
  // Return All Event Handlers
  // ============================================================================

  return {
    // Application navigation
    handleAppSelect,
    handleAppClose,
    handleBackToList,
    handleSidebarToggle,
    handleReopenFromArtifact,

    // Widget management
    handleWidgetUsage,
    handleWidgetArtifactCreated,

    // Chat management
    handleNewChat,

    // Global state
    handleLoadingChange,
    handleError,
    handleClearError,

    // File handling
    handleFileSelect,

    // Composite operations
    handleAppTriggerWithAnalysis
  };
};

/**
 * App Handler type definition
 */
export type AppHandlerType = ReturnType<typeof useAppHandler>;

/**
 * Static App Handler instance - for non-React environments
 */
export const appHandler = {
  selectApp: (appId: string) => {
    const { setCurrentApp, setShowRightSidebar, recordWidgetUsage } = useAppStore.getState();
    setCurrentApp(appId as AppId);
    setShowRightSidebar(true);
    recordWidgetUsage(appId);
  },

  closeApp: () => {
    const { closeApp } = useAppStore.getState();
    closeApp();
  },

  recordUsage: (widgetId: string) => {
    const { recordWidgetUsage } = useAppStore.getState();
    recordWidgetUsage(widgetId);
  }
};