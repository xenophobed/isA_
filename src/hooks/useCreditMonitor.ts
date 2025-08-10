/**
 * ============================================================================
 * Use Credit Monitor Hook (useCreditMonitor.ts)
 * ============================================================================
 * 
 * 🎯 提供React组件访问信用监控系统的优雅接口
 * - 实时信用变化订阅
 * - 信用状态和警告获取
 * - 监控历史查询
 */

import { useState, useEffect, useCallback } from 'react';
import { creditMonitor, CreditChangeEvent, CreditAlert } from '../utils/creditMonitor';

export interface UseCreditMonitorReturn {
  // 当前状态
  totalChanges: number;
  recentChanges: CreditChangeEvent[];
  pendingAlerts: CreditAlert[];
  isMonitoring: boolean;
  
  // 最新变化
  lastChange: CreditChangeEvent | null;
  
  // 操作方法
  clearHistory: () => void;
  debug: () => void;
  enable: () => void;
  disable: () => void;
  
  // 完整数据
  getFullHistory: () => CreditChangeEvent[];
  getAllAlerts: () => CreditAlert[];
}

export const useCreditMonitor = (): UseCreditMonitorReturn => {
  const [status, setStatus] = useState(() => creditMonitor.getCurrentStatus());
  const [lastChange, setLastChange] = useState<CreditChangeEvent | null>(null);

  // 🔄 实时状态更新
  const updateStatus = useCallback(() => {
    setStatus(creditMonitor.getCurrentStatus());
  }, []);

  // 📡 订阅信用变化事件
  useEffect(() => {
    const unsubscribe = creditMonitor.addListener((change) => {
      console.log('🎯 useCreditMonitor: Credit change received', {
        credits: change.newCredits,
        difference: change.difference,
        source: change.source
      });
      
      setLastChange(change);
      updateStatus();
    });

    // 初始状态更新
    updateStatus();

    return unsubscribe;
  }, [updateStatus]);

  // 🛠️ 操作方法
  const clearHistory = useCallback(() => {
    creditMonitor.clearHistory();
    updateStatus();
    setLastChange(null);
  }, [updateStatus]);

  const debug = useCallback(() => {
    creditMonitor.debug();
  }, []);

  const enable = useCallback(() => {
    creditMonitor.enable();
    updateStatus();
  }, [updateStatus]);

  const disable = useCallback(() => {
    creditMonitor.disable();
    updateStatus();
  }, [updateStatus]);

  const getFullHistory = useCallback(() => {
    return creditMonitor.getChangeHistory();
  }, []);

  const getAllAlerts = useCallback(() => {
    return creditMonitor.getAlerts();
  }, []);

  return {
    // 状态
    totalChanges: status.totalChanges,
    recentChanges: status.recentChanges,
    pendingAlerts: status.pendingAlerts,
    isMonitoring: status.isMonitoring,
    lastChange,
    
    // 方法
    clearHistory,
    debug,
    enable,
    disable,
    getFullHistory,
    getAllAlerts
  };
};

export default useCreditMonitor;