/**
 * ============================================================================
 * Image Analysis Viewer Component - 图像分析结果展示组件
 * ============================================================================
 * 
 * 用于展示制造业图像质检和缺陷检测结果的专业组件
 * 支持热力图显示、缺陷标注、质量评分可视化等功能
 * 
 * Features:
 * - 缺陷检测结果可视化
 * - 质量评分和分类展示
 * - 热力图和标注覆盖
 * - 多种分析模型结果
 * - 批量处理统计
 * - 报告导出功能
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

export interface DefectAnnotation {
  id: string;
  type: 'surface_defect' | 'dimension_error' | 'color_variation' | 'shape_deformation' | 'contamination';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  measurementValue?: number;
  standardValue?: number;
  tolerance?: number;
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  classification: 'pass' | 'warning' | 'fail' | 'critical';
  defectCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  standardCompliance: {
    standard: string;
    compliance: number;
    requirements: string[];
  };
}

export interface AnalysisResult {
  id: string;
  filename: string;
  imageUrl: string;
  analysisType: 'quality_inspection' | 'defect_detection' | 'measurement' | 'classification';
  processingTime: number;
  modelVersion: string;
  
  // Analysis results
  defects: DefectAnnotation[];
  qualityMetrics: QualityMetrics;
  measurements?: {
    [key: string]: {
      value: number;
      unit: string;
      tolerance: number;
      status: 'pass' | 'fail';
    };
  };
  
  // Processing metadata
  metadata: {
    imageSize: { width: number; height: number };
    resolution: number;
    processedAt: string;
    modelSettings: Record<string, any>;
  };
}

export interface ImageAnalysisViewerProps {
  result: AnalysisResult;
  showAnnotations?: boolean;
  showHeatmap?: boolean;
  className?: string;
  onDefectClick?: (defect: DefectAnnotation) => void;
  onExportReport?: (format: 'pdf' | 'excel' | 'json') => void;
  onReanalyze?: () => void;
}

export const ImageAnalysisViewer: React.FC<ImageAnalysisViewerProps> = ({
  result,
  showAnnotations = true,
  showHeatmap = false,
  className = '',
  onDefectClick,
  onExportReport,
  onReanalyze
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'defects' | 'measurements' | 'report'>('overview');
  const [selectedDefect, setSelectedDefect] = useState<DefectAnnotation | null>(null);
  const [annotationsVisible, setAnnotationsVisible] = useState(showAnnotations);
  const imageRef = useRef<HTMLImageElement>(null);

  const getQualityColor = (classification: string): string => {
    switch (classification) {
      case 'pass': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'fail': return 'text-red-400 bg-red-500/20';
      case 'critical': return 'text-red-400 bg-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDefectTypeIcon = (type: string): string => {
    switch (type) {
      case 'surface_defect': return '🔍';
      case 'dimension_error': return '📏';
      case 'color_variation': return '🎨';
      case 'shape_deformation': return '📐';
      case 'contamination': return '🧹';
      default: return '⚠️';
    }
  };

  const getDefectTypeName = (type: string): string => {
    switch (type) {
      case 'surface_defect': return '表面缺陷';
      case 'dimension_error': return '尺寸偏差';
      case 'color_variation': return '色差异常';
      case 'shape_deformation': return '形变问题';
      case 'contamination': return '污染检测';
      default: return '未知类型';
    }
  };

  const handleDefectClick = useCallback((defect: DefectAnnotation) => {
    setSelectedDefect(defect);
    if (onDefectClick) {
      onDefectClick(defect);
    }
  }, [onDefectClick]);

  const handleExportReport = useCallback((format: 'pdf' | 'excel' | 'json') => {
    if (onExportReport) {
      onExportReport(format);
    }
  }, [onExportReport]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🏭</span>
            图像质检分析结果
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>文件: {result.filename}</span>
            <span>模型: {result.modelVersion}</span>
            <span>耗时: {result.processingTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quality Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getQualityColor(result.qualityMetrics.classification)}`}>
            评分: {result.qualityMetrics.overallScore}/100 ({result.qualityMetrics.classification.toUpperCase()})
          </div>
          
          {/* Controls */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={annotationsVisible ? "👁️" : "👁️‍🗨️"}
              onClick={() => setAnnotationsVisible(!annotationsVisible)}
            >
              标注
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon="📄"
              onClick={() => handleExportReport('pdf')}
            >
              报告
            </Button>
            {onReanalyze && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔄"
                onClick={onReanalyze}
              >
                重新分析
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'overview', label: '总览', icon: '📊' },
          { key: 'defects', label: '缺陷详情', icon: '🔍' },
          { key: 'measurements', label: '测量数据', icon: '📏' },
          { key: 'report', label: '质检报告', icon: '📋' }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Image Display */}
        <GlassCard className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">产品图像</h4>
              <div className="text-xs text-white/50">
                {result.metadata.imageSize.width} × {result.metadata.imageSize.height}
              </div>
            </div>
            
            <div className="relative bg-white/5 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={result.imageUrl}
                alt="Analysis Image"
                className="w-full h-auto"
              />
              
              {/* Defect Annotations Overlay */}
              {annotationsVisible && (
                <div className="absolute inset-0">
                  {result.defects.map((defect) => (
                    <div
                      key={defect.id}
                      className={`absolute border-2 cursor-pointer transition-all hover:scale-105 ${
                        selectedDefect?.id === defect.id ? 'border-white' : 'border-red-400'
                      }`}
                      style={{
                        left: `${defect.position.x}%`,
                        top: `${defect.position.y}%`,
                        width: `${defect.position.width}%`,
                        height: `${defect.position.height}%`,
                      }}
                      onClick={() => handleDefectClick(defect)}
                    >
                      <div className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white ${getSeverityColor(defect.severity)}`}>
                        {getDefectTypeIcon(defect.type)} {(defect.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quality Metrics */}
              <GlassCard className="p-4">
                <h4 className="font-medium text-white mb-3">质量评估</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">总体评分</span>
                    <span className="text-xl font-bold text-white">
                      {result.qualityMetrics.overallScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${result.qualityMetrics.overallScore}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white/60">缺陷数量</div>
                      <div className="text-white font-medium">{result.qualityMetrics.defectCount}</div>
                    </div>
                    <div>
                      <div className="text-white/60">风险等级</div>
                      <div className={`font-medium ${
                        result.qualityMetrics.riskLevel === 'low' ? 'text-green-400' :
                        result.qualityMetrics.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {result.qualityMetrics.riskLevel.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Standard Compliance */}
              <GlassCard className="p-4">
                <h4 className="font-medium text-white mb-3">标准符合性</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">{result.qualityMetrics.standardCompliance.standard}</span>
                    <span className="text-lg font-bold text-green-400">
                      {(result.qualityMetrics.standardCompliance.compliance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    {result.qualityMetrics.standardCompliance.requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-white/60">
                        <span className="text-green-400">✓</span>
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'defects' && (
            <GlassCard className="p-4">
              <h4 className="font-medium text-white mb-3">
                缺陷列表 ({result.defects.length})
              </h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {result.defects.map((defect, index) => (
                  <div
                    key={defect.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDefect?.id === defect.id
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => handleDefectClick(defect)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getDefectTypeIcon(defect.type)}</span>
                        <div>
                          <div className="font-medium text-white">
                            {getDefectTypeName(defect.type)} #{index + 1}
                          </div>
                          <div className="text-xs text-white/60">
                            置信度: {(defect.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getSeverityColor(defect.severity)}`}>
                        {defect.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/70">
                      {defect.description}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === 'measurements' && result.measurements && (
            <GlassCard className="p-4">
              <h4 className="font-medium text-white mb-3">尺寸测量</h4>
              <div className="space-y-3">
                {Object.entries(result.measurements).map(([name, measurement]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-white">{name}</div>
                      <div className="text-xs text-white/60">
                        公差: ±{measurement.tolerance}{measurement.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        measurement.status === 'pass' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {measurement.value}{measurement.unit}
                      </div>
                      <div className={`text-xs ${
                        measurement.status === 'pass' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {measurement.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === 'report' && (
            <GlassCard className="p-4">
              <h4 className="font-medium text-white mb-3">质检报告</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-white/80">建议措施</h5>
                  <div className="space-y-1">
                    {result.qualityMetrics.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-white/70">
                        <span className="text-blue-400 mt-0.5">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon="📄"
                      onClick={() => handleExportReport('pdf')}
                    >
                      导出PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="📊"
                      onClick={() => handleExportReport('excel')}
                    >
                      导出Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="🔧"
                      onClick={() => handleExportReport('json')}
                    >
                      原始数据
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisViewer;