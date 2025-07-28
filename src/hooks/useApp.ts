/**
 * ============================================================================
 * App Hooks (useApp.ts) - Selective Subscription Hooks for App State
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provide precise app state selector hooks
 * - Implement selective subscription to avoid unnecessary re-renders
 * - Encapsulate complex state logic into simple hook interfaces
 * - Provide performance-optimized state access for components
 * 
 * Optimization Principles:
 * - Each hook only subscribes to needed state slices
 * - Use zustand selectors to avoid over-rendering
 * - Provide composite hooks to reduce hook call counts
 * - Provide specialized hooks for AppModule, AppLayout, AppHandler
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { AppId } from '../types/appTypes';

// ============================================================================
// Basic App State Selectors - Single responsibility, precise subscription
// ============================================================================

/**
 * Current active app ID - selective subscription
 * Only re-render component when current app changes
 */
export const useCurrentApp = () => useAppStore(state => state.currentApp);

/**
 * Right sidebar display state - selective subscription
 * Only re-render component when sidebar state changes
 */
export const useShowRightSidebar = () => useAppStore(state => state.showRightSidebar);

/**
 * Triggered app input content - selective subscription
 * Only re-render component when triggered input changes
 */
export const useTriggeredAppInput = () => useAppStore(state => state.triggeredAppInput);

/**
 * App loading state - selective subscription
 */
export const useAppLoading = () => useAppStore(state => state.isLoading);

/**
 * App error state - selective subscription
 */
export const useAppError = () => useAppStore(state => state.error);

/**
 * Chat reset key - selective subscription
 */
export const useChatKey = () => useAppStore(state => state.chatKey);

// ============================================================================
// Widget State Selectors - Performance optimized Widget related hooks
// ============================================================================

/**
 * Get specific Widget usage state - selective subscription
 * Only re-render component when specific widget state changes
 */
export const useWidgetUsage = (widgetId: string) => 
  useAppStore(state => state.widgetUsage[widgetId] || {
    lastUsed: null,
    hasArtifacts: false,
    usageCount: 0
  });

/**
 * Get sorted Widget list - selective subscription
 * Use useMemo to avoid recalculating sort every time
 */
export const useSortedWidgets = () => useAppStore(state => state.getSortedWidgets());

/**
 * Whether Widget has artifacts - selective subscription
 */
export const useWidgetHasArtifacts = (widgetId: string) => 
  useAppStore(state => state.widgetUsage[widgetId]?.hasArtifacts || false);

// ============================================================================
// Composite hooks - Reduce hook call counts, provide business-level state combinations
// ============================================================================

/**
 * App navigation state combination - get all navigation-related state at once
 * Suitable for components that need multiple navigation states, avoiding multiple hook calls
 */
export const useAppNavigation = () => useAppStore(useCallback(state => ({
  currentApp: state.currentApp,
  showRightSidebar: state.showRightSidebar,
  triggeredAppInput: state.triggeredAppInput,
  setCurrentApp: state.setCurrentApp,
  setShowRightSidebar: state.setShowRightSidebar,
  closeApp: state.closeApp,
  reopenApp: state.reopenApp
}), []));

/**
 * App input state and operations - composite hook
 */
export const useAppInput = () => useAppStore(useCallback(state => ({
  triggeredAppInput: state.triggeredAppInput,
  setTriggeredAppInput: state.setTriggeredAppInput
}), []));

/**
 * Widget management state and operations - composite hook
 */
export const useWidgetManagement = () => useAppStore(useCallback(state => ({
  widgetUsage: state.widgetUsage,
  recordWidgetUsage: state.recordWidgetUsage,
  markWidgetWithArtifacts: state.markWidgetWithArtifacts,
  getWidgetUsage: state.getWidgetUsage,
  getSortedWidgets: state.getSortedWidgets
}), []));

/**
 * App global state management - composite hook
 */
export const useAppStateManagement = () => useAppStore(useCallback(state => ({
  isLoading: state.isLoading,
  error: state.error,
  chatKey: state.chatKey,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  startNewChat: state.startNewChat,
  setShowLoggingDashboard: state.setShowLoggingDashboard
}), []));

// ============================================================================
// Specialized business hooks - Optimized state access for specific components
// ============================================================================

/**
 * Right sidebar complete state - optimized for RightSidebar component
 * Get all state needed by right sidebar at once, avoiding multiple re-renders
 */
export const useRightSidebarState = () => {
  return useAppStore(useCallback(state => ({
    currentApp: state.currentApp,
    showRightSidebar: state.showRightSidebar,
    triggeredAppInput: state.triggeredAppInput,
    widgetUsage: state.widgetUsage,
    sortedWidgets: state.getSortedWidgets()
  }), []));
};

/**
 * App layout state - optimized for AppLayout component
 */
export const useAppLayoutState = () => {
  return useAppStore(useCallback(state => ({
    currentApp: state.currentApp,
    showRightSidebar: state.showRightSidebar,
    isLoading: state.isLoading,
    error: state.error,
    chatKey: state.chatKey
  }), []));
};

/**
 * App Header state - optimized for AppHeader component
 */
export const useAppHeaderState = () => {
  return useAppStore(useCallback(state => ({
    currentApp: state.currentApp,
    showRightSidebar: state.showRightSidebar
  }), []));
};

// ============================================================================
// Performance optimization hooks - Provide memoized state access
// ============================================================================

/**
 * App state change detection - for debugging and performance analysis
 * Provide state snapshot, convenient for detecting state changes
 */
export const useAppStateChangeDetection = () => {
  const currentApp = useCurrentApp();
  const showRightSidebar = useShowRightSidebar();
  
  return useMemo(() => ({
    currentApp,
    showRightSidebar,
    // Provide state snapshot for change detection
    stateSnapshot: `${currentApp}-${showRightSidebar}`
  }), [currentApp, showRightSidebar]);
};

/**
 * Widget state snapshot - for Widget list performance optimization
 */
export const useWidgetStateSnapshot = () => {
  const widgetUsage = useAppStore(state => state.widgetUsage);
  
  return useMemo(() => {
    const sortedWidgets = useAppStore.getState().getSortedWidgets();
    return {
      widgetUsage,
      sortedWidgets,
      // Snapshot string for dependency comparison
      snapshot: JSON.stringify(sortedWidgets.map(w => ({ id: w.id, lastUsed: w.usage.lastUsed })))
    };
  }, [widgetUsage]);
};

// ============================================================================
// Type exports
// ============================================================================

export type AppNavigationState = ReturnType<typeof useAppNavigation>;
export type AppInputState = ReturnType<typeof useAppInput>;
export type WidgetManagementState = ReturnType<typeof useWidgetManagement>;
export type AppStateManagementState = ReturnType<typeof useAppStateManagement>;
export type RightSidebarState = ReturnType<typeof useRightSidebarState>;
export type AppLayoutState = ReturnType<typeof useAppLayoutState>;