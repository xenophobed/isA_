import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface DigitalHubSidebarProps {
  triggeredInput?: string;
}

// 根据文件操作类型返回需要的服务
const getFileServices = (action: string): string[] => {
  switch (action) {
    case 'organize':
      return ['file_categorization', 'folder_structure', 'metadata_analysis'];
    case 'search':
      return ['content_search', 'metadata_search', 'similar_files'];
    case 'cleanup':
      return ['duplicate_detection', 'temp_file_cleanup', 'size_optimization'];
    case 'backup':
      return ['backup_strategy', 'version_control', 'cloud_sync'];
    default:
      return ['general_file_management'];
  }
};

/**
 * Digital Hub 侧边栏
 * 文件组织和管理系统
 */
export const DigitalHubSidebar: React.FC<DigitalHubSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [selectedAction, setSelectedAction] = useState('organize');
  const [isProcessing, setIsProcessing] = useState(false);

  const actions = [
    { id: 'organize', name: 'Organize Files', icon: '📂', description: 'Sort and categorize your files' },
    { id: 'search', name: 'Search Files', icon: '🔍', description: 'Find files quickly' },
    { id: 'cleanup', name: 'Clean Up', icon: '🧹', description: 'Remove duplicates and junk' },
    { id: 'backup', name: 'Backup', icon: '💾', description: 'Create secure backups' }
  ];

  // 自动填充操作
  React.useEffect(() => {
    if (triggeredInput) {
      // 根据输入内容智能选择操作
      const input = triggeredInput.toLowerCase();
      if (input.includes('organize') || input.includes('sort')) {
        setSelectedAction('organize');
      } else if (input.includes('search') || input.includes('find')) {
        setSelectedAction('search');
      } else if (input.includes('clean') || input.includes('duplicate')) {
        setSelectedAction('cleanup');
      } else if (input.includes('backup') || input.includes('save')) {
        setSelectedAction('backup');
      }
    }
  }, [triggeredInput]);

  const handleAction = async () => {
    if (!client || isProcessing) return;

    setIsProcessing(true);
    try {
      const selectedActionData = actions.find(a => a.id === selectedAction);
      const prompt = `Please help me with ${selectedActionData?.name}: ${selectedActionData?.description}. ${
        triggeredInput ? `Additional context: ${triggeredInput}` : ''
      }. Provide detailed steps and recommendations for file management.`;
      
      await client.sendMessage(prompt, { 
        sender: 'digitalhub-app', 
        requestId: `digitalhub-${Date.now()}`,
        fileAction: selectedAction,
        actionName: selectedActionData?.name,
        actionDescription: selectedActionData?.description,
        contextInput: triggeredInput || '',
        requestedServices: getFileServices(selectedAction),
        operationType: 'file_management'
      });
    } catch (error) {
      console.error('File operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">📁 文件操作</h3>
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => setSelectedAction(action.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedAction === action.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{action.icon}</span>
                <div>
                  <div className="font-medium">{action.name}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleAction}
        disabled={isProcessing}
        className={`w-full p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium transition-all hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center gap-2 ${
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
            <span>📁</span>
            {actions.find(a => a.id === selectedAction)?.name || '开始操作'}
          </>
        )}
      </button>
    </div>
  );
};