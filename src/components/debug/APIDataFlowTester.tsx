/**
 * API数据流测试器
 * 
 * 拦截和展示完整的API数据处理流程：
 * chatService -> SSEParser -> useChatStore -> hooks -> UI
 */

import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../api/chatService';
import { SSEParser } from '../../api/SSEParser';
import { useChatStore } from '../../stores/useChatStore';

interface DataFlowStep {
  id: string;
  step: string;
  timestamp: string;
  data: any;
  type: 'raw_sse' | 'parsed_event' | 'store_callback' | 'final_message';
}

export const APIDataFlowTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [dataFlow, setDataFlow] = useState<DataFlowStep[]>([]);
  const [testMessage, setTestMessage] = useState('请生成一个关于AI的简短介绍');
  const originalParseMethod = useRef<any>(null);
  const originalChatServiceMethod = useRef<any>(null);
  
  const { sendMessage, messages } = useChatStore();

  // 清理hook，确保组件卸载时恢复原始方法
  useEffect(() => {
    return () => {
      restoreSSEParser();
    };
  }, []);

  // 拦截SSEParser
  const interceptSSEParser = () => {
    if (!originalParseMethod.current) {
      originalParseMethod.current = SSEParser.parseForChatService;
    }
    
    // 使用正确的静态方法绑定，保持this上下文
    (SSEParser as any).parseForChatService = function(data: string, callbacks: any) {
      // 记录原始SSE数据
      addDataFlowStep('raw_sse', 'SSE原始数据', data);
      
      // 解析事件数据
      try {
        const eventData = JSON.parse(data);
        addDataFlowStep('parsed_event', `SSE解析事件: ${eventData.type}`, eventData);
      } catch (e) {
        addDataFlowStep('parsed_event', 'SSE解析失败', { error: e, rawData: data });
      }
      
      // 创建拦截的回调
      const interceptedCallbacks = {
        onMessageStart: (messageId: string, status?: string) => {
          addDataFlowStep('store_callback', 'onMessageStart', { messageId, status });
          callbacks.onMessageStart?.(messageId, status);
        },
        onMessageContent: (content: string) => {
          addDataFlowStep('store_callback', 'onMessageContent', { content });
          callbacks.onMessageContent?.(content);
        },
        onMessageStatus: (status: string) => {
          addDataFlowStep('store_callback', 'onMessageStatus', { status });
          callbacks.onMessageStatus?.(status);
        },
        onMessageComplete: (content?: string) => {
          addDataFlowStep('store_callback', 'onMessageComplete', { finalContent: content });
          callbacks.onMessageComplete?.(content);
        },
        onError: (error: Error) => {
          addDataFlowStep('store_callback', 'onError', { error: error.message });
          callbacks.onError?.(error);
        },
        onArtifactCreated: (artifact: any) => {
          addDataFlowStep('store_callback', 'onArtifactCreated', artifact);
          callbacks.onArtifactCreated?.(artifact);
        }
      };
      
      // 使用原始方法调用，保持正确的this上下文
      originalParseMethod.current.call(SSEParser, data, interceptedCallbacks);
    };
  };

  // 恢复原始方法
  const restoreSSEParser = () => {
    if (originalParseMethod.current) {
      (SSEParser as any).parseForChatService = originalParseMethod.current;
    }
  };

  const addDataFlowStep = (type: DataFlowStep['type'], step: string, data: any) => {
    const flowStep: DataFlowStep = {
      id: `${Date.now()}_${Math.random()}`,
      step,
      timestamp: new Date().toISOString(),
      data,
      type
    };
    
    setDataFlow(prev => [...prev, flowStep]);
  };

  // 监听最终消息变化
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        addDataFlowStep('final_message', '最终消息存储', {
          id: lastMessage.id,
          content: 'content' in lastMessage ? lastMessage.content : 'No content',
          metadata: 'metadata' in lastMessage ? lastMessage.metadata : undefined
        });
      }
    }
  }, [messages]);

  const runTest = async () => {
    setIsRunning(true);
    setDataFlow([]);
    
    addDataFlowStep('raw_sse', '开始测试', { message: testMessage });
    
    try {
      // 拦截数据流
      interceptSSEParser();
      
      // 发送测试消息
      await sendMessage(testMessage, {
        session_id: 'debug_test_session',
        user_id: 'debug_user'
      });
    } catch (error) {
      addDataFlowStep('store_callback', '发送失败', { error: error instanceof Error ? error.message : String(error) });
      console.error('API测试失败:', error);
    } finally {
      // 延迟恢复，确保所有数据都被拦截
      setTimeout(() => {
        restoreSSEParser();
        setIsRunning(false);
      }, 3000);
    }
  };

  const clearData = () => {
    setDataFlow([]);
  };

  const getStepColor = (type: DataFlowStep['type']) => {
    switch (type) {
      case 'raw_sse': return 'bg-purple-50 border-purple-200';
      case 'parsed_event': return 'bg-blue-50 border-blue-200';
      case 'store_callback': return 'bg-green-50 border-green-200';
      case 'final_message': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStepIcon = (type: DataFlowStep['type']) => {
    switch (type) {
      case 'raw_sse': return '📡';
      case 'parsed_event': return '🔍';
      case 'store_callback': return '🔄';
      case 'final_message': return '💾';
      default: return '📝';
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        API数据流测试器
      </h3>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700 mb-2">
          <strong>测试范围:</strong> chatService → SSEParser → useChatStore → UI
        </p>
        <p className="text-sm text-blue-700">
          拦截并记录完整的数据处理流程，包括原始SSE数据、解析事件、Store回调和最终消息
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
            onClick={runTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '测试中...' : '运行数据流测试'}
          </button>
        </div>
        
        {dataFlow.length > 0 && (
          <button
            onClick={clearData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 self-start"
          >
            清空数据
          </button>
        )}
      </div>

      {/* 数据流展示 */}
      {dataFlow.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-gray-800">数据流记录</h4>
            <span className="text-sm text-gray-500">({dataFlow.length} 步骤)</span>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { type: 'raw_sse', label: 'SSE数据', color: 'purple' },
              { type: 'parsed_event', label: '解析事件', color: 'blue' },
              { type: 'store_callback', label: 'Store回调', color: 'green' },
              { type: 'final_message', label: '最终消息', color: 'yellow' }
            ].map(({ type, label, color }) => {
              const count = dataFlow.filter(step => step.type === type).length;
              return (
                <div key={type} className={`p-2 bg-${color}-50 border border-${color}-200 rounded text-center`}>
                  <div className="text-lg font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              );
            })}
          </div>

          {/* 数据流步骤 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dataFlow.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 border rounded ${getStepColor(step.type)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-lg">{getStepIcon(step.type)}</span>
                    #{index + 1} {step.step}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    查看数据 ({typeof step.data === 'object' ? Object.keys(step.data).length + ' 字段' : typeof step.data})
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32 text-black">
                    {typeof step.data === 'string' 
                      ? step.data.length > 500 
                        ? step.data.substring(0, 500) + '...[截断]'
                        : step.data
                      : JSON.stringify(step.data, null, 2)
                    }
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      {dataFlow.length === 0 && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h5 className="font-medium text-gray-800 mb-2">使用说明:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 📡 <strong>SSE数据</strong> - 原始的Server-Sent Events数据流</li>
            <li>• 🔍 <strong>解析事件</strong> - SSEParser解析后的结构化事件</li>
            <li>• 🔄 <strong>Store回调</strong> - useChatStore的回调函数调用</li>
            <li>• 💾 <strong>最终消息</strong> - 存储在Store中的最终消息对象</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default APIDataFlowTester;