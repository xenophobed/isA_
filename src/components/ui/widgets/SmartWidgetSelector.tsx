/**
 * ============================================================================
 * Smart Widget Selector (SmartWidgetSelector.tsx)
 * ============================================================================
 * 
 * 智能Widget选择器弹窗组件
 * - 替换原来的右侧栏widget列表显示
 * - 支持Default和Custom两个Tab
 * - 美观的网格布局展示所有可用的widget
 * - 点击后可以选择半屏或全屏模式
 */

import React, { useState, useMemo } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { AppId } from '../../../types/appTypes';
import { useTranslation } from '../../../hooks/useTranslation';

export interface WidgetInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'default' | 'custom';
  triggers: string[];
  color?: string;
}

export interface SmartWidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetSelect: (widgetId: string, mode: 'half' | 'full') => void;
  availableWidgets?: WidgetInfo[];
}


export const SmartWidgetSelector: React.FC<SmartWidgetSelectorProps> = ({
  isOpen,
  onClose,
  onWidgetSelect,
  availableWidgets
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Generate translated widgets
  const translatedDefaultWidgets = useMemo((): WidgetInfo[] => [
    {
      id: 'dream',
      name: t('widgetInfo.dream.name'),
      description: t('widgetInfo.dream.description'),
      icon: '🎨',
      category: 'default',
      triggers: ['image', 'generate', 'create', 'picture', 'art'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'hunt',
      name: t('widgetInfo.hunt.name'),
      description: t('widgetInfo.hunt.description'),
      icon: '🔍',
      category: 'default',
      triggers: ['search', 'product', 'buy', 'compare', 'shop'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'omni',
      name: t('widgetInfo.omni.name'),
      description: t('widgetInfo.omni.description'),
      icon: '⚡',
      category: 'default',
      triggers: ['write', 'article', 'content', 'blog', 'text'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'data-scientist',
      name: t('widgetInfo.dataScientist.name'),
      description: t('widgetInfo.dataScientist.description'),
      icon: '📊',
      category: 'default',
      triggers: ['analyze', 'data', 'chart', 'graph', 'statistics'],
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'knowledge',
      name: t('widgetInfo.knowledge.name'),
      description: t('widgetInfo.knowledge.description'),
      icon: '🧠',
      category: 'default',
      triggers: ['document', 'analyze', 'knowledge', 'pdf', 'file'],
      color: 'from-indigo-500 to-purple-500'
    }
  ], [t]);

  const translatedCustomWidgets = useMemo((): WidgetInfo[] => [
    {
      id: 'custom_automation',
      name: t('widgetInfo.customAutomation.name'),
      description: t('widgetInfo.customAutomation.description'),
      icon: '🤖',
      category: 'custom',
      triggers: ['automate', 'automation', 'workflow', 'process', 'streamline', 'etl', 'api integration'],
      color: 'from-violet-500 to-purple-600'
    }
  ], [t]);

  // 合并默认和自定义Widget
  const allWidgets = useMemo(() => {
    return availableWidgets || [...translatedDefaultWidgets, ...translatedCustomWidgets];
  }, [availableWidgets, translatedDefaultWidgets, translatedCustomWidgets]);

  // 按类别筛选Widget
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter(widget => widget.category === activeTab);
  }, [allWidgets, activeTab]);

  // 处理Widget点击 - 显示模式选择器
  const handleWidgetClick = (widgetId: string) => {
    setSelectedWidget(widgetId);
    setShowModeSelector(true);
  };

  // 处理模式选择
  const handleModeSelect = (mode: 'half' | 'full') => {
    if (selectedWidget) {
      onWidgetSelect(selectedWidget, mode);
      setShowModeSelector(false);
      setSelectedWidget(null);
      onClose();
    }
  };
  
  // 取消模式选择
  const handleCancelModeSelect = () => {
    setShowModeSelector(false);
    setSelectedWidget(null);
  };

  // 渲染Widget卡片
  const renderWidgetCard = (widget: WidgetInfo) => (
    <div
      key={widget.id}
      onClick={() => handleWidgetClick(widget.id)}
      className={`
        relative p-4 rounded-xl cursor-pointer
        backdrop-blur-sm border border-white/20
        hover:border-white/40 transition-all duration-300
        transform hover:scale-105 hover:-translate-y-1
        group
      `}
      style={{
        background: `linear-gradient(135deg, ${widget.color?.split(' to ')[0].replace('from-', '')}20, ${widget.color?.split(' to ')[1]}10), var(--glass-secondary)`
      }}
    >
      {/* Widget图标和名称 */}
      <div className="text-center mb-3">
        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
          {widget.icon}
        </div>
        <h3 className="text-white font-semibold text-sm mb-1">
          {widget.name}
        </h3>
      </div>

      {/* Widget描述 */}
      <p className="text-white/70 text-xs text-center leading-relaxed mb-3">
        {widget.description}
      </p>

      {/* 触发关键词标签 */}
      <div className="flex flex-wrap gap-1 justify-center">
        {widget.triggers.slice(0, 3).map(trigger => (
          <span
            key={trigger}
            className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-full"
          >
            {trigger}
          </span>
        ))}
        {widget.triggers.length > 3 && (
          <span className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded-full">
            +{widget.triggers.length - 3}
          </span>
        )}
      </div>

      {/* 悬停效果 */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${widget.color?.split(' to ')[0].replace('from-', '')}30, ${widget.color?.split(' to ')[1]}20)`,
            boxShadow: `0 8px 32px ${widget.color?.split(' to ')[0].replace('from-', '')}40`
          }}
        />
      </div>
    </div>
  );

  // 渲染模式选择器
  const renderModeSelector = () => {
    if (!showModeSelector || !selectedWidget) return null;

    const widget = allWidgets.find(w => w.id === selectedWidget);
    if (!widget) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ zIndex: 1100 }}>
        <div className="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{widget.icon}</div>
            <h3 className="text-white text-lg font-semibold mb-1">{widget.name}</h3>
            <p className="text-white/70 text-sm">{t('widgetSelector.modeSelector.chooseMode')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 半屏模式 */}
            <button
              onClick={() => handleModeSelect('half')}
              className="
                p-4 rounded-lg border border-white/20 
                hover:border-white/40 hover:bg-white/5
                transition-all duration-300 group
              "
            >
              <div className="text-center">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  📱
                </div>
                <h4 className="text-white font-medium text-sm mb-1">{t('widgetSelector.modeSelector.halfScreen')}</h4>
                <p className="text-white/60 text-xs">{t('widgetSelector.modeSelector.chatPluginMode')}</p>
              </div>
            </button>

            {/* 全屏模式 */}
            <button
              onClick={() => handleModeSelect('full')}
              className="
                p-4 rounded-lg border border-white/20 
                hover:border-white/40 hover:bg-white/5
                transition-all duration-300 group
              "
            >
              <div className="text-center">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  🖥️
                </div>
                <h4 className="text-white font-medium text-sm mb-1">{t('widgetSelector.modeSelector.fullScreen')}</h4>
                <p className="text-white/60 text-xs">{t('widgetSelector.modeSelector.standaloneMode')}</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleCancelModeSelect}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-300"
          >
            {t('widgetSelector.modeSelector.cancel')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('widgetSelector.title')}
        size="xl"
        className="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Tab切换 */}
          <div className="flex space-x-1 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab('default')}
              className={`
                flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-300
                ${activeTab === 'default' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="mr-2">⭐</span>
              {t('widgetSelector.defaultTab')}
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`
                flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-300
                ${activeTab === 'custom' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="mr-2">🛠️</span>
              {t('widgetSelector.customTab')}
            </button>
          </div>

          {/* Widget网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredWidgets.map(renderWidgetCard)}
          </div>

          {/* 空状态 */}
          {filteredWidgets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-white text-lg font-medium mb-2">
                {t('widgetSelector.noWidgetsTitle', { type: activeTab })}
              </h3>
              <p className="text-white/60 text-sm">
                {activeTab === 'custom' 
                  ? t('widgetSelector.noCustomWidgets')
                  : t('widgetSelector.noDefaultWidgets')}
              </p>
            </div>
          )}

          {/* 底部提示 */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-white/60 text-xs">
              {t('widgetSelector.tipText')}
            </p>
          </div>
        </div>
      </Modal>

      {/* 模式选择器 */}
      {renderModeSelector()}
    </>
  );
};