/**
 * ============================================================================
 * Knowledge Widget Plugin (KnowledgeWidgetPlugin.ts) - Knowledge Widget 插件适配器
 * ============================================================================
 * 
 * 核心职责：
 * - 将现有的 Knowledge Widget Store 适配为插件接口
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
 * Knowledge Widget 插件实现
 */
export class KnowledgeWidgetPlugin implements WidgetPlugin {
  // 插件基础信息
  id: AppId = 'knowledge';
  name = 'Knowledge Hub';
  icon = '🧠';
  description = 'Advanced document analysis with vector and graph RAG';
  version = '1.0.0';
  triggers = [
    'analyze document',
    'knowledge search',
    'document analysis',
    'rag search',
    'research',
    'knowledge base',
    'semantic search'
  ];

  // 插件配置
  config = {
    maxPromptLength: 1000,
    timeout: 75000, // 75 seconds for document processing
    retryAttempts: 2
  };

  constructor() {
    logger.debug(LogCategory.SYSTEM, '🧠 KnowledgeWidgetPlugin initialized');
  }

  // ============================================================================
  // 插件生命周期
  // ============================================================================

  async onInit(): Promise<void> {
    logger.info(LogCategory.SYSTEM, '🧠 KnowledgeWidgetPlugin: Initializing...');
  }

  onDestroy(): void {
    logger.info(LogCategory.SYSTEM, '🧠 KnowledgeWidgetPlugin: Destroying...');
  }

  // ============================================================================
  // 核心执行方法
  // ============================================================================

  /**
   * 执行知识分析
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateInput(input);

      logger.info(LogCategory.ARTIFACT_CREATION, '🧠 Knowledge Plugin: Starting knowledge analysis', {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 调用现有的知识分析逻辑
      const analysisResult = await this.performKnowledgeAnalysis(input.prompt, input.options);

      // 构造插件输出
      const output: PluginOutput = {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'knowledge',
        content: analysisResult,
        metadata: {
          processingTime: Date.now() - startTime,
          version: 1,
          prompt: input.prompt,
          generatedAt: new Date().toISOString(),
          pluginVersion: this.version
        }
      };

      logger.info(LogCategory.ARTIFACT_CREATION, '🧠 Knowledge Plugin: Analysis completed', {
        outputId: output.id,
        processingTime: output.metadata?.processingTime,
        resultType: typeof analysisResult
      });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(LogCategory.ARTIFACT_CREATION, '🧠 Knowledge Plugin: Analysis failed', {
        error: errorMessage,
        prompt: input.prompt,
        processingTime: Date.now() - startTime
      });

      throw new Error(`Knowledge analysis failed: ${errorMessage}`);
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
      throw new Error('Knowledge query is required and must be a string');
    }

    if (input.prompt.trim().length === 0) {
      throw new Error('Knowledge query cannot be empty');
    }

    if (input.prompt.length > this.config.maxPromptLength) {
      throw new Error(`Knowledge query too long. Max length: ${this.config.maxPromptLength} characters`);
    }
  }

  /**
   * 执行知识分析 - 复用现有逻辑
   */
  private async performKnowledgeAnalysis(query: string, options: any = {}): Promise<any> {
    try {
      // 导入现有的 chatService（动态导入避免循环依赖）
      const { chatService } = await import('../api/chatService');
      
      // 模拟现有的 Widget Store 调用流程
      const sessionId = options.sessionId || `knowledge_plugin_${Date.now()}`;
      const userId = options.userId || 'plugin_user';
      
      // 构造与现有系统兼容的请求
      const chatOptions = {
        session_id: sessionId,
        user_id: userId,
        prompt_name: 'intelligent_rag_search_prompt',
        prompt_args: {
          search_query: query,
          documents: options.documents || [],
          search_depth: options.depth || 'comprehensive',
          include_citations: options.includeCitations || true
        }
      };

      // 使用 Promise 包装现有的回调式 API
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Knowledge analysis timeout'));
        }, this.config.timeout);

        let knowledgeResult: any = null;
        let messageCount = 0;
        let lastMessage = '';

        const callbacks = {
          onMessageComplete: (message: string) => {
            messageCount++;
            console.log(`🧠 KNOWLEDGE_PLUGIN: onMessageComplete #${messageCount}:`, message?.substring(0, 100) + '...');
            
            if (message && message.trim()) {
              lastMessage = message;
              knowledgeResult = message;
              
              // 不要立即resolve，等待可能的后续消息
              // 使用较短的延迟等待，如果没有新消息就resolve
              setTimeout(() => {
                if (lastMessage === message) { // 确认这是最后一条消息
                  clearTimeout(timeout);
                  console.log(`🧠 KNOWLEDGE_PLUGIN: Final message selected (${messageCount} total):`, message.substring(0, 100) + '...');
                  resolve(message);
                }
              }, 500); // 500ms延迟，等待可能的后续消息
            } else {
              // 如果没有有效消息，等待一下再决定
              setTimeout(() => {
                if (!knowledgeResult) {
                  clearTimeout(timeout);
                  reject(new Error('No knowledge analysis result generated'));
                }
              }, 500);
            }
          },
          
          onArtifactCreated: (artifact: any) => {
            // Handle artifacts if they're created
            if (artifact.content && !knowledgeResult) {
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
        chatService.sendMessage(query, chatOptions, 'dev_key_test', callbacks)
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      });

    } catch (error) {
      logger.error(LogCategory.ARTIFACT_CREATION, '🧠 Knowledge Plugin: Failed to perform analysis', {
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
export const knowledgeWidgetPlugin = new KnowledgeWidgetPlugin();

export default knowledgeWidgetPlugin;