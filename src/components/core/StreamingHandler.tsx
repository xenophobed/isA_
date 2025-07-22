/**
 * ============================================================================
 * 流式数据解析器 (StreamingHandler.tsx) - 统一事件解析层
 * ============================================================================
 * 
 * 【核心职责】
 * - 接收SimpleAIClient的原始SSE数据
 * - 解析所有类型的流式事件
 * - 调用Store的actions来更新状态
 * - 只负责Chat相关的流式数据处理
 * 
 * 【事件解析映射】 (基于streaming_events.log)
 * - start事件 → startStreamingMessage()
 * - custom_event.response_batch → appendToStreamingMessage() 
 * - custom_event.response_token(completed) → finishStreamingMessage()
 * - node_update → updateStreamingStatus()
 * - custom_event工作流状态 → updateStreamingStatus()
 * - end事件 → finishStreamingMessage()
 * - content事件 → 解析最终内容供Store使用
 * 
 * 【职责边界】
 * - ✅ 解析SSE事件数据
 * - ✅ 调用Store actions
 * - ✅ 处理Chat流式消息
 * - ❌ 不直接管理UI状态
 * - ❌ 不处理App相关消息
 * - ❌ 不直接操作DOM
 */
import React, { useEffect, useCallback } from 'react';
import { useSimpleAI } from '../../providers/SimpleAIProvider';
import { useChatActions } from '../../stores/useAppStore';
import type { RawSSEEvent } from '../../services/SimpleAIClient';

interface StreamingHandlerProps {
  showRightSidebar: boolean;
  currentApp: string | null;
}

export const StreamingHandler: React.FC<StreamingHandlerProps> = ({
  showRightSidebar,
  currentApp
}) => {
  const client = useSimpleAI();
  const { 
    startStreamingMessage, 
    appendToStreamingMessage, 
    finishStreamingMessage, 
    updateStreamingStatus
  } = useChatActions();


  // 解析start事件
  const handleStartEvent = useCallback((eventData: any) => {
    console.log('🎬 PARSER: Stream started');
    const messageId = `streaming-${Date.now()}`;
    
    // 总是创建chat流式消息 - UI状态不影响消息创建
    console.log('🎬 PARSER: Starting chat streaming message');
    startStreamingMessage(messageId, 'Connecting to AI...');
  }, [startStreamingMessage]);

  // 解析custom_event - 最重要的事件类型
  const handleCustomEvent = useCallback((eventData: any) => {
    const chunk = eventData.metadata?.raw_chunk;
    if (!chunk) return;

    // 处理批量token流式数据 (事件15-25)
    if (chunk.response_batch && chunk.response_batch.status === 'streaming') {
      const { tokens, start_index, count, total_index } = chunk.response_batch;
      console.log(`🚀 PARSER: Batch token ${start_index}-${start_index + count}: "${tokens}"`);
      console.log(`🔍 PARSER: State check - showRightSidebar: ${showRightSidebar}, currentApp: ${currentApp}`);
      
      // 总是处理chat流式消息的token - UI状态不影响token处理
      // 因为用户可能在有侧边栏/app打开的情况下发送chat消息
      console.log(`✅ PARSER: Processing tokens for chat streaming: "${tokens}"`);
      appendToStreamingMessage(tokens);
      updateStreamingStatus(`🚀 Streaming... (${total_index} chars)`);
      return;
    }

    // 处理单个token完成标志 (事件26)
    if (chunk.response_token && chunk.response_token.status === 'completed') {
      console.log('✅ PARSER: Token streaming completed');
      
      // 总是完成chat流式消息 - UI状态不影响completion处理
      console.log('✅ PARSER: Finishing chat streaming message');
      finishStreamingMessage();
      return;
    }

    // 处理工作流状态更新
    handleWorkflowStatus(chunk);
  }, [appendToStreamingMessage, updateStreamingStatus, finishStreamingMessage]);

  // 处理工作流状态 (事件2-14, 27-33)
  const handleWorkflowStatus = useCallback((chunk: any) => {
    // 基于streaming_events.log的状态映射
    const statusMap: Record<string, string> = {
      'entry_preparation': '🔸 Preparing request...',
      'reasonnode': '🧠 Processing with AI...',
      'model_call': '⚡ AI Model working...',
      'routing': '🔄 Analyzing response...',
      'responsenode': '📝 Formatting response...',
      'response_formatting': '📝 Formatting response...',
      'memory_revision': '💾 Storing memory...'
    };

    for (const [key, value] of Object.entries(chunk)) {
      if (typeof value === 'object' && value.status) {
        const status = statusMap[key] || `Processing ${key}...`;
        if (value.status === 'starting' || value.status === 'deciding') {
          // 总是更新chat状态 - UI状态不影响status处理
          updateStreamingStatus(status);
          console.log(`🔄 PARSER: Workflow status - ${key}: ${status}`);
        }
        break;
      }
    }
  }, [updateStreamingStatus]);

  // 解析node_update事件 (事件4, 9, 12, 30, 33)
  const handleNodeUpdate = useCallback((eventData: any) => {
    const { node_name, credits_used, messages_count } = eventData.metadata || {};
    const statusMap: Record<string, string> = {
      'entry_preparation': '🔸 Preparing request...',
      'reason_model': '🧠 Processing with AI...',
      'should_continue': '🔄 Analyzing response...',
      'format_response': '📝 Formatting response...',
      'memory_revision': '💾 Storing memory...'
    };

    const status = statusMap[node_name] || `Processing ${node_name}...`;
    
    // 总是更新chat状态 - UI状态不影响status处理  
    updateStreamingStatus(status);
    console.log(`📊 PARSER: Node update - ${node_name}: ${status}`);
  }, [updateStreamingStatus]);

  // 解析content事件 - 解析最终内容 (事件29)
  const handleContentEvent = useCallback((eventData: any) => {
    console.log('📄 PARSER: Content event received:', eventData);
    
    // 解析最终内容
    if (eventData.content) {
      console.log('📄 PARSER: Final content available:', eventData.content.substring(0, 100) + '...');
      
      // 不处理content事件 - streaming tokens已经处理过了
      // content事件通常是streaming完成后的重复内容
      console.log('ℹ️ PARSER: Skipping content event - already processed via streaming tokens');
    }
  }, []);

  // 解析end事件 (事件35)
  const handleEndEvent = useCallback((eventData: any) => {
    console.log('🏁 PARSER: Stream ended');
    
    // 总是完成chat流式消息 - UI状态不影响消息completion
    console.log('✅ PARSER: Finishing chat streaming message on end event');
    finishStreamingMessage();
  }, [finishStreamingMessage]);

  // 这个组件现在不直接管理流式数据
  // 它会在需要发送消息时，设置解析回调并调用新的Client API
  useEffect(() => {
    if (!client) {
      console.log('⚠️ StreamingHandler: Client not available');
      return;
    }

    console.log('🔗 StreamingHandler: Ready to parse SSE events');
    
    // 注意：不再主动监听事件，而是等待其他组件发起请求时提供解析回调
    // 这个组件现在纯粹作为解析器存在
    
  }, [client]);

  // 统一的事件解析器 - 解析所有API数据
  const parseSSEEvent = useCallback((event: RawSSEEvent) => {
    try {
      const eventData = JSON.parse(event.data);
      const actualEventType = eventData.type || 'unknown';
      console.log('🔍 PARSER: Processing event:', actualEventType, eventData);

      // 解析所有事件类型，让Store决定如何处理
      switch (actualEventType) {
        case 'start':
          handleStartEvent(eventData);
          break;
        case 'custom_event':
          handleCustomEvent(eventData);
          break;
        case 'node_update':
          handleNodeUpdate(eventData);
          break;
        case 'content':
          handleContentEvent(eventData);
          break;
        case 'end':
          handleEndEvent(eventData);
          break;
        case 'credits':
          console.log('💰 PARSER: Credits event:', eventData.content);
          break;
        default:
          console.log('🔄 PARSER: Unknown event type:', actualEventType);
      }
    } catch (error) {
      console.error('❌ PARSER: Failed to parse SSE event:', error, event.data);
    }
  }, [handleStartEvent, handleCustomEvent, handleNodeUpdate, handleContentEvent, handleEndEvent]);

  // 暴露解析器给外部使用
  useEffect(() => {
    if (window && typeof window === 'object') {
      // @ts-ignore - 临时将解析器挂载到window，供ChatInputHandler使用
      window.streamingParser = parseSSEEvent;
    }

    return () => {
      if (window && typeof window === 'object') {
        // @ts-ignore
        delete window.streamingParser;
      }
    };
  }, [parseSSEEvent]);

  return null;
};