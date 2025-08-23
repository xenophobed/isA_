import React from 'react';
import { TaskToolbar } from './TaskToolbar';
import { CalendarToolbar } from './CalendarToolbar';
import { NotificationToolbar } from './NotificationToolbar';
import { TaskStatusIndicator } from './header/TaskStatusIndicator';
import { ThemeToggle } from './theme/ThemeToggle';

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
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center" 
            style={{ 
              background: 'var(--gradient-secondary)',
              boxShadow: '0 2px 6px rgba(66, 133, 244, 0.2)'
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text-inverse)' }}>C</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Claude
            </h1>
          </div>
        </div>

        {/* Active App Indicator */}
        {currentApp && currentAppData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-primary)', border: '1px solid var(--glass-border)' }}>
            <span className="text-sm">{currentAppData.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{currentAppData.name}</span>
            <div 
              className="w-1.5 h-1.5 rounded-full animate-pulse" 
              style={{ backgroundColor: 'var(--color-accent)' }}
            ></div>
          </div>
        )}
      </div>
      
      {/* Right Section - Status & Controls */}
      <div className="flex items-center gap-3">

        {/* Theme Toggle */}
        <ThemeToggle size="sm" className="mx-2" />

        {/* Task Status Indicator */}
        <TaskStatusIndicator
          streamingStatus={streamingStatus}
          lastSSEEvent={lastSSEEvent}
          onTaskControl={onTaskControl}
          className="ml-1"
        />
        
        {/* Toolbar Suite - macOS style */}
        <div className="flex items-center gap-2">
          <TaskToolbar />
          <CalendarToolbar />
          <NotificationToolbar />
        </div>
        
      </div>
    </header>
  );
};