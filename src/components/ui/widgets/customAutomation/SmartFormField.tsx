/**
 * ============================================================================
 * Smart Form Field Component (SmartFormField.tsx)
 * ============================================================================
 * 
 * 智能表单字段组件 - 数据驱动的UI生成
 */

import React from 'react';
import { AutomationInput } from './types';

interface SmartFormFieldProps {
  input: AutomationInput;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const SmartFormField: React.FC<SmartFormFieldProps> = ({ 
  input, 
  value, 
  onChange, 
  error 
}) => {
  const renderField = () => {
    switch (input.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs"
            placeholder={input.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs"
            placeholder={input.placeholder}
            value={value || ''}
            min={input.validation?.min}
            max={input.validation?.max}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{input.placeholder || 'Please select option'}</option>
            {input.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {input.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="rounded border-gray-600/50 bg-gray-800/60 text-blue-500 focus:ring-blue-400 focus:ring-2 transition-all"
                />
                <span className="text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-600/50 bg-gray-800/60 text-blue-500 focus:ring-blue-400 focus:ring-2 transition-all"
            />
            <span className="text-gray-300 text-xs">{input.placeholder}</span>
          </label>
        );
      
      case 'file':
        return (
          <input
            type="file"
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600/80 file:text-white hover:file:bg-blue-600 file:transition-all file:duration-200 text-xs"
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-xs"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-white">
        {input.label}
        {input.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderField()}
      {error && (
        <p className="text-red-300 text-xs mt-1 p-2 bg-red-600/10 rounded-lg border border-red-500/20 flex items-center gap-2">
          <span className="text-red-400">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};