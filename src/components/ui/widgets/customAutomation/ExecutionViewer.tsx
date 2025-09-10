/**
 * ============================================================================
 * Execution Viewer Component - 执行监控查看器
 * ============================================================================
 * 
 * 用于实时监控自动化流程执行的组件
 * 集成了进度监控、步骤详情、日志查看等功能
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../../../shared/ui/Button';
import { GlassCard } from '../../../shared/ui/GlassCard';
import { StepFlow } from '../../../shared/ui/StepFlow';
import { ProcessMonitor } from '../../../shared/ui/ProcessMonitor';
import { AutomationTemplate, AutomationStep } from './types';

export interface ExecutionViewerProps {
  template: AutomationTemplate;
  currentExecution?: any; // ProcessExecution type from ProcessMonitor
  isProcessing: boolean;
  currentStep?: string;
  steps: AutomationStep[];
  className?: string;
  onStepClick?: (step: AutomationStep) => void;
  onCancel?: () => void;
  onRetry?: (stepId?: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onSkipStep?: (stepId: string) => void;
  onInterventionNeeded?: (step: AutomationStep) => void;
  onBack?: () => void;
}

export const ExecutionViewer: React.FC<ExecutionViewerProps> = ({
  template,
  currentExecution,
  isProcessing,
  currentStep,
  steps,
  className = '',
  onStepClick,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onSkipStep,
  onInterventionNeeded,
  onBack
}) => {
  const [activeView, setActiveView] = useState<'flow' | 'monitor' | 'details'>('flow');
  const [selectedStep, setSelectedStep] = useState<AutomationStep | null>(null);

  // Convert automation steps to StepFlow format
  const flowSteps = useMemo(() => {
    return steps.map((step, index) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      type: step.type === 'data_input' ? 'input' : step.type as 'input' | 'processing' | 'decision' | 'output',
      icon: getStepIcon(step.type),
      status: (step.status === 'running' ? 'processing' : step.status === 'manual_review' ? 'error' : step.status) as 'pending' | 'active' | 'processing' | 'completed' | 'error' | 'skipped',
      allowsIntervention: step.allowsIntervention,
      progress: step.status === 'running' ? 50 : step.status === 'completed' ? 100 : 0,
      data: step.config || {},
      validation: step.allowsIntervention ? {
        required: [],
        custom: () => null
      } : undefined,
      actions: step.allowsIntervention ? [
        {
          id: 'intervention',
          label: '人工干预',
          icon: '👤',
          variant: 'secondary' as const,
          onClick: () => onInterventionNeeded?.(step)
        }
      ] : []
    }));
  }, [steps, onInterventionNeeded]);

  function getStepIcon(type: string): string {
    switch (type) {
      case 'data_input': return '📥';
      case 'processing': return '⚙️';
      case 'decision': return '🤔';
      case 'output': return '📤';
      default: return '📋';
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'manual_review': return '👤';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-gray-400 bg-gray-500/20';
      case 'running': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'manual_review': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const executionStatus = useMemo(() => {
    if (steps.some(step => step.status === 'error')) return 'error';
    if (steps.some(step => step.status === 'manual_review')) return 'manual_review';
    if (steps.every(step => step.status === 'completed')) return 'completed';
    if (steps.some(step => step.status === 'running')) return 'running';
    return 'pending';
  }, [steps]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{template.icon}</span>
            {template.name} - 执行中
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1">
              {getStatusIcon(executionStatus)}
              {executionStatus.toUpperCase()}
            </span>
            <span>步骤: {currentStepIndex + 1}/{totalSteps}</span>
            <span>进度: {overallProgress.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(executionStatus)}`}>
            {getStatusIcon(executionStatus)} {executionStatus.toUpperCase()}
          </div>
          
          {/* Control Actions */}
          <div className="flex gap-1">
            {isProcessing && onPause && (
              <Button
                variant="ghost"
                size="sm"
                icon="⏸️"
                onClick={onPause}
              >
                暂停
              </Button>
            )}
            {!isProcessing && executionStatus === 'running' && onResume && (
              <Button
                variant="ghost"
                size="sm"
                icon="▶️"
                onClick={onResume}
              >
                继续
              </Button>
            )}
            {onRetry && (executionStatus === 'error' || executionStatus === 'manual_review') && (
              <Button
                variant="ghost"
                size="sm"
                icon="🔄"
                onClick={() => onRetry()}
              >
                重试
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                icon="⏹️"
                onClick={onCancel}
              >
                取消
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

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">总体进度</span>
          <span className="text-white font-medium">{overallProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              executionStatus === 'error' ? 'bg-red-500' :
              executionStatus === 'completed' ? 'bg-green-500' :
              executionStatus === 'manual_review' ? 'bg-yellow-500' :
              'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'flow', label: '流程图', icon: '🔄' },
          { key: 'monitor', label: '监控面板', icon: '📊' },
          { key: 'details', label: '步骤详情', icon: '📋' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === tab.key
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
      {activeView === 'flow' && (
        <StepFlow
          steps={flowSteps}
          currentStepId={currentStep}
          onStepChange={(stepId) => {
            const step = steps.find(s => s.id === stepId);
            if (step && onStepClick) {
              onStepClick(step);
            }
          }}
          onStepComplete={(stepId) => {
            // Handle step completion if needed
          }}
          isReadOnly={true}
          showProgress={true}
        />
      )}

      {activeView === 'monitor' && currentExecution && (
        <ProcessMonitor
          execution={currentExecution}
          autoRefresh={isProcessing}
          refreshInterval={2000}
          showLogs={true}
          showPerformance={true}
          onStepClick={(processStep) => {
            const step = steps.find(s => s.id === processStep.id);
            if (step && onStepClick) {
              onStepClick(step);
            }
          }}
          onCancel={onCancel}
          onRetry={onRetry}
        />
      )}

      {activeView === 'details' && (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <GlassCard 
              key={step.id}
              className={`p-4 cursor-pointer transition-all hover:bg-white/10 ${
                selectedStep?.id === step.id || currentStep === step.id ? 'ring-1 ring-blue-500/50' : ''
              }`}
              onClick={() => {
                setSelectedStep(step);
                if (onStepClick) {
                  onStepClick(step);
                }
              }}
            >
              <div className="space-y-3">
                {/* Step Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      step.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                      step.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    } text-sm font-medium`}>
                      {step.status === 'completed' ? '✓' : 
                       step.status === 'running' ? '⟳' :
                       step.status === 'error' ? '✗' : index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {step.title}
                        {currentStep === step.id && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                            当前步骤
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/60">{step.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                      {getStatusIcon(step.status)} {step.status.toUpperCase()}
                    </div>
                    
                    {step.allowsIntervention && step.status === 'manual_review' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon="👤"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInterventionNeeded) {
                            onInterventionNeeded(step);
                          }
                        }}
                      >
                        人工干预
                      </Button>
                    )}
                    
                    {step.status === 'error' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="🔄"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(step.id);
                        }}
                      >
                        重试
                      </Button>
                    )}
                    
                    {step.allowsIntervention && step.status === 'pending' && onSkipStep && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="⏭️"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkipStep(step.id);
                        }}
                      >
                        跳过
                      </Button>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {step.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="text-sm font-medium text-red-400 mb-1">
                      错误信息
                    </div>
                    <div className="text-xs text-red-300">
                      {step.error}
                    </div>
                  </div>
                )}

                {/* Step Result */}
                {step.result && step.status === 'completed' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-400 mb-1">
                      执行结果
                    </div>
                    <div className="text-xs text-green-300">
                      {typeof step.result === 'string' ? step.result : JSON.stringify(step.result, null, 2)}
                    </div>
                  </div>
                )}

                {/* Configuration */}
                {step.config && selectedStep?.id === step.id && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm font-medium text-white/70 mb-2">配置参数:</div>
                    <pre className="text-xs text-white/60 overflow-auto">
                      {JSON.stringify(step.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionViewer;