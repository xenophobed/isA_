/**
 * ============================================================================
 * Custom Automation Widget Plugin (CustomAutomationWidgetPlugin.ts)
 * ============================================================================
 * 
 * 核心职责：
 * - 将CustomAutomation Widget Store适配为插件接口
 * - 提供自动化业务流程的插件执行入口
 * - 支持智能模板选择和流程自动化
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
 * Custom Automation Widget 插件实现
 */
export class CustomAutomationWidgetPlugin implements WidgetPlugin {
  // 插件基础信息
  id: AppId = 'custom_automation';
  name = 'Smart Business Automation';
  icon = '🤖';
  description = 'Intelligent automation for business processes with customizable workflows';
  version = '1.0.0';
  triggers = [
    'automate',
    'automation',
    'workflow',
    'process',
    'streamline',
    'optimize process',
    'business automation',
    'etl pipeline',
    'data processing',
    'content workflow',
    'api integration',
    'batch processing'
  ];

  // 插件配置
  config = {
    maxPromptLength: 800,
    timeout: 120000, // 2 minutes for complex automation tasks
    retryAttempts: 2
  };

  constructor() {
    logger.debug(LogCategory.SYSTEM, '🤖 CustomAutomationWidgetPlugin initialized');
  }

  // ============================================================================
  // 插件生命周期
  // ============================================================================

  async onInit(): Promise<void> {
    logger.debug(LogCategory.SYSTEM, 'CustomAutomationWidgetPlugin: Initializing...');
  }

  onDestroy(): void {
    logger.info(LogCategory.SYSTEM, '🤖 CustomAutomationWidgetPlugin: Destroying...');
  }

  // ============================================================================
  // 核心执行方法
  // ============================================================================

  /**
   * 执行自动化流程
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateInput(input);

      logger.info(LogCategory.ARTIFACT_CREATION, '🤖 Automation Plugin: Starting automation', {
        prompt: input.prompt?.substring(0, 100) + '...',
        context: input.context
      });

      // 分析用户意图，选择合适的自动化模板
      const automationIntent = this.analyzeAutomationIntent(input.prompt);
      
      // 构建自动化参数
      const automationParams = {
        templateId: automationIntent.templateId,
        inputs: automationIntent.inputs,
        mode: 'guided',
        chatContext: {
          sessionId: input.context?.sessionId || 'unknown',
          messageHistory: input.context?.messageHistory || []
        }
      };

      // 生成自动化结果
      const result = await this.generateAutomationResult(automationParams);

      const executionTime = Date.now() - startTime;

      logger.info(LogCategory.ARTIFACT_CREATION, '🤖 Automation Plugin: Completed', {
        templateId: automationIntent.templateId,
        executionTime,
        success: true
      });

      const output: PluginOutput = {
        id: `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'analysis', // Changed from data to analysis for proper artifact rendering
        content: result,
        metadata: {
          processingTime: executionTime,
          version: 1,
          prompt: input.prompt,
          generatedAt: new Date().toISOString(),
          pluginVersion: this.version,
          templateUsed: automationIntent.templateId,
          stepsCompleted: result.stepsCompleted || 0
        }
      };

      return output;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error(LogCategory.ARTIFACT_CREATION, '🤖 Automation Plugin: Failed', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      });

      throw new Error(`Custom automation failed: ${error instanceof Error ? error.message : 'Unknown automation error'}`);
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 验证输入参数
   */
  private validateInput(input: PluginInput): void {
    if (!input.prompt) {
      throw new Error('Prompt is required for automation');
    }

    if (input.prompt.length > this.config.maxPromptLength) {
      throw new Error(`Prompt too long. Maximum ${this.config.maxPromptLength} characters allowed.`);
    }
  }

  /**
   * 分析自动化意图
   */
  private analyzeAutomationIntent(prompt: string): {
    templateId: string;
    inputs: Record<string, any>;
  } {
    const lowerPrompt = prompt.toLowerCase();

    // ETL/数据处理相关
    if (lowerPrompt.includes('data') || lowerPrompt.includes('etl') || lowerPrompt.includes('extract') || lowerPrompt.includes('database')) {
      return {
        templateId: 'data_etl_pipeline',
        inputs: this.extractETLParams(prompt)
      };
    }

    // 内容工作流相关
    if (lowerPrompt.includes('content') || lowerPrompt.includes('publish') || lowerPrompt.includes('article') || lowerPrompt.includes('workflow')) {
      return {
        templateId: 'content_workflow',
        inputs: this.extractContentParams(prompt)
      };
    }

    // API集成相关
    if (lowerPrompt.includes('api') || lowerPrompt.includes('integration') || lowerPrompt.includes('sync') || lowerPrompt.includes('connect')) {
      return {
        templateId: 'api_integration',
        inputs: this.extractAPIParams(prompt)
      };
    }

    // 默认使用数据处理模板
    return {
      templateId: 'data_etl_pipeline',
      inputs: this.extractGenericParams(prompt)
    };
  }

  /**
   * 提取ETL参数
   */
  private extractETLParams(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};

    // 检测数据库类型
    if (prompt.includes('mysql')) params.source_db = 'mysql_prod';
    else if (prompt.includes('postgres')) params.source_db = 'pg_staging';
    else if (prompt.includes('mongo')) params.source_db = 'mongo_analytics';
    else params.source_db = 'mysql_prod'; // 默认

    // 检测输出格式
    if (prompt.includes('json')) params.target_format = 'json';
    else if (prompt.includes('csv')) params.target_format = 'csv';
    else if (prompt.includes('parquet')) params.target_format = 'parquet';
    else params.target_format = 'json'; // 默认

    // 检测批次大小
    const batchMatch = prompt.match(/batch\s*size\s*[:\s]*(\d+)|(\d+)\s*records?/i);
    params.batch_size = batchMatch ? parseInt(batchMatch[1] || batchMatch[2]) : 1000;

    return params;
  }

  /**
   * 提取内容参数
   */
  private extractContentParams(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};

    // 检测内容类型
    if (prompt.includes('article')) params.content_type = 'article';
    else if (prompt.includes('product')) params.content_type = 'product_desc';
    else if (prompt.includes('social')) params.content_type = 'social_media';
    else params.content_type = 'article'; // 默认

    // 检测发布渠道
    const channels = [];
    if (prompt.includes('website')) channels.push('website');
    if (prompt.includes('wechat')) channels.push('wechat');
    if (prompt.includes('weibo')) channels.push('weibo');
    params.target_channels = channels.length > 0 ? channels : ['website']; // 默认

    // 检测自动调度
    params.auto_schedule = prompt.includes('schedule') || prompt.includes('automatic');

    return params;
  }

  /**
   * 提取API参数
   */
  private extractAPIParams(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};

    // 尝试提取API端点
    const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/i);
    params.api_endpoint = urlMatch ? urlMatch[1] : 'https://api.example.com/v1';

    // 检测认证方式
    if (prompt.includes('oauth')) params.auth_method = 'oauth2';
    else if (prompt.includes('basic auth')) params.auth_method = 'basic';
    else params.auth_method = 'api_key'; // 默认

    // 检测同步频率
    if (prompt.includes('realtime') || prompt.includes('real-time')) params.sync_frequency = 'realtime';
    else if (prompt.includes('hourly')) params.sync_frequency = 'hourly';
    else if (prompt.includes('daily')) params.sync_frequency = 'daily';
    else params.sync_frequency = 'hourly'; // 默认

    return params;
  }

  /**
   * 提取通用参数
   */
  private extractGenericParams(prompt: string): Record<string, any> {
    return {
      prompt_analysis: prompt,
      auto_configured: true,
      confidence: 'medium'
    };
  }

  /**
   * 生成自动化结果
   */
  private async generateAutomationResult(params: any): Promise<any> {
    // 模拟自动化执行过程
    const result = {
      templateId: params.templateId,
      status: 'completed',
      stepsCompleted: 3,
      totalSteps: 3,
      executionSummary: this.generateExecutionSummary(params),
      results: this.generateMockResults(params),
      recommendations: this.generateRecommendations(params)
    };

    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 100));

    return result;
  }

  /**
   * 生成执行摘要
   */
  private generateExecutionSummary(params: any): string {
    switch (params.templateId) {
      case 'data_etl_pipeline':
        return `数据ETL流水线已成功执行。从${params.inputs.source_db}提取数据，转换为${params.inputs.target_format}格式，批次大小：${params.inputs.batch_size}。`;
      
      case 'content_workflow':
        return `内容工作流程已完成。创建了${params.inputs.content_type}类型的内容，并发布到${params.inputs.target_channels.join(', ')}渠道。`;
      
      case 'api_integration':
        return `API集成配置已完成。连接到${params.inputs.api_endpoint}，使用${params.inputs.auth_method}认证，同步频率：${params.inputs.sync_frequency}。`;
      
      default:
        return '自动化流程已成功完成。';
    }
  }

  /**
   * 生成模拟结果
   */
  private generateMockResults(params: any): any {
    switch (params.templateId) {
      case 'data_etl_pipeline':
        return {
          recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
          errorCount: Math.floor(Math.random() * 5),
          processingTime: `${Math.floor(Math.random() * 30) + 5}m ${Math.floor(Math.random() * 60)}s`,
          outputLocation: `/data/processed/${Date.now()}.${params.inputs.target_format}`
        };
      
      case 'content_workflow':
        return {
          contentCreated: Math.floor(Math.random() * 10) + 1,
          channelsPublished: params.inputs.target_channels.length,
          engagementScore: (Math.random() * 100).toFixed(1) + '%',
          scheduledPosts: params.inputs.auto_schedule ? Math.floor(Math.random() * 5) + 1 : 0
        };
      
      case 'api_integration':
        return {
          connectionStatus: 'success',
          syncedRecords: Math.floor(Math.random() * 5000) + 500,
          lastSyncTime: new Date().toISOString(),
          nextSyncScheduled: new Date(Date.now() + 3600000).toISOString()
        };
      
      default:
        return { status: 'completed', timestamp: new Date().toISOString() };
    }
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(params: any): string[] {
    const recommendations = [];
    
    switch (params.templateId) {
      case 'data_etl_pipeline':
        recommendations.push('考虑增加数据质量检查步骤');
        recommendations.push('优化批次大小以提高处理效率');
        recommendations.push('添加增量更新机制');
        break;
      
      case 'content_workflow':
        recommendations.push('设置内容审核自动化规则');
        recommendations.push('添加A/B测试功能');
        recommendations.push('集成更多社交媒体平台');
        break;
      
      case 'api_integration':
        recommendations.push('实现失败重试机制');
        recommendations.push('添加数据验证规则');
        recommendations.push('设置监控和告警');
        break;
      
      default:
        recommendations.push('考虑添加更多自动化步骤');
        recommendations.push('优化流程性能');
    }
    
    return recommendations;
  }
}

// 导出插件实例
export default new CustomAutomationWidgetPlugin();