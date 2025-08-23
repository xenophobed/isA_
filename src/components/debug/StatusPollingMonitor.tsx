/**
 * Status Polling Monitor - Debug component to monitor polling optimization
 * Shows real-time stats about active pollers and cache hits
 */
import React, { useState, useEffect } from 'react';
import { executionControlService } from '../../api/ExecutionControlService';

interface PollingStats {
  activePollers: number;
  cachedStatuses: number;
  timestamp: string;
}

export const StatusPollingMonitor: React.FC = () => {
  const [stats, setStats] = useState<PollingStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setIsVisible(true);

    const updateStats = () => {
      const monitoringStats = executionControlService.getActiveMonitoringStats();
      setStats({
        ...monitoringStats,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    // Update stats every 2 seconds
    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !stats) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        📊 Polling Monitor
      </div>
      <div>Active Pollers: {stats.activePollers}</div>
      <div>Cached Statuses: {stats.cachedStatuses}</div>
      <div>Last Update: {stats.timestamp}</div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
        🎯 Target: 0-2 active pollers for optimal performance
      </div>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          marginTop: '5px',
          background: 'transparent',
          border: '1px solid white',
          color: 'white',
          fontSize: '10px',
          padding: '2px 5px',
          cursor: 'pointer'
        }}
      >
        Hide
      </button>
    </div>
  );
};