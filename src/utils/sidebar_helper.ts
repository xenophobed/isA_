import { logger, LogCategory } from './logger';

/**
 * Sidebar 通用工具类
 * 为所有 app sidebar 提供统一的私有请求和 artifact 管理
 */

export interface SidebarConfig {
  appId: string;
  appName: string;
  appIcon: string;
}

export interface ArtifactData {
  type: 'image' | 'text' | 'data' | 'file';
  content: string;
  title?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export class SidebarHelper {
  private client: any;
  private config: SidebarConfig;

  constructor(client: any, config: SidebarConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * 发送私有请求（不显示在聊天框）
   */
  async sendPrivateRequest(
    prompt: string, 
    workflow: 'intelligent' | 'quick' = 'quick',
    additionalMetadata?: Record<string, any>
  ): Promise<string> {
    const requestId = `${this.config.appId}-${workflow}-${Date.now()}`;
    
    const messageData = {
      sender: `${this.config.appId}-app`,
      requestId,
      workflow,
      private: true,
      skipChatDisplay: true,
      ...additionalMetadata
    };

    logger.trackAPICall('sendMessage (private)', 'POST', messageData);
    logger.info(LogCategory.USER_INPUT, `Starting ${workflow} generation for ${this.config.appId}`, {
      promptLength: prompt.length,
      workflow,
      appId: this.config.appId
    });

    try {
      const messageId = await this.client.sendMessage(prompt, messageData);
      return messageId;
    } catch (error) {
      logger.error(LogCategory.API_CALL, `${this.config.appId} generation failed`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * 处理私有响应并提取数据
   */
  extractResponseData(message: any): ArtifactData | null {
    logger.debug(LogCategory.AI_MESSAGE, `${this.config.appId} processing response`, {
      messageRole: message.role,
      hasContent: !!message.content,
      hasMetadata: !!message.metadata,
      metadataSender: message.metadata?.sender
    });

    // 图片类型 - 优先从 media_items 提取
    if (message.metadata?.media_items && message.metadata.media_items.length > 0) {
      const imageItem = message.metadata.media_items.find((item: any) => item.type === 'image');
      if (imageItem && imageItem.url) {
        logger.info(LogCategory.ARTIFACT_CREATION, `${this.config.appId} image extracted`, {
          imageUrl: imageItem.url,
          title: imageItem.title
        });

        return {
          type: 'image',
          content: `![${imageItem.title || 'Generated Image'}](${imageItem.url})`,
          imageUrl: imageItem.url,
          title: imageItem.title || 'Generated Image',
          metadata: message.metadata
        };
      }
    }

    // 文本类型
    if (message.content) {
      logger.info(LogCategory.ARTIFACT_CREATION, `${this.config.appId} text content extracted`, {
        contentLength: message.content.length
      });

      return {
        type: 'text',
        content: message.content,
        title: `${this.config.appName} Result`,
        metadata: message.metadata
      };
    }

    logger.warn(LogCategory.ARTIFACT_CREATION, `${this.config.appId} no extractable data found`);
    return null;
  }

  /**
   * 发送 artifact 到聊天框
   */
  async sendArtifactToChat(artifactData: ArtifactData): Promise<void> {
    const artifactMessage = {
      type: 'artifact',
      content: artifactData.content,
      metadata: {
        artifactType: artifactData.type,
        title: artifactData.title,
        app: this.config.appId,
        appName: this.config.appName,
        appIcon: this.config.appIcon,
        timestamp: Date.now(),
        ...artifactData.metadata
      }
    };

    logger.info(LogCategory.ARTIFACT_CREATION, `${this.config.appId} sending artifact to chat`, {
      artifactType: artifactData.type,
      title: artifactData.title
    });

    // 发送普通消息到聊天框（不带 private 标志）
    setTimeout(() => {
      this.client?.sendMessage(artifactMessage.content, artifactMessage.metadata);
    }, 500);
  }

  /**
   * 设置响应监听器
   */
  setupResponseListener(
    isGenerating: () => boolean,
    onSuccess: (artifactData: ArtifactData) => void,
    onError?: (error: any) => void
  ): () => void {
    const handleAIResponse = (message: any) => {
      // 只处理来自当前 app 的响应
      if (message.metadata?.sender === `${this.config.appId}-app` && isGenerating()) {
        logger.trackAIMessage(message);
        
        const artifactData = this.extractResponseData(message);
        if (artifactData) {
          onSuccess(artifactData);
          // 自动发送 artifact 到聊天框
          this.sendArtifactToChat(artifactData);
        } else if (onError) {
          onError(new Error('No valid data extracted from response'));
        }
      }
    };

    // return this.client.on('message:received', handleAIResponse); // on method not available
    return () => {};
  }
}

/**
 * 创建 SidebarHelper 实例的工厂函数
 */
export function createSidebarHelper(
  client: any, 
  appId: string, 
  appName: string, 
  appIcon: string
): SidebarHelper {
  return new SidebarHelper(client, { appId, appName, appIcon });
}

/**
 * 所有支持的 App 配置
 */
export const APP_CONFIGS = {
  dream: { appId: 'dream', appName: 'Dream Generator', appIcon: '🎨' },
  hunt: { appId: 'hunt', appName: 'Hunt Search', appIcon: '🔍' },
  digitalhub: { appId: 'digitalhub', appName: 'Digital Hub', appIcon: '📁' },
  assistant: { appId: 'assistant', appName: 'AI Assistant', appIcon: '🤖' },
  omni: { appId: 'omni', appName: 'Omni Content Generator', appIcon: '⚡' },
  'data-scientist': { appId: 'data-scientist', appName: 'DataWise Analytics', appIcon: '📊' },
  doc: { appId: 'doc', appName: 'DocIntell AI', appIcon: '📄' }
} as const;