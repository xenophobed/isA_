import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    <div className="my-4 max-w-sm">
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
      <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 border-t-0 rounded-b-xl p-3 min-h-[100px]">
        {artifact.generatedContent && (
          <>
            {/* Loading state */}
            {artifact.generatedContent.content === 'Loading...' && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white/70 text-sm">Loading...</span>
                </div>
              </div>
            )}
            
            {/* Image content - Compact Thumbnail */}
            {artifact.generatedContent.type === 'image' && artifact.generatedContent.content !== 'Loading...' && (
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
            
            {/* Search Results content with Markdown Support */}
            {artifact.generatedContent.type === 'search_results' && artifact.generatedContent.content !== 'Loading...' && (
              <div>
                {Array.isArray(artifact.generatedContent.content) && artifact.generatedContent.content.length > 0 ? (
                  <div className="space-y-3">
                    {artifact.generatedContent.content.map((result, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        {/* Result Title */}
                        {result.title && (
                          <h3 className="text-sm font-medium text-white mb-2">
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
                        
                        {/* Result Content with Markdown Rendering - Compact Preview */}
                        {result.content && (
                          <div>
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({children}) => <h1 className="text-base font-bold text-white mb-2">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-sm font-semibold text-white mb-2">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-xs font-medium text-white mb-1">{children}</h3>,
                                  p: ({children}) => <p className="text-white/80 text-xs leading-relaxed mb-2">{children}</p>,
                                  ul: ({children}) => <ul className="list-disc list-inside text-white/80 text-xs space-y-1 mb-2 ml-2">{children}</ul>,
                                  ol: ({children}) => <ol className="list-decimal list-inside text-white/80 text-xs space-y-1 mb-2 ml-2">{children}</ol>,
                                  li: ({children}) => <li className="text-white/80 text-xs">{children}</li>,
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
                                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-2">
                                      {children}
                                    </pre>
                                  ),
                                  blockquote: ({children}) => (
                                    <blockquote className="border-l-2 border-blue-500 pl-2 text-white/70 italic text-xs mb-2">
                                      {children}
                                    </blockquote>
                                  ),
                                  strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                  em: ({children}) => <em className="italic text-white/90">{children}</em>
                                }}
                              >
                                {result.content.length > 300 ? result.content.substring(0, 300) + '...' : result.content}
                              </ReactMarkdown>
                            </div>
                            {result.content.length > 300 && (
                              <div className="text-xs text-blue-400 mt-1">Click "Open" to view full content</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm text-center py-4">
                    No search results found
                  </div>
                )}
              </div>
            )}
            
            {/* Text content - Markdown Rendered */}
            {artifact.generatedContent.type === 'text' && artifact.generatedContent.content !== 'Loading...' && (
              <div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/10 mb-2 max-h-96 overflow-y-auto">
                  <div className="text-white/60 text-xs mb-2">Content:</div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom styling for markdown elements
                        h1: ({children}) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium text-white mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-white/80 text-xs leading-relaxed mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-white/80 text-xs space-y-1 mb-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-white/80 text-xs space-y-1 mb-2">{children}</ol>,
                        li: ({children}) => <li className="text-white/80 text-xs">{children}</li>,
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
                          <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-blue-500 pl-2 text-white/70 italic text-xs mb-2">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>
                      }}
                    >
                      {artifact.generatedContent.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Quick Actions for Text */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => navigator.clipboard.writeText(artifact.generatedContent!.content)}
                    className="flex-1 py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                  >
                    📋 Copy
                  </button>
                  <button 
                    onClick={() => {
                      const words = artifact.generatedContent!.content.split(/\s+/).length;
                      alert(`Word count: ${words} words`);
                    }}
                    className="py-1 px-2 bg-white/10 text-white/60 text-xs rounded hover:bg-white/20 transition-all"
                  >
                    📊 Stats
                  </button>
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