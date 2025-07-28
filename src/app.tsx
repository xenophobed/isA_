/**
 * ============================================================================
 * Main App Component (src/app.tsx) - 应用内部根组件
 * ============================================================================
 * 
 * 注意：这不是 Next.js 的全局 _app.tsx，而是我们应用的内部根组件
 * 
 * Core Responsibilities:
 * - Provider chain setup (ErrorBoundary -> Auth -> Session -> AI)
 * - Error boundary configuration with proper error handling
 * - Route to main application UI
 * - Zero business logic, pure architectural coordination
 * - Debug logging for initialization tracking
 * 
 * Architecture:
 * - Uses proper provider layering with clear separation
 * - ErrorBoundary -> Auth0 -> Session -> AI -> Modules
 * - Each provider has single responsibility
 * - Clean dependency flow without circular references
 */

import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Auth0Provider } from './providers/Auth0Provider';
import { SessionProvider } from './providers/SessionProvider';
import { AIProvider } from './providers/AIProvider';
import { UserModule } from './modules/UserModule';
import { AppModule } from './modules/AppModule';

/**
 * Debug component to track initialization steps
 */
const InitializationTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initSteps, setInitSteps] = useState<string[]>([]);

  useEffect(() => {
    console.log('🚀 MainAppContainer: Starting application initialization');
    setInitSteps(prev => [...prev, 'App component mounted']);
    
    return () => {
      console.log('🏁 MainAppContainer: Application unmounting');
    };
  }, []);

  // Show debug info in development (commented out)
  // if (process.env.NODE_ENV === 'development') {
  //   return (
  //     <>
  //       {children}
  //       <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs z-50">
  //         <div className="font-bold mb-1">Init Steps:</div>
  //         {initSteps.map((step, i) => (
  //           <div key={i}>✓ {step}</div>
  //         ))}
  //       </div>
  //     </>
  //   );
  // }

  return <>{children}</>;
};

/**
 * Main App Container - 应用的内部根组件
 * 这是应用的 Provider 链和模块入口，不是 Next.js 页面
 */
export const MainAppContainer: React.FC = () => {
  console.log('🏗️ MainAppContainer: Root component rendering');

  return (
    <InitializationTracker>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('💥 MainAppContainer: Global error caught by ErrorBoundary:', error, errorInfo);
          // Could add error reporting service here
          
          // Log component stack for debugging
          if (errorInfo.componentStack) {
            console.error('🔍 MainAppContainer: Component stack:', errorInfo.componentStack);
          }
        }}
        fallback={(error, errorInfo) => (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-2xl w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-400 text-2xl">💥</span>
                </div>
                
                <h2 className="text-xl font-bold text-red-400 mb-4">
                  Application Initialization Failed
                </h2>
                
                <p className="text-gray-300 mb-6">
                  The application failed to initialize properly. This could be due to configuration issues, network problems, or service unavailability.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mb-6 text-left">
                    <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                      Technical Details (Development Mode)
                    </summary>
                    <div className="bg-black/30 rounded p-3 text-xs text-red-300 font-mono overflow-auto max-h-60">
                      <div className="mb-2">
                        <strong>Error:</strong> {error.message}
                      </div>
                      {error.stack && (
                        <div className="mb-2">
                          <strong>Stack Trace:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      {errorInfo.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Reload Application
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Clear Cache & Reload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      >
        <Auth0Provider>
          <UserModule>
            <SessionProvider>
              <AIProvider apiEndpoint={process.env.REACT_APP_AGENT_SERVICE_URL || "http://localhost:8080"}>
                <AppModule />
              </AIProvider>
            </SessionProvider>
          </UserModule>
        </Auth0Provider>
      </ErrorBoundary>
    </InitializationTracker>
  );
};

// 保持向后兼容的导出
export const MainApp = MainAppContainer;
export const App = MainAppContainer;