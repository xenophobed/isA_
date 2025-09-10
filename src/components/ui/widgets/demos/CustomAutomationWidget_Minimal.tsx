/**
 * ============================================================================
 * CustomAutomationWidget - Minimal Chat-style Demo
 * ============================================================================
 * 
 * 极简对话风格：
 * - 类似聊天的交互方式
 * - 渐进式信息收集
 * - 自然语言配置界面
 */

import React, { useState, useRef, useEffect } from 'react';
import { BaseWidget } from '../BaseWidget';
import { Button } from '../../../shared/ui/Button';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  metadata?: any;
}

interface ChatAction {
  id: string;
  label: string;
  type: 'button' | 'input' | 'select';
  options?: string[];
  value?: any;
}

interface AutomationContext {
  task?: string;
  parameters: Record<string, any>;
  currentStep: string;
  isComplete: boolean;
}

const MinimalAutomationDemo: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<AutomationContext>({
    parameters: {},
    currentStep: 'greeting',
    isComplete: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    addMessage('assistant', '👋 你好！我是智能自动化助手。请告诉我你想要自动化什么任务？', [
      { id: 'data-processing', label: '🔄 数据处理', type: 'button' },
      { id: 'content-creation', label: '✍️ 内容创作', type: 'button' },
      { id: 'workflow-automation', label: '⚙️ 流程自动化', type: 'button' },
      { id: 'custom', label: '💭 自定义任务', type: 'button' }
    ]);
  }, []);

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string, actions?: ChatAction[], metadata?: any) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      actions,
      metadata
    };
    setMessages(prev => [...prev, message]);
  };

  const simulateTyping = async (callback: () => void, delay = 1000) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    callback();
  };

  const handleActionClick = async (action: ChatAction) => {
    // Add user selection as message
    addMessage('user', action.label);

    switch (action.id) {
      case 'data-processing':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, task: 'data-processing', currentStep: 'data-source' }));
          addMessage('assistant', '📊 太好了！让我们设置数据处理自动化。请选择你的数据源类型：', [
            { id: 'file-upload', label: '📁 上传文件', type: 'button' },
            { id: 'database', label: '🗄️ 数据库连接', type: 'button' },
            { id: 'api', label: '🔌 API接口', type: 'button' },
            { id: 'web-scraping', label: '🕷️ 网页抓取', type: 'button' }
          ]);
        });
        break;

      case 'content-creation':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, task: 'content-creation', currentStep: 'content-type' }));
          addMessage('assistant', '✨ 优秀的选择！我可以帮你创作各种类型的内容。你需要什么？', [
            { id: 'article', label: '📄 文章/博客', type: 'button' },
            { id: 'social-media', label: '📱 社媒内容', type: 'button' },
            { id: 'presentation', label: '🎞️ 演示文稿', type: 'button' },
            { id: 'marketing', label: '📢 营销文案', type: 'button' }
          ]);
        });
        break;

      case 'workflow-automation':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, task: 'workflow-automation', currentStep: 'workflow-type' }));
          addMessage('assistant', '⚙️ 很棒！自动化可以大大提升效率。你想自动化哪种工作流程？', [
            { id: 'approval', label: '✅ 审批流程', type: 'button' },
            { id: 'notification', label: '📧 通知系统', type: 'button' },
            { id: 'scheduling', label: '📅 任务调度', type: 'button' },
            { id: 'integration', label: '🔗 系统集成', type: 'button' }
          ]);
        });
        break;

      case 'custom':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, task: 'custom', currentStep: 'custom-input' }));
          addMessage('assistant', '🎯 太棒了！请详细描述你想要自动化的任务，我会为你定制最合适的解决方案。', [
            { id: 'custom-input', label: '详细描述任务', type: 'input' }
          ]);
        });
        break;

      case 'file-upload':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, parameters: { ...prev.parameters, dataSource: 'file' }, currentStep: 'processing-options' }));
          addMessage('assistant', '📁 好的！文件上传已配置。请选择你想要的数据处理选项：', [
            { id: 'clean-data', label: '🧹 数据清洗', type: 'button' },
            { id: 'analyze-data', label: '📈 数据分析', type: 'button' },
            { id: 'transform-data', label: '🔄 数据转换', type: 'button' },
            { id: 'all-processing', label: '🎯 全部处理', type: 'button' }
          ]);
        });
        break;

      case 'all-processing':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, parameters: { ...prev.parameters, processing: 'full' }, currentStep: 'output-format' }));
          addMessage('assistant', '🎯 完美！我会对你的数据进行完整处理。最后，选择输出格式：', [
            { id: 'excel', label: '📊 Excel报表', type: 'button' },
            { id: 'pdf-report', label: '📋 PDF报告', type: 'button' },
            { id: 'dashboard', label: '📈 交互仪表板', type: 'button' },
            { id: 'json-api', label: '🔌 JSON API', type: 'button' }
          ]);
        });
        break;

      case 'dashboard':
        await simulateTyping(() => {
          setContext(prev => ({ ...prev, parameters: { ...prev.parameters, output: 'dashboard' }, isComplete: true }));
          addMessage('assistant', '🎉 完美！你的自动化配置已完成：\n\n📊 **数据处理自动化**\n- 数据源：文件上传\n- 处理：完整数据处理流程\n- 输出：交互式仪表板\n\n我现在就可以为你执行这个自动化流程！', [
            { id: 'execute', label: '🚀 立即执行', type: 'button' },
            { id: 'schedule', label: '⏰ 定时执行', type: 'button' },
            { id: 'save-template', label: '💾 保存为模板', type: 'button' }
          ]);
        });
        break;

      case 'execute':
        await simulateTyping(() => {
          addMessage('system', '🚀 自动化流程已启动！我会在完成后通知你。');
          addMessage('assistant', '太棒了！你的自动化任务正在后台执行。你可以：\n\n1. 📊 查看实时进度\n2. ⏸️ 暂停/恢复执行\n3. 🔔 设置完成通知\n4. 🎯 创建更多自动化\n\n还有其他我可以帮你自动化的任务吗？', [
            { id: 'new-task', label: '➕ 新建任务', type: 'button' },
            { id: 'view-progress', label: '👀 查看进度', type: 'button' },
            { id: 'manage-automations', label: '⚙️ 管理自动化', type: 'button' }
          ]);
        });
        break;

      default:
        console.log('Action not handled:', action.id);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    addMessage('user', inputValue);
    const userInput = inputValue;
    setInputValue('');

    // Simulate AI response based on current context
    await simulateTyping(() => {
      if (context.currentStep === 'custom-input') {
        addMessage('assistant', `🤔 明白了！"${userInput}" - 这是一个很有趣的自动化需求。\n\n让我为你分析一下实现方案：\n\n1. 🔍 需求分析和可行性评估\n2. 🏗️ 设计自动化架构\n3. ⚙️ 配置执行参数\n4. 🧪 测试和优化\n\n你希望从哪一步开始？`, [
          { id: 'start-analysis', label: '🔍 开始分析', type: 'button' },
          { id: 'show-examples', label: '💡 查看类似案例', type: 'button' },
          { id: 'quick-setup', label: '⚡ 快速设置', type: 'button' }
        ]);
      } else {
        addMessage('assistant', '我正在处理你的请求，请稍等片刻...', []);
      }
    });
  };

  const managementActions = [
    {
      id: 'clear-chat',
      label: '清空对话',
      icon: '🗑️',
      onClick: () => {
        setMessages([]);
        setContext({ parameters: {}, currentStep: 'greeting', isComplete: false });
        // Re-add initial greeting
        setTimeout(() => {
          addMessage('assistant', '👋 对话已重置！请告诉我你想要自动化什么任务？', [
            { id: 'data-processing', label: '🔄 数据处理', type: 'button' },
            { id: 'content-creation', label: '✍️ 内容创作', type: 'button' },
            { id: 'workflow-automation', label: '⚙️ 流程自动化', type: 'button' },
            { id: 'custom', label: '💭 自定义任务', type: 'button' }
          ]);
        }, 100);
      },
      variant: 'secondary' as const
    },
    {
      id: 'export-config',
      label: '导出配置',
      icon: '📤',
      onClick: () => console.log('Export config'),
      variant: 'secondary' as const,
      disabled: !context.isComplete
    },
    {
      id: 'templates',
      label: '模板库',
      icon: '📚',
      onClick: () => console.log('Templates'),
      variant: 'secondary' as const
    },
    {
      id: 'help',
      label: '帮助',
      icon: '❓',
      onClick: () => console.log('Help'),
      variant: 'secondary' as const
    }
  ];

  return (
    <BaseWidget
      title="对话式自动化助手"
      icon="💬"
      isProcessing={isTyping}
      managementActions={managementActions}
      emptyStateConfig={{
        icon: '🤖',
        title: '智能对话助手',
        description: '通过自然对话来配置和管理你的自动化任务'
      }}
    >
      {/* Chat Area */}
      <div className="flex flex-col h-96">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                  : 'bg-white/10 text-white'
              }`}>
                <div className="text-sm whitespace-pre-line">{message.content}</div>
                
                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action) => (
                      action.type === 'input' ? (
                        <div key={action.id} className="space-y-2">
                          <textarea
                            placeholder="请详细描述你的任务需求..."
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:border-blue-400"
                            rows={3}
                            onChange={(e) => setInputValue(e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={handleSendMessage}
                            className="w-full"
                            variant="primary"
                          >
                            发送描述
                          </Button>
                        </div>
                      ) : (
                        <Button
                          key={action.id}
                          size="sm"
                          onClick={() => handleActionClick(action)}
                          variant="ghost"
                          className="mr-2 mb-2 text-xs bg-white/10 hover:bg-white/20"
                        >
                          {action.label}
                        </Button>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-white/70">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入消息或问题..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              variant="primary"
              size="sm"
              className="px-6 rounded-full"
              icon="📤"
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default MinimalAutomationDemo;