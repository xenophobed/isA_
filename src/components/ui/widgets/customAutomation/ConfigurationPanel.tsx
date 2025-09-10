/**
 * ============================================================================
 * Configuration Panel Component - 配置面板组件
 * ============================================================================
 * 
 * 用于配置自动化模板参数的交互式面板
 * 支持智能表单生成、实时验证、参数预览等功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../../shared/ui/Button';
import { GlassCard } from '../../../shared/ui/GlassCard';
import { FileUploader } from '../../../shared/ui/FileUploader';
import { AutomationTemplate, AutomationInput, AutomationRequest } from './types';
import { SmartFormField } from './SmartFormField';

export interface ConfigurationPanelProps {
  template: AutomationTemplate;
  initialValues?: Record<string, any>;
  mode?: 'guided' | 'auto' | 'chat_sync';
  isProcessing?: boolean;
  className?: string;
  onConfigurationChange?: (config: Record<string, any>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onSubmit?: (request: AutomationRequest) => void;
  onBack?: () => void;
  onPreview?: (config: Record<string, any>) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  template,
  initialValues = {},
  mode = 'guided',
  isProcessing = false,
  className = '',
  onConfigurationChange,
  onValidationChange,
  onSubmit,
  onBack,
  onPreview
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Validation logic
  const validateField = useCallback((input: AutomationInput, value: any): string | null => {
    // Required validation
    if (input.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${input.label}是必填项`;
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== '') {
      switch (input.type) {
        case 'number':
          if (isNaN(Number(value))) {
            return `${input.label}必须是有效数字`;
          }
          if (input.validation?.min && Number(value) < input.validation.min) {
            return `${input.label}不能小于 ${input.validation.min}`;
          }
          if (input.validation?.max && Number(value) > input.validation.max) {
            return `${input.label}不能大于 ${input.validation.max}`;
          }
          break;
        
        case 'text':
          if (input.validation?.pattern) {
            const regex = new RegExp(input.validation.pattern);
            if (!regex.test(String(value))) {
              return input.validation.message || `${input.label}格式不正确`;
            }
          }
          break;
      }
    }

    return null;
  }, []);

  // Form validation state
  const { isValid, errors } = useMemo(() => {
    const newErrors: Record<string, string> = {};
    
    template.inputs.forEach(input => {
      const error = validateField(input, formValues[input.name]);
      if (error) {
        newErrors[input.name] = error;
      }
    });

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [template.inputs, formValues, validateField]);

  // Update validation errors
  React.useEffect(() => {
    setValidationErrors(errors);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [errors, isValid, onValidationChange]);

  // Notify configuration changes
  React.useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(formValues);
    }
  }, [formValues, onConfigurationChange]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid || !onSubmit) return;

    const request: AutomationRequest = {
      templateId: template.id,
      inputs: formValues,
      mode,
      ...(mode === 'chat_sync' && {
        chatContext: {
          sessionId: 'current_session', // This should come from props
          messageHistory: []
        }
      })
    };

    onSubmit(request);
  }, [template.id, formValues, mode, isValid, onSubmit]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview(formValues);
    }
    setShowPreview(true);
  }, [formValues, onPreview]);

  const getCompletionPercentage = () => {
    const totalFields = template.inputs.length;
    const completedFields = template.inputs.filter(input => {
      const value = formValues[input.name];
      return value !== null && value !== undefined && value !== '' && 
             !(Array.isArray(value) && value.length === 0);
    }).length;
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  };

  const getModeIcon = (currentMode: string) => {
    switch (currentMode) {
      case 'guided': return '🎯';
      case 'auto': return '🤖';
      case 'chat_sync': return '💬';
      default: return '⚙️';
    }
  };

  const getModeText = (currentMode: string) => {
    switch (currentMode) {
      case 'guided': return '引导配置';
      case 'auto': return '自动配置';
      case 'chat_sync': return '对话同步';
      default: return '配置模式';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{template.icon}</span>
            配置 {template.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1">
              {getModeIcon(mode)} {getModeText(mode)}
            </span>
            <span>预计用时: {template.estimatedTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">配置进度</span>
          <span className="text-white font-medium">{getCompletionPercentage().toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">参数配置</h4>
                <div className="text-xs text-white/50">
                  {template.inputs.filter(i => i.required).length} 个必填项
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.inputs.map(input => (
                  <div key={input.id} className={input.type === 'file' ? 'md:col-span-2' : ''}>
                    <SmartFormField
                      input={input}
                      value={formValues[input.name]}
                      error={touchedFields[input.name] ? validationErrors[input.name] : undefined}
                      onChange={(value) => handleFieldChange(input.name, value)}
                    />
                  </div>
                ))}
              </div>

              {/* Validation Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-400 mb-2">
                    配置错误 ({Object.keys(validationErrors).length})
                  </div>
                  <div className="space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <div key={field} className="text-xs text-red-300">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Template Info */}
          <GlassCard className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white">模板信息</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-white/60">描述</div>
                  <div className="text-white/90">{template.description}</div>
                </div>
                <div>
                  <div className="text-white/60">复杂度</div>
                  <div className="text-white/90">{template.complexity}</div>
                </div>
                <div>
                  <div className="text-white/60">步骤数</div>
                  <div className="text-white/90">{template.steps.length} 个步骤</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Steps Preview */}
          <GlassCard className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white">执行步骤</h4>
              <div className="space-y-2">
                {template.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{step.title}</div>
                      <div className="text-xs text-white/60 truncate">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              disabled={!isValid || isProcessing}
              loading={isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? '启动中...' : '启动自动化'}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              disabled={isProcessing}
              onClick={handlePreview}
            >
              预览配置
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-auto m-4">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">配置预览</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="✕"
                  onClick={() => setShowPreview(false)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-white/80 mb-2">模板</h5>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span className="text-white">{template.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-white/80 mb-2">配置参数</h5>
                  <div className="bg-white/5 rounded-lg p-3">
                    <pre className="text-xs text-white/70 overflow-auto">
                      {JSON.stringify(formValues, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-white/80 mb-2">执行模式</h5>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white flex items-center gap-2">
                      {getModeIcon(mode)} {getModeText(mode)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(false)}
                >
                  关闭
                </Button>
                <Button
                  variant="primary"
                  disabled={!isValid}
                  onClick={() => {
                    setShowPreview(false);
                    handleSubmit();
                  }}
                >
                  确认启动
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPanel;