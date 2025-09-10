/**
 * ============================================================================
 * Template Selector Component - 自动化模板选择器
 * ============================================================================
 * 
 * 用于选择和配置自动化模板的组件
 * 支持模板筛选、预览、复杂度分析等功能
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../../../shared/ui/Button';
import { GlassCard } from '../../../shared/ui/GlassCard';
import { SearchBar } from '../../../shared/ui/SearchBar';
import { AutomationTemplate } from './types';
import { AUTOMATION_TEMPLATES, getComplexityColor } from './data';

export interface TemplateSelectorProps {
  selectedTemplate?: AutomationTemplate | null;
  onTemplateSelect: (template: AutomationTemplate) => void;
  onTemplatePreview?: (template: AutomationTemplate) => void;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onTemplatePreview,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');

  const categories = [
    { value: 'all', label: '全部分类', icon: '🎯' },
    { value: 'data_processing', label: '数据处理', icon: '📊' },
    { value: 'workflow', label: '工作流程', icon: '📝' },
    { value: 'integration', label: '系统集成', icon: '🔗' },
    { value: 'analysis', label: '智能分析', icon: '🏭' }
  ];

  const complexityLevels = [
    { value: 'all', label: '全部复杂度', icon: '📊' },
    { value: 'simple', label: '简单', icon: '🟢' },
    { value: 'moderate', label: '中等', icon: '🟡' },
    { value: 'complex', label: '复杂', icon: '🔴' }
  ];

  const filteredTemplates = useMemo(() => {
    return AUTOMATION_TEMPLATES.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
      
      return matchesSearch && matchesCategory && matchesComplexity;
    });
  }, [searchQuery, selectedCategory, selectedComplexity]);

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple': return '简单';
      case 'moderate': return '中等';
      case 'complex': return '复杂';
      default: return '未知';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'data_processing': return '数据处理';
      case 'workflow': return '工作流程';
      case 'integration': return '系统集成';
      case 'analysis': return '智能分析';
      default: return '其他';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🎯</span>
          选择自动化模板
        </h3>
        <p className="text-white/70 text-sm">
          选择适合的自动化模板来开始你的流程，每个模板都包含预配置的步骤和智能化功能
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={() => {}}
          placeholder="搜索模板名称、描述或标签..."
          className="w-full"
        />

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Complexity Filter */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {complexityLevels.map(level => (
              <button
                key={level.value}
                onClick={() => setSelectedComplexity(level.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedComplexity === level.value
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="mr-1">{level.icon}</span>
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        找到 {filteredTemplates.length} 个模板
        {searchQuery && ` (搜索: "${searchQuery}")`}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <GlassCard
            key={template.id}
            className={`p-4 cursor-pointer transition-all hover:scale-105 hover:border-blue-500/50 ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500/50 border-blue-500/50' 
                : 'hover:bg-blue-500/5'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="text-2xl">{template.icon}</div>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                    {getComplexityText(template.complexity)}
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 text-white/70 rounded-full text-xs">
                    {getCategoryText(template.category)}
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">{template.name}</h4>
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                  {template.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>⏱️ {template.estimatedTime}</span>
                <span>📋 {template.steps.length} 步骤</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-white/5 text-white/60 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-white/5 text-white/50 rounded text-xs">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateSelect(template);
                  }}
                >
                  {selectedTemplate?.id === template.id ? '✓ 已选择' : '选择模板'}
                </Button>
                {onTemplatePreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="👁️"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplatePreview(template);
                    }}
                  >
                    预览
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <GlassCard className="p-8 text-center">
          <div className="space-y-3">
            <div className="text-4xl">🔍</div>
            <div className="font-medium text-white">未找到匹配的模板</div>
            <div className="text-sm text-white/60">
              尝试调整搜索条件或筛选器
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedComplexity('all');
              }}
            >
              清除筛选
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <GlassCard className="p-4 border border-blue-500/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white flex items-center gap-2">
                <span>{selectedTemplate.icon}</span>
                已选择: {selectedTemplate.name}
              </h4>
              <Button
                variant="primary"
                size="sm"
                icon="▶️"
              >
                开始配置
              </Button>
            </div>
            
            <div className="text-sm text-white/70">
              {selectedTemplate.description}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">预计用时: </span>
                <span className="text-white">{selectedTemplate.estimatedTime}</span>
              </div>
              <div>
                <span className="text-white/60">步骤数量: </span>
                <span className="text-white">{selectedTemplate.steps.length}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default TemplateSelector;