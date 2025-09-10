/**
 * ============================================================================
 * FieldSelector Component - 字段选择器组件
 * ============================================================================
 * 
 * 动态字段选择器，支持大量字段的选择和配置
 * 适用于数据处理、表单生成等场景
 * 
 * Features:
 * - 支持大量字段(33+)的高效展示
 * - 搜索和过滤功能
 * - 分类和分组
 * - 批量选择操作
 * - 字段预览和验证
 * - 自定义字段配置
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from './Button';

export interface FieldOption {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'phone' | 'address';
  category?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  // OCR识别相关
  confidence?: number; // OCR识别置信度
  extractedValue?: any; // 提取的值
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FieldGroup {
  id: string;
  name: string;
  fields: FieldOption[];
  color?: string;
  icon?: string;
}

export interface FieldSelectorProps {
  // 字段数据
  fields?: FieldOption[];
  groups?: FieldGroup[];
  selectedFields?: string[];
  
  // UI配置
  title?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showPreview?: boolean;
  showBatchActions?: boolean;
  
  // 布局配置
  layout?: 'grid' | 'list' | 'compact';
  columns?: number;
  maxHeight?: number;
  
  // 功能配置
  allowCustomFields?: boolean;
  allowReordering?: boolean;
  maxSelections?: number;
  minSelections?: number;
  
  // 回调函数
  onSelectionChange?: (selectedFieldIds: string[]) => void;
  onFieldPreview?: (field: FieldOption) => void;
  onFieldEdit?: (field: FieldOption) => void;
  onCustomFieldAdd?: (field: Partial<FieldOption>) => void;
  
  // 状态
  isLoading?: boolean;
  className?: string;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  fields = [],
  groups = [],
  selectedFields = [],
  title = "Select Fields",
  searchPlaceholder = "Search fields...",
  showSearch = true,
  showCategories = true,
  showPreview = true,
  showBatchActions = true,
  layout = 'grid',
  columns = 3,
  maxHeight = 400,
  allowCustomFields = false,
  allowReordering = false,
  maxSelections,
  minSelections = 0,
  onSelectionChange,
  onFieldPreview,
  onFieldEdit,
  onCustomFieldAdd,
  isLoading = false,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);

  // 获取所有字段（包括分组中的字段）
  const allFields = useMemo(() => {
    const groupFields = groups.flatMap(group => group.fields);
    return [...fields, ...groupFields];
  }, [fields, groups]);

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set(allFields.map(field => field.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [allFields]);

  // 过滤后的字段
  const filteredFields = useMemo(() => {
    return allFields.filter(field => {
      // 搜索过滤
      const matchesSearch = searchTerm === '' || 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 分类过滤
      const matchesCategory = selectedCategory === 'all' || 
        field.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allFields, searchTerm, selectedCategory]);

  // 字段类型图标
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'boolean': return '☑️';
      case 'email': return '📧';
      case 'url': return '🔗';
      case 'phone': return '📞';
      case 'address': return '🏠';
      default: return '📄';
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 处理字段选择
  const handleFieldToggle = useCallback((fieldId: string) => {
    const isSelected = selectedFields.includes(fieldId);
    let newSelection: string[];
    
    if (isSelected) {
      // 取消选择，但检查最小选择数
      newSelection = selectedFields.filter(id => id !== fieldId);
      if (newSelection.length < minSelections) {
        return; // 不允许取消选择
      }
    } else {
      // 添加选择，但检查最大选择数
      if (maxSelections && selectedFields.length >= maxSelections) {
        return; // 不允许添加更多
      }
      newSelection = [...selectedFields, fieldId];
    }
    
    onSelectionChange?.(newSelection);
  }, [selectedFields, minSelections, maxSelections, onSelectionChange]);

  // 批量操作
  const handleSelectAll = useCallback(() => {
    const visibleFieldIds = filteredFields.map(field => field.id);
    const limitedSelection = maxSelections 
      ? visibleFieldIds.slice(0, maxSelections) 
      : visibleFieldIds;
    onSelectionChange?.(limitedSelection);
  }, [filteredFields, maxSelections, onSelectionChange]);

  const handleSelectNone = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // 渲染字段项
  const renderFieldItem = (field: FieldOption) => {
    const isSelected = selectedFields.includes(field.id);
    
    return (
      <div
        key={field.id}
        onClick={() => handleFieldToggle(field.id)}
        className={`
          relative p-3 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-500/10' 
            : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-700/40'
          }
        `}
      >
        {/* 选择指示器 */}
        <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-blue-500 border-blue-400' : 'border-gray-500'
        }`}>
          {isSelected && <span className="text-white text-xs">✓</span>}
        </div>

        {/* 字段信息 */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">{field.label}</h4>
              <p className="text-xs text-gray-400 truncate">{field.name}</p>
            </div>
          </div>

          {field.description && (
            <p className="text-xs text-gray-300 mb-2 line-clamp-2">{field.description}</p>
          )}

          {/* 额外信息 */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              field.required ? 'bg-red-500/20 text-red-300' : 'bg-gray-600/20 text-gray-300'
            }`}>
              {field.required ? 'Required' : 'Optional'}
            </span>
            
            {field.confidence !== undefined && (
              <span className={`px-2 py-1 rounded-full bg-gray-600/20 font-medium ${getConfidenceColor(field.confidence)}`}>
                {(field.confidence * 100).toFixed(0)}%
              </span>
            )}
            
            {field.extractedValue && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs truncate max-w-20">
                {String(field.extractedValue).substring(0, 10)}...
              </span>
            )}
          </div>

          {/* 操作按钮 */}
          {showPreview && (
            <div className="flex gap-1 mt-2">
              {onFieldPreview && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon="👁️"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFieldPreview(field);
                  }}
                  tooltipText="Preview field"
                />
              )}
              {onFieldEdit && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon="✏️"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFieldEdit(field);
                  }}
                  tooltipText="Edit field"
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 space-y-3">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400">
            {selectedFields.length} of {allFields.length} fields selected
            {maxSelections && ` (max ${maxSelections})`}
          </p>
        </div>

        {/* Batch Actions */}
        {showBatchActions && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={maxSelections ? selectedFields.length >= maxSelections : false}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectNone}
              disabled={selectedFields.length <= minSelections}
            >
              Clear
            </Button>
            
            {allowCustomFields && (
              <Button
                variant="primary"
                size="sm"
                icon="+"
                onClick={() => setShowCustomFieldDialog(true)}
              >
                Custom Field
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        {showSearch && (
          <div className="flex-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
          </div>
        )}

        {showCategories && categories.length > 1 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white focus:border-blue-400 focus:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          >
            <option value="all">All Categories</option>
            {categories.filter(cat => cat !== 'all').map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fields Grid/List */}
      <div 
        className="overflow-auto border border-gray-700/50 rounded-lg"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {filteredFields.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p>No fields found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          </div>
        ) : (
          <div className={`p-4 ${
            layout === 'grid' 
              ? `grid gap-3` 
              : 'space-y-3'
          }`} style={layout === 'grid' ? { 
            gridTemplateColumns: `repeat(${columns}, 1fr)` 
          } : undefined}>
            {filteredFields.map(renderFieldItem)}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedFields.length > 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-300 font-medium text-sm">
              {selectedFields.length} fields selected
            </span>
            <div className="flex gap-2">
              {allowReordering && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon="↕️"
                  tooltipText="Reorder fields"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldSelector;