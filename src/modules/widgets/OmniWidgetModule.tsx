/**
 * ============================================================================
 * Omni Widget Module (OmniWidgetModule.tsx) - Refactored with BaseWidgetModule
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Omni-specific configuration and customizations
 * - Manages multi-purpose content generation business logic
 * - Integrates seamlessly with BaseWidget UI components
 * 
 * Benefits of BaseWidgetModule integration:
 * - Automatic output history management for generated content
 * - Built-in edit and management actions
 * - Streaming status display
 * - Standard error handling and logging
 * - Consistent UI patterns across all widgets
 */
import React, { ReactNode } from 'react';
import { BaseWidgetModule, createWidgetConfig } from './BaseWidgetModule';
import { OmniWidgetParams, OmniWidgetResult } from '../../types/widgetTypes';
import { EditAction, ManagementAction } from '../../components/ui/widgets/BaseWidget';
import { useOmniState } from '../../stores/useWidgetStores';

interface OmniWidgetModuleProps {
  triggeredInput?: string;
  onContentGenerated?: (result: OmniWidgetResult) => void;
  children: ReactNode;
}

/**
 * Omni Widget Module - Template mapping and configuration for multi-purpose content generation
 * 
 * Content Types:
 * - text: General text content creation
 * - code: Code generation and programming
 * - markdown: Documentation and structured content
 * - email: Email and communication writing
 * - social: Social media posts and content
 * - business: Business strategy and analysis
 * - academic: Research and academic writing
 */

// Omni content type to MCP template mapping
const OMNI_TEMPLATE_MAPPING = {
  'general': {
    template_id: 'general_content_prompt',
    focus: 'comprehensive_content'
  },
  'text': {
    template_id: 'general_content_prompt',
    focus: 'text_generation'
  },
  'code': {
    template_id: 'general_content_prompt',
    focus: 'code_generation'
  },
  'markdown': {
    template_id: 'general_content_prompt',
    focus: 'documentation_writing'
  },
  'email': {
    template_id: 'general_content_prompt',
    focus: 'communication_writing'
  },
  'social': {
    template_id: 'content_marketing_prompt',
    focus: 'social_media_content'
  },
  'business': {
    template_id: 'business_strategy_prompt',
    focus: 'business_content'
  },
  'academic': {
    template_id: 'research_paper_prompt',
    focus: 'academic_writing'
  },
  'marketing': {
    template_id: 'content_marketing_prompt',
    focus: 'marketing_content'
  },
  'financial': {
    template_id: 'financial_analysis_prompt',
    focus: 'financial_content'
  }
};

// Omni-specific template parameter preparation
const prepareOmniTemplateParams = (params: OmniWidgetParams) => {
  const { prompt, contentType = 'text', tone = 'professional', length = 'medium' } = params;
  
  const mapping = OMNI_TEMPLATE_MAPPING[contentType] || OMNI_TEMPLATE_MAPPING['general'];
  
  // Build prompt_args for content generation
  const prompt_args = {
    subject: prompt || 'Content generation request',
    content_type: contentType,
    tone: tone,
    length: length,
    depth: 'deep',
    reference_text: `Generate ${contentType} content with ${tone} tone and ${length} length`
  };
  
  console.log('⚡ OMNI_MODULE: Prepared template params for content type', contentType, ':', {
    template_id: mapping.template_id,
    prompt_args
  });
  
  return {
    template_id: mapping.template_id,
    prompt_args
  };
};

// Omni widget configuration
const omniWidgetConfig = createWidgetConfig({
  type: 'omni',
  title: 'Omni Content Generator',
  icon: '⚡',
  sessionIdPrefix: 'omni_widget',
  maxHistoryItems: 30,
  
  // Extract parameters from triggered input
  extractParamsFromInput: (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Determine content type based on keywords
    let contentType: 'text' | 'code' | 'markdown' | 'email' | 'social' | 'business' | 'academic' = 'text';
    let tone: 'professional' | 'casual' | 'creative' | 'technical' = 'professional';
    let length: 'short' | 'medium' | 'long' = 'medium';
    
    // Content type detection
    if (lowerInput.includes('code') || lowerInput.includes('program') || lowerInput.includes('script')) {
      contentType = 'code';
      tone = 'technical';
    } else if (lowerInput.includes('email') || lowerInput.includes('letter')) {
      contentType = 'email';
      tone = 'professional';
    } else if (lowerInput.includes('social') || lowerInput.includes('post') || lowerInput.includes('tweet')) {
      contentType = 'social';
      tone = 'casual';
      length = 'short';
    } else if (lowerInput.includes('markdown') || lowerInput.includes('documentation') || lowerInput.includes('readme')) {
      contentType = 'markdown';
      tone = 'technical';
    } else if (lowerInput.includes('business') || lowerInput.includes('strategy') || lowerInput.includes('analysis')) {
      contentType = 'business';
      tone = 'professional';
    } else if (lowerInput.includes('academic') || lowerInput.includes('research') || lowerInput.includes('paper')) {
      contentType = 'academic';
      tone = 'technical';
    }
    
    // Tone detection
    if (lowerInput.includes('casual') || lowerInput.includes('friendly') || lowerInput.includes('informal')) {
      tone = 'casual';
    } else if (lowerInput.includes('creative') || lowerInput.includes('artistic') || lowerInput.includes('fun')) {
      tone = 'creative';
    } else if (lowerInput.includes('technical') || lowerInput.includes('formal') || lowerInput.includes('detailed')) {
      tone = 'technical';
    }
    
    // Length detection
    if (lowerInput.includes('short') || lowerInput.includes('brief') || lowerInput.includes('quick')) {
      length = 'short';
    } else if (lowerInput.includes('long') || lowerInput.includes('detailed') || lowerInput.includes('comprehensive')) {
      length = 'long';
    }
    
    return {
      prompt: input.trim(),
      contentType,
      tone,
      length
    };
  },
  editActions: [
    {
      id: 'copy_content',
      label: 'Copy',
      icon: '📋',
      onClick: (content) => {
        navigator.clipboard.writeText(content);
        console.log('📋 Content copied to clipboard');
      }
    },
    {
      id: 'export_markdown', 
      label: 'Export MD',
      icon: '📝',
      onClick: (content) => {
        console.log('📝 Exporting as Markdown:', content);
      }
    },
    {
      id: 'refine_content',
      label: 'Refine',
      icon: '✨', 
      onClick: (content) => {
        console.log('✨ Refining content:', content);
      }
    }
  ],
  managementActions: [
    {
      id: 'content_types',
      label: 'Content Types',
      icon: '📑',
      onClick: () => console.log('📑 Content type selector'),
      variant: 'primary' as const,
      disabled: false
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: '📋',
      onClick: () => console.log('📋 Content templates library'),
      disabled: false
    },
    {
      id: 'tone_style',
      label: 'Tone & Style', 
      icon: '🎨',
      onClick: () => console.log('🎨 Tone and style settings'),
      disabled: false
    },
    {
      id: 'ai_models',
      label: 'AI Models',
      icon: '🧠',
      onClick: () => console.log('🧠 AI model selection - coming soon'),
      disabled: true
    }
  ]
});

/**
 * Omni Widget Module - Uses BaseWidgetModule with Omni-specific configuration
 */
export const OmniWidgetModule: React.FC<OmniWidgetModuleProps> = ({
  triggeredInput,
  onContentGenerated,
  children
}) => {
  // Read state from store
  const { generatedContent, isGenerating, lastParams } = useOmniState();
  
  // Convert generatedContent to outputHistory format for BaseWidget display
  const outputHistory = React.useMemo(() => {
    if (!generatedContent) {
      return [];
    }
    
    return [{
      id: `omni_result_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'generated_content',
      title: lastParams?.prompt ? `Generated: ${lastParams.prompt.substring(0, 50)}...` : 'Generated Content',
      content: generatedContent,
      metadata: {
        contentType: lastParams?.contentType || 'text',
        tone: lastParams?.tone || 'professional',
        length: lastParams?.length || 'medium',
        wordCount: generatedContent.split(' ').length
      }
    }];
  }, [generatedContent, lastParams]);
  
  console.log('⚡ OMNI_MODULE: Converting generated content to output history:', {
    hasContent: !!generatedContent,
    outputHistoryCount: outputHistory.length,
    latestResult: outputHistory[0]?.title
  });
  
  return (
    <BaseWidgetModule
      config={omniWidgetConfig}
      triggeredInput={triggeredInput}
      onCompleted={onContentGenerated}
    >
      {(moduleProps) => {
        // Pass store state to OmniWidget via props with template support
        if (React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...children.props,
            // Store state
            generatedContent,
            isGenerating,
            lastParams,
            // Add onGenerateContent function with template parameter preparation
            onGenerateContent: async (params: OmniWidgetParams) => {
              // Prepare template parameters based on the content type
              const templateParams = prepareOmniTemplateParams(params);
              
              // Add template information to params before sending to store
              const enrichedParams = {
                ...params,
                templateParams // Add template configuration
              };
              
              console.log('⚡ OMNI_MODULE: Sending enriched params to store:', enrichedParams);
              await moduleProps.startProcessing(enrichedParams);
            },
            // Add clear content function
            onClearContent: () => {
              console.log('⚡ OMNI_MODULE: Clearing content');
              moduleProps.onClearHistory();
            },
            // BaseWidget state with converted data
            outputHistory: outputHistory,
            currentOutput: outputHistory[0] || null,
            isStreaming: moduleProps.isStreaming,
            streamingContent: moduleProps.streamingContent,
            onSelectOutput: moduleProps.onSelectOutput,
            onClearHistory: moduleProps.onClearHistory
          });
        }
        return children;
      }}
    </BaseWidgetModule>
  );
};