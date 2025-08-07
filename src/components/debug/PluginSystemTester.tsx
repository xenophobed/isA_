/**
 * ============================================================================
 * Plugin System Tester (PluginSystemTester.tsx) - 插件系统测试组件
 * ============================================================================
 * 
 * 核心职责：
 * - 提供插件系统的可视化测试界面
 * - 验证插件注册、触发检测、执行等功能
 * - 展示插件系统的统计信息
 * 
 * 仅用于开发环境测试
 */

import React, { useState, useEffect } from 'react';
import { 
  getAvailablePlugins, 
  getPluginStats, 
  detectPluginTrigger, 
  executePlugin 
} from '../../plugins';
import { PluginInput } from '../../types/pluginTypes';

export const PluginSystemTester: React.FC = () => {
  const [pluginStats, setPluginStats] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('generate image of a beautiful sunset');
  const [triggerResult, setTriggerResult] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // 加载插件统计信息
  useEffect(() => {
    loadPluginStats();
  }, []);

  const loadPluginStats = () => {
    const stats = getPluginStats();
    setPluginStats(stats);
  };

  const handleTestTrigger = () => {
    const result = detectPluginTrigger(testMessage);
    setTriggerResult(result);
    console.log('🧪 Trigger Test Result:', result);
  };

  const handleTestExecution = async () => {
    if (!triggerResult?.triggered || !triggerResult.pluginId) {
      alert('Please test trigger detection first!');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const input: PluginInput = {
        prompt: triggerResult.extractedParams?.prompt || testMessage,
        options: {},
        context: {
          sessionId: 'test_session',
          userId: 'test_user',
          messageId: 'test_message'
        }
      };

      console.log('🧪 Executing plugin with input:', input);
      const result = await executePlugin(triggerResult.pluginId, input);
      setExecutionResult(result);
      console.log('🧪 Execution Result:', result);

    } catch (error) {
      console.error('🧪 Execution Error:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0
      });
    } finally {
      setIsExecuting(false);
      loadPluginStats(); // 刷新统计信息
    }
  };

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="plugin-system-tester" style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      zIndex: 9999,
      width: '400px',
      fontSize: '12px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#4CAF50' }}>
        🔌 Plugin System Tester
      </h3>

      {/* 插件统计 */}
      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>📊 Stats</h4>
        {pluginStats ? (
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            <div>Total Plugins: {pluginStats.totalPlugins}</div>
            <div>Enabled: {pluginStats.enabledPlugins}</div>
            <div>Total Usage: {pluginStats.totalUsage}</div>
            <div style={{ marginTop: '4px' }}>
              Plugins: {pluginStats.pluginDetails.map((p: any) => 
                `${p.name} (${p.usageCount})`
              ).join(', ')}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
        <button 
          onClick={loadPluginStats}
          style={{ marginTop: '8px', padding: '4px 8px', fontSize: '11px' }}
        >
          Refresh Stats
        </button>
      </section>

      {/* 触发测试 */}
      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>🎯 Trigger Test</h4>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter test message"
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '11px',
            marginBottom: '8px',
            background: '#333',
            border: '1px solid #555',
            color: '#fff',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={handleTestTrigger}
          style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}
        >
          Test Trigger
        </button>
        
        {triggerResult && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: triggerResult.triggered ? '#2E7D32' : '#D32F2F',
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            <div>Triggered: {triggerResult.triggered ? 'YES' : 'NO'}</div>
            {triggerResult.triggered && (
              <>
                <div>Plugin: {triggerResult.pluginId}</div>
                <div>Trigger: {triggerResult.trigger}</div>
                <div>Prompt: {triggerResult.extractedParams?.prompt}</div>
              </>
            )}
          </div>
        )}
      </section>

      {/* 执行测试 */}
      <section>
        <h4 style={{ margin: '0 0 8px 0', color: '#9C27B0' }}>⚡ Execution Test</h4>
        <button 
          onClick={handleTestExecution}
          disabled={!triggerResult?.triggered || isExecuting}
          style={{ 
            padding: '6px 12px', 
            fontSize: '11px',
            opacity: (!triggerResult?.triggered || isExecuting) ? 0.5 : 1
          }}
        >
          {isExecuting ? 'Executing...' : 'Execute Plugin'}
        </button>
        
        {executionResult && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: executionResult.success ? '#2E7D32' : '#D32F2F',
            borderRadius: '4px',
            fontSize: '11px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <div>Success: {executionResult.success ? 'YES' : 'NO'}</div>
            <div>Time: {executionResult.executionTime}ms</div>
            
            {executionResult.success && executionResult.output && (
              <>
                <div>Output ID: {executionResult.output.id}</div>
                <div>Type: {executionResult.output.type}</div>
                <div>Content: {
                  typeof executionResult.output.content === 'string' 
                    ? executionResult.output.content.substring(0, 80) + '...'
                    : JSON.stringify(executionResult.output.content).substring(0, 80) + '...'
                }</div>
              </>
            )}
            
            {!executionResult.success && (
              <div>Error: {executionResult.error}</div>
            )}
          </div>
        )}
      </section>

      <div style={{ 
        marginTop: '16px', 
        fontSize: '10px', 
        color: '#888',
        borderTop: '1px solid #555',
        paddingTop: '8px'
      }}>
        Development Tool - Not visible in production
      </div>
    </div>
  );
};

export default PluginSystemTester;