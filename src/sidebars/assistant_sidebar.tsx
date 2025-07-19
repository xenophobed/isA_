import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface AssistantSidebarProps {
  triggeredInput?: string;
}

// 根据助手模式返回上下文类型
const getContextType = (mode: string): string => {
  switch (mode) {
    case 'chat': return 'conversational';
    case 'help': return 'support';
    case 'analysis': return 'analytical';
    case 'writing': return 'creative';
    default: return 'general';
  }
};

// 根据助手模式返回期望的响应类型
const getResponseType = (mode: string): string => {
  switch (mode) {
    case 'chat': return 'conversational_response';
    case 'help': return 'step_by_step_guidance';
    case 'analysis': return 'detailed_analysis';
    case 'writing': return 'creative_content';
    default: return 'general_response';
  }
};

/**
 * AI Assistant 侧边栏
 * 通用AI助手界面
 */
export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [selectedMode, setSelectedMode] = useState('chat');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const modes = [
    { id: 'chat', name: 'Chat Mode', icon: '💬', description: 'Natural conversation' },
    { id: 'help', name: 'Help Mode', icon: '🆘', description: 'Get assistance' },
    { id: 'analysis', name: 'Analysis', icon: '📊', description: 'Data analysis' },
    { id: 'writing', name: 'Writing', icon: '✍️', description: 'Content creation' }
  ];

  // 自动填充输入和模式选择
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== input) {
      setInput(triggeredInput);
      
      // 根据输入内容智能选择模式
      const inputLower = triggeredInput.toLowerCase();
      if (inputLower.includes('help') || inputLower.includes('support')) {
        setSelectedMode('help');
      } else if (inputLower.includes('analyze') || inputLower.includes('data')) {
        setSelectedMode('analysis');
      } else if (inputLower.includes('write') || inputLower.includes('create')) {
        setSelectedMode('writing');
      } else {
        setSelectedMode('chat');
      }
    }
  }, [triggeredInput]);

  const handleSubmit = async () => {
    if (!client || isProcessing || !input.trim()) return;

    setIsProcessing(true);
    try {
      const selectedModeData = modes.find(m => m.id === selectedMode);
      const prompt = `In ${selectedModeData?.name} (${selectedModeData?.description}): ${input}`;
      
      await client.sendMessage(prompt, { 
        sender: 'assistant-app', 
        requestId: `assistant-${Date.now()}`,
        assistantMode: selectedMode,
        modeName: selectedModeData?.name,
        modeDescription: selectedModeData?.description,
        userQuery: input,
        contextType: getContextType(selectedMode),
        expectedResponseType: getResponseType(selectedMode)
      });
    } catch (error) {
      console.error('Assistant request failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🤖 助手模式</h3>
        <div className="space-y-2">
          {modes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedMode === mode.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{mode.icon}</span>
                <div>
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-xs opacity-80">{mode.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 输入区域 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">💭 输入消息</h3>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你想要助手帮助的内容..."
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none"
          rows={3}
        />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={isProcessing || !input.trim()}
        className={`w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium transition-all hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 ${
          isProcessing ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            处理中...
          </>
        ) : (
          <>
            <span>🤖</span>
            {modes.find(m => m.id === selectedMode)?.name || '开始对话'}
          </>
        )}
      </button>
    </div>
  );
};