/**
 * ============================================================================
 * Right Sidebar Layout (RightSidebarLayout.tsx) - 右侧边栏布局组件
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理右侧边栏的布局和显示逻辑
 * - 根据当前应用显示对应的小部件
 * - 提供统一的小部件容器和导航
 * - 处理小部件的打开/关闭状态
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 右侧边栏的UI布局和样式
 *   - 小部件路由和显示逻辑
 *   - 小部件头部和容器管理
 *   - 小部件选择界面
 * 
 * ❌ 不负责：
 *   - 具体小部件的业务逻辑（由各Widget Module处理）
 *   - 小部件内部状态管理（由stores处理）
 *   - 小部件特定的功能实现（由Widget UI组件处理）
 * 
 * 【架构流向】
 * ChatLayout → RightSidebarLayout → WidgetModule → Widget UI
 */
import React from 'react';

// Import Widget Modules (Business Logic + UI)
import { DreamWidgetModule } from '../../../modules/widgets/DreamWidgetModule';
import { HuntWidgetModule } from '../../../modules/widgets/HuntWidgetModule';
import { AssistantWidgetModule } from '../../../modules/widgets/AssistantWidgetModule';
import { OmniWidgetModule } from '../../../modules/widgets/OmniWidgetModule';
import { KnowledgeWidgetModule } from '../../../modules/widgets/KnowledgeWidgetModule';
import { DataScientistWidgetModule } from '../../../modules/widgets/DataScientistWidgetModule';
import { DreamWidget } from '../widgets/DreamWidget';
import { HuntWidget } from '../widgets/HuntWidget';
import { OmniWidget } from '../widgets/OmniWidget';
import { AssistantWidget } from '../widgets/AssistantWidget';
import { DataScientistWidget } from '../widgets/DataScientistWidget';
import { KnowledgeWidget } from '../widgets/KnowledgeWidget';

import { logger, LogCategory } from '../../../utils/logger';

interface RightSidebarLayoutProps {
  currentApp: string | null;
  showRightSidebar: boolean;
  triggeredAppInput: string;
  onCloseApp: () => void;
  onAppSelect?: (appId: string) => void;
}

/**
 * Right Sidebar Layout - UI component for managing widget display in right sidebar
 * 
 * This component:
 * - Routes to appropriate widget based on currentApp
 * - Provides unified widget container layout
 * - Handles widget lifecycle and display
 * - Shows widget selection interface when no widget is active
 */
export const RightSidebarLayout: React.FC<RightSidebarLayoutProps> = ({
  currentApp,
  showRightSidebar,
  triggeredAppInput,
  onCloseApp,
  onAppSelect
}) => {
  // Pure layout component - no hooks or business logic needed
  
  logger.trackComponentRender('RightSidebarLayout', { 
    currentApp, 
    showRightSidebar, 
    hasTriggeredInput: !!triggeredAppInput
  });
  
  console.log('📱 RIGHT_SIDEBAR: Rendering right sidebar', { currentApp, showRightSidebar });
  
  // Get widget content based on current app (Module + UI rendering)
  const getWidgetContent = () => {
    if (!currentApp) return null;
    
    console.log('📱 RIGHT_SIDEBAR: Rendering widget for app:', currentApp);
    
    // Use Widget Modules that manage business logic + UI
    switch (currentApp) {
      case 'dream':
        return (
          <DreamWidgetModule 
            triggeredInput={triggeredAppInput}
            onImageGenerated={(imageUrl, prompt) => {
              console.log('🎨 RIGHT_SIDEBAR: Dream image generated:', { imageUrl, prompt });
            }}
          >
            {(moduleProps) => (
              <DreamWidget 
                isGenerating={moduleProps.isGenerating}
                generatedImage={moduleProps.generatedImage}
                lastParams={moduleProps.lastParams}
                onGenerateImage={moduleProps.onGenerateImage}
                onClearImage={moduleProps.onClearImage}
                triggeredInput={triggeredAppInput}
              />
            )}
          </DreamWidgetModule>
        );
      
      case 'hunt':
        return (
          <HuntWidgetModule 
            triggeredInput={triggeredAppInput}
            onSearchCompleted={(result) => {
              console.log('🔍 RIGHT_SIDEBAR: Hunt search completed:', result);
            }}
          >
            {(moduleProps) => (
              <HuntWidget 
                isSearching={moduleProps.isSearching}
                searchResults={moduleProps.searchResults}
                lastQuery={moduleProps.lastQuery}
                onSearch={moduleProps.onSearch}
                onClearResults={moduleProps.onClearResults}
                triggeredInput={triggeredAppInput}
              />
            )}
          </HuntWidgetModule>
        );
      
      case 'omni':
        return (
          <OmniWidgetModule 
            triggeredInput={triggeredAppInput}
            onContentGenerated={(result) => {
              console.log('⚡ RIGHT_SIDEBAR: Omni content generated:', result);
            }}
          >
            {(moduleProps) => (
              <OmniWidget 
                isGenerating={moduleProps.isGenerating}
                generatedContent={moduleProps.generatedContent}
                lastParams={moduleProps.lastParams}
                onGenerateContent={moduleProps.onGenerateContent}
                onClearContent={moduleProps.onClearContent}
                triggeredInput={triggeredAppInput}
              />
            )}
          </OmniWidgetModule>
        );
        
      case 'assistant':
        return (
          <AssistantWidgetModule 
            triggeredInput={triggeredAppInput}
            onResponseGenerated={(result) => {
              console.log('🤖 RIGHT_SIDEBAR: Assistant response generated:', result);
            }}
          >
            {(moduleProps) => (
              <AssistantWidget 
                isProcessing={moduleProps.isProcessing}
                conversationContext={moduleProps.conversationContext}
                onSendMessage={moduleProps.onSendMessage}
                onClearContext={moduleProps.onClearContext}
                triggeredInput={triggeredAppInput}
              />
            )}
          </AssistantWidgetModule>
        );
      
      case 'knowledge':
        return (
          <KnowledgeWidgetModule 
            triggeredInput={triggeredAppInput}
            onAnalysisCompleted={(result) => {
              console.log('🧠 RIGHT_SIDEBAR: Knowledge analysis completed:', result);
            }}
          >
            {(moduleProps) => (
              <KnowledgeWidget 
                isProcessing={moduleProps.isProcessing}
                result={moduleProps.searchResult}
                onProcess={moduleProps.onSearchKnowledge}
                onClearResults={moduleProps.onClearResults}
                triggeredInput={triggeredAppInput}
              />
            )}
          </KnowledgeWidgetModule>
        );
      
      case 'data-scientist':
        return (
          <DataScientistWidgetModule 
            triggeredInput={triggeredAppInput}
            onAnalysisCompleted={(result) => {
              console.log('📊 RIGHT_SIDEBAR: DataScientist analysis completed:', result);
            }}
          >
            {(moduleProps) => (
              <DataScientistWidget 
                isAnalyzing={moduleProps.isAnalyzing}
                analysisResult={moduleProps.analysisResult}
                onAnalyzeData={moduleProps.onAnalyzeData}
                onClearAnalysis={moduleProps.onClearAnalysis}
                triggeredInput={triggeredAppInput}
              />
            )}
          </DataScientistWidgetModule>
        );
      
      default:
        logger.warn(LogCategory.COMPONENT_RENDER, 'Unknown widget type', { currentApp });
        return <div className="p-4 text-gray-400">Unknown widget: {currentApp}</div>;
    }
  };
  
  const widgetContent = getWidgetContent();
  
  // Simple widget configs (no hooks needed)
  const getWidgetInfo = (appId: string) => {
    const configs: Record<string, { icon: string; title: string }> = {
      dream: { icon: '🎨', title: 'DreamForge AI' },
      hunt: { icon: '🔍', title: 'HuntAI' },
      omni: { icon: '⚡', title: 'Omni Content' },
      assistant: { icon: '🤖', title: 'AI Assistant' },
      'data-scientist': { icon: '📊', title: 'DataWise Analytics' },
      knowledge: { icon: '🧠', title: 'Knowledge Hub' }
    };
    return configs[appId] || { icon: '❓', title: 'Unknown Widget' };
  };
  
  // Render widget in container if we have content
  if (widgetContent && currentApp) {
    const widgetInfo = getWidgetInfo(currentApp);
    return (
      <div className="h-full flex flex-col isa-right-sidebar">
        {/* Widget Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{widgetInfo.icon}</span>
            {widgetInfo.title}
          </h2>
          <button
            onClick={() => {
              logger.trackSidebarInteraction('widget_close_clicked', currentApp || undefined, { 
                widgetTitle: widgetInfo.title 
              });
              onCloseApp();
            }}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
            title="Close Widget (will preserve any generated content)"
          >
            ✕
          </button>
        </div>
        
        {/* Widget Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {widgetContent}
        </div>
      </div>
    );
  }
  
  // Show widget selection screen if no specific widget is open
  return (
    <div className="p-6 h-full flex flex-col isa-widget-selector">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🚀</span>
          AI Widgets
        </h2>
        <button
          onClick={onCloseApp}
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        <p className="text-white/60 text-sm mb-4">Choose an AI widget to get started:</p>
        
        <div className="grid gap-3">
          {Object.entries({
            dream: { title: 'DreamForge AI', icon: '🎨', desc: 'AI-powered image generation', status: 'new' },
            hunt: { title: 'HuntAI', icon: '🔍', desc: 'Product search and comparison', status: 'new' },
            assistant: { title: 'AI Assistant', icon: '🤖', desc: 'General AI assistance', status: 'new' },
            omni: { title: 'Omni Content', icon: '⚡', desc: 'Multi-purpose content creation', status: 'new' },
            'data-scientist': { title: 'DataWise Analytics', icon: '📊', desc: 'Data analysis and insights', status: 'new' },
            knowledge: { title: 'Knowledge Hub', icon: '🧠', desc: 'Advanced document analysis with vector and graph RAG', status: 'new' }
          }).map(([appId, app]) => (
            <button
              key={appId}
              onClick={() => {
                logger.trackSidebarInteraction('widget_selected_from_list', appId);
                console.log('🚀 Widget selected:', appId);
                onAppSelect?.(appId);
              }}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{app.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-white font-medium text-sm">{app.title}</div>
                    {app.status === 'new' && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                        New Architecture
                      </span>
                    )}
                  </div>
                  <div className="text-white/60 text-xs mt-1">{app.desc}</div>
                </div>
                <div className="text-white/40 group-hover:text-white/60 transition-colors">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-blue-300 text-sm font-medium mb-2">💡 Pro Tip</div>
          <div className="text-blue-200/80 text-xs">
            You can also trigger widgets by typing keywords like "create image", "search product", or "generate content" in the chat!
          </div>
        </div>
      </div>
    </div>
  );
};