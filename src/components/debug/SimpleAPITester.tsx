/**
 * 简化的API测试器
 * 
 * 不拦截现有方法，而是创建一个独立的测试，展示API数据处理
 */

import React, { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';

interface TestStep {
  id: string;
  step: string;
  timestamp: string;
  data: any;
  success: boolean;
}

export const SimpleAPITester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [testMessage, setTestMessage] = useState('请生成一个关于AI的简短介绍');
  
  const { sendMessage, messages, chatLoading } = useChatStore();

  const addTestStep = (step: string, data: any, success: boolean = true) => {
    const testStep: TestStep = {
      id: `${Date.now()}_${Math.random()}`,
      step,
      timestamp: new Date().toISOString(),
      data,
      success
    };
    
    setTestSteps(prev => [...prev, testStep]);
  };

  const runSimpleTest = async () => {
    setIsRunning(true);
    setTestSteps([]);
    
    addTestStep('开始API测试', { message: testMessage });
    
    const initialMessageCount = messages.length;
    addTestStep('记录初始状态', { 
      messageCount: initialMessageCount,
      chatLoading 
    });

    try {
      addTestStep('准备发送消息', { 
        content: testMessage,
        metadata: {
          session_id: 'debug_test_session',
          user_id: 'debug_user'
        }
      });

      // 监听状态变化
      const checkInterval = setInterval(() => {
        const currentMessageCount = messages.length;
        const currentLoading = useChatStore.getState().chatLoading;
        const currentTyping = useChatStore.getState().isTyping;
        
        if (currentMessageCount > initialMessageCount || currentLoading || currentTyping) {
          addTestStep('检测到状态变化', {
            messageCount: currentMessageCount,
            isLoading: currentLoading,
            isTyping: currentTyping,
            newMessages: messages.slice(initialMessageCount)
          });
        }
      }, 500);

      // 发送消息
      await sendMessage(testMessage, {
        session_id: 'debug_test_session',
        user_id: 'debug_user'
      });

      // 停止监听
      setTimeout(() => {
        clearInterval(checkInterval);
        
        const finalMessageCount = messages.length;
        const newMessages = messages.slice(initialMessageCount);
        
        addTestStep('消息发送完成', {
          initialCount: initialMessageCount,
          finalCount: finalMessageCount,
          newMessagesCount: newMessages.length,
          newMessages: newMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            contentLength: ('content' in msg) ? msg.content.length : 0,
            isStreaming: msg.isStreaming,
            streamingStatus: msg.streamingStatus
          }))
        });

        addTestStep('测试完成', {
          success: finalMessageCount > initialMessageCount,
          totalSteps: testSteps.length + 1
        });

        setIsRunning(false);
      }, 3000);

    } catch (error) {
      addTestStep('发送失败', { 
        error: error instanceof Error ? error.message : String(error) 
      }, false);
      setIsRunning(false);
    }
  };

  const clearSteps = () => {
    setTestSteps([]);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        简化API测试器
      </h3>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700 mb-2">
          <strong>测试方式:</strong> 监听useChatStore状态变化
        </p>
        <p className="text-sm text-blue-700">
          观察消息发送前后的Store状态变化，不拦截内部方法
        </p>
      </div>

      {/* 控制面板 */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="输入测试消息"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
          <button
            onClick={runSimpleTest}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '测试中...' : '运行简化测试'}
          </button>
        </div>
        
        {testSteps.length > 0 && (
          <button
            onClick={clearSteps}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 self-start"
          >
            清空步骤
          </button>
        )}
      </div>

      {/* 当前状态 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
          <div className="text-lg font-bold text-gray-800">{messages.length}</div>
          <div className="text-xs text-gray-600">消息总数</div>
        </div>
        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
          <div className="text-lg font-bold text-gray-800">{chatLoading ? '是' : '否'}</div>
          <div className="text-xs text-gray-600">正在加载</div>
        </div>
        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
          <div className="text-lg font-bold text-gray-800">{chatLoading ? '是' : '否'}</div>
          <div className="text-xs text-gray-600">聊天加载中</div>
        </div>
      </div>

      {/* 测试步骤 */}
      {testSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-gray-800">测试步骤</h4>
            <span className="text-sm text-gray-500">({testSteps.length} 步)</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 border rounded ${
                  step.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium flex items-center gap-2 ${
                    step.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <span className="text-lg">{step.success ? '✅' : '❌'}</span>
                    #{index + 1} {step.step}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    查看数据
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近消息预览 */}
      {messages.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h5 className="font-medium text-gray-800 mb-2">最近消息预览:</h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.slice(-3).map((msg, index) => (
              <div key={msg.id} className="text-sm">
                <span className={`font-medium ${
                  msg.role === 'user' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {msg.role}:
                </span>
                <span className="text-gray-700 ml-2">
                  {(('content' in msg) && msg.content && msg.content.length > 100) 
                    ? msg.content.substring(0, 100) + '...' 
                    : ('content' in msg) ? msg.content : 'No content'
                  }
                </span>
                {msg.isStreaming && (
                  <span className="text-orange-500 text-xs ml-2">(流式中)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAPITester;