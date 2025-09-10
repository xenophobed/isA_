/**
 * ============================================================================
 * StepFlow Component - 交互式步骤流程管理组件
 * ============================================================================
 * 
 * 支持复杂多步骤流程的交互式管理组件
 * 专为流程自动化场景设计，支持条件分支、数据传递、错误处理等
 * 
 * Features:
 * - 动态步骤管理
 * - 步骤间数据传递
 * - 条件分支逻辑
 * - 交互式UI组件
 * - 进度跟踪
 * - 错误处理和重试
 * - 步骤验证
 * - 自定义步骤UI
 */

import React, { useState, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Button } from './Button';

export interface StepData {
  [key: string]: any;
}

export interface StepValidation {
  required?: string[];
  custom?: (data: StepData) => string | null;
}

export interface StepAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: (data: StepData) => void | Promise<void>;
  disabled?: (data: StepData) => boolean;
  loading?: boolean;
}

export interface FlowStep {
  id: string;
  title: string;
  description?: string;
  type: 'input' | 'processing' | 'decision' | 'output' | 'custom';
  icon?: string;
  
  // 状态
  status: 'pending' | 'active' | 'processing' | 'completed' | 'error' | 'skipped';
  progress?: number; // 0-100
  
  // 数据和验证
  data?: StepData;
  validation?: StepValidation;
  errors?: string[];
  
  // UI配置
  component?: React.ComponentType<StepComponentProps>;
  allowSkip?: boolean;
  allowRetry?: boolean;
  autoAdvance?: boolean; // 完成后自动进入下一步
  
  // 分支逻辑
  nextSteps?: string[]; // 可能的下一步ID列表
  condition?: (data: StepData, allData: Record<string, StepData>) => string | null; // 返回下一步ID
  
  // 动作
  actions?: StepAction[];
  
  // 时间信息
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number; // 秒
}

export interface StepComponentProps {
  step: FlowStep;
  data: StepData;
  allData: Record<string, StepData>;
  onChange: (data: StepData) => void;
  onNext: () => void;
  onPrevious: () => void;
  onError: (error: string) => void;
  onComplete: () => void;
  isActive: boolean;
  isProcessing: boolean;
}

export interface StepFlowProps {
  // 基本配置
  steps: FlowStep[];
  currentStepId?: string;
  
  // 数据
  stepData?: Record<string, StepData>;
  
  // UI配置
  layout?: 'vertical' | 'horizontal' | 'wizard';
  showProgress?: boolean;
  showTimeline?: boolean;
  allowNavigation?: boolean;
  showStepNumbers?: boolean;
  
  // 功能配置
  enableRetry?: boolean;
  enableSkip?: boolean;
  autoSave?: boolean;
  maxRetries?: number;
  
  // 回调函数
  onStepChange?: (stepId: string, data?: StepData) => void;
  onStepComplete?: (stepId: string, data: StepData) => void;
  onStepError?: (stepId: string, error: string) => void;
  onFlowComplete?: (allData: Record<string, StepData>) => void;
  onDataChange?: (stepId: string, data: StepData) => void;
  
  // 状态
  isReadOnly?: boolean;
  className?: string;
}

export const StepFlow: React.FC<StepFlowProps> = ({
  steps = [],
  currentStepId,
  stepData = {},
  layout = 'vertical',
  showProgress = true,
  showTimeline = true,
  allowNavigation = false,
  showStepNumbers = true,
  enableRetry = true,
  enableSkip = false,
  autoSave = true,
  maxRetries = 3,
  onStepChange,
  onStepComplete,
  onStepError,
  onFlowComplete,
  onDataChange,
  isReadOnly = false,
  className = ""
}) => {
  const [activeStepId, setActiveStepId] = useState(currentStepId || steps[0]?.id);
  const [internalStepData, setInternalStepData] = useState(stepData);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 当前步骤
  const currentStep = useMemo(() => {
    return steps.find(step => step.id === activeStepId);
  }, [steps, activeStepId]);

  // 计算整体进度
  const overallProgress = useMemo(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  }, [steps]);

  // 获取步骤索引
  const getStepIndex = useCallback((stepId: string) => {
    return steps.findIndex(step => step.id === stepId);
  }, [steps]);

  // 验证步骤数据
  const validateStep = useCallback((step: FlowStep, data: StepData): string[] => {
    const errors: string[] = [];
    
    if (step.validation) {
      // 必填字段验证
      if (step.validation.required) {
        step.validation.required.forEach(field => {
          if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
            errors.push(`${field} is required`);
          }
        });
      }
      
      // 自定义验证
      if (step.validation.custom) {
        const customError = step.validation.custom(data);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    return errors;
  }, []);

  // 更新步骤数据
  const updateStepData = useCallback((stepId: string, data: StepData) => {
    const newStepData = { ...internalStepData, [stepId]: data };
    setInternalStepData(newStepData);
    
    if (autoSave) {
      onDataChange?.(stepId, data);
    }
  }, [internalStepData, autoSave, onDataChange]);

  // 更新步骤状态
  const updateStepStatus = useCallback((stepId: string, status: FlowStep['status'], progress?: number) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const updatedStep = { ...steps[stepIndex] };
    updatedStep.status = status;
    
    if (progress !== undefined) {
      updatedStep.progress = progress;
    }
    
    if (status === 'processing' && !updatedStep.startTime) {
      updatedStep.startTime = new Date();
    }
    
    if ((status === 'completed' || status === 'error') && !updatedStep.endTime) {
      updatedStep.endTime = new Date();
    }
    
    // 触发状态变更回调
    if (status === 'completed') {
      onStepComplete?.(stepId, internalStepData[stepId] || {});
    } else if (status === 'error') {
      onStepError?.(stepId, updatedStep.errors?.join(', ') || 'Unknown error');
    }
  }, [steps, internalStepData, onStepComplete, onStepError]);

  // 导航到指定步骤
  const navigateToStep = useCallback((stepId: string) => {
    if (isReadOnly) return;
    
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    // 检查是否允许导航
    if (!allowNavigation) {
      const currentIndex = getStepIndex(activeStepId);
      const targetIndex = getStepIndex(stepId);
      
      // 只允许导航到下一步或已完成的步骤
      if (targetIndex > currentIndex + 1 && step.status !== 'completed') {
        return;
      }
    }
    
    setActiveStepId(stepId);
    updateStepStatus(stepId, 'active');
    onStepChange?.(stepId, internalStepData[stepId]);
  }, [isReadOnly, allowNavigation, steps, activeStepId, getStepIndex, internalStepData, updateStepStatus, onStepChange]);

  // 进入下一步
  const nextStep = useCallback(() => {
    if (!currentStep) return;
    
    const currentData = internalStepData[currentStep.id] || {};
    
    // 验证当前步骤
    const errors = validateStep(currentStep, currentData);
    if (errors.length > 0) {
      updateStepStatus(currentStep.id, 'error');
      // 更新步骤错误信息
      currentStep.errors = errors;
      return;
    }
    
    // 标记当前步骤完成
    updateStepStatus(currentStep.id, 'completed', 100);
    
    // 确定下一步
    let nextStepId: string | null = null;
    
    if (currentStep.condition) {
      // 使用条件逻辑确定下一步
      nextStepId = currentStep.condition(currentData, internalStepData);
    } else if (currentStep.nextSteps && currentStep.nextSteps.length > 0) {
      // 使用预定义的下一步列表（取第一个）
      nextStepId = currentStep.nextSteps[0];
    } else {
      // 使用默认的顺序下一步
      const currentIndex = getStepIndex(currentStep.id);
      if (currentIndex < steps.length - 1) {
        nextStepId = steps[currentIndex + 1].id;
      }
    }
    
    if (nextStepId) {
      navigateToStep(nextStepId);
    } else {
      // 流程完成
      onFlowComplete?.(internalStepData);
    }
  }, [currentStep, internalStepData, validateStep, updateStepStatus, getStepIndex, steps, navigateToStep, onFlowComplete]);

  // 返回上一步
  const previousStep = useCallback(() => {
    if (!currentStep || isReadOnly) return;
    
    const currentIndex = getStepIndex(currentStep.id);
    if (currentIndex > 0) {
      const prevStepId = steps[currentIndex - 1].id;
      navigateToStep(prevStepId);
    }
  }, [currentStep, isReadOnly, getStepIndex, steps, navigateToStep]);

  // 重试当前步骤
  const retryStep = useCallback(() => {
    if (!currentStep || !enableRetry) return;
    
    const currentRetries = retryCount[currentStep.id] || 0;
    if (currentRetries >= maxRetries) return;
    
    setRetryCount(prev => ({ ...prev, [currentStep.id]: currentRetries + 1 }));
    updateStepStatus(currentStep.id, 'active');
    
    // 清除错误
    currentStep.errors = [];
  }, [currentStep, enableRetry, retryCount, maxRetries, updateStepStatus]);

  // 跳过当前步骤
  const skipStep = useCallback(() => {
    if (!currentStep || !enableSkip || !currentStep.allowSkip) return;
    
    updateStepStatus(currentStep.id, 'skipped');
    nextStep();
  }, [currentStep, enableSkip, updateStepStatus, nextStep]);

  // 获取步骤状态图标
  const getStepStatusIcon = (step: FlowStep) => {
    switch (step.status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'error': return '❌';
      case 'skipped': return '⏭️';
      case 'active': return '▶️';
      default: return '⏸️';
    }
  };

  // 获取步骤状态颜色
  const getStepStatusColor = (step: FlowStep) => {
    switch (step.status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'processing': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'skipped': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'active': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  // 渲染步骤时间轴
  const renderTimeline = () => (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = step.id === activeStepId;
        const canNavigate = allowNavigation || step.status === 'completed' || isActive;
        
        return (
          <div key={step.id} className="relative">
            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-600/50"></div>
            )}
            
            <div
              className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                isActive 
                  ? 'bg-purple-500/10 border border-purple-500/30 shadow-lg' 
                  : 'bg-gray-800/40 border border-gray-700/50 hover:bg-gray-700/40'
              } ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              onClick={() => canNavigate && navigateToStep(step.id)}
            >
              {/* 步骤指示器 */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold ${
                getStepStatusColor(step)
              }`}>
                {showStepNumbers && step.status === 'pending' ? (
                  index + 1
                ) : (
                  <span className="text-lg">{step.icon || getStepStatusIcon(step)}</span>
                )}
              </div>
              
              {/* 步骤内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  <div className="flex items-center gap-2">
                    {step.status === 'processing' && step.progress !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-blue-300">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                        <span>{step.progress}%</span>
                      </div>
                    )}
                    
                    {step.estimatedDuration && (
                      <span className="text-xs text-gray-400">
                        ~{Math.ceil(step.estimatedDuration / 60)}m
                      </span>
                    )}
                  </div>
                </div>
                
                {step.description && (
                  <p className="text-sm text-gray-300 mb-2">{step.description}</p>
                )}
                
                {/* 错误信息 */}
                {step.errors && step.errors.length > 0 && (
                  <div className="space-y-1">
                    {step.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-300 bg-red-600/10 px-2 py-1 rounded">
                        ⚠️ {error}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* 执行时间 */}
                {step.startTime && step.endTime && (
                  <p className="text-xs text-gray-400 mt-2">
                    Duration: {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // 渲染当前步骤内容
  const renderCurrentStepContent = () => {
    if (!currentStep) return null;
    
    const stepData = internalStepData[currentStep.id] || {};
    
    // 如果有自定义组件，使用自定义组件
    if (currentStep.component) {
      const StepComponent = currentStep.component;
      return (
        <StepComponent
          step={currentStep}
          data={stepData}
          allData={internalStepData}
          onChange={(data) => updateStepData(currentStep.id, data)}
          onNext={nextStep}
          onPrevious={previousStep}
          onError={(error) => {
            currentStep.errors = [error];
            updateStepStatus(currentStep.id, 'error');
          }}
          onComplete={() => updateStepStatus(currentStep.id, 'completed', 100)}
          isActive={currentStep.id === activeStepId}
          isProcessing={currentStep.status === 'processing'}
        />
      );
    }
    
    // 默认步骤内容
    return (
      <div className="space-y-4">
        <div className="text-center space-y-3">
          <div className="text-4xl mb-2">{currentStep.icon || getStepStatusIcon(currentStep)}</div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
            {currentStep.description && (
              <p className="text-gray-300 text-sm max-w-md mx-auto">{currentStep.description}</p>
            )}
          </div>
        </div>
        
        {/* 默认处理状态 */}
        {currentStep.status === 'processing' && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-blue-300 font-medium">Processing...</p>
            {currentStep.progress !== undefined && (
              <p className="text-sm text-gray-400 mt-1">{currentStep.progress}% complete</p>
            )}
          </div>
        )}
        
        {/* 步骤动作 */}
        {currentStep.actions && currentStep.actions.length > 0 && (
          <div className="flex justify-center gap-3">
            {currentStep.actions.map(action => (
              <Button
                key={action.id}
                variant={action.variant || 'primary'}
                onClick={() => action.onClick(stepData)}
                disabled={action.disabled?.(stepData) || action.loading}
                icon={action.icon}
                loading={action.loading}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染控制按钮
  const renderControls = () => (
    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={previousStep}
          disabled={getStepIndex(activeStepId) === 0 || isReadOnly}
          icon="←"
        >
          Previous
        </Button>
        
        {enableSkip && currentStep?.allowSkip && (
          <Button
            variant="ghost"
            onClick={skipStep}
            disabled={isReadOnly}
            icon="⏭️"
          >
            Skip
          </Button>
        )}
        
        {enableRetry && currentStep?.status === 'error' && currentStep.allowRetry && (
          <Button
            variant="ghost"
            onClick={retryStep}
            disabled={isReadOnly || (retryCount[currentStep.id] || 0) >= maxRetries}
            icon="🔄"
          >
            Retry ({(retryCount[currentStep.id] || 0)}/{maxRetries})
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={nextStep}
          disabled={
            isReadOnly || 
            !currentStep || 
            currentStep.status === 'processing' ||
            (currentStep.errors && currentStep.errors.length > 0)
          }
          icon="→"
        >
          {getStepIndex(activeStepId) === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总体进度 */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-blue-300 font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${layout === 'horizontal' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 步骤时间轴 */}
        {showTimeline && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span>
              Process Steps
            </h3>
            {renderTimeline()}
          </div>
        )}
        
        {/* 当前步骤内容 */}
        <div className="space-y-4">
          <div className="min-h-[400px] p-6 bg-gray-800/40 rounded-lg border border-gray-700/50">
            {renderCurrentStepContent()}
          </div>
          
          {/* 控制按钮 */}
          {!isReadOnly && renderControls()}
        </div>
      </div>
    </div>
  );
};

export default StepFlow;