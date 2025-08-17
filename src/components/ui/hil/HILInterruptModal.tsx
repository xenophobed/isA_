/**
 * ============================================================================
 * HIL Interrupt Modal - Human-in-the-Loop 中断处理模态框
 * ============================================================================
 * 
 * 【组件职责】
 * - 显示HIL中断事件的详细信息
 * - 提供审批、审查、输入等交互界面
 * - 支持不同类型的HIL中断处理
 * - 集成时间回溯和检查点功能
 * 
 * 【设计理念】
 * ✅ 统一的HIL中断处理界面
 * ✅ 类型安全的数据处理
 * ✅ 可扩展的组件架构
 * ✅ 优雅的用户体验
 * 
 * 【支持的中断类型】
 * - approval: 简单审批（同意/拒绝）
 * - review_edit: 内容审查和编辑
 * - input_validation: 用户输入验证
 * - tool_authorization: 工具授权确认
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HILInterruptData } from '../../../types/aguiTypes';

// ================================================================================
// 类型定义
// ================================================================================

export interface HILInterruptModalProps {
  isOpen: boolean;
  interrupt: HILInterruptData | null;
  onClose: () => void;
  onApprove: (interruptId: string, data?: any) => void;
  onReject: (interruptId: string, reason?: string) => void;
  onEdit: (interruptId: string, editedContent: any) => void;
  onInput: (interruptId: string, userInput: any) => void;
  isProcessing?: boolean;
}

interface InterruptTypeConfig {
  title: string;
  icon: string; // 使用emoji字符串
  color: string;
  description: string;
}

// ================================================================================
// 中断类型配置
// ================================================================================

const INTERRUPT_TYPE_CONFIG: Record<string, InterruptTypeConfig> = {
  approval: {
    title: 'Approval Required',
    icon: '✅',
    color: 'blue',
    description: 'This action requires your approval before proceeding'
  },
  review_edit: {
    title: 'Review & Edit',
    icon: '📝',
    color: 'amber',
    description: 'Please review and edit the content before continuing'
  },
  input_validation: {
    title: 'Input Required',
    icon: 'ℹ️',
    color: 'green',
    description: 'Additional information is needed to continue'
  },
  tool_authorization: {
    title: 'Tool Authorization',
    icon: '⚠️',
    color: 'red',
    description: 'Permission required to execute this tool'
  }
};

// ================================================================================
// HIL Interrupt Modal Component
// ================================================================================

export const HILInterruptModal: React.FC<HILInterruptModalProps> = ({
  isOpen,
  interrupt,
  onClose,
  onApprove,
  onReject,
  onEdit,
  onInput,
  isProcessing = false
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [editedContent, setEditedContent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  // 重置状态当interrupt变化时
  useEffect(() => {
    if (interrupt) {
      setUserInput('');
      setEditedContent(interrupt.data);
      setRejectionReason('');
      setShowRejectionInput(false);
    }
  }, [interrupt]);

  // 获取中断类型配置
  const typeConfig = interrupt ? INTERRUPT_TYPE_CONFIG[interrupt.type] || INTERRUPT_TYPE_CONFIG.approval : null;

  // 处理审批
  const handleApprove = useCallback(() => {
    if (!interrupt) return;

    const approvalData: any = {
      approved: true,
      timestamp: new Date().toISOString()
    };

    // 根据中断类型添加额外数据
    switch (interrupt.type) {
      case 'review_edit':
        approvalData.edited_content = editedContent;
        break;
      case 'input_validation':
        approvalData.user_input = userInput;
        break;
      case 'tool_authorization':
        approvalData.authorized = true;
        break;
    }

    onApprove(interrupt.id, approvalData);
  }, [interrupt, editedContent, userInput, onApprove]);

  // 处理拒绝
  const handleReject = useCallback(() => {
    if (!interrupt) return;

    onReject(interrupt.id, rejectionReason || 'User rejected the action');
    setShowRejectionInput(false);
  }, [interrupt, rejectionReason, onReject]);

  // 处理编辑保存
  const handleEditSave = useCallback(() => {
    if (!interrupt) return;
    onEdit(interrupt.id, editedContent);
  }, [interrupt, editedContent, onEdit]);

  // 处理输入提交
  const handleInputSubmit = useCallback(() => {
    if (!interrupt) return;
    onInput(interrupt.id, userInput);
  }, [interrupt, userInput, onInput]);

  // 如果不显示或没有中断数据，不渲染
  if (!isOpen || !interrupt || !typeConfig) {
    return null;
  }

  // ================================================================================
  // 渲染函数
  // ================================================================================

  const renderInterruptContent = () => {
    switch (interrupt.type) {
      case 'approval':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Action Details</h4>
              <p className="text-blue-700">{interrupt.message}</p>
              {interrupt.data && (
                <pre className="mt-2 text-sm bg-blue-100 p-2 rounded overflow-auto">
                  {JSON.stringify(interrupt.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );

      case 'review_edit':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Content for Review</h4>
              <p className="text-amber-700 mb-3">{interrupt.message}</p>
              <textarea
                className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={8}
                value={typeof editedContent === 'string' ? editedContent : JSON.stringify(editedContent, null, 2)}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Edit the content here..."
              />
            </div>
          </div>
        );

      case 'input_validation':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Input Required</h4>
              <p className="text-green-700 mb-3">{interrupt.message}</p>
              <input
                type="text"
                className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your response..."
              />
            </div>
          </div>
        );

      case 'tool_authorization':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Tool Authorization</h4>
              <p className="text-red-700 mb-3">{interrupt.message}</p>
              {interrupt.tool_name && (
                <div className="bg-red-100 p-3 rounded">
                  <p className="font-medium text-red-800">Tool: {interrupt.tool_name}</p>
                  {interrupt.tool_args && (
                    <pre className="mt-2 text-sm text-red-700 overflow-auto">
                      {JSON.stringify(interrupt.tool_args, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{interrupt.message}</p>
            </div>
          </div>
        );
    }
  };

  const renderActionButtons = () => {
    if (showRejectionInput) {
      return (
        <div className="space-y-3">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Optional: Provide a reason for rejection..."
          />
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setShowRejectionInput(false)}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex space-x-3">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className={`flex-1 bg-${typeConfig.color}-600 text-white px-4 py-2 rounded-lg hover:bg-${typeConfig.color}-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2`}
        >
          <span className="text-sm">✅</span>
          <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
        </button>
        <button
          onClick={() => setShowRejectionInput(true)}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
        >
          <span className="text-sm">❌</span>
          <span>Reject</span>
        </button>
      </div>
    );
  };

  // ================================================================================
  // 主渲染
  // ================================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-${typeConfig.color}-600 text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{typeConfig.icon}</span>
              <div>
                <h2 className="text-xl font-semibold">{typeConfig.title}</h2>
                <p className="text-sm opacity-90">{typeConfig.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Interrupt Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
              <span className="text-sm">🕒</span>
              <span>{new Date(interrupt.timestamp).toLocaleString()}</span>
              <span>•</span>
              <span>ID: {interrupt.id}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{interrupt.title}</h3>
          </div>

          {/* Interrupt-specific content */}
          {renderInterruptContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};

export default HILInterruptModal;