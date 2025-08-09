/**
 * ============================================================================
 * Plugin Manager (PluginManager.ts) - Widget 插件管理器
 * ============================================================================
 * 
 * 核心职责：
 * - 管理 Widget 插件的注册和注销
 * - 提供插件的执行和生命周期管理
 * - 处理插件触发检测和参数提取
 * 
 * 设计原则：
 * - 单例模式，全局唯一实例
 * - 最小实现，逐步扩展
 * - 与现有系统无缝集成
 */

import { 
  WidgetPlugin, 
  PluginManager as IPluginManager,
  PluginRegistration,
  PluginInput,
  PluginExecutionResult,
  PluginTriggerResult
} from '../types/pluginTypes';
import { AppId } from '../types/appTypes';
import { logger, LogCategory } from '../utils/logger';

/**
 * Widget 插件管理器实现
 */
export class PluginManager implements IPluginManager {
  private static instance: PluginManager;
  private plugins = new Map<AppId, PluginRegistration>();

  private constructor() {
    logger.info(LogCategory.SYSTEM, '🔌 PluginManager initialized');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  // ============================================================================
  // 插件注册管理
  // ============================================================================

  /**
   * 注册插件
   */
  register(plugin: WidgetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      logger.warn(LogCategory.SYSTEM, `Plugin ${plugin.id} already registered, overwriting`);
    }

    const registration: PluginRegistration = {
      plugin,
      registeredAt: new Date().toISOString(),
      enabled: true,
      usageCount: 0
    };

    this.plugins.set(plugin.id, registration);

    logger.info(LogCategory.SYSTEM, `🔌 Plugin registered: ${plugin.name} (${plugin.id})`);

    // 初始化插件
    if (plugin.onInit) {
      plugin.onInit().catch(error => {
        logger.error(LogCategory.SYSTEM, `Plugin ${plugin.id} initialization failed`, { error });
      });
    }
  }

  /**
   * 注销插件
   */
  unregister(pluginId: AppId): void {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.warn(LogCategory.SYSTEM, `Plugin ${pluginId} not found for unregistration`);
      return;
    }

    // 销毁插件
    if (registration.plugin.onDestroy) {
      try {
        registration.plugin.onDestroy();
      } catch (error) {
        logger.error(LogCategory.SYSTEM, `Plugin ${pluginId} destruction failed`, { error });
      }
    }

    this.plugins.delete(pluginId);
    logger.info(LogCategory.SYSTEM, `🔌 Plugin unregistered: ${pluginId}`);
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: AppId): WidgetPlugin | undefined {
    const registration = this.plugins.get(pluginId);
    return registration?.enabled ? registration.plugin : undefined;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): WidgetPlugin[] {
    return Array.from(this.plugins.values())
      .filter(reg => reg.enabled)
      .map(reg => reg.plugin);
  }

  /**
   * 检查插件是否存在
   */
  hasPlugin(pluginId: AppId): boolean {
    const registration = this.plugins.get(pluginId);
    return !!registration && registration.enabled;
  }

  /**
   * 启用/禁用插件
   */
  setPluginEnabled(pluginId: AppId, enabled: boolean): void {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      logger.warn(LogCategory.SYSTEM, `Plugin ${pluginId} not found`);
      return;
    }

    registration.enabled = enabled;
    logger.info(LogCategory.SYSTEM, `🔌 Plugin ${pluginId} ${enabled ? 'enabled' : 'disabled'}`);
  }

  // ============================================================================
  // 插件执行
  // ============================================================================

  /**
   * 执行插件
   */
  async execute(pluginId: AppId, input: PluginInput): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    
    try {
      const registration = this.plugins.get(pluginId);
      
      if (!registration) {
        return {
          success: false,
          error: `Plugin ${pluginId} not found`,
          executionTime: Date.now() - startTime
        };
      }

      if (!registration.enabled) {
        return {
          success: false,
          error: `Plugin ${pluginId} is disabled`,
          executionTime: Date.now() - startTime
        };
      }

      logger.info(LogCategory.ARTIFACT_CREATION, `🔌 Executing plugin: ${pluginId}`, {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 执行插件
      const output = await registration.plugin.execute(input);
      
      // 更新使用次数
      registration.usageCount++;

      const executionTime = Date.now() - startTime;

      logger.info(LogCategory.ARTIFACT_CREATION, `🔌 Plugin execution completed: ${pluginId}`, {
        executionTime,
        outputType: output.type,
        usageCount: registration.usageCount
      });

      return {
        success: true,
        output,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(LogCategory.ARTIFACT_CREATION, `🔌 Plugin execution failed: ${pluginId}`, {
        error: errorMessage,
        executionTime,
        input
      });

      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }

  // ============================================================================
  // 插件触发检测
  // ============================================================================

  /**
   * 检测消息是否触发插件
   */
  detectTrigger(message: string): PluginTriggerResult {
    const messageLower = message.toLowerCase().trim();

    for (const [pluginId, registration] of Array.from(this.plugins.entries())) {
      if (!registration.enabled || !registration.plugin.triggers) {
        continue;
      }

      for (const trigger of registration.plugin.triggers) {
        const triggerLower = trigger.toLowerCase();
        
        // 简单的触发词匹配
        if (messageLower.includes(triggerLower)) {
          logger.debug(LogCategory.SYSTEM, `🔌 Plugin trigger detected: ${pluginId}`, {
            trigger,
            message: message.substring(0, 100) + '...'
          });

          return {
            triggered: true,
            pluginId,
            trigger,
            extractedParams: this.extractParams(message, trigger)
          };
        }
      }
    }

    return { triggered: false };
  }

  /**
   * 从消息中提取参数（简单实现）
   */
  private extractParams(message: string, trigger: string): Record<string, any> {
    // 移除触发词，剩余部分作为 prompt
    const prompt = message.replace(new RegExp(trigger, 'gi'), '').trim();
    
    return {
      prompt: prompt || message,
      originalMessage: message,
      matchedTrigger: trigger
    };
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 获取插件统计信息
   */
  getStats() {
    const stats = {
      totalPlugins: this.plugins.size,
      enabledPlugins: 0,
      totalUsage: 0,
      pluginDetails: [] as Array<{
        id: string;
        name: string;
        enabled: boolean;
        usageCount: number;
        registeredAt: string;
      }>
    };

    for (const [id, registration] of this.plugins) {
      if (registration.enabled) {
        stats.enabledPlugins++;
      }
      stats.totalUsage += registration.usageCount;

      stats.pluginDetails.push({
        id,
        name: registration.plugin.name,
        enabled: registration.enabled,
        usageCount: registration.usageCount,
        registeredAt: registration.registeredAt
      });
    }

    return stats;
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    for (const [pluginId] of this.plugins) {
      this.unregister(pluginId);
    }
    logger.info(LogCategory.SYSTEM, '🔌 All plugins cleared');
  }
}

// ============================================================================
// 默认导出
// ============================================================================

// 导出单例实例
export const pluginManager = PluginManager.getInstance();

export default pluginManager;