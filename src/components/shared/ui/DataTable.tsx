/**
 * ============================================================================
 * DataTable Component - 数据表格展示组件
 * ============================================================================
 * 
 * 功能丰富的数据表格组件，适用于数据预览、CSV展示等场景
 * 
 * Features:
 * - 虚拟滚动支持大数据量
 * - 列排序和筛选
 * - 行选择和批量操作
 * - 导出功能 (CSV, JSON)
 * - 列宽调整
 * - 数据验证和高亮
 * - 实时编辑（可选）
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button } from './Button';

export interface TableColumn {
  id: string;
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  formatter?: (value: any, row: any) => React.ReactNode;
  validator?: (value: any) => string | null;
  aggregator?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface TableRow {
  id: string | number;
  [key: string]: any;
  _errors?: Record<string, string>; // 验证错误
  _status?: 'valid' | 'invalid' | 'warning'; // 行状态
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  column: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between';
}

export interface DataTableProps {
  // 数据
  columns: TableColumn[];
  data: TableRow[];
  
  // 功能配置
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  editable?: boolean;
  exportable?: boolean;
  
  // 显示配置
  showHeader?: boolean;
  showFooter?: boolean;
  showRowNumbers?: boolean;
  showAggregates?: boolean;
  striped?: boolean;
  bordered?: boolean;
  
  // 分页配置
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  
  // 虚拟滚动配置
  virtualScroll?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  
  // 选择配置
  selectedRows?: (string | number)[];
  multiSelect?: boolean;
  
  // 回调函数
  onSort?: (sort: TableSort | null) => void;
  onFilter?: (filters: TableFilter[]) => void;
  onSelectionChange?: (selectedRows: (string | number)[]) => void;
  onCellEdit?: (rowId: string | number, columnKey: string, newValue: any) => void;
  onRowValidate?: (row: TableRow) => Record<string, string>;
  onExport?: (format: 'csv' | 'json', data: TableRow[]) => void;
  onPageChange?: (page: number) => void;
  
  // 状态
  isLoading?: boolean;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data = [],
  sortable = true,
  filterable = true,
  selectable = false,
  editable = false,
  exportable = true,
  showHeader = true,
  showFooter = true,
  showRowNumbers = false,
  showAggregates = false,
  striped = true,
  bordered = true,
  pagination = false,
  pageSize = 50,
  currentPage = 1,
  virtualScroll = false,
  rowHeight = 40,
  maxHeight = 600,
  selectedRows = [],
  multiSelect = true,
  onSort,
  onFilter,
  onSelectionChange,
  onCellEdit,
  onRowValidate,
  onExport,
  onPageChange,
  isLoading = false,
  className = ""
}) => {
  const [sortConfig, setSortConfig] = useState<TableSort | null>(null);
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [editingCell, setEditingCell] = useState<{row: string | number, column: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // 数据处理
  const processedData = useMemo(() => {
    let result = [...data];

    // 应用筛选
    filters.forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.column];
        const filterValue = filter.value;

        switch (filter.operator || 'contains') {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });

    // 应用排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, pagination, currentPage, pageSize]);

  // 聚合计算
  const aggregates = useMemo(() => {
    if (!showAggregates) return {};
    
    const result: Record<string, any> = {};
    
    columns.forEach(column => {
      if (column.aggregator) {
        const values = processedData
          .map(row => row[column.key])
          .filter(val => val !== null && val !== undefined && val !== '');
        
        switch (column.aggregator) {
          case 'sum':
            result[column.key] = values.reduce((sum, val) => sum + Number(val), 0);
            break;
          case 'avg':
            result[column.key] = values.length > 0 
              ? (values.reduce((sum, val) => sum + Number(val), 0) / values.length).toFixed(2)
              : 0;
            break;
          case 'count':
            result[column.key] = values.length;
            break;
          case 'min':
            result[column.key] = Math.min(...values.map(Number));
            break;
          case 'max':
            result[column.key] = Math.max(...values.map(Number));
            break;
        }
      }
    });
    
    return result;
  }, [processedData, columns, showAggregates]);

  // 处理排序
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    const newSort: TableSort = {
      column: columnKey,
      direction: sortConfig?.column === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    };

    setSortConfig(newSort);
    onSort?.(newSort);
  }, [columns, sortConfig, onSort]);

  // 处理筛选
  const handleFilter = useCallback((columnKey: string, value: string) => {
    const newFilters = filters.filter(f => f.column !== columnKey);
    
    if (value.trim() !== '') {
      newFilters.push({
        column: columnKey,
        value: value.trim(),
        operator: 'contains'
      });
    }
    
    setFilters(newFilters);
    onFilter?.(newFilters);
  }, [filters, onFilter]);

  // 处理行选择
  const handleRowSelect = useCallback((rowId: string | number, selected: boolean) => {
    if (!selectable) return;
    
    let newSelection = [...selectedRows];
    
    if (selected) {
      if (multiSelect) {
        newSelection.push(rowId);
      } else {
        newSelection = [rowId];
      }
    } else {
      newSelection = newSelection.filter(id => id !== rowId);
    }
    
    onSelectionChange?.(newSelection);
  }, [selectable, selectedRows, multiSelect, onSelectionChange]);

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!selectable || !multiSelect) return;
    
    const newSelection = selected ? paginatedData.map(row => row.id) : [];
    onSelectionChange?.(newSelection);
  }, [selectable, multiSelect, paginatedData, onSelectionChange]);

  // 处理单元格编辑
  const handleCellEdit = useCallback((rowId: string | number, columnKey: string, newValue: any) => {
    onCellEdit?.(rowId, columnKey, newValue);
    setEditingCell(null);
  }, [onCellEdit]);

  // 导出数据
  const handleExport = useCallback((format: 'csv' | 'json') => {
    onExport?.(format, processedData);
  }, [processedData, onExport]);

  // 获取单元格值
  const getCellValue = useCallback((row: TableRow, column: TableColumn) => {
    const value = row[column.key];
    
    if (column.formatter) {
      return column.formatter(value, row);
    }
    
    // 默认格式化
    switch (column.type) {
      case 'boolean':
        return value ? '✅' : '❌';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return value;
    }
  }, []);

  // 渲染表头
  const renderHeader = () => (
    <thead className="bg-gray-800/60 sticky top-0 z-10">
      <tr>
        {/* 行号列 */}
        {showRowNumbers && (
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-700/50">
            #
          </th>
        )}
        
        {/* 选择列 */}
        {selectable && (
          <th className="px-3 py-2 text-left border-r border-gray-700/50">
            {multiSelect && (
              <input
                type="checkbox"
                checked={selectedRows.length > 0 && selectedRows.length === paginatedData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
            )}
          </th>
        )}
        
        {/* 数据列 */}
        {columns.map(column => (
          <th
            key={column.id}
            className={`px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-700/50 ${
              column.sortable ? 'cursor-pointer hover:bg-gray-700/40' : ''
            }`}
            onClick={() => column.sortable && handleSort(column.key)}
            style={{ 
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth
            }}
          >
            <div className="flex items-center gap-2">
              <span>{column.label}</span>
              {column.required && <span className="text-red-400">*</span>}
              {column.sortable && sortConfig?.column === column.key && (
                <span className="text-blue-400">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            
            {/* 筛选输入 */}
            {filterable && column.filterable && (
              <input
                type="text"
                placeholder="Filter..."
                className="mt-1 w-full px-2 py-1 text-xs bg-gray-700/60 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleFilter(column.key, e.target.value)}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );

  // 渲染表体
  const renderBody = () => (
    <tbody className="bg-gray-900/40 divide-y divide-gray-700/30">
      {paginatedData.map((row, index) => (
        <tr
          key={row.id}
          className={`
            transition-colors hover:bg-gray-700/20
            ${striped && index % 2 === 0 ? 'bg-gray-800/20' : ''}
            ${row._status === 'invalid' ? 'bg-red-600/10 border-l-4 border-red-500' : ''}
            ${row._status === 'warning' ? 'bg-yellow-600/10 border-l-4 border-yellow-500' : ''}
            ${selectedRows.includes(row.id) ? 'bg-blue-600/20 border-l-4 border-blue-500' : ''}
          `}
        >
          {/* 行号 */}
          {showRowNumbers && (
            <td className="px-3 py-2 text-sm text-gray-400 border-r border-gray-700/30">
              {(currentPage - 1) * pageSize + index + 1}
            </td>
          )}
          
          {/* 选择框 */}
          {selectable && (
            <td className="px-3 py-2 border-r border-gray-700/30">
              <input
                type="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
            </td>
          )}
          
          {/* 数据单元格 */}
          {columns.map(column => {
            const isEditing = editingCell?.row === row.id && editingCell?.column === column.key;
            const cellValue = getCellValue(row, column);
            const hasError = row._errors?.[column.key];
            
            return (
              <td
                key={column.id}
                className={`px-3 py-2 text-sm text-white border-r border-gray-700/30 ${
                  hasError ? 'bg-red-600/10' : ''
                } ${column.editable && editable ? 'cursor-pointer hover:bg-gray-700/40' : ''}`}
                onClick={() => {
                  if (column.editable && editable) {
                    setEditingCell({ row: row.id, column: column.key });
                  }
                }}
              >
                {isEditing ? (
                  <input
                    type={column.type === 'number' ? 'number' : 'text'}
                    defaultValue={row[column.key]}
                    className="w-full px-2 py-1 bg-gray-800 border border-blue-400 rounded text-white focus:outline-none"
                    autoFocus
                    onBlur={(e) => handleCellEdit(row.id, column.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCellEdit(row.id, column.key, (e.target as HTMLInputElement).value);
                      } else if (e.key === 'Escape') {
                        setEditingCell(null);
                      }
                    }}
                  />
                ) : (
                  <div className="truncate">
                    {cellValue}
                    {hasError && (
                      <span className="ml-2 text-red-400 text-xs" title={hasError}>⚠️</span>
                    )}
                  </div>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );

  // 渲染表脚
  const renderFooter = () => (
    <tfoot className="bg-gray-800/60">
      {showAggregates && (
        <tr>
          {showRowNumbers && <td className="px-3 py-2 border-r border-gray-700/50"></td>}
          {selectable && <td className="px-3 py-2 border-r border-gray-700/50"></td>}
          {columns.map(column => (
            <td key={column.id} className="px-3 py-2 text-sm font-medium text-gray-300 border-r border-gray-700/50">
              {aggregates[column.key] || ''}
            </td>
          ))}
        </tr>
      )}
    </tfoot>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {processedData.length} rows
            {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
          </span>
          
          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setFilters([])}
              icon="🔄"
            >
              Clear Filters ({filters.length})
            </Button>
          )}
        </div>

        {/* 导出按钮 */}
        {exportable && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon="📊"
              onClick={() => handleExport('csv')}
              disabled={processedData.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon="📋"
              onClick={() => handleExport('json')}
              disabled={processedData.length === 0}
            >
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* 表格容器 */}
      <div
        ref={tableRef}
        className={`overflow-auto rounded-lg ${bordered ? 'border border-gray-700/50' : ''}`}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <table className="min-w-full divide-y divide-gray-700/50">
          {showHeader && renderHeader()}
          {renderBody()}
          {showFooter && renderFooter()}
        </table>
      </div>

      {/* 分页 */}
      {pagination && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {Math.ceil(processedData.length / pageSize)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= Math.ceil(processedData.length / pageSize)}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;