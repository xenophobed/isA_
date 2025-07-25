/**
 * ============================================================================
 * Knowledge Widget UI (KnowledgeWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Knowledge management interface using standardized BaseWidget layout
 * - Three tabs: Add documents, Ask questions, Browse knowledge
 * - Document upload and intelligent Q&A functionality
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in knowledge interaction history management
 * - Consistent edit and management actions for documents
 * - Streaming status display for processing
 * - Knowledge-specific actions (export, summarize, share)
 */
import React, { useState } from 'react';
import { KnowledgeWidgetParams } from '../../../types/widgetTypes';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

// User-friendly workflow state (copied from knowledge_sidebar.tsx)
interface KnowledgeState {
  activeTab: 'add' | 'ask' | 'browse';
  selectedFiles: File[];
  query: string;
  documentCount: number;
  recentDocuments: DocumentItem[];
}

interface DocumentItem {
  id: string;
  title: string;
  preview: string;
  type: string;
  uploadedAt: string;
  size: string;
}

interface KnowledgeWidgetProps {
  isProcessing: boolean;
  result: any;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onProcess: (params: any) => Promise<void>;
  onClearResults: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
}

/**
 * Knowledge Widget Input Area - Content that goes inside BaseWidget
 */
const KnowledgeInputArea: React.FC<KnowledgeWidgetProps> = ({
  isProcessing,
  result,
  triggeredInput,
  onProcess,
  onClearResults
}) => {
  // Simple, user-focused state (exact copy from knowledge_sidebar.tsx)
  const [knowledge, setKnowledge] = useState<KnowledgeState>({
    activeTab: 'add',
    selectedFiles: [],
    query: '',
    documentCount: 0,
    recentDocuments: []
  });

  // Auto-fill query when triggered (exact copy from knowledge_sidebar.tsx)
  React.useEffect(() => {
    if (triggeredInput) {
      setKnowledge(prev => ({ 
        ...prev, 
        query: triggeredInput,
        activeTab: triggeredInput.toLowerCase().includes('upload') || triggeredInput.toLowerCase().includes('add') ? 'add' : 'ask'
      }));
    }
  }, [triggeredInput]);

  // Update state helper
  const updateKnowledge = (updates: Partial<KnowledgeState>) => {
    setKnowledge(prev => ({ ...prev, ...updates }));
  };

  // Handle file selection
  const handleFileSelection = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      updateKnowledge({ selectedFiles: fileArray });
    }
  };

  // Add documents to knowledge base (adapted from knowledge_sidebar.tsx)
  const handleAddDocuments = async () => {
    if (knowledge.selectedFiles.length === 0 || !onProcess || isProcessing) return;

    try {
      const params: KnowledgeWidgetParams = {
        task: 'add_documents',
        files: knowledge.selectedFiles
      };
      
      await onProcess(params);
      
      // Clear selected files after processing
      updateKnowledge({ selectedFiles: [], activeTab: 'ask' });
    } catch (error) {
      console.error('Failed to add documents:', error);
    }
  };

  // Ask questions about documents (adapted from knowledge_sidebar.tsx)
  const handleAskQuestion = async () => {
    if (!knowledge.query.trim() || !onProcess || isProcessing) return;

    try {
      const params: KnowledgeWidgetParams = {
        task: 'ask_question',
        query: knowledge.query
      };
      
      await onProcess(params);
    } catch (error) {
      console.error('Failed to get answer:', error);
    }
  };

  // Browse and manage documents (adapted from knowledge_sidebar.tsx)
  const handleBrowseDocuments = async () => {
    if (!onProcess || isProcessing) return;

    try {
      const params: KnowledgeWidgetParams = {
        task: 'browse_documents'
      };
      
      await onProcess(params);
    } catch (error) {
      console.error('Failed to browse documents:', error);
    }
  };

  // Tab configuration (exact copy from knowledge_sidebar.tsx)
  const tabs = [
    { 
      id: 'add', 
      name: 'Add Documents', 
      icon: '📄', 
      description: 'Upload your files to get started'
    },
    { 
      id: 'ask', 
      name: 'Ask Questions', 
      icon: '💬', 
      description: 'Get answers from your documents'
    },
    { 
      id: 'browse', 
      name: 'Browse & Manage', 
      icon: '📚', 
      description: 'See what you\'ve added'
    }
  ];

  // Quick question suggestions (exact copy from knowledge_sidebar.tsx)
  const quickQuestions = [
    "What are the main points in my documents?",
    "Find all mentions of [topic]",
    "Summarize the key findings",
    "What are the important dates?",
    "Compare different documents",
    "Extract all action items"
  ];

  // Supported file types with user-friendly descriptions (exact copy from knowledge_sidebar.tsx)
  const supportedTypes = [
    { ext: 'pdf', name: 'PDF Documents', icon: '📄', desc: 'Reports, papers, manuals' },
    { ext: 'docx', name: 'Word Documents', icon: '📝', desc: 'Letters, proposals, notes' },
    { ext: 'txt', name: 'Text Files', icon: '📃', desc: 'Plain text, logs, code' },
    { ext: 'md', name: 'Markdown Files', icon: '📋', desc: 'Documentation, notes' }
  ];

  return (
    <div className="space-y-3 h-full flex flex-col p-3">
      {/* Compact Header */}
      <div className="flex items-center gap-3 p-2 bg-purple-500/10 rounded border border-purple-500/20">
        <span className="text-lg">🧠</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">Knowledge Hub</div>
          <div className="text-xs text-white/60">
            {knowledge.documentCount > 0 
              ? `${knowledge.documentCount} docs ready`
              : 'Add docs for instant answers'
            }
          </div>
        </div>
      </div>

      {/* Compact Tab Navigation */}
      <div className="flex bg-white/5 rounded p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateKnowledge({ activeTab: tab.id as any })}
            className={`flex-1 p-2 rounded text-xs transition-all ${
              knowledge.activeTab === tab.id
                ? 'bg-white text-black font-medium'
                : 'text-white/80 hover:bg-white/10'
            }`}
            title={tab.description}
          >
            <div className="text-sm mb-1">{tab.icon}</div>
            <div className="font-medium truncate">{tab.name}</div>
          </button>
        ))}
      </div>

      {/* Compact Add Documents Tab */}
      {knowledge.activeTab === 'add' && (
        <div className="space-y-3 flex-1">
          <div>
            {/* Compact File Drop Zone */}
            <label className="block w-full p-3 border-2 border-dashed border-blue-500/50 bg-blue-500/5 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-all">
              <div className="text-center">
                <div className="text-lg mb-2">
                  {knowledge.selectedFiles.length > 0 ? '✅' : '📁'}
                </div>
                <div className="text-xs font-medium text-white/80 mb-1">
                  {knowledge.selectedFiles.length > 0 
                    ? `${knowledge.selectedFiles.length} file${knowledge.selectedFiles.length > 1 ? 's' : ''} selected`
                    : 'Drop files or click to browse'
                  }
                </div>
                <div className="text-xs text-white/60">
                  PDF, Word, Text files
                </div>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={(e) => handleFileSelection(e.target.files)}
                className="hidden"
              />
            </label>

            {/* Compact Selected Files Preview */}
            {knowledge.selectedFiles.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                <div className="text-xs text-white/60">Selected:</div>
                {knowledge.selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-1 bg-white/5 rounded">
                    <span className="text-xs">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{file.name}</div>
                      <div className="text-xs text-white/60">{(file.size / 1024).toFixed(1)}KB</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compact Add Button */}
            {knowledge.selectedFiles.length > 0 && (
              <button
                onClick={handleAddDocuments}
                disabled={isProcessing}
                className={`w-full mt-2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded text-white font-medium transition-all text-sm ${
                  isProcessing ? 'animate-pulse' : 'hover:from-blue-600 hover:to-purple-600'
                } disabled:opacity-50`}
              >
                {isProcessing ? 'Processing...' : `Add ${knowledge.selectedFiles.length} file${knowledge.selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {/* Compact Supported Files */}
          <div className="grid grid-cols-2 gap-1">
            {supportedTypes.map((type) => (
              <div key={type.ext} className="p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm">{type.icon}</span>
                  <span className="text-xs font-medium text-white truncate">{type.name}</span>
                </div>
                <div className="text-xs text-white/60">{type.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Ask Questions Tab */}
      {knowledge.activeTab === 'ask' && (
        <div className="space-y-3 flex-1">
          <div>
            <textarea
              value={knowledge.query}
              onChange={(e) => updateKnowledge({ query: e.target.value })}
              placeholder="What would you like to know? e.g., 'What are the main conclusions?'"
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-sm"
              rows={2}
            />

            <button
              onClick={handleAskQuestion}
              disabled={!knowledge.query.trim() || isProcessing}
              className={`w-full mt-2 p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded text-white font-medium transition-all text-sm ${
                isProcessing ? 'animate-pulse' : 'hover:from-green-600 hover:to-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? 'Finding Answer...' : 'Get Answer'}
            </button>
          </div>

          {/* Compact Quick Questions */}
          <div>
            <div className="text-xs text-white/60 mb-1">💬 Try asking:</div>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => updateKnowledge({ query: question })}
                  className="p-1 bg-white/5 rounded text-xs text-white/80 hover:bg-blue-500/20 transition-all text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Help */}
          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
            <div className="text-green-300 text-xs font-medium mb-1">💡 Features</div>
            <div className="text-green-200/80 text-xs space-y-1">
              <div>• Plain English questions</div>
              <div>• Answers with sources</div>
              <div>• Cross-document analysis</div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Browse & Manage Tab */}
      {knowledge.activeTab === 'browse' && (
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">📚 Library</div>
            <button
              onClick={handleBrowseDocuments}
              disabled={isProcessing}
              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs transition-all disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {/* Compact Document Library */}
          {knowledge.documentCount === 0 ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-white/60 text-xs mb-2">No documents yet</div>
              <button
                onClick={() => updateKnowledge({ activeTab: 'add' })}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs transition-all"
              >
                Add Documents
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {knowledge.recentDocuments.map((doc) => (
                <div key={doc.id} className="p-2 bg-white/5 rounded border border-white/10">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{doc.title}</div>
                      <div className="text-xs text-white/60 mt-1 line-clamp-1">{doc.preview}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40">{doc.uploadedAt}</span>
                        <span className="text-xs text-white/40">{doc.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact Quick Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all">
              <div className="text-xs font-medium text-white">🔍 Search</div>
              <div className="text-xs text-white/60 mt-1">Find across docs</div>
            </button>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all">
              <div className="text-xs font-medium text-white">📊 Summary</div>
              <div className="text-xs text-white/60 mt-1">Overview</div>
            </button>
          </div>
        </div>
      )}

      {/* Compact Processing Status */}
      {isProcessing && (
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-xs text-blue-300">
              {knowledge.activeTab === 'add' && 'Processing documents...'}
              {knowledge.activeTab === 'ask' && 'Finding answer...'}
              {knowledge.activeTab === 'browse' && 'Loading library...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Knowledge Widget with BaseWidget - New standardized layout
 */
export const KnowledgeWidget: React.FC<KnowledgeWidgetProps> = ({
  isProcessing,
  result,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onProcess,
  onClearResults,
  onSelectOutput,
  onClearHistory
}) => {
  
  // Custom edit actions for knowledge results
  const editActions: EditAction[] = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: '📄',
      onClick: (content) => {
        // Generate summary of the knowledge content
        console.log('Generating summary for:', content);
      }
    },
    {
      id: 'export_pdf',
      label: 'Export PDF',
      icon: '📑',
      onClick: (content) => {
        // Export knowledge content as PDF
        if (typeof content === 'object' && content !== null) {
          const pdfContent = JSON.stringify(content, null, 2);
          const blob = new Blob([pdfContent], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `knowledge_export_${Date.now()}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    },
    {
      id: 'cite',
      label: 'Cite',
      icon: '📚',
      onClick: (content) => {
        // Generate citation for the knowledge content
        const citation = `Knowledge extracted on ${new Date().toLocaleDateString()}`;
        navigator.clipboard.writeText(citation);
      }
    }
  ];

  // Custom management actions for knowledge
  const managementActions: ManagementAction[] = [
    {
      id: 'add_docs',
      label: 'Add',
      icon: '📤',
      onClick: () => onProcess({ 
        action: 'add_documents',
        query: 'Add new documents'
      }),
      disabled: isProcessing
    },
    {
      id: 'ask_question',
      label: 'Ask',
      icon: '❓',
      onClick: () => onProcess({ 
        action: 'ask_question',
        query: 'What is the main topic?'
      }),
      disabled: isProcessing
    },
    {
      id: 'browse_docs',
      label: 'Browse',
      icon: '📚',
      onClick: () => onProcess({ 
        action: 'browse_documents',
        query: 'Browse document library'
      }),
      disabled: isProcessing
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearResults();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isProcessing
    }
  ];

  return (
    <BaseWidget
      title="Knowledge Base"
      icon="📚"
      isProcessing={isProcessing}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
    >
      <KnowledgeInputArea
        isProcessing={isProcessing}
        result={result}
        triggeredInput={triggeredInput}
        onProcess={onProcess}
        onClearResults={onClearResults}
      />
    </BaseWidget>
  );
};