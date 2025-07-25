import React from 'react';
import { AppArtifact } from '../../../types/appTypes';

/**
 * Pure UI component for displaying artifacts
 * Only handles rendering - no hooks, no state, no business logic
 */
export interface ArtifactComponentProps {
  artifact: AppArtifact;
  onReopen: () => void;
}

export const ArtifactComponent: React.FC<ArtifactComponentProps> = ({ artifact, onReopen }) => {
  return (
    <div className="my-4 max-w-sm mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-t-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{artifact.appIcon}</span>
          <div>
            <h3 className="font-medium text-white text-sm">{artifact.title}</h3>
            <p className="text-xs text-white/60">{artifact.appName}</p>
          </div>
        </div>
        <button
          onClick={onReopen}
          className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-blue-300 text-xs transition-all"
        >
          ↗️ Open
        </button>
      </div>
      
      {/* Content Area */}
      <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 border-t-0 rounded-b-xl p-3">
        {artifact.generatedContent && (
          <>
            {/* Image content - Compact Thumbnail */}
            {artifact.generatedContent.type === 'image' && (
              <div>
                <div className="group relative cursor-pointer mb-2" onClick={() => window.open(artifact.generatedContent!.content, '_blank')}>
                  <img
                    src={artifact.generatedContent.content}
                    alt="Generated content"
                    className="w-20 h-20 object-cover rounded-lg shadow-md group-hover:opacity-90 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs bg-black/70 px-2 py-1 rounded">🔍 View full size</span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-1 mb-2">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = artifact.generatedContent!.content;
                      link.download = `artifact-${artifact.id}.jpg`;
                      link.click();
                    }}
                    className="flex-1 py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                  >
                    💾 Save
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(artifact.generatedContent!.content)}
                    className="flex-1 py-1 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs rounded transition-all"
                  >
                    📋 Copy URL
                  </button>
                </div>
                
              </div>
            )}
            
            {/* Text content - Compact */}
            {artifact.generatedContent.type === 'text' && (
              <div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/10 mb-2">
                  <div className="text-white/60 text-xs mb-1">Content Preview:</div>
                  <div className="text-white/80 text-xs leading-relaxed">
                    {artifact.generatedContent.content.length > 120 
                      ? artifact.generatedContent.content.substring(0, 120) + '...'
                      : artifact.generatedContent.content
                    }
                  </div>
                  {artifact.generatedContent.content.length > 120 && (
                    <div className="text-xs text-blue-400 mt-1">Click "Open" to view full content</div>
                  )}
                </div>
                
                {/* Quick Actions for Text */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => navigator.clipboard.writeText(artifact.generatedContent!.content)}
                    className="flex-1 py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                  >
                    📋 Copy
                  </button>
                  {artifact.generatedContent.metadata?.wordCount && (
                    <div className="py-1 px-2 bg-white/10 text-white/60 text-xs rounded">
                      {artifact.generatedContent.metadata.wordCount} words
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 text-xs text-white/40">
        Created: {new Date(artifact.createdAt).toLocaleString()}
      </div>
    </div>
  );
};