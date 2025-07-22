import React, { useState } from 'react';
import { BaseSidebar } from '../components/ui/BaseSidebar';
import { useAppStore } from '../stores/useAppStore';
import { logger, LogCategory } from '../utils/logger';

interface DreamSidebarProps {
  triggeredInput?: string;
  generatedImage?: string | null;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

// Atomic Image Intelligence Service modes
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

// Smart mode detection based on user input
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

interface BaseSidebarInjectedProps {
  isProcessing?: boolean;
  error?: string | null;
  result?: any;
  onProcess?: (input: string, templateParams?: any, metadata?: any) => Promise<void>;
  onReset?: () => void;
  client?: any;
}

type DreamContentProps = BaseSidebarInjectedProps;

const DreamContent: React.FC<DreamContentProps> = ({
  isProcessing,
  result,
  onProcess
}) => {
  // Use app store for state management
  const { 
    dream: dreamState,
    setDreamGeneratedImage,
  } = useAppStore();
  
  // Modern state management
  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<ImageMode>(imageModes[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [localGeneratedImage, setLocalGeneratedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [workflowStage, setWorkflowStage] = useState<string>('');

  // Restore generated image from global state when component mounts or reopens
  React.useEffect(() => {
    if (dreamState.generatedImage) {
      console.log('🎨 Restoring generated image from global state:', dreamState.generatedImage);
      setLocalGeneratedImage(dreamState.generatedImage);
    }
  }, [dreamState.generatedImage]);

  // Real-time mode recommendations
  React.useEffect(() => {
    if (prompt.trim()) {
      const bestMode = detectBestMode(prompt, !!uploadedImage);
      if (bestMode.id !== selectedMode.id) {
        setSelectedMode(bestMode);
        logger.debug(LogCategory.USER_INPUT, 'Mode recommendation updated', {
          newMode: bestMode.id,
          previousMode: selectedMode.id
        });
      }
    }
  }, [prompt, uploadedImage, selectedMode.id]);

  // Handle result updates
  React.useEffect(() => {
    if (result) {
      console.log('🎨 AtomicImageIntelligence: Received response:', result);
      
      // Extract image URL from response content (markdown with JSON code block)
      let imageUrl = null;
      try {
        if (result.content) {
          // Extract JSON from markdown code block ```json ... ```
          const jsonMatch = result.content.match(/```json\s*\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const jsonContent = jsonMatch[1];
            const parsed = JSON.parse(jsonContent);
            
            if (parsed.media_items && parsed.media_items.length > 0) {
              const imageItem = parsed.media_items.find((item: any) => item.type === 'image');
              if (imageItem && imageItem.url) {
                imageUrl = imageItem.url;
                console.log('🖼️ AtomicImageIntelligence: Image URL extracted from markdown JSON:', imageUrl);
              }
            }
          } else {
            // Fallback: try parsing content directly as JSON
            const parsed = JSON.parse(result.content);
            if (parsed.media_items && parsed.media_items.length > 0) {
              const imageItem = parsed.media_items.find((item: any) => item.type === 'image');
              if (imageItem && imageItem.url) {
                imageUrl = imageItem.url;
                console.log('🖼️ AtomicImageIntelligence: Image URL extracted from direct JSON:', imageUrl);
              }
            }
          }
        }
        
        // Fallback: check metadata for media_items (old format)
        if (!imageUrl && result.metadata?.media_items) {
          const imageItem = result.metadata.media_items.find((item: any) => item.type === 'image');
          if (imageItem && imageItem.url) {
            imageUrl = imageItem.url;
            console.log('🖼️ AtomicImageIntelligence: Image URL found in metadata:', imageUrl);
          }
        }
      } catch (e) {
        console.log('🔍 Failed to parse content, checking metadata for image URL');
        // Fallback: check metadata for media_items
        if (result.metadata?.media_items) {
          const imageItem = result.metadata.media_items.find((item: any) => item.type === 'image');
          if (imageItem && imageItem.url) {
            imageUrl = imageItem.url;
            console.log('🖼️ AtomicImageIntelligence: Image URL found in metadata:', imageUrl);
          }
        }
      }
      
      if (imageUrl) {
        // Update local state
        setLocalGeneratedImage(imageUrl);
        
        // Update centralized store
        setDreamGeneratedImage(imageUrl);
        
        console.log('✅ AtomicImageIntelligence: Processing complete');
      }
    }
  }, [result, setDreamGeneratedImage]);

  // Handle image processing with Atomic Image Intelligence
  const handleImageProcessing = async () => {
    if (!prompt.trim() || !onProcess || isProcessing) return;
    
    // Check if mode requires image but none is uploaded
    if (selectedMode.requiresImage && !uploadedImage) {
      alert(`${selectedMode.name} requires an uploaded image. Please upload an image first.`);
      return;
    }

    logger.startTrace('ATOMIC_IMAGE_PROCESSING');
    logger.info(LogCategory.USER_INPUT, 'Starting Atomic Image Intelligence processing', {
      promptLength: prompt.length,
      modeId: selectedMode.id,
      modeName: selectedMode.name,
      hasUploadedImage: !!uploadedImage,
      estimatedCost: selectedMode.cost
    });

    setProcessingStatus(`Processing with ${selectedMode.name}...`);
    setStreamingContent('');
    setWorkflowStage('🔸 Stage 1: 初始化');
    
    try {
      const requestId = `atomic-image-${Date.now()}`;
      
      // Map mode to template_id (prompt name)
      const templateId = `${selectedMode.id}_prompt`;
      
      await onProcess(prompt, {
        app_id: "dream",
        template_id: templateId,
        prompt_args: {
          prompt: prompt,
          input_image: uploadedImage || null,
          quality: 'high',
          style_preset: 'auto',
          mode: selectedMode.id
        }
      }, {
        sender: 'atomic-image-app',
        app: 'dream', 
        requestId,
        processing_mode: selectedMode.id,
        estimated_time: selectedMode.estimatedTime,
        estimated_cost: selectedMode.cost
      });
      
      console.log('🚀 AtomicImageIntelligence: Request sent with mode:', selectedMode.name);
    } catch (error) {
      logger.error(LogCategory.API_CALL, 'Atomic Image Intelligence processing failed', { 
        error: error instanceof Error ? error.message : String(error),
        mode: selectedMode.id
      });
      console.error('Atomic Image Intelligence processing failed:', error);
      setProcessingStatus('');
      setStreamingContent('');
      setWorkflowStage('');
    }
    
    logger.endTrace();
  };

  // Handle file upload with smart mode detection
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      logger.info(LogCategory.USER_INPUT, 'Image file uploaded for Atomic Image Intelligence', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        
        // Update mode recommendation based on having an image
        if (prompt.trim()) {
          const bestMode = detectBestMode(prompt, true);
          setSelectedMode(bestMode);
          logger.debug(LogCategory.AI_MESSAGE, 'Mode updated after image upload', {
            newMode: bestMode.id,
            modeName: bestMode.name
          });
        }
        
        logger.debug(LogCategory.STATE_CHANGE, 'Image uploaded and mode updated', {
          dataLength: result.length,
          selectedMode: selectedMode.id
        });
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
              logger.debug(LogCategory.USER_INPUT, 'Prompt text changed', {
                oldLength: prompt.length,
                newLength: newValue.length,
                selectedMode: selectedMode.id
              });
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
                logger.info(LogCategory.SIDEBAR_INTERACTION, 'Mode selected', { 
                  modeId: mode.id,
                  modeName: mode.name,
                  requiresImage: mode.requiresImage
                });
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
        disabled={isProcessing || !prompt.trim() || (selectedMode.requiresImage && !uploadedImage)}
        className={`w-full p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded text-white font-medium transition-all hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2 text-sm ${
          isProcessing ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
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

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 space-y-2">
          {/* 工作流阶段指示器 */}
          {workflowStage && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-300 font-medium">{workflowStage}</span>
            </div>
          )}
          
          {/* 处理状态 */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            <span className="text-xs text-purple-300">
              {processingStatus || `Processing ${selectedMode.name}...`}
            </span>
          </div>
          
          {/* 实时流式内容显示 */}
          {streamingContent && (
            <div className="bg-black/20 rounded p-2 max-h-20 overflow-y-auto">
              <div className="text-xs text-gray-300 whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse"></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Image Display with Actions */}
      {localGeneratedImage && (
        <div className="bg-white/5 border border-white/10 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span>{selectedMode.icon}</span>
              <span className="text-xs text-white/80">{selectedMode.name} Result</span>
            </div>
            <button 
              onClick={() => setLocalGeneratedImage(null)}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
            >
              ✕
            </button>
          </div>
          
          {/* Smaller Image Preview */}
          <div className="rounded overflow-hidden mb-3">
            <img 
              src={localGeneratedImage} 
              alt="Generated Result" 
              className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(localGeneratedImage, '_blank')}
              onError={(e) => {
                console.error('Failed to load generated image:', localGeneratedImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Image-to-Image Actions */}
          <div className="space-y-2 mb-3">
            <div className="text-xs text-white/60 mb-1">✨ Transform this image:</div>
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => {
                  setSelectedMode(imageModes.find(m => m.id === 'image_to_image') || imageModes[1]);
                  setUploadedImage(localGeneratedImage);
                  setPrompt('Transform this image into a different style');
                }}
                className="py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                title="Transform this image"
              >
                🔄 Transform
              </button>
              <button 
                onClick={() => {
                  setSelectedMode(imageModes.find(m => m.id === 'style_transfer') || imageModes[2]);
                  setUploadedImage(localGeneratedImage);
                  setPrompt('Change the style of this image');
                }}
                className="py-1 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs rounded transition-all"
                title="Change style"
              >
                🎨 Style
              </button>
              <button 
                onClick={() => {
                  setSelectedMode(imageModes.find(m => m.id === 'photo_inpainting') || imageModes[6]);
                  setUploadedImage(localGeneratedImage);
                  setPrompt('Remove unwanted objects from this image');
                }}
                className="py-1 px-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded transition-all"
                title="Remove objects"
              >
                🔧 Edit
              </button>
              <button 
                onClick={() => {
                  setSelectedMode(imageModes.find(m => m.id === 'photo_outpainting') || imageModes[7]);
                  setUploadedImage(localGeneratedImage);
                  setPrompt('Extend the boundaries of this image');
                }}
                className="py-1 px-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs rounded transition-all"
                title="Extend image"
              >
                📐 Extend
              </button>
            </div>
          </div>
          
          {/* Primary Actions */}
          <div className="flex gap-1">
            <button 
              onClick={() => {
                handleImageProcessing();
              }}
              className="flex-1 py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs rounded transition-all flex items-center justify-center gap-1"
              title="Generate another with same prompt"
            >
              🔄 Regenerate
            </button>
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = localGeneratedImage;
                link.download = `dream-${Date.now()}.jpg`;
                link.click();
              }}
              className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all flex items-center justify-center gap-1"
              title="Download image"
            >
              💾 Save
            </button>
          </div>
        </div>
      )}

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

export const DreamSidebar: React.FC<DreamSidebarProps> = ({ 
  triggeredInput
}) => {
  return (
    <BaseSidebar
      title="Atomic Image Intelligence"
      icon="🎨"
      triggeredInput={triggeredInput}
      onResult={(result) => {
        console.log('🎨 Dream result:', result);
      }}
      onError={(error) => {
        console.error('❌ Dream error:', error);
      }}
    >
      <DreamContent />
    </BaseSidebar>
  );
};