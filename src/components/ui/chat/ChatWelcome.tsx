/**
 * ============================================================================
 * ChatWelcome Component (ChatWelcome.tsx) - Dynamic Widget-Driven Welcome
 * ============================================================================
 * 
 * 【核心功能】
 * - 动态加载widget配置，支持运行时修改
 * - 点击widget卡片直接触发对应widget并发送预设消息
 * - 动态示例提示词，支持配置化管理
 * - 利用现有的handler、module、store架构
 * 
 * 【Widget映射】
 * - Creative Projects → OmniWidget (⚡ 多功能内容生成)
 * - Product Search → HuntWidget (🔍 产品搜索)
 * - Image Generation → DreamWidget (🎨 图像生成)
 * - Knowledge Analysis → KnowledgeWidget (🧠 文档分析)
 */

import React, { useEffect } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { WidgetType } from '../../../types/widgetTypes';
import { 
  useOmniActions,
  useHuntActions, 
  useDreamActions,
  useKnowledgeActions 
} from '../../../stores/useWidgetStores';
import { createWelcomeConfig, validateWelcomeConfig } from '../../../config/welcomeConfig';
import { useLanguageStore } from '../../../stores/useLanguageStore';

interface ChatWelcomeProps {
  onSendMessage?: (message: string) => void;
  className?: string;
}

// Dynamic configuration is now loaded from welcomeConfig

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  onSendMessage,
  className = ''
}) => {
  const { setCurrentApp, setShowRightSidebar } = useAppStore();
  const { triggerOmniGeneration } = useOmniActions();
  const { triggerHuntSearch } = useHuntActions();
  const { triggerDreamGeneration } = useDreamActions();
  const { triggerKnowledgeAnalysis } = useKnowledgeActions();
  const { currentLanguage } = useLanguageStore();
  
  // Generate dynamic welcome config based on current language
  const welcomeConfig = React.useMemo(() => createWelcomeConfig(currentLanguage), [currentLanguage]);

  // Validate configuration on component mount and language change
  useEffect(() => {
    const isValid = validateWelcomeConfig();
    if (!isValid) {
      console.error('🎯 CHAT_WELCOME: Invalid welcome configuration detected');
    } else {
      console.log('🎯 CHAT_WELCOME: Welcome configuration loaded successfully', { language: currentLanguage });
    }
  }, [currentLanguage]);

  // 处理widget卡片点击
  const handleWidgetClick = async (widget: typeof welcomeConfig.widgets[0]) => {
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
    <div className={`flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Main Welcome Card - Simplified design for consistency */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto glass-secondary rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
        {/* AI Avatar */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6 glass-tertiary" style={{ border: '1px solid var(--glass-border)' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        
        {/* Welcome Text - Responsive typography */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
            {welcomeConfig.title}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto px-2" style={{ color: 'var(--text-secondary)' }}>
            {welcomeConfig.subtitle}
          </p>
        </div>

        {/* Dynamic Widget Cards - Enhanced mobile layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
          {welcomeConfig.widgets.map((widget, index) => (
            <button
              key={widget.id}
              className={`p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl cursor-pointer group transition-all duration-200 text-left glass-tertiary hover:glass-secondary ${
                widget.featured ? 'sm:col-span-2 lg:col-span-2 xl:col-span-2' : ''
              }`}
              style={{ border: '1px solid var(--glass-border)' }}
              onClick={() => handleWidgetClick(widget)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105 glass-tertiary"
                  style={{
                    border: `1px solid var(--glass-border)`,
                    color: widget.accentColor
                  }}
                >
                  {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {widget.title}
                  </h3>
                  <p className="text-xs sm:text-sm transition-colors leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {widget.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Example Prompts - Mobile-optimized layout */}
        <div className="pt-4 sm:pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <h4 className="font-medium mb-3 sm:mb-4 text-center text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Quick start examples:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-2 sm:gap-3 max-w-4xl mx-auto">
            {welcomeConfig.examplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="p-2 sm:p-2.5 lg:p-3 rounded-lg text-left text-xs sm:text-sm glass-tertiary hover:glass-secondary transition-all duration-200"
                style={{ 
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)'
                }}
                onClick={() => handlePromptClick(prompt)}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Tip - Enhanced styling */}
      <div className="mt-4 sm:mt-6 text-center px-4">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-secondary rounded-full" style={{ border: '1px solid var(--glass-border)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {welcomeConfig.tipText}
          </span>
        </div>
      </div>
    </div>
  );
};