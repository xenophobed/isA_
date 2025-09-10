/**
 * ============================================================================
 * Custom Automation Widget Data (data.ts)
 * ============================================================================
 * 
 * 自动化系统数据和配置文件
 */

import { AutomationTemplate, DashboardKPI, ActivityItem, SystemHealthItem, ScheduledTask, ConnectorConfig, NotificationSetting } from './types';

// ============================================================================
// Automation Templates Data
// ============================================================================

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // Demo 1: Data Pipeline Automation - 数据自动化场景：文件上传、OCR读取、自动搜索、自动发布
  {
    id: 'data_pipeline_demo',
    name: 'Smart Data Pipeline',
    description: '智能数据流水线：文件上传 → OCR文本识别 → 智能搜索匹配 → 自动发布处理',
    icon: '📊',
    category: 'data_processing',
    complexity: 'moderate',
    estimatedTime: '10-15 min',
    tags: ['OCR', '文件处理', '自动搜索', '智能发布'],
    steps: [
      { 
        id: 'file_upload', 
        title: 'File Upload', 
        description: '上传图片或PDF文档', 
        type: 'data_input', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'ocr_process', 
        title: 'OCR Extract', 
        description: 'OCR文本识别与结构化提取', 
        type: 'processing', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'smart_search', 
        title: 'Smart Search', 
        description: '基于提取文本的智能搜索匹配', 
        type: 'processing', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'auto_publish', 
        title: 'Auto Publish', 
        description: '自动发布到目标平台', 
        type: 'output', 
        status: 'pending', 
        allowsIntervention: false 
      }
    ],
    inputs: [
      { 
        id: 'file_input', 
        name: 'document_file', 
        type: 'file', 
        label: '文档文件', 
        required: true, 
        placeholder: '支持 PDF, JPG, PNG 格式' 
      },
      { 
        id: 'ocr_language', 
        name: 'ocr_language', 
        type: 'select', 
        label: 'OCR语言', 
        required: true, 
        options: [
          { label: '中文简体', value: 'zh-cn' },
          { label: '英语', value: 'en' },
          { label: '中英混合', value: 'zh-en' }
        ]
      },
      { 
        id: 'search_scope', 
        name: 'search_scope', 
        type: 'multiselect', 
        label: '搜索范围', 
        required: true, 
        options: [
          { label: '产品数据库', value: 'products' },
          { label: '知识库', value: 'knowledge' },
          { label: '政策文档', value: 'policies' },
          { label: '客户信息', value: 'customers' }
        ]
      },
      { 
        id: 'publish_targets', 
        name: 'publish_targets', 
        type: 'multiselect', 
        label: '发布目标', 
        required: true, 
        options: [
          { label: '内部系统', value: 'internal' },
          { label: '微信公众号', value: 'wechat' },
          { label: '企业网站', value: 'website' }
        ]
      },
      { 
        id: 'confidence_threshold', 
        name: 'confidence_threshold', 
        type: 'number', 
        label: '识别置信度阈值', 
        required: false, 
        placeholder: '0.85', 
        validation: { min: 0.1, max: 1.0 } 
      }
    ]
  },
  
  // Demo 2: Content Workflow - 保持原有内容工作流 (暂时不变动)
  {
    id: 'content_workflow',
    name: 'Content Workflow',
    description: 'Automated content creation, review, and publishing pipeline',
    icon: '📝',
    category: 'workflow',
    complexity: 'simple',
    estimatedTime: '5-10 min',
    tags: ['Content', 'Review', 'Publishing'],
    steps: [
      { 
        id: 'content_create', 
        title: 'Content Create', 
        description: 'Generate or import content', 
        type: 'data_input', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'content_review', 
        title: 'Content Review', 
        description: 'Quality check and compliance verification', 
        type: 'decision', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'content_publish', 
        title: 'Content Publish', 
        description: 'Publish to target channels', 
        type: 'output', 
        status: 'pending', 
        allowsIntervention: false 
      }
    ],
    inputs: [
      { 
        id: 'content_type', 
        name: 'content_type', 
        type: 'select', 
        label: 'Content Type', 
        required: true, 
        options: [
          { label: 'Article', value: 'article' },
          { label: 'Product Description', value: 'product_desc' },
          { label: 'Social Media', value: 'social_media' }
        ]
      },
      { 
        id: 'target_channels', 
        name: 'channels', 
        type: 'multiselect', 
        label: 'Target Channels', 
        required: true, 
        options: [
          { label: 'Website', value: 'website' },
          { label: 'WeChat', value: 'wechat' },
          { label: 'Weibo', value: 'weibo' }
        ]
      },
      { 
        id: 'auto_schedule', 
        name: 'auto_schedule', 
        type: 'boolean', 
        label: 'Auto Schedule', 
        required: false, 
        placeholder: 'Enable scheduled publishing' 
      }
    ]
  },

  // Demo 3: Manufacturing ML Automation - 制造业机器学习自动化：图像分析
  {
    id: 'manufacturing_ml_demo',
    name: 'Manufacturing ML Vision',
    description: '制造业机器学习自动化：产品图像质检 → 缺陷检测 → 自动分类 → 质量报告',
    icon: '🏭',
    category: 'analysis',
    complexity: 'complex',
    estimatedTime: '20-30 min',
    tags: ['机器学习', '图像识别', '质量检测', '制造业'],
    steps: [
      { 
        id: 'image_capture', 
        title: 'Image Capture', 
        description: '产品图像采集与预处理', 
        type: 'data_input', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'defect_detection', 
        title: 'Defect Detection', 
        description: 'AI缺陷检测与特征提取', 
        type: 'processing', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'quality_classification', 
        title: 'Quality Classification', 
        description: '产品质量等级自动分类', 
        type: 'decision', 
        status: 'pending', 
        allowsIntervention: true 
      },
      { 
        id: 'report_generation', 
        title: 'Report Generation', 
        description: '生成质量检测报告', 
        type: 'output', 
        status: 'pending', 
        allowsIntervention: false 
      }
    ],
    inputs: [
      { 
        id: 'product_images', 
        name: 'product_images', 
        type: 'file', 
        label: '产品图像', 
        required: true, 
        placeholder: '支持 JPG, PNG 格式，可批量上传' 
      },
      { 
        id: 'product_category', 
        name: 'product_category', 
        type: 'select', 
        label: '产品类别', 
        required: true, 
        options: [
          { label: '电子元器件', value: 'electronics' },
          { label: '机械零件', value: 'mechanical' },
          { label: '纺织品', value: 'textile' },
          { label: '金属制品', value: 'metal' },
          { label: '塑料制品', value: 'plastic' }
        ]
      },
      { 
        id: 'detection_models', 
        name: 'detection_models', 
        type: 'multiselect', 
        label: '检测模型', 
        required: true, 
        options: [
          { label: '表面缺陷检测', value: 'surface_defect' },
          { label: '尺寸偏差检测', value: 'dimension_check' },
          { label: '色差检测', value: 'color_variation' },
          { label: '形变检测', value: 'shape_deformation' },
          { label: '污渍检测', value: 'contamination' }
        ]
      },
      { 
        id: 'quality_standards', 
        name: 'quality_standards', 
        type: 'select', 
        label: '质量标准', 
        required: true, 
        options: [
          { label: 'ISO 9001', value: 'iso9001' },
          { label: '六西格玛', value: 'six_sigma' },
          { label: '自定义标准', value: 'custom' },
          { label: '行业标准', value: 'industry' }
        ]
      },
      { 
        id: 'detection_sensitivity', 
        name: 'detection_sensitivity', 
        type: 'select', 
        label: '检测敏感度', 
        required: true, 
        options: [
          { label: '高精度 (>95%)', value: 'high' },
          { label: '标准精度 (90-95%)', value: 'standard' },
          { label: '快速检测 (85-90%)', value: 'fast' }
        ]
      },
      { 
        id: 'batch_size', 
        name: 'batch_size', 
        type: 'number', 
        label: '批次大小', 
        required: false, 
        placeholder: '100', 
        validation: { min: 1, max: 1000 } 
      }
    ]
  }
];

// ============================================================================
// Dashboard Data
// ============================================================================

export const DASHBOARD_KPIS: DashboardKPI[] = [
  {
    id: 'active_executions',
    title: 'Active Executions',
    value: '1,847',
    trend: { direction: 'up', percentage: 12.3, period: 'vs last period' },
    color: 'blue',
    icon: '⚡'
  },
  {
    id: 'success_rate',
    title: 'Success Rate',
    value: '98.4%',
    trend: { direction: 'up', percentage: 2.4, period: 'vs last period' },
    color: 'green',
    icon: '✓'
  },
  {
    id: 'avg_response',
    title: 'Avg Response',
    value: '1.8s',
    trend: { direction: 'down', percentage: 18.7, period: 'vs last period' },
    color: 'purple',
    icon: '⚡'
  },
  {
    id: 'data_processed',
    title: 'Data Processed',
    value: '2.4TB',
    trend: { direction: 'up', percentage: 5.2, period: 'vs last period' },
    color: 'orange',
    icon: '💾'
  }
];

export const ACTIVITY_FEED: ActivityItem[] = [
  { 
    id: '1', timestamp: '14:32:45', type: 'success', template: 'ETL Data Processing', 
    description: '2,456 records processed successfully', icon: '📊', color: 'green' 
  },
  { 
    id: '2', timestamp: '14:31:12', type: 'warning', template: 'API Integration Sync', 
    description: 'Rate limit warning detected', icon: '⚠️', color: 'yellow' 
  },
  { 
    id: '3', timestamp: '14:29:38', type: 'success', template: 'Content Workflow', 
    description: '15 articles published successfully', icon: '📝', color: 'green' 
  },
  { 
    id: '4', timestamp: '14:28:22', type: 'info', template: 'System Health Check', 
    description: 'All services operational', icon: '🔍', color: 'blue' 
  },
  { 
    id: '5', timestamp: '14:27:05', type: 'success', template: 'Data ETL Pipeline', 
    description: '5.2GB processed and stored', icon: '🔄', color: 'green' 
  },
  { 
    id: '6', timestamp: '14:25:41', type: 'error', template: 'API Integration', 
    description: 'Connection timeout error', icon: '🔗', color: 'red' 
  }
];

export const SYSTEM_HEALTH: SystemHealthItem[] = [
  { service: 'Database Pool', status: 'healthy', value: '85%', icon: '🗄️' },
  { service: 'API Gateway', status: 'healthy', value: '92%', icon: '🌐' },
  { service: 'Queue Workers', status: 'warning', value: '78%', icon: '⚡' },
  { service: 'Storage', status: 'healthy', value: '94%', icon: '💾' }
];

// ============================================================================
// Scheduled Tasks Data
// ============================================================================

export const SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'task_1',
    name: 'Daily Data Backup',
    template: 'ETL Data Processing',
    schedule: 'Daily 02:00',
    status: 'active',
    nextRun: 'Tomorrow 02:00',
    icon: '📅'
  },
  {
    id: 'task_2',
    name: 'Weekly Report Generation',
    template: 'API Integration Sync',
    schedule: 'Monday 09:00',
    status: 'active',
    nextRun: 'Monday 09:00',
    icon: '📊'
  },
  {
    id: 'task_3',
    name: 'Content Review',
    template: 'Content Workflow',
    schedule: 'On file upload',
    status: 'paused',
    nextRun: 'Event triggered',
    icon: '📝'
  }
];

// ============================================================================
// Configuration Data
// ============================================================================

export const CONNECTORS: ConnectorConfig[] = [
  { id: 'mysql', name: 'MySQL Database', type: 'database', status: 'connected', icon: '🗄️' },
  { id: 'wechat', name: 'WeChat API', type: 'api', status: 'connected', icon: '💬' },
  { id: 'email', name: 'Email Service', type: 'service', status: 'disconnected', icon: '📧' }
];

export const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  { id: 'task_complete', label: 'Task completion notifications', enabled: true },
  { id: 'task_failure', label: 'Task failure alerts', enabled: true },
  { id: 'daily_report', label: 'Daily execution reports', enabled: false },
  { id: 'maintenance', label: 'System maintenance reminders', enabled: true }
];

// ============================================================================
// Utility Functions
// ============================================================================

export const getComplexityColor = (complexity: string): string => {
  switch (complexity) {
    case 'simple': return 'text-green-400';
    case 'moderate': return 'text-yellow-400';
    case 'complex': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'pending': return '⏳';
    case 'running': return '🔄';
    case 'completed': return '✅';
    case 'error': return '❌';
    case 'manual_review': return '👤';
    default: return '⏳';
  }
};

export const getPerformanceData = () => ({
  cpu: [45, 52, 48, 67, 71, 58, 62, 67],
  memory: [38, 41, 39, 42, 45, 44, 41, 42],
  network: [25, 58, 72, 89, 65, 45, 78, 82],
  queue: [15, 18, 22, 27, 23, 19, 21, 23]
});