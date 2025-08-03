/**
 * Session API 测试组件
 * 
 * 这个组件可以直接在React应用中使用，测试Session API集成
 * 使用真实的Auth0认证和我们更新后的Session Service
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSessionActions } from '../../stores/useSessionStore';
import { createAuthenticatedSessionService } from '../../api/sessionService';

interface TestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export const SessionAPITester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  
  const { getAuthHeaders, isAuthenticated, auth0User } = useAuth();
  const sessionActions = useSessionActions();

  const addResult = (name: string, success: boolean, data?: any, error?: string) => {
    const result: TestResult = {
      name,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
    return result;
  };

  const runTests = async () => {
    if (!isAuthenticated || !auth0User?.sub) {
      addResult('身份验证检查', false, null, '用户未登录或缺少用户ID');
      return;
    }

    setIsRunning(true);
    setResults([]);
    
    try {
      // 步骤1: 初始化认证的Session Service
      console.log('🔧 初始化认证的Session Service...');
      const authenticatedService = createAuthenticatedSessionService(getAuthHeaders);
      addResult('初始化认证服务', true, { userId: auth0User.sub });

      // 步骤2: 测试健康检查
      console.log('🏥 测试健康检查...');
      try {
        const healthResult = await authenticatedService.healthCheck();
        addResult('健康检查', healthResult.success, healthResult.data, healthResult.error);
      } catch (error) {
        addResult('健康检查', false, null, error instanceof Error ? error.message : String(error));
      }

      // 步骤3: 创建测试会话
      console.log('📝 创建测试会话...');
      const testSessionTitle = `API测试会话 ${new Date().toLocaleString()}`;
      const testMetadata = {
        source: 'session_api_tester',
        test_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      };

      try {
        const createResult = await authenticatedService.createSession(
          auth0User.sub,
          testSessionTitle,
          testMetadata
        );
        
        if (createResult.success && createResult.data?.session) {
          const sessionId = createResult.data.session.id;
          setCreatedSessionId(sessionId);
          addResult('创建会话', true, { sessionId, title: testSessionTitle });
        } else {
          addResult('创建会话', false, createResult.data, createResult.error);
        }
      } catch (error) {
        addResult('创建会话', false, null, error instanceof Error ? error.message : String(error));
      }

      // 步骤4: 获取用户会话列表
      console.log('📋 获取用户会话列表...');
      try {
        const getUserSessionsResult = await authenticatedService.getUserSessions(
          auth0User.sub,
          { limit: 10 }
        );
        addResult('获取用户会话', getUserSessionsResult.success, {
          sessionCount: getUserSessionsResult.data?.sessions?.length || 0
        }, getUserSessionsResult.error);
      } catch (error) {
        addResult('获取用户会话', false, null, error instanceof Error ? error.message : String(error));
      }

      // 步骤5: 如果会话创建成功，测试获取会话消息
      if (createdSessionId) {
        console.log('💬 测试获取会话消息...');
        try {
          const getMessagesResult = await authenticatedService.getSessionMessages(
            createdSessionId,
            auth0User.sub,
            { limit: 20 }
          );
          addResult('获取会话消息', getMessagesResult.success, {
            messageCount: getMessagesResult.data?.messages?.length || 0
          }, getMessagesResult.error);
        } catch (error) {
          addResult('获取会话消息', false, null, error instanceof Error ? error.message : String(error));
        }

        // 步骤6: 更新会话标题
        console.log('✏️  测试更新会话...');
        try {
          const updatedTitle = `${testSessionTitle} (已更新)`;
          const updateResult = await authenticatedService.updateSession(
            createdSessionId,
            { title: updatedTitle }
          );
          addResult('更新会话', updateResult.success, { updatedTitle }, updateResult.error);
        } catch (error) {
          addResult('更新会话', false, null, error instanceof Error ? error.message : String(error));
        }

        // 步骤7: 获取会话详情
        console.log('📄 测试获取会话详情...');
        try {
          const getSessionResult = await authenticatedService.getSession(
            createdSessionId,
            { include_history: true, include_stats: true }
          );
          addResult('获取会话详情', getSessionResult.success, {
            hasSession: !!getSessionResult.data?.session
          }, getSessionResult.error);
        } catch (error) {
          addResult('获取会话详情', false, null, error instanceof Error ? error.message : String(error));
        }
      }

      // 步骤8: 搜索会话
      console.log('🔍 测试搜索会话...');
      try {
        const searchResult = await authenticatedService.searchSessions(
          '测试',
          { user_id: auth0User.sub, limit: 5 }
        );
        addResult('搜索会话', searchResult.success, {
          searchResultCount: searchResult.data?.sessions?.length || 0
        }, searchResult.error);
      } catch (error) {
        addResult('搜索会话', false, null, error instanceof Error ? error.message : String(error));
      }

      // 步骤9: 测试store集成
      console.log('🏪 测试Store集成...');
      try {
        await sessionActions.saveToAPI(auth0User.sub, getAuthHeaders());
        addResult('Store API集成', true, { message: 'Store成功保存API数据' });
      } catch (error) {
        addResult('Store API集成', false, null, error instanceof Error ? error.message : String(error));
      }

    } catch (error) {
      addResult('测试执行', false, null, error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestSession = async () => {
    if (!createdSessionId || !isAuthenticated) return;

    try {
      const authenticatedService = createAuthenticatedSessionService(getAuthHeaders);
      const deleteResult = await authenticatedService.deleteSession(createdSessionId);
      
      if (deleteResult.success) {
        addResult('清理测试会话', true, { sessionId: createdSessionId });
        setCreatedSessionId(null);
      } else {
        addResult('清理测试会话', false, null, deleteResult.error);
      }
    } catch (error) {
      addResult('清理测试会话', false, null, error instanceof Error ? error.message : String(error));
    }
  };

  const clearResults = () => {
    setResults([]);
    setCreatedSessionId(null);
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Session API 测试工具
        </h3>
        <p className="text-yellow-700">
          请先登录以使用Session API测试功能
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Session API 集成测试
      </h3>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>用户:</strong> {auth0User?.email} ({auth0User?.sub})
        </p>
        <p className="text-sm text-blue-700">
          <strong>状态:</strong> {isAuthenticated ? '已认证' : '未认证'}
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? '测试中...' : '运行Session API测试'}
        </button>
        
        {createdSessionId && (
          <button
            onClick={cleanupTestSession}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            清理测试会话
          </button>
        )}
        
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            清空结果
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-800">
              测试结果: {successCount}/{totalCount} 成功
            </h4>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  successCount === totalCount ? 'bg-green-600' : 
                  successCount > 0 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${totalCount > 0 ? (successCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 border rounded ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '✅' : '❌'} {result.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.error && (
                  <div className="mt-2 text-sm text-red-700">
                    <strong>错误:</strong> {result.error}
                  </div>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      查看数据
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionAPITester;