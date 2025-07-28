/**
 * ============================================================================
 * Assistant Widget UI (AssistantWidget.tsx) - Refactored to use BaseWidget
 * ============================================================================ 
 * 
 * Core Responsibilities:
 * - Personal assistant interface using standardized BaseWidget layout
 * - Progress tracking, today's items, and quick actions
 * - Smart suggestions and time-aware functionality
 * - Pure UI component with business logic handled by module
 * 
 * Benefits of BaseWidget integration:
 * - Standardized three-area layout (Output, Input, Management)
 * - Built-in output history management
 * - Consistent edit and management actions
 * - Streaming status display support
 * - Significantly reduced code complexity
 */
import React, { useState } from 'react';
import { BaseWidget, OutputHistoryItem, EditAction, ManagementAction } from './BaseWidget';

// AssistantWidgetParams interface - kept for backward compatibility
interface AssistantWidgetParams {
  context?: string;
  task?: string;
  specialInstructions?: string;
}

interface TodayItem {
  id: string;
  type: 'urgent' | 'reminder' | 'habit' | 'goal';
  text: string;
  time?: string;
  completed: boolean;
  priority: boolean;
}

interface AssistantState {
  input: string;
  currentView: 'today' | 'conversation';
  todayItems: TodayItem[];
  isTyping: boolean;
}

interface AssistantWidgetProps {
  isProcessing: boolean;
  conversationContext: any;
  triggeredInput?: string;
  outputHistory?: OutputHistoryItem[];
  currentOutput?: OutputHistoryItem | null;
  isStreaming?: boolean;
  streamingContent?: string;
  onSendMessage: (params: AssistantWidgetParams) => Promise<void>;
  onClearContext: () => void;
  onSelectOutput?: (item: OutputHistoryItem) => void;
  onClearHistory?: () => void;
}

/**
 * Assistant Widget Input Area - Content that goes inside BaseWidget
 */
const AssistantInputArea: React.FC<AssistantWidgetProps> = ({
  isProcessing,
  conversationContext,
  triggeredInput,
  onSendMessage,
  onClearContext
}) => {
  const [assistant, setAssistant] = useState<AssistantState>({
    input: '',
    currentView: 'today',
    todayItems: [
      { id: '1', type: 'urgent', text: 'Call John about project deadline', completed: false, priority: true },
      { id: '2', type: 'reminder', text: 'Team standup meeting', time: '9:00 AM', completed: false, priority: false },
      { id: '3', type: 'habit', text: 'Review daily goals', completed: true, priority: false },
      { id: '4', type: 'goal', text: 'Spanish lesson - 30 minutes', completed: false, priority: false }
    ],
    isTyping: false
  });

  // Handle conversation with assistant
  const handleConversation = async () => {
    if (!assistant.input.trim() || !onSendMessage || isProcessing) return;

    setAssistant(prev => ({ ...prev, isTyping: true }));

    try {
      const params: AssistantWidgetParams = {
        task: assistant.input,
        context: 'personal_assistant'
      };
      
      await onSendMessage(params);
      setAssistant(prev => ({ ...prev, input: '', isTyping: false }));
    } catch (error) {
      console.error('Assistant conversation failed:', error);
      setAssistant(prev => ({ ...prev, isTyping: false }));
    }
  };

  // Mark item as completed
  const toggleItem = (id: string) => {
    setAssistant(prev => ({
      ...prev,
      todayItems: prev.todayItems.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  // Smart suggestions based on time and context
  const getSmartSuggestions = () => {
    const hour = new Date().getHours();
    const suggestions = [];

    if (hour < 10) {
      suggestions.push("What's my schedule for today?");
      suggestions.push("Remind me to check emails at 10 AM");
    } else if (hour < 17) {
      suggestions.push("Schedule a break in 1 hour");
      suggestions.push("What should I focus on next?");
    } else {
      suggestions.push("Review what I accomplished today");
      suggestions.push("Plan tomorrow's priorities");
    }

    suggestions.push("Set a reminder for...");
    suggestions.push("Add to my goals...");
    
    return suggestions;
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const completedCount = assistant.todayItems.filter(item => item.completed).length;
  const totalCount = assistant.todayItems.length;

  return (
    <div className="space-y-3 p-3">
      {/* Compact Progress */}
      <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded border border-green-500/20">
        <span className="text-lg">👋</span>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 text-xs text-white/60">
            <span>{completedCount}/{totalCount} done</span>
            <span>{currentTime}</span>
          </div>
        </div>
        {completedCount > 0 && (
          <div className="w-8 bg-white/10 rounded-full h-1">
            <div 
              className="bg-green-400 h-1 rounded-full transition-all" 
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Compact Input */}
      <div>
        <textarea
          value={assistant.input}
          onChange={(e) => setAssistant(prev => ({ ...prev, input: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleConversation();
            }
          }}
          placeholder="What can I help you with today?"
          className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-green-500 resize-none text-sm"
          rows={2}
        />
        
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleConversation}
            disabled={!assistant.input.trim() || isProcessing}
            className={`flex-1 p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded text-white font-medium transition-all text-sm ${
              isProcessing ? 'animate-pulse' : 'hover:from-green-600 hover:to-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Thinking...' : 'Send'}
          </button>
          
          {assistant.input.trim() && (
            <button
              onClick={() => setAssistant(prev => ({ ...prev, input: '' }))}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white transition-all text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Compact Suggestions */}
      <div>
        <div className="text-xs text-white/60 mb-1">💡 Quick actions</div>
        <div className="grid grid-cols-1 gap-1">
          {getSmartSuggestions().slice(0, 3).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setAssistant(prev => ({ ...prev, input: suggestion }))}
              className="p-1 bg-white/5 hover:bg-green-500/20 rounded text-xs text-white/70 transition-all text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Today's Focus */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-white/60">📋 Today ({assistant.todayItems.filter(item => !item.completed).length} left)</div>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {assistant.todayItems.map((item) => (
            <div 
              key={item.id} 
              className={`p-2 rounded border transition-all cursor-pointer ${
                item.completed 
                  ? 'bg-green-500/10 border-green-500/20 opacity-60' 
                  : item.priority 
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border transition-all ${
                  item.completed 
                    ? 'bg-green-400 border-green-400' 
                    : 'border-white/30'
                }`}>
                  {item.completed && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-xs ${item.completed ? 'text-white/60 line-through' : 'text-white'} truncate`}>
                    {item.text}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {item.time && (
                      <span className="text-xs text-white/50">⏰ {item.time}</span>
                    )}
                    
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      item.type === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      item.type === 'reminder' ? 'bg-blue-500/20 text-blue-400' :
                      item.type === 'habit' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.type === 'urgent' ? '🔥' :
                       item.type === 'reminder' ? '⏰' :
                       item.type === 'habit' ? '🔄' : '🎯'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Assistant Widget with BaseWidget - New standardized layout
 */
export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  isProcessing,
  conversationContext,
  triggeredInput,
  outputHistory = [],
  currentOutput = null,
  isStreaming = false,
  streamingContent = '',
  onSendMessage,
  onClearContext,
  onSelectOutput,
  onClearHistory
}) => {
  
  // Custom edit actions for assistant responses
  const editActions: EditAction[] = [
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      onClick: (content) => {
        navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content));
      }
    },
    {
      id: 'share',
      label: 'Share',
      icon: '📤',
      onClick: (content) => {
        // Custom share logic for assistant responses
        console.log('Sharing assistant response:', content);
      }
    }
  ];

  // Custom management actions for assistant
  const managementActions: ManagementAction[] = [
    {
      id: 'focus',
      label: 'Focus',
      icon: '🎯',
      onClick: () => onSendMessage({ task: "What's most important right now?", context: 'personal_assistant' }),
      disabled: isProcessing
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: '📅',
      onClick: () => onSendMessage({ task: "Show me tomorrow's schedule", context: 'personal_assistant' }),
      disabled: isProcessing
    },
    {
      id: 'remind',
      label: 'Remind',
      icon: '⏰',
      onClick: () => onSendMessage({ task: "Set a reminder for...", context: 'personal_assistant' }),
      disabled: isProcessing
    },
    {
      id: 'clear',
      label: 'Clear',
      icon: '🗑️',
      onClick: () => {
        onClearContext();
        onClearHistory?.();
      },
      variant: 'danger' as const,
      disabled: isProcessing
    }
  ];

  return (
    <BaseWidget
      title="Personal Assistant"
      icon="🤖"
      isProcessing={isProcessing}
      outputHistory={outputHistory}
      currentOutput={currentOutput}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      editActions={editActions}
      managementActions={managementActions}
      onSelectOutput={onSelectOutput}
      onClearHistory={onClearHistory}
    >
      <AssistantInputArea
        isProcessing={isProcessing}
        conversationContext={conversationContext}
        triggeredInput={triggeredInput}
        onSendMessage={onSendMessage}
        onClearContext={onClearContext}
      />
    </BaseWidget>
  );
};