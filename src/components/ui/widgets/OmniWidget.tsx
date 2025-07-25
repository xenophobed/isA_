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
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

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
  
  // Remove file from references (exact copy from omni_sidebar.tsx)
  const removeReferenceFile = (index: number) => {
    setArgs(prev => ({
      ...prev,
      referenceFiles: prev.referenceFiles.filter((_, i) => i !== index)
    }));
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
  
  // Remove URL from reference list (exact copy from omni_sidebar.tsx)
  const removeReferenceUrl = (index: number) => {
    setArgs(prev => ({
      ...prev,
      referenceUrls: prev.referenceUrls.filter((_, i) => i !== index)
    }));
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
  
  const handleGenerate = async () => {
    if (!args.subject.trim() || !onGenerateContent || isGenerating) {
      console.log('⚡ OMNI: Aborting generation - invalid input');
      return;
    }

    try {
      const prompt = generatePromptTemplate(args);
      console.log('⚡ OMNI: Selected topic:', args.topic);
      console.log('⚡ OMNI: Selected template:', args.template);
      console.log('⚡ OMNI: Topic config exists:', !!topicConfigs[args.topic]);
      console.log('⚡ OMNI: Template info:', getCurrentTemplate());
      console.log('⚡ OMNI: Generated prompt preview:', prompt.substring(0, 200) + '...');
      
      const params: OmniWidgetParams = {
        prompt: prompt,
        contentType: args.topic as any,
        tone: 'professional',
        length: args.depth === 'deep' ? 'long' : 'medium'
      };
      
      await onGenerateContent(params);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Main Content - No Scroll Needed */}
      <div className="flex-1 space-y-4 min-h-0">
        {/* What to Create - Top Priority */}
        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">💭 What do you want to create?</label>
          <textarea
            value={args.subject}
            onChange={(e) => updateArgs('subject', e.target.value)}
            placeholder="E.g., 'Guide to sustainable living' or 'B2B pricing analysis'"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
          />
        </div>

        {/* Topic Selection - Dropdown */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">🎯 Topic</label>
            <select
              value={args.topic}
              onChange={(e) => updateArgs('topic', e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              {topicCategories.map((topic) => (
                <option key={topic.id} value={topic.id} className="bg-gray-800">
                  {topic.icon} {topic.title}
                </option>
              ))}
            </select>
            {topicConfigs[args.topic] && (
              <div className="text-xs text-white/60 mt-1">
                📋 {topicConfigs[args.topic].description}
              </div>
            )}
          </div>
          
          {/* Depth Selection */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">📊 Depth</label>
            <select
              value={args.depth}
              onChange={(e) => updateArgs('depth', e.target.value as 'shallow' | 'deep')}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="shallow" className="bg-gray-800">🔍 Shallow - Quick overview</option>
              <option value="deep" className="bg-gray-800">🧠 Deep - Comprehensive</option>
            </select>
          </div>
        </div>
        
        {/* Template Selection */}
        {topicConfigs[args.topic] && (
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">📋 Template</label>
            <select
              value={args.template}
              onChange={(e) => updateArgs('template', e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              {topicConfigs[args.topic].templates.map((template) => (
                <option key={template.id} value={template.id} className="bg-gray-800">
                  {template.name}
                </option>
              ))}
            </select>
            {getCurrentTemplate() && (
              <div className="text-xs text-blue-300 mt-1">
                📝 {getCurrentTemplate()?.description}
              </div>
            )}
          </div>
        )}
        
        {/* References Section - Compact */}
        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">📚 References</label>
          
          {/* Reference Input Row */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={addReferenceUrl}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-all text-xs"
            >
              🔗 Add URL
            </button>
            
            <label className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-all text-xs cursor-pointer text-center">
              📁 Upload Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Reference Display - Compact */}
          {(args.referenceUrls.length > 0 || args.referenceFiles.length > 0 || args.referenceText) && (
            <div className="bg-white/5 rounded-lg p-2 max-h-20 overflow-y-auto">
              {/* URLs */}
              {args.referenceUrls.map((url, index) => (
                <div key={`url-${index}`} className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-blue-300">🔗</span>
                  <span className="flex-1 text-white/80 truncate">{url}</span>
                  <button
                    onClick={() => removeReferenceUrl(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Files */}
              {args.referenceFiles.map((file, index) => (
                <div key={`file-${index}`} className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-green-300">📁</span>
                  <span className="flex-1 text-white/80 truncate">{file.name}</span>
                  <button
                    onClick={() => removeReferenceFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Text Preview */}
              {args.referenceText && (
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-yellow-300">📝</span>
                  <span className="flex-1 text-white/80 truncate">
                    {args.referenceText.substring(0, 50)}{args.referenceText.length > 50 ? '...' : ''}
                  </span>
                  <button
                    onClick={() => updateArgs('referenceText', '')}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Reference Text Input */}
          <textarea
            value={args.referenceText}
            onChange={(e) => updateArgs('referenceText', e.target.value)}
            placeholder="Additional context or instructions..."
            className="w-full mt-2 p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-xs"
            rows={2}
          />
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !args.subject.trim()}
          className={`w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
            isGenerating ? 'animate-pulse' : 'hover:from-blue-600 hover:to-purple-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <span>🚀</span>
              Generate {getCurrentTemplate()?.name || 'Content'}
            </>
          )}
        </button>
        
        {/* Generation Status */}
        {isGenerating && (
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="text-sm text-blue-300 font-medium">
                Agentic AI at work...
              </span>
            </div>
            
            <div className="text-xs text-white/60 space-y-1">
              <div>• Researching topic with web search</div>
              <div>• Analyzing sources and trends</div>
              <div>• Generating sophisticated content</div>
              <div>• Results will appear in chat with citations</div>
            </div>
          </div>
        )}
      </div>
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
  onClearHistory
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

  // Custom management actions for content generation
  const managementActions: ManagementAction[] = [
    {
      id: 'blog_post',
      label: 'Blog',
      icon: '📝',
      onClick: () => onGenerateContent({ 
        prompt: 'Generate a blog post',
        contentType: 'text',
        tone: 'professional',
        length: 'medium'
      }),
      disabled: isGenerating
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: '📊',
      onClick: () => onGenerateContent({ 
        prompt: 'Create marketing content',
        contentType: 'text',
        tone: 'creative',
        length: 'short'
      }),
      disabled: isGenerating
    },
    {
      id: 'research',
      label: 'Research',
      icon: '🔬',
      onClick: () => onGenerateContent({ 
        prompt: 'Conduct research analysis',
        contentType: 'research',
        tone: 'academic',
        length: 'long'
      }),
      disabled: isGenerating
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearContent();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isGenerating
    }
  ];

  return (
    <BaseWidget
      title="Omni Generator"
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