import React from 'react';

interface AppHeaderProps {
  currentApp: string | null;
  availableApps: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  showRightSidebar: boolean;
  onToggleSidebar: () => void;
  onShowLogs: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentApp,
  availableApps,
  showRightSidebar,
  onToggleSidebar,
  onShowLogs
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🤖</span>
          AI Agent SDK - Super App
        </h2>
        {currentApp && (
          <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-sm flex items-center gap-2">
            <span>{availableApps.find(app => app.id === currentApp)?.icon}</span>
            <span>{availableApps.find(app => app.id === currentApp)?.name}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          SmartAgent v3.0
        </div>
        
        <button 
          onClick={onShowLogs}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 transition-all hover:scale-105 flex items-center gap-2"
          title="Open Data Flow Logger"
        >
          <span>📊</span>
          Logs
        </button>
        
        <button 
          onClick={onToggleSidebar}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all hover:scale-105 flex items-center gap-2"
        >
          <span>🚀</span>
          {showRightSidebar ? 'Hide Apps' : 'Show Apps'}
        </button>
      </div>
    </div>
  );
};