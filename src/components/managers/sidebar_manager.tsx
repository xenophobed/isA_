import React from 'react';
import { DreamSidebar } from '../../sidebars/dream_sidebar';
import { HuntSidebar } from '../../sidebars/hunt_sidebar';
import { DigitalHubSidebar } from '../../sidebars/digitalhub_sidebar';
import { AssistantSidebar } from '../../sidebars/assistant_sidebar';
import { OmniSidebar } from '../../sidebars/omni_sidebar';
import { DataScientistSidebar } from '../../sidebars/data_scientist_sidebar';
import { DocSidebar } from '../../sidebars/doc_sidebar';
import { logger, LogCategory } from '../../utils/logger';

interface SidebarManagerProps {
  currentApp: string | null;
  showRightSidebar: boolean;
  triggeredAppInput: string;
  dreamGeneratedImage: string | null;
  onCloseApp: () => void;
  onDreamImageGenerated?: (imageUrl: string, prompt: string) => void;
}

/**
 * 侧边栏管理器
 * 负责根据当前app显示对应的侧边栏内容
 */
export const SidebarManager: React.FC<SidebarManagerProps> = ({
  currentApp,
  showRightSidebar,
  triggeredAppInput,
  dreamGeneratedImage,
  onCloseApp,
  onDreamImageGenerated
}) => {
  logger.trackComponentRender('SidebarManager', { 
    currentApp, 
    showRightSidebar, 
    hasTriggeredInput: !!triggeredAppInput,
    hasDreamImage: !!dreamGeneratedImage
  });
  console.log('🟡 SIDEBAR: Rendering sidebar', { currentApp, showRightSidebar });

  const getSidebarContent = () => {
    const sidebarConfigs = {
      dream: { 
        title: 'DreamForge AI', 
        icon: '🎨', 
        component: DreamSidebar, 
        props: { 
          generatedImage: dreamGeneratedImage,
          onImageGenerated: onDreamImageGenerated
        } 
      },
      hunt: { 
        title: 'HuntAI', 
        icon: '🔍', 
        component: HuntSidebar 
      },
      digitalhub: { 
        title: 'Digital Hub', 
        icon: '📁', 
        component: DigitalHubSidebar 
      },
      assistant: { 
        title: 'AI Assistant', 
        icon: '🤖', 
        component: AssistantSidebar 
      },
      omni: { 
        title: 'Omni Content Generator', 
        icon: '⚡', 
        component: OmniSidebar 
      },
      'data-scientist': { 
        title: 'DataWise Analytics', 
        icon: '📊', 
        component: DataScientistSidebar 
      },
      doc: { 
        title: 'DocIntell AI', 
        icon: '📄', 
        component: DocSidebar 
      }
    };

    const config = sidebarConfigs[currentApp as keyof typeof sidebarConfigs];
    logger.debug(LogCategory.COMPONENT_RENDER, 'Sidebar config lookup', { 
      currentApp, 
      configFound: !!config, 
      configTitle: config?.title 
    });
    console.log('🟡 SIDEBAR: Config found:', !!config, config?.title);
    
    if (!config) {
      logger.warn(LogCategory.COMPONENT_RENDER, 'No sidebar config found for app', { currentApp });
      return null;
    }

    const Component = config.component;
    return (
      <div className="h-full flex flex-col isa-app-launch">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{config.icon}</span>
            {config.title}
          </h2>
          <button
            onClick={() => {
              logger.trackSidebarInteraction('close_clicked', currentApp || undefined, { 
                appTitle: config.title 
              });
              onCloseApp();
            }}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
            title="Close App (will preserve artifact)"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {(() => {
            logger.trackComponentRender(`${config.title}_Sidebar`, { 
              triggeredInput: triggeredAppInput?.substring(0, 50),
              hasProps: 'props' in config
            });
            console.log('🟡 SIDEBAR: Rendering component:', config.title, { triggeredAppInput });
            return (
              <Component 
                triggeredInput={triggeredAppInput} 
                {...(('props' in config) ? config.props : {})}
              />
            );
          })()}
        </div>
      </div>
    );
  };

  return getSidebarContent() || (
    <div className="p-6 h-full flex flex-col isa-app-launch">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🚀</span>
          AI Apps
        </h2>
        <button
          onClick={onCloseApp}
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
        >
          ✕
        </button>
      </div>
      
      <div className="text-white/60 text-center">
        <p>Select an app to get started</p>
      </div>
    </div>
  );
};