/**
 * ============================================================================
 * Assistant Widget Module (AssistantWidgetModule.tsx) - Refactored with BaseWidgetModule
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Assistant-specific configuration and customizations
 * - Manages AI conversation business logic with enhanced UI features
 * - Integrates seamlessly with BaseWidget UI components
 * 
 * Benefits of BaseWidgetModule integration:
 * - Automatic output history management
 * - Built-in edit and management actions
 * - Streaming status display
 * - Standard error handling and logging
 * - Consistent UI patterns across all widgets
 */
import React, { ReactNode } from 'react';
import { BaseWidgetModule, createWidgetConfig } from './BaseWidgetModule';
import { AssistantWidgetParams, AssistantWidgetResult } from '../../types/widgetTypes';
import { EditAction, ManagementAction } from '../../components/ui/widgets/BaseWidget';

// Assistant-specific edit actions
const assistantEditActions: EditAction[] = [
  {
    id: 'copy_response',
    label: 'Copy Response',
    icon: '📝',
    onClick: (content) => {
      const textContent = typeof content === 'string' ? content : 
        content?.response || JSON.stringify(content);
      navigator.clipboard.writeText(textContent);
      console.log('🤖 ASSISTANT: Response copied to clipboard');
    }
  },
  {
    id: 'share_task',
    label: 'Share Task',
    icon: '🔗',
    onClick: (content) => {
      const shareData = {
        title: 'AI Assistant Task',
        text: typeof content === 'string' ? content : 
          content?.response || 'AI Assistant conversation'
      };
      
      if (navigator.share) {
        navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        console.log('🤖 ASSISTANT: Task shared via clipboard');
      }
    }
  },
  {
    id: 'extract_actions',
    label: 'Extract Actions',
    icon: '✅',
    onClick: (content) => {
      // Extract action items from the response
      console.log('🤖 ASSISTANT: Extracting action items from response:', content);
      // This could open a modal or highlight action items
    }
  }
];

// Assistant-specific management actions
const assistantManagementActions: ManagementAction[] = [
  {
    id: 'focus_mode',
    label: 'Focus',
    icon: '🎯',
    onClick: () => {
      console.log('🤖 ASSISTANT: Activating focus mode');
      // Could enable distraction-free mode
    }
  },
  {
    id: 'schedule_task',
    label: 'Schedule',
    icon: '📅',
    onClick: () => {
      console.log('🤖 ASSISTANT: Opening task scheduler');
      // Could integrate with calendar or task management
    }
  },
  {
    id: 'set_reminder',
    label: 'Remind',
    icon: '⏰',
    onClick: () => {
      console.log('🤖 ASSISTANT: Setting reminder');
      // Could set up notifications
    }
  }
];

// Create Assistant widget configuration
const assistantConfig = createWidgetConfig<AssistantWidgetParams, AssistantWidgetResult>({
  type: 'assistant',
  title: 'AI Assistant',
  icon: '🤖',
  sessionIdPrefix: 'assistant_widget',
  maxHistoryItems: 50, // Keep more history for conversations
  
  // Extract parameters from triggered input
  extractParamsFromInput: (input: string): AssistantWidgetParams => ({
    task: input.trim(),
    context: undefined // Will be populated from conversation context
  }),
  
  // Lifecycle callbacks
  onProcessStart: (params: AssistantWidgetParams) => {
    console.log('🤖 ASSISTANT_MODULE: Starting AI conversation:', params.task);
  },
  
  onProcessComplete: (result: AssistantWidgetResult) => {
    console.log('🤖 ASSISTANT_MODULE: AI conversation completed:', {
      hasResponse: !!result.response,
      suggestionCount: result.suggestions?.length || 0
    });
  },
  
  onProcessError: (error: Error) => {
    console.error('🤖 ASSISTANT_MODULE: AI conversation failed:', error.message);
  },
  
  // Custom actions
  editActions: assistantEditActions,
  managementActions: assistantManagementActions
});

// Module props interface
interface AssistantWidgetModuleProps {
  triggeredInput?: string;
  onResponseGenerated?: (result: AssistantWidgetResult) => void;
  children: (moduleProps: {
    isProcessing: boolean;
    conversationContext: any;
    onSendMessage: (params: AssistantWidgetParams) => Promise<void>;
    onClearContext: () => void;
  }) => ReactNode;
}

/**
 * Assistant Widget Module - Now powered by BaseWidgetModule
 * 
 * This module now:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Assistant-specific configuration and customizations
 * - Automatically handles output history, streaming, and UI actions
 * - Maintains all original functionality while adding new features
 */
export const AssistantWidgetModule: React.FC<AssistantWidgetModuleProps> = ({
  triggeredInput,
  onResponseGenerated,
  children
}) => {
  console.log('🤖 ASSISTANT_MODULE: Initializing with BaseWidgetModule architecture', {
    hasTriggeredInput: !!triggeredInput,
    hasCallback: !!onResponseGenerated
  });

  return (
    <BaseWidgetModule 
      config={assistantConfig}
      triggeredInput={triggeredInput}
      onResultGenerated={onResponseGenerated}
    >
      {(moduleProps) => {
        // Transform BaseWidgetModule props to match original AssistantWidgetModule interface
        const legacyProps = {
          isProcessing: moduleProps.isProcessing,
          conversationContext: moduleProps.currentOutput?.content || null,
          onSendMessage: async (params: AssistantWidgetParams) => {
            await moduleProps.startProcessing(params);
          },
          onClearContext: () => {
            moduleProps.onClearHistory();
          }
        };
        
        return children(legacyProps);
      }}
    </BaseWidgetModule>
  );
};

// Export the config for potential reuse
export { assistantConfig };