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

// Omni content type to MCP template mapping (基于实际可用的MCP prompts)
const OMNI_TEMPLATE_MAPPING = {
  // 基础内容类型 - 都使用general_content_prompt
  'general': {
    template_id: 'general_content_prompt'
  },
  'text': {
    template_id: 'general_content_prompt'
  },
  'code': {
    template_id: 'general_content_prompt'
  },
  'markdown': {
    template_id: 'general_content_prompt'
  },
  'email': {
    template_id: 'general_content_prompt'
  },
  'custom': {
    template_id: 'general_content_prompt'
  },
  
  // 专业领域 - 使用对应的专业prompts
  'business': {
    template_id: 'business_strategy_prompt'
  },
  'marketing': {
    template_id: 'content_marketing_prompt'
  },
  'social': {
    template_id: 'content_marketing_prompt'
  },
  'financial': {
    template_id: 'financial_analysis_prompt'
  },
  'market_analysis': {
    template_id: 'market_analysis_prompt'
  },
  'academic': {
    template_id: 'research_paper_prompt'
  },
  'science': {
    template_id: 'research_paper_prompt'
  },
  'education': {
    template_id: 'course_material_prompt'
  },
  'health': {
    template_id: 'wellness_guide_prompt'
  },
  'lifestyle': {
    template_id: 'general_content_prompt'
  },
  'professional': {
    template_id: 'general_content_prompt'
  },
  'news': {
    template_id: 'general_content_prompt'
  },
  'creative': {
    template_id: 'general_content_prompt'
  },
  'technology': {
    template_id: 'general_content_prompt'
  }
};

// Omni-specific template parameter preparation (基于MCP prompt参数要求)
const prepareOmniTemplateParams = (params: OmniWidgetParams & { 
  referenceUrls?: string[]; 
  referenceText?: string; 
  actualTopic?: string;
  templateId?: string;
}) => {
  const { 
    prompt, 
    contentType = 'text', 
    tone = 'professional', 
    length = 'medium',
    referenceUrls = [],
    referenceText = '',
    actualTopic,
    templateId
  } = params;
  
  // 使用实际的topic或者fallback到contentType
  const topicForMapping = actualTopic || contentType;
  const mapping = OMNI_TEMPLATE_MAPPING[topicForMapping as keyof typeof OMNI_TEMPLATE_MAPPING] || OMNI_TEMPLATE_MAPPING['general'];
  
  // 使用指定的templateId或者从mapping获取
  const final_template_id = templateId || mapping.template_id;
  
  // 构建符合MCP要求的prompt_args
  const prompt_args = {
    subject: prompt || 'Content generation request',
    depth: length === 'short' ? 'shallow' : 'deep', // 映射length到depth
    reference_urls: referenceUrls,
    reference_text: referenceText || `Create ${contentType} content with ${tone} tone. Focus on ${topicForMapping} domain expertise.`
  };
  
  console.log('⚡ OMNI_MODULE: Prepared template params for topic', topicForMapping, ':', {
    template_id: final_template_id,
    prompt_args,
    originalContentType: contentType
  });
  
  return {
    template_id: final_template_id,
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
  
  // Result extraction configuration
  resultExtractor: {
    outputType: 'text',
    extractResult: (widgetData: any) => {
      if (widgetData?.generatedContent) {
        return {
          finalResult: { 
            content: widgetData.generatedContent, 
            params: widgetData.params 
          },
          outputContent: widgetData.generatedContent,
          title: 'Content Generated'
        };
      }
      return null;
    }
  },
  
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
  const { generatedContent, lastParams } = useOmniState();
  
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
      onResultGenerated={onContentGenerated}
    >
      {(moduleProps) => {
        // Pass store state to OmniWidget via props with template support
        if (React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...children.props,
            // Store state
            generatedContent,
            isGenerating: moduleProps.isProcessing, // Use BaseWidgetModule's processing state
            lastParams,
            // Add onGenerateContent function with template parameter preparation
            onGenerateContent: async (params: OmniWidgetParams) => {
              // Prepare template parameters based on the content type
              const templateParams = prepareOmniTemplateParams(params);
              
              // Add template information to params before sending to store
              const enrichedParams = {
                prompt: params.prompt || '',
                contentType: (params.contentType === 'research' ? 'academic' : params.contentType) as any || 'text',
                tone: (params.tone === 'academic' ? 'professional' : params.tone) as any || 'professional',
                length: params.length as any || 'medium',
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
            currentOutput: moduleProps.currentOutput, // Use BaseWidgetModule's currentOutput
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