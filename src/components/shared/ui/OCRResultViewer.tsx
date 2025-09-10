/**
 * ============================================================================
 * OCR Result Viewer Component - OCR结果展示组件
 * ============================================================================
 * 
 * 用于展示OCR识别结果的专业组件
 * 支持文本内容展示、置信度可视化、文本编辑功能
 * 
 * Features:
 * - 文本内容展示和编辑
 * - 置信度可视化
 * - 文本区域标注
 * - 支持多语言结果
 * - 导出功能
 */

import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

export interface OCRTextBlock {
  id: string;
  text: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: string;
  type?: 'title' | 'paragraph' | 'table' | 'list' | 'other';
}

export interface OCRResult {
  id: string;
  filename: string;
  totalText: string;
  averageConfidence: number;
  textBlocks: OCRTextBlock[];
  processingTime: number;
  language: string;
  imagePreview?: string;
  metadata?: {
    imageSize?: { width: number; height: number };
    fileSize?: number;
    processedAt?: string;
  };
}

export interface OCRResultViewerProps {
  result: OCRResult;
  editable?: boolean;
  showConfidence?: boolean;
  showPositions?: boolean;
  className?: string;
  onTextEdit?: (blockId: string, newText: string) => void;
  onExport?: (format: 'txt' | 'json' | 'csv') => void;
  onReprocess?: () => void;
}

export const OCRResultViewer: React.FC<OCRResultViewerProps> = ({
  result,
  editable = false,
  showConfidence = true,
  showPositions = false,
  className = '',
  onTextEdit,
  onExport,
  onReprocess
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'blocks' | 'raw'>('text');
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-400 bg-green-500/20';
    if (confidence >= 0.7) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.9) return '高';
    if (confidence >= 0.7) return '中';
    return '低';
  };

  const handleTextEdit = useCallback((blockId: string, newText: string) => {
    if (onTextEdit) {
      onTextEdit(blockId, newText);
    }
    setEditingBlock(null);
  }, [onTextEdit]);

  const handleExport = useCallback((format: 'txt' | 'json' | 'csv') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📝</span>
            OCR识别结果
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>文件: {result.filename}</span>
            <span>语言: {result.language}</span>
            <span>耗时: {result.processingTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          {showConfidence && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.averageConfidence)}`}>
              置信度: {(result.averageConfidence * 100).toFixed(1)}% ({getConfidenceText(result.averageConfidence)})
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon="📤"
              onClick={() => handleExport('txt')}
            >
              导出
            </Button>
            {onReprocess && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔄"
                onClick={onReprocess}
              >
                重新识别
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'text', label: '识别文本', icon: '📄' },
          { key: 'blocks', label: '文本块', icon: '🧩' },
          { key: 'raw', label: '原始数据', icon: '🔧' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'text' && (
          <GlassCard className="p-4">
            <div className="space-y-4">
              <div className="text-sm text-white/60 mb-3">
                完整识别文本 ({result.totalText.length} 字符)
              </div>
              <div className="bg-white/5 rounded-lg p-4 min-h-[300px]">
                <pre className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed font-mono">
                  {result.totalText}
                </pre>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === 'blocks' && (
          <div className="space-y-3">
            {result.textBlocks.map((block, index) => (
              <GlassCard key={block.id} className="p-4">
                <div className="space-y-3">
                  {/* Block Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">块 {index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        {block.type || 'text'}
                      </span>
                      {showConfidence && (
                        <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(block.confidence)}`}>
                          {(block.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                      {block.language && (
                        <span className="text-xs text-white/50">
                          {block.language}
                        </span>
                      )}
                    </div>
                    
                    {editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="✏️"
                        onClick={() => setEditingBlock(block.id)}
                      >
                        编辑
                      </Button>
                    )}
                  </div>

                  {/* Position Info */}
                  {showPositions && block.position && (
                    <div className="text-xs text-white/40">
                      位置: ({block.position.x}, {block.position.y}) 
                      尺寸: {block.position.width} × {block.position.height}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="bg-white/5 rounded-lg p-3">
                    {editingBlock === block.id ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 resize-vertical min-h-[100px]"
                          value={block.text}
                          onChange={(e) => {
                            // Update local state if needed
                          }}
                          placeholder="编辑识别文本..."
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleTextEdit(block.id, block.text)}
                          >
                            保存
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingBlock(null)}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                        {block.text}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'raw' && (
          <GlassCard className="p-4">
            <div className="space-y-4">
              <div className="text-sm text-white/60 mb-3">
                原始JSON数据
              </div>
              <div className="bg-white/5 rounded-lg p-4 min-h-[300px] overflow-auto">
                <pre className="text-xs text-white/70 font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Export Options */}
      {activeTab === 'text' && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
          <span className="text-sm text-white/60">导出格式:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('txt')}
          >
            TXT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('json')}
          >
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            CSV
          </Button>
        </div>
      )}
    </div>
  );
};

export default OCRResultViewer;