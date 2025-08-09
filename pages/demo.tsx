/**
 * Demo Page - 测试新的通用组件
 */

import React, { useState } from 'react';
import { ComponentDemo } from '../src/components/shared/demo/ComponentDemo';
import { WidgetOutputDemo } from '../src/components/demos/WidgetOutputDemo';
import { SessionAPITester } from '../src/components/debug/SessionAPITester';
import { APIDataFlowTester } from '../src/components/debug/APIDataFlowTester';
import { SimpleAPITester } from '../src/components/debug/SimpleAPITester';

const DemoPage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'components' | 'widget-output' | 'task-management' | 'session-api' | 'api-dataflow'>('components');

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
              onClick={() => setActiveDemo('task-management')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'task-management'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              任务管理系统
            </button>
            <button
              onClick={() => setActiveDemo('session-api')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'session-api'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Session API Test
            </button>
            <button
              onClick={() => setActiveDemo('api-dataflow')}
              className={`px-4 py-2 rounded transition-all ${
                activeDemo === 'api-dataflow'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              API数据流测试
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      {activeDemo === 'components' && <ComponentDemo />}
      {activeDemo === 'widget-output' && <WidgetOutputDemo />}
      {activeDemo === 'session-api' && (
        <div className="max-w-6xl mx-auto p-6">
          <SessionAPITester />
        </div>
      )}
      {activeDemo === 'api-dataflow' && (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">注意</h4>
            <p className="text-sm text-yellow-700">
              如果"API数据流测试"出现错误，请使用下面的"简化API测试器"作为替代
            </p>
          </div>
          <APIDataFlowTester />
          <SimpleAPITester />
        </div>
      )}
    </div>
  );
};

export default DemoPage;