/**
 * ============================================================================
 * App Layout (AppLayout.tsx) - Pure UI Layout Component
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Provide pure UI layout structure for the main application
 * - Render header, chat area, and sidebars based on props
 * - Handle responsive design and layout states
 * - Coordinate UI components without business logic
 * 
 * Architecture:
 * - Receives all data and callbacks as props from AppModule
 * - Renders pure UI components with provided data
 * - Three-panel layout: Header + (LeftSidebar + Chat + RightSidebar)
 * - No direct hooks or business logic
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - UI布局结构和响应式设计
 *   - 组件的渲染和空间分配
 *   - 样式和视觉效果管理
 *   - 事件的传递（不处理）
 * 
 * ❌ 不负责：
 *   - 业务逻辑处理（由AppModule处理）
 *   - 数据状态管理（由stores处理）
 *   - API调用（由services处理）
 *   - Hook使用（由modules处理）
 */

import React from 'react';
import { AppHeader } from './ui/AppHeader';

export interface AppLayoutProps {
  className?: string;
  children?: () => {
    chatModule: React.ReactNode;
    sessionModule: React.ReactNode;
    userModule: React.ReactNode;
    userPortal: React.ReactNode;
    appData: {
      currentApp: string | null;
      showRightSidebar: boolean;
      triggeredAppInput: string;
      availableApps: Array<{
        id: string;
        name: string;
        icon: string;
        triggers: string[];
      }>;
      onCloseApp: () => void;
      onAppSelect: (appId: string) => void;
      onToggleSidebar: () => void;
      onFileSelect: (files: FileList) => void;
      artifacts?: any[];
    };
  };
}

/**
 * Pure UI AppLayout component
 * Receives all data and callbacks as props from AppModule
 * No business logic or direct state management
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ className = '', children }) => {
  // Get rendered modules and data from AppModule via render props
  const moduleData = children?.();
  
  if (!moduleData) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-gray-900">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">Loading Application...</div>
          <div className="text-gray-400">Setting up modules...</div>
        </div>
      </div>
    );
  }
  
  const { chatModule, appData, userPortal } = moduleData;

  return (
    <div className={`h-screen w-full flex flex-col text-white ${className}`} style={{ background: 'var(--gradient-primary)' }}>
      {/* Application Header */}
      <div className="h-16 px-6 py-3 flex-shrink-0" style={{ background: 'var(--glass-primary)', backdropFilter: 'blur(20px)' }}>
        <AppHeader 
          currentApp={appData.currentApp}
          availableApps={appData.availableApps}
          showRightSidebar={appData.showRightSidebar}
          onToggleSidebar={appData.onToggleSidebar}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Render Chat Module with integrated input handling and sidebars */}
        {chatModule}
      </div>
      
      {/* User Portal - 独立渲染在最上层 */}
      {userPortal}
    </div>
  );
};