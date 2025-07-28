/**
 * ============================================================================
 * Omni Widget UI (OmniWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Multi-topic content generation system using standardized BaseWidget layout
 * - 10 topic categories with intelligent template selection
 * - Deep configuration and reference material management
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in content generation history management
 * - Consistent edit and management actions for generated content
 * - Streaming status display for generation progress
 * - Content-specific actions (export, refine, share)
 */
import React, { useState } from 'react';
import { OmniWidgetParams } from '../../../types/widgetTypes';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction, EmptyStateConfig } from './BaseWidget';

interface OmniWidgetProps {
  isGenerating: boolean;
  generatedContent: string | null;
  lastParams: OmniWidgetParams | null;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onGenerateContent: (params: OmniWidgetParams) => Promise<void>;
  onClearContent: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
  onBack?: () => void;
}

// Content Generation Arguments (copied from omni_sidebar.tsx)
interface ContentGenerationArgs {
  topic: string;
  template: string;
  subject: string;
  referenceUrls: string[];
  referenceFiles: File[];
  referenceText: string;
  depth: 'shallow' | 'deep';
}

// Template configuration (copied from omni_sidebar.tsx)
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  default?: boolean;
  promptTemplate: (args: ContentGenerationArgs) => string;
}

// Topic-specific configurations (copied from omni_sidebar.tsx)
interface TopicConfig {
  name: string;
  description: string;
  templates: TemplateConfig[];
}

/**
 * Omni Widget Input Area - Content that goes inside BaseWidget
 */
const OmniInputArea: React.FC<OmniWidgetProps> = ({
  isGenerating,
  generatedContent,
  lastParams,
  triggeredInput,
  onGenerateContent,
  onClearContent
}) => {
  // Content Generation Arguments (exact copy from omni_sidebar.tsx)
  const [args, setArgs] = useState<ContentGenerationArgs>({
    topic: 'custom',
    template: 'general', // default template for custom topic
    subject: '',
    referenceUrls: [],
    referenceFiles: [],
    referenceText: '',
    depth: 'deep'
  });

  // Auto-fill input when triggered (exact copy from omni_sidebar.tsx)
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== args.subject) {
      setArgs(prev => ({ ...prev, subject: triggeredInput }));
      
      // Smart topic detection (exact copy from omni_sidebar.tsx)
      const input = triggeredInput.toLowerCase();
      if (input.includes('business') || input.includes('sales')) setArgs(prev => ({ ...prev, topic: 'business' }));
      else if (input.includes('education') || input.includes('learn')) setArgs(prev => ({ ...prev, topic: 'education' }));
      else if (input.includes('tech') || input.includes('software')) setArgs(prev => ({ ...prev, topic: 'technology' }));
      else if (input.includes('social') || input.includes('post')) setArgs(prev => ({ ...prev, topic: 'marketing' }));
      else if (input.includes('health') || input.includes('wellness')) setArgs(prev => ({ ...prev, topic: 'health' }));
      else if (input.includes('lifestyle') || input.includes('personal')) setArgs(prev => ({ ...prev, topic: 'lifestyle' }));
      else if (input.includes('career') || input.includes('professional')) setArgs(prev => ({ ...prev, topic: 'professional' }));
      else if (input.includes('news') || input.includes('current')) setArgs(prev => ({ ...prev, topic: 'news' }));
      else if (input.includes('creative') || input.includes('story')) setArgs(prev => ({ ...prev, topic: 'creative' }));
      else if (input.includes('science') || input.includes('research')) setArgs(prev => ({ ...prev, topic: 'science' }));
      else setArgs(prev => ({ ...prev, topic: 'custom', template: 'general' }));
    }
  }, [triggeredInput]);

  // Topic Configurations with multiple templates (ALL 10 TOPICS) - exact copy from omni_sidebar.tsx
  const topicConfigs: Record<string, TopicConfig> = {
    custom: {
      name: 'Custom',
      description: 'General purpose content generation',
      templates: [
        {
          id: 'general',
          name: 'General Content',
          description: 'All-purpose content creation',
          default: true,
          promptTemplate: (args) => `You are an expert content creator with research capabilities.

TASK: Create content about "${args.subject}"
DEPTH: ${args.depth} analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

Begin your research and content creation now.`
        },
        {
          id: 'research',
          name: 'Research Report',
          description: 'In-depth research and analysis',
          promptTemplate: (args) => `You are a research analyst with access to comprehensive data sources.

TASK: Create a detailed research report about "${args.subject}"
DEPTH: ${args.depth} research analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

RESEARCH DELIVERABLES:
- Executive summary
- Key findings and insights
- Supporting data and evidence
- Conclusions and recommendations

Begin your comprehensive research now.`
        }
      ]
    },
    
    business: {
      name: 'Business & Commerce',
      description: 'Market analysis, strategy, finance, case studies',
      templates: [
        {
          id: 'market_analysis',
          name: 'Market Analysis',
          description: 'Market research and competitive analysis',
          default: true,
          promptTemplate: (args) => `You are a market research analyst with access to industry data and competitive intelligence.

TASK: Create comprehensive market analysis about "${args.subject}"
DEPTH: ${args.depth} market analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

MARKET ANALYSIS FOCUS:
- Market size and growth trends
- Competitive landscape mapping
- Key players and market share
- Opportunities and threats

DELIVERABLES:
- Market overview and sizing
- Competitive analysis
- Growth opportunities
- Strategic recommendations

Begin your market research now.`
        },
        {
          id: 'business_strategy',
          name: 'Business Strategy',
          description: 'Strategic planning and business development',
          promptTemplate: (args) => `You are a business strategy consultant with expertise in strategic planning and business development.

TASK: Create business strategy content about "${args.subject}"
DEPTH: ${args.depth} strategic analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

STRATEGY FOCUS:
- Strategic objectives and goals
- SWOT analysis
- Implementation roadmap
- Risk assessment and mitigation

DELIVERABLES:
- Strategic framework
- Action plans
- Success metrics
- Implementation timeline

Begin your strategic analysis now.`
        },
        {
          id: 'financial_analysis',
          name: 'Financial Analysis',
          description: 'Financial modeling and investment analysis',
          promptTemplate: (args) => `You are a financial analyst with expertise in financial modeling and investment analysis.

TASK: Create financial analysis content about "${args.subject}"
DEPTH: ${args.depth} financial analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

FINANCIAL FOCUS:
- Financial performance metrics
- Valuation analysis
- ROI and profitability
- Financial projections

DELIVERABLES:
- Financial models
- Performance analysis
- Investment recommendations
- Risk assessment

Begin your financial analysis now.`
        }
      ]
    },
    
    education: {
      name: 'Education & Learning',
      description: 'Tutorials, courses, research, learning materials',
      templates: [
        {
          id: 'tutorial',
          name: 'Tutorial',
          description: 'Step-by-step instructional content',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are an educational content developer specializing in tutorials and step-by-step instruction.

TASK: Create tutorial content about "${args.subject}"
DEPTH: ${args.depth} instructional experience

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

TUTORIAL FOCUS:
- Clear step-by-step instructions
- Learning objectives for each section
- Practical examples and exercises
- Progress checkpoints

DELIVERABLES:
- Structured tutorial with numbered steps
- Examples and practice exercises
- Prerequisites and requirements
- Expected outcomes

Begin creating the tutorial content now.`
        },
        {
          id: 'course',
          name: 'Course Material',
          description: 'Comprehensive educational curriculum',
          promptTemplate: (args: ContentGenerationArgs) => `You are a curriculum designer and educational content expert.

TASK: Create course material about "${args.subject}"
DEPTH: ${args.depth} educational curriculum

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

COURSE FOCUS:
- Comprehensive curriculum structure
- Learning modules and units
- Assessment and evaluation methods
- Interactive learning activities

DELIVERABLES:
- Course outline and syllabus
- Module content and materials
- Assignments and assessments
- Resource recommendations

Begin developing the course content now.`
        }
      ]
    },
    
    technology: {
      name: 'Technology & Innovation',
      description: 'Tech reviews, analysis, guides, implementation',
      templates: [
        {
          id: 'tech_review',
          name: 'Tech Review',
          description: 'Technology evaluation and comparison',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a technology analyst and product reviewer with expertise in emerging technologies.

TASK: Create technology review about "${args.subject}"
DEPTH: ${args.depth} technical review

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

REVIEW FOCUS:
- Feature analysis and capabilities
- Performance benchmarks
- Pros and cons evaluation
- Competitive comparison

DELIVERABLES:
- Comprehensive product review
- Feature comparison matrix
- Performance analysis
- Recommendation summary

Begin your technology review now.`
        },
        {
          id: 'implementation_guide',
          name: 'Implementation Guide',
          description: 'Technical implementation and setup',
          promptTemplate: (args: ContentGenerationArgs) => `You are a technical implementation specialist and systems architect.

TASK: Create implementation guide for "${args.subject}"
DEPTH: ${args.depth} implementation guide

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

IMPLEMENTATION FOCUS:
- Step-by-step setup instructions
- System requirements and dependencies
- Configuration and customization
- Testing and validation

DELIVERABLES:
- Detailed implementation steps
- Code examples and configurations
- Troubleshooting guide
- Best practices and recommendations

Begin creating the implementation guide now.`
        }
      ]
    },
    
    marketing: {
      name: 'Marketing & Media',
      description: 'Campaigns, brand strategy, content marketing',
      templates: [
        {
          id: 'campaign',
          name: 'Campaign Strategy',
          description: 'Marketing campaign planning and execution',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a marketing campaign strategist with expertise in multi-channel marketing.

TASK: Create campaign strategy for "${args.subject}"
DEPTH: ${args.depth} campaign analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

CAMPAIGN FOCUS:
- Target audience segmentation
- Channel strategy and media mix
- Creative messaging and positioning
- Budget allocation and ROI projections

Begin your campaign strategy development now.`
        },
        {
          id: 'content_marketing',
          name: 'Content Marketing',
          description: 'Content strategy and creation',
          promptTemplate: (args: ContentGenerationArgs) => `You are a content marketing specialist focused on engaging content creation.

TASK: Create content marketing strategy for "${args.subject}"
DEPTH: ${args.depth} content strategy

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

CONTENT FOCUS:
- Content pillars and themes
- Editorial calendar and distribution
- Audience engagement strategies
- Content performance metrics

Begin your content marketing development now.`
        }
      ]
    },
    
    health: {
      name: 'Health & Wellness',
      description: 'Medical info, wellness guides, health analysis',
      templates: [
        {
          id: 'wellness_guide',
          name: 'Wellness Guide',
          description: 'Health and wellness guidance',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a health and wellness expert with access to medical research.

TASK: Create wellness guide about "${args.subject}"
DEPTH: ${args.depth} health analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

WELLNESS FOCUS:
- Evidence-based health information
- Practical wellness strategies
- Safety considerations and disclaimers
- Professional recommendations

Begin creating the wellness guide now.`
        }
      ]
    },
    
    lifestyle: {
      name: 'Lifestyle & Personal',
      description: 'Personal development, productivity, lifestyle',
      templates: [
        {
          id: 'productivity',
          name: 'Productivity Guide',
          description: 'Productivity tips and systems',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a productivity expert and personal development coach.

TASK: Create productivity guide about "${args.subject}"
DEPTH: ${args.depth} productivity analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

PRODUCTIVITY FOCUS:
- Time management strategies
- Workflow optimization
- Habit formation techniques
- Work-life balance

Begin creating the productivity guide now.`
        }
      ]
    },
    
    professional: {
      name: 'Professional & Career',
      description: 'Career development, workplace skills, leadership',
      templates: [
        {
          id: 'career_guide',
          name: 'Career Guide',
          description: 'Career development and advancement',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a career development expert and executive coach.

TASK: Create career guide about "${args.subject}"
DEPTH: ${args.depth} career analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

CAREER FOCUS:
- Professional development strategies
- Leadership and management skills
- Networking and relationship building
- Career advancement tactics

Begin creating the career guide now.`
        }
      ]
    },
    
    news: {
      name: 'News & Current Events',
      description: 'Current events, analysis, reporting',
      templates: [
        {
          id: 'news_analysis',
          name: 'News Analysis',
          description: 'Current events analysis and reporting',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a journalist and news analyst with access to current information sources.

TASK: Create news analysis about "${args.subject}"
DEPTH: ${args.depth} news analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

NEWS FOCUS:
- Factual reporting and verification
- Multiple perspectives and sources
- Context and background information
- Impact assessment and implications

Begin your news analysis now.`
        }
      ]
    },
    
    creative: {
      name: 'Creative & Artistic',
      description: 'Creative writing, storytelling, artistic content',
      templates: [
        {
          id: 'storytelling',
          name: 'Storytelling',
          description: 'Creative writing and narrative',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a creative writer and storytelling expert with artistic expertise.

TASK: Create creative content about "${args.subject}"
DEPTH: ${args.depth} creative exploration

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

CREATIVE FOCUS:
- Original storytelling and narrative
- Character development and plot
- Artistic expression and creativity
- Emotional resonance and engagement

Begin your creative writing now.`
        }
      ]
    },
    
    science: {
      name: 'Science & Research',
      description: 'Scientific research, analysis, explanations',
      templates: [
        {
          id: 'research_paper',
          name: 'Research Analysis',
          description: 'Scientific research and analysis',
          default: true,
          promptTemplate: (args: ContentGenerationArgs) => `You are a scientific researcher and science communicator with access to peer-reviewed sources.

TASK: Create scientific analysis about "${args.subject}"
DEPTH: ${args.depth} scientific analysis

REFERENCES PROVIDED:
${args.referenceUrls.length > 0 ? '- URLs: ' + args.referenceUrls.join(', ') : ''}
${args.referenceText ? '- Additional context: ' + args.referenceText : ''}

SCIENTIFIC FOCUS:
- Evidence-based research methodology
- Peer-reviewed source verification
- Clear scientific explanation
- Proper citations and references

Begin your scientific analysis now.`
        }
      ]
    }
  };
  
  // Topic Categories for UI (all 10 categories + custom) - exact copy from omni_sidebar.tsx
  const topicCategories = [
    { id: 'custom', title: 'Custom', icon: '⚡' },
    { id: 'business', title: 'Business & Commerce', icon: '💼' },
    { id: 'education', title: 'Education & Learning', icon: '📚' },
    { id: 'technology', title: 'Technology & Innovation', icon: '💻' },
    { id: 'marketing', title: 'Marketing & Media', icon: '📢' },
    { id: 'health', title: 'Health & Wellness', icon: '⚕️' },
    { id: 'lifestyle', title: 'Lifestyle & Personal', icon: '🌟' },
    { id: 'professional', title: 'Professional & Career', icon: '👔' },
    { id: 'news', title: 'News & Current Events', icon: '📰' },
    { id: 'creative', title: 'Creative & Artistic', icon: '🎨' },
    { id: 'science', title: 'Science & Research', icon: '🔬' },
  ];

  // Update args helper (exact copy from omni_sidebar.tsx)
  const updateArgs = (key: keyof ContentGenerationArgs, value: any) => {
    setArgs(prev => {
      const updated = { ...prev, [key]: value };
      
      // When topic changes, reset to default template
      if (key === 'topic' && topicConfigs[value]) {
        const defaultTemplate = topicConfigs[value].templates.find(t => t.default) || topicConfigs[value].templates[0];
        updated.template = defaultTemplate?.id || 'general';
      }
      
      return updated;
    });
  };
  
  // File upload handler (exact copy from omni_sidebar.tsx)
  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setArgs(prev => ({
        ...prev,
        referenceFiles: [...prev.referenceFiles, ...newFiles]
      }));
    }
  };
  
  // Add URL to reference list (exact copy from omni_sidebar.tsx)
  const addReferenceUrl = () => {
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      setArgs(prev => ({
        ...prev,
        referenceUrls: [...prev.referenceUrls, url.trim()]
      }));
    }
  };
  
  // Generate topic-specific prompt template (exact copy from omni_sidebar.tsx)
  const generatePromptTemplate = (args: ContentGenerationArgs): string => {
    const topicConfig = topicConfigs[args.topic];
    if (topicConfig) {
      const template = topicConfig.templates.find(t => t.id === args.template);
      if (template) {
        return template.promptTemplate(args);
      }
    }
    
    // Fallback to custom general template
    return topicConfigs['custom'].templates[0].promptTemplate(args);
  };
  
  // Get current template info (exact copy from omni_sidebar.tsx)
  const getCurrentTemplate = () => {
    const topicConfig = topicConfigs[args.topic];
    if (topicConfig) {
      return topicConfig.templates.find(t => t.id === args.template);
    }
    return topicConfigs['custom'].templates[0];
  };
  
  // 映射OmniWidget的复杂topic/template配置到MCP prompt的函数
  const mapTopicTemplateToMCP = (topic: string, template: string) => {
    // 基于topic和template的组合来确定最合适的MCP prompt
    const combinations = {
      // Business combinations
      'business.market_analysis': { mcpTopic: 'market_analysis', templateId: 'market_analysis_prompt' },
      'business.business_strategy': { mcpTopic: 'business', templateId: 'business_strategy_prompt' },
      'business.financial_analysis': { mcpTopic: 'financial', templateId: 'financial_analysis_prompt' },
      
      // Education combinations  
      'education.tutorial': { mcpTopic: 'education', templateId: 'course_material_prompt' },
      'education.course': { mcpTopic: 'education', templateId: 'course_material_prompt' },
      
      // Marketing combinations
      'marketing.campaign': { mcpTopic: 'marketing', templateId: 'content_marketing_prompt' },
      'marketing.content_marketing': { mcpTopic: 'marketing', templateId: 'content_marketing_prompt' },
      
      // Health combinations
      'health.wellness_guide': { mcpTopic: 'health', templateId: 'wellness_guide_prompt' },
      
      // Science combinations
      'science.research_paper': { mcpTopic: 'science', templateId: 'research_paper_prompt' },
      
      // Technology combinations
      'technology.tech_review': { mcpTopic: 'technology', templateId: 'general_content_prompt' },
      'technology.implementation_guide': { mcpTopic: 'technology', templateId: 'general_content_prompt' },
    };
    
    const key = `${topic}.${template}`;
    return combinations[key as keyof typeof combinations] || { 
      mcpTopic: topic, 
      templateId: 'general_content_prompt' 
    };
  };

  const handleGenerate = async () => {
    if (!args.subject.trim() || !onGenerateContent || isGenerating) {
      console.log('⚡ OMNI: Aborting generation - invalid input');
      return;
    }

    try {
      // 获取当前模板生成的prompt (用于reference_text)
      const generatedPrompt = generatePromptTemplate(args);
      
      // 映射topic和template到MCP配置
      const mcpMapping = mapTopicTemplateToMCP(args.topic, args.template);
      
      console.log('⚡ OMNI: Selected topic:', args.topic);
      console.log('⚡ OMNI: Selected template:', args.template);
      console.log('⚡ OMNI: MCP mapping:', mcpMapping);
      console.log('⚡ OMNI: Topic config exists:', !!topicConfigs[args.topic]);
      console.log('⚡ OMNI: Template info:', getCurrentTemplate());
      
      const params: OmniWidgetParams & { 
        referenceUrls?: string[]; 
        referenceText?: string; 
        actualTopic?: string;
        templateId?: string;
      } = {
        prompt: args.subject, // 使用用户输入的subject而不是生成的prompt
        contentType: args.topic as any,
        tone: 'professional',
        length: args.depth === 'deep' ? 'long' : 'medium',
        // 添加MCP需要的参数
        referenceUrls: args.referenceUrls,
        referenceText: args.referenceText || generatedPrompt, // 使用生成的prompt作为reference
        actualTopic: mcpMapping.mcpTopic,
        templateId: mcpMapping.templateId
      };
      
      console.log('⚡ OMNI: Final params for MCP:', params);
      await onGenerateContent(params);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div className="space-y-4 p-3">
      {/* Compact Mode Header - like DreamWidget and HuntWidget */}
      <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded border border-green-500/20">
        <span className="text-lg">{topicCategories.find(t => t.id === args.topic)?.icon || '⚡'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {topicCategories.find(t => t.id === args.topic)?.title || 'Custom'}
          </div>
          <div className="flex gap-3 text-xs text-white/50">
            <span>{args.depth === 'deep' ? 'Deep Analysis' : 'Quick Overview'}</span>
            <span>Content Generation</span>
          </div>
        </div>
      </div>

      {/* What to Create - Input Area */}
      <div className="space-y-3">
        <textarea
          value={args.subject}
          onChange={(e) => updateArgs('subject', e.target.value)}
          placeholder="Describe what you want to create..."
          className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-sm"
          rows={2}
        />
      </div>

      {/* Topic Selection - 3x3 grid with scrolling for remaining topics */}
      <div>
        <div className="text-xs text-white/60 mb-2">🎯 Select Topic</div>
        <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
          {topicCategories.map((topic) => (
            <button
              key={topic.id}
              onClick={() => updateArgs('topic', topic.id)}
              className={`p-1.5 rounded border transition-all text-center ${
                args.topic === topic.id
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer'
              }`}
              title={`${topic.title} - ${topicConfigs[topic.id]?.description || 'General purpose content'}`}
            >
              <div className="text-xs mb-0.5">{topic.icon}</div>
              <div className="text-xs font-medium truncate leading-tight">{topic.title.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-2">
        <div className="text-xs text-white/60">⚙️ Advanced Options</div>
        
        {/* Depth Selection */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Analysis Depth</label>
          <select
            value={args.depth}
            onChange={(e) => updateArgs('depth', e.target.value as 'shallow' | 'deep')}
            className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-white text-xs"
          >
            <option value="shallow">Shallow - Quick overview</option>
            <option value="deep">Deep - Comprehensive</option>
          </select>
        </div>
        
        {/* References */}
        <div>
          <label className="block text-xs text-white/60 mb-1">References</label>
          <div className="grid grid-cols-2 gap-1 mb-1">
            <button
              onClick={addReferenceUrl}
              className="p-1.5 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-all text-xs"
            >
              🔗 URL
            </button>
            <label className="p-1.5 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-all text-xs cursor-pointer text-center">
              📁 Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            value={args.referenceText}
            onChange={(e) => updateArgs('referenceText', e.target.value)}
            placeholder="Additional context..."
            className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-xs"
            rows={2}
          />
        </div>
      </div>
      
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !args.subject.trim()}
        className={`w-full p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded text-white font-medium transition-all hover:from-green-600 hover:to-blue-600 flex items-center justify-center gap-2 text-sm ${
          isGenerating ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGenerating ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Generating...
          </>
        ) : (
          <>
            <span>{topicCategories.find(t => t.id === args.topic)?.icon || '⚡'}</span>
            Generate {topicConfigs[args.topic]?.name || 'Content'}
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Omni Widget with BaseWidget - New standardized layout
 */
export const OmniWidget: React.FC<OmniWidgetProps> = ({
  isGenerating,
  generatedContent,
  lastParams,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onGenerateContent,
  onClearContent,
  onSelectOutput,
  onClearHistory,
  onBack
}) => {
  
  // Custom edit actions for generated content
  const editActions: EditAction[] = [
    {
      id: 'refine',
      label: 'Refine',
      icon: '✨',
      onClick: (content) => {
        // Trigger content refinement
        console.log('Refining content:', content);
      }
    },
    {
      id: 'export_doc',
      label: 'Export Doc',
      icon: '📄',
      onClick: (content) => {
        // Export as document
        if (typeof content === 'string') {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `omni_content_${Date.now()}.txt`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: '📈',
      onClick: (content) => {
        // Expand content with more details
        console.log('Expanding content:', content);
      }
    }
  ];

  // Custom management actions for content generation - only 4 needed actions
  const managementActions: ManagementAction[] = [
    {
      id: 'doc',
      label: 'Doc',
      icon: '📝',
      onClick: () => onGenerateContent({ 
        prompt: 'Generate document content',
        contentType: 'text',
        tone: 'professional',
        length: 'medium'
      }),
      variant: 'primary' as const,
      disabled: false
    },
    {
      id: 'presentation',
      label: 'Presentation',
      icon: '📊',
      onClick: () => onGenerateContent({ 
        prompt: 'Create presentation content',
        contentType: 'text',
        tone: 'professional',
        length: 'medium'
      }),
      disabled: false
    },
    {
      id: 'infographic',
      label: 'Infographic',
      icon: '📈',
      onClick: () => onGenerateContent({ 
        prompt: 'Create infographic content',
        contentType: 'text',
        tone: 'professional',
        length: 'short'
      }),
      disabled: false
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📄',
      onClick: () => onGenerateContent({ 
        prompt: 'Generate custom content',
        contentType: 'text',
        tone: 'professional',
        length: 'medium'
      }),
      disabled: false
    }
  ];

  // Custom empty state for Omni Widget
  const omniEmptyState: EmptyStateConfig = {
    icon: '⚡',
    title: 'Ready to Create Anything',
    description: 'Generate content across 10 different categories including business, education, technology, marketing, and more. Choose your topic and let AI create exactly what you need.',
    actionText: 'Choose Topic',
    onAction: () => {
      const firstCategory = document.querySelector('.topic-category-button') as HTMLElement;
      firstCategory?.focus();
    }
  };

  return (
    <BaseWidget
      title="Omni Content"
      icon="⚡"
      isProcessing={isGenerating}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
      emptyStateConfig={omniEmptyState}
      onBack={onBack}
      showBackButton={true}
    >
      <OmniInputArea
        isGenerating={isGenerating}
        generatedContent={generatedContent}
        lastParams={lastParams}
        triggeredInput={triggeredInput}
        onGenerateContent={onGenerateContent}
        onClearContent={onClearContent}
      />
    </BaseWidget>
  );
};