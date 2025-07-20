import React from 'react';
import { MessageHandlerParams, MessageRendererParams, AppArtifact } from '../../types/app_types';

/**
 * Artifact Manager
 * Responsible for handling artifact creation, rendering and management
 */
export class ArtifactManager {
  /**
   * Handle received messages, check if we need to create artifact
   */
  static handleMessage(params: MessageHandlerParams): void {
    const { 
      message, 
      currentApp, 
      showRightSidebar, 
      triggeredAppInput, 
      artifacts, 
      setPendingArtifact 
    } = params;

    console.log('📥 ARTIFACT: Message received:', {
      role: message.role,
      content: message.content?.substring(0, 100) + '...',
      currentApp,
      showRightSidebar
    });

    // Handle AI assistant messages - check if we need to create artifact
    if (message.role === 'assistant' && message.content) {
      // Handle Dream app - simplified (create artifact for any AI response)
      if (showRightSidebar && currentApp === 'dream' && message.id && !message.processed) {
        console.log('🎨 ARTIFACT: Dream app active - creating artifact for AI response');
        
        // Check if artifact already exists for this message ID
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.metadata?.messageId === message.id
        );

        if (!existingArtifact && message.content?.length > 10) {
          console.log('📋 ARTIFACT: Setting pending artifact for dream generation');
          message.processed = true; // Mark as processed to prevent reprocessing
          setPendingArtifact({
            imageUrl: 'https://via.placeholder.com/400x300/4F46E5/white?text=Generated+Content', // Placeholder
            userInput: triggeredAppInput || 'Image generation',
            timestamp: Date.now(),
            aiResponse: message.content,
            messageId: message.id // Store the AI response
          });
        }
      }

      // Handle text content for Omni app
      if (showRightSidebar && currentApp === 'omni' && message.content.length > 50) {
        console.log('⚡ ARTIFACT: Text content with omni app active');
        
        // Check if artifact already exists for this content
        const existingArtifact = artifacts.find(a => 
          a.generatedContent?.content === message.content
        );

        if (!existingArtifact) {
          console.log('📋 ARTIFACT: Setting pending text artifact');
          setPendingArtifact({
            textContent: message.content,
            userInput: triggeredAppInput || 'Content generation',
            timestamp: Date.now()
          });
        }
      }

    }
  }

  /**
   * Render messages, check if we need to display artifact
   */
  static renderMessage(params: MessageRendererParams): React.ReactElement | null {
    const { message, artifacts, reopenApp } = params;

    console.log('🔍 ARTIFACT: Rendering message:', {
      role: message.role,
      content: message.content?.substring(0, 50) + '...',
      artifactsCount: artifacts.length
    });

    // Handle user messages - check if there's a corresponding artifact
    if (message.role === 'user' && message.content) {
      const matchingArtifact = artifacts.find(artifact => 
        artifact.userInput === message.content
      );

      console.log('🔍 ARTIFACT: User message - checking for artifact:', !!matchingArtifact);

      if (matchingArtifact) {
        console.log('✅ ARTIFACT: Found artifact for user message, rendering');

        return (
          <div key={message.id}>
            {/* User message */}
            <div className="mb-4 flex gap-4 justify-end">
              <div className="max-w-2xl order-first">
                <div className="p-4 rounded-2xl bg-blue-500 text-white">
                  {message.content}
                </div>
                <div className="text-xs text-white/50 mt-1 text-right">
                  {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                👤
              </div>
            </div>
            
            {/* Artifact component */}
            <div className="mb-6 isa-artifact-fadeIn">
              <ArtifactComponent
                artifact={matchingArtifact}
                onReopen={() => reopenApp(matchingArtifact.id)}
              />
            </div>
          </div>
        );
      } else {
        // Render regular user message without artifact
        console.log('📝 ARTIFACT: No artifact, rendering regular user message');
        return (
          <div key={message.id} className="mb-4 flex gap-4 justify-end">
            <div className="max-w-2xl order-first">
              <div className="p-4 rounded-2xl bg-blue-500 text-white">
                {message.content}
              </div>
              <div className="text-xs text-white/50 mt-1 text-right">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              👤
            </div>
          </div>
        );
      }
    }

    // Handle assistant messages
    if (message.role === 'assistant' && message.content) {
      console.log('🤖 ARTIFACT: Rendering assistant message');
      return (
        <div key={message.id} className="mb-4 flex gap-4 justify-start">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            🤖
          </div>
          <div className="max-w-2xl">
            <div className="p-4 rounded-2xl bg-gray-700 text-white">
              {message.content}
            </div>
            <div className="text-xs text-white/50 mt-1">
              {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    }

    return null; // Fallback
  }
}

/**
 * Artifact Component
 */
const ArtifactComponent: React.FC<{
  artifact: AppArtifact;
  onReopen: () => void;
}> = ({ artifact, onReopen }) => {
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