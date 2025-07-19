import React, { useState, useEffect } from 'react';
import { SimpleAIProvider, useSimpleAI } from './providers/SimpleAIProvider';
import { ChatLayout } from './components/ui/chat/ChatLayout';
import { AppTriggerManager } from './components/managers/app_trigger_manager';
import { ArtifactManager } from './components/managers/artifact_manager';
import { SidebarManager } from './components/managers/sidebar_manager';
import { SessionManager } from './components/managers/SessionManager';
import { useAppStore, AppId, useChatActions, useChatMessages } from './stores/useAppStore';
import { AppArtifact } from './types/app_types';
import { logger, LogCategory } from './utils/logger';
import { LoggingDashboard } from './components/dashboard/logging_dashboard';

/**
 * Main App Content Component (inside provider)
 */
const MainAppContent: React.FC = () => {
  logger.trackComponentRender('MainApp', { timestamp: Date.now() });
  
  // App state management with Zustand - centralized
  const {
    currentApp,
    setCurrentApp,
    showRightSidebar,
    setShowRightSidebar,
    artifacts,
    setArtifacts,
    triggeredAppInput,
    setTriggeredAppInput,
    pendingArtifact,
    setPendingArtifact,
    chatKey,
    showLoggingDashboard,
    setShowLoggingDashboard,
    startNewChat,
    closeApp,
    reopenApp,
    dream,
    setDreamGeneratedImage
  } = useAppStore();

  // Chat state from centralized store
  const messages = useChatMessages();
  const { addMessage, sendMessage, setIsTyping, setStreamingMessage, appendToStreamingMessage, updateStreamingStatus } = useChatActions();

  const dreamGeneratedImage = dream.generatedImage;
  
  // Use simple AI client (now inside provider)
  const client = useSimpleAI();


  // Initialize component logging
  useEffect(() => {
    logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component mounted');
    return () => {
      logger.info(LogCategory.COMPONENT_RENDER, 'MainApp component unmounted');
    };
  }, []);

  // Listen to streaming events
  useEffect(() => {
    if (!client) return;

    const handleStreamingStart = (data: any) => {
      console.log('🎬 STREAMING: Started', data);
      setStreamingMessage({
        id: `streaming-${Date.now()}`,
        content: '',
        status: 'starting'
      });
    };

    const handleStreamingToken = (data: any) => {
      console.log('🔤 STREAMING: Token received', data);
      appendToStreamingMessage(data.content || '');
    };

    const handleStreamingStatus = (data: any) => {
      console.log('📊 STREAMING: Status update', data);
      updateStreamingStatus(data.status || 'processing');
    };

    const handleStreamingEnd = (data: any) => {
      console.log('🏁 STREAMING: Ended', data);
      setStreamingMessage(null);
    };

    // Set up streaming event listeners
    const unsubscribeStart = client.on('streaming:start', handleStreamingStart);
    const unsubscribeToken = client.on('token:received', handleStreamingToken);
    const unsubscribeStatus = client.on('streaming:status', handleStreamingStatus);
    const unsubscribeEnd = client.on('streaming:end', handleStreamingEnd);

    return () => {
      unsubscribeStart?.();
      unsubscribeToken?.();
      unsubscribeStatus?.();
      unsubscribeEnd?.();
    };
  }, [client, setStreamingMessage, appendToStreamingMessage, updateStreamingStatus]);

  // Listen to AI messages for artifact creation
  useEffect(() => {
    if (!client) return;

    const handleAIMessage = (message: any) => {
      const traceId = logger.startTrace('AI_MESSAGE_PROCESSING');
      logger.trackAIMessage(message);
      
      console.log('🎧 MAIN APP: Received AI message for artifact processing:', { 
        role: message.role, 
        sender: message.metadata?.sender,
        currentApp, 
        showRightSidebar,
        hasMediaItems: !!message.metadata?.media_items,
        mediaItemsCount: message.metadata?.media_items?.length || 0
      });

      // Add AI message to store for chat display
      if (message.role === 'assistant') {
        // Create brief chat message based on content type
        let chatContent = message.content;
        
        // If this has media items (images), show a brief message in chat
        if (message.metadata?.media_items && message.metadata.media_items.length > 0) {
          const imageItems = message.metadata.media_items.filter((item: any) => item.type === 'image');
          if (imageItems.length > 0) {
            chatContent = `✨ Generated ${imageItems.length} image${imageItems.length > 1 ? 's' : ''} for your request`;
          }
        }
        // If content is very long, truncate for chat display
        else if (message.content && message.content.length > 200) {
          chatContent = message.content.substring(0, 200) + '... [View full response in app]';
        }
        
        addMessage({
          id: message.id,
          role: 'assistant',
          content: chatContent,
          timestamp: message.timestamp,
          metadata: message.metadata
        });
        setIsTyping(false);
      }
      
      // Route based on sender, or handle chat responses without sender
      if (message.role === 'assistant' && message.content) {
        const sender = message.metadata?.sender;
        
        // Handle responses from app-specific requests (private requests)
        if (sender) {
          if (sender === 'dream-app' && currentApp === 'dream') {
          logger.info(LogCategory.AI_MESSAGE, 'Processing Dream app response', { sender, currentApp });
          console.log('🎨 Processing Dream app response');
          
          // 提取图片URL从AI响应中（优先从 media_items）
          let imageUrl = 'https://via.placeholder.com/400x300/4F46E5/white?text=Generated+Content';
          
          // 优先从 media_items 中提取
          if (message.metadata?.media_items && message.metadata.media_items.length > 0) {
            const imageItem = message.metadata.media_items.find((item: any) => item.type === 'image');
            if (imageItem && imageItem.url) {
              imageUrl = imageItem.url;
              console.log('🖼️ Extracted image URL from media_items:', imageUrl);
            }
          }
          // 备用：从消息内容中提取
          else if (message.content) {
            const imageUrlMatch = message.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
            if (imageUrlMatch) {
              imageUrl = imageUrlMatch[0];
              console.log('🖼️ Extracted image URL from content:', imageUrl);
            }
          }
          
          setPendingArtifact({
            imageUrl,
            userInput: triggeredAppInput || 'Image generation',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
        } else if (sender === 'omni-app' && currentApp === 'omni') {
          console.log('⚡ Processing Omni app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Content generation',
            timestamp: Date.now(),
            messageId: message.id
          });
        } else if (sender === 'hunt-app' && currentApp === 'hunt') {
          console.log('🔍 Processing Hunt app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Product search',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
        } else if (sender === 'digitalhub-app' && currentApp === 'digitalhub') {
          console.log('📁 Processing Digital Hub app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'File management',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
        } else if (sender === 'assistant-app' && currentApp === 'assistant') {
          console.log('🤖 Processing Assistant app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Assistant help',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
        } else if (sender === 'data-scientist-app' && currentApp === 'data-scientist') {
          console.log('📊 Processing Data Scientist app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Data analysis',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
        } else if (sender === 'doc-app' && currentApp === 'doc') {
          console.log('📄 Processing Doc app response');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Document processing',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id
          });
          } else {
            logger.debug(LogCategory.AI_MESSAGE, 'Message from different sender, not processing', { sender, currentApp });
            console.log('📨 Message from different sender, not processing:', { sender, currentApp });
          }
        } else {
          // Handle chat responses without sender (normal chat flow) - create artifacts for media content
          if (message.metadata?.media_items && message.metadata.media_items.length > 0) {
            logger.info(LogCategory.AI_MESSAGE, 'Processing chat response with media items', { currentApp, mediaItemsCount: message.metadata.media_items.length });
            console.log('💬 Processing chat response with media items:', { currentApp, mediaItems: message.metadata.media_items });
            
            // Check for images - only create artifacts if user has an app open or explicitly requested images
            const imageItem = message.metadata.media_items.find((item: any) => item.type === 'image');
            if (imageItem && imageItem.url) {
              console.log('🖼️ Image detected in response:', imageItem.url);
              
              // Only auto-open Dream app if user explicitly triggered image-related words
              const hasImageTrigger = triggeredAppInput && 
                ['image', 'generate', 'create', 'picture', 'art', 'draw', 'photo'].some(word => 
                  triggeredAppInput.toLowerCase().includes(word)
                );
              
              if (hasImageTrigger && (!currentApp || !showRightSidebar)) {
                console.log('🎨 Opening Dream app for image generation request');
                setTimeout(() => {
                  setCurrentApp('dream');
                  setShowRightSidebar(true);
                  setTriggeredAppInput(triggeredAppInput);
                }, 500);
                
                // Create artifact for explicitly requested image
                setPendingArtifact({
                  imageUrl: imageItem.url,
                  userInput: triggeredAppInput || 'Generated image from AI',
                  timestamp: Date.now(),
                  aiResponse: message.content,
                  messageId: message.id
                });
              } else if (currentApp === 'dream' && showRightSidebar) {
                // Create artifact if Dream app is already open
                setPendingArtifact({
                  imageUrl: imageItem.url,
                  userInput: triggeredAppInput || 'Generated image from AI',
                  timestamp: Date.now(),
                  aiResponse: message.content,
                  messageId: message.id
                });
              } else {
                console.log('🚫 Image detected but not creating artifact - no image request detected');
              }
            }
            
            // Handle text content for other apps
            else if (currentApp === 'omni' || currentApp === 'hunt' || currentApp === 'digitalhub' || currentApp === 'assistant' || currentApp === 'data-scientist' || currentApp === 'doc') {
              // Create text artifact for other apps
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
      }
      
      logger.endTrace();
    };

    const unsubscribe = client.on('message:received', handleAIMessage);
    return () => unsubscribe?.();
  }, [client, currentApp, showRightSidebar, triggeredAppInput, setPendingArtifact]);

  // Artifact handling logic
  useEffect(() => {
    if (pendingArtifact && showRightSidebar && currentApp) {
      const traceId = logger.startTrace('ARTIFACT_PROCESSING');
      logger.info(LogCategory.ARTIFACT_CREATION, 'Processing pending artifact', { 
        artifactType: pendingArtifact.imageUrl ? 'image' : 'text',
        currentApp, 
        showRightSidebar,
        messageId: pendingArtifact.messageId
      });
      console.log('🔄 Processing pending artifact:', { pendingArtifact, currentApp, showRightSidebar });
      
      // Handle Dream app artifacts
      if (currentApp === 'dream' && pendingArtifact.imageUrl) {
        const { imageUrl, userInput, timestamp, aiResponse, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating dream artifact with placeholder image');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'dream',
            appName: 'Dream Generator',
            appIcon: '🎨',
            title: 'Dream Generation Complete',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'image',
              content: imageUrl,
              thumbnail: imageUrl,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                aiResponse: aiResponse || 'Generated content',
                messageId: messageId
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          setDreamGeneratedImage(imageUrl);
          
          logger.trackArtifactCreation(artifact);
          
          // Emit event to chat layer
          logger.trackEventEmission('artifact:created', artifact);
          console.log('📡 Emitting artifact created event');
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Omni app text artifacts
      if (currentApp === 'omni' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating text artifact for:', textContent.substring(0, 100) + '...');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'omni',
            appName: 'Omni Content Generator',
            appIcon: '⚡',
            title: 'Content Generation Session',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                wordCount: textContent.split(' ').length,
                messageId: messageId
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          
          // Emit event to chat layer
          console.log('📡 Emitting artifact created event');
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Hunt app artifacts
      if (currentApp === 'hunt' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating hunt search artifact');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'hunt',
            appName: 'Hunt AI Search',
            appIcon: '🔍',
            title: 'Product Search Results',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                messageId: messageId,
                searchType: 'product'
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Digital Hub app artifacts
      if (currentApp === 'digitalhub' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating digitalhub management artifact');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'digitalhub',
            appName: 'Digital Hub Manager',
            appIcon: '📁',
            title: 'File Management Plan',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                messageId: messageId,
                managementType: 'file_organization'
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Assistant app artifacts
      if (currentApp === 'assistant' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating assistant response artifact');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'assistant',
            appName: 'AI Assistant',
            appIcon: '🤖',
            title: 'Assistant Response',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                messageId: messageId,
                responseType: 'general_assistance'
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Data Scientist app artifacts
      if (currentApp === 'data-scientist' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating data scientist analysis artifact');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'data-scientist',
            appName: 'DataWise Analytics',
            appIcon: '📊',
            title: 'Data Analysis Results',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                messageId: messageId,
                analysisType: 'data_analytics'
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      // Handle Doc app artifacts
      if (currentApp === 'doc' && pendingArtifact.textContent) {
        const { textContent, userInput, timestamp, messageId } = pendingArtifact;
        
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === messageId
        );
        
        if (!existingArtifact) {
          console.log('📦 Creating document processing artifact');
          const artifact: AppArtifact = {
            id: `artifact-${timestamp}`,
            appId: 'doc',
            appName: 'DocIntell AI',
            appIcon: '📄',
            title: 'Document Processing Results',
            userInput: userInput,
            createdAt: new Date(timestamp).toISOString(),
            isOpen: true,
            generatedContent: {
              type: 'text',
              content: textContent,
              metadata: {
                generatedAt: new Date(timestamp).toISOString(),
                prompt: userInput,
                messageId: messageId,
                processingType: 'document_analysis'
              }
            }
          };
          
          setArtifacts(prev => [...prev, artifact]);
          // client?.emit('artifact:created', artifact); // emit is private
        }
      }
      
      setPendingArtifact(null);
      logger.endTrace();
    }
  }, [pendingArtifact, currentApp, showRightSidebar, artifacts]);

  // App functions now handled by Zustand store

  // New chat (now handled by Zustand)
  const handleNewChat = () => {
    logger.info(LogCategory.CHAT_FLOW, 'Starting new chat session');
    console.log('🔄 Starting new chat...');
    startNewChat();
    logger.info(LogCategory.CHAT_FLOW, 'New chat session started', { chatKey });
    console.log('✅ New chat session started');
  };

  const sidebarContent = (
    <div className="p-6 h-full flex flex-col">
      <SessionManager
        onSessionSelect={(session) => {
          console.log('📋 Session selected:', session);
        }}
        onNewSession={handleNewChat}
      />
    </div>
  );

  // App configuration
  const availableApps = [
    {
      id: 'dream',
      name: 'Dream Generator',
      description: 'AI-powered image generation',
      icon: '🎨',
      triggers: ['image', 'generate', 'create', 'picture', 'art'],
    },
    {
      id: 'hunt',
      name: 'Hunt Search',
      description: 'Product search and comparison',
      icon: '🔍',
      triggers: ['search', 'product', 'buy', 'compare', 'shop'],
    },
    {
      id: 'digitalhub',
      name: 'Digital Hub',
      description: 'File management and organization',
      icon: '📁',
      triggers: ['file', 'document', 'organize', 'storage'],
    },
    {
      id: 'assistant',
      name: 'AI Assistant',
      description: 'Personal AI assistant for general tasks',
      icon: '🤖',
      triggers: ['help', 'assist', 'task', 'general'],
    },
    {
      id: 'omni',
      name: 'Omni Content Generator',
      description: 'Multi-purpose content creation',
      icon: '⚡',
      triggers: ['write', 'article', 'content', 'blog', 'text'],
    },
  ];

  // Handle image generation from Dream app
  const handleDreamImageGenerated = (imageUrl: string, prompt: string) => {
    console.log('🎨 Dream image generated:', { imageUrl, prompt });
    
    // Create artifact for the generated image
    const timestamp = Date.now();
    const artifact: AppArtifact = {
      id: `artifact-${timestamp}`,
      appId: 'dream',
      appName: 'Dream Generator',
      appIcon: '🎨',
      title: 'Dream Generation Complete',
      userInput: prompt,
      createdAt: new Date(timestamp).toISOString(),
      isOpen: true,
      generatedContent: {
        type: 'image',
        content: imageUrl,
        thumbnail: imageUrl,
        metadata: {
          generatedAt: new Date(timestamp).toISOString(),
          prompt: prompt,
          messageId: `dream-${timestamp}`
        }
      }
    };
    
    setArtifacts(prev => [...prev, artifact]);
    setDreamGeneratedImage(imageUrl);
    
    // Emit event to chat layer
    // client?.emit('artifact:created', artifact); // emit is private
  };

  const rightSidebarContent = (
    <SidebarManager 
      currentApp={currentApp}
      showRightSidebar={showRightSidebar}
      triggeredAppInput={triggeredAppInput}
      dreamGeneratedImage={dreamGeneratedImage}
      onCloseApp={closeApp}
      onDreamImageGenerated={handleDreamImageGenerated}
    />
  );

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🤖</span>
          AI Agent SDK - Super App
        </h2>
        {currentApp && (
          <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-sm flex items-center gap-2">
            <span>{availableApps.find(app => app.id === currentApp)?.icon}</span>
            <span>{availableApps.find(app => app.id === currentApp)?.name}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          SmartAgent v3.0
        </div>
        
        <button 
          onClick={() => setShowLoggingDashboard(true)}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 transition-all hover:scale-105 flex items-center gap-2"
          title="Open Data Flow Logger"
        >
          <span>📊</span>
          Logs
        </button>
        
        <button 
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all hover:scale-105 flex items-center gap-2"
        >
          <span>🚀</span>
          {showRightSidebar ? 'Hide Apps' : 'Show Apps'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <ChatLayout
          key={chatKey}
          headerContent={headerContent}
          sidebarContent={sidebarContent}
          showSidebar={true}
          rightSidebarContent={rightSidebarContent}
          showRightSidebar={showRightSidebar}
          sidebarMode="exclusive"
          sidebarWidth="16.67%"
          rightSidebarWidth="50%"
          inputProps={{
            placeholder: "Ask me anything... I can recommend apps to help! (try: 'help me create an image' or 'organize my files')",
            multiline: true,
            maxRows: 4,
            onBeforeSend: (message: string) => {
              const traceId = logger.startTrace('USER_INPUT_PROCESSING');
              logger.trackUserInput(message, { currentApp, showRightSidebar });
              console.log('🚀 Trigger test: Checking message:', message, { currentApp, showRightSidebar });
              
              // Check if message contains app trigger words
              const lowerMessage = message.toLowerCase();
              
              for (const app of availableApps) {
                const matchingTrigger = app.triggers.find(trigger => lowerMessage.includes(trigger));
                if (matchingTrigger) {
                  logger.trackAppTrigger(app.id, matchingTrigger, message);
                  console.log('🎯 App trigger detected!', { app: app.name, trigger: matchingTrigger, currentApp, showRightSidebar });
                  
                  // If the app is already open, send message normally (user is using the app)
                  if (currentApp === app.id && showRightSidebar) {
                    logger.info(LogCategory.USER_INPUT, 'App already open, sending message normally', { appId: app.id });
                    console.log('✅ App already open, sending message normally');
                    logger.endTrace();
                    return message;
                  }
                  
                  // If app is not open, open it and allow message to continue
                  logger.info(LogCategory.APP_TRIGGER, 'Opening app and allowing message', { appId: app.id, trigger: matchingTrigger });
                  console.log('📱 Opening app and allowing message');
                  setTimeout(() => {
                    setCurrentApp(app.id as AppId);
                    setShowRightSidebar(true);
                    setTriggeredAppInput(message);
                    logger.info(LogCategory.APP_TRIGGER, 'App opened successfully', { appId: app.id });
                    console.log('✨ App opened:', app.id);
                  }, 1000);
                  
                  // Allow message to continue to chat - return message
                  logger.endTrace();
                  return message;
                }
              }
              
              // No app triggered, send message normally
              logger.info(LogCategory.USER_INPUT, 'No app trigger detected, sending to API', { messageLength: message.length });
              logger.endTrace();
              return message;
            },
            onFileSelect: (files: FileList) => {
              logger.info(LogCategory.USER_INPUT, 'Files selected', { 
                fileCount: files.length,
                fileNames: Array.from(files).map(f => f.name)
              });
              console.log('📎 Files selected:', files);
              if (files.length > 0) {
                const fileMessage = `Organize ${files.length} file${files.length > 1 ? 's' : ''}: ${Array.from(files).map(f => f.name).join(', ')}`;
                setTimeout(() => {
                  setCurrentApp('digitalhub' as AppId);
                  setShowRightSidebar(true);
                  setTriggeredAppInput(fileMessage);
                  logger.info(LogCategory.APP_TRIGGER, 'Opened digitalhub app for files', { fileCount: files.length });
                  console.log('📁 Opened digitalhub app for files');
                }, 500);
              }
            }
          }}
          conversationProps={{
            welcomeMessage: "Hello! I'm your AI assistant with SmartAgent v3.0 integration capabilities. I can recommend and open specific apps based on your needs. Try asking me to help with creating images, organizing files, or searching for products!",
            customMessageRenderer: (message: any, index: number) => {
              logger.trackComponentRender('MessageRenderer', { 
                messageRole: message.role,
                messageId: message.id,
                index,
                currentApp,
                showRightSidebar
              });
              console.log('🔍 Custom renderer called:', { role: message.role, content: message.content?.substring(0, 50) + '...', currentApp, showRightSidebar });
              
              // Only handle rendering artifacts - no state updates here
              return ArtifactManager.renderMessage({
                message,
                artifacts,
                reopenApp
              });
            }
          }}
        />
      </div>
      
      {/* Logging Dashboard */}
      <LoggingDashboard 
        isOpen={showLoggingDashboard}
        onClose={() => setShowLoggingDashboard(false)}
      />
      
    </>
  );
};

/**
 * Main App Component with Provider Wrapper
 */
export const MainApp: React.FC = () => {
  return (
    <SimpleAIProvider apiEndpoint="http://localhost:8080">
      <MainAppContent />
    </SimpleAIProvider>
  );
};