/**
 * ============================================================================
 * Calendar Toolbar (CalendarToolbar.tsx) - macOS-style Calendar Management
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Calendar and event management for header toolbar
 * - Quick event viewing and scheduling
 * - Integration with assistant for AI-powered scheduling
 * - Similar to macOS Calendar app in toolbar
 * 
 * Design Philosophy:
 * - Quick access to schedule information
 * - Clean, focused interface for time management
 * - Assistant-powered scheduling intelligence
 * - Non-intrusive but highly functional
 */
import React, { useState, useRef, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'reminder' | 'task' | 'personal';
  attendees?: string[];
  assistantGenerated?: boolean;
}

interface CalendarToolbarProps {
  className?: string;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({ 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Standup',
      startTime: new Date(Date.now() + 3600000), // 1 hour from now
      endTime: new Date(Date.now() + 5400000), // 1.5 hours from now
      type: 'meeting',
      attendees: ['Alice', 'Bob', 'Charlie'],
      assistantGenerated: false
    },
    {
      id: '2',
      title: 'Project Review',
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 90000000),
      type: 'meeting',
      assistantGenerated: true
    },
    {
      id: '3',
      title: 'Lunch Break',
      startTime: new Date(Date.now() + 7200000), // 2 hours from now
      endTime: new Date(Date.now() + 10800000), // 3 hours from now
      type: 'personal'
    }
  ]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleCalendarPanel = () => {
    setIsOpen(prev => !prev);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'reminder': return '⏰';
      case 'task': return '✅';
      case 'personal': return '🗓️';
      default: return '📅';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'reminder': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'task': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'personal': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getTimeLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter(event => event.startTime >= new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  const hasUpcomingEvents = upcomingEvents.length > 0;
  const nextEvent = upcomingEvents[0];

  return (
    <div className={`relative ${className}`}>
      {/* Calendar Toolbar Button */}
      <button
        ref={buttonRef}
        onClick={() => {}} // Disabled
        className="relative flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-500 cursor-not-allowed opacity-60"
        title="Calendar (Coming Soon)"
        disabled
      >
        {/* Calendar Icon with Badge */}
        <div className="relative">
          <span className="text-sm">📅</span>
          {hasUpcomingEvents && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        {/* Label */}
        <span className="text-xs font-medium">Calendar</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" />
          
          {/* Dropdown Content */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-96 bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Calendar</h3>
                  <p className="text-xs text-gray-400">
                    {hasUpcomingEvents ? `${upcomingEvents.length} upcoming events` : 'No upcoming events'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Next Event Highlight */}
            {nextEvent && (
              <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">⏰</span>
                  <span className="text-xs font-medium text-blue-300">Up Next</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{nextEvent.title}</div>
                    <div className="text-xs text-gray-400">
                      {getTimeLabel(nextEvent.startTime)} at {formatTime(nextEvent.startTime)}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs border ${getEventTypeColor(nextEvent.type)}`}>
                    {getEventTypeIcon(nextEvent.type)} {nextEvent.type}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="max-h-80 overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  <div className="text-2xl mb-2">🗓️</div>
                  <div>No upcoming events</div>
                  <div className="text-xs mt-2">Your schedule is clear!</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {upcomingEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className={`p-3 hover:bg-gray-800/30 transition-colors ${
                        index === 0 ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Event Type Icon */}
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg">
                          <span className="text-sm">{getEventTypeIcon(event.type)}</span>
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">
                              {event.title}
                            </span>
                            {event.assistantGenerated && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-1 rounded">
                                AI
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-400 mb-1">
                            {getTimeLabel(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </div>

                          {event.attendees && event.attendees.length > 0 && (
                            <div className="text-xs text-gray-500">
                              👥 {event.attendees.slice(0, 2).join(', ')}
                              {event.attendees.length > 2 && ` +${event.attendees.length - 2}`}
                            </div>
                          )}
                        </div>

                        {/* Event Type Badge */}
                        <div className={`px-2 py-1 rounded text-xs border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-gray-700/50">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="flex items-center gap-2 p-2 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 rounded text-left transition-colors">
                  <span className="text-sm">➕</span>
                  <span className="text-xs text-gray-300">Quick Event</span>
                </button>
                <button className="flex items-center gap-2 p-2 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 rounded text-left transition-colors">
                  <span className="text-sm">🔍</span>
                  <span className="text-xs text-gray-300">Find Time</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-800/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div>
                  {hasUpcomingEvents ? (
                    <span className="text-blue-400">
                      Next: {formatTime(nextEvent.startTime)}
                    </span>
                  ) : (
                    <span className="text-green-400">Schedule is clear</span>
                  )}
                </div>
                <button className="text-purple-400 hover:text-purple-300 transition-colors">
                  Schedule with AI
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};