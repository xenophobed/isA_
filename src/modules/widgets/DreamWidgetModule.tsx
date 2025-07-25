/**
 * ============================================================================
 * Dream Widget Module (DreamWidgetModule.tsx) - Refactored with BaseWidgetModule
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Dream-specific configuration and customizations
 * - Manages AI image generation business logic with enhanced UI features
 * - Integrates seamlessly with BaseWidget UI components
 * 
 * Benefits of BaseWidgetModule integration:
 * - Automatic output history management for generated images
 * - Built-in edit and management actions
 * - Streaming status display
 * - Standard error handling and logging
 * - Consistent UI patterns across all widgets
 */
import React, { ReactNode } from 'react';
import { BaseWidgetModule, createWidgetConfig } from './BaseWidgetModule';
import { DreamWidgetParams, DreamWidgetResult } from '../../types/widgetTypes';
import { EditAction, ManagementAction } from '../../components/ui/widgets/BaseWidget';

// Dream-specific edit actions
const dreamEditActions: EditAction[] = [
  {
    id: 'download_image',
    label: 'Download',
    icon: '💾',
    onClick: (content) => {
      // Download generated image
      if (typeof content === 'string' && content.startsWith('http')) {
        const link = document.createElement('a');
        link.href = content;
        link.download = `dream_image_${Date.now()}.png`;
        link.target = '_blank';
        link.click();
      } else if (content?.imageUrl) {
        const link = document.createElement('a');
        link.href = content.imageUrl;
        link.download = `dream_image_${Date.now()}.png`;
        link.target = '_blank';
        link.click();
      }
      console.log('🎨 DREAM: Image download initiated');
    }
  },
  {
    id: 'view_full',
    label: 'View',
    icon: '🔍',
    onClick: (content) => {
      // Open image in new tab for full view
      const imageUrl = typeof content === 'string' ? content : content?.imageUrl;
      if (imageUrl) {
        window.open(imageUrl, '_blank');
        console.log('🎨 DREAM: Image opened in new tab');
      }
    }
  },
  {
    id: 'copy_url',
    label: 'Copy URL',
    icon: '🔗',
    onClick: (content) => {
      // Copy image URL to clipboard
      const imageUrl = typeof content === 'string' ? content : content?.imageUrl;
      if (imageUrl) {
        navigator.clipboard.writeText(imageUrl);
        console.log('🎨 DREAM: Image URL copied to clipboard');
      }
    }
  }
];

// Dream-specific management actions
const dreamManagementActions: ManagementAction[] = [
  {
    id: 'create_variation',
    label: 'Create',
    icon: '🎨',
    onClick: () => {
      console.log('🎨 DREAM: Creating new image variation');
      // Could trigger a variation of the last generated image
    }
  },
  {
    id: 'transform_style',
    label: 'Transform',
    icon: '✨',
    onClick: () => {
      console.log('🎨 DREAM: Transforming image style');
      // Could apply style transformations
    }
  },
  {
    id: 'enhance_quality',
    label: 'Enhance',
    icon: '⚡',
    onClick: () => {
      console.log('🎨 DREAM: Enhancing image quality');
      // Could trigger image enhancement
    }
  }
];

// Create Dream widget configuration
const dreamConfig = createWidgetConfig<DreamWidgetParams, DreamWidgetResult>({
  type: 'dream',
  title: 'AI Image Generator',
  icon: '🎨',
  sessionIdPrefix: 'dream_widget',
  maxHistoryItems: 30, // Keep more images for inspiration
  
  // Extract parameters from triggered input
  extractParamsFromInput: (input: string): DreamWidgetParams => ({
    prompt: input.trim(),
    mode: 'smart', // Default to smart mode
    style: 'photographic' // Default style
  }),
  
  // Lifecycle callbacks
  onProcessStart: (params: DreamWidgetParams) => {
    console.log('🎨 DREAM_MODULE: Starting image generation:', params.prompt);
  },
  
  onProcessComplete: (result: DreamWidgetResult) => {
    console.log('🎨 DREAM_MODULE: Image generation completed:', {
      hasImageUrl: !!result.imageUrl,
      prompt: result.prompt?.substring(0, 50)
    });
  },
  
  onProcessError: (error: Error) => {
    console.error('🎨 DREAM_MODULE: Image generation failed:', error.message);
  },
  
  // Custom actions
  editActions: dreamEditActions,
  managementActions: dreamManagementActions
});

// Module props interface
interface DreamWidgetModuleProps {
  triggeredInput?: string;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  children: (moduleProps: {
    isGenerating: boolean;
    generatedImage: string | null;
    lastParams: DreamWidgetParams | null;
    onGenerateImage: (params: DreamWidgetParams) => Promise<void>;
    onClearImage: () => void;
  }) => ReactNode;
}

/**
 * Dream Widget Module - Now powered by BaseWidgetModule
 * 
 * This module now:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Dream-specific configuration and customizations
 * - Automatically handles output history, streaming, and UI actions
 * - Maintains all original functionality while adding new features
 */
export const DreamWidgetModule: React.FC<DreamWidgetModuleProps> = ({
  triggeredInput,
  onImageGenerated,
  children
}) => {
  console.log('🎨 DREAM_MODULE: Initializing with BaseWidgetModule architecture', {
    hasTriggeredInput: !!triggeredInput,
    hasCallback: !!onImageGenerated
  });

  return (
    <BaseWidgetModule 
      config={dreamConfig}
      triggeredInput={triggeredInput}
      onResultGenerated={(result) => {
        // Transform result to expected format and call parent callback
        if (result?.imageUrl && result?.prompt) {
          onImageGenerated?.(result.imageUrl, result.prompt);
        }
      }}
    >
      {(moduleProps) => {
        // Transform BaseWidgetModule props to match original DreamWidgetModule interface
        const legacyProps = {
          isGenerating: moduleProps.isProcessing,
          generatedImage: moduleProps.currentOutput?.content || null,
          lastParams: moduleProps.currentOutput?.params || null,
          onGenerateImage: async (params: DreamWidgetParams) => {
            await moduleProps.startProcessing(params);
          },
          onClearImage: () => {
            moduleProps.onClearHistory();
          }
        };
        
        return children(legacyProps);
      }}
    </BaseWidgetModule>
  );
};

// Export the config for potential reuse
export { dreamConfig };