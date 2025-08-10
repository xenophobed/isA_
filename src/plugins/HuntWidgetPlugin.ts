/**
 * ============================================================================
 * Hunt Widget Plugin (HuntWidgetPlugin.ts) - Hunt Widget 插件适配器
 * ============================================================================
 * 
 * 核心职责：
 * - 将现有的 Hunt Widget Store 适配为插件接口
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
 * Hunt Widget 插件实现
 */
export class HuntWidgetPlugin implements WidgetPlugin {
  // 插件基础信息
  id: AppId = 'hunt';
  name = 'HuntAI Search';
  icon = '🔍';
  description = 'Product search and comparison with detailed analysis';
  version = '1.0.0';
  triggers = [
    'search for',
    'find',
    'hunt',
    'compare',
    'look for',
    'product search',
    'shopping',
    'price comparison'
  ];

  // 插件配置
  config = {
    maxPromptLength: 500,
    timeout: 45000, // 45 seconds
    retryAttempts: 2
  };

  constructor() {
    logger.debug(LogCategory.SYSTEM, '🔍 HuntWidgetPlugin initialized');
  }

  // ============================================================================
  // 插件生命周期
  // ============================================================================

  async onInit(): Promise<void> {
    logger.info(LogCategory.SYSTEM, '🔍 HuntWidgetPlugin: Initializing...');
  }

  onDestroy(): void {
    logger.info(LogCategory.SYSTEM, '🔍 HuntWidgetPlugin: Destroying...');
  }

  // ============================================================================
  // 核心执行方法
  // ============================================================================

  /**
   * 执行搜索
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateInput(input);

      logger.info(LogCategory.ARTIFACT_CREATION, '🔍 Hunt Plugin: Starting search', {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 调用现有的搜索逻辑
      const searchResults = await this.performSearch(input.prompt, input.options);

      // 构造插件输出
      const output: PluginOutput = {
        id: `hunt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'data',
        content: searchResults,
        metadata: {
          processingTime: Date.now() - startTime,
          version: 1,
          prompt: input.prompt,
          generatedAt: new Date().toISOString(),
          pluginVersion: this.version,
          resultCount: Array.isArray(searchResults) ? searchResults.length : 0
        }
      };

      logger.info(LogCategory.ARTIFACT_CREATION, '🔍 Hunt Plugin: Search completed', {
        outputId: output.id,
        processingTime: output.metadata?.processingTime,
        resultCount: output.metadata?.resultCount
      });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(LogCategory.ARTIFACT_CREATION, '🔍 Hunt Plugin: Search failed', {
        error: errorMessage,
        prompt: input.prompt,
        processingTime: Date.now() - startTime
      });

      throw new Error(`Hunt search failed: ${errorMessage}`);
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
      throw new Error('Search query is required and must be a string');
    }

    if (input.prompt.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (input.prompt.length > this.config.maxPromptLength) {
      throw new Error(`Search query too long. Max length: ${this.config.maxPromptLength} characters`);
    }
  }

  /**
   * 执行搜索 - 复用现有逻辑
   */
  private async performSearch(query: string, options: any = {}): Promise<any> {
    try {
      // 导入现有的 chatService（动态导入避免循环依赖）
      const { chatService } = await import('../api/chatService');
      
      // 模拟现有的 Widget Store 调用流程
      const sessionId = options.sessionId || `hunt_plugin_${Date.now()}`;
      const userId = options.userId || 'plugin_user';
      
      // 构造与现有系统兼容的请求
      const chatOptions = {
        session_id: sessionId,
        user_id: userId,
        prompt_name: 'hunt_general_prompt',
        prompt_args: {
          search_query: query,
          max_results: options.maxResults || 10,
          search_type: options.searchType || 'product'
        }
      };

      // 使用 Promise 包装现有的回调式 API
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Search timeout'));
        }, this.config.timeout);

        let searchResults: any[] = [];
        let messageCount = 0;
        let lastMessage = '';

        const callbacks = {
          onMessageComplete: (message?: string) => {
            messageCount++;
            console.log(`🔍 HUNT_PLUGIN: onMessageComplete #${messageCount}:`, message?.substring(0, 100) + '...');
            
            if (message && message.trim()) {
              lastMessage = message;
              
              // 等待可能的后续消息
              setTimeout(() => {
                if (lastMessage === message) { // 确认这是最后一条消息
                  clearTimeout(timeout);
                  console.log(`🔍 HUNT_PLUGIN: Final message selected (${messageCount} total):`, message.substring(0, 100) + '...');
                  
                  try {
                    // Try to parse JSON results from message
                    const results = JSON.parse(message);
                    if (Array.isArray(results)) {
                      searchResults = results;
                      resolve(results);
                    } else {
                      // Fallback: create a single result from the message
                      const fallbackResult = {
                        title: `Search Results for: ${query}`,
                        description: message,
                        content: message,
                        query: query,
                        timestamp: new Date().toISOString(),
                        type: 'search_response'
                      };
                      resolve([fallbackResult]);
                    }
                  } catch (parseError) {
                    // If parsing fails, create a single result
                    const fallbackResult = {
                      title: `Search Results for: ${query}`,
                      description: message,
                      content: message,
                      query: query,
                      timestamp: new Date().toISOString(),
                      type: 'search_response'
                    };
                    resolve([fallbackResult]);
                  }
                }
              }, 500); // 500ms延迟，等待可能的后续消息
            }
          },
          
          onArtifactCreated: (artifact: any) => {
            // Handle artifacts if they're created
            if (artifact.content && !searchResults.length) {
              clearTimeout(timeout);
              resolve(Array.isArray(artifact.content) ? artifact.content : [artifact.content]);
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
        chatService.sendMessage(query, chatOptions, 'dev_key_test', callbacks)
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      });

    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, '🔍 Hunt Plugin: Failed to perform search', {
        error,
        query
      });
      throw error;
    }
  }
}

// ============================================================================
// 默认导出
// ============================================================================

// 创建插件实例
export const huntWidgetPlugin = new HuntWidgetPlugin();

export default huntWidgetPlugin;