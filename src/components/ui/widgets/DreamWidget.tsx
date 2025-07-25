/**
 * ============================================================================
 * Dream Widget UI (DreamWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Atomic Image Intelligence Service interface using standardized BaseWidget layout
 * - 9 image processing modes with smart mode detection
 * - File upload and image editing functionality
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in image output history management
 * - Consistent edit and management actions for images
 * - Streaming status display support for generation progress
 * - Image-specific actions (download, share, transform)
 */
import React, { useState } from 'react';
import { DreamWidgetParams } from '../../../types/widgetTypes';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

// Atomic Image Intelligence Service modes (copied from dream_sidebar.tsx)
interface ImageMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: string;
  estimatedTime: string;
  useCase: string;
  keywords: string[];
  requiresImage: boolean;
}

const imageModes: ImageMode[] = [
  {
    id: 'text_to_image',
    name: 'Create from Text',
    description: 'Generate entirely new images from your description',
    icon: '✨',
    cost: '$3/1000 images',
    estimatedTime: '10-15 seconds',
    useCase: 'Perfect for: Artwork, concepts, creative ideas',
    keywords: ['create', 'generate', 'new', 'imagine', 'design', 'art'],
    requiresImage: false
  },
  {
    id: 'image_to_image',
    name: 'Transform Image',
    description: 'Modify an existing image based on your description',
    icon: '🔄',
    cost: '$0.04/image',
    estimatedTime: '15-20 seconds',
    useCase: 'Perfect for: Editing, variations, improvements',
    keywords: ['modify', 'change', 'edit', 'transform', 'improve'],
    requiresImage: true
  },
  {
    id: 'style_transfer',
    name: 'Change Style',
    description: 'Apply artistic styles to your images',
    icon: '🎨',
    cost: '$0.04/image',
    estimatedTime: '15-20 seconds',
    useCase: 'Perfect for: Artistic effects, style matching',
    keywords: ['style', 'artistic', 'painting', 'effect', 'filter'],
    requiresImage: true
  },
  {
    id: 'sticker_generation',
    name: 'Make Stickers',
    description: 'Create fun stickers from images or text',
    icon: '🏷️',
    cost: '$0.0024/image',
    estimatedTime: '10 seconds',
    useCase: 'Perfect for: Chat stickers, emojis, fun graphics',
    keywords: ['sticker', 'emoji', 'cute', 'cartoon', 'fun'],
    requiresImage: false
  },
  {
    id: 'face_swap',
    name: 'Swap Faces',
    description: 'Replace faces in images naturally',
    icon: '👥',
    cost: '$0.04/image',
    estimatedTime: '20-25 seconds',
    useCase: 'Perfect for: Fun photos, character changes',
    keywords: ['face', 'swap', 'replace', 'person', 'character'],
    requiresImage: true
  },
  {
    id: 'professional_headshot',
    name: 'Pro Headshots',
    description: 'Create professional headshots from casual photos',
    icon: '👔',
    cost: '$0.04/image',
    estimatedTime: '20-25 seconds',
    useCase: 'Perfect for: LinkedIn, resumes, business cards',
    keywords: ['professional', 'headshot', 'business', 'linkedin', 'formal'],
    requiresImage: true
  },
  {
    id: 'photo_inpainting',
    name: 'Remove Objects',
    description: 'Remove unwanted objects or fill in missing parts',
    icon: '🔧',
    cost: '$0.04/image',
    estimatedTime: '15-20 seconds',
    useCase: 'Perfect for: Photo cleanup, object removal',
    keywords: ['remove', 'erase', 'clean', 'fix', 'repair', 'fill'],
    requiresImage: true
  },
  {
    id: 'photo_outpainting',
    name: 'Extend Images',
    description: 'Expand image boundaries with AI-generated content',
    icon: '📐',
    cost: '$0.04/image',
    estimatedTime: '20-25 seconds',
    useCase: 'Perfect for: Expanding scenes, changing aspect ratios',
    keywords: ['extend', 'expand', 'widen', 'enlarge', 'border'],
    requiresImage: true
  },
  {
    id: 'emoji_generation',
    name: 'Custom Emojis',
    description: 'Generate custom emoji-style images',
    icon: '😊',
    cost: '$0.0024/image',
    estimatedTime: '8-10 seconds',
    useCase: 'Perfect for: Custom reactions, brand emojis',
    keywords: ['emoji', 'reaction', 'expression', 'custom', 'face'],
    requiresImage: false
  }
];

// Smart mode detection based on user input (exact copy from dream_sidebar.tsx)
const detectBestMode = (input: string, hasImage: boolean): ImageMode => {
  const lowerInput = input.toLowerCase();
  
  // Find modes that match keywords and image requirements
  const possibleModes = imageModes.filter(mode => {
    const keywordMatch = mode.keywords.some(keyword => lowerInput.includes(keyword));
    const imageRequirementMet = !mode.requiresImage || hasImage;
    return keywordMatch && imageRequirementMet;
  });
  
  // Return best match or default to text-to-image
  return possibleModes[0] || imageModes[0];
};

interface DreamWidgetProps {
  isGenerating: boolean;
  generatedImage: string | null;
  lastParams: DreamWidgetParams | null;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onGenerateImage: (params: DreamWidgetParams) => Promise<void>;
  onClearImage: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
}

/**
 * Dream Widget Input Area - Content that goes inside BaseWidget
 */
const DreamInputArea: React.FC<DreamWidgetProps> = ({
  isGenerating,
  generatedImage,
  lastParams,
  triggeredInput,
  onGenerateImage,
  onClearImage
}) => {
  // Modern state management (copied from dream_sidebar.tsx)
  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<ImageMode>(imageModes[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Real-time mode recommendations (exact copy from dream_sidebar.tsx)
  React.useEffect(() => {
    if (prompt.trim()) {
      const bestMode = detectBestMode(prompt, !!uploadedImage);
      if (bestMode.id !== selectedMode.id) {
        setSelectedMode(bestMode);
        console.log('🎨 Mode recommendation updated:', bestMode.id);
      }
    }
  }, [prompt, uploadedImage, selectedMode.id]);

  // Handle image processing (adapted from dream_sidebar.tsx)
  const handleImageProcessing = async () => {
    if (!prompt.trim() || !onGenerateImage || isGenerating) return;
    
    // Check if mode requires image but none is uploaded
    if (selectedMode.requiresImage && !uploadedImage) {
      alert(`${selectedMode.name} requires an uploaded image. Please upload an image first.`);
      return;
    }

    console.log('🎨 Starting image processing with mode:', selectedMode.name);
    
    try {
      const params: DreamWidgetParams = {
        prompt: prompt,
        style: selectedMode.id,
        size: '1024x1024',
        quality: 'high'
      };
      
      await onGenerateImage(params);
      
      console.log('🚀 Image processing request sent with mode:', selectedMode.name);
    } catch (error) {
      console.error('Image processing failed:', error);
    }
  };

  // Handle file upload with smart mode detection (exact copy from dream_sidebar.tsx)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log('🎨 Image file uploaded:', file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        
        // Update mode recommendation based on having an image
        if (prompt.trim()) {
          const bestMode = detectBestMode(prompt, true);
          setSelectedMode(bestMode);
          console.log('🎨 Mode updated after image upload:', bestMode.id);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 p-3">
      {/* Compact Mode Header */}
      <div className="flex items-center gap-3 p-2 bg-purple-500/10 rounded border border-purple-500/20">
        <span className="text-lg">{selectedMode.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{selectedMode.name}</div>
          <div className="flex gap-3 text-xs text-white/50">
            <span>{selectedMode.cost}</span>
            <span>{selectedMode.estimatedTime}</span>
          </div>
        </div>
      </div>

      {/* Compact Input Area */}
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== prompt) {
              console.log('🎨 Prompt text changed');
            }
            setPrompt(newValue);
          }}
          placeholder={selectedMode.requiresImage 
            ? `Describe changes for ${selectedMode.name.toLowerCase()}...`
            : "Describe what you want to create..."}
          className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none text-sm"
          rows={2}
        />

        {/* Compact Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`flex items-center gap-2 w-full p-2 border border-dashed rounded cursor-pointer transition-all text-sm ${
            selectedMode.requiresImage 
              ? 'border-orange-500/50 bg-orange-500/5 hover:border-orange-500' 
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          {uploadedImage ? (
            <>
              <img src={uploadedImage} alt="Uploaded" className="w-6 h-6 object-cover rounded" />
              <span className="text-white/70 text-xs">Image uploaded</span>
            </>
          ) : (
            <>
              <span>📷</span>
              <span className={selectedMode.requiresImage ? 'text-orange-300' : 'text-white/60'}>
                {selectedMode.requiresImage ? 'Required' : 'Optional'}
              </span>
            </>
          )}
        </label>
      </div>

      {/* Compact Mode Selector */}
      <div>
        <div className="text-xs text-white/60 mb-2">🎯 Modes</div>
        <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
          {imageModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode);
                console.log('🎨 Mode selected:', mode.name);
              }}
              disabled={mode.requiresImage && !uploadedImage}
              className={`p-2 rounded border transition-all text-center ${
                selectedMode.id === mode.id
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : mode.requiresImage && !uploadedImage
                    ? 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
              }`}
              title={`${mode.name} - ${mode.description} (${mode.cost}, ${mode.estimatedTime})`}
            >
              <div className="text-sm mb-1">{mode.icon}</div>
              <div className="text-xs font-medium truncate">{mode.name}</div>
              <div className="text-xs text-white/40">{mode.cost}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Process Button */}
      <button
        onClick={handleImageProcessing}
        disabled={isGenerating || !prompt.trim() || (selectedMode.requiresImage && !uploadedImage)}
        className={`w-full p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded text-white font-medium transition-all hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2 text-sm ${
          isGenerating ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGenerating ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <span>{selectedMode.icon}</span>
            Start
          </>
        )}
      </button>

      {/* Compact Quick Ideas */}
      <div>
        <div className="text-xs text-white/60 mb-2">💡 Quick Ideas</div>
        <div className="grid grid-cols-1 gap-1">
          <button 
            onClick={() => {
              setPrompt("A majestic mountain landscape at golden hour");
              setSelectedMode(imageModes[0]);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🏔️ Mountain landscape
          </button>
          <button 
            onClick={() => {
              setPrompt("Transform this into a cyberpunk style");
              setSelectedMode(imageModes[2]);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            🌃 Cyberpunk style
          </button>
          <button 
            onClick={() => {
              setPrompt("Make this look professional for LinkedIn");
              setSelectedMode(imageModes[5]);
            }}
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 hover:text-white transition-all text-left"
          >
            👔 Professional headshot
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Dream Widget with BaseWidget - New standardized layout
 */
export const DreamWidget: React.FC<DreamWidgetProps> = ({
  isGenerating,
  generatedImage,
  lastParams,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onGenerateImage,
  onClearImage,
  onSelectOutput,
  onClearHistory
}) => {
  
  // Custom edit actions for generated images
  const editActions: EditAction[] = [
    {
      id: 'download',
      label: 'Download',
      icon: '💾',
      onClick: (content) => {
        if (typeof content === 'string' && content.startsWith('data:') || content.startsWith('http')) {
          const link = document.createElement('a');
          link.href = content;
          link.download = `dream-${Date.now()}.jpg`;
          link.click();
        }
      }
    },
    {
      id: 'open',
      label: 'View',
      icon: '🔍',
      onClick: (content) => {
        if (typeof content === 'string' && (content.startsWith('data:') || content.startsWith('http'))) {
          window.open(content, '_blank');
        }
      }
    },
    {
      id: 'copy',
      label: 'Copy URL',
      icon: '📋',
      onClick: (content) => {
        if (typeof content === 'string') {
          navigator.clipboard.writeText(content);
        }
      }
    }
  ];

  // Custom management actions for image generation
  const managementActions: ManagementAction[] = [
    {
      id: 'text_to_image',
      label: 'Create',
      icon: '✨',
      onClick: () => onGenerateImage({ 
        prompt: "A beautiful landscape", 
        style: 'text_to_image', 
        size: '1024x1024', 
        quality: 'high' 
      }),
      disabled: isGenerating
    },
    {
      id: 'transform',
      label: 'Transform',
      icon: '🔄',
      onClick: () => {
        if (generatedImage) {
          onGenerateImage({ 
            prompt: "Transform this image", 
            style: 'image_to_image', 
            size: '1024x1024', 
            quality: 'high' 
          });
        }
      },
      disabled: isGenerating || !generatedImage
    },
    {
      id: 'style',
      label: 'Style',
      icon: '🎨',
      onClick: () => {
        if (generatedImage) {
          onGenerateImage({ 
            prompt: "Change the style of this image", 
            style: 'style_transfer', 
            size: '1024x1024', 
            quality: 'high' 
          });
        }
      },
      disabled: isGenerating || !generatedImage
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearImage();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isGenerating
    }
  ];

  return (
    <BaseWidget
      isProcessing={isGenerating}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
    >
      <DreamInputArea
        isGenerating={isGenerating}
        generatedImage={generatedImage}
        lastParams={lastParams}
        triggeredInput={triggeredInput}
        onGenerateImage={onGenerateImage}
        onClearImage={onClearImage}
      />
    </BaseWidget>
  );
};