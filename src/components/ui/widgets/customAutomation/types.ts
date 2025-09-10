/**
 * ============================================================================
 * Custom Automation Widget Types (types.ts)
 * ============================================================================
 * 
 * 自动化系统类型定义文件
 */

import { OutputHistoryItem } from '../BaseWidget';

// ============================================================================
// Core Automation Types
// ============================================================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'data_processing' | 'workflow' | 'integration' | 'analysis';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: string;
  steps: AutomationStep[];
  inputs: AutomationInput[];
  tags: string[];
}

export interface AutomationStep {
  id: string;
  title: string;
  description: string;
  type: 'data_input' | 'processing' | 'decision' | 'output';
  status: 'pending' | 'running' | 'completed' | 'error' | 'manual_review';
  allowsIntervention: boolean;
  config?: Record<string, any>;
  result?: any;
  error?: string;
}

export interface AutomationInput {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'file' | 'date' | 'boolean';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  value?: any;
}

export interface AutomationRequest {
  templateId: string;
  inputs: Record<string, any>;
  mode: 'guided' | 'auto' | 'chat_sync';
  chatContext?: {
    sessionId: string;
    messageHistory: any[];
  };
}

// ============================================================================
// Widget Props & State Types
// ============================================================================

export interface CustomAutomationWidgetProps {
  isProcessing: boolean;
  currentTemplate: string | null;
  automationResults: any[];
  processStatus: 'idle' | 'configuring' | 'running' | 'completed' | 'error';
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onStartAutomation: (params: AutomationRequest) => Promise<void>;
  onClearData: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
  onBack?: () => void;
  onToggleMode?: () => void;
}

export type ActiveMode = 'template_select' | 'configure' | 'running' | 'results' | 'step_detail';
export type ActiveMenu = 'templates' | 'dashboard' | 'scheduled' | 'settings';
export type ViewMode = 'modern' | 'classic';

// ============================================================================
// Dashboard & Analytics Types
// ============================================================================

export interface DashboardKPI {
  id: string;
  title: string;
  value: string | number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
  template: string;
  description: string;
  icon: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

export interface SystemHealthItem {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  icon: string;
}

// ============================================================================
// Task & Schedule Types
// ============================================================================

export interface ScheduledTask {
  id: string;
  name: string;
  template: string;
  schedule: string;
  status: 'active' | 'paused' | 'disabled';
  nextRun: string;
  lastRun?: string;
  icon: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ConnectorConfig {
  id: string;
  name: string;
  type: 'database' | 'api' | 'service';
  status: 'connected' | 'disconnected' | 'error';
  icon: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}