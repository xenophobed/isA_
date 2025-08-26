/**
 * Demo Page - 测试新的通用组件
 */

import React, { useState } from 'react';
import { ComponentDemo } from '../src/components/shared/demo/ComponentDemo';
import { WidgetOutputDemo } from '../src/components/demos/WidgetOutputDemo';
import { ColorSchemeDemo } from '../src/components/demos/ColorSchemeDemo';

const DemoPage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'components' | 'widget-output' | 'color-schemes'>('components');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Demo Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Component Demos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveDemo('components')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'components'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Shared Components
            </button>
            <button
              onClick={() => setActiveDemo('widget-output')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'widget-output'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Widget Output Design
            </button>
            <button
              onClick={() => setActiveDemo('color-schemes')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'color-schemes'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🎨 Color Schemes
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      {activeDemo === 'components' && <ComponentDemo />}
      {activeDemo === 'widget-output' && <WidgetOutputDemo />}
      {activeDemo === 'color-schemes' && <ColorSchemeDemo />}
    </div>
  );
};

export default DemoPage;