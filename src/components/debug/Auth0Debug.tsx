import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../../hooks/useAuth';

export const Auth0Debug: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    loginWithRedirect, 
    logout 
  } = useAuth0();

  // 添加我们自定义的useAuth hook状态
  const { 
    externalUser, 
    isLoading: userLoading, 
    error: userError,
    creditsRemaining,
    currentPlan
  } = useAuth();

  if (isLoading) return <div className="text-yellow-400">🔄 Auth0 loading...</div>;

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
        <h3 className="text-red-400 font-bold">Auth0 Error:</h3>
        <p className="text-red-300 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
      <h3 className="text-white font-bold mb-2">🔐 Auth0 Debug Status</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Authenticated:</span>
          <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {isAuthenticated ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Loading:</span>
          <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
            {isLoading ? '🔄 Yes' : '✅ No'}
          </span>
        </div>

        {isAuthenticated && user && (
          <>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="text-gray-400 mb-1">User Info:</div>
              <div className="text-white text-xs">
                <div>Name: {user.name}</div>
                <div>Email: {user.email}</div>
                <div>ID: {user.sub}</div>
              </div>
            </div>
          </>
        )}
        
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-gray-400 mb-1">External User API:</div>
          <div className="text-xs text-gray-300">
            <div>Loading: {userLoading ? '🔄 Yes' : '✅ No'}</div>
            <div>External User: {externalUser ? '✅ Loaded' : '❌ Not Found'}</div>
            <div>Credits: {creditsRemaining}</div>
            <div>Plan: {currentPlan}</div>
            {userError && (
              <div className="text-red-400 mt-1">
                Error: {userError}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-gray-400 mb-1">Environment:</div>
          <div className="text-xs text-gray-300">
            <div>Domain: {process.env.REACT_APP_AUTH0_DOMAIN}</div>
            <div>Client ID: {process.env.REACT_APP_AUTH0_CLIENT_ID ? '✅ Set' : '❌ Missing'}</div>
            <div>Audience: {process.env.REACT_APP_AUTH0_AUDIENCE}</div>
            <div>API URL: {process.env.REACT_APP_EXTERNAL_API_BASE_URL}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-x-2">
        {!isAuthenticated ? (
          <button
            onClick={() => loginWithRedirect()}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
          >
            Login
          </button>
        ) : (
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};