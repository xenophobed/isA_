import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { FileUpload } from './FileUpload';

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
  showWidgetSelector
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
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


  // Unified Glass Button Style Creator
  const createGlassButtonStyle = (color: string, isDisabled: boolean = false) => ({
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: `rgba(${color}, 0.1)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid rgba(${color}, 0.2)`,
    opacity: isDisabled ? 0.4 : 1,
    boxShadow: `0 2px 8px rgba(${color}, 0.15)`
  });

  const createGlassButtonHoverHandlers = (color: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.background = `rgba(${color}, 0.2)`;
        e.currentTarget.style.borderColor = `rgba(${color}, 0.4)`;
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(${color}, 0.25)`;
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.background = `rgba(${color}, 0.1)`;
        e.currentTarget.style.borderColor = `rgba(${color}, 0.2)`;
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `0 2px 8px rgba(${color}, 0.15)`;
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

  return (
    <div className={`input-area-container ${className}`}>
      {/* Suggestions Content */}
      {suggestionsContent && (
        <div className="suggestions-content">
          {suggestionsContent}
        </div>
      )}
      
      {/* File Attachments Display */}
      {attachedFiles.length > 0 && (
        <div className="attached-files">
          <div className="attached-files-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8l-5-5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
          </div>
          <div className="attached-files-list">
            {attachedFiles.map((file, index) => (
              <div key={index} className="attached-file-item">
                <div className="file-info">
                  <div className="file-icon">
                    {file.type.startsWith('image/') ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : file.type.startsWith('audio/') ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 19v4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 23h8" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{Math.round(file.size / 1024)}KB</div>
                  </div>
                </div>
                <button
                  className="remove-file"
                  onClick={() => removeFile(index)}
                  title={`Remove ${file.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Input Area */}
      <div className="input-controls">
        <div className="input-row">
          {/* File Upload Button Container */}
          <div className="button-container">
            <button
              onClick={() => handleFileSelection}
              disabled={true}
              title="File upload (coming soon)"
              style={{
                ...createGlassButtonStyle('107, 114, 128', true), // gray color
                width: '40px',
                height: '40px',
                color: '#9ca3af'
              }}
              {...createGlassButtonHoverHandlers('107, 114, 128')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 14l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {/* Audio Recording Button Container */}
          <div className="button-container">
            <button
              onClick={toggleRecording}
              disabled={true}
              title="Audio recording (coming soon)"
              style={{
                ...createGlassButtonStyle('107, 114, 128', true), // gray color
                width: '40px',
                height: '40px',
                color: '#9ca3af'
              }}
              {...createGlassButtonHoverHandlers('107, 114, 128')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {/* Chat Input Container with Magic Wand */}
          <div className="input-container" style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={inputValue.trim() ? (placeholder || "Type your message...") : "       " + (placeholder || "Type your message or click ✨ for smart widgets...")}
              disabled={disabled || isLoading}
              autoFocus={autoFocus}
              rows={1}
              className="chat-input"
              style={{ paddingLeft: inputValue.trim() ? '12px' : '50px' }}
            />
            {/* Magic Wand Button - Left side of textarea, only when empty */}
            {!inputValue.trim() && (
              <button
                onClick={() => {
                  playAudioFeedback('click');
                  onShowWidgetSelector && onShowWidgetSelector();
                }}
                disabled={disabled || isLoading}
                title="Open smart widgets"
                style={{
                  ...createGlassButtonStyle('139, 92, 246', disabled || isLoading), // purple color
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  color: '#a855f7'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    e.currentTarget.style.color = '#8b5cf6';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.color = '#a855f7';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.15)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 4V2m0 16v-2m-8-8H5m16 0h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="9" r="1" fill="currentColor"/>
                  <circle cx="15" cy="15" r="1" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Send Button Container - Restored with Glass Style */}
          <div className="button-container">
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              title="Send message"
              style={{
                ...createGlassButtonStyle(
                  !inputValue.trim() || isLoading ? '107, 114, 128' : '34, 197, 94', // gray when disabled, green when active
                  !inputValue.trim() || isLoading
                ),
                width: '40px',
                height: '40px',
                color: !inputValue.trim() || isLoading ? '#9ca3af' : '#22c55e'
              }}
              {...createGlassButtonHoverHandlers(!inputValue.trim() || isLoading ? '107, 114, 128' : '34, 197, 94')}
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Suggestions Panel */}
        {showSuggestions && (
          <div className="suggestions-panel">
            <div className="suggestions-header">
              <div className="suggestions-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                </svg>
                Quick Suggestions
              </div>
              <button
                className="close-suggestions"
                onClick={() => {
                  playAudioFeedback('click');
                  setShowSuggestions(false);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-dot" />
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Additional Content */}
      {children && (
        <div className="additional-content">
          {children}
        </div>
      )}
    </div>
  );
};