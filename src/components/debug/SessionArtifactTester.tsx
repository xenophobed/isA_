/**
 * ============================================================================
 * Session Artifact Tester (SessionArtifactTester.tsx) - Session Artifact 测试组件
 * ============================================================================
 * 
 * 核心职责：
 * - 测试 Session 中的 Artifact Message 功能
 * - 显示当前 Session 中的所有 Artifact Messages
 * - 验证 Widget → Session 同步是否工作
 * 
 * 仅用于开发环境测试
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

export const SessionArtifactTester: React.FC = () => {
  const [artifactMessages, setArtifactMessages] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  const { getCurrentSession, getArtifactMessages } = useSessionStore();

  // 刷新数据
  const refreshData = useCallback(() => {
    const currentSession = getCurrentSession();
    setSessionInfo(currentSession);
    
    if (currentSession) {
      const artifacts = getArtifactMessages();
      setArtifactMessages(artifacts);
    }
  }, [getCurrentSession, getArtifactMessages]);

  // 定期刷新数据
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000); // 每2秒刷新一次
    return () => clearInterval(interval);
  }, [refreshData]);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="session-artifact-tester" style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      zIndex: 9999,
      width: '400px',
      fontSize: '12px',
      maxHeight: '50vh',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#4CAF50' }}>
        📦 Session Artifact Tester
      </h3>

      {/* Session 信息 */}
      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>🎯 Current Session</h4>
        {sessionInfo ? (
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            <div>ID: {sessionInfo.id}</div>
            <div>Title: {sessionInfo.title}</div>
            <div>Messages: {sessionInfo.messages.length}</div>
            <div>Artifacts: {artifactMessages.length}</div>
          </div>
        ) : (
          <div style={{ color: '#f44336' }}>No active session</div>
        )}
        <button 
          onClick={refreshData}
          style={{ 
            marginTop: '8px', 
            padding: '4px 8px', 
            fontSize: '11px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </section>

      {/* Artifact Messages */}
      <section>
        <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>🖼️ Artifact Messages</h4>
        {artifactMessages.length > 0 ? (
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {artifactMessages.map((msg, index) => (
              <div 
                key={msg.id} 
                style={{ 
                  marginBottom: '8px',
                  padding: '8px',
                  background: '#333',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  #{index + 1} - {msg.artifact.widgetType.toUpperCase()}
                </div>
                <div>ID: {msg.artifact.id}</div>
                <div>Version: {msg.artifact.version}</div>
                <div>Type: {msg.artifact.contentType}</div>
                <div>Prompt: {msg.userPrompt}</div>
                <div>Content: {
                  typeof msg.artifact.content === 'string' 
                    ? msg.artifact.content.substring(0, 50) + '...'
                    : 'Non-string content'
                }</div>
                <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#888', fontStyle: 'italic' }}>
            No artifact messages yet. Try using a Widget to generate some!
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
        Development Tool - Updates every 2 seconds
      </div>
    </div>
  );
};

export default SessionArtifactTester;