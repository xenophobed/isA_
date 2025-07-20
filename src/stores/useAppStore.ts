import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppArtifact } from '../types/app_types';
import { logger, LogCategory } from '../utils/logger';

// App state types
export type AppId = 'dream' | 'hunt' | 'omni' | 'digitalhub' | 'assistant' | 'data-scientist' | 'doc';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AppState {
  // Current active app
  currentApp: AppId | null;
  showRightSidebar: boolean;
  
  // Chat state - centralized here
  messages: ChatMessage[];
  isTyping: boolean;
  chatLoading: boolean;
  
  // Streaming state
  streamingMessage: {
    id: string;
    content: string;
    status: string;
  } | null;
  
  // Chat and input state
  triggeredAppInput: string;
  
  // Artifacts and generated content
  artifacts: AppArtifact[];
  pendingArtifact: {
    imageUrl?: string;
    textContent?: string;
    userInput: string;
    timestamp: number;
    aiResponse?: string;
    messageId?: string;
  } | null;
  
  // App-specific states
  dream: {
    generatedImage: string | null;
    isGenerating: boolean;
    lastParams: any;
  };
  
  hunt: {
    searchResults: any[];
    isSearching: boolean;
    lastQuery: string;
  };
  
  omni: {
    generatedContent: string | null;
    isGenerating: boolean;
    lastParams: any;
  };
  
  // UI state
  showLoggingDashboard: boolean;
  chatKey: number;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  // App navigation
  setCurrentApp: (app: AppId | null) => void;
  setShowRightSidebar: (show: boolean) => void;
  closeApp: () => void;
  reopenApp: (artifactId: string) => void;
  
  // Chat actions
  addMessage: (message: ChatMessage) => void;
  sendMessage: (content: string, client: any, metadata?: Record<string, any>) => Promise<void>;
  sendMultimodalMessage: (content: string, files: File[], client: any, metadata?: Record<string, any>) => Promise<void>;
  setIsTyping: (typing: boolean) => void;
  setChatLoading: (loading: boolean) => void;
  clearMessages: () => void;
  
  // Streaming actions
  setStreamingMessage: (message: { id: string; content: string; status: string } | null) => void;
  appendToStreamingMessage: (content: string) => void;
  updateStreamingStatus: (status: string) => void;
  
  // Chat and input
  setTriggeredAppInput: (input: string) => void;
  startNewChat: () => void;
  
  // Artifacts
  setArtifacts: (artifacts: AppArtifact[] | ((prev: AppArtifact[]) => AppArtifact[])) => void;
  setPendingArtifact: (artifact: AppState['pendingArtifact']) => void;
  addArtifact: (artifact: AppArtifact) => void;
  
  // Dream app actions
  setDreamGeneratedImage: (image: string | null) => void;
  setDreamGenerating: (isGenerating: boolean) => void;
  setDreamParams: (params: any) => void;
  
  // Hunt app actions
  setHuntSearchResults: (results: any[]) => void;
  setHuntSearching: (isSearching: boolean) => void;
  setHuntLastQuery: (query: string) => void;
  
  // Omni app actions
  setOmniGeneratedContent: (content: string | null) => void;
  setOmniGenerating: (isGenerating: boolean) => void;
  setOmniParams: (params: any) => void;
  
  // UI actions
  setShowLoggingDashboard: (show: boolean) => void;
  
  // Loading and error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentApp: null,
    showRightSidebar: false,
    messages: [],
    isTyping: false,
    chatLoading: false,
    streamingMessage: null,
    triggeredAppInput: '',
    artifacts: [],
    pendingArtifact: null,
    
    dream: {
      generatedImage: null,
      isGenerating: false,
      lastParams: null
    },
    
    hunt: {
      searchResults: [],
      isSearching: false,
      lastQuery: ''
    },
    
    omni: {
      generatedContent: null,
      isGenerating: false,
      lastParams: null
    },
    
    showLoggingDashboard: false,
    chatKey: 0,
    isLoading: false,
    error: null,
    
    // Chat Actions
    addMessage: (message) => {
      set((state) => ({
        messages: [...state.messages, message]
      }));
      logger.info(LogCategory.CHAT_FLOW, 'Message added to store', { 
        messageId: message.id, 
        role: message.role, 
        contentLength: message.content.length 
      });
    },

    sendMessage: async (content, client, metadata = {}) => {
      if (!client) {
        logger.error(LogCategory.CHAT_FLOW, 'No AI client provided to sendMessage');
        return;
      }

      const { setChatLoading, setIsTyping } = get();
      
      // Don't add user message here - it's already added in onBeforeSend
      // This avoids duplicate user messages
      
      setChatLoading(true);
      setIsTyping(true);
      
      try {
        // Use the provided client (from SimpleAIProvider)
        await client.sendMessage(content, metadata);
        
        // AI response will be handled by the client's event system in main_app
        setChatLoading(false);
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to send message', { error });
        setChatLoading(false);
        setIsTyping(false);
      }
    },

    sendMultimodalMessage: async (content, files, client, metadata = {}) => {
      if (!client) {
        logger.error(LogCategory.CHAT_FLOW, 'No AI client provided to sendMultimodalMessage');
        return;
      }

      const { setChatLoading, setIsTyping } = get();
      
      // Don't add user message here - it's already added in onBeforeSend
      // This avoids duplicate user messages
      
      setChatLoading(true);
      setIsTyping(true);
      
      try {
        // Use the provided client (from SimpleAIProvider) with multimodal method
        await client.sendMultimodalMessage(content, files, metadata);
        
        // AI response will be handled by the client's event system in main_app
        setChatLoading(false);
        
        logger.info(LogCategory.CHAT_FLOW, 'Multimodal message sent successfully', {
          contentLength: content.length,
          fileCount: files.length,
          fileTypes: files.map(f => f.type)
        });
      } catch (error) {
        logger.error(LogCategory.CHAT_FLOW, 'Failed to send multimodal message', { error });
        setChatLoading(false);
        setIsTyping(false);
      }
    },

    setIsTyping: (typing) => {
      set({ isTyping: typing });
    },

    setChatLoading: (loading) => {
      set({ chatLoading: loading });
    },

    clearMessages: () => {
      set({ messages: [] });
      logger.info(LogCategory.CHAT_FLOW, 'Messages cleared');
    },

    // Streaming Actions
    setStreamingMessage: (message) => {
      set({ streamingMessage: message });
      if (message) {
        logger.debug(LogCategory.CHAT_FLOW, 'Streaming message started', { id: message.id, status: message.status });
      }
    },

    appendToStreamingMessage: (content) => {
      set((state) => {
        if (!state.streamingMessage) return state;
        return {
          streamingMessage: {
            ...state.streamingMessage,
            content: state.streamingMessage.content + content
          }
        };
      });
    },

    updateStreamingStatus: (status) => {
      set((state) => {
        if (!state.streamingMessage) return state;
        return {
          streamingMessage: {
            ...state.streamingMessage,
            status
          }
        };
      });
      logger.debug(LogCategory.CHAT_FLOW, 'Streaming status updated', { status });
    },

    // App Actions
    setCurrentApp: (app) => {
      const oldApp = get().currentApp;
      logger.trackStateChange('currentApp', oldApp, app, 'useAppStore');
      set({ currentApp: app });
    },
    
    setShowRightSidebar: (show) => {
      const oldValue = get().showRightSidebar;
      const currentApp = get().currentApp;
      logger.trackStateChange('showRightSidebar', oldValue, show, 'useAppStore');
      logger.trackSidebarInteraction(show ? 'opened' : 'closed', currentApp || undefined);
      set({ showRightSidebar: show });
    },
    
    closeApp: () => {
      const currentApp = get().currentApp;
      logger.info(LogCategory.SIDEBAR_INTERACTION, 'Closing app', { currentApp });
      
      set((state) => ({
        showRightSidebar: false,
        currentApp: null,
        triggeredAppInput: '',
        artifacts: state.artifacts.map(a => ({ ...a, isOpen: false }))
      }));
    },
    
    reopenApp: (artifactId) => {
      const artifacts = get().artifacts;
      const artifact = artifacts.find(a => a.id === artifactId);
      if (!artifact) return;

      logger.info(LogCategory.SIDEBAR_INTERACTION, 'Reopening app from artifact', { 
        artifactId, 
        appId: artifact.appId,
        appName: artifact.appName
      });

      set((state) => ({
        currentApp: artifact.appId as AppId,
        showRightSidebar: true,
        triggeredAppInput: artifact.userInput,
        artifacts: state.artifacts.map(a => ({
          ...a,
          isOpen: a.id === artifactId
        }))
      }));
    },
    
    setTriggeredAppInput: (input) => {
      const oldValue = get().triggeredAppInput;
      const currentApp = get().currentApp;
      logger.trackStateChange('triggeredAppInput', oldValue, input, 'useAppStore');
      if (input) {
        logger.trackUserInput(input, { source: 'app_trigger', currentApp });
      }
      set({ triggeredAppInput: input });
    },
    
    startNewChat: () => {
      logger.info(LogCategory.CHAT_FLOW, 'Starting new chat session');
      set((state) => ({
        chatKey: state.chatKey + 1,
        currentApp: null,
        showRightSidebar: false,
        triggeredAppInput: '',
        error: null
      }));
    },
    
    setArtifacts: (artifacts) => {
      const newArtifacts = typeof artifacts === 'function' ? artifacts(get().artifacts) : artifacts;
      logger.trackStateChange('artifacts', undefined, Array.isArray(newArtifacts) ? newArtifacts.length : 'function', 'useAppStore');
      set({ artifacts: newArtifacts });
    },
    
    setPendingArtifact: (artifact) => {
      const oldValue = get().pendingArtifact;
      logger.trackStateChange('pendingArtifact', oldValue?.messageId, artifact?.messageId, 'useAppStore');
      if (artifact) {
        logger.debug(LogCategory.ARTIFACT_CREATION, 'Pending artifact set', { 
          type: artifact.imageUrl ? 'image' : 'text',
          messageId: artifact.messageId,
          userInput: artifact.userInput?.substring(0, 50)
        });
      }
      set({ pendingArtifact: artifact });
    },
    
    addArtifact: (artifact) => {
      logger.trackArtifactCreation(artifact);
      set((state) => ({
        artifacts: [...state.artifacts, artifact]
      }));
    },
    
    // Dream app actions
    setDreamGeneratedImage: (image) => {
      const oldValue = get().dream.generatedImage;
      logger.trackStateChange('dreamGeneratedImage', oldValue, image, 'useAppStore');
      if (image) {
        logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream image generated', { imageUrl: image });
      }
      set((state) => ({
        dream: { ...state.dream, generatedImage: image }
      }));
    },
    
    setDreamGenerating: (isGenerating) => {
      set((state) => ({
        dream: { ...state.dream, isGenerating }
      }));
    },
    
    setDreamParams: (params) => {
      set((state) => ({
        dream: { ...state.dream, lastParams: params }
      }));
    },
    
    // Hunt app actions
    setHuntSearchResults: (results) => {
      set((state) => ({
        hunt: { ...state.hunt, searchResults: results }
      }));
    },
    
    setHuntSearching: (isSearching) => {
      set((state) => ({
        hunt: { ...state.hunt, isSearching }
      }));
    },
    
    setHuntLastQuery: (query) => {
      set((state) => ({
        hunt: { ...state.hunt, lastQuery: query }
      }));
    },
    
    // Omni app actions
    setOmniGeneratedContent: (content) => {
      set((state) => ({
        omni: { ...state.omni, generatedContent: content }
      }));
    },
    
    setOmniGenerating: (isGenerating) => {
      set((state) => ({
        omni: { ...state.omni, isGenerating }
      }));
    },
    
    setOmniParams: (params) => {
      set((state) => ({
        omni: { ...state.omni, lastParams: params }
      }));
    },
    
    // UI actions
    setShowLoggingDashboard: (show) => {
      logger.trackSidebarInteraction(show ? 'logging_dashboard_opened' : 'logging_dashboard_closed');
      set({ showLoggingDashboard: show });
    },
    
    // Loading and error
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setError: (error) => {
      set({ error });
      if (error) {
        logger.error(LogCategory.STATE_CHANGE, 'App error set', { error });
      }
    },
    
    clearError: () => {
      set({ error: null });
    }
  }))
);

// Selectors for common use cases
export const useCurrentApp = () => useAppStore(state => state.currentApp);
export const useShowRightSidebar = () => useAppStore(state => state.showRightSidebar);
export const useArtifacts = () => useAppStore(state => state.artifacts);
export const useDreamState = () => useAppStore(state => state.dream);
export const useHuntState = () => useAppStore(state => state.hunt);
export const useOmniState = () => useAppStore(state => state.omni);
export const useAppLoading = () => useAppStore(state => state.isLoading);
export const useAppError = () => useAppStore(state => state.error);

// Chat selectors
export const useChatMessages = () => useAppStore(state => state.messages);
export const useChatTyping = () => useAppStore(state => state.isTyping);
export const useChatLoading = () => useAppStore(state => state.chatLoading);
export const useStreamingMessage = () => useAppStore(state => state.streamingMessage);
export const useChatActions = () => useAppStore(state => ({
  addMessage: state.addMessage,
  sendMessage: state.sendMessage,  // Note: requires (content, client, metadata)
  sendMultimodalMessage: state.sendMultimodalMessage,  // Note: requires (content, files, client, metadata)
  setIsTyping: state.setIsTyping,
  setChatLoading: state.setChatLoading,
  clearMessages: state.clearMessages,
  setStreamingMessage: state.setStreamingMessage,
  appendToStreamingMessage: state.appendToStreamingMessage,
  updateStreamingStatus: state.updateStreamingStatus
}));