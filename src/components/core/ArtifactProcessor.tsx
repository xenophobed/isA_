/**
 * ============================================================================
 * 工件处理器 (ArtifactProcessor.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 监听AI消息，提取媒体内容和工件信息
 * - 创建待处理工件(pendingArtifact)
 * - 在适当时机将待处理工件转换为正式工件
 * 
 * 【监听事件】
 * 第93行：client.on('message:received', handleAIMessage)
 * 只处理 role='assistant' 且无sender的消息
 * 
 * 【工件创建逻辑】
 * - 检测AI消息中的media_items
 * - 根据当前应用类型创建不同工件
 * - 图像类型：Dream应用的图像工件
 * - 文本类型：其他应用的文本工件
 * 
 * 【重要】这里监听message:received但不添加聊天消息
 * 只处理工件创建，不影响消息显示
 */
import React, { useEffect } from 'react';
import { useSimpleAI } from '../../providers/SimpleAIProvider';
import { useAppStore, useChatActions } from '../../stores/useAppStore';
import { AppArtifact } from '../../types/app_types';
import { logger, LogCategory } from '../../utils/logger';

export const ArtifactProcessor: React.FC = () => {
  const client = useSimpleAI();
  const {
    currentApp,
    showRightSidebar,
    triggeredAppInput,
    artifacts,
    setArtifacts,
    pendingArtifact,
    setPendingArtifact,
    setDreamGeneratedImage
  } = useAppStore();
  const { addMessage, setIsTyping } = useChatActions();

  // Listen to AI messages for artifact creation
  useEffect(() => {
    if (!client || client.isDestroyed()) return;

    const handleAIMessage = (message: any) => {
      const traceId = logger.startTrace('AI_MESSAGE_PROCESSING');
      logger.trackAIMessage(message);
      
      console.log('🎧 ARTIFACT PROCESSOR: Received AI message:', { 
        role: message.role, 
        sender: message.metadata?.sender,
        currentApp, 
        showRightSidebar,
        hasMediaItems: !!message.metadata?.media_items,
        mediaItemsCount: message.metadata?.media_items?.length || 0
      });

      // ArtifactProcessor only handles artifact creation, not chat messages
      
      // Handle artifact creation for media content
      if (message.role === 'assistant' && message.content && !message.metadata?.sender) {
        if (message.metadata?.media_items && message.metadata.media_items.length > 0) {
          logger.info(LogCategory.AI_MESSAGE, 'Processing chat response with media items', { 
            currentApp, 
            mediaItemsCount: message.metadata.media_items.length 
          });
          
          const imageItem = message.metadata.media_items.find((item: any) => item.type === 'image');
          if (imageItem && imageItem.url) {
            console.log('🖼️ Image detected in response:', imageItem.url);
            
            const hasImageTrigger = triggeredAppInput && 
              ['image', 'generate', 'create', 'picture', 'art', 'draw', 'photo'].some(word => 
                triggeredAppInput.toLowerCase().includes(word)
              );
            
            if (hasImageTrigger && (!currentApp || !showRightSidebar)) {
              console.log('🎨 Creating pending artifact for image generation request');
              setPendingArtifact({
                imageUrl: imageItem.url,
                userInput: triggeredAppInput || 'Generated image from AI',
                timestamp: Date.now(),
                aiResponse: message.content,
                messageId: message.id
              });
            } else if (currentApp === 'dream' && showRightSidebar) {
              console.log('🎨 Dream app is open, setting image and creating artifact');
              setDreamGeneratedImage(imageItem.url);
              setPendingArtifact({
                imageUrl: imageItem.url,
                userInput: triggeredAppInput || 'Generated image from AI',
                timestamp: Date.now(),
                aiResponse: message.content,
                messageId: message.id
              });
            }
          } else if (currentApp && ['omni', 'hunt', 'assistant', 'data-scientist', 'knowledge'].includes(currentApp)) {
            console.log('📄 Creating text artifact from chat response for app:', currentApp);
            setPendingArtifact({
              textContent: message.content,
              userInput: triggeredAppInput || `Content from chat for ${currentApp}`,
              timestamp: Date.now(),
              aiResponse: message.content,
              messageId: message.id
            });
          }
        }
      }
      
      logger.endTrace();
    };

    const unsubscribe = client.on('message:received', handleAIMessage);
    return () => unsubscribe?.();
  }, [client, currentApp, showRightSidebar, triggeredAppInput, setPendingArtifact, addMessage, setIsTyping, setDreamGeneratedImage]);

  // Process pending artifacts
  useEffect(() => {
    if (pendingArtifact && showRightSidebar && currentApp) {
      const traceId = logger.startTrace('ARTIFACT_PROCESSING');
      logger.info(LogCategory.ARTIFACT_CREATION, 'Processing pending artifact', { 
        artifactType: pendingArtifact.imageUrl ? 'image' : 'text',
        currentApp, 
        showRightSidebar,
        messageId: pendingArtifact.messageId
      });
      
      const { userInput, timestamp, aiResponse, messageId } = pendingArtifact;
      
      const existingArtifact = artifacts.find(a => 
        a.generatedContent?.metadata?.messageId === messageId
      );
      
      if (!existingArtifact) {
        let artifact: AppArtifact | null = null;
        
        // Create artifact based on app type
        if (currentApp === 'dream' && pendingArtifact.imageUrl) {
          artifact = {
            id: `artifact-${timestamp}`,
            appId: 'dream',
            appName: 'Dream Generator',
            appIcon: '🎨',
            title: 'Dream Generation Complete',
            userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'image',
              content: pendingArtifact.imageUrl,
              thumbnail: pendingArtifact.imageUrl,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                aiResponse: aiResponse || 'Generated content',
                messageId
              }
            }
          };
          setDreamGeneratedImage(pendingArtifact.imageUrl);
        } else if (pendingArtifact.textContent) {
          const appConfigs = {
            omni: { name: 'Omni Content Generator', icon: '⚡', title: 'Content Generation Session' },
            hunt: { name: 'Hunt AI Search', icon: '🔍', title: 'Product Search Results' },
            assistant: { name: 'AI Assistant', icon: '🤖', title: 'Assistant Response' },
            'data-scientist': { name: 'DataWise Analytics', icon: '📊', title: 'Data Analysis Results' },
            knowledge: { name: 'Knowledge Hub', icon: '🧠', title: 'Knowledge Analysis Results' }
          };
          
          const config = appConfigs[currentApp as keyof typeof appConfigs];
          if (config) {
            artifact = {
              id: `artifact-${timestamp}`,
              appId: currentApp as any,
              appName: config.name,
              appIcon: config.icon,
              title: config.title,
              userInput,
              createdAt: new Date(timestamp).toISOString(),
              isOpen: true,
              generatedContent: {
                type: 'text',
                content: pendingArtifact.textContent,
                metadata: {
                  generatedAt: new Date(timestamp).toISOString(),
                  prompt: userInput,
                  messageId,
                  wordCount: pendingArtifact.textContent.split(' ').length
                }
              }
            };
          }
        }
        
        if (artifact) {
          setArtifacts(prev => [...prev, artifact]);
          logger.trackArtifactCreation(artifact);
          console.log('📦 Created artifact:', artifact.title);
        }
      }
      
      setPendingArtifact(null);
      logger.endTrace();
    }
  }, [pendingArtifact, currentApp, showRightSidebar, artifacts, setArtifacts, setPendingArtifact, setDreamGeneratedImage]);

  return null;
};