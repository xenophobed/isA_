/**
 * ============================================================================
 * 聊天模块 (ChatModule.tsx) - 聊天功能的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理聊天相关的所有业务逻辑和副作用
 * - 管理AI客户端交互和消息发送
 * - 封装用户认证和会话管理逻辑
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 聊天业务逻辑的统一管理
 *   - AI客户端和状态管理的集成
 *   - 消息发送和接收的协调
 *   - 用户认证和权限管理
 *   - 事件回调的封装和传递
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由ChatLayout处理）
 *   - 组件的直接渲染（由components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 *   - 数据解析（由services处理）
 *   - Widget状态监听和消息创建（由各Widget模块自己处理）
 * 
 * 【数据流向】
 * main_app → ChatModule → ChatLayout
 * hooks → ChatModule → 事件回调 → stores → api/services
 */
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChatLayout, ChatLayoutProps } from '../components/ui/chat/ChatLayout';
import { RightPanel } from '../components/ui/chat/RightPanel';
import { AppId } from '../types/appTypes';
import { useChat } from '../hooks/useChat';
import { useChatActions, useChatStore } from '../stores/useChatStore';
import { useAuth } from '../hooks/useAuth';
import { useCurrentSession, useSessionActions } from '../stores/useSessionStore';
import { logger, LogCategory } from '../utils/logger';
import { useUserModule } from './UserModule';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { useAppActions } from '../stores/useAppStore';
import { ArtifactMessage } from '../types/chatTypes';
import { detectPluginTrigger, executePlugin } from '../plugins';
import { useTask } from '../hooks/useTask';

// 🆕 HIL (Human-in-the-Loop) 导入
import { HILInterruptModal } from '../components/ui/hil/HILInterruptModal';
import { HILStatusPanel } from '../components/ui/hil/HILStatusPanel';
import { HILInteractionManager } from '../components/ui/hil/HILInteractionManager';
import { executionControlService } from '../api/ExecutionControlService';
// import { defaultAGUIProcessor } from '../api/AGUIEventProcessor'; // REMOVED - AGUIEventProcessor deleted
import { 
  HILInterruptData, 
  HILCheckpointData, 
  HILExecutionStatusData,
  AGUIConverter
} from '../types/aguiTypes';

// 🆕 Debug monitor for polling optimization - REMOVED FOR TESTING
// import { StatusPollingMonitor } from '../components/debug/StatusPollingMonitor';

// 🆕 Mobile-first responsive layout
import { ResponsiveChatLayout } from '../components/ui/adaptive/ResponsiveChatLayout';
import { useDeviceType } from '../hooks/useDeviceType';
import { useNativeApp } from '../hooks/useNativeApp';

interface ChatModuleProps extends Omit<ChatLayoutProps, 'messages' | 'isLoading' | 'isTyping' | 'onSendMessage' | 'onSendMultimodal'> {
  // All ChatLayout props except the data and callback props that we'll provide from business logic
}

/**
 * Chat Module - Business logic module for ChatLayout
 * 
 * This module:
 * - Uses hooks to get chat state and AI client
 * - Handles all message sending business logic
 * - Manages user authentication and session data
 * - Passes pure data and callbacks to ChatLayout
 * - Keeps ChatLayout as pure UI component
 */
export const ChatModule: React.FC<ChatModuleProps> = (props) => {
  // Module state for upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Extract widget selector and panel state from props (managed by parent)
  const {
    showWidgetSelector = false,
    onCloseWidgetSelector,
    onShowWidgetSelector,
    showRightPanel = false,
    onToggleRightPanel,
    ...otherProps
  } = props;
  
  // Widget system state (managed internally)
  const [currentWidgetMode, setCurrentWidgetMode] = useState<'half' | 'full' | null>(null);
  const [selectedWidgetContent, setSelectedWidgetContent] = useState<React.ReactNode>(null);

  // 🆕 HIL (Human-in-the-Loop) 状态管理
  const [hilStatus, setHilStatus] = useState<HILExecutionStatusData | null>(null);
  const [hilCheckpoints, setHilCheckpoints] = useState<HILCheckpointData[]>([]);
  const [hilInterrupts, setHilInterrupts] = useState<HILInterruptData[]>([]);
  const [currentInterrupt, setCurrentInterrupt] = useState<HILInterruptData | null>(null);
  const [showHilStatusPanel, setShowHilStatusPanel] = useState(false);
  const [showInterruptModal, setShowInterruptModal] = useState(false);
  const [isProcessingHilAction, setIsProcessingHilAction] = useState(false);
  
  // HIL监控状态
  const [hilMonitoringActive, setHilMonitoringActive] = useState(false);
  
  // Get chat interface state using the hook (now pure state aggregation)
  const chatInterface = useChat();
  
  // Get authentication state
  const { auth0User } = useAuth();
  
  // Get session management
  const currentSession = useCurrentSession();
  const sessionActions = useSessionActions();
  
  // Get chat actions from store
  const chatActions = useChatActions();
  
  // Get current tasks for status display
  const currentTasks = useChatStore(state => state.currentTasks);
  
  // Get user module for credit validation
  const userModule = useUserModule();
  
  // Get app actions for navigation
  const { setCurrentApp } = useAppActions();
  
  // 🆕 Device detection and native app support
  const { isMobile, isTablet, deviceType } = useDeviceType();
  const nativeApp = useNativeApp();
  
  // // 🆕 任务管理集成
  // const { taskActions } = useTask();
  
  // 🆕 Widget事件监听系统
  const eventEmitterRef = useRef<{
    listeners: { [event: string]: ((data: any) => void)[] };
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler: (data: any) => void) => void;
  }>({
    listeners: {},
    emit: function(event: string, data: any) {
      console.log(`🔌 EVENT_EMITTER: Emitting ${event} to ${this.listeners[event]?.length || 0} listeners:`, data);
      if (this.listeners[event]) {
        this.listeners[event].forEach(handler => handler(data));
      }
    },
    on: function(event: string, handler: (data: any) => void) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(handler);
      console.log(`🔌 EVENT_EMITTER: Added listener for ${event}, total: ${this.listeners[event].length}`);
    },
    off: function(event: string, handler: (data: any) => void) {
      if (this.listeners[event]) {
        const index = this.listeners[event].indexOf(handler);
        if (index > -1) {
          this.listeners[event].splice(index, 1);
          console.log(`🔌 EVENT_EMITTER: Removed listener for ${event}, remaining: ${this.listeners[event].length}`);
        }
      }
    }
  });

  // 🆕 初始化Plugin模式监听
  useEffect(() => {
    // 动态导入WidgetHandler避免循环依赖
    const initializePluginMode = async () => {
      try {
        const { widgetHandler } = await import('../components/core/WidgetHandler');
        
        // 设置WidgetHandler为Plugin模式
        widgetHandler.setPluginMode(eventEmitterRef.current);
        
        // 🆕 设置全局Plugin模式标志，防止BaseWidgetStore重复创建artifact
        if (typeof window !== 'undefined') {
          (window as any).__CHAT_MODULE_PLUGIN_MODE__ = true;
        }
        
        // 监听Widget请求事件
        eventEmitterRef.current.on('widget:request', handleWidgetRequest);
        
        console.log('🔌 CHAT_MODULE: Plugin mode initialized, Widget events will be handled by ChatModule');
        
      } catch (error) {
        console.error('❌ CHAT_MODULE: Failed to initialize Plugin mode:', error);
      }
    };
    
    initializePluginMode();
    
    // 清理函数
    return () => {
      // 重置为Independent模式
      import('../components/core/WidgetHandler').then(({ widgetHandler }) => {
        widgetHandler.setIndependentMode();
      });
      
      // 🆕 清理全局Plugin模式标志
      if (typeof window !== 'undefined') {
        (window as any).__CHAT_MODULE_PLUGIN_MODE__ = false;
      }
    };
  }, []);

  // 🆕 HIL事件处理和监控初始化
  useEffect(() => {
    const initializeHILSystem = async () => {
      try {
        // 始终激活HIL监控，以便处理ask_human工具调用
        setHilMonitoringActive(true);
        
        // REMOVED: HIL回调注册 - SSEParser已删除
        // const { SSEParser } = await import('../api/SSEParser');
        // SSEParser.registerGlobalHILCallbacks({
        //   onHILInterruptDetected: handleHILInterrupt,
        //   onHILCheckpointCreated: handleHILCheckpoint,
        //   onHILExecutionStatusChanged: handleHILStatusChange,
        //   onHILApprovalRequired: handleHILApprovalRequired,
        //   onHILReviewRequired: handleHILReviewRequired,
        //   onHILInputRequired: handleHILInputRequired
        // });
        
        // 检查HIL服务是否可用
        const isServiceAvailable = await executionControlService.isServiceAvailable();
        if (!isServiceAvailable) {
          console.warn('🔄 CHAT_MODULE: HIL service not available, but HIL interrupt handling enabled for ask_human');
          return;
        }

        console.log('🚀 CHAT_MODULE: HIL service available, initializing event handlers');

        // REMOVED: HIL事件回调注册 - defaultAGUIProcessor已删除
        // defaultAGUIProcessor.registerAGUICallbacks({
        //   onHILInterruptDetected: (event) => {
        //     // 使用标准转换工具
        //     handleHILInterrupt(AGUIConverter.toHILInterruptData(event));
        //   },
        //   onHILCheckpointCreated: (event) => {
        //     // 使用标准转换工具
        //     handleHILCheckpoint(AGUIConverter.toHILCheckpointData(event));
        //   },
        //   onHILApprovalRequired: (event) => {
        //     console.log('HIL approval required:', event);
        //   },
        //   onHILReviewRequired: (event) => {
        //     // HILReviewRequired 事件暂时跳过，需要后端处理
        //     console.log('HIL review required:', event);
        //   },
        //   onHILInputRequired: (event) => {
        //     // HILInputRequired 事件暂时跳过，需要后端处理
        //     console.log('HIL input required:', event);
        //   },
        //   onRunStarted: handleExecutionStarted,
        //   onRunFinished: handleExecutionFinished,
        //   onRunError: handleExecutionError
        // });

        // 注册Legacy回调到SSEParser（通过现有的chatActions）
        // 这样HIL事件也能通过现有的SSE流处理
        
        setHilMonitoringActive(true);
        console.log('✅ CHAT_MODULE: HIL system initialized successfully');
        
        // 🧪 测试：添加手动HIL测试功能
        if (typeof window !== 'undefined') {
          (window as any).testHIL = () => {
            const testInterrupt = {
              id: `test_hil_${Date.now()}`,
              type: 'input_validation' as const,
              title: 'Test HIL Interrupt',
              message: 'This is a test HIL interrupt to verify the functionality.',
              timestamp: new Date().toISOString(),
              thread_id: currentSession?.id || 'test_thread',
              data: {
                question: 'Please confirm this is working correctly.',
                tool_name: 'test_interrupt',
                context: 'Manual test trigger'
              }
            };
            handleHILInterrupt(testInterrupt);
            console.log('🧪 CHAT_MODULE: Test HIL interrupt triggered');
          };
          console.log('🧪 CHAT_MODULE: Test function available at window.testHIL()');
        }

      } catch (error) {
        console.error('❌ CHAT_MODULE: Failed to initialize HIL system:', error);
      }
    };

    initializeHILSystem();

    // 清理函数
    return () => {
      setHilMonitoringActive(false);
      // 停止所有监控以避免内存泄漏
      executionControlService.stopAllMonitoring();
    };
  }, []);

  // 🆕 当有活跃会话时启动HIL监控 (with cleanup optimization)
  useEffect(() => {
    if (currentSession && hilMonitoringActive) {
      const threadId = currentSession.id;
      
      // 清理之前会话的监控以避免重复polling
      logger.debug(LogCategory.CHAT_FLOW, 'Starting HIL monitoring for new session', { 
        threadId,
        previousPollers: executionControlService.getActiveMonitoringStats().activePollers
      });
      
      // 开始监控执行状态
      const startMonitoring = async () => {
        try {
          await executionControlService.monitorExecution(threadId, {
            onInterruptDetected: (event) => {
              // 使用标准转换工具
              handleHILInterrupt(AGUIConverter.toHILInterruptData(event));
            },
            onStatusChanged: (status) => {
              // ExecutionControlService 现在直接提供 HIL 标准数据
              setHilStatus(status);
              handleHILStatusChange(status);
            },
            onError: (error) => {
              console.error('HIL monitoring error:', error);
            }
          });
        } catch (error) {
          console.error('Failed to start HIL monitoring:', error);
        }
      };

      startMonitoring();
    }
    
    // 清理函数：当会话改变或组件卸载时停止监控
    return () => {
      if (currentSession) {
        executionControlService.stopMonitoring(currentSession.id);
      }
    };
  }, [currentSession, hilMonitoringActive]);

  // 🆕 HIL事件处理函数
  const handleHILInterrupt = useCallback((interrupt: HILInterruptData) => {
    console.log('⏸️ CHAT_MODULE: HIL interrupt detected:', interrupt);
    
    // 🆕 设置正确的thread_id
    const interruptWithThreadId = {
      ...interrupt,
      thread_id: currentSession?.id || interrupt.thread_id
    };
    
    setHilInterrupts(prev => [...prev, interruptWithThreadId]);
    setCurrentInterrupt(interruptWithThreadId);
    setShowInterruptModal(true);
    
    // 显示HIL状态面板
    setShowHilStatusPanel(true);
    
    // 🆕 关键：停止当前的SSE流，让HIL接管
    console.log('🚨 CHAT_MODULE: Stopping current chat stream due to HIL interrupt');
    chatActions.finishStreamingMessage(); // 完成当前流式消息，防止卡在processing状态
    
    // 🆕 中断当前的聊天服务流
    try {
      import('../api/chatService').then(({ chatService }) => {
        chatService.cancelAllRequests(); // 取消当前的SSE请求
        console.log('🚨 CHAT_MODULE: Cancelled current chat service requests');
      }).catch(error => {
        console.warn('⚠️ CHAT_MODULE: Failed to cancel chat service requests:', error);
      });
    } catch (error) {
      console.warn('⚠️ CHAT_MODULE: Failed to import chat service:', error);
    }
    
    // 更新聊天状态显示
    chatActions.updateStreamingStatus(`⏸️ Human intervention required: ${interrupt.title}`);
    
    logger.info(LogCategory.CHAT_FLOW, 'HIL interrupt detected and modal opened', {
      interruptId: interrupt.id,
      type: interrupt.type
    });
  }, [chatActions]);

  const handleHILCheckpoint = useCallback((checkpoint: HILCheckpointData) => {
    console.log('📍 CHAT_MODULE: HIL checkpoint created:', checkpoint);
    
    setHilCheckpoints(prev => [checkpoint, ...prev.slice(0, 19)]); // 保留最近20个检查点
    
    // 更新聊天状态显示
    chatActions.updateStreamingStatus(`📍 Checkpoint saved: ${checkpoint.node}`);
    
    logger.debug(LogCategory.CHAT_FLOW, 'HIL checkpoint created', {
      checkpointId: checkpoint.checkpoint_id,
      node: checkpoint.node
    });
  }, [chatActions]);

  const handleHILStatusChange = useCallback((status: HILExecutionStatusData) => {
    // console.log('📊 CHAT_MODULE: HIL status changed:', status); // 删除干扰日志
    
    setHilStatus(status);
    
    // 根据状态更新UI显示
    if (status.status === 'interrupted') {
      setShowHilStatusPanel(true);
    }
    
    logger.debug(LogCategory.CHAT_FLOW, 'HIL execution status changed', {
      threadId: status.thread_id,
      status: status.status
    });
  }, []);

  const handleHILApprovalRequired = useCallback((approval: any) => {
    console.log('✋ CHAT_MODULE: HIL approval required:', approval);
    // 审批请求会通过handleHILInterrupt统一处理
  }, []);

  const handleHILReviewRequired = useCallback((review: any) => {
    console.log('👁️ CHAT_MODULE: HIL review required:', review);
    // 审查请求会通过handleHILInterrupt统一处理
  }, []);

  const handleHILInputRequired = useCallback((input: any) => {
    console.log('📝 CHAT_MODULE: HIL input required:', input);
    // 输入请求会通过handleHILInterrupt统一处理
  }, []);

  const handleExecutionStarted = useCallback((event: any) => {
    console.log('🚀 CHAT_MODULE: Execution started:', event);
    chatActions.updateStreamingStatus('🚀 Execution started...');
  }, [chatActions]);

  const handleExecutionFinished = useCallback((event: any) => {
    console.log('🎉 CHAT_MODULE: Execution finished:', event);
    chatActions.updateStreamingStatus('🎉 Execution completed');
  }, [chatActions]);

  const handleExecutionError = useCallback((event: any) => {
    console.log('❌ CHAT_MODULE: Execution error:', event);
    chatActions.updateStreamingStatus(`❌ Execution error: ${event.error?.message || 'Unknown error'}`);
  }, [chatActions]);

  // 🆕 HIL操作处理函数
  const handleHILApprove = useCallback(async (interruptId: string, data?: any) => {
    if (!currentSession) return;
    
    setIsProcessingHilAction(true);
    
    try {
      const resumeRequest = {
        thread_id: currentSession.id,
        action: 'continue' as const,
        resume_data: {
          approved: true,
          user_input: data,
          human_decision: 'approve_with_input',
          timestamp: new Date().toISOString(),
          interrupt_id: interruptId
        }
      };
      
      console.log('✅ CHAT_MODULE: Approving HIL action:', resumeRequest);
      
      // 🆕 使用HIL专用的流式恢复，集成到主聊天流
      console.log('🔄 CHAT_MODULE: Starting HIL resume stream integration...');
      
      // 重新启动流式消息处理，将HIL恢复流作为新的AI回复
      const resumeMessageId = `resume-${Date.now()}`;
      chatActions.startStreamingMessage(resumeMessageId, '🔄 Resuming execution...');
      
      await executionControlService.resumeExecutionStream(resumeRequest, {
        onResumeStart: (data) => {
          console.log('🔄 HIL_RESUME: Resume started:', data);
          chatActions.updateStreamingStatus('🔄 Processing your input...');
        },
        onMessageStream: (data) => {
          console.log('📨 HIL_RESUME: Message stream event:', data);
          
          // 处理消息流事件，提取实际内容
          if (data.content?.raw_message) {
            let messageContent = data.content.raw_message;
            
            // 提取content部分的纯净内容（和chatService中的逻辑一致）
            const contentMatch = messageContent.match(/content='([^']*(?:\\\\'[^']*)*)'|content="([^"]*(?:\\\\"[^"]*)*)"/);;
            if (contentMatch) {
              messageContent = contentMatch[1] || contentMatch[2];
              messageContent = messageContent.replace(/\\\\"/g, '"').replace(/\\\\'/g, "'");
              console.log('📨 HIL_RESUME: Extracted content:', messageContent.substring(0, 100) + '...');
              
              // 只有当有实际内容时才添加到流式消息
              if (messageContent && messageContent.trim() && !messageContent.includes('tool_calls')) {
                chatActions.appendToStreamingMessage(messageContent);
              }
            }
          }
        },
        onResumeEnd: (data) => {
          console.log('✅ HIL_RESUME: Resume completed:', data);
          chatActions.updateStreamingStatus('✅ Response completed');
          chatActions.finishStreamingMessage(); // 完成流式消息
        },
        onError: (error) => {
          console.error('❌ HIL_RESUME: Resume failed:', error);
          chatActions.updateStreamingStatus(`❌ Failed to resume: ${error.message}`);
          chatActions.finishStreamingMessage(); // 即使出错也要完成流式消息
        }
      });
      
      setShowInterruptModal(false);
      setCurrentInterrupt(null);
      
      logger.info(LogCategory.CHAT_FLOW, 'HIL action approved and executed', { interruptId });
      
    } catch (error) {
      console.error('Failed to approve HIL action:', error);
      chatActions.updateStreamingStatus(`❌ Failed to approve action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingHilAction(false);
    }
  }, [currentSession, chatActions, executionControlService]);

  const handleHILReject = useCallback(async (interruptId: string, reason?: string) => {
    if (!currentSession) return;
    
    setIsProcessingHilAction(true);
    
    try {
      const resumeRequest = {
        thread_id: currentSession.id,
        action: 'reject' as const,
        resume_data: {
          approved: false,
          rejection_reason: reason,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('❌ CHAT_MODULE: Rejecting HIL action:', resumeRequest);
      
      const result = await executionControlService.resumeExecution(resumeRequest);
      
      if (result.success) {
        chatActions.updateStreamingStatus('❌ Action rejected by user');
        setShowInterruptModal(false);
        setCurrentInterrupt(null);
        
        logger.info(LogCategory.CHAT_FLOW, 'HIL action rejected', { interruptId, reason });
      } else {
        throw new Error(result.message || 'Rejection failed');
      }
      
    } catch (error) {
      console.error('Failed to reject HIL action:', error);
      chatActions.updateStreamingStatus(`❌ Failed to reject action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingHilAction(false);
    }
  }, [currentSession, chatActions, executionControlService]);

  const handleHILEdit = useCallback(async (interruptId: string, editedContent: any) => {
    // Edit操作实际上是approve with modifications
    await handleHILApprove(interruptId, { edited_content: editedContent });
  }, [handleHILApprove]);

  const handleHILInput = useCallback(async (interruptId: string, userInput: any) => {
    // Input操作实际上是approve with user input
    await handleHILApprove(interruptId, { user_input: userInput });
  }, [handleHILApprove]);

  const handleHILRollback = useCallback(async (checkpointId: string) => {
    if (!currentSession) return;
    
    try {
      console.log('🔄 CHAT_MODULE: Rolling back to checkpoint:', checkpointId);
      
      const result = await executionControlService.rollbackToCheckpoint(currentSession.id, checkpointId);
      
      if (result.success) {
        chatActions.updateStreamingStatus(`🔄 Rolled back to: ${result.restored_state.node}`);
        
        // 更新状态
        await executionControlService.getExecutionStatus(currentSession.id)
          .then(status => {
            // 使用标准转换工具
            setHilStatus(AGUIConverter.toHILExecutionStatusData(status, currentSession.id));
          })
          .catch(console.error);
        
        logger.info(LogCategory.CHAT_FLOW, 'HIL rollback completed', { 
          checkpointId, 
          restoredNode: result.restored_state.node 
        });
      } else {
        throw new Error(result.message || 'Rollback failed');
      }
      
    } catch (error) {
      console.error('Failed to rollback:', error);
      chatActions.updateStreamingStatus(`❌ Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [currentSession, chatActions, executionControlService]);

  const handleHILPauseExecution = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      // HIL暂停通常通过中断机制实现
      console.log('⏸️ CHAT_MODULE: Pausing execution for thread:', currentSession.id);
      chatActions.updateStreamingStatus('⏸️ Execution paused by user');
      
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  }, [currentSession, chatActions]);

  const handleHILResumeExecution = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      const resumeRequest = {
        thread_id: currentSession.id,
        action: 'continue' as const,
        resume_data: {
          user_request: 'manual_resume',
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('▶️ CHAT_MODULE: Resuming execution:', resumeRequest);
      
      const result = await executionControlService.resumeExecution(resumeRequest);
      
      if (result.success) {
        chatActions.updateStreamingStatus('▶️ Execution resumed');
      } else {
        throw new Error(result.message || 'Resume failed');
      }
      
    } catch (error) {
      console.error('Failed to resume execution:', error);
      chatActions.updateStreamingStatus(`❌ Resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [currentSession, chatActions, executionControlService]);

  const handleViewInterrupt = useCallback((interrupt: HILInterruptData) => {
    setCurrentInterrupt(interrupt);
    setShowInterruptModal(true);
  }, []);

  // 🆕 Helper方法：映射Plugin输出类型到Artifact内容类型
  const mapPluginTypeToContentType = useCallback((pluginType: string): 'image' | 'text' | 'data' | 'analysis' | 'knowledge' => {
    switch (pluginType) {
      case 'image': return 'image';
      case 'data': return 'data';
      case 'search_results': return 'analysis';
      case 'search': return 'analysis';
      case 'knowledge': return 'knowledge';
      case 'text':
      default: return 'text';
    }
  }, []);

  // 🆕 处理Widget请求事件
  const handleWidgetRequest = useCallback(async (eventData: any) => {
    console.log('🔌 CHAT_MODULE: Received widget request event:', eventData);
    
    const { widgetType, params, requestId } = eventData;
    
    // 🆕 设置Chat loading状态
    chatActions.setChatLoading(true);
    
    // CRITICAL: Check user credits before processing widget request
    console.log('💳 CHAT_MODULE: Credit check details:', {
      hasCredits: userModule.hasCredits,
      credits: userModule.credits,
      totalCredits: userModule.totalCredits,
      currentPlan: userModule.currentPlan
    });
    
    // 🆕 在开发环境下跳过信用检查
    const shouldSkipCreditCheck = process.env.NODE_ENV === 'development';
    
    if (!userModule.hasCredits && !shouldSkipCreditCheck) {
      console.warn('💳 CHAT_MODULE: User has no credits, blocking widget request');
      
      // 🆕 发出错误事件给Widget
      eventEmitterRef.current.emit('widget:result', {
        widgetType,
        requestId,
        error: 'Insufficient credits',
        success: false
      });
      
      setShowUpgradeModal(true);
      return;
    }
    
    if (shouldSkipCreditCheck) {
      console.log('🔓 CHAT_MODULE: Development mode - skipping credit check');
    }
    
    // 确保有valid session
    let activeSessionId = currentSession?.id;
    if (!currentSession || !activeSessionId) {
      const newSessionTitle = `${widgetType.toUpperCase()} Widget - ${new Date().toLocaleTimeString()}`;
      const newSession = sessionActions.createSession(newSessionTitle);
      sessionActions.selectSession(newSession.id);
      activeSessionId = newSession.id;
      
      console.log('📝 CHAT_MODULE: Auto-created session for widget request:', {
        sessionId: newSession.id,
        widgetType
      });
    }
    
    // 创建用户消息 (显示用户的Widget操作)
    const userMessage = {
      id: `user-widget-${requestId}`,
      type: 'regular' as const,
      role: 'user' as const,
      content: params.prompt || params.query || `Generate ${widgetType} content`,
      timestamp: new Date().toISOString(),
      sessionId: activeSessionId,
      metadata: {
        widgetType,
        widgetRequest: true,
        originalParams: params
      }
    };
    
    console.log('📨 CHAT_MODULE: Adding widget user message to chat');
    chatActions.addMessage(userMessage);
    
    // 通过PluginManager处理Widget请求
    try {
      const pluginResult = await executePlugin(widgetType, {
        prompt: params.prompt || `Generate ${widgetType} content`,
        options: params,
        context: {
          sessionId: activeSessionId,
          userId: auth0User?.sub || 'anonymous',
          messageId: userMessage.id,
          requestId
        }
      });
      
      if (pluginResult.success && pluginResult.output) {
        // 🆕 创建Artifact消息而不是普通消息
        const artifactMessage = {
          id: `assistant-widget-${requestId}`,
          type: 'artifact' as const,
          role: 'assistant' as const,
          content: typeof pluginResult.output.content === 'string' 
            ? pluginResult.output.content 
            : JSON.stringify(pluginResult.output.content),
          timestamp: new Date().toISOString(),
          sessionId: activeSessionId,
          userPrompt: params.prompt || `${widgetType} request`,
          artifact: {
            id: pluginResult.output.id || `${widgetType}_${Date.now()}`,
            widgetType: widgetType,
            widgetName: widgetType.charAt(0).toUpperCase() + widgetType.slice(1),
            version: 1,
            contentType: mapPluginTypeToContentType(pluginResult.output.type || 'text'),
            content: typeof pluginResult.output.content === 'string' 
              ? pluginResult.output.content 
              : JSON.stringify(pluginResult.output.content),
            thumbnail: (pluginResult.output as any).thumbnail,
            metadata: {
              processingTime: pluginResult.executionTime,
              createdBy: 'plugin',
              pluginResult: pluginResult.output
            }
          }
        };
        
        chatActions.addMessage(artifactMessage);
        
        // 🆕 清除Chat loading状态
        chatActions.setChatLoading(false);
        
        // 🆕 将结果通过事件系统返回给Widget UI
        console.log('🔌 CHAT_MODULE: Emitting widget:result event:', {
          widgetType,
          requestId,
          result: pluginResult.output,
          success: true
        });
        
        eventEmitterRef.current.emit('widget:result', {
          widgetType,
          requestId,
          result: pluginResult.output,
          success: true
        });
        
        console.log('✅ CHAT_MODULE: Widget request processed successfully via Plugin system, artifact created');
        
      } else {
        console.error('❌ CHAT_MODULE: Widget plugin execution failed:', pluginResult.error);
        
        // 🆕 清除Chat loading状态
        chatActions.setChatLoading(false);
        
        // 🆕 发出错误事件
        eventEmitterRef.current.emit('widget:result', {
          widgetType,
          requestId,
          error: pluginResult.error,
          success: false
        });
      }
      
    } catch (error) {
      console.error('❌ CHAT_MODULE: Widget request processing failed:', error);
      
      // 🆕 清除Chat loading状态
      chatActions.setChatLoading(false);
      
      // 🆕 发出错误事件
      eventEmitterRef.current.emit('widget:result', {
        widgetType,
        requestId,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
    
  }, [chatActions, auth0User, currentSession, sessionActions, userModule, setShowUpgradeModal, mapPluginTypeToContentType]);

  // ================================================================================
  // 聊天控制业务逻辑 - New Chat and Session Management
  // ================================================================================
  
  // Business logic: Handle new chat creation
  const handleNewChat = useCallback(() => {
    logger.info(LogCategory.CHAT_FLOW, '📱 Creating new chat session from mobile interface');
    
    // Create a new session with timestamp
    const newSessionTitle = `New Chat ${new Date().toLocaleTimeString()}`;
    const newSession = sessionActions.createSession(newSessionTitle);
    sessionActions.selectSession(newSession.id);
    
    logger.info(LogCategory.CHAT_FLOW, 'New chat session created', {
      sessionId: newSession.id,
      title: newSessionTitle
    });
  }, [sessionActions, logger]);

  // ================================================================================
  // 消息发送业务逻辑 - 原有的消息发送处理
  // ================================================================================
  
  // Business logic: Handle message sending
  const handleSendMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    
    // CRITICAL: Check user credits before sending message
    if (!userModule.hasCredits) {
      console.warn('💳 CHAT_MODULE: User has no credits, blocking message send');
      setShowUpgradeModal(true);
      return;
    }
    
    // Ensure we have a valid session before sending message
    let sessionId = currentSession?.id;
    
    if (!currentSession || !sessionId) {
      // Auto-create a new session if none exists
      const newSessionTitle = `New Chat ${new Date().toLocaleTimeString()}`;
      const newSession = sessionActions.createSession(newSessionTitle);
      sessionActions.selectSession(newSession.id);
      sessionId = newSession.id;
      
      logger.info(LogCategory.CHAT_FLOW, 'Auto-creating session for message sending', {
        sessionId: newSession.id,
        messagePreview: content.substring(0, 50)
      });
    }
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      user_id: auth0User?.sub || (() => { throw new Error('User not authenticated') })(),
      session_id: sessionId
    };
    
    // ✅ STEP 1: Create user message (ChatModule responsible for ALL message creation)
    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: 'regular' as const,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      metadata: enrichedMetadata,
      processed: true
    };
    
    // Adding user message to store
    chatActions.addMessage(userMessage);
    
    // ✅ STEP 2: Check if message triggers a plugin
    const pluginTrigger = detectPluginTrigger(content);
    
    if (pluginTrigger.triggered && pluginTrigger.pluginId) {
      // 🔌 PLUGIN ROUTE: Handle via Plugin System
      console.log('🔌 CHAT_MODULE: Plugin detected, routing to PluginManager:', pluginTrigger);
      
      try {
        // Create processing message for plugin
        const processingMessage = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'regular' as const,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
          isStreaming: true,
          streamingStatus: `Processing with ${pluginTrigger.pluginId} plugin...`,
          metadata: {
            ...enrichedMetadata,
            pluginId: pluginTrigger.pluginId,
            trigger: pluginTrigger.trigger
          }
        };
        
        chatActions.addMessage(processingMessage);
        
        // Execute plugin
        const pluginInput = {
          prompt: pluginTrigger.extractedParams?.prompt || content,
          options: pluginTrigger.extractedParams || {},
          context: {
            sessionId,
            userId: auth0User?.sub || (() => { throw new Error('User not authenticated') })(),
            messageId: userMessage.id
          }
        };
        
        const pluginResult = await executePlugin(pluginTrigger.pluginId as any, pluginInput);
        
        if (pluginResult.success && pluginResult.output) {
          // Update processing message with plugin result
          const completedMessage = {
            ...processingMessage,
            content: typeof pluginResult.output.content === 'string' 
              ? pluginResult.output.content 
              : JSON.stringify(pluginResult.output.content),
            isStreaming: false,
            streamingStatus: undefined,
            metadata: {
              ...processingMessage.metadata,
              pluginResult: pluginResult.output,
              executionTime: pluginResult.executionTime
            }
          };
          
          chatActions.addMessage(completedMessage);
          console.log('✅ CHAT_MODULE: Plugin execution completed successfully');
          
        } else {
          // Handle plugin error
          const errorMessage = {
            ...processingMessage,
            content: `Plugin execution failed: ${pluginResult.error}`,
            isStreaming: false,
            streamingStatus: undefined,
            metadata: {
              ...processingMessage.metadata,
              error: pluginResult.error
            }
          };
          
          chatActions.addMessage(errorMessage);
          console.error('❌ CHAT_MODULE: Plugin execution failed:', pluginResult.error);
        }
        
      } catch (error) {
        console.error('❌ CHAT_MODULE: Plugin system error:', error);
        // Handle plugin system error - could still fall back to regular chat
      }
      
    } else {
      // 💬 REGULAR CHAT ROUTE: Handle via ChatService API
      // No plugin detected, using ChatService API
      
      try {
        const token = await userModule.getAccessToken();
        
        await chatActions.sendMessage(content, enrichedMetadata, token);
        // Regular chat message sent successfully
        
      } catch (error) {
        console.error('❌ CHAT_MODULE: Failed to send regular chat message:', error);
        throw error;
      }
    }
    
  }, [chatActions, auth0User, currentSession, sessionActions, userModule]);

  // Business logic: Handle multimodal message sending
  const handleSendMultimodal = useCallback(async (content: string, files: File[], metadata?: Record<string, any>) => {
    console.log('📨 CHAT_MODULE: sendMultimodalMessage called with:', content, files.length, 'files');
    
    // CRITICAL: Check user credits before sending multimodal message
    if (!userModule.hasCredits) {
      console.warn('💳 CHAT_MODULE: User has no credits, blocking multimodal message send');
      
      // Show elegant upgrade prompt for multimodal
      const shouldUpgrade = window.confirm(
        `💳 No Credits Remaining\n\n` +
        `You've used all your available credits. Multimodal messages (with files) require credits to process.\n\n` +
        `Current Plan: ${userModule.currentPlan.toUpperCase()}\n` +
        `Credits: ${userModule.credits} / ${userModule.totalCredits}\n\n` +
        `Would you like to upgrade your plan now?`
      );
      
      if (shouldUpgrade) {
        // Navigate to pricing page or open upgrade modal
        try {
          const checkoutUrl = await userModule.createCheckout('pro');
          window.open(checkoutUrl, '_blank');
        } catch (error) {
          console.error('Failed to create checkout:', error);
          // Fallback to pricing page
          window.open('/pricing', '_blank');
        }
      }
      
      // Prevent message from being sent
      return;
    }
    
    console.log('✅ CHAT_MODULE: Credit check passed for multimodal, proceeding with message send');
    
    // Business logic: Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      user_id: auth0User?.sub || (() => { throw new Error('User not authenticated') })(),
      session_id: metadata?.session_id || 'default',
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })) // Add file info to metadata
    };
    
    // Create user message and add to store
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'regular' as const,
      role: 'user' as const,
      content: content,
      timestamp: new Date().toISOString(),
      sessionId: metadata?.session_id || 'default',
      metadata: enrichedMetadata,
      processed: true // Mark as processed since we're handling it directly
    };
    
    console.log('📨 CHAT_MODULE: Adding multimodal user message to store');
    chatActions.addMessage(userMessage);
    
    // 直接调用 sendMessage API (multimodal is handled by metadata)
    console.log('📨 CHAT_MODULE: Calling sendMessage API for multimodal content');
    
    try {
      // 获取用户token用于API认证
      const token = await userModule.getAccessToken();
      console.log('🔑 CHAT_MODULE: Retrieved access token for multimodal API call');
      
      await chatActions.sendMessage(content, enrichedMetadata, token);
      console.log('✅ CHAT_MODULE: Multimodal message sent successfully');
    } catch (error) {
      console.error('❌ CHAT_MODULE: Failed to send multimodal message:', error);
      throw error;
    }
  }, [chatActions, auth0User, userModule]);

  // Handle message click for artifact navigation
  const handleMessageClick = useCallback((message: any) => {
    console.log('💬 CHAT_MODULE: Message clicked:', message);
    
    // Check if this is an artifact message and navigate to the corresponding widget
    if (message.type === 'artifact') {
      const artifactMessage = message as ArtifactMessage;
      const widgetType = artifactMessage.artifact.widgetType;
      
      // Map widget types to app IDs
      const widgetToAppMap = {
        'dream': 'dream',
        'hunt': 'hunt', 
        'omni': 'omni',
        'data_scientist': 'data-scientist',
        'knowledge': 'knowledge'
      };
      
      const appId = widgetToAppMap[widgetType as keyof typeof widgetToAppMap];
      if (appId) {
        console.log(`🔄 CHAT_MODULE: Navigating to ${appId} widget for artifact:`, artifactMessage.artifact.id);
        setCurrentApp(appId as AppId);
      } else {
        console.warn('💬 CHAT_MODULE: Unknown widget type for navigation:', widgetType);
      }
    }
  }, [setCurrentApp]);


  // Handle upgrade modal actions
  const handleUpgrade = useCallback(async (planType: 'pro' | 'enterprise') => {
    try {
      const checkoutUrl = await userModule.createCheckout(planType);
      window.open(checkoutUrl, '_blank');
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Failed to create checkout:', error);
      // Fallback to pricing page
      window.open('/pricing', '_blank');
      setShowUpgradeModal(false);
    }
  }, [userModule]);

  const handleViewPricing = useCallback(() => {
    window.open('/pricing', '_blank');
    setShowUpgradeModal(false);
  }, []);

  // Handle widget selection - 打开真正的widget
  const handleWidgetSelect = useCallback((widgetId: string, mode: 'half' | 'full') => {
    console.log('🔧 CHAT_MODULE: Widget selected:', { widgetId, mode });
    
    // ✅ 设置Plugin模式标志，让Widget知道它们正在Chat环境中运行
    if (typeof window !== 'undefined') {
      (window as any).__CHAT_MODULE_PLUGIN_MODE__ = true;
    }
    
    // 导入RightSidebarLayout来显示真正的widget
    import('../components/ui/chat/RightSidebarLayout').then(({ RightSidebarLayout }) => {
      const widgetContent = (
        <RightSidebarLayout
          currentApp={widgetId}
          showRightSidebar={true}
          triggeredAppInput=""
          onCloseApp={handleCloseWidget}
          onToggleMode={handleToggleWidgetMode}
          onAppSelect={(appId) => {
            console.log('Widget app selected:', appId);
          }}
        />
      );
      
      setCurrentWidgetMode(mode);
      setSelectedWidgetContent(widgetContent);
    });
    
    // Close widget selector through parent callback
    if (onCloseWidgetSelector) {
      onCloseWidgetSelector();
    }
  }, [onCloseWidgetSelector]);

  const handleCloseWidget = useCallback(() => {
    setCurrentWidgetMode(null);
    setSelectedWidgetContent(null);
    
    // ✅ 清理Plugin模式标志
    if (typeof window !== 'undefined') {
      (window as any).__CHAT_MODULE_PLUGIN_MODE__ = false;
    }
  }, []);

  // 🆕 处理模式切换 (half ↔ full)
  const handleToggleWidgetMode = useCallback(() => {
    if (!currentWidgetMode) return;
    
    const newMode = currentWidgetMode === 'half' ? 'full' : 'half';
    setCurrentWidgetMode(newMode);
    
    console.log('🔄 CHAT_MODULE: Widget mode toggled:', { from: currentWidgetMode, to: newMode });
  }, [currentWidgetMode]);


  // Pass all data and business logic callbacks as props to pure UI component
  return (
    <>
      <ResponsiveChatLayout
        {...otherProps}
        messages={chatInterface.messages as any} // TODO: Fix type mismatch
        isLoading={chatInterface.isLoading}
        isTyping={chatInterface.isTyping}
        currentTasks={currentTasks}
        onSendMessage={handleSendMessage}
        onSendMultimodal={handleSendMultimodal}
        onMessageClick={handleMessageClick}
        onNewChat={handleNewChat}
        
        // 🆕 Responsive layout based on device type
        forceLayout={isMobile ? 'mobile' : 'auto'} // Use mobile layout for mobile devices
        showHeader={!isMobile} // Hide ChatLayout header on mobile (AppLayout controls desktop header)
        
        // 🆕 Mobile-first responsive props
        enableSwipeGestures={isMobile || isTablet}
        enablePullToRefresh={isMobile}
        isNativeApp={nativeApp.isNativeApp}
        nativeStatusBarHeight={nativeApp.statusBarHeight}
        nativeBottomSafeArea={nativeApp.safeAreaInsets.bottom}
        
        // Right Panel (会话信息管理)
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        rightPanelContent={
          <RightPanel 
            hilStatus={hilStatus}
            hilCheckpoints={hilCheckpoints}
            hilInterrupts={hilInterrupts}
            hilMonitoringActive={hilMonitoringActive}
            showHilStatusPanel={showHilStatusPanel}
            onToggleHilStatusPanel={() => setShowHilStatusPanel(!showHilStatusPanel)}
            onHilRollback={handleHILRollback}
            onHilPauseExecution={handleHILPauseExecution}
            onHilResumeExecution={handleHILResumeExecution}
            onHilViewInterrupt={handleViewInterrupt}
          />
        }
        
        // Widget System Integration
        showWidgetSelector={showWidgetSelector}
        onCloseWidgetSelector={onCloseWidgetSelector}
        onShowWidgetSelector={onShowWidgetSelector}
        onWidgetSelect={handleWidgetSelect}
        
        // Half-screen widget mode
        showRightSidebar={currentWidgetMode === 'half'}
        rightSidebarContent={selectedWidgetContent}
        rightSidebarMode="half"
        
        // Full-screen widget mode  
        showFullScreenWidget={currentWidgetMode === 'full'}
        fullScreenWidget={selectedWidgetContent}
        onCloseFullScreenWidget={handleCloseWidget}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userModule.currentPlan}
        credits={userModule.credits}
        totalCredits={userModule.totalCredits}
        onUpgrade={handleUpgrade}
        onViewPricing={handleViewPricing}
      />

      {/* 🆕 HIL Interrupt Modal - Keep as overlay */}
      {hilMonitoringActive && (
        <HILInterruptModal
          isOpen={showInterruptModal}
          interrupt={currentInterrupt}
          onClose={() => setShowInterruptModal(false)}
          onApprove={handleHILApprove}
          onReject={handleHILReject}
          onEdit={handleHILEdit}
          onInput={handleHILInput}
          isProcessing={isProcessingHilAction}
        />
      )}

      {/* 🆕 HIL Interaction Manager - 基于实际API格式的新HIL处理 */}
      <HILInteractionManager />
      
      {/* 🆕 Debug Monitor for polling optimization - REMOVED FOR TESTING */}
      {/* <StatusPollingMonitor /> */}
    </>
  );
};