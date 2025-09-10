/**
 * ============================================================================
 * Automation Components Export - 流程自动化组件导出
 * ============================================================================
 * 
 * 统一导出所有流程自动化相关的UI组件
 */

// 基础组件
export { FileUploader, type FileUploaderProps, type FileUploadResult } from '../FileUploader';
export { FieldSelector, type FieldSelectorProps, type FieldOption, type FieldGroup } from '../FieldSelector';
export { DataTable, type DataTableProps, type TableColumn, type TableRow } from '../DataTable';
export { StepFlow, type StepFlowProps, type FlowStep, type StepData, type StepComponentProps } from '../StepFlow';

// 类型定义汇总
export interface AutomationComponentTypes {
  FileUpload: {
    props: import('../FileUploader').FileUploaderProps;
    result: import('../FileUploader').FileUploadResult;
  };
  
  FieldSelection: {
    props: import('../FieldSelector').FieldSelectorProps;
    option: import('../FieldSelector').FieldOption;
    group: import('../FieldSelector').FieldGroup;
  };
  
  DataPreview: {
    props: import('../DataTable').DataTableProps;
    column: import('../DataTable').TableColumn;
    row: import('../DataTable').TableRow;
  };
  
  ProcessFlow: {
    props: import('../StepFlow').StepFlowProps;
    step: import('../StepFlow').FlowStep;
    data: import('../StepFlow').StepData;
    componentProps: import('../StepFlow').StepComponentProps;
  };
}

// 默认配置
export const DEFAULT_AUTOMATION_CONFIG = {
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    accept: '.pdf,.jpg,.png,.csv,.txt,.docx',
    autoProcess: true
  },
  
  fieldSelector: {
    layout: 'grid' as const,
    columns: 3,
    maxHeight: 400,
    showSearch: true,
    showCategories: true
  },
  
  dataTable: {
    pageSize: 50,
    maxHeight: 600,
    sortable: true,
    filterable: true,
    exportable: true
  },
  
  stepFlow: {
    layout: 'vertical' as const,
    showProgress: true,
    showTimeline: true,
    enableRetry: true,
    maxRetries: 3
  }
} as const;

// 工具函数
export const automationUtils = {
  // 文件处理工具
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type.toLowerCase();
      }
      return file.type.includes(type.replace('*', ''));
    });
  },
  
  // 文件大小格式化
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // 字段类型检测
  detectFieldType: (value: any): 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'file' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) return 'text';
      if (/^https?:\/\//.test(value)) return 'text';
      if (/^[\+]?[\s\-\(\)]*[\d\s\-\(\)]{10,}$/.test(value)) return 'text';
    }
    return 'text';
  },
  
  // CSV导出
  exportToCSV: (data: Record<string, any>[], filename: string = 'export.csv'): void => {
    if (data.length === 0) return;
    
    const keys = Object.keys(data[0]).filter(key => !key.startsWith('_'));
    const csvContent = [
      keys.join(','), // 表头
      ...data.map(row => 
        keys.map(key => {
          const value = row[key];
          const stringValue = value === null || value === undefined ? '' : String(value);
          return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  // JSON导出
  exportToJSON: (data: any, filename: string = 'export.json'): void => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  // 步骤流程工具
  createStep: (overrides: Partial<any>): any => ({
    id: `step-${Date.now()}`,
    title: 'New Step',
    type: 'input',
    status: 'pending',
    ...overrides
  }),
  
  // 验证步骤数据
  validateStepData: (step: any, data: any): string[] => {
    const errors: string[] = [];
    
    if (step.validation?.required) {
      step.validation.required.forEach((field: string) => {
        if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
          errors.push(`${field} is required`);
        }
      });
    }
    
    if (step.validation?.custom) {
      const customError = step.validation.custom(data);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return errors;
  }
};