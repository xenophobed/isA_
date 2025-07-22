import React, { createContext, useContext, useEffect, useState } from 'react';
import { SimpleAIClient } from '../services/SimpleAIClient';

interface SimpleAIContextType {
  client: SimpleAIClient | null;
  isConnected: boolean;
}

const SimpleAIContext = createContext<SimpleAIContextType>({
  client: null,
  isConnected: false
});

export const useSimpleAI = () => {
  const context = useContext(SimpleAIContext);
  
  if (context === undefined) {
    throw new Error('useSimpleAI must be used within a SimpleAIProvider');
  }
  
  return context.client;
};

export const useConnectionStatus = () => {
  const context = useContext(SimpleAIContext);
  
  if (context === undefined) {
    throw new Error('useConnectionStatus must be used within a SimpleAIProvider');
  }
  
  return context.isConnected;
};

interface SimpleAIProviderProps {
  children: React.ReactNode;
  apiEndpoint?: string;
}

export const SimpleAIProvider: React.FC<SimpleAIProviderProps> = ({ 
  children, 
  apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8080' 
}) => {
  const [client, setClient] = useState(() => {
    console.log('🏗️ SimpleAI: Creating new client in Provider');
    return new SimpleAIClient(apiEndpoint);
  });
  const [isConnected, setIsConnected] = useState(false);

  // Recreate client if it's destroyed
  useEffect(() => {
    if (client.isDestroyed()) {
      console.log('🔄 SimpleAI: Client is destroyed, creating new one');
      const newClient = new SimpleAIClient(apiEndpoint);
      setClient(newClient);
    }
  }, [client, apiEndpoint]);

  // Cleanup client on unmount only
  useEffect(() => {
    return () => {
      console.log('🧹 SimpleAI: Provider unmounting, destroying client');
      if (client && !client.isDestroyed()) {
        client.destroy();
      }
    };
  }, [client]);

  // Simple connection status - assume connected
  useEffect(() => {
    setIsConnected(true);
    console.log('🚀 SimpleAI: Provider initialized');
  }, []);

  return (
    <SimpleAIContext.Provider value={{ client, isConnected }}>
      {children}
    </SimpleAIContext.Provider>
  );
};