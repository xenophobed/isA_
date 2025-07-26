import React from 'react';
import { AssistantToolbar } from './AssistantToolbar';
import { TaskToolbar } from './TaskToolbar';
import { CalendarToolbar } from './CalendarToolbar';
import { NotificationToolbar } from './NotificationToolbar';

interface AppHeaderProps {
  currentApp: string | null;
  availableApps: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  showRightSidebar: boolean;
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentApp,
  availableApps,
  showRightSidebar,
  onToggleSidebar
}) => {
  const currentAppData = availableApps.find(app => app.id === currentApp);

  return (
    <header className="flex items-center justify-between w-full h-full">
      {/* Left Section - Brand & Active App */}
      <div className="flex items-center gap-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">I</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              ISA
            </h1>
            <p className="text-xs text-gray-400 -mt-0.5">
              Intelligent Agent Platform
            </p>
          </div>
        </div>

        {/* Active App Indicator */}
        {currentApp && currentAppData && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 border border-gray-700 rounded-lg">
            <span className="text-sm">{currentAppData.icon}</span>
            <span className="text-sm font-medium text-white">{currentAppData.name}</span>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Right Section - Status & Controls */}
      <div className="flex items-center gap-3">
        {/* System Status - More Subtle */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>v0.1</span>
        </div>
        
        {/* Personal Assistant Toolbar Suite - macOS style */}
        <div className="flex items-center gap-2">
          <AssistantToolbar />
          <TaskToolbar />
          <CalendarToolbar />
          <NotificationToolbar />
        </div>
        
        {/* Sidebar Toggle Button */}
        <button 
          onClick={onToggleSidebar}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600 rounded-lg text-white transition-all duration-200"
          title={showRightSidebar ? 'Hide smart widgets' : 'Show smart widgets'}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showRightSidebar ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium">
            {showRightSidebar ? 'Hide Widgets' : 'Smart Widgets'}
          </span>
        </button>
      </div>
    </header>
  );
};