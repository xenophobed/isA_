import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { GlassChatInput, GlassCard, GlassButton, IntelligentModeSettings } from '../../shared';

export interface InputAreaLayoutProps {
  placeholder?: string;
  multiline?: boolean;
  maxRows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onBeforeSend?: (message: string) => string;
  onAfterSend?: (message: string) => void;
  onError?: (error: Error) => void;
  onFileSelect?: (files: FileList) => void;
  onSend?: (message: string, metadata?: Record<string, any>) => Promise<void>;
  onSendMultimodal?: (message: string, files: File[], metadata?: Record<string, any>) => Promise<void>;
  suggestionsContent?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  config?: any;
  // Widget system integration
  onShowWidgetSelector?: () => void;
  showWidgetSelector?: boolean;
  // Chat configuration
  onShowChatConfig?: () => void;
}

/**
 * Clean InputAreaLayout - CSS Classes
 */
export const InputAreaLayout: React.FC<InputAreaLayoutProps> = ({
  placeholder,
  multiline,
  maxRows,
  disabled,
  autoFocus,
  onBeforeSend,
  onAfterSend,
  onError,
  onFileSelect,
  onSend,
  onSendMultimodal,
  suggestionsContent,
  className = '',
  children,
  config,
  onShowWidgetSelector,
  showWidgetSelector,
  onShowChatConfig
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [intelligentMode, setIntelligentMode] = useState<IntelligentModeSettings>({
    mode: 'reactive',
    confidence_threshold: 0.7,
    enable_predictions: false
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio context
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Audio feedback
  const playAudioFeedback = (type: 'send' | 'click' | 'success' | 'error') => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch (type) {
      case 'send':
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        break;
      case 'click':
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        break;
      case 'success':
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  const suggestions = [
    'Create a blog post',
    'Generate an image', 
    'Analyze some data',
    'Process a document',
    'Research products'
  ];

  const handleSuggestionClick = (suggestion: string) => {
    playAudioFeedback('click');
    setInputValue(suggestion);
    textareaRef.current?.focus();
    setShowSuggestions(false);
  };

  // File handling functions
  const handleFileSelection = (files: FileList) => {
    // Temporarily disabled - return early
    console.log('📎 File upload temporarily disabled');
    return;
  };

  // Voice recording functions - temporarily disabled
  const startRecording = async () => {
    console.log('🎤 Audio recording temporarily disabled');
    return;
  };

  const stopRecording = () => {
    console.log('🎤 Audio recording temporarily disabled');
    return;
  };

  const toggleRecording = () => {
    console.log('🎤 Audio recording temporarily disabled');
    return;
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    playAudioFeedback('click');
  };

  // Handle input change with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Auto-resize textarea - use setTimeout to ensure DOM updates first
    setTimeout(() => {
      const textarea = e.target;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 40), 150); // Min 40px, max 150px
      textarea.style.height = newHeight + 'px';
      console.log('Textarea resized:', { scrollHeight, newHeight });
    }, 0);
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    playAudioFeedback('send');
    let messageToSend = inputValue.trim() || 'Please analyze the attached files';

    if (onBeforeSend) {
      messageToSend = onBeforeSend(messageToSend);
      if (messageToSend === null) {
        setInputValue('');
        setAttachedFiles([]);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Use multimodal send if files are attached or if onSendMultimodal is available
      if (attachedFiles.length > 0 && onSendMultimodal) {
        await onSendMultimodal(messageToSend, attachedFiles);
      } else if (onSend) {
        await onSend(messageToSend);
      }
      
      setInputValue('');
      setAttachedFiles([]);
      playAudioFeedback('success');
      
      if (onAfterSend) {
        onAfterSend(messageToSend);
      }
    } catch (error) {
      playAudioFeedback('error');
      if (onError) {
        onError(error instanceof Error ? error : new Error('Send failed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  // Minimal Button Style Creator
  const createMinimalButtonStyle = (isDisabled: boolean = false) => ({
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    background: isDisabled ? '#f3f4f6' : '#ffffff',
    border: isDisabled ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
    opacity: isDisabled ? 0.6 : 1,
    color: isDisabled ? '#9ca3af' : '#374151'
  });

  const createMinimalHoverHandlers = () => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.borderColor = '#d1d5db';
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.background = '#ffffff';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }
    }
  });

  // Beautiful Loading Spinner Component
  const LoadingSpinner = () => (
    <div 
      style={{
        position: 'relative',
        width: '16px',
        height: '16px'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: '0',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'rgba(255, 255, 255, 0.3)',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#60a5fa',
          animation: 'spin 0.8s linear infinite reverse'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          inset: '4px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#a78bfa',
          animation: 'spin 1.2s linear infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '4px',
          height: '4px',
          background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 1s ease-in-out infinite'
        }}
      />
    </div>
  );

  // Handle file attachment
  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      setAttachedFiles(prev => [...prev, ...files]);
    };
    input.click();
  };

  return (
    <div className={`p-4 ${className}`}>
      {/* Suggestions Content */}
      {suggestionsContent && (
        <GlassCard variant="subtle" className="mb-4">
          {suggestionsContent}
        </GlassCard>
      )}
      
      {/* File Attachments Display */}
      {attachedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <GlassCard key={index} variant="elevated" className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="font-medium">{file.name}</span>
                <span className="text-xs opacity-70">({Math.round(file.size / 1024)}KB)</span>
                <GlassButton
                  onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                  variant="ghost"
                  size="xs"
                  className="w-5 h-5 !p-0 text-red-400 hover:text-red-300"
                >
                  ×
                </GlassButton>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Main Glass Chat Input */}
      <GlassChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        placeholder={placeholder || "Type your message..."}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        variant="elevated"
        showAttachButton={true}
        showVoiceButton={true}
        showMagicButton={!!onShowWidgetSelector}
        onAttachFile={handleFileAttach}
        onVoiceRecord={toggleRecording}
        onMagicAction={onShowWidgetSelector}
        intelligentMode={intelligentMode}
        onIntelligentModeChange={setIntelligentMode}
        className="w-full"
      />
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};
