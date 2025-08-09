import React from 'react';
import { AssistantToolbar } from './AssistantToolbar';
import { TaskToolbar } from './TaskToolbar';
import { CalendarToolbar } from './CalendarToolbar';
import { NotificationToolbar } from './NotificationToolbar';
import { TaskStatusIndicator } from './header/TaskStatusIndicator';

interface AppHeaderProps {
  currentApp: string | null;
  availableApps: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  onShowLogs?: () => void;
  // TaskStatusIndicator props
  streamingStatus?: string;
  lastSSEEvent?: any;
  onTaskControl?: (action: 'pause_all' | 'resume_all' | 'show_details') => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentApp,
  availableApps,
  streamingStatus,
  lastSSEEvent,
  onTaskControl
}) => {
  const currentAppData = availableApps.find(app => app.id === currentApp);

  return (
    <header className="flex items-center justify-between w-full h-full">
      {/* Left Section - Brand & Active App */}
      <div className="flex items-center gap-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-secondary)' }}>
            <span className="text-white text-sm font-bold">I</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ISA
            </h1>
            <p className="text-xs -mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Intelligent Agent Platform
            </p>
          </div>
        </div>

        {/* Active App Indicator */}
        {currentApp && currentAppData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-primary)', border: '1px solid var(--glass-border)' }}>
            <span className="text-sm">{currentAppData.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{currentAppData.name}</span>
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

        {/* Task Status Indicator */}
        <TaskStatusIndicator
          streamingStatus={streamingStatus}
          lastSSEEvent={lastSSEEvent}
          onTaskControl={onTaskControl}
          className="ml-1"
        />
        
        {/* Personal Assistant Toolbar Suite - macOS style */}
        <div className="flex items-center gap-2">
          <AssistantToolbar />
          <TaskToolbar />
          <CalendarToolbar />
          <NotificationToolbar />
        </div>
        
      </div>
    </header>
  );
};