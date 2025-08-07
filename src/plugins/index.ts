/**
 * ============================================================================
 * Plugin Index (index.ts) - 插件系统入口文件
 * ============================================================================
 * 
 * 核心职责：
 * - 统一导出所有插件
 * - 提供插件系统初始化方法
 * - 管理插件的自动注册
 */

import { pluginManager } from '../core/PluginManager';
import dreamWidgetPlugin from './DreamWidgetPlugin';
import omniWidgetPlugin from './OmniWidgetPlugin';
import huntWidgetPlugin from './HuntWidgetPlugin';
import dataScientistWidgetPlugin from './DataScientistWidgetPlugin';
import knowledgeWidgetPlugin from './KnowledgeWidgetPlugin';
import { logger, LogCategory } from '../utils/logger';

// ============================================================================
// 插件导出
// ============================================================================

export { 
  dreamWidgetPlugin,
  omniWidgetPlugin,
  huntWidgetPlugin,
  dataScientistWidgetPlugin,
  knowledgeWidgetPlugin
};
export { pluginManager };

// ============================================================================
// 插件系统初始化
// ============================================================================

/**
 * 初始化插件系统
 */
export function initializePluginSystem(): void {
  logger.info(LogCategory.SYSTEM, '🔌 Initializing Plugin System...');
  
  try {
    // 注册所有插件
    registerAllPlugins();
    
    // 输出统计信息
    const stats = pluginManager.getStats();
    logger.info(LogCategory.SYSTEM, '🔌 Plugin System initialized successfully', {
      totalPlugins: stats.totalPlugins,
      enabledPlugins: stats.enabledPlugins,
      plugins: stats.pluginDetails.map(p => `${p.name} (${p.id})`)
    });
    
  } catch (error) {
    logger.error(LogCategory.SYSTEM, '🔌 Plugin System initialization failed', { error });
    throw error;
  }
}

/**
 * 注册所有插件
 */
function registerAllPlugins(): void {
  // 注册所有 Widget Plugins
  pluginManager.register(dreamWidgetPlugin);
  pluginManager.register(omniWidgetPlugin);
  pluginManager.register(huntWidgetPlugin);
  pluginManager.register(dataScientistWidgetPlugin);
  pluginManager.register(knowledgeWidgetPlugin);
  
  logger.info(LogCategory.SYSTEM, '🔌 All widget plugins registered successfully', {
    registeredPlugins: [
      'dreamWidgetPlugin',
      'omniWidgetPlugin', 
      'huntWidgetPlugin',
      'dataScientistWidgetPlugin',
      'knowledgeWidgetPlugin'
    ]
  });
}

/**
 * 检测消息是否触发插件
 */
export function detectPluginTrigger(message: string) {
  return pluginManager.detectTrigger(message);
}

/**
 * 执行插件
 */
export async function executePlugin(pluginId: string, input: any) {
  return await pluginManager.execute(pluginId as any, input);
}

/**
 * 获取所有可用插件
 */
export function getAvailablePlugins() {
  return pluginManager.getAllPlugins();
}

/**
 * 获取插件统计信息
 */
export function getPluginStats() {
  return pluginManager.getStats();
}

// ============================================================================
// 开发测试方法
// ============================================================================

/**
 * 测试插件系统（仅开发环境）
 */
export async function testPluginSystem(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  logger.info(LogCategory.SYSTEM, '🧪 Testing Plugin System...');
  
  try {
    // 测试插件触发检测
    const testMessage = 'generate image of a beautiful sunset';
    const triggerResult = pluginManager.detectTrigger(testMessage);
    
    logger.info(LogCategory.SYSTEM, '🧪 Trigger detection test', {
      message: testMessage,
      result: triggerResult
    });
    
    if (triggerResult.triggered && triggerResult.pluginId) {
      logger.info(LogCategory.SYSTEM, `🧪 Would execute plugin: ${triggerResult.pluginId}`);
      // 在实际测试中，可以取消注释下面的代码来真正执行插件
      /*
      const input = {
        prompt: triggerResult.extractedParams?.prompt || testMessage,
        options: {},
        context: { sessionId: 'test_session', userId: 'test_user' }
      };
      
      const result = await pluginManager.execute(triggerResult.pluginId, input);
      logger.info(LogCategory.SYSTEM, '🧪 Plugin execution test result', { result });
      */
    }
    
    // 输出插件统计
    const stats = pluginManager.getStats();
    logger.info(LogCategory.SYSTEM, '🧪 Plugin System test completed', { stats });
    
  } catch (error) {
    logger.error(LogCategory.SYSTEM, '🧪 Plugin System test failed', { error });
  }
}