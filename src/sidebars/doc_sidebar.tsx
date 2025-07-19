import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface DocSidebarProps {
  triggeredInput?: string;
}

// 根据操作类型返回期望的输出类型
const getExpectedOutputs = (action: string): string[] => {
  switch (action) {
    case 'extract':
      return ['structured_data', 'key_information', 'tables', 'fields'];
    case 'summarize':
      return ['summary', 'key_points', 'main_topics'];
    case 'translate':
      return ['translated_text', 'source_language', 'target_language'];
    case 'analyze':
      return ['analysis_report', 'insights', 'recommendations', 'metrics'];
    default:
      return ['processed_content'];
  }
};

/**
 * Doc 侧边栏
 * 文档处理和分析工具
 */
export const DocSidebar: React.FC<DocSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [selectedAction, setSelectedAction] = useState('extract');
  const [aiQuery, setAiQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 自动填充查询
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== aiQuery) {
      setAiQuery(triggeredInput);
      
      // 根据输入内容智能选择操作
      const inputLower = triggeredInput.toLowerCase();
      if (inputLower.includes('extract') || inputLower.includes('data')) {
        setSelectedAction('extract');
      } else if (inputLower.includes('summarize') || inputLower.includes('summary')) {
        setSelectedAction('summarize');
      } else if (inputLower.includes('translate') || inputLower.includes('language')) {
        setSelectedAction('translate');
      } else if (inputLower.includes('analyze') || inputLower.includes('analysis')) {
        setSelectedAction('analyze');
      }
    }
  }, [triggeredInput]);

  const actions = [
    { id: 'extract', name: '提取数据', icon: '✂️', description: '从文档中提取关键信息' },
    { id: 'summarize', name: '总结摘要', icon: '📄', description: '生成文档摘要' },
    { id: 'translate', name: '翻译文档', icon: '🌐', description: '翻译成其他语言' },
    { id: 'analyze', name: '分析内容', icon: '🔍', description: '深度分析文档内容' }
  ];

  const handleProcess = async () => {
    if (!aiQuery.trim() || !client || isProcessing) return;

    setIsProcessing(true);
    try {
      const selectedActionData = actions.find(a => a.id === selectedAction);
      const prompt = `文档处理 - ${selectedActionData?.name}: ${aiQuery}. 请处理文档并提供所需的信息和分析结果。`;
      
      await client.sendMessage(prompt, { 
        sender: 'doc-app', 
        requestId: `doc-${Date.now()}`,
        processingAction: selectedAction,
        processingQuery: aiQuery,
        actionName: selectedActionData?.name,
        expectedOutputs: getExpectedOutputs(selectedAction),
        documentType: 'text', // 当前默认为文本，后续可扩展
        language: 'auto-detect'
      });
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 文档上传区域 */}
      <div
        className="border-2 border-dashed border-blue-500/50 bg-blue-500/5 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-all"
        onClick={() => alert('文档上传功能即将开启')}
      >
        <div className="text-4xl mb-2">📄</div>
        <div className="text-sm font-medium text-white/80">拖拽文档到这里</div>
        <div className="text-xs text-white/60 mt-1">支持 PDF, DOCX, TXT, PPT, XLS</div>
      </div>

      {/* 操作选择 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🛠️ 处理操作</h3>
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => setSelectedAction(action.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedAction === action.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{action.icon}</span>
                <div>
                  <div className="font-medium">{action.name}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 查询 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🤖 处理指令</h3>
        <textarea
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="告诉我你想对文档做什么... 提取特定字段、总结内容、翻译等"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* 处理按钮 */}
      <button
        onClick={handleProcess}
        disabled={isProcessing || !aiQuery.trim()}
        className={`w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium transition-all hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center gap-2 ${
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
            <span>📄</span>
            {actions.find(a => a.id === selectedAction)?.name || '处理文档'}
          </>
        )}
      </button>

      {/* 文档模板 */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-2">📋 文档模板</h4>
        <div className="space-y-2">
          {['发票信息提取', '合同条款分析', '简历解析', '报告摘要'].map((template) => (
            <button
              key={template}
              onClick={() => setAiQuery(template)}
              className="w-full p-2 bg-white/10 rounded text-white/80 text-xs hover:bg-blue-500/20 transition-all text-left"
            >
              {template}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};