import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface OmniSidebarProps {
  triggeredInput?: string;
}

/**
 * Omni Content Generator Sidebar
 * Multi-purpose content creation app
 */
export const OmniSidebar: React.FC<OmniSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [selectedContentType, setSelectedContentType] = useState('text');
  const [generationInput, setGenerationInput] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium (300-800 words)');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-fill input when triggered
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== generationInput) {
      setGenerationInput(triggeredInput);
    }
  }, [triggeredInput]);

  const contentTypes = [
    { id: 'text', title: 'Text & Copy', icon: '📝', description: 'Articles, blogs, marketing copy' },
    { id: 'email', title: 'Email', icon: '✉️', description: 'Professional emails, newsletters' },
    { id: 'social', title: 'Social Media', icon: '📱', description: 'Posts, captions, hashtags' },
    { id: 'script', title: 'Scripts', icon: '🎬', description: 'Video scripts, presentations' },
  ];

  const handleGenerate = async (inputText?: string) => {
    const textToUse = inputText || generationInput;
    console.log('⚡ OMNI: handleGenerate called', { inputText, generationInput, textToUse, type: typeof textToUse });
    
    if (!textToUse || typeof textToUse !== 'string' || !textToUse.trim() || !client || isGenerating) {
      console.log('⚡ OMNI: Aborting generation - invalid input');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate ${selectedContentType} content with ${tone} tone, ${length} length: ${textToUse}`;
      console.log('⚡ OMNI: Generating content:', prompt);
      await client.sendMessage(prompt, { 
        sender: 'omni-app', 
        requestId: `omni-${Date.now()}`,
        contentType: selectedContentType,
        tone: tone,
        length: length,
        generationPrompt: textToUse,
        outputFormat: selectedContentType === 'social' ? 'post_with_hashtags' : 'formatted_text'
      });
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Type Selector */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">📝 Content Type</h3>
        <div className="space-y-2">
          {contentTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setSelectedContentType(type.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedContentType === type.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{type.icon}</span>
                <div>
                  <div className="font-medium">{type.title}</div>
                  <div className="text-xs opacity-60">{type.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Input */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">💭 What do you want to create?</h3>
        <textarea
          value={generationInput}
          onChange={(e) => setGenerationInput(e.target.value)}
          placeholder="E.g., Write a blog post about sustainable living tips"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">🎭 Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Friendly">Friendly</option>
            <option value="Authoritative">Authoritative</option>
            <option value="Playful">Playful</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">📏 Length</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="Short (100-300 words)">Short (100-300 words)</option>
            <option value="Medium (300-800 words)">Medium (300-800 words)</option>
            <option value="Long (800-1500 words)">Long (800-1500 words)</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => handleGenerate()}
        disabled={isGenerating || !generationInput.trim()}
        className={`w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium cursor-pointer transition-all hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2 ${
          isGenerating ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span>⚡</span>
        <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
      </button>

      {/* Tips */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-2">💡 Tips</h4>
        <ul className="text-xs text-white/60 space-y-1">
          <li>• Be specific about your target audience</li>
          <li>• Include key points you want to cover</li>
          <li>• Generated content will appear in the chat</li>
        </ul>
      </div>
    </div>
  );
};