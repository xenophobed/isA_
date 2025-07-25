/**
 * ============================================================================
 * AI Provider (AIProvider.tsx) - Chat Service Context Management
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provide global ChatService instance via React Context
 * - Manage service lifecycle and connection state
 * - Unified AI service access point for the application
 * - Handle service initialization and cleanup
 * 
 * Separation of Concerns:
 * ✅ Responsible for:
 *   - ChatService instance creation and management
 *   - React Context provision and state management
 *   - Service lifecycle management (init/cleanup)
 *   - Connection status tracking
 * 
 * ❌ Not responsible for:
 *   - Specific API request logic (handled by ChatService)
 *   - Message parsing and processing (handled by SSEParser)
 *   - Business logic processing (handled by modules)
 *   - UI state management (handled by stores)
 * 
 * Usage:
 * - Wrap component tree with <AIProvider> at app root
 * - Use useChatService() hook to get service instance
 * - Use useConnectionStatus() to get connection state
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatService } from '../api/chatService';

interface AIContextType {
  chatService: ChatService | null;
  isConnected: boolean;
}

const AIContext = createContext<AIContextType>({
  chatService: null,
  isConnected: false
});

export const useChatService = () => {
  const context = useContext(AIContext);
  
  if (context === undefined) {
    throw new Error('useChatService must be used within an AIProvider');
  }
  
  return context.chatService;
};

export const useConnectionStatus = () => {
  const context = useContext(AIContext);
  
  if (context === undefined) {
    throw new Error('useConnectionStatus must be used within an AIProvider');
  }
  
  return context.isConnected;
};

// Keep backward compatibility for existing code
export const useAI = () => {
  console.warn('useAI is deprecated, use useChatService instead');
  return useChatService();
};

interface AIProviderProps {
  children: React.ReactNode;
  apiEndpoint?: string;
}

export const AIProvider: React.FC<AIProviderProps> = ({ 
  children, 
  apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8080' 
}) => {
  const [chatService, setChatService] = useState(() => {
    console.log('🏗️ AI Provider: Creating new ChatService instance');
    return new ChatService();
  });
  const [isConnected, setIsConnected] = useState(false);

  // Initialize service and set connection status
  useEffect(() => {
    if (chatService) {
      console.log('🚀 AI Provider: ChatService initialized');
      setIsConnected(true);
    }
  }, [chatService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 AI Provider: Provider unmounting, cleaning up ChatService');
      if (chatService) {
        chatService.cancelAllRequests();
      }
    };
  }, [chatService]);

  return (
    <AIContext.Provider value={{ chatService, isConnected }}>
      {children}
    </AIContext.Provider>
  );
};