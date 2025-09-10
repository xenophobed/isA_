/**
 * ============================================================================
 * Results Panel Component - 结果展示面板
 * ============================================================================
 * 
 * 用于展示自动化执行结果的综合面板
 * 集成OCR结果、图像分析、数据统计等专业展示组件
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../../../shared/ui/Button';
import { GlassCard } from '../../../shared/ui/GlassCard';
import { DataTable } from '../../../shared/ui/DataTable';
import OCRResultViewer from '../../../shared/ui/OCRResultViewer';
import ImageAnalysisViewer from '../../../shared/ui/ImageAnalysisViewer';
import { AutomationTemplate } from './types';

export interface ExecutionResult {
  id: string;
  templateId: string;
  status: 'completed' | 'error' | 'partial';
  startTime: string;
  endTime: string;
  duration: number;
  totalSteps: number;
  completedSteps: number;
  errorSteps: number;
  outputs: ResultOutput[];
  summary: {
    successRate: number;
    totalProcessed: number;
    totalErrors: number;
    averageProcessingTime: number;
  };
  metadata?: Record<string, any>;
}

export interface ResultOutput {
  id: string;
  stepId: string;
  stepName: string;
  type: 'ocr' | 'image_analysis' | 'data' | 'file' | 'text' | 'json';
  data: any;
  filename?: string;
  size?: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface ResultsPanelProps {
  template: AutomationTemplate;
  result: ExecutionResult;
  className?: string;
  onExport?: (format: 'pdf' | 'excel' | 'json' | 'csv') => void;
  onSaveResult?: (outputId: string) => void;
  onDeleteResult?: (outputId: string) => void;
  onRetryFromResult?: () => void;
  onCreateNewFromResult?: () => void;
  onBack?: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  template,
  result,
  className = '',
  onExport,
  onSaveResult,
  onDeleteResult,
  onRetryFromResult,
  onCreateNewFromResult,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'outputs' | 'details'>('overview');
  const [selectedOutput, setSelectedOutput] = useState<ResultOutput | null>(null);
  const [outputFilter, setOutputFilter] = useState<'all' | 'ocr' | 'image_analysis' | 'data'>('all');

  // Filter outputs by type
  const filteredOutputs = useMemo(() => {
    if (outputFilter === 'all') return result.outputs;
    return result.outputs.filter(output => output.type === outputFilter);
  }, [result.outputs, outputFilter]);

  // Group outputs by step
  const outputsByStep = useMemo(() => {
    const groups: Record<string, ResultOutput[]> = {};
    result.outputs.forEach(output => {
      if (!groups[output.stepId]) {
        groups[output.stepId] = [];
      }
      groups[output.stepId].push(output);
    });
    return groups;
  }, [result.outputs]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'partial': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getOutputTypeIcon = (type: string): string => {
    switch (type) {
      case 'ocr': return '📝';
      case 'image_analysis': return '🔍';
      case 'data': return '📊';
      case 'file': return '📄';
      case 'text': return '📃';
      case 'json': return '🔧';
      default: return '📋';
    }
  };

  const getOutputTypeName = (type: string): string => {
    switch (type) {
      case 'ocr': return 'OCR识别';
      case 'image_analysis': return '图像分析';
      case 'data': return '数据结果';
      case 'file': return '文件输出';
      case 'text': return '文本内容';
      case 'json': return 'JSON数据';
      default: return '未知类型';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = (format: 'pdf' | 'excel' | 'json' | 'csv') => {
    if (onExport) {
      onExport(format);
    }
  };

  // Prepare data table for outputs
  const outputsTableData = filteredOutputs.map(output => ({
    id: output.id,
    stepName: output.stepName,
    type: getOutputTypeName(output.type),
    filename: output.filename || '-',
    size: output.size ? formatFileSize(output.size) : '-',
    createdAt: new Date(output.createdAt).toLocaleString(),
    actions: (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon="👁️"
          onClick={() => setSelectedOutput(output)}
        />
        {onSaveResult && (
          <Button
            variant="ghost"
            size="sm"
            icon="💾"
            onClick={() => onSaveResult(output.id)}
          />
        )}
        {onDeleteResult && (
          <Button
            variant="ghost"
            size="sm"
            icon="🗑️"
            onClick={() => onDeleteResult(output.id)}
          />
        )}
      </div>
    )
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{template.icon}</span>
            {template.name} - 执行结果
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>执行时间: {new Date(result.startTime).toLocaleString()}</span>
            <span>耗时: {formatDuration(result.duration)}</span>
            <span>输出: {result.outputs.length} 项</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
            {result.status.toUpperCase()}
          </div>
          
          {/* Actions */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon="📤"
              onClick={() => handleExport('pdf')}
            >
              导出报告
            </Button>
            {onRetryFromResult && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔄"
                onClick={onRetryFromResult}
              >
                重新执行
              </Button>
            )}
            {onCreateNewFromResult && (
              <Button
                variant="ghost"
                size="sm"
                icon="➕"
                onClick={onCreateNewFromResult}
              >
                基于此配置新建
              </Button>
            )}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                icon="←"
                onClick={onBack}
              >
                返回
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'overview', label: '执行概览', icon: '📊' },
          { key: 'outputs', label: '输出结果', icon: '📋' },
          { key: 'details', label: '详细信息', icon: '🔍' }
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Execution Summary */}
          <div className="space-y-4">
            <GlassCard className="p-6">
              <h4 className="font-medium text-white mb-4">执行统计</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {result.summary.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/60">成功率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {result.summary.totalProcessed}
                  </div>
                  <div className="text-sm text-white/60">处理总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {result.summary.totalErrors}
                  </div>
                  <div className="text-sm text-white/60">错误数量</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatDuration(result.summary.averageProcessingTime)}
                  </div>
                  <div className="text-sm text-white/60">平均耗时</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h4 className="font-medium text-white mb-4">步骤完成情况</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">完成步骤</span>
                  <span className="text-white font-medium">
                    {result.completedSteps}/{result.totalSteps}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${(result.completedSteps / result.totalSteps) * 100}%` }}
                  />
                </div>
                {result.errorSteps > 0 && (
                  <div className="text-sm text-red-400">
                    {result.errorSteps} 个步骤执行失败
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Output Summary */}
          <div className="space-y-4">
            <GlassCard className="p-6">
              <h4 className="font-medium text-white mb-4">输出类型统计</h4>
              <div className="space-y-3">
                {Object.entries(
                  result.outputs.reduce((acc, output) => {
                    acc[output.type] = (acc[output.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getOutputTypeIcon(type)}</span>
                      <span className="text-white/70">{getOutputTypeName(type)}</span>
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h4 className="font-medium text-white mb-4">快速操作</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon="📄"
                  onClick={() => handleExport('pdf')}
                >
                  PDF报告
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="📊"
                  onClick={() => handleExport('excel')}
                >
                  Excel数据
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="📋"
                  onClick={() => handleExport('csv')}
                >
                  CSV导出
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="🔧"
                  onClick={() => handleExport('json')}
                >
                  JSON数据
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'outputs' && (
        <div className="space-y-4">
          {/* Output Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">筛选类型:</span>
            <div className="flex gap-1">
              {['all', 'ocr', 'image_analysis', 'data'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setOutputFilter(filter as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    outputFilter === filter
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-white/10 text-white/60 hover:text-white/80'
                  }`}
                >
                  {filter === 'all' ? '全部' : getOutputTypeName(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Outputs Table */}
          <DataTable
            data={outputsTableData}
            columns={[
              { id: 'stepName', key: 'stepName', label: '步骤', sortable: true },
              { id: 'type', key: 'type', label: '类型', sortable: true },
              { id: 'filename', key: 'filename', label: '文件名', sortable: true },
              { id: 'size', key: 'size', label: '大小', sortable: true },
              { id: 'createdAt', key: 'createdAt', label: '创建时间', sortable: true },
              { id: 'actions', key: 'actions', label: '操作', sortable: false }
            ]}
            filterable={true}
            className="bg-white/5"
          />
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          {template.steps.map(step => {
            const stepOutputs = outputsByStep[step.id] || [];
            return (
              <GlassCard key={step.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white flex items-center gap-2">
                      <span>📋</span>
                      {step.title}
                    </h4>
                    <div className="text-sm text-white/60">
                      {stepOutputs.length} 个输出
                    </div>
                  </div>
                  
                  {stepOutputs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stepOutputs.map(output => (
                        <div 
                          key={output.id}
                          className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => setSelectedOutput(output)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span>{getOutputTypeIcon(output.type)}</span>
                            <span className="text-sm font-medium text-white">
                              {getOutputTypeName(output.type)}
                            </span>
                          </div>
                          <div className="text-xs text-white/60">
                            {output.filename && (
                              <div>文件: {output.filename}</div>
                            )}
                            <div>时间: {new Date(output.createdAt).toLocaleTimeString()}</div>
                            {output.size && (
                              <div>大小: {formatFileSize(output.size)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-white/50">
                      此步骤暂无输出结果
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Output Detail Modal */}
      {selectedOutput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <GlassCard className="h-full">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <span>{getOutputTypeIcon(selectedOutput.type)}</span>
                    {selectedOutput.stepName} - {getOutputTypeName(selectedOutput.type)}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="✕"
                    onClick={() => setSelectedOutput(null)}
                  />
                </div>

                <div className="flex-1 overflow-auto">
                  {selectedOutput.type === 'ocr' && (
                    <OCRResultViewer
                      result={selectedOutput.data}
                      editable={false}
                      showConfidence={true}
                      onExport={(format) => {
                        // Handle OCR export
                        console.log('Export OCR result as', format);
                      }}
                    />
                  )}
                  
                  {selectedOutput.type === 'image_analysis' && (
                    <ImageAnalysisViewer
                      result={selectedOutput.data}
                      showAnnotations={true}
                      showHeatmap={false}
                      onExportReport={(format) => {
                        // Handle image analysis export
                        console.log('Export image analysis as', format);
                      }}
                    />
                  )}
                  
                  {['data', 'json'].includes(selectedOutput.type) && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <pre className="text-sm text-white/80 overflow-auto">
                        {JSON.stringify(selectedOutput.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedOutput.type === 'text' && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-white/90 whitespace-pre-wrap">
                        {selectedOutput.data}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;