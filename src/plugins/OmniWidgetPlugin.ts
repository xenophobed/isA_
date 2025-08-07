/**
 * ============================================================================
 * Omni Widget Plugin (OmniWidgetPlugin.ts) - Omni Widget 插件适配器
 * ============================================================================
 * 
 * 核心职责：
 * - 将现有的 Omni Widget Store 适配为插件接口
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
 * Omni Widget 插件实现
 */
export class OmniWidgetPlugin implements WidgetPlugin {
  // 插件基础信息
  id: AppId = 'omni';
  name = 'Omni Content Generator';
  icon = '⚡';
  description = 'Multi-purpose content creation with customizable tone and length';
  version = '1.0.0';
  triggers = [
    'generate content',
    'create content',
    'write',
    'compose',
    'omni',
    'general content',
    'article',
    'blog post',
    'story'
  ];

  // 插件配置
  config = {
    maxPromptLength: 1000,
    timeout: 60000, // 60 seconds for longer content
    retryAttempts: 2
  };

  constructor() {
    logger.debug(LogCategory.SYSTEM, '⚡ OmniWidgetPlugin initialized');
  }

  // ============================================================================
  // 插件生命周期
  // ============================================================================

  async onInit(): Promise<void> {
    logger.info(LogCategory.SYSTEM, '⚡ OmniWidgetPlugin: Initializing...');
  }

  onDestroy(): void {
    logger.info(LogCategory.SYSTEM, '⚡ OmniWidgetPlugin: Destroying...');
  }

  // ============================================================================
  // 核心执行方法
  // ============================================================================

  /**
   * 执行内容生成
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateInput(input);

      logger.info(LogCategory.ARTIFACT_CREATION, '⚡ Omni Plugin: Starting content generation', {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 调用现有的内容生成逻辑
      const content = await this.generateContent(input.prompt, input.options);

      // 构造插件输出
      const output: PluginOutput = {
        id: `omni_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: content,
        metadata: {
          processingTime: Date.now() - startTime,
          version: 1,
          prompt: input.prompt,
          generatedAt: new Date().toISOString(),
          pluginVersion: this.version
        }
      };

      logger.info(LogCategory.ARTIFACT_CREATION, '⚡ Omni Plugin: Content generation completed', {
        outputId: output.id,
        processingTime: output.metadata?.processingTime,
        contentLength: content?.length
      });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(LogCategory.ARTIFACT_CREATION, '⚡ Omni Plugin: Content generation failed', {
        error: errorMessage,
        prompt: input.prompt,
        processingTime: Date.now() - startTime
      });

      throw new Error(`Omni content generation failed: ${errorMessage}`);
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
   * 生成内容 - 复用现有逻辑
   */
  private async generateContent(prompt: string, options: any = {}): Promise<string> {
    try {
      // 导入现有的 chatService（动态导入避免循环依赖）
      const { chatService } = await import('../api/chatService');
      
      // 模拟现有的 Widget Store 调用流程
      const sessionId = options.sessionId || `omni_plugin_${Date.now()}`;
      const userId = options.userId || 'plugin_user';
      
      // 构造与现有系统兼容的请求
      const chatOptions = {
        session_id: sessionId,
        user_id: userId,
        prompt_name: 'general_content_prompt',
        prompt_args: {
          subject: prompt,
          depth: options.depth || 'deep',
          reference_urls: options.referenceUrls || [],
          reference_text: options.referenceText || `You are an expert content creator with research capabilities.\n\nTASK: Create content about "${prompt}"\nDEPTH: ${options.depth || 'deep'} analysis\n\nREFERENCES PROVIDED:\n\n\n\nBegin your research and content creation now.`
        }
      };

      // 使用 Promise 包装现有的回调式 API
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Content generation timeout'));
        }, this.config.timeout);

        let completeContent = '';

        const callbacks = {
          onMessageComplete: (message: string) => {
            clearTimeout(timeout);
            if (message && message.trim()) {
              completeContent = message;
              resolve(message);
            } else {
              reject(new Error('No content generated'));
            }
          },
          
          onArtifactCreated: (artifact: any) => {
            // Handle artifacts if they're created
            if (artifact.type === 'text' && artifact.content && !completeContent) {
              clearTimeout(timeout);
              resolve(artifact.content);
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
      logger.error(LogCategory.ARTIFACT_CREATION, '⚡ Omni Plugin: Failed to generate content', {
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
export const omniWidgetPlugin = new OmniWidgetPlugin();

export default omniWidgetPlugin;