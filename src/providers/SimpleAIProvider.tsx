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
  return context.client;
};

interface SimpleAIProviderProps {
  children: React.ReactNode;
  apiEndpoint?: string;
}

export const SimpleAIProvider: React.FC<SimpleAIProviderProps> = ({ 
  children, 
  apiEndpoint = 'http://localhost:8080' 
}) => {
  const [client] = useState(() => new SimpleAIClient(apiEndpoint));
  const [isConnected] = useState(true); // Simple client is always "connected"

  useEffect(() => {
    console.log('🚀 SimpleAI: Provider initialized');
    return () => {
      console.log('🔌 SimpleAI: Provider cleanup');
    };
  }, []);

  return (
    <SimpleAIContext.Provider value={{ client, isConnected }}>
      {children}
    </SimpleAIContext.Provider>
  );
};