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
import { useChatMessages, useChatLoading, useChatTyping, useChatActions } from '../stores/useChatStore';
import { useDreamState, useHuntState, useOmniState, useAssistantState, useDataScientistState, useKnowledgeState } from '../stores/useWidgetStores';
import { ChatHookState, ChatMessage } from '../types/chatTypes';
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
  const chatActions = useChatActions();
  
  // 2. App artifact events - generated artifacts
  const { artifacts, addArtifact } = useArtifactStore();
  const { currentApp, showRightSidebar } = useAppStore();
  
  // 3. Widget events - sidebar widget generated content
  const dreamState = useDreamState();
  const huntState = useHuntState();
  const omniState = useOmniState();
  const assistantState = useAssistantState();
  const dataScientistState = useDataScientistState();
  const knowledgeState = useKnowledgeState();
  
  // Track latest artifacts from widgets
  const [latestWidgetArtifact, setLatestWidgetArtifact] = useState<AppArtifact | null>(null);
  
  useEffect(() => {
    // Create artifact message when Dream generation starts
    if (dreamState.isGenerating && dreamState.lastParams && !messages.find(m => m.id === `dream-${dreamState.lastParams.prompt || 'unknown'}-generating`)) {
      const artifactMessage: ChatMessage = {
        id: `dream-${dreamState.lastParams.prompt || 'unknown'}-generating`,
        role: 'assistant',
        content: dreamState.generatedImage || '', // Will be updated when generation completes
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'artifact',
          appId: 'dream',
          appName: 'Dream',
          appIcon: '🎨',
          title: dreamState.isGenerating ? 'Generating Image...' : 'Generated Image',
          userInput: dreamState.lastParams.prompt || 'Image generation request',
          artifactData: {
            type: 'image',
            content: dreamState.generatedImage || 'Loading...',
            metadata: dreamState.lastParams
          }
        },
        isStreaming: dreamState.isGenerating,
        streamingStatus: dreamState.isGenerating ? 'Generating image...' : undefined
      };
      chatActions.addMessage(artifactMessage);
      console.log('🎨 CHAT_HOOK: Dream artifact message created:', dreamState.lastParams.prompt);
    }
  }, [dreamState.isGenerating, dreamState.lastParams, dreamState.generatedImage, messages, chatActions]);
  
  useEffect(() => {
    // Create artifact message when Hunt search starts
    if (huntState.isSearching && huntState.lastQuery && !messages.find(m => m.id === `hunt-${huntState.lastQuery}-searching`)) {
      const artifactMessage: ChatMessage = {
        id: `hunt-${huntState.lastQuery}-searching`,
        role: 'assistant',
        content: huntState.searchResults[0]?.content || '', // Will be updated when search completes
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'artifact',
          appId: 'hunt',
          appName: 'Hunt',
          appIcon: '🔍',
          title: huntState.isSearching ? 'Searching...' : `Search Results: ${huntState.lastQuery}`,
          userInput: huntState.lastQuery,
          artifactData: {
            type: 'search_results',
            content: huntState.isSearching ? [] : huntState.searchResults,
            metadata: { 
              query: huntState.lastQuery, 
              isSearching: huntState.isSearching,
              resultCount: huntState.searchResults.length
            }
          }
        },
        isStreaming: huntState.isSearching,
        streamingStatus: huntState.isSearching ? 'Searching...' : undefined
      };
      chatActions.addMessage(artifactMessage);
      console.log('🔍 CHAT_HOOK: Hunt artifact message created:', huntState.lastQuery);
    }
  }, [huntState.isSearching, huntState.lastQuery, huntState.searchResults, messages, chatActions]);

  // Update Hunt message when search completes
  useEffect(() => {
    if (!huntState.isSearching && huntState.lastQuery && huntState.searchResults.length > 0) {
      const messageId = `hunt-${huntState.lastQuery}-searching`;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        // Debug: check the actual search results structure
        console.log('🔍 CHAT_HOOK: Hunt search results:', {
          resultsLength: huntState.searchResults.length,
          firstResult: huntState.searchResults[0],
          allResults: huntState.searchResults
        });

        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: `Found ${huntState.searchResults.length} search results for "${huntState.lastQuery}"`,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: `Search Results: ${huntState.lastQuery}`,
            artifactData: {
              type: 'search_results',
              content: huntState.searchResults, // Pass the full search results array
              metadata: { 
                query: huntState.lastQuery, 
                isSearching: false,
                resultCount: huntState.searchResults.length
              }
            }
          }
        };
        chatActions.addMessage(updatedMessage); // This will update due to deduplication logic
        console.log('🔍 CHAT_HOOK: Hunt message updated with search results:', huntState.searchResults.length, 'results');
      }
    }
  }, [huntState.isSearching, huntState.lastQuery, huntState.searchResults, messages, chatActions]);
  
  useEffect(() => {
    // Create artifact message when Omni generation starts
    if (omniState.isGenerating && omniState.lastParams && !messages.find(m => m.id === `omni-${omniState.lastParams.prompt || 'unknown'}-generating`)) {
      const artifactMessage: ChatMessage = {
        id: `omni-${omniState.lastParams.prompt || 'unknown'}-generating`,
        role: 'assistant',
        content: omniState.generatedContent || '', // Will be updated when generation completes
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'artifact',
          appId: 'omni',
          appName: 'Omni Content',
          appIcon: '⚡',
          title: omniState.isGenerating ? 'Generating Content...' : 'Generated Content',
          userInput: omniState.lastParams.prompt || 'Content generation request',
          artifactData: {
            type: 'text',
            content: omniState.generatedContent || 'Loading...',
            metadata: omniState.lastParams
          }
        },
        isStreaming: omniState.isGenerating,
        streamingStatus: omniState.isGenerating ? 'Generating content...' : undefined
      };
      chatActions.addMessage(artifactMessage);
      console.log('⚡ CHAT_HOOK: Omni artifact message created:', omniState.lastParams.prompt);
    }
  }, [omniState.isGenerating, omniState.lastParams, omniState.generatedContent, messages, chatActions]);

  // Update Omni message when generation completes
  useEffect(() => {
    if (!omniState.isGenerating && omniState.lastParams && omniState.generatedContent) {
      const messageId = `omni-${omniState.lastParams.prompt || 'unknown'}-generating`;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: omniState.generatedContent,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Generated Content',
            artifactData: {
              type: 'text',
              content: omniState.generatedContent,
              metadata: omniState.lastParams
            }
          }
        };
        chatActions.addMessage(updatedMessage); // This will update due to deduplication logic
        console.log('⚡ CHAT_HOOK: Omni message updated with generated content');
      }
    }
  }, [omniState.isGenerating, omniState.lastParams, omniState.generatedContent, messages, chatActions]);

  useEffect(() => {
    // Create artifact message when DataScientist analysis starts
    if (dataScientistState.isAnalyzing && dataScientistState.lastParams && !messages.find(m => m.id === `data-scientist-${dataScientistState.lastParams.query || 'unknown'}-analyzing`)) {
      const artifactMessage: ChatMessage = {
        id: `data-scientist-${dataScientistState.lastParams.query || 'unknown'}-analyzing`,
        role: 'assistant',
        content: dataScientistState.analysisResult?.analysis?.summary || '', // Will be updated when analysis completes
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'artifact',
          appId: 'data-scientist',
          appName: 'DataWise Analytics',
          appIcon: '📊',
          title: dataScientistState.isAnalyzing ? 'Analyzing Data...' : 'Data Analysis Results',
          userInput: dataScientistState.lastParams.query || 'Data analysis request',
          artifactData: {
            type: 'data_analysis',
            content: dataScientistState.analysisResult || { analysis: { summary: 'Loading...', insights: [], recommendations: [] }, visualizations: [], statistics: {} },
            metadata: dataScientistState.lastParams
          }
        },
        isStreaming: dataScientistState.isAnalyzing,
        streamingStatus: dataScientistState.isAnalyzing ? 'Analyzing data...' : undefined
      };
      chatActions.addMessage(artifactMessage);
      console.log('📊 CHAT_HOOK: DataScientist artifact message created:', dataScientistState.lastParams.query);
    }
  }, [dataScientistState.isAnalyzing, dataScientistState.lastParams, dataScientistState.analysisResult, messages, chatActions]);

  // Update DataScientist message when analysis completes
  useEffect(() => {
    if (!dataScientistState.isAnalyzing && dataScientistState.lastParams && dataScientistState.analysisResult) {
      const messageId = `data-scientist-${dataScientistState.lastParams.query || 'unknown'}-analyzing`;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: dataScientistState.analysisResult.analysis?.summary || 'Analysis completed',
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Data Analysis Results',
            artifactData: {
              type: 'data_analysis',
              content: dataScientistState.analysisResult,
              metadata: dataScientistState.lastParams
            }
          }
        };
        chatActions.addMessage(updatedMessage); // This will update due to deduplication logic
        console.log('📊 CHAT_HOOK: DataScientist message updated with analysis results');
      }
    }
  }, [dataScientistState.isAnalyzing, dataScientistState.lastParams, dataScientistState.analysisResult, messages, chatActions]);

  useEffect(() => {
    // Create artifact message when Knowledge analysis starts
    if (knowledgeState.isProcessing && knowledgeState.lastParams && !messages.find(m => m.id === `knowledge-${knowledgeState.lastParams.query || 'unknown'}-processing`)) {
      const artifactMessage: ChatMessage = {
        id: `knowledge-${knowledgeState.lastParams.query || 'unknown'}-processing`,
        role: 'assistant',
        content: knowledgeState.analysisResult || '', // Will be updated when analysis completes
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'artifact',
          appId: 'knowledge',
          appName: 'Knowledge Hub',
          appIcon: '📚',
          title: knowledgeState.isProcessing ? 'Analyzing Documents...' : 'Document Analysis Results',
          userInput: knowledgeState.lastParams.query || 'Document analysis request',
          artifactData: {
            type: 'document_analysis',
            content: knowledgeState.analysisResult || 'Loading...',
            metadata: { 
              ...knowledgeState.lastParams,
              documentCount: knowledgeState.documents.length
            }
          }
        },
        isStreaming: knowledgeState.isProcessing,
        streamingStatus: knowledgeState.isProcessing ? 'Analyzing documents...' : undefined
      };
      chatActions.addMessage(artifactMessage);
      console.log('📚 CHAT_HOOK: Knowledge artifact message created:', knowledgeState.lastParams.query);
    }
  }, [knowledgeState.isProcessing, knowledgeState.lastParams, knowledgeState.analysisResult, knowledgeState.documents, messages, chatActions]);

  // Update Knowledge message when analysis completes
  useEffect(() => {
    if (!knowledgeState.isProcessing && knowledgeState.lastParams && knowledgeState.analysisResult) {
      const messageId = `knowledge-${knowledgeState.lastParams.query || 'unknown'}-processing`;
      const existingMessage = messages.find(m => m.id === messageId);
      
      if (existingMessage && existingMessage.isStreaming) {
        const updatedMessage: ChatMessage = {
          ...existingMessage,
          content: knowledgeState.analysisResult,
          isStreaming: false,
          streamingStatus: undefined,
          metadata: {
            ...existingMessage.metadata,
            title: 'Document Analysis Results',
            artifactData: {
              type: 'document_analysis',
              content: knowledgeState.analysisResult,
              metadata: { 
                ...knowledgeState.lastParams,
                documentCount: knowledgeState.documents.length
              }
            }
          }
        };
        chatActions.addMessage(updatedMessage); // This will update due to deduplication logic
        console.log('📚 CHAT_HOOK: Knowledge message updated with analysis results');
      }
    }
  }, [knowledgeState.isProcessing, knowledgeState.lastParams, knowledgeState.analysisResult, knowledgeState.documents, messages, chatActions]);

  // Assistant widget artifact - memoized to prevent duplicates
  const assistantArtifact = useMemo(() => {
    if (assistantState.lastInput) {
      const artifactId = `assistant-${assistantState.lastInput}-${assistantState.isProcessing ? 'processing' : 'completed'}`;
      return {
        id: artifactId,
        appId: 'assistant',
        appName: 'Assistant',
        appIcon: '🤖',
        title: assistantState.isProcessing ? 'Processing...' : 'Conversation Context',
        userInput: assistantState.lastInput || 'Assistant interaction',
        createdAt: `${artifactId}-timestamp`, // Stable timestamp based on ID
        isOpen: false,
        generatedContent: {
          type: 'text',
          content: assistantState.conversationContext ? JSON.stringify(assistantState.conversationContext) : 'Loading...',
          metadata: {}
        }
      } as AppArtifact;
    }
    return null;
  }, [assistantState.lastInput, assistantState.isProcessing, assistantState.conversationContext]);

  useEffect(() => {
    if (assistantArtifact && assistantState.lastInput) {
      addArtifact(assistantArtifact);
      setLatestWidgetArtifact(assistantArtifact);
      console.log('🤖 CHAT_HOOK: Assistant artifact created/updated');
    }
  }, [assistantArtifact, addArtifact]);
  
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
    assistantProcessing: assistantState.isProcessing,
    dataScientistAnalyzing: dataScientistState.isAnalyzing,
    knowledgeProcessing: knowledgeState.isProcessing
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
    isAnyWidgetGenerating: dreamState.isGenerating || huntState.isSearching || omniState.isGenerating || assistantState.isProcessing || dataScientistState.isAnalyzing || knowledgeState.isProcessing,
    
    // Derived state
    hasStreamingMessage,
    streamingMessage
  };
};