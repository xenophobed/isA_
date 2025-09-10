/**
 * ============================================================================
 * Dream Widget Plugin (DreamWidgetPlugin.ts) - Dream Widget 插件适配器
 * ============================================================================
 * 
 * 核心职责：
 * - 将现有的 Dream Widget Store 适配为插件接口
 * - 提供统一的插件执行入口
 * - 保持与现有代码的兼容性
 * 
 * 设计原则：
 * - 最小侵入性，复用现有逻辑
 * - 标准化插件接口实现
 * - 保持错误处理一致性
 */

import { WidgetPlugin, PluginInput, PluginOutput } from '../types/pluginTypes';
import { AppId } from '../types/appTypes';
import { logger, LogCategory } from '../utils/logger';

/**
 * Dream Widget 插件实现
 */
export class DreamWidgetPlugin implements WidgetPlugin {
  // 插件基础信息
  id: AppId = 'dream';
  name = 'Dream Image Generator';
  icon = '🎨';
  description = 'Generate beautiful images from text descriptions using AI';
  version = '1.0.0';
  triggers = [
    'generate image',
    'create image',
    'draw',
    'paint',
    'dream',
    'imagine',
    'visualize'
  ];

  // 插件配置
  config = {
    maxPromptLength: 500,
    timeout: 30000, // 30 seconds
    retryAttempts: 2
  };

  constructor() {
    logger.debug(LogCategory.SYSTEM, '🎨 DreamWidgetPlugin initialized');
  }

  // ============================================================================
  // 插件生命周期
  // ============================================================================

  async onInit(): Promise<void> {
    logger.debug(LogCategory.SYSTEM, 'DreamWidgetPlugin: Initializing...');
    // 这里可以添加初始化逻辑，比如检查依赖、预加载资源等
    // 目前保持简单，因为 Dream Widget Store 已经处理了初始化
  }

  onDestroy(): void {
    logger.info(LogCategory.SYSTEM, '🎨 DreamWidgetPlugin: Destroying...');
    // 清理资源
  }

  // ============================================================================
  // 核心执行方法
  // ============================================================================

  /**
   * 执行图片生成
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateInput(input);

      logger.info(LogCategory.ARTIFACT_CREATION, '🎨 Dream Plugin: Starting image generation', {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 调用现有的图片生成逻辑
      const imageUrl = await this.generateImage(input.prompt, input.options);

      // 构造插件输出
      const output: PluginOutput = {
        id: `dream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        content: imageUrl,
        metadata: {
          processingTime: Date.now() - startTime,
          version: 1,
          prompt: input.prompt,
          generatedAt: new Date().toISOString(),
          pluginVersion: this.version
        }
      };

      logger.info(LogCategory.ARTIFACT_CREATION, '🎨 Dream Plugin: Image generation completed', {
        outputId: output.id,
        processingTime: output.metadata?.processingTime,
        imageUrl: imageUrl?.substring(0, 80) + '...'
      });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(LogCategory.ARTIFACT_CREATION, '🎨 Dream Plugin: Image generation failed', {
        error: errorMessage,
        prompt: input.prompt,
        processingTime: Date.now() - startTime
      });

      throw new Error(`Dream image generation failed: ${errorMessage}`);
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 验证输入参数
   */
  private validateInput(input: PluginInput): void {
    if (!input.prompt || typeof input.prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (input.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (input.prompt.length > this.config.maxPromptLength) {
      throw new Error(`Prompt too long. Max length: ${this.config.maxPromptLength} characters`);
    }
  }

  /**
   * 生成图片 - 复用现有逻辑
   */
  private async generateImage(prompt: string, options: any = {}): Promise<string> {
    // 这里复用现有的图片生成逻辑
    // 为了最小侵入性，我们直接调用现有的 chatService 逻辑
    
    try {
      // 导入现有的 chatService（动态导入避免循环依赖）
      const { chatService } = await import('../api/chatService');
      
      // 模拟现有的 Widget Store 调用流程
      const sessionId = options.sessionId || `dream_plugin_${Date.now()}`;
      const userId = options.userId || 'plugin_user';
      
      // 构造与现有系统兼容的请求
      const chatOptions = {
        session_id: sessionId,
        user_id: userId,
        prompt_name: 'dream_template', // 使用现有模板
        prompt_args: {
          prompt: prompt,
          style: options.style || 'default',
          quality: options.quality || 'standard'
        }
      };

      // 使用 Promise 包装现有的回调式 API
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image generation timeout'));
        }, this.config.timeout);

        let messageCount = 0;
        let lastMessage = '';

        const callbacks = {
          onArtifactCreated: (artifact: any) => {
            clearTimeout(timeout);
            if (artifact.type === 'image' && artifact.content) {
              resolve(artifact.content);
            } else {
              reject(new Error('Invalid artifact received'));
            }
          },
          
          onMessageComplete: (message?: string) => {
            messageCount++;
            console.log(`🎨 DREAM_PLUGIN: onMessageComplete #${messageCount}:`, message?.substring(0, 100) + '...');
            
            if (message && message.trim()) {
              lastMessage = message;
              
              // Extract image URL from the message
              const imageUrlMatch = message.match(/https:\/\/[^\s\)]+\.jpg|https:\/\/[^\s\)]+\.png|https:\/\/[^\s\)]+\.webp/);
              if (imageUrlMatch) {
                // 不要立即resolve，等待可能的后续消息
                // 使用较短的延迟等待，如果没有新消息就resolve
                setTimeout(() => {
                  if (lastMessage === message) { // 确认这是最后一条消息
                    clearTimeout(timeout);
                    console.log(`🎨 DREAM_PLUGIN: Final message selected (${messageCount} total):`, message.substring(0, 100) + '...');
                    resolve(imageUrlMatch[0]);
                  }
                }, 500); // 500ms延迟，等待可能的后续消息
              } else {
                // If no image URL found in message, wait for artifact or check later
                console.warn('🎨 Dream Plugin: No image URL found in message, waiting for artifact...');
              }
            }
          },
          
          onError: (error: any) => {
            clearTimeout(timeout);
            reject(error);
          },
          
          // 其他回调保持空实现
          onMessageStart: () => {},
          onMessageContent: () => {},
          onMessageStatus: () => {}
        };

        // 调用现有的 chatService
        chatService.sendMessage(prompt, chatOptions, 'dev_key_test', callbacks)
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      });

    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, '🎨 Dream Plugin: Failed to generate image', {
        error,
        prompt
      });
      throw error;
    }
  }
}

// ============================================================================
// 默认导出
// ============================================================================

// 创建插件实例
export const dreamWidgetPlugin = new DreamWidgetPlugin();

export default dreamWidgetPlugin;