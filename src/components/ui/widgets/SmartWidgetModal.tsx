/**
 * ============================================================================
 * Smart Widget Modal (SmartWidgetModal.tsx)
 * ============================================================================
 * 
 * Smart Widget选择弹窗，替代原来的右侧栏弹出模式
 * 
 * Features:
 * - Default & Custom tabs for widget selection
 * - Modal popup instead of right sidebar
 * - Elegant widget grid display
 * - Support for widget preview and selection
 */

import React, { useState } from 'react';
import { AppId } from '../../../types/appTypes';

export interface WidgetConfig {
  id: AppId;
  name: string;
  description: string;
  icon: string;
  category: 'default' | 'custom';
  triggers: string[];
  isEnabled: boolean;
  isPremium?: boolean;
}

export interface SmartWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetSelect: (widgetId: AppId, mode: 'half' | 'fullscreen') => void;
  availableWidgets: WidgetConfig[];
  className?: string;
}

export const SmartWidgetModal: React.FC<SmartWidgetModalProps> = ({
  isOpen,
  onClose,
  onWidgetSelect,
  availableWidgets,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [selectedWidget, setSelectedWidget] = useState<AppId | null>(null);

  if (!isOpen) return null;

  const defaultWidgets = availableWidgets.filter(w => w.category === 'default');
  const customWidgets = availableWidgets.filter(w => w.category === 'custom');
  const currentWidgets = activeTab === 'default' ? defaultWidgets : customWidgets;

  const handleWidgetClick = (widgetId: AppId) => {
    setSelectedWidget(widgetId);
  };

  const handleModeSelect = (mode: 'half' | 'fullscreen') => {
    if (selectedWidget) {
      onWidgetSelect(selectedWidget, mode);
      onClose();
      setSelectedWidget(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <div>
            <h2 className="text-2xl font-bold text-white">Smart Widgets</h2>
            <p className="text-sm text-gray-400 mt-1">Choose a widget to enhance your workflow</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700/30">
          <button
            onClick={() => setActiveTab('default')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'default'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Default Widgets ({defaultWidgets.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Widgets ({customWidgets.length})
          </button>
        </div>

        {/* Widget Grid */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {currentWidgets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                {activeTab === 'default' ? '🎯' : '⚙️'}
              </div>
              <p className="text-gray-400">
                {activeTab === 'default' 
                  ? 'No default widgets available' 
                  : 'No custom widgets configured yet'
                }
              </p>
              {activeTab === 'custom' && (
                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                  Create Custom Widget
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentWidgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => handleWidgetClick(widget.id)}
                  className={`
                    relative p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl cursor-pointer transition-all
                    hover:bg-gray-800/80 hover:border-gray-600/50 hover:shadow-lg
                    ${selectedWidget === widget.id 
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-blue-500/20 shadow-lg' 
                      : ''
                    }
                    ${!widget.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* Premium Badge */}
                  {widget.isPremium && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      PRO
                    </div>
                  )}

                  {/* Widget Icon & Info */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-2xl">
                      {widget.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm mb-1">{widget.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{widget.description}</p>
                    </div>
                  </div>

                  {/* Triggers */}
                  <div className="flex flex-wrap gap-1">
                    {widget.triggers.slice(0, 3).map((trigger) => (
                      <span
                        key={trigger}
                        className="inline-block px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
                      >
                        {trigger}
                      </span>
                    ))}
                    {widget.triggers.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                        +{widget.triggers.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedWidget === widget.id && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {selectedWidget && (
          <div className="border-t border-gray-700/30 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Selected: <span className="text-white font-medium">
                  {currentWidgets.find(w => w.id === selectedWidget)?.name}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleModeSelect('half')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Half Screen</span>
                </button>
                <button
                  onClick={() => handleModeSelect('fullscreen')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>Full Screen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};