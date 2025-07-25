/**
 * ============================================================================
 * App Component (app.tsx) - Clean Root Application Container
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provider chain setup (Auth0 -> User -> AI)
 * - Error boundary configuration
 * - Route to main application UI
 * - Zero business logic, pure architectural coordination
 * 
 * Architecture:
 * - Uses existing modular structure with clean separation
 * - Providers -> Modules (business logic) -> UI Components
 * - Three-panel layout: LeftSidebar + Chat + RightSidebar
 * - Preserves all functionality through modular composition
 */

import React from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Auth0Provider } from './providers/Auth0Provider';
import { AIProvider } from './providers/AIProvider';
import { UserModule } from './modules/UserModule';
import { AppModule } from './modules/AppModule';

/**
 * Root App Component - Pure Provider Wrapper + Main Interface
 */
export const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
      }}
    >
      <Auth0Provider>
        <UserModule>
          <AIProvider apiEndpoint={process.env.REACT_APP_API_ENDPOINT || "http://localhost:8080"}>
            <AppModule />
          </AIProvider>
        </UserModule>
      </Auth0Provider>
    </ErrorBoundary>
  );
};

// Keep compatibility with existing imports
export const MainApp = App;