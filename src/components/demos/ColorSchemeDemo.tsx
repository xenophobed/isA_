/**
 * Color Scheme Demo Component
 * Shows different color palettes applied to all UI elements
 */
import React, { useState } from 'react';

// Mock message data
const sampleMessages = [
  { id: '1', role: 'user', content: 'Hello! Can you help me with a React component?', timestamp: new Date().toISOString() },
  { id: '2', role: 'assistant', content: 'Of course! I\'d be happy to help you with React components. What specifically are you looking to build?', timestamp: new Date().toISOString() }
];

const colorSchemes = {
  // Current Scheme
  current: {
    name: "Current (Stark)",
    light: {
      bg: "#ffffff",
      surface: "#ffffff", 
      border: "#e5e7eb",
      text: "#374151",
      textSecondary: "#6b7280",
      button: "#ffffff",
      buttonHover: "#f9fafb",
      accent: "#3b82f6",
      success: "#22c55e"
    },
    dark: {
      bg: "#111827",
      surface: "#1f2937", 
      border: "#374151",
      text: "#ffffff",
      textSecondary: "#9ca3af",
      button: "#374151",
      buttonHover: "#4b5563",
      accent: "#60a5fa",
      success: "#34d399"
    }
  },

  // Warm Minimal
  warmMinimal: {
    name: "Warm Minimal",
    light: {
      bg: "#fafafa",
      surface: "#ffffff", 
      border: "#e0e0e0",
      text: "#2d3748",
      textSecondary: "#718096",
      button: "#ffffff",
      buttonHover: "#f7fafc",
      accent: "#3182ce",
      success: "#38a169"
    },
    dark: {
      bg: "#1a1a1a",
      surface: "#2d2d2d", 
      border: "#404040",
      text: "#f7fafc",
      textSecondary: "#a0aec0",
      button: "#2d2d2d",
      buttonHover: "#404040",
      accent: "#63b3ed",
      success: "#68d391"
    }
  },

  // Soft Neutral
  softNeutral: {
    name: "Soft Neutral",
    light: {
      bg: "#f8f9fa",
      surface: "#ffffff", 
      border: "#dee2e6",
      text: "#343a40",
      textSecondary: "#6c757d",
      button: "#ffffff",
      buttonHover: "#f1f3f4",
      accent: "#0d6efd",
      success: "#198754"
    },
    dark: {
      bg: "#212529",
      surface: "#343a40", 
      border: "#495057",
      text: "#f8f9fa",
      textSecondary: "#adb5bd",
      button: "#343a40",
      buttonHover: "#495057",
      accent: "#6ea8fe",
      success: "#75b798"
    }
  },

  // Cool Blue
  coolBlue: {
    name: "Cool Blue",
    light: {
      bg: "#f8fafc",
      surface: "#ffffff", 
      border: "#e2e8f0",
      text: "#1e293b",
      textSecondary: "#64748b",
      button: "#ffffff",
      buttonHover: "#f1f5f9",
      accent: "#0ea5e9",
      success: "#059669"
    },
    dark: {
      bg: "#0f172a",
      surface: "#1e293b", 
      border: "#334155",
      text: "#f8fafc",
      textSecondary: "#94a3b8",
      button: "#1e293b",
      buttonHover: "#334155",
      accent: "#38bdf8",
      success: "#10b981"
    }
  },

  // Warm Beige
  warmBeige: {
    name: "Warm Beige",
    light: {
      bg: "#fefcfb",
      surface: "#ffffff", 
      border: "#e7e5e4",
      text: "#44403c",
      textSecondary: "#78716c",
      button: "#ffffff",
      buttonHover: "#faf8f7",
      accent: "#ea580c",
      success: "#16a34a"
    },
    dark: {
      bg: "#1c1917",
      surface: "#292524", 
      border: "#44403c",
      text: "#fafaf9",
      textSecondary: "#a8a29e",
      button: "#292524",
      buttonHover: "#44403c",
      accent: "#fb923c",
      success: "#22c55e"
    }
  },

  // Glassmorphism Pro - Ultra-modern glass effects
  glassmorphismPro: {
    name: "Glassmorphism Pro",
    light: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      surface: "rgba(255, 255, 255, 0.25)", 
      border: "rgba(255, 255, 255, 0.18)",
      text: "#1a202c",
      textSecondary: "#4a5568",
      button: "rgba(255, 255, 255, 0.2)",
      buttonHover: "rgba(255, 255, 255, 0.3)",
      accent: "#667eea",
      success: "#48bb78",
      glass: "rgba(255, 255, 255, 0.25)",
      glassHover: "rgba(255, 255, 255, 0.35)",
      glassBorder: "rgba(255, 255, 255, 0.18)",
      shadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      backdrop: "blur(8px)"
    },
    dark: {
      bg: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
      surface: "rgba(255, 255, 255, 0.05)", 
      border: "rgba(255, 255, 255, 0.1)",
      text: "#f7fafc",
      textSecondary: "#a0aec0",
      button: "rgba(255, 255, 255, 0.05)",
      buttonHover: "rgba(255, 255, 255, 0.1)",
      accent: "#9f7aea",
      success: "#68d391",
      glass: "rgba(255, 255, 255, 0.05)",
      glassHover: "rgba(255, 255, 255, 0.1)",
      glassBorder: "rgba(255, 255, 255, 0.1)",
      shadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      backdrop: "blur(12px)"
    }
  }
};

interface DemoComponentProps {
  scheme: typeof colorSchemes.current;
  isDark: boolean;
}

const DemoHeader: React.FC<DemoComponentProps> = ({ scheme, isDark }) => {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return (
    <div 
      className="flex items-center justify-between h-14 px-4 border-b"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.text
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: colors.accent }}
        >
          I
        </div>
        <h1 className="text-base font-semibold">ISA</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button 
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ 
            backgroundColor: colors.button,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.button;
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        {/* Task Status */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ 
            backgroundColor: colors.button,
            border: `1px solid ${colors.border}` 
          }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.success }}
          />
          <span className="text-xs" style={{ color: colors.textSecondary }}>2 tasks</span>
        </div>
        
        {/* Notifications */}
        <button 
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ 
            backgroundColor: colors.button,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.button;
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14l-7-5-7 5z" />
          </svg>
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center text-white"
            style={{ backgroundColor: colors.accent, fontSize: '10px' }}
          >
            3
          </div>
        </button>
        
        {/* User Avatar */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.button, border: `1px solid ${colors.border}` }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const DemoMessages: React.FC<DemoComponentProps> = ({ scheme, isDark }) => {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return (
    <div 
      className="flex-1 p-4 space-y-4 overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      {sampleMessages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: message.role === 'user' ? colors.accent : colors.button,
              border: message.role === 'user' ? 'none' : `1px solid ${colors.border}`
            }}
          >
            <svg width="14" height="14" fill="none" stroke={message.role === 'user' ? '#ffffff' : colors.textSecondary} viewBox="0 0 24 24">
              {message.role === 'user' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              )}
            </svg>
          </div>
          
          <div className="flex-1 max-w-[80%]">
            <div 
              className={`px-4 py-2 rounded-2xl text-sm ${message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
              style={{ 
                backgroundColor: message.role === 'user' ? colors.accent : colors.surface,
                color: message.role === 'user' ? '#ffffff' : colors.text,
                border: message.role === 'user' ? 'none' : `1px solid ${colors.border}`
              }}
            >
              {message.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DemoSidebar: React.FC<DemoComponentProps> = ({ scheme, isDark }) => {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return (
    <div 
      className="w-64 border-r flex flex-col"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: colors.accent }}
          >
            C
          </div>
          <span className="font-medium text-sm" style={{ color: colors.text }}>Chats</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 p-3 space-y-1">
        {['Today', 'Yesterday', 'Previous 7 days'].map((section, i) => (
          <div key={section}>
            <div className="px-2 py-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
              {section}
            </div>
            {Array.from({length: section === 'Today' ? 3 : 2}).map((_, j) => (
              <button
                key={j}
                className="w-full text-left px-2 py-2 rounded-lg transition-colors flex items-center gap-3"
                style={{ color: colors.text }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: j === 0 ? colors.success : colors.textSecondary }}
                />
                <span className="text-sm truncate">
                  {j === 0 ? 'Current conversation' : `React component help ${i+1}-${j+1}`}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      
      {/* Sidebar Footer */}
      <div className="p-3 border-t" style={{ borderColor: colors.border }}>
        <button 
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm">New chat</span>
        </button>
      </div>
    </div>
  );
};

const DemoStatusBar: React.FC<DemoComponentProps> = ({ scheme, isDark }) => {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return (
    <div 
      className="px-4 py-2 border-t flex items-center justify-between"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: colors.success }}
          />
          <span className="text-xs" style={{ color: colors.textSecondary }}>AI is typing...</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-xs" style={{ color: colors.textSecondary }}>
          2 tokens/sec
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-1.5 h-3 rounded-full"
            style={{ backgroundColor: colors.success }}
          />
          <div 
            className="w-1.5 h-4 rounded-full"
            style={{ backgroundColor: colors.success }}
          />
          <div 
            className="w-1.5 h-2 rounded-full"
            style={{ backgroundColor: colors.button }}
          />
        </div>
      </div>
    </div>
  );
};

const DemoInput: React.FC<DemoComponentProps> = ({ scheme, isDark }) => {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return (
    <div 
      className="p-4 border-t"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <div className="flex items-center gap-2">
        {/* Expandable Icon Group */}
        <div className="flex items-center">
          <button 
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ 
              backgroundColor: colors.button,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.button;
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Magic Wand Widget Button */}
        <button 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ 
            backgroundColor: colors.button,
            border: `1px solid ${colors.border}`,
            color: colors.accent
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.button;
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4V2m0 16v-2m-8-8H5m16 0h-2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6" />
            <circle cx="9" cy="9" r="1" fill="currentColor"/>
            <circle cx="15" cy="15" r="1" fill="currentColor"/>
          </svg>
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <input 
            type="text"
            placeholder="Type your message or click ✨ for smart widgets..."
            className="w-full px-4 py-2.5 rounded-lg border transition-colors text-sm"
            style={{ 
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.text
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border;
            }}
          />
        </div>

        {/* Send Button */}
        <button 
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-white"
          style={{ backgroundColor: colors.success }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const ColorSchemeDemo: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<string>('current');
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Color Scheme Demos</h1>
          <p className="text-gray-600">Choose your preferred color scheme for both light and dark modes</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mode:</span>
            <button
              onClick={() => setIsDark(false)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                !isDark ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                isDark ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Scheme Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(colorSchemes).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => setSelectedScheme(key)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedScheme === key 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <h3 className="font-medium text-gray-900 mb-2">{scheme.name}</h3>
                <div className="flex gap-2">
                  {Object.values(isDark ? scheme.dark : scheme.light).slice(0, 6).map((color, i) => (
                    <div 
                      key={i}
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Preview */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {colorSchemes[selectedScheme as keyof typeof colorSchemes].name} - {isDark ? 'Dark' : 'Light'} Mode
            </h2>
          </div>
          
          <div className="h-[600px] flex">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0">
              <DemoSidebar 
                scheme={colorSchemes[selectedScheme as keyof typeof colorSchemes]} 
                isDark={isDark} 
              />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <DemoHeader 
                scheme={colorSchemes[selectedScheme as keyof typeof colorSchemes]} 
                isDark={isDark} 
              />
              
              {/* Status Bar */}
              <DemoStatusBar 
                scheme={colorSchemes[selectedScheme as keyof typeof colorSchemes]} 
                isDark={isDark} 
              />
              
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <DemoMessages 
                  scheme={colorSchemes[selectedScheme as keyof typeof colorSchemes]} 
                  isDark={isDark} 
                />
              </div>
              
              {/* Input Area */}
              <DemoInput 
                scheme={colorSchemes[selectedScheme as keyof typeof colorSchemes]} 
                isDark={isDark} 
              />
            </div>
          </div>
        </div>

        {/* Color Details */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Color Values - {colorSchemes[selectedScheme as keyof typeof colorSchemes].name}
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Light Mode</h4>
              <div className="space-y-2">
                {Object.entries(colorSchemes[selectedScheme as keyof typeof colorSchemes].light).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: value }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{key}:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{value}</code>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Dark Mode</h4>
              <div className="space-y-2">
                {Object.entries(colorSchemes[selectedScheme as keyof typeof colorSchemes].dark).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: value }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{key}:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{value}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};