import { AppTriggerParams, AvailableApp } from '../../types/app_types';

/**
 * App触发管理器
 * 负责检测用户输入中的应用触发关键词
 */
export class AppTriggerManager {
  private static availableApps: AvailableApp[] = [
    {
      id: 'dream',
      name: 'Dream Generator',
      icon: '🎨',
      description: 'AI-powered image generation with multiple styles',
      triggers: ['generate', 'create', 'image', 'picture', 'draw', 'paint', 'dream'],
      category: 'Creative'
    },
    {
      id: 'hunt',
      name: 'HuntAI',
      icon: '🔍',
      description: 'Smart product search and price comparison',
      triggers: ['search', 'find', 'buy', 'product', 'price', 'compare', 'shop'],
      category: 'Shopping'
    },
    {
      id: 'digitalhub',
      name: 'Digital Hub',
      icon: '📁',
      description: 'File organization and management system',
      triggers: ['organize', 'file', 'folder', 'manage', 'sort'],
      category: 'Productivity'
    },
    {
      id: 'assistant',
      name: 'AI Assistant',
      icon: '🤖',
      description: 'General AI assistant for various tasks',
      triggers: ['help', 'assist', 'support', 'advice'],
      category: 'General'
    }
  ];

  /**
   * 处理用户输入的触发检测
   */
  static handleTrigger(params: AppTriggerParams): string | false {
    const { message, setCurrentApp, setShowRightSidebar, setTriggeredAppInput } = params;
    
    const lowerMessage = message.toLowerCase();
    console.log('🔍 TRIGGER: Checking message for triggers:', lowerMessage);
    console.log('🔍 TRIGGER: Available apps:', this.availableApps.map(a => ({ 
      id: a.id, 
      name: a.name, 
      triggers: a.triggers 
    })));

    for (const app of this.availableApps) {
      const matchingTrigger = app.triggers.find(trigger => lowerMessage.includes(trigger));
      if (matchingTrigger) {
        console.log('🎯 TRIGGER: App trigger detected!', { 
          app: app.name, 
          trigger: matchingTrigger 
        });

        console.log('📱 TRIGGER: Opening app without creating artifact');

        // 延迟打开app以获得更好的视觉效果
        setTimeout(() => {
          console.log('🔄 TRIGGER: Setting app state...', { appId: app.id, message });
          setCurrentApp(app.id);
          setShowRightSidebar(true);
          setTriggeredAppInput(message);
          console.log('✨ TRIGGER: App state set!', { 
            currentApp: app.id, 
            showRightSidebar: true 
          });
        }, 1000);

        // 阻止消息发送到API，因为app会处理
        return false;
      }
    }

    return message;
  }

  /**
   * 获取所有可用的应用列表
   */
  static getAvailableApps(): AvailableApp[] {
    return this.availableApps;
  }

  /**
   * 根据ID获取应用信息
   */
  static getAppById(appId: string): AvailableApp | undefined {
    return this.availableApps.find(app => app.id === appId);
  }
}