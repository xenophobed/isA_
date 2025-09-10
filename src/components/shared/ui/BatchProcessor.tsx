/**
 * ============================================================================
 * Batch Processor Component - 批量处理组件
 * ============================================================================
 * 
 * 用于批量文件上传和处理的专业组件
 * 支持文件分组管理、批量操作、结果统计等功能
 * 
 * Features:
 * - 批量文件上传和管理
 * - 分组处理和组织
 * - 并行处理控制
 * - 处理结果统计
 * - 错误处理和重试
 * - 结果导出功能
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { FileUploader, FileUploadResult } from './FileUploader';

export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0-100
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  startTime?: string;
  endTime?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface BatchGroup {
  id: string;
  name: string;
  description?: string;
  items: BatchItem[];
  status: 'pending' | 'processing' | 'completed' | 'error' | 'mixed';
  totalItems: number;
  completedItems: number;
  errorItems: number;
  progress: number;
  createdAt: string;
  estimatedTimeRemaining?: number;
}

export interface BatchProcessorProps {
  groups: BatchGroup[];
  maxConcurrency?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  autoProcess?: boolean;
  className?: string;
  
  // Processing callbacks
  onFileProcess?: (file: File, groupId: string) => Promise<any>;
  onBatchStart?: (groupId: string) => void;
  onBatchComplete?: (groupId: string, results: BatchItem[]) => void;
  onItemComplete?: (itemId: string, result: any) => void;
  onItemError?: (itemId: string, error: any) => void;
  
  // Management callbacks
  onGroupCreate?: (files: File[], name: string) => string;
  onGroupDelete?: (groupId: string) => void;
  onItemRemove?: (itemId: string, groupId: string) => void;
  onRetry?: (itemId: string) => void;
  onRetryAll?: (groupId: string) => void;
  onCancel?: (groupId?: string, itemId?: string) => void;
  onExport?: (groupId: string, format: 'csv' | 'json' | 'xlsx') => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  groups,
  maxConcurrency = 3,
  acceptedFileTypes = '.jpg,.jpeg,.png,.pdf,.csv,.txt',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  autoProcess = false,
  className = '',
  onFileProcess,
  onBatchStart,
  onBatchComplete,
  onItemComplete,
  onItemError,
  onGroupCreate,
  onGroupDelete,
  onItemRemove,
  onRetry,
  onRetryAll,
  onCancel,
  onExport
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalItems = groups.reduce((sum, group) => sum + group.totalItems, 0);
    const completedItems = groups.reduce((sum, group) => sum + group.completedItems, 0);
    const errorItems = groups.reduce((sum, group) => sum + group.errorItems, 0);
    const processingItems = groups.reduce((sum, group) => 
      sum + group.items.filter(item => item.status === 'processing').length, 0
    );
    
    return {
      totalItems,
      completedItems,
      errorItems,
      processingItems,
      successRate: totalItems > 0 ? (completedItems / totalItems * 100) : 0
    };
  }, [groups]);

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'cancelled': return '🚫';
      case 'mixed': return '📊';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-gray-400 bg-gray-500/20';
      case 'processing': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'cancelled': return 'text-orange-400 bg-orange-500/20';
      case 'mixed': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const handleFilesSelected = useCallback((files: FileUploadResult[]) => {
    if (!onGroupCreate) return;
    
    const validFiles = files
      .filter(f => f.status === 'completed')
      .map(f => f.file);
    
    if (validFiles.length > 0) {
      const groupName = newGroupName || `批次 ${new Date().toLocaleTimeString()}`;
      onGroupCreate(validFiles, groupName);
      setNewGroupName('');
      setShowUploader(false);
    }
  }, [onGroupCreate, newGroupName]);

  const handleBatchStart = useCallback((groupId: string) => {
    if (onBatchStart) {
      onBatchStart(groupId);
    }
  }, [onBatchStart]);

  const handleRetryAll = useCallback((groupId: string) => {
    if (onRetryAll) {
      onRetryAll(groupId);
    }
  }, [onRetryAll]);

  const handleExport = useCallback((groupId: string, format: 'csv' | 'json' | 'xlsx') => {
    if (onExport) {
      onExport(groupId, format);
    }
  }, [onExport]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📦</span>
            批量处理中心
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>总计: {overallStats.totalItems} 项</span>
            <span>已完成: {overallStats.completedItems}</span>
            <span>错误: {overallStats.errorItems}</span>
            <span>成功率: {overallStats.successRate.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon="➕"
            onClick={() => setShowUploader(true)}
          >
            创建批次
          </Button>
        </div>
      </div>

      {/* File Uploader Modal */}
      {showUploader && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">创建新批次</h4>
              <Button
                variant="ghost"
                size="sm"
                icon="✕"
                onClick={() => setShowUploader(false)}
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  批次名称 (可选)
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
                  placeholder="输入批次名称..."
                />
              </div>
              
              <FileUploader
                multiple={true}
                accept={acceptedFileTypes}
                maxSize={maxFileSize}
                title="选择文件"
                description={`支持格式: ${acceptedFileTypes}, 最大 ${formatFileSize(maxFileSize)}`}
                onFilesChange={handleFilesSelected}
                autoProcess={false}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Groups List */}
      <div className="space-y-3">
        {groups.map((group) => (
          <GlassCard key={group.id} className="p-4">
            <div className="space-y-4">
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-white">{group.name}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                      {getStatusIcon(group.status)} {group.status.toUpperCase()}
                    </div>
                  </div>
                  {group.description && (
                    <div className="text-sm text-white/60">{group.description}</div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>创建: {new Date(group.createdAt).toLocaleString()}</span>
                    <span>{group.totalItems} 个文件</span>
                    {group.estimatedTimeRemaining && (
                      <span>剩余: {formatDuration(group.estimatedTimeRemaining)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Progress */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {group.completedItems}/{group.totalItems}
                    </div>
                    <div className="text-xs text-white/60">
                      {group.progress.toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    {group.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon="▶️"
                        onClick={() => handleBatchStart(group.id)}
                      >
                        开始
                      </Button>
                    )}
                    {group.status === 'processing' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="⏹️"
                        onClick={() => onCancel(group.id)}
                      >
                        暂停
                      </Button>
                    )}
                    {group.errorItems > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="🔄"
                        onClick={() => handleRetryAll(group.id)}
                      >
                        重试失败项
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="📤"
                      onClick={() => handleExport(group.id, 'csv')}
                    >
                      导出
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={selectedGroup === group.id ? "🔼" : "🔽"}
                      onClick={() => setSelectedGroup(
                        selectedGroup === group.id ? null : group.id
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      group.status === 'error' ? 'bg-red-500' :
                      group.status === 'completed' ? 'bg-green-500' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${group.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>已处理: {group.completedItems}</span>
                  <span>错误: {group.errorItems}</span>
                </div>
              </div>

              {/* Items Detail */}
              {selectedGroup === group.id && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h5 className="text-sm font-medium text-white/80">批次详情</h5>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'completed' ? 'bg-green-400' :
                            item.status === 'processing' ? 'bg-blue-400' :
                            item.status === 'error' ? 'bg-red-400' :
                            'bg-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {item.file.name}
                            </div>
                            <div className="text-xs text-white/50">
                              {formatFileSize(item.file.size)}
                              {item.duration && ` • ${formatDuration(item.duration)}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.status === 'processing' && (
                            <div className="text-xs text-blue-400">
                              {item.progress.toFixed(0)}%
                            </div>
                          )}
                          <div className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                          </div>
                          
                          {item.status === 'error' && onRetry && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="🔄"
                              onClick={() => onRetry(item.id)}
                            />
                          )}
                          {onItemRemove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="🗑️"
                              onClick={() => onItemRemove(item.id, group.id)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Group Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(group.id, 'json')}
                    >
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(group.id, 'xlsx')}
                    >
                      Excel
                    </Button>
                    {onGroupDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="🗑️"
                        onClick={() => onGroupDelete(group.id)}
                      >
                        删除批次
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <GlassCard className="p-8 text-center">
          <div className="space-y-3">
            <div className="text-4xl">📦</div>
            <div className="text-lg font-medium text-white">暂无批处理任务</div>
            <div className="text-sm text-white/60">
              点击"创建批次"开始批量处理文件
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploader(true)}
            >
              创建第一个批次
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default BatchProcessor;