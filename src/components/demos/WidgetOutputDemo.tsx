/**
 * ============================================================================
 * Widget Output Area Demo - Compact Design Concept
 * ============================================================================
 * 
 * This demo showcases the new compact widget output area design with:
 * - Top dropdown selectors for artifacts and versions (space-saving)
 * - Floating AI action buttons that appear on content interaction
 * - Scroll-triggered follow-up AI functionality
 * - Maximized content display area
 * - Glassmorphism floating UI elements
 */

import React, { useState, useRef, useEffect } from 'react';
import { ContentRenderer, StatusRenderer, Button } from '../shared';

// ================================================================================
// Type Definitions
// ================================================================================

interface ArtifactVersion {
  id: string;
  version: number;
  content: string;
  type: 'text' | 'image' | 'search_results' | 'code';
  createdAt: Date;
  requestPrompt: string;
  isFollowUp: boolean; // true if this is an edit/refinement of previous version
}

interface ArtifactSession {
  id: string;
  title: string;
  initialPrompt: string;
  versions: ArtifactVersion[];
  createdAt: Date;
  lastModified: Date;
}

// ================================================================================
// Demo Components
// ================================================================================

// Top Dropdown for Artifact Selection
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

// Top Dropdown for Version Selection  
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

// Floating AI Actions (appears on content interaction)
const FloatingAIActions: React.FC<{
  isVisible: boolean;
  onEdit: () => void;
  onContinue: () => void;
  onRefine: () => void;
  onAnalyze: () => void;
}> = ({ isVisible, onEdit, onContinue, onRefine, onAnalyze }) => (
  <div className={`fixed right-6 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-40 ${
    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
  }`}>
    <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
      <div className="text-center mb-3">
        <div className="text-lg mb-1">🤖</div>
        <div className="text-xs text-white/80 font-medium">AI Assistant</div>
      </div>
      <div className="space-y-2">
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all text-sm"
        >
          <span>✏️</span>
          <span>Edit Content</span>
        </button>
        <button
          onClick={onContinue}
          className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all text-sm"
        >
          <span>➕</span>
          <span>Continue</span>
        </button>
        <button
          onClick={onRefine}
          className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all text-sm"
        >
          <span>✨</span>
          <span>Refine</span>
        </button>
        <button
          onClick={onAnalyze}
          className="w-full flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-all text-sm"
        >
          <span>🔍</span>
          <span>Analyze</span>
        </button>
      </div>
    </div>
  </div>
);

// Follow-up Actions (appears on scroll)
const ScrollFollowUpActions: React.FC<{
  isVisible: boolean;
  onQuickEdit: () => void;
  onAskQuestion: () => void;
  onSummarize: () => void;
}> = ({ isVisible, onQuickEdit, onAskQuestion, onSummarize }) => (
  <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-40 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
  }`}>
    <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-sm text-white/80 font-medium">Quick AI Actions</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onQuickEdit}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all text-sm"
          >
            <span>✏️</span>
            <span>Quick Edit</span>
          </button>
          <button
            onClick={onAskQuestion}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all text-sm"
          >
            <span>❓</span>
            <span>Ask</span>
          </button>
          <button
            onClick={onSummarize}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all text-sm"
          >
            <span>📝</span>
            <span>Summarize</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Compact Request Context
const RequestContext: React.FC<{
  prompt: string;
  isFollowUp: boolean;
  version: number;
}> = ({ prompt, isFollowUp, version }) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
        {isFollowUp ? `V${version} - Follow-up` : `V${version} - New Request`}
      </span>
      <span className="text-xs text-white/60">
        {isFollowUp ? '🔄 Edit' : '✨ Create'}
      </span>
    </div>
    <div className="text-sm text-white/80 italic">
      "{prompt}"
    </div>
  </div>
);

// Main artifact display area with interaction detection
const ArtifactDisplayArea: React.FC<{
  session: ArtifactSession;
  currentVersion: ArtifactVersion;
  onContentInteraction: (isInteracting: boolean) => void;
  onScroll: (isScrolling: boolean) => void;
}> = ({ session, currentVersion, onContentInteraction, onScroll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      onScroll(true);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        onScroll(false);
      }, 1000);
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [onScroll]);
  
  return (
    <div 
      className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-2xl overflow-hidden"
      onMouseEnter={() => onContentInteraction(true)}
      onMouseLeave={() => onContentInteraction(false)}
    >
      {/* Compact Header */}
      <div className="border-b border-white/10 p-4 bg-white/5 backdrop-blur-sm">
        <h3 className="text-lg font-medium text-white">{session.title}</h3>
      </div>

      {/* Request Context */}
      <div className="p-4 border-b border-white/10">
        <RequestContext
          prompt={currentVersion.requestPrompt}
          isFollowUp={currentVersion.isFollowUp}
          version={currentVersion.version}
        />
      </div>

      {/* Main Content Area - Scrollable */}
      <div 
        ref={scrollRef}
        className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar"
      >
        <ContentRenderer
          content={currentVersion.content}
          type={currentVersion.type}
          variant="widget"
          size="md"
          features={{
            markdown: true,
            copyButton: false,
            wordBreak: true
          }}
        />
      </div>

      {/* Footer with metadata */}
      <div className="border-t border-white/10 p-3 bg-white/5 backdrop-blur-sm">
        <div className="text-xs text-white/50 flex items-center justify-between">
          <div>
            Type: {currentVersion.type} • Size: {currentVersion.content.length} chars
          </div>
          <div>
            Created: {currentVersion.createdAt.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================================
// Main Demo Component
// ================================================================================

export const WidgetOutputDemo: React.FC = () => {
  // Mock data
  const [sessions] = useState<ArtifactSession[]>([
    {
      id: 'session-1',
      title: 'Blog Article: AI in Healthcare',
      initialPrompt: 'Write a comprehensive blog article about AI in healthcare',
      createdAt: new Date('2024-01-15T10:00:00'),
      lastModified: new Date('2024-01-15T10:45:00'),
      versions: [
        {
          id: 'v1',
          version: 1,
          content: '# AI in Healthcare\n\nArtificial Intelligence is revolutionizing healthcare by improving diagnostic accuracy, streamlining operations, and enabling personalized treatment plans. From medical imaging to drug discovery, AI technologies are transforming how we approach patient care...',
          type: 'text',
          createdAt: new Date('2024-01-15T10:00:00'),
          requestPrompt: 'Write a comprehensive blog article about AI in healthcare',
          isFollowUp: false
        },
        {
          id: 'v2',
          version: 2,
          content: '# AI in Healthcare: Transforming Patient Care\n\nArtificial Intelligence is revolutionizing healthcare by improving diagnostic accuracy, streamlining operations, and enabling personalized treatment plans. From medical imaging to drug discovery, AI technologies are transforming how we approach patient care.\n\n## Key Applications\n\n### Diagnostic Imaging\nAI-powered imaging systems can detect diseases like cancer, pneumonia, and retinal disorders with accuracy that often exceeds human specialists...',
          type: 'text',
          createdAt: new Date('2024-01-15T10:30:00'),
          requestPrompt: 'Add more sections about specific AI applications and include examples',
          isFollowUp: true
        },
        {
          id: 'v3',
          version: 3,
          content: '# AI in Healthcare: Transforming Patient Care\n\nArtificial Intelligence is revolutionizing healthcare by improving diagnostic accuracy, streamlining operations, and enabling personalized treatment plans. From medical imaging to drug discovery, AI technologies are transforming how we approach patient care.\n\n## Key Applications\n\n### Diagnostic Imaging\nAI-powered imaging systems can detect diseases like cancer, pneumonia, and retinal disorders with accuracy that often exceeds human specialists.\n\n### Drug Discovery\nMachine learning algorithms accelerate the drug discovery process by predicting molecular behavior and identifying promising compounds.\n\n### Clinical Decision Support\nAI systems assist healthcare providers by analyzing patient data and suggesting evidence-based treatment options.\n\n## Challenges and Considerations\n\nWhile AI offers tremendous potential, healthcare organizations must address concerns about data privacy, algorithm bias, and the need for human oversight...',
          type: 'text',
          createdAt: new Date('2024-01-15T10:45:00'),
          requestPrompt: 'Add a challenges section and make the tone more professional',
          isFollowUp: true
        }
      ]
    },
    {
      id: 'session-2',
      title: 'Product Search Results',
      initialPrompt: 'Search for eco-friendly phone cases',
      createdAt: new Date('2024-01-15T11:00:00'),
      lastModified: new Date('2024-01-15T11:15:00'),
      versions: [
        {
          id: 'search-v1',
          version: 1,
          content: JSON.stringify([
            {
              title: 'Pela Eco-Friendly Phone Case',
              description: 'Made from plant-based materials, completely biodegradable phone case that provides excellent protection.',
              url: 'https://pelacase.com',
              price: '$39.95'
            },
            {
              title: 'Nimble Eco Case',
              description: 'Sustainable phone case made from recycled materials with wireless charging compatibility.',
              url: 'https://nimblecase.com',
              price: '$29.99'
            }
          ]),
          type: 'search_results',
          createdAt: new Date('2024-01-15T11:00:00'),
          requestPrompt: 'Search for eco-friendly phone cases',
          isFollowUp: false
        },
        {
          id: 'search-v2',
          version: 2,
          content: JSON.stringify([
            {
              title: 'Pela Eco-Friendly Phone Case',
              description: 'Made from plant-based materials, completely biodegradable phone case that provides excellent protection.',
              url: 'https://pelacase.com',
              price: '$39.95',
              rating: '4.8/5'
            },
            {
              title: 'Nimble Eco Case',
              description: 'Sustainable phone case made from recycled materials with wireless charging compatibility.',
              url: 'https://nimblecase.com',
              price: '$29.99',
              rating: '4.6/5'
            },
            {
              title: 'Bamboo Phone Case by BambuCases',
              description: 'Handcrafted bamboo cases that are naturally antimicrobial and lightweight.',
              url: 'https://bambucases.com',
              price: '$24.99',
              rating: '4.5/5'
            }
          ]),
          type: 'search_results',
          createdAt: new Date('2024-01-15T11:15:00'),
          requestPrompt: 'Add more results and include ratings and reviews',
          isFollowUp: true
        }
      ]
    }
  ]);

  const [currentSessionId, setCurrentSessionId] = useState(sessions[0].id);
  const [currentVersionId, setCurrentVersionId] = useState(sessions[0].versions[sessions[0].versions.length - 1].id);
  
  // Floating UI state
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [showScrollActions, setShowScrollActions] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId)!;
  const currentVersion = currentSession.versions.find(v => v.id === currentVersionId)!;

  // AI Action handlers
  const handleEdit = () => alert('AI Edit: Open content editor with current text');
  const handleContinue = () => alert('AI Continue: Add more content to current section');
  const handleRefine = () => alert('AI Refine: Improve writing style and clarity');
  const handleAnalyze = () => alert('AI Analyze: Provide insights about the content');
  const handleQuickEdit = () => alert('Quick Edit: Fast AI-powered editing');
  const handleAskQuestion = () => alert('Ask AI: Get answers about the content');
  const handleSummarize = () => alert('Summarize: AI-generated summary');

  // Update version when session changes
  useEffect(() => {
    const newCurrentSession = sessions.find(s => s.id === currentSessionId);
    if (newCurrentSession) {
      setCurrentVersionId(newCurrentSession.versions[newCurrentSession.versions.length - 1].id);
    }
  }, [currentSessionId, sessions]);

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        {/* Demo Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Widget Output Area - Compact Design
          </h1>
          <p className="text-white/70">
            Compact layout with top dropdowns, floating AI actions, and scroll-triggered features.
          </p>
        </div>

        {/* Top Control Bar - Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ArtifactDropdown
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionChange={setCurrentSessionId}
          />
          <VersionDropdown
            versions={currentSession.versions}
            currentVersionId={currentVersionId}
            onVersionChange={setCurrentVersionId}
          />
        </div>

        {/* Main Content Area */}
        <ArtifactDisplayArea
          session={currentSession}
          currentVersion={currentVersion}
          onContentInteraction={setShowFloatingActions}
          onScroll={setShowScrollActions}
        />

        {/* Demo Info */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">New Features:</h3>
          <ul className="text-white/80 text-sm space-y-1">
            <li>• <strong>Top Dropdowns:</strong> Space-saving artifact and version selection</li>
            <li>• <strong>Floating AI Actions:</strong> Hover over content to reveal AI tools</li>
            <li>• <strong>Scroll Follow-up:</strong> Scroll content to see quick AI actions</li>
            <li>• <strong>Glassmorphism UI:</strong> Beautiful transparent floating elements</li>
            <li>• <strong>Compact Layout:</strong> Maximum content display area</li>
            <li>• <strong>Interactive Design:</strong> Content interaction triggers AI features</li>
          </ul>
        </div>
      </div>

      {/* Floating AI Actions - Right Side */}
      <FloatingAIActions
        isVisible={showFloatingActions}
        onEdit={handleEdit}
        onContinue={handleContinue}
        onRefine={handleRefine}
        onAnalyze={handleAnalyze}
      />

      {/* Scroll Follow-up Actions - Bottom */}
      <ScrollFollowUpActions
        isVisible={showScrollActions}
        onQuickEdit={handleQuickEdit}
        onAskQuestion={handleAskQuestion}
        onSummarize={handleSummarize}
      />
    </div>
  );
};