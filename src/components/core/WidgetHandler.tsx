/**
 * ============================================================================
 * Unified Widget Handler (WidgetHandler.tsx) - Unified Widget Request Processing
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Process requests from all widget UI components
 * - Route requests to appropriate widget stores
 * - Transform UI parameters to store format
 * - Maintain separation between UI and business logic
 * 
 * Architecture Flow:
 * Widget UI → WidgetHandler → useWidgetStores → chatService → API
 * API Response → chatService → stores → hooks → modules → UI
 */

import { useDreamWidgetStore, useHuntWidgetStore, useOmniWidgetStore, useAssistantWidgetStore, useDataScientistWidgetStore } from '../../stores/useWidgetStores';
import { logger, LogCategory } from '../../utils/logger';
import { OutputHistoryItem, EditAction, ManagementAction } from '../ui/widgets/BaseWidget';

// Widget type definitions
export type WidgetType = 'dream' | 'hunt' | 'omni' | 'assistant' | 'knowledge' | 'data_scientist';

// Generic widget request interface
export interface WidgetRequest {
  type: WidgetType;
  params: any;
  sessionId?: string;
  userId?: string;
}

// UI action request interface
export interface WidgetUIActionRequest {
  type: WidgetType;
  action: 'edit' | 'manage' | 'history' | 'clear';
  actionId: string;
  params?: any;
  content?: any;
}

// History request interface
export interface WidgetHistoryRequest {
  type: WidgetType;
  limit?: number;
  offset?: number;
}

/**
 * Unified Widget Handler Class
 * Routes widget requests to appropriate stores
 */
export class WidgetHandler {
  /**
   * Process widget request based on type
   * Routes to appropriate store without handling chat service directly
   */
  async processRequest(request: WidgetRequest): Promise<void> {
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Processing widget request', { 
      type: request.type, 
      params: request.params 
    });

    try {
      switch (request.type) {
        case 'dream':
          await this.processDreamRequest(request.params, request.sessionId, request.userId);
          break;
        case 'hunt':
          await this.processHuntRequest(request.params, request.sessionId, request.userId);
          break;
        case 'omni':
          await this.processOmniRequest(request.params, request.sessionId, request.userId);
          break;
        case 'assistant':
          await this.processAssistantRequest(request.params, request.sessionId, request.userId);
          break;
        case 'knowledge':
          await this.processKnowledgeRequest(request.params, request.sessionId, request.userId);
          break;
        case 'data_scientist':
          await this.processDataScientistRequest(request.params, request.sessionId, request.userId);
          break;
        default:
          throw new Error(`Unsupported widget type: ${request.type}`);
      }
    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, 'Widget request failed', { 
        type: request.type, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Process Dream widget request - Route to Dream store
   */
  private async processDreamRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    const dreamStore = useDreamWidgetStore.getState();
    
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream request routed to store', { 
      params, 
      sessionId, 
      userId 
    });
    
    // Trigger dream generation via store's chatService integration
    await dreamStore.triggerDreamGeneration(params);
  }

  /**
   * Process Hunt widget request - Route to Hunt store
   */
  private async processHuntRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    const huntStore = useHuntWidgetStore.getState();
    
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Hunt request routed to store', { 
      params, 
      sessionId, 
      userId 
    });
    
    // Trigger hunt search via store's chatService integration
    await huntStore.triggerHuntSearch(params);
  }

  /**
   * Process Omni widget request - Route to Omni store
   */
  private async processOmniRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    const omniStore = useOmniWidgetStore.getState();
    
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Omni request routed to store', { 
      params, 
      sessionId, 
      userId 
    });
    
    // Trigger omni generation via store's chatService integration
    await omniStore.triggerOmniGeneration(params);
  }

  /**
   * Process Assistant widget request - Route to Assistant store
   */
  private async processAssistantRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    const assistantStore = useAssistantWidgetStore.getState();
    
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Assistant request routed to store', { 
      params, 
      sessionId, 
      userId 
    });
    
    // Trigger assistant request via store's chatService integration
    await assistantStore.triggerAssistantRequest(params);
  }

  /**
   * Process Knowledge widget request (placeholder for future implementation)
   */
  private async processKnowledgeRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Knowledge widget request - placeholder implementation', { 
      params, 
      sessionId, 
      userId 
    });
    // TODO: Implement knowledge widget store routing
  }

  /**
   * Process Data Scientist widget request - Route to DataScientist store
   */
  private async processDataScientistRequest(params: any, sessionId?: string, userId?: string): Promise<void> {
    const dataScientistStore = useDataScientistWidgetStore.getState();
    
    logger.debug(LogCategory.ARTIFACT_CREATION, 'DataScientist request routed to store', { 
      params, 
      sessionId, 
      userId 
    });
    
    // Trigger data scientist analysis via store's chatService integration
    await dataScientistStore.triggerDataScientistAnalysis(params);
  }

  /**
   * Process UI actions (edit, manage, history operations)
   */
  async processUIAction(request: WidgetUIActionRequest): Promise<any> {
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Processing widget UI action', { 
      type: request.type, 
      action: request.action,
      actionId: request.actionId
    });

    try {
      switch (request.action) {
        case 'edit':
          return await this.processEditAction(request);
        case 'manage':
          return await this.processManagementAction(request);
        case 'history':
          return await this.getWidgetHistory({ type: request.type });
        case 'clear':
          return await this.clearWidgetData(request.type);
        default:
          throw new Error(`Unsupported UI action: ${request.action}`);
      }
    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, 'Widget UI action failed', { 
        type: request.type, 
        action: request.action,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Process edit actions (copy, download, share, etc.)
   */
  private async processEditAction(request: WidgetUIActionRequest): Promise<void> {
    console.log(`📝 ${request.type.toUpperCase()}: Processing edit action '${request.actionId}'`, request.content);
    
    // Default edit actions that work across all widgets
    switch (request.actionId) {
      case 'copy':
        const textContent = typeof request.content === 'string' ? request.content : JSON.stringify(request.content);
        await navigator.clipboard.writeText(textContent);
        break;
      case 'download':
        this.downloadContent(request.content, request.type);
        break;
      case 'share':
        await this.shareContent(request.content, request.type);
        break;
      default:
        // Widget-specific edit actions would be handled here
        console.log(`🔧 ${request.type.toUpperCase()}: Custom edit action '${request.actionId}' - implement in widget-specific handler`);
    }
  }

  /**
   * Process management actions (refresh, clear, custom actions)
   */
  private async processManagementAction(request: WidgetUIActionRequest): Promise<void> {
    console.log(`⚙️ ${request.type.toUpperCase()}: Processing management action '${request.actionId}'`);
    
    switch (request.actionId) {
      case 'refresh':
        // Re-trigger the last request for this widget
        if (request.params) {
          await this.processRequest({
            type: request.type,
            params: request.params
          });
        }
        break;
      case 'clear':
        await this.clearWidgetData(request.type);
        break;
      default:
        // Widget-specific management actions would be handled here
        console.log(`🔧 ${request.type.toUpperCase()}: Custom management action '${request.actionId}' - implement in widget-specific handler`);
    }
  }

  /**
   * Get widget output history
   */
  async getWidgetHistory(request: WidgetHistoryRequest): Promise<OutputHistoryItem[]> {
    // This would typically fetch from a persistent store or database
    // For now, return empty array as a placeholder
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Getting widget history', { type: request.type });
    
    // In a real implementation, this would:
    // 1. Query the widget's history store
    // 2. Apply pagination (limit/offset)
    // 3. Return formatted history items
    
    return [];
  }

  /**
   * Clear widget data and history
   */
  private async clearWidgetData(type: WidgetType): Promise<void> {
    logger.debug(LogCategory.ARTIFACT_CREATION, 'Clearing widget data', { type });
    
    try {
      switch (type) {
        case 'dream':
          const dreamStore = useDreamWidgetStore.getState();
          dreamStore.clearDreamData?.();
          break;
        case 'hunt':
          const huntStore = useHuntWidgetStore.getState();
          huntStore.clearHuntData?.();
          break;
        case 'omni':
          const omniStore = useOmniWidgetStore.getState();
          omniStore.clearOmniData?.();
          break;
        case 'assistant':
          const assistantStore = useAssistantWidgetStore.getState();
          assistantStore.clearAssistantData?.();
          break;
        case 'data_scientist':
          const dataScientistStore = useDataScientistWidgetStore.getState();
          dataScientistStore.clearDataScientistData?.();
          break;
        default:
          console.log(`⚠️ Clear operation not implemented for widget type: ${type}`);
      }
    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, 'Failed to clear widget data', { type, error });
      throw error;
    }
  }

  /**
   * Helper: Download content as file
   */
  private downloadContent(content: any, widgetType: string): void {
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${widgetType}_output_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper: Share content via Web Share API or clipboard
   */
  private async shareContent(content: any, widgetType: string): Promise<void> {
    const textContent = typeof content === 'string' ? content : JSON.stringify(content);
    const shareData = {
      title: `${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Output`,
      text: textContent
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(textContent);
      console.log('📋 Content copied to clipboard (Web Share API not available)');
    }
  }
}

// ================================================================================
// Export singleton instance and helper functions
// ================================================================================

export const widgetHandler = new WidgetHandler();

// Convenience functions for direct widget calls
export const processDreamWidget = (params: any, sessionId?: string, userId?: string) => 
  widgetHandler.processRequest({ type: 'dream', params, sessionId, userId });

export const processHuntWidget = (params: any, sessionId?: string, userId?: string) => 
  widgetHandler.processRequest({ type: 'hunt', params, sessionId, userId });

export const processOmniWidget = (params: any, sessionId?: string, userId?: string) => 
  widgetHandler.processRequest({ type: 'omni', params, sessionId, userId });

export const processAssistantWidget = (params: any, sessionId?: string, userId?: string) => 
  widgetHandler.processRequest({ type: 'assistant', params, sessionId, userId });

export const processDataScientistWidget = (params: any, sessionId?: string, userId?: string) => 
  widgetHandler.processRequest({ type: 'data_scientist', params, sessionId, userId });

// Convenience functions for UI actions
export const processWidgetUIAction = (request: WidgetUIActionRequest) => 
  widgetHandler.processUIAction(request);

export const getWidgetHistory = (request: WidgetHistoryRequest) => 
  widgetHandler.getWidgetHistory(request);

export const clearWidgetData = (type: WidgetType) => 
  widgetHandler.processUIAction({ type, action: 'clear', actionId: 'clear' });

export default widgetHandler;