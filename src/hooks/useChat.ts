/**
 * ============================================================================
 * Chat Hook (useChat.ts)
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Single state management access point for chat interface
 * - Listen and aggregate 4 types of chat-related events
 * - Provide unified data interface for chat UI components
 * 
 * 4 Types of Events Monitored:
 * 1. API response events - streaming message data (streaming tokens, status updates)
 * 2. App artifact events - generated artifact content (images, documents, etc.)
 * 3. User send message events - user message sending state (loading, typing states)
 * 4. Widget events - sidebar widget generation events (Dream, Hunt, Omni, etc.)
 * 
 * Architecture Position:
 * - ChatLayout and other UI components get data through this hook, not direct store access
 * - This is the only bridge between chat interface and stores
 * - Listens to widget stores to create chat artifacts when widgets generate content
 * - Completely separated from BaseSidebar app interface hooks
 */
import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useArtifactStore } from '../stores/useArtifactStore';
import { useChatMessages, useChatLoading, useChatTyping } from '../stores/useChatStore';
import { useDreamState, useHuntState, useOmniState, useAssistantState } from '../stores/useWidgetStores';
import { ChatHookState } from '../types/chatTypes';
import { AppArtifact } from '../types/appTypes';

/**
 * Chat Hook - Single point for chat UI state
 * 
 * This hook encapsulates all chat interface state by listening to:
 * - Store messages (API streaming responses)
 * - Store artifacts (generated content)  
 * - Store loading states (user interactions)
 * - Widget stores (sidebar app generated content)
 * 
 * UI components should use this instead of direct store access.
 */
export const useChat = (): ChatHookState => {
  // 1. API response events - streaming messages
  const messages = useChatMessages();
  const isLoading = useChatLoading();
  const isTyping = useChatTyping();
  
  // 2. App artifact events - generated artifacts
  const { artifacts, addArtifact } = useArtifactStore();
  const { currentApp, showRightSidebar } = useAppStore();
  
  // 3. Widget events - sidebar widget generated content
  const dreamState = useDreamState();
  const huntState = useHuntState();
  const omniState = useOmniState();
  const assistantState = useAssistantState();
  
  // Track latest artifacts from widgets
  const [latestWidgetArtifact, setLatestWidgetArtifact] = useState<AppArtifact | null>(null);
  
  // Listen to widget state changes and create chat artifacts
  useEffect(() => {
    // Dream widget - image generation
    if (dreamState.generatedImage && !dreamState.isGenerating) {
      const artifact: AppArtifact = {
        id: `dream-${Date.now()}`,
        appId: 'dream',
        appName: 'Dream',
        appIcon: '🎨',
        title: 'Generated Image',
        userInput: 'Image generation request',
        createdAt: new Date().toISOString(),
        isOpen: false,
        generatedContent: {
          type: 'image',
          content: dreamState.generatedImage,
          metadata: dreamState.lastParams
        }
      };
      addArtifact(artifact);
      setLatestWidgetArtifact(artifact);
    }
  }, [dreamState.generatedImage, dreamState.isGenerating, dreamState.lastParams, addArtifact]);
  
  useEffect(() => {
    // Hunt widget - search results
    if (huntState.searchResults.length > 0 && !huntState.isSearching) {
      const artifact: AppArtifact = {
        id: `hunt-${Date.now()}`,
        appId: 'hunt',
        appName: 'Hunt',
        appIcon: '🔍',
        title: 'Search Results',
        userInput: huntState.lastQuery || 'Search request',
        createdAt: new Date().toISOString(),
        isOpen: false,
        generatedContent: {
          type: 'data',
          content: JSON.stringify(huntState.searchResults),
          metadata: { query: huntState.lastQuery, resultCount: huntState.searchResults.length }
        }
      };
      addArtifact(artifact);
      setLatestWidgetArtifact(artifact);
    }
  }, [huntState.searchResults, huntState.isSearching, huntState.lastQuery, addArtifact]);
  
  useEffect(() => {
    // Omni widget - generated content
    if (omniState.generatedContent && !omniState.isGenerating) {
      const artifact: AppArtifact = {
        id: `omni-${Date.now()}`,
        appId: 'omni',
        appName: 'Omni',
        appIcon: '⚡',
        title: 'Generated Content',
        userInput: 'Content generation request',
        createdAt: new Date().toISOString(),
        isOpen: false,
        generatedContent: {
          type: 'text',
          content: omniState.generatedContent,
          metadata: omniState.lastParams
        }
      };
      addArtifact(artifact);
      setLatestWidgetArtifact(artifact);
    }
  }, [omniState.generatedContent, omniState.isGenerating, omniState.lastParams, addArtifact]);
  
  useEffect(() => {
    // Assistant widget - conversation context
    if (assistantState.conversationContext && !assistantState.isProcessing) {
      const artifact: AppArtifact = {
        id: `assistant-${Date.now()}`,
        appId: 'assistant',
        appName: 'Assistant',
        appIcon: '🤖',
        title: 'Conversation Context',
        userInput: 'Assistant interaction',
        createdAt: new Date().toISOString(),
        isOpen: false,
        generatedContent: {
          type: 'text',
          content: JSON.stringify(assistantState.conversationContext),
          metadata: {}
        }
      };
      addArtifact(artifact);
      setLatestWidgetArtifact(artifact);
    }
  }, [assistantState.conversationContext, assistantState.isProcessing, addArtifact]);
  
  // 4. Derived state for streaming status
  const streamingMessage = useMemo(() => 
    messages.find(m => m.isStreaming), 
    [messages]
  );
  
  const hasStreamingMessage = useMemo(() => 
    !!streamingMessage,
    [streamingMessage]
  );
  
  console.log('🔍 CHAT_INTERFACE: State update:', {
    messagesCount: messages.length,
    artifactsCount: artifacts.length,
    isLoading,
    isTyping,
    hasStreaming: hasStreamingMessage,
    streamingStatus: streamingMessage?.streamingStatus,
    latestWidgetArtifact: latestWidgetArtifact?.appName,
    dreamGenerating: dreamState.isGenerating,
    huntSearching: huntState.isSearching,
    omniGenerating: omniState.isGenerating,
    assistantProcessing: assistantState.isProcessing
  });
  
  return {
    // 1. API response events
    messages,
    isLoading,
    isTyping,
    
    // 2. App artifact events  
    artifacts,
    
    // 3. User send message events context
    currentApp,
    showRightSidebar,
    
    // 4. Widget events state
    latestWidgetArtifact,
    isAnyWidgetGenerating: dreamState.isGenerating || huntState.isSearching || omniState.isGenerating || assistantState.isProcessing,
    
    // Derived state
    hasStreamingMessage,
    streamingMessage
  };
};