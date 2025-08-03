/**
 * ============================================================================
 * Base Widget UI (BaseWidget.tsx) - New Compact Widget Layout
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Compact artifact-focused output area with dropdown selectors
 * - Floating AI interactions and scroll-triggered actions
 * - Unified content rendering using shared components
 * - Support for artifact versioning and session management
 * 
 * New Compact Design:
 * 1. Top Control Bar: Artifact & Version dropdowns
 * 2. Output Area: Scrollable content with floating AI actions
 * 3. Input Area: Main operation interface
 * 4. Management Area: Quick action menu (optional)
 */
import React, { useState, ReactNode, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollFollowUpActions } from '../../shared/widgets/ScrollFollowUpActions';
import { Button } from '../../shared/ui/Button';
import { Dropdown } from '../../shared/widgets/Dropdown';

// Compact Dropdown components for title bar
const CompactArtifactDropdown: React.FC<{
  sessions: ArtifactSession[];
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
}> = ({ sessions, currentSessionId, onSessionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentSession = sessions.find(s => s.id === currentSessionId);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white transition-all hover:bg-white/15 text-xs"
      >
        <div className="flex items-center gap-1">
          <span className="text-sm">🎯</span>
          <span className="truncate">{currentSession?.title || 'Session'}</span>
        </div>
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto min-w-48">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSessionChange(session.id);
                setIsOpen(false);
              }}
              className={`w-full text-left p-2 hover:bg-white/10 transition-all text-xs first:rounded-t-lg last:rounded-b-lg ${
                session.id === currentSessionId ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="text-white font-medium truncate">{session.title}</div>
              <div className="text-xs text-white/60">{session.versions.length} versions</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CompactVersionDropdown: React.FC<{
  versions: ArtifactVersion[];
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
}> = ({ versions, currentVersionId, onVersionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentVersion = versions.find(v => v.id === currentVersionId);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white transition-all hover:bg-white/15 text-xs"
      >
        <div className="flex items-center gap-1">
          <span className="text-sm">{currentVersion?.isFollowUp ? '🔄' : '✨'}</span>
          <span className="truncate">v{currentVersion?.version || 1}</span>
        </div>
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto min-w-32">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => {
                onVersionChange(version.id);
                setIsOpen(false);
              }}
              className={`w-full text-left p-2 hover:bg-white/10 transition-all text-xs first:rounded-t-lg last:rounded-b-lg ${
                version.id === currentVersionId ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span>{version.isFollowUp ? '🔄' : '✨'}</span>
                <span className="text-white font-medium">v{version.version}</span>
              </div>
              <div className="text-xs text-white/60 truncate">{version.requestPrompt}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Original Demo-style Dropdown components (kept for reference)
const ArtifactDropdown: React.FC<{
  sessions: ArtifactSession[];
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
}> = ({ sessions, currentSessionId, onSessionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentSession = sessions.find(s => s.id === currentSessionId);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white transition-all hover:bg-white/15"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <div className="text-left">
            <div className="font-medium">{currentSession?.title}</div>
            <div className="text-xs text-white/60">{currentSession?.versions.length} versions</div>
          </div>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSessionChange(session.id);
                setIsOpen(false);
              }}
              className={`w-full text-left p-3 hover:bg-white/10 transition-all first:rounded-t-xl last:rounded-b-xl ${
                session.id === currentSessionId ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="text-white font-medium">{session.title}</div>
              <div className="text-xs text-white/60">
                {session.versions.length} versions • {session.lastModified.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const VersionDropdown: React.FC<{
  versions: ArtifactVersion[];
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
}> = ({ versions, currentVersionId, onVersionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentVersion = versions.find(v => v.id === currentVersionId);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white transition-all hover:bg-white/15"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{currentVersion?.isFollowUp ? '🔄' : '✨'}</span>
          <div className="text-left">
            <div className="font-medium">Version {currentVersion?.version}</div>
            <div className="text-xs text-white/60">
              {currentVersion?.isFollowUp ? 'Follow-up Edit' : 'New Request'}
            </div>
          </div>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => {
                onVersionChange(version.id);
                setIsOpen(false);
              }}
              className={`w-full text-left p-3 hover:bg-white/10 transition-all first:rounded-t-xl last:rounded-b-xl ${
                version.id === currentVersionId ? 'bg-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{version.isFollowUp ? '🔄' : '✨'}</span>
                <span className="text-white font-medium">Version {version.version}</span>
              </div>
              <div className="text-xs text-white/60 truncate">
                "{version.requestPrompt}"
              </div>
              <div className="text-xs text-white/50 mt-1">
                {version.createdAt.toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Artifact version interface (new design)
interface ArtifactVersion {
  id: string;
  version: number;
  content: any;
  type: 'text' | 'image' | 'search_results' | 'data' | 'error';
  createdAt: Date;
  requestPrompt: string;
  isFollowUp: boolean;
  metadata?: any;
}

// Artifact session interface
interface ArtifactSession {
  id: string;
  title: string;
  initialPrompt: string;
  versions: ArtifactVersion[];
  createdAt: Date;
  lastModified: Date;
}

// AI Action handlers interface
interface AIActionHandlers {
  onEdit?: () => void;
  onContinue?: () => void;
  onRefine?: () => void;
  onAnalyze?: () => void;
  onQuickEdit?: () => void;
  onAskQuestion?: () => void;
  onSummarize?: () => void;
}

// Legacy interfaces (kept for backward compatibility)
interface OutputHistoryItem {
  id: string;
  timestamp: Date;
  type: 'text' | 'image' | 'data' | 'error' | 'analysis';
  title: string;
  content: any;
  params?: any;
  isStreaming?: boolean;
}

// Legacy state management (for backward compatibility)
interface LegacyState {
  selectedOutputId?: string;
  showHistory?: boolean;
}

interface EditAction {
  id: string;
  label: string;
  icon: string;
  onClick: (content: any) => void;
  disabled?: boolean;
}

interface ManagementAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// Custom empty state configuration
export interface EmptyStateConfig {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  customContent?: ReactNode;
}

// BaseWidget props interface (updated for new design)
interface BaseWidgetProps {
  // New artifact-based props
  artifactSessions?: ArtifactSession[];
  currentSessionId?: string;
  currentVersionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onVersionChange?: (versionId: string) => void;
  
  // AI Action handlers
  aiActions?: AIActionHandlers;
  enableFloatingActions?: boolean;
  enableScrollActions?: boolean;
  
  // Legacy support (for backward compatibility)
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  editActions?: EditAction[];
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
  
  // Input area content
  children: ReactNode;
  
  // Management area configuration
  managementActions?: ManagementAction[];
  
  // Overall state
  isProcessing?: boolean;
  title?: string;
  icon?: string;
  
  // Navigation (for back button)
  onBack?: () => void;
  showBackButton?: boolean;
  
  // Layout configuration
  useCompactLayout?: boolean;
  className?: string;
  
  // Custom empty state
  emptyStateConfig?: EmptyStateConfig;
}

/**
 * BaseWidget - New Compact Layout Component
 */
export const BaseWidget: React.FC<BaseWidgetProps> = ({
  // New artifact props
  artifactSessions = [],
  currentSessionId,
  currentVersionId,
  onSessionChange,
  onVersionChange,
  aiActions = {},
  enableFloatingActions = true,
  enableScrollActions = true,
  useCompactLayout = true,
  className = '',
  
  // Legacy props (for backward compatibility)
  outputHistory = [],
  currentOutput,
  isStreaming = false,
  streamingContent,
  editActions = [],
  onSelectOutput,
  onClearHistory,
  children,
  managementActions = [],
  isProcessing = false,
  title,
  icon,
  
  // Navigation props
  onBack,
  showBackButton = true,
  
  // Custom empty state
  emptyStateConfig
}) => {
  // State for scroll actions
  const [showScrollActions, setShowScrollActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Legacy state for backward compatibility
  const [selectedOutputId, setSelectedOutputId] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  
  // Handle legacy output selection
  const handleSelectOutput = (item: OutputHistoryItem) => {
    setSelectedOutputId(item.id);
    onSelectOutput?.(item);
  };
  
  // Get current artifact session
  const currentSession = artifactSessions.find(session => session.id === currentSessionId) || artifactSessions[0];
  const currentVersion = currentSession?.versions.find(version => version.id === currentVersionId) || currentSession?.versions[currentSession.versions.length - 1];

  // Render output content
  const renderOutputContent = (content: any, type: string) => {
    console.log('🖼️ BASEWIDGET: Rendering content:', { type, content, hasContent: !!content });
    
    switch (type) {
      case 'image':
        return (
          <img 
            src={content} 
            alt="Output" 
            className="max-w-full h-auto rounded border border-white/10"
            onLoad={() => console.log('🖼️ BASEWIDGET: Image loaded successfully:', content)}
            onError={(e) => console.error('🖼️ BASEWIDGET: Image load error:', e, content)}
          />
        );
      case 'search_results':
        // Perplexity-style search results display
        return (
          <div className="space-y-3">
            {Array.isArray(content) ? content.map((result, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                {/* Result Title */}
                {result.title && (
                  <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                    {result.title}
                  </h3>
                )}
                
                {/* Result URL */}
                {result.url && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-blue-400">🔗</span>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate"
                    >
                      {result.url}
                    </a>
                  </div>
                )}
                
                {/* Result Description/Content with Markdown */}
                {result.description && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-xs text-white/70 leading-relaxed mb-1 line-clamp-3">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ol>,
                        li: ({children}) => <li className="text-white/70 text-xs">{children}</li>,
                        a: ({href, children}) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 underline text-xs"
                          >
                            {children}
                          </a>
                        ),
                        code: ({children}) => (
                          <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre className="bg-gray-800 p-1 rounded text-xs overflow-x-auto mb-1">
                            {children}
                          </pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-blue-500 pl-1 text-white/60 italic text-xs mb-1">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>
                      }}
                    >
                      {result.description}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* Full content with markdown if available */}
                {result.content && result.content !== result.description && (
                  <div className="prose prose-invert prose-sm max-w-none mt-2">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-xs text-white/70 leading-relaxed mb-1 line-clamp-3">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-white/70 text-xs space-y-0.5 mb-1 ml-1">{children}</ol>,
                        li: ({children}) => <li className="text-white/70 text-xs">{children}</li>,
                        a: ({href, children}) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 underline text-xs"
                          >
                            {children}
                          </a>
                        ),
                        code: ({children}) => (
                          <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre className="bg-gray-800 p-1 rounded text-xs overflow-x-auto mb-1">
                            {children}
                          </pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-blue-500 pl-1 text-white/60 italic text-xs mb-1">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>
                      }}
                    >
                      {result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* Additional metadata */}
                {(result.source || result.date) && (
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    {result.source && (
                      <span className="flex items-center gap-1">
                        <span>📰</span>
                        {result.source}
                      </span>
                    )}
                    {result.date && (
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        {result.date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-sm text-white/80">
                {typeof content === 'string' ? content : JSON.stringify(content)}
              </div>
            )}
          </div>
        );
      case 'data':
        return (
          <div className="bg-black/20 rounded p-2 max-h-32 overflow-y-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
            <div className="text-xs text-red-300">{content}</div>
          </div>
        );
      case 'text':
      default:
        return (
          <div className="prose prose-invert prose-sm max-w-none overflow-auto max-h-96">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-lg font-bold text-white mb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium text-white mb-2">{children}</h3>,
                p: ({children}) => <p className="text-sm text-white/80 leading-relaxed mb-2">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside text-white/80 text-sm space-y-1 mb-2 ml-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-white/80 text-sm space-y-1 mb-2 ml-2">{children}</ol>,
                li: ({children}) => <li className="text-white/80 text-sm">{children}</li>,
                a: ({href, children}) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    {children}
                  </a>
                ),
                code: ({children}) => (
                  <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-sm">
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-2 border-blue-500 pl-3 text-white/70 italic text-sm mb-2">
                    {children}
                  </blockquote>
                ),
                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-white/90">{children}</em>,
                table: ({children}) => (
                  <table className="min-w-full text-sm border-collapse border border-white/20 mb-2">
                    {children}
                  </table>
                ),
                thead: ({children}) => (
                  <thead className="bg-white/10">
                    {children}
                  </thead>
                ),
                tbody: ({children}) => (
                  <tbody>
                    {children}
                  </tbody>
                ),
                tr: ({children}) => (
                  <tr className="border-b border-white/10">
                    {children}
                  </tr>
                ),
                th: ({children}) => (
                  <th className="border border-white/20 px-2 py-1 text-left font-medium text-white">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="border border-white/20 px-2 py-1 text-white/80">
                    {children}
                  </td>
                )
              }}
            >
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </ReactMarkdown>
          </div>
        );
    }
  };

  // Handle mouse enter/leave for content interaction - only show when there's content
  const hasContent = currentVersion?.content || currentOutput?.content || outputHistory.length > 0;
  
  const handleMouseEnter = () => {
    if (enableScrollActions && hasContent) {
      setShowScrollActions(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (enableScrollActions) {
      setShowScrollActions(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{
      background: 'var(--glass-primary)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '16px'
    }}>
      {/* Elegant Title Bar with Enhanced Layout */}
      <div className="flex items-center justify-between gap-4 px-6 py-4" style={{
        borderBottom: '1px solid var(--glass-border)',
        background: 'linear-gradient(135deg, var(--glass-secondary), var(--glass-primary))',
        backdropFilter: 'blur(20px) saturate(120%)'
      }}>
        {/* Left: Enhanced Title Section */}
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, var(--accent-soft)20, var(--accent-muted)20)',
              border: '1px solid var(--glass-border)'
            }}>
              <span className="text-lg">{icon}</span>
            </div>
          )}
          <div className="flex flex-col">
            {title && (
              <h1 className="text-lg font-bold tracking-tight" style={{ 
                color: 'var(--text-primary)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {title}
              </h1>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-soft)' }}></div>
                <span className="text-xs font-medium" style={{ color: 'var(--accent-soft)' }}>Processing...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Elegant Dropdowns and Back Button */}
        <div className="flex items-center gap-3">
          {/* Session/Version Dropdowns with elegant styling */}
          <div className="flex items-center gap-2">
            {/* Session Dropdown with enhanced styling */}
            <div className="w-40">
              <Dropdown
                options={[{ id: 'session1', label: 'Session 1', icon: '🎯' }]}
                value="session1"
                onChange={() => {}}
                customTrigger={(selected, isOpen) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between text-xs shadow-lg hover:shadow-xl backdrop-blur-xl"
                    icon={selected?.icon || '🎯'}
                  >
                    <span className="truncate font-medium">{selected?.label || 'Session'}</span>
                    <span className={`transform transition-all duration-200 ml-1 ${isOpen ? 'rotate-180 text-blue-400' : 'text-white/60'}`}>
                      ▼
                    </span>
                  </Button>
                )}
              />
            </div>
            
            {/* Version Dropdown with enhanced styling */}
            <div className="w-28">
              <Dropdown
                options={[{ id: 'v1', label: 'v1', icon: '✨' }]}
                value="v1"
                onChange={() => {}}
                customTrigger={(selected, isOpen) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between text-xs shadow-lg hover:shadow-xl backdrop-blur-xl"
                    icon={selected?.icon || '✨'}
                  >
                    <span className="truncate font-medium">{selected?.label || 'v1'}</span>
                    <span className={`transform transition-all duration-200 ml-1 ${isOpen ? 'rotate-180 text-blue-400' : 'text-white/60'}`}>
                      ▼
                    </span>
                  </Button>
                )}
              />
            </div>
          </div>
          
          {/* Elegant Back Button with improved styling */}
          {showBackButton && onBack && (
            <Button
              variant="primary"
              size="sm"
              icon="←"
              onClick={onBack}
              tooltipText="Back to Widget List"
              onlyIcon
              className="shadow-lg hover:shadow-xl backdrop-blur-xl hover:scale-105 transition-all duration-200"
            />
          )}
        </div>
      </div>

      {/* Content Display Area */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div 
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-auto relative m-3 rounded-xl"
          style={{
            background: 'var(--gradient-surface)',
            border: '1px solid var(--glass-border)'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Content based on data */}
          {/* Legacy compatibility: Show current output if no artifact data */}
          {!useCompactLayout && currentOutput ? (
            <div className="p-3">
              {renderOutputContent(currentOutput.content, currentOutput.type)}
            </div>
          ) : currentVersion ? (
            /* New Artifact Content Display */
            <div className="p-3">
              {renderOutputContent(currentVersion.content, currentVersion.type)}
            </div>
          ) : outputHistory?.length > 0 ? (
            /* Fallback to legacy output if available */
            <div className="p-3">
              {renderOutputContent(outputHistory[0].content, outputHistory[0].type)}
            </div>
          ) : (
            /* Customizable Empty State - Fixed Centering */
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="w-8 h-8 border-3 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white/80">Processing your request...</div>
                    <div className="text-xs text-white/50">This may take a moment</div>
                  </div>
                </div>
              ) : emptyStateConfig?.customContent ? (
                emptyStateConfig.customContent
              ) : (
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, var(--glass-primary), var(--glass-secondary))',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      <span className="text-2xl opacity-60">{emptyStateConfig?.icon || '✨'}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-80"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/90">
                      {emptyStateConfig?.title || 'Ready to Create'}
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {emptyStateConfig?.description || 'Enter your prompt or upload content to get started with AI-powered generation'}
                    </p>
                  </div>
                  
                  {emptyStateConfig?.actionText && emptyStateConfig?.onAction ? (
                    <button
                      onClick={emptyStateConfig.onAction}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white text-xs font-medium transition-all hover:shadow-lg"
                    >
                      {emptyStateConfig.actionText}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>Powered by AI</span>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Streaming Status Display */}
          {isStreaming && streamingContent && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-300 font-medium">Live Output</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-sm font-bold text-white mb-1">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xs font-semibold text-white mb-1">{children}</h2>,
                      h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                      p: ({children}) => <p className="text-xs text-gray-300 leading-relaxed mb-1">{children}</p>,
                      code: ({children}) => (
                        <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ),
                      pre: ({children}) => (
                        <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-1">
                          {children}
                        </pre>
                      ),
                      strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({children}) => <em className="italic text-white/90">{children}</em>
                    }}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                  <span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse"></span>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll Follow-up Actions - Inside content area, positioned at bottom */}
          {enableScrollActions && showScrollActions && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="rounded-2xl px-6 py-3 shadow-2xl" style={{
                background: 'var(--glass-primary)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)'
              }}>
                <div className="flex items-center gap-4">
                  {/* AI 品牌标识 */}
                  <div className="flex items-center gap-2 pr-4" style={{ borderRight: '1px solid var(--glass-border)' }}>
                    <span className="text-lg">🤖</span>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Quick AI Actions</span>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {aiActions.onQuickEdit && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={aiActions.onQuickEdit}
                        icon="✏️"
                        tooltipText="Fast AI-powered editing"
                      >
                        Quick Edit
                      </Button>
                    )}
                    {aiActions.onAskQuestion && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={aiActions.onAskQuestion}
                        icon="❓"
                        tooltipText="Ask AI about this content"
                      >
                        Ask
                      </Button>
                    )}
                    {aiActions.onSummarize && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={aiActions.onSummarize}
                        icon="📝"
                        tooltipText="Create summary"
                      >
                        Summarize
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area (Middle) */}
      <div style={{ borderTop: '1px solid var(--glass-border)' }}>
        {children}
      </div>

      {/* Management Area (Bottom) - 使用统一高度系统 */}
      {managementActions.length > 0 && (
        <div 
          className="widget-management-area" 
          style={{
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--glass-primary)',
            backdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px var(--accent-soft)20',
            minHeight: 'var(--bottom-area-height)',
            maxHeight: 'var(--bottom-area-height)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="grid grid-cols-4 gap-3 w-full">
            {managementActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'primary' : action.variant === 'danger' ? 'danger' : 'ghost'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                icon={action.icon}
                className="flex-col h-auto py-2"
                tooltipText={action.label}
              >
                <div className="text-xs mt-1 truncate">{action.label}</div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export related types for use by other components
export type {
  OutputHistoryItem,
  EditAction,
  ManagementAction,
  BaseWidgetProps
};