import React, { useState, useEffect } from 'react';
import { SimpleAIClient } from '../services/SimpleAIClient';

interface AssistantSidebarProps {
  triggeredInput?: string;
}

// Simple assistant state focused on what users actually need
interface AssistantState {
  input: string;
  currentView: 'today' | 'conversation';
  todayItems: TodayItem[];
  isTyping: boolean;
}

interface TodayItem {
  id: string;
  type: 'urgent' | 'reminder' | 'habit' | 'goal';
  text: string;
  time?: string;
  completed: boolean;
  priority: boolean;
}

/**
 * Personal Assistant - Like having a real assistant
 * Simple, conversational, and focused on getting things done
 */
export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ triggeredInput }) => {
  // Use dedicated AI client for Assistant sidebar (independent from main app)
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Simple state focused on user needs
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

  // Auto-fill from triggered input
  useEffect(() => {
    if (triggeredInput) {
      setAssistant(prev => ({ ...prev, input: triggeredInput }));
    }
  }, [triggeredInput]);

  // Handle conversation with assistant
  const handleConversation = async () => {
    if (!assistant.input.trim() || !client || isProcessing) return;

    setIsProcessing(true);
    setAssistant(prev => ({ ...prev, isTyping: true }));

    try {
      // Store conversation and create appropriate items
      const requestId = `assist-${Date.now()}`;
      
      await client.sendMessage(assistant.input, {
        template_parameters: {
          app_id: "assistant",
          template_id: "personal_assistant_prompt",
          prompt_args: {
            user_request: assistant.input,
            current_time: new Date().toLocaleTimeString(),
            today_items_count: assistant.todayItems.length,
            pending_items: assistant.todayItems.filter(item => !item.completed),
            user_preferences: {
              preferred_reminder_time: '9:00 AM',
              work_hours: '9:00-17:00'
            },
            context: 'personal_assistant'
          }
        },
        metadata: {
          sender: 'assistant-app',
          app: 'assistant',
          requestId,
          requestType: 'personal_request',
          service_function: 'store_working_memory_from_dialog',
          expected_outputs: ['assistant_response', 'action_created', 'reminder_set']
        }
      });

      setAssistant(prev => ({ ...prev, input: '', isTyping: false }));
    } catch (error) {
      console.error('Assistant conversation failed:', error);
      setAssistant(prev => ({ ...prev, isTyping: false }));
    } finally {
      setIsProcessing(false);
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
    <div className="space-y-3 h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded border border-green-500/20">
        <span className="text-lg">👋</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-medium">Assistant</div>
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

      {/* Compact Quick Actions */}
      <div className="grid grid-cols-4 gap-1">
        <button 
          onClick={() => setAssistant(prev => ({ ...prev, input: "What's most important right now?" }))}
          className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all text-center"
          title="Focus Mode"
        >
          <div className="text-sm">🎯</div>
          <div className="text-xs text-white/80">Focus</div>
        </button>
        
        <button 
          onClick={() => setAssistant(prev => ({ ...prev, input: "Show me tomorrow's schedule" }))}
          className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all text-center"
          title="Tomorrow's Schedule"
        >
          <div className="text-sm">📅</div>
          <div className="text-xs text-white/80">Tomorrow</div>
        </button>
        
        <button 
          onClick={() => setAssistant(prev => ({ ...prev, input: "Remind me in 1 hour to take a break" }))}
          className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all text-center"
          title="Quick Reminder"
        >
          <div className="text-sm">⏰</div>
          <div className="text-xs text-white/80">Reminder</div>
        </button>
        
        <button 
          onClick={() => setAssistant(prev => ({ ...prev, input: "Help me plan my week" }))}
          className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all text-center"
          title="Plan Week"
        >
          <div className="text-sm">📋</div>
          <div className="text-xs text-white/80">Plan</div>
        </button>
      </div>

      {/* Compact Processing Status */}
      {assistant.isTyping && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-green-300">Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};