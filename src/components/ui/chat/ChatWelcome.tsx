/**
 * ============================================================================
 * ChatWelcome Component (ChatWelcome.tsx) - Dynamic Widget-Driven Welcome
 * ============================================================================
 * 
 * 【核心功能】
 * - 替换静态welcome为动态widget卡片
 * - 点击widget卡片直接触发对应widget并发送预设消息
 * - 保留示例提示词，点击可直接发送
 * - 利用现有的handler、module、store架构
 * 
 * 【Widget映射】
 * - Creative Projects → OmniWidget (⚡ 多功能内容生成)
 * - Product Search → HuntWidget (🔍 产品搜索)
 * - Image Generation → DreamWidget (🎨 图像生成)
 * - Knowledge Analysis → KnowledgeWidget (🧠 文档分析)
 */

import React from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { WidgetType } from '../../../types/widgetTypes';
import { 
  useOmniActions,
  useHuntActions, 
  useDreamActions,
  useKnowledgeActions 
} from '../../../stores/useWidgetStores';

interface ChatWelcomeProps {
  onSendMessage?: (message: string) => void;
  className?: string;
}

// Widget定义 - 使用优雅深色系统
const WELCOME_WIDGETS = [
  {
    id: 'omni' as WidgetType,
    title: 'Creative Projects',
    icon: '⚡',
    description: 'Generate content, write stories, or brainstorm ideas',
    accentColor: '#6366f1', // 优雅蓝紫
    defaultPrompt: 'Help me create something amazing! I need assistance with creative content generation.'
  },
  {
    id: 'hunt' as WidgetType,
    title: 'Product Search',
    icon: '🔍',
    description: 'Search and compare products, find the best deals',
    accentColor: '#8b5cf6', // 优雅紫
    defaultPrompt: 'Help me find and compare products. What are you looking for?'
  },
  {
    id: 'dream' as WidgetType,
    title: 'Image Generation',
    icon: '🎨',
    description: 'Generate images, create artwork, or visualize ideas',
    accentColor: '#a855f7', // 优雅紫粉
    defaultPrompt: 'Create a beautiful image for me. Describe what you want to see generated.'
  },
  {
    id: 'knowledge' as WidgetType,
    title: 'Knowledge Analysis',
    icon: '🧠',
    description: 'Analyze documents, research topics, or get explanations',
    accentColor: '#3b82f6', // 优雅蓝
    defaultPrompt: 'Analyze this content or help me research a topic. What would you like to explore?'
  }
];

// 示例提示词
const EXAMPLE_PROMPTS = [
  "Create a logo for my startup",
  "Help me debug this code", 
  "Analyze this data trend",
  "Explain quantum computing"
];

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  onSendMessage,
  className = ''
}) => {
  const { setCurrentApp, setShowRightSidebar } = useAppStore();
  const { triggerOmniGeneration } = useOmniActions();
  const { triggerHuntSearch } = useHuntActions();
  const { triggerDreamGeneration } = useDreamActions();
  const { triggerKnowledgeAnalysis } = useKnowledgeActions();

  // 处理widget卡片点击
  const handleWidgetClick = async (widget: typeof WELCOME_WIDGETS[0]) => {
    console.log(`🎯 CHAT_WELCOME: Widget clicked - ${widget.title} (${widget.id})`);
    
    try {
      // 1. 打开对应widget的侧边栏
      setCurrentApp(widget.id as any); // Cast to AppId type
      setShowRightSidebar(true);
      // 移除setTriggeredAppInput，避免重复发送消息
      
      // 2. 根据widget类型触发对应的处理逻辑
      const params = {
        prompt: widget.defaultPrompt,
        query: widget.defaultPrompt
      };
      
      switch (widget.id) {
        case 'omni':
          await triggerOmniGeneration(params);
          break;
        case 'hunt':
          await triggerHuntSearch(params);
          break;
        case 'dream':
          await triggerDreamGeneration(params);
          break;
        case 'knowledge':
          await triggerKnowledgeAnalysis(params);
          break;
        default:
          console.warn(`🎯 CHAT_WELCOME: Unknown widget type - ${widget.id}`);
      }
      
      console.log(`🎯 CHAT_WELCOME: Widget ${widget.title} activated successfully`);
    } catch (error) {
      console.error(`🎯 CHAT_WELCOME: Failed to activate widget ${widget.title}:`, error);
    }
  };

  // 处理示例提示词点击
  const handlePromptClick = (prompt: string) => {
    console.log(`💬 CHAT_WELCOME: Example prompt clicked - ${prompt}`);
    if (onSendMessage) {
      onSendMessage(prompt);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] px-4 ${className}`}>
      {/* Main Welcome Card */}
      <div className="rounded-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm" style={{ 
        background: 'var(--glass-primary)', 
        boxShadow: '0 8px 32px rgba(255, 0, 128, 0.2), 0 0 40px rgba(58, 134, 255, 0.1)' 
      }}>
        {/* AI Avatar */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" style={{
          background: 'var(--gradient-secondary)',
          boxShadow: '0 0 30px var(--neon-pink), 0 0 60px var(--neon-blue)'
        }}>
          <span className="text-white font-bold text-xl">✨</span>
        </div>
        
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3" style={{
            background: 'var(--gradient-secondary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px var(--neon-pink))'
          }}>
            Welcome to isA_
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Choose your AI assistant below, or start a conversation with any prompt.
          </p>
        </div>

        {/* Dynamic Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {WELCOME_WIDGETS.map((widget) => (
            <div
              key={widget.id}
              className="rounded-xl p-4 transition-all cursor-pointer group hover:transform hover:scale-105"
              style={{
                background: 'var(--glass-secondary)',
                border: 'none',
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2)`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 32px ${widget.accentColor}30, 0 0 40px ${widget.accentColor}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 15, 35, 0.3)';
              }}
              onClick={() => handleWidgetClick(widget)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{
                  background: `${widget.accentColor}20`,
                  boxShadow: `0 0 15px ${widget.accentColor}30`
                }}>
                  <span className="text-sm" style={{ color: widget.accentColor }}>{widget.icon}</span>
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{widget.title}</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{widget.description}</p>
            </div>
          ))}
        </div>

        {/* Example Prompts */}
        <div className="pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <h4 className="font-medium mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>Or try asking me something like:</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm cursor-pointer transition-all hover:transform hover:scale-105"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--glass-secondary)',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px var(--accent-soft)';
                  e.currentTarget.style.background = 'var(--glass-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'var(--glass-secondary)';
                }}
                onClick={() => handlePromptClick(prompt)}
              >
                "{prompt}"
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Tip */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
          <span>💡</span>
          Click any widget above to get started, or type your message below
        </p>
      </div>
    </div>
  );
};