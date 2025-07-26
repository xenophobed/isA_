/**
 * ============================================================================
 * Task Toolbar (TaskToolbar.tsx) - macOS-style Task Management
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Task management interface for header toolbar
 * - Quick task creation, viewing, and management
 * - Integration with assistant for AI-powered task suggestions
 * - Similar to macOS Reminders app in toolbar
 * 
 * Design Philosophy:
 * - Quick access to task management
 * - Clean, focused interface for productivity
 * - Assistant-powered task intelligence
 * - Non-intrusive but highly functional
 */
import React, { useState, useRef, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  assistantGenerated?: boolean;
}

interface TaskToolbarProps {
  className?: string;
}

export const TaskToolbar: React.FC<TaskToolbarProps> = ({ 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review project proposal',
      completed: false,
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      createdAt: new Date(),
      assistantGenerated: true
    },
    {
      id: '2', 
      title: 'Schedule team meeting',
      completed: false,
      priority: 'medium',
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'Update documentation',
      completed: true,
      priority: 'low',
      createdAt: new Date()
    }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleTaskPanel = () => {
    setIsOpen(prev => !prev);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'medium',
      createdAt: new Date()
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const hasHighPriorityTasks = tasks.some(t => !t.completed && t.priority === 'high');

  return (
    <div className={`relative ${className}`}>
      {/* Task Toolbar Button */}
      <button
        ref={buttonRef}
        onClick={() => {}} // Disabled
        className="relative flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-500 cursor-not-allowed opacity-60"
        title="Tasks (Coming Soon)"
        disabled
      >
        {/* Task Icon with Badge */}
        <div className="relative">
          <span className="text-sm">✅</span>
        </div>
        
        {/* Label */}
        <span className="text-xs font-medium">Tasks</span>
      </button>

      {/* Task Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" />
          
          {/* Dropdown Content */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Tasks</h3>
                  <p className="text-xs text-gray-400">
                    {pendingTasksCount} pending, {tasks.filter(t => t.completed).length} completed
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

            {/* Add New Task */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 p-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTask();
                    }
                  }}
                />
                <button
                  onClick={addTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  <div className="text-2xl mb-2">📝</div>
                  <div>No tasks yet</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 hover:bg-gray-800/30 transition-colors ${
                        task.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {task.completed && '✓'}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs">{getPriorityIcon(task.priority)}</span>
                            <span
                              className={`text-sm ${
                                task.completed 
                                  ? 'line-through text-gray-400' 
                                  : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.assistantGenerated && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-1 rounded">
                                AI
                              </span>
                            )}
                          </div>
                          
                          {/* Due Date */}
                          {task.dueDate && (
                            <div className="text-xs text-gray-400">
                              Due: {task.dueDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-800/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div>
                  {pendingTasksCount > 0 ? (
                    <span className={hasHighPriorityTasks ? 'text-red-400' : 'text-blue-400'}>
                      {pendingTasksCount} task{pendingTasksCount !== 1 ? 's' : ''} remaining
                    </span>
                  ) : (
                    <span className="text-green-400">All tasks completed! 🎉</span>
                  )}
                </div>
                <button className="text-purple-400 hover:text-purple-300 transition-colors">
                  Ask AI for help
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};