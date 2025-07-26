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

// Dream mode to MCP template mapping (based on the 9 MCP prompts)
const DREAM_TEMPLATE_MAPPING = {
  'text_to_image': {
    template_id: 'text_to_image_prompt',
    defaultArgs: { style_preset: 'photorealistic', quality: 'high' }
  },
  'image_to_image': {
    template_id: 'image_to_image_prompt', 
    defaultArgs: { style_preset: 'enhanced', strength: 'medium' }
  },
  'style_transfer': {
    template_id: 'style_transfer_prompt',
    defaultArgs: { style_preset: 'impressionist', strength: 'medium' }
  },
  'face_swap': {
    template_id: 'face_swap_prompt',
    defaultArgs: { hair_source: 'preserve', quality: 'professional' }
  },
  'professional_headshot': {
    template_id: 'professional_headshot_prompt',
    defaultArgs: { industry: 'corporate', quality: 'executive' }
  },
  'emoji_generation': {
    template_id: 'emoji_generation_prompt',
    defaultArgs: { expression: 'happy', style_preset: 'kawaii', color_scheme: 'vibrant' }
  },
  'photo_inpainting': {
    template_id: 'photo_inpainting_prompt',
    defaultArgs: { fill_method: 'content_aware', strength: 'seamless' }
  },
  'photo_outpainting': {
    template_id: 'photo_outpainting_prompt', 
    defaultArgs: { direction: 'all_sides', strength: 'natural' }
  },
  'sticker_generation': {
    template_id: 'sticker_generation_prompt',
    defaultArgs: { style_preset: 'kawaii', theme: 'cute_animal' }
  }
};

// Prepare template parameters based on dream mode and user params
const prepareDreamTemplateParams = (params: DreamWidgetParams) => {
  const mode = params.style || 'text_to_image'; // Use 'style' field as mode
  const mapping = DREAM_TEMPLATE_MAPPING[mode] || DREAM_TEMPLATE_MAPPING['text_to_image'];
  
  // Build prompt_args based on the mode - ONLY include relevant parameters for each template
  // IMPORTANT: prompt must be first in the object!
  const prompt_args = {
    prompt: params.prompt || 'Generate an image',
    ...mapping.defaultArgs
  };
  
  // Add mode-specific parameters ONLY for the current template
  switch (mode) {
    case 'text_to_image':
      if (params.style_preset) prompt_args.style_preset = params.style_preset;
      if (params.quality) prompt_args.quality = params.quality;
      break;
      
    case 'image_to_image':
      if (params.style_preset) prompt_args.style_preset = params.style_preset;
      if (params.strength) prompt_args.strength = params.strength;
      break;
      
    case 'style_transfer':
      if (params.style_preset) prompt_args.style_preset = params.style_preset;
      if (params.strength) prompt_args.strength = params.strength;
      break;
      
    case 'face_swap':
      if (params.hair_source) prompt_args.hair_source = params.hair_source;
      if (params.quality) prompt_args.quality = params.quality;
      break;
      
    case 'professional_headshot':
      if (params.industry) prompt_args.industry = params.industry;
      if (params.quality) prompt_args.quality = params.quality;
      break;
      
    case 'emoji_generation':
      if (params.expression) prompt_args.expression = params.expression;
      if (params.style_preset) prompt_args.style_preset = params.style_preset;
      if (params.color_scheme) prompt_args.color_scheme = params.color_scheme;
      break;
      
    case 'photo_inpainting':
      if (params.fill_method) prompt_args.fill_method = params.fill_method;
      if (params.strength) prompt_args.strength = params.strength;
      break;
      
    case 'photo_outpainting':
      if (params.direction) prompt_args.direction = params.direction;
      if (params.strength) prompt_args.strength = params.strength;
      break;
      
    case 'sticker_generation':
      if (params.style_preset) prompt_args.style_preset = params.style_preset;
      if (params.theme) prompt_args.theme = params.theme;
      break;
  }
  
  console.log('🎨 DREAM_MODULE: Prepared template params for mode', mode, ':', {
    template_id: mapping.template_id,
    prompt_args
  });
  
  return {
    template_id: mapping.template_id,
    prompt_args
  };
};

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
  children: (moduleProps: {
    isGenerating: boolean;
    generatedImage: string | null;
    lastParams: DreamWidgetParams | null;
    onGenerateImage: (params: DreamWidgetParams) => Promise<void>;
    onClearImage: () => void;
    // Add BaseWidget props for UI display
    outputHistory: any[];
    currentOutput: any | null;
    isStreaming: boolean;
    streamingContent: string;
    onSelectOutput: (item: any) => void;
    onClearHistory: () => void;
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
  children
}) => {
  console.log('🎨 DREAM_MODULE: Initializing with BaseWidgetModule architecture', {
    hasTriggeredInput: !!triggeredInput
  });

  return (
    <BaseWidgetModule 
      config={dreamConfig}
      triggeredInput={triggeredInput}
    >
      {(moduleProps) => {
        // Transform BaseWidgetModule props to match original DreamWidgetModule interface
        const legacyProps = {
          isGenerating: moduleProps.isProcessing,
          generatedImage: moduleProps.currentOutput?.content || null,
          lastParams: moduleProps.currentOutput?.params || null,
          onGenerateImage: async (params: DreamWidgetParams) => {
            // Prepare template parameters based on the selected mode
            const templateParams = prepareDreamTemplateParams(params);
            
            // Add template information to params before sending to store
            const enrichedParams = {
              ...params,
              templateParams // Add template configuration
            };
            
            console.log('🎨 DREAM_MODULE: Sending enriched params to store:', enrichedParams);
            await moduleProps.startProcessing(enrichedParams);
          },
          onClearImage: () => {
            moduleProps.onClearHistory();
          },
          // Pass through BaseWidget props for UI display
          outputHistory: moduleProps.outputHistory,
          currentOutput: moduleProps.currentOutput,
          isStreaming: moduleProps.isStreaming,
          streamingContent: moduleProps.streamingContent,
          onSelectOutput: moduleProps.onSelectOutput,
          onClearHistory: moduleProps.onClearHistory
        };
        
        return children(legacyProps);
      }}
    </BaseWidgetModule>
  );
};

// Export the config for potential reuse
export { dreamConfig };