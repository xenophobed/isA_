/**
 * ============================================================================
 * 基础侧边栏组件 (BaseSidebar.tsx)
 * ============================================================================
 * 
 * 【核心功能】
 * - 提供统一的侧边栏基础架构
 * - 处理App级别的消息交互和状态管理
 * - 支持流式显示和错误处理
 * - 只监听和处理App消息，不处理Chat消息
 * 
 * 【新架构下的处理方式】
 * - 使用callback系统接收App专用的流式数据
 * - 等待StreamingHandler扩展App支持后进行完善
 * - 目前临时解析response_batch事件来更新App状态
 * 
 * 【App流式显示】
 * - 显示App专用的实时流式内容预览
 * - 包括状态文本和字符计数
 * - 不创建聊天消息，只处理App内部状态
 */
import React, { useState, useCallback, memo, useEffect } from 'react';
import { SimpleAIClient } from '../../services/SimpleAIClient';
import { useErrorHandler } from './ErrorBoundary';
import { validateUserInput, globalRateLimiter, generateSessionId } from '../../utils/security';
import { useAuth } from '../../hooks/useAuth';

export interface BaseSidebarProps {
  title: string;
  icon: string;
  triggeredInput?: string;
  onResult?: (result: any) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
  apiEndpoint?: string;
}

interface SidebarState {
  isProcessing: boolean;
  error: string | null;
  result: any;
  // 流式显示相关状态
  streamingContent: string;
  streamingStatus: string;
  isStreaming: boolean;
}

/**
 * 通用 Sidebar 基础组件
 * 提供统一的状态管理、错误处理和 AI 客户端管理
 */
export const BaseSidebar = memo<BaseSidebarProps>(({
  title,
  icon,
  triggeredInput,
  onResult,
  onError,
  children,
  apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8080'
}) => {
  const [client] = useState(() => new SimpleAIClient(apiEndpoint));
  const { user } = useAuth();
  const [state, setState] = useState<SidebarState>({
    isProcessing: false,
    error: null,
    result: null,
    streamingContent: '',
    streamingStatus: '',
    isStreaming: false
  });
  
  const { handleError } = useErrorHandler();

  // TODO: App级别的流式事件处理 - 等StreamingHandler扩展App支持后实现
  useEffect(() => {
    console.log(`🔗 BASESIDEBAR [${title}]: Ready for App-specific streaming (will be implemented later)`);
  }, [client, title]);

  // 统一的处理函数
  const handleProcess = useCallback(async (
    input: string,
    templateParams?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    if (!input.trim()) return;

    // 安全验证
    const validation = validateUserInput(input);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.error || 'Invalid input' }));
      return;
    }

    // 请求频率限制
    const sessionId = generateSessionId();
    const rateLimitCheck = globalRateLimiter.checkLimit(sessionId);
    if (!rateLimitCheck.allowed) {
      setState(prev => ({ ...prev, error: 'Too many requests. Please try again later.' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null,
      streamingContent: '',
      streamingStatus: 'Preparing request...',
      isStreaming: false
    }));

    try {
      const requestMetadata = {
        sender: title.toLowerCase().replace(/\s+/g, '_'),
        template_parameters: templateParams,
        user_id: user?.user_id || 'anonymous',
        session_id: 'app_session',
        ...metadata
      };

      // 使用新的callback系统
      const cleanInput = validation.sanitized || input;
      
      await client.sendMessageWithCallback(cleanInput, {
        onData: (event: any) => {
          // TODO: 这里应该接收App专用的流式数据
          console.log(`📨 BASESIDEBAR [${title}]: Received streaming data:`, event);
          
          // 目前先直接更新状态，等StreamingHandler扩展App支持后会改进
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.metadata?.raw_chunk?.response_batch) {
              const { tokens } = eventData.metadata.raw_chunk.response_batch;
              setState(prev => ({
                ...prev,
                streamingContent: prev.streamingContent + tokens,
                isStreaming: true
              }));
            }
          } catch (e) {
            // 忽略解析错误
          }
        },
        onError: (error: Error) => {
          handleError(error, `${title} streaming error`);
          onError?.(error);
          setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: error.message 
          }));
        },
        onComplete: () => {
          console.log(`✅ BASESIDEBAR [${title}]: App streaming completed`);
          setState(prev => {
            const fullResult = { content: prev.streamingContent, metadata: requestMetadata };
            
            return {
              ...prev, 
              isProcessing: false,
              isStreaming: false,
              result: fullResult // 使用完整结果对象
            };
          });
          
          // 使用setState回调确保获取最新的streamingContent
          setTimeout(() => {
            const finalResult = { content: state.streamingContent, metadata: requestMetadata };
            console.log(`📊 BASESIDEBAR [${title}]: Sending result to App:`, finalResult);
            onResult?.(finalResult);
          }, 0);
        }
      }, requestMetadata);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      handleError(err, `${title} request`);
      onError?.(err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message 
      }));
    }
  }, [client, title, onResult, onError, handleError, state.isProcessing]);

  // 重置状态
  const handleReset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      result: null,
      streamingContent: '',
      streamingStatus: '',
      isStreaming: false
    });
  }, []);

  // 自动处理触发输入 - 使用ref避免重复处理
  const lastProcessedInput = React.useRef<string>('');
  React.useEffect(() => {
    if (triggeredInput && !state.isProcessing && triggeredInput !== lastProcessedInput.current) {
      console.log(`📱 BASESIDEBAR [${title}]: Processing triggered input:`, triggeredInput);
      lastProcessedInput.current = triggeredInput;
      handleProcess(triggeredInput);
    }
  }, [triggeredInput, handleProcess, state.isProcessing, title]);

  return (
    <div className="h-full flex flex-col bg-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        
        {state.isProcessing && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            {state.isStreaming ? state.streamingStatus : 'Processing...'}
          </div>
        )}
        
        {/* 流式内容预览 (优化版) */}
        {state.isStreaming && state.streamingContent && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-xs text-blue-300 mb-1 flex items-center justify-between">
              <span>Real-time Response:</span>
              <span className="text-blue-400">{state.streamingContent.length} chars</span>
            </div>
            <div className="text-sm text-white max-h-24 overflow-y-auto">
              {state.streamingContent}
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
            </div>
          </div>
        )}
        
        {state.error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
            {state.error}
            <button 
              onClick={handleReset}
              className="ml-2 text-red-300 hover:text-red-100 underline"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              // 注入通用 props 给子组件
              isProcessing: state.isProcessing,
              error: state.error,
              result: state.result,
              onProcess: handleProcess,
              onReset: handleReset,
              client,
              // 流式显示相关props
              streamingContent: state.streamingContent,
              streamingStatus: state.streamingStatus,
              isStreaming: state.isStreaming
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
});

BaseSidebar.displayName = 'BaseSidebar';