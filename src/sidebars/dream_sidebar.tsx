import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';
import { useAppStore } from '../stores/useAppStore';
import { logger, LogCategory } from '../utils/logger';

interface DreamSidebarProps {
  triggeredInput?: string;
  generatedImage?: string | null;
  onImageGenerated?: (imageUrl: string, prompt: string) => void; // 通知main_app
}

// AI intelligent analysis of user requirements
const analyzeUserInput = (input: string) => {
  const videoKeywords = ['video', 'animation', 'clip', 'movie', 'motion', 'animated'];
  const styleKeywords = ['cyberpunk', 'anime', 'realistic', 'fantasy', 'sci-fi', 'cartoon'];
  const formatKeywords = ['portrait', 'landscape', 'square', 'vertical', 'horizontal'];
  
  const lowerInput = input.toLowerCase();
  
  // Detect video requirements
  const needsVideo = videoKeywords.some(keyword => lowerInput.includes(keyword));
  
  // Detect style
  let detectedStyle = 'photorealistic';
  if (lowerInput.includes('cyberpunk') || lowerInput.includes('sci-fi')) detectedStyle = 'cyberpunk';
  if (lowerInput.includes('anime') || lowerInput.includes('cartoon')) detectedStyle = 'anime';
  if (lowerInput.includes('painting') || lowerInput.includes('artistic')) detectedStyle = 'oil-painting';
  if (lowerInput.includes('cosmic') || lowerInput.includes('space')) detectedStyle = 'cosmic';
  
  // Smart workflow recommendation
  if (needsVideo) {
    return {
      type: 'video_creation',
      workflow: ['text_to_image', 'style_transfer', 'video_generation'],
      estimatedTime: '2-3 minutes',
      detectedStyle,
      description: 'Video creation workflow detected'
    };
  } else {
    return {
      type: 'simple_image',
      workflow: ['text_to_image'],
      estimatedTime: '10-15 seconds',
      detectedStyle,
      description: 'Quick image generation'
    };
  }
};

/**
 * Dream Agent - Multimodal Creation Workshop
 * Based on powerful backend capabilities: 9 image processing + voice + video
 */
export const DreamSidebar: React.FC<DreamSidebarProps> = ({ 
  triggeredInput, 
  generatedImage,
  onImageGenerated 
}) => {
  logger.trackComponentRender('DreamSidebar', { 
    hasTriggeredInput: !!triggeredInput,
    hasGeneratedImage: !!generatedImage
  });

  // Use simple AI client
  const client = useSimpleAI();
  
  // Use app store for state management
  const { 
    currentApp,
    setCurrentApp,
    dream: dreamState,
    setDreamGeneratedImage,
    setDreamGenerating
  } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'intelligent' | 'quick'>('intelligent');
  const [analysis, setAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [localGeneratedImage, setLocalGeneratedImage] = useState<string | null>(null);

  // 自动填充、智能分析，并可选择自动发起专业请求
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== prompt) {
      logger.info(LogCategory.USER_INPUT, 'Dream sidebar received triggered input', {
        input: triggeredInput.substring(0, 100),
        previousPrompt: prompt
      });
      setPrompt(triggeredInput);
      const aiAnalysis = analyzeUserInput(triggeredInput);
      logger.debug(LogCategory.AI_MESSAGE, 'AI analysis completed', {
        analysisType: aiAnalysis.type,
        detectedStyle: aiAnalysis.detectedStyle,
        workflow: aiAnalysis.workflow,
        estimatedTime: aiAnalysis.estimatedTime
      });
      setAnalysis(aiAnalysis);
      
      // Note: 不自动发起请求，让用户在专业界面中主动选择
      console.log('🎨 Dream app ready for user interaction with pre-filled prompt');
    }
  }, [triggeredInput, prompt]);

  // 实时智能分析
  React.useEffect(() => {
    if (prompt && mode === 'intelligent') {
      logger.debug(LogCategory.USER_INPUT, 'Analyzing user prompt in intelligent mode', {
        promptLength: prompt.length,
        mode
      });
      const aiAnalysis = analyzeUserInput(prompt);
      logger.debug(LogCategory.AI_MESSAGE, 'Real-time analysis updated', {
        analysisType: aiAnalysis.type,
        workflowSteps: aiAnalysis.workflow.length
      });
      setAnalysis(aiAnalysis);
    }
  }, [prompt, mode]);

  // 监听centralized store的Dream state变化
  React.useEffect(() => {
    // 当Dream state中有新的生成图片时，更新本地状态
    if (dreamState.generatedImage && dreamState.generatedImage !== localGeneratedImage && isGenerating) {
      console.log('🎨 DreamSidebar: Received generated image from centralized store:', dreamState.generatedImage);
      setLocalGeneratedImage(dreamState.generatedImage);
      
      // 通知 main_app 生成完成
      if (onImageGenerated) {
        onImageGenerated(dreamState.generatedImage, prompt);
      }
      
      // 停止生成状态
      setIsGenerating(false);
      setCurrentStep(0);
      setProgress(100);
    }
  }, [dreamState.generatedImage, localGeneratedImage, isGenerating]);

  // 停止生成（保留原有逻辑作为备用）
  React.useEffect(() => {
    if (generatedImage && isGenerating) {
      setIsGenerating(false);
      setCurrentStep(0);
      setProgress(0);
      setLocalGeneratedImage(generatedImage);
    }
  }, [generatedImage, isGenerating]);

  // Quick style options
  const quickStyles = [
    { id: 'photorealistic', name: 'Realistic', icon: '📸' },
    { id: 'anime', name: 'Anime', icon: '🎨' },
    { id: 'oil-painting', name: 'Artistic', icon: '🖼️' },
    { id: 'cosmic', name: 'Sci-Fi', icon: '🌌' }
  ];

  // Intelligent creation processing
  const handleIntelligentCreation = async () => {
    if (!prompt.trim() || !client || isGenerating || !analysis) return;

    const traceId = logger.startTrace('INTELLIGENT_CREATION');
    logger.info(LogCategory.USER_INPUT, 'Starting intelligent creation', {
      promptLength: prompt.length,
      analysisType: analysis.type,
      workflowSteps: analysis.workflow.length,
      hasUploadedImage: !!uploadedImage
    });

    setIsGenerating(true);
    setCurrentStep(0);
    setProgress(0);

    try {
      const { workflow, type } = analysis;
      
      for (let i = 0; i < workflow.length; i++) {
        logger.info(LogCategory.STATE_CHANGE, `Intelligent creation step ${i + 1}`, {
          step: i + 1,
          totalSteps: workflow.length,
          workflowStep: workflow[i]
        });
        
        setCurrentStep(i);
        setProgress(((i + 1) / workflow.length) * 100);
        
        // Simulate processing steps
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (i === 0) {
          // First step: Basic generation
          const requestId = `dream-intelligent-${Date.now()}`;
          const messageData = {
            sender: 'dream-app', 
            app: 'dream',
            requestId,
            workflow: 'intelligent',
            step: i + 1,
            totalSteps: workflow.length,
            style: analysis.detectedStyle,
            hasImage: !!uploadedImage,
            imageData: uploadedImage,
            original_prompt: prompt
          };
          
          logger.trackAPICall('sendMessage', 'POST', messageData);
          
          // 发送消息到共享的 AI 后端 - let centralized store handle response
          await client.sendMessage(prompt, messageData);
        }
      }
    } catch (error) {
      logger.error(LogCategory.API_CALL, 'Intelligent creation failed', { error: error instanceof Error ? error.message : String(error) });
      console.error('Intelligent creation failed:', error);
      setIsGenerating(false);
      setCurrentStep(0);
      setProgress(0);
    }
    
    logger.endTrace();
  };

  // Quick generation processing
  const handleQuickGeneration = async (style?: string) => {
    if (!prompt.trim() || !client || isGenerating) return;

    const traceId = logger.startTrace('QUICK_GENERATION');
    const selectedStyle = style || 'photorealistic';
    
    logger.info(LogCategory.USER_INPUT, 'Starting quick generation', {
      promptLength: prompt.length,
      selectedStyle,
      hasUploadedImage: !!uploadedImage
    });

    setIsGenerating(true);
    
    try {
      const requestId = `dream-quick-${Date.now()}`;
      const messageData = {
        sender: 'dream-app', 
        app: 'dream',
        requestId,
        workflow: 'quick',
        style: selectedStyle,
        hasImage: !!uploadedImage,
        imageData: uploadedImage,
        original_prompt: prompt
      };
      
      logger.trackAPICall('sendMessage', 'POST', messageData);
      
      // 发送消息到共享的 AI 后端 - let centralized store handle response
      await client.sendMessage(prompt, messageData);
    } catch (error) {
      logger.error(LogCategory.API_CALL, 'Quick generation failed', { error: error instanceof Error ? error.message : String(error) });
      console.error('Quick generation failed:', error);
      setIsGenerating(false);
    }
    
    logger.endTrace();
  };

  const workflowSteps = [
    { name: 'Base Scene Generation', icon: '🎨' },
    { name: 'Style Enhancement', icon: '✨' },
    { name: 'Video Animation', icon: '🎬' },
    { name: 'Audio Synthesis', icon: '🎤' }
  ];

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      logger.info(LogCategory.USER_INPUT, 'Image file uploaded', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        logger.debug(LogCategory.STATE_CHANGE, 'Image uploaded and processed', {
          dataLength: result.length
        });
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-white/5 rounded-lg p-1">
        <button
          onClick={() => {
            logger.info(LogCategory.SIDEBAR_INTERACTION, 'Mode switched to intelligent', { previousMode: mode });
            setMode('intelligent');
          }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'intelligent'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'text-white/70 hover:text-white/90'
          }`}
        >
          🧠 Intelligent
        </button>
        <button
          onClick={() => {
            logger.info(LogCategory.SIDEBAR_INTERACTION, 'Mode switched to quick', { previousMode: mode });
            setMode('quick');
          }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'quick'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'text-white/70 hover:text-white/90'
          }`}
        >
          ⚡ Quick
        </button>
      </div>

      {/* Main Input Area */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          {mode === 'intelligent' ? '🎯 Creative Request (AI Analysis)' : '💭 Image Description'}
        </h3>
        
        <textarea
          value={prompt}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== prompt) {
              logger.debug(LogCategory.USER_INPUT, 'Prompt text changed', {
                oldLength: prompt.length,
                newLength: newValue.length,
                mode
              });
            }
            setPrompt(newValue);
          }}
          placeholder={mode === 'intelligent' 
            ? "Create a cyberpunk city promotional video with futuristic effects..." 
            : "A mystical forest with glowing mushrooms and fireflies..."}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
        />

        {/* Upload Area - Simplified */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center w-full p-3 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-all hover:bg-white/5"
        >
          {uploadedImage ? (
            <div className="flex items-center gap-3">
              <img src={uploadedImage} alt="Uploaded" className="w-8 h-8 object-cover rounded" />
              <span className="text-white/70 text-sm">Image uploaded - Click to change</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg">📷</span>
              <span className="text-white/60 text-sm">Upload image (optional)</span>
            </div>
          )}
        </label>
      </div>

      {/* Intelligent Mode - AI Analysis Results */}
      {mode === 'intelligent' && analysis && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-medium text-white/90">AI Analysis</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📊</span>
              <span className="text-white/80">{analysis.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⏱️</span>
              <span className="text-white/80">Estimated Time: {analysis.estimatedTime}</span>
            </div>
          </div>

          {/* Smart Workflow - Simplified */}
          {analysis.workflow.length > 1 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>🔄</span>
                <span>Multi-step workflow: {analysis.workflow.length} stages</span>
                {isGenerating && (
                  <span className="text-blue-400">
                    ({currentStep + 1}/{analysis.workflow.length})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Mode - Style Selection */}
      {mode === 'quick' && (
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-3">🎨 Quick Styles</h3>
          <div className="flex flex-wrap gap-2">
            {quickStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleQuickGeneration(style.id)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                <span>{style.icon}</span>
                <span>{style.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={mode === 'intelligent' ? handleIntelligentCreation : () => handleQuickGeneration()}
        disabled={isGenerating || !prompt.trim() || (mode === 'intelligent' && !analysis)}
        className={`w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium transition-all hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2 ${
          isGenerating ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {mode === 'intelligent' ? 
              `Creating... ${progress.toFixed(0)}%` : 
              'Generating...'
            }
          </>
        ) : (
          <>
            <span>{mode === 'intelligent' ? '🚀' : '⚡'}</span>
            {mode === 'intelligent' ? 'Start Creating' : 'Quick Generate'}
          </>
        )}
      </button>

      {/* Generation Progress */}
      {isGenerating && mode === 'intelligent' && progress > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/80">Creation Progress</span>
            <span className="text-sm text-white/60">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Creation Status */}
      {isGenerating && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-sm text-blue-300">Creating your content...</span>
          </div>
          <p className="text-xs text-white/60">Results will appear here when ready</p>
        </div>
      )}

      {/* Generated Image Display */}
      {localGeneratedImage && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎨</span>
            <span className="text-sm font-medium text-white/90">Generated Image</span>
          </div>
          <div className="rounded-lg overflow-hidden">
            <img 
              src={localGeneratedImage} 
              alt="Generated content" 
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                console.error('Failed to load generated image:', localGeneratedImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded transition-all">
              💾 Save
            </button>
            <button className="flex-1 py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm rounded transition-all">
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Quick Suggestions & Tips */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white/80 mb-3">⚡ Quick Start</h4>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const newPrompt = "generate image of a cute cat";
                logger.info(LogCategory.SIDEBAR_INTERACTION, 'Quick prompt selected', { 
                  selectedPrompt: newPrompt,
                  previousPrompt: prompt
                });
                setPrompt(newPrompt);
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/70 hover:text-white transition-all"
            >
              🐱 Cute cat
            </button>
            <button 
              onClick={() => {
                const newPrompt = "cyberpunk city at night with neon lights";
                logger.info(LogCategory.SIDEBAR_INTERACTION, 'Quick prompt selected', { 
                  selectedPrompt: newPrompt,
                  previousPrompt: prompt
                });
                setPrompt(newPrompt);
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/70 hover:text-white transition-all"
            >
              🌃 Cyberpunk city
            </button>
            <button 
              onClick={() => {
                const newPrompt = "mystical forest with glowing mushrooms and fireflies";
                logger.info(LogCategory.SIDEBAR_INTERACTION, 'Quick prompt selected', { 
                  selectedPrompt: newPrompt,
                  previousPrompt: prompt
                });
                setPrompt(newPrompt);
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/70 hover:text-white transition-all"
            >
              🍄 Mystical forest
            </button>
          </div>
        </div>
        
        <div className="text-xs text-white/50">
          💡 {mode === 'intelligent' ? 'AI automatically selects optimal processing workflow' : 'Quick generation of single images'} • Results appear in chat
        </div>
      </div>
    </div>
  );
};