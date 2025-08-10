/**
 * ============================================================================
 * Credit Monitor (creditMonitor.ts) - 智能信用监控系统
 * ============================================================================
 * 
 * 🎯 核心功能：
 * - 实时监控用户信用变化
 * - 提供详细的信用变化日志
 * - 发出信用状态警告和通知
 * - 支持调试和故障排除
 * 
 * 🏗️ 架构优势：
 * - 非侵入式监控（不影响业务逻辑）
 * - 统一的信用事件处理
 * - 可配置的监控级别
 * - 完整的变化历史记录
 */

import { logger, LogCategory } from './logger';

// ================================================================================
// Types and Interfaces
// ================================================================================

export interface CreditChangeEvent {
  auth0_id: string;
  oldCredits: number;
  newCredits: number;
  difference: number;
  source: 'api' | 'billing' | 'manual' | 'unknown';
  timestamp: string;
  sessionId?: string;
  reason?: string;
}

export interface CreditAlert {
  level: 'info' | 'warning' | 'error';
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

// ================================================================================
// Credit Monitor Class
// ================================================================================

class CreditMonitor {
  private isEnabled: boolean = true;
  private changeHistory: CreditChangeEvent[] = [];
  private alerts: CreditAlert[] = [];
  private listeners: ((event: CreditChangeEvent) => void)[] = [];
  
  // 🎛️ Configuration
  private readonly MAX_HISTORY_SIZE = 100;
  private readonly MAX_ALERTS_SIZE = 50;
  private readonly LOW_CREDIT_THRESHOLD = 50;
  private readonly CRITICAL_CREDIT_THRESHOLD = 10;

  constructor() {
    this.initializeEventListeners();
    console.log('💳 CreditMonitor: Initialized credit monitoring system');
  }

  // ================================================================================
  // Event Listeners Setup
  // ================================================================================

  private initializeEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('userCreditsUpdated', this.handleCreditUpdate.bind(this) as EventListener);
      console.log('💳 CreditMonitor: Event listeners registered');
    }
  }

  // ================================================================================
  // Credit Change Handling
  // ================================================================================

  private handleCreditUpdate(event: CustomEvent<CreditChangeEvent>): void {
    const changeEvent = event.detail;
    
    console.log('💳 CreditMonitor: Credit change detected', {
      transition: `${changeEvent.oldCredits} → ${changeEvent.newCredits}`,
      difference: changeEvent.difference > 0 ? `+${changeEvent.difference}` : `${changeEvent.difference}`,
      source: changeEvent.source,
      user: changeEvent.auth0_id.substring(0, 8) + '...'
    });

    // 📊 Record change in history
    this.recordChange(changeEvent);

    // 🚨 Check for alerts
    this.checkForAlerts(changeEvent);

    // 📡 Notify listeners
    this.notifyListeners(changeEvent);

    // 📝 Log to system
    this.logChange(changeEvent);
  }

  // ================================================================================
  // Change Recording
  // ================================================================================

  private recordChange(change: CreditChangeEvent): void {
    this.changeHistory.push(change);
    
    // 🧹 Maintain history size limit
    if (this.changeHistory.length > this.MAX_HISTORY_SIZE) {
      this.changeHistory.shift();
    }

    console.log('💳 CreditMonitor: Change recorded', {
      totalChanges: this.changeHistory.length,
      latestChange: {
        credits: change.newCredits,
        source: change.source,
        timestamp: change.timestamp
      }
    });
  }

  // ================================================================================
  // Alert System
  // ================================================================================

  private checkForAlerts(change: CreditChangeEvent): void {
    const alerts: CreditAlert[] = [];

    // 🔴 Critical: Very low credits
    if (change.newCredits <= this.CRITICAL_CREDIT_THRESHOLD && change.oldCredits > this.CRITICAL_CREDIT_THRESHOLD) {
      alerts.push({
        level: 'error',
        message: `Critical: Only ${change.newCredits} credits remaining!`,
        details: { change, threshold: this.CRITICAL_CREDIT_THRESHOLD },
        timestamp: new Date().toISOString()
      });
    }

    // 🟡 Warning: Low credits
    if (change.newCredits <= this.LOW_CREDIT_THRESHOLD && change.oldCredits > this.LOW_CREDIT_THRESHOLD) {
      alerts.push({
        level: 'warning',
        message: `Warning: Credits running low (${change.newCredits} remaining)`,
        details: { change, threshold: this.LOW_CREDIT_THRESHOLD },
        timestamp: new Date().toISOString()
      });
    }

    // 📈 Info: Credits added
    if (change.difference > 0) {
      alerts.push({
        level: 'info',
        message: `Credits added: +${change.difference} (Total: ${change.newCredits})`,
        details: { change },
        timestamp: new Date().toISOString()
      });
    }

    // 📉 Significant decrease
    if (change.difference <= -50) {
      alerts.push({
        level: 'warning',
        message: `Large credit decrease: ${change.difference} credits`,
        details: { change },
        timestamp: new Date().toISOString()
      });
    }

    // 📋 Record alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      console.log(`💳 CreditMonitor: ${alert.level.toUpperCase()} - ${alert.message}`);
      
      // 🔔 Show browser notification for critical alerts
      if (alert.level === 'error' && 'Notification' in window) {
        this.showBrowserNotification(alert);
      }
    });

    // 🧹 Maintain alerts size limit
    if (this.alerts.length > this.MAX_ALERTS_SIZE) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS_SIZE);
    }
  }

  // ================================================================================
  // Browser Notifications
  // ================================================================================

  private async showBrowserNotification(alert: CreditAlert): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('isA_ Credit Alert', {
          body: alert.message,
          icon: '/favicon.ico',
          tag: 'credit-alert'
        });
      }
    }
  }

  // ================================================================================
  // Listener Management
  // ================================================================================

  private notifyListeners(change: CreditChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('💳 CreditMonitor: Listener error', error);
      }
    });
  }

  public addListener(callback: (event: CreditChangeEvent) => void): () => void {
    this.listeners.push(callback);
    console.log('💳 CreditMonitor: Listener added');
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.log('💳 CreditMonitor: Listener removed');
      }
    };
  }

  // ================================================================================
  // Logging
  // ================================================================================

  private logChange(change: CreditChangeEvent): void {
    logger.info(LogCategory.USER_AUTH, 'Credit monitor: Change detected', {
      auth0_id: change.auth0_id,
      oldCredits: change.oldCredits,
      newCredits: change.newCredits,
      difference: change.difference,
      source: change.source,
      timestamp: change.timestamp
    });
  }

  // ================================================================================
  // Public API
  // ================================================================================

  public getChangeHistory(): CreditChangeEvent[] {
    return [...this.changeHistory];
  }

  public getAlerts(): CreditAlert[] {
    return [...this.alerts];
  }

  public getCurrentStatus(): {
    totalChanges: number;
    recentChanges: CreditChangeEvent[];
    pendingAlerts: CreditAlert[];
    isMonitoring: boolean;
  } {
    return {
      totalChanges: this.changeHistory.length,
      recentChanges: this.changeHistory.slice(-5),
      pendingAlerts: this.alerts.filter(a => a.level === 'error'),
      isMonitoring: this.isEnabled
    };
  }

  public enable(): void {
    this.isEnabled = true;
    console.log('💳 CreditMonitor: Monitoring enabled');
  }

  public disable(): void {
    this.isEnabled = false;
    console.log('💳 CreditMonitor: Monitoring disabled');
  }

  public clearHistory(): void {
    this.changeHistory = [];
    this.alerts = [];
    console.log('💳 CreditMonitor: History cleared');
  }

  // ================================================================================
  // Debug Utilities
  // ================================================================================

  public debug(): void {
    console.group('💳 CreditMonitor Debug Info');
    console.log('📊 Status:', this.getCurrentStatus());
    console.log('📈 Recent Changes:', this.changeHistory.slice(-3));
    console.log('🚨 Alerts:', this.alerts.slice(-3));
    console.groupEnd();
  }
}

// ================================================================================
// Global Instance
// ================================================================================

export const creditMonitor = new CreditMonitor();

// ================================================================================
// Development Helper
// ================================================================================

if (typeof window !== 'undefined') {
  // 🔧 Make monitor available globally in development
  (window as any).__creditMonitor = creditMonitor;
  console.log('💳 CreditMonitor: Available globally as window.__creditMonitor');
}

export default creditMonitor;