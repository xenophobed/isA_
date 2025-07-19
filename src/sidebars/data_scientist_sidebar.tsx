import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface DataScientistSidebarProps {
  triggeredInput?: string;
}

/**
 * Data Scientist 侧边栏
 * 数据分析和可视化工具
 */
export const DataScientistSidebar: React.FC<DataScientistSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [selectedSource, setSelectedSource] = useState('sales');
  const [aiQuery, setAiQuery] = useState('');
  const [analysisType, setAnalysisType] = useState('trend');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 自动填充查询
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== aiQuery) {
      setAiQuery(triggeredInput);
      
      // 根据输入内容智能选择分析类型
      const inputLower = triggeredInput.toLowerCase();
      if (inputLower.includes('trend') || inputLower.includes('pattern')) {
        setAnalysisType('trend');
      } else if (inputLower.includes('anomaly') || inputLower.includes('outlier')) {
        setAnalysisType('anomaly');
      } else if (inputLower.includes('predict') || inputLower.includes('forecast')) {
        setAnalysisType('predict');
      } else if (inputLower.includes('segment') || inputLower.includes('cluster')) {
        setAnalysisType('segment');
      }
    }
  }, [triggeredInput]);

  const dataSources = [
    { id: 'sales', name: 'Sales Data', icon: '💰' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'customer', name: 'Customer Data', icon: '👥' },
    { id: 'finance', name: 'Finance', icon: '💳' }
  ];

  const analysisTypes = [
    { id: 'trend', name: 'Trend Analysis', icon: '📈' },
    { id: 'anomaly', name: 'Anomaly Detection', icon: '⚠️' },
    { id: 'predict', name: 'Prediction', icon: '🔮' },
    { id: 'segment', name: 'Segmentation', icon: '📊' }
  ];

  const handleAnalyze = async () => {
    if (!aiQuery.trim() || !client || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const selectedSourceData = dataSources.find(s => s.id === selectedSource);
      const selectedAnalysisData = analysisTypes.find(t => t.id === analysisType);
      
      const prompt = `Data analysis for ${selectedSourceData?.name} using ${selectedAnalysisData?.name}: ${aiQuery}. Please provide detailed insights, visualizations, and actionable recommendations.`;
      
      await client.sendMessage(prompt, { 
        sender: 'data-scientist-app', 
        requestId: `datascientist-${Date.now()}`,
        dataSource: selectedSource,
        analysisType: analysisType,
        analysisQuery: aiQuery,
        requestedOutputs: ['insights', 'visualizations', 'recommendations', 'data_summary'],
        dataSourceName: selectedSourceData?.name,
        analysisTypeName: selectedAnalysisData?.name
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 数据源选择 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">📊 数据源</h3>
        <div className="space-y-2">
          {dataSources.map((source) => (
            <div
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedSource === source.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{source.icon}</span>
                <span className="text-sm font-medium">{source.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分析类型 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🔍 分析类型</h3>
        <div className="grid grid-cols-2 gap-2">
          {analysisTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setAnalysisType(type.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                analysisType === type.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{type.icon}</span>
                <span className="text-xs font-medium">{type.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 查询输入 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🤖 分析需求</h3>
        <textarea
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="描述你想要从数据中获得什么洞察... 例如：'显示收入趋势' 或 '找出客户行为模式'"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 resize-none"
          rows={4}
        />
      </div>

      {/* 分析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !aiQuery.trim()}
        className={`w-full p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium transition-all hover:from-cyan-600 hover:to-purple-600 flex items-center justify-center gap-2 ${
          isAnalyzing ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            分析中...
          </>
        ) : (
          <>
            <span>🧠</span>
            开始分析
          </>
        )}
      </button>

      {/* 快速洞察 */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-2">⚡ 快速洞察</h4>
        <div className="space-y-2">
          {['收入趋势分析', '客户细分', '异常检测', '下月预测'].map((insight) => (
            <button
              key={insight}
              onClick={() => setAiQuery(insight)}
              className="w-full p-2 bg-white/10 rounded text-white/80 text-xs hover:bg-cyan-500/20 transition-all text-left"
            >
              {insight}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};