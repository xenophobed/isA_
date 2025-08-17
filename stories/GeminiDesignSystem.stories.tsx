/**
 * ============================================================================
 * Gemini Design System Documentation
 * ============================================================================
 * 
 * This showcases our Gemini-inspired design tokens and components
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Gemini Theme',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Gemini-Inspired Design System

Our design system takes inspiration from Google Gemini's clean, modern aesthetic while maintaining 
our unique glassmorphism elements and AI-first design principles.

## Key Features

- **Clean & Modern**: Minimalist design with plenty of white space
- **Google Brand Colors**: Official Gemini color palette
- **Smart Theming**: Seamless light/dark mode switching
- **Accessibility**: WCAG 2.1 AA compliant across all themes
- **Performance**: Optimized CSS Custom Properties system
        `
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GeminiColors: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Gemini Color Palette
        </h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Official Google Gemini brand colors used throughout the interface
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#4285f4' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Blue</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#4285f4</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Primary accent</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#34a853' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Green</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#34a853</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Success states</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#fbbc04' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Yellow</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#fbbc04</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Warning states</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#ea4335' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Red</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#ea4335</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Error states</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#9c27b0' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Purple</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#9c27b0</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Creative tools</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="w-full h-20 rounded-xl shadow-lg" 
              style={{ backgroundColor: '#ff6d01' }}
            ></div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Orange</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>#ff6d01</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Highlights</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ThemeComparison: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Theme Comparison
        </h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Side-by-side comparison of our dark and light theme implementations
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dark Theme Preview */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
              borderColor: 'rgba(99, 102, 241, 0.2)'
            }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">Dark Theme</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ 
                background: 'rgba(15, 15, 35, 0.8)',
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}>
                <div className="text-white font-medium">Glassmorphism Card</div>
                <div className="text-gray-300 text-sm mt-1">Deep gradients with purple accents</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                <div>
                  <div className="text-white font-medium">AI Assistant</div>
                  <div className="text-gray-400 text-sm">Purple-blue gradient avatar</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              </div>
            </div>
          </div>
          
          {/* Light Theme Preview */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f1f3f4 100%)',
              borderColor: 'rgba(66, 133, 244, 0.12)',
              color: '#0d1421'
            }}
          >
            <h3 className="text-xl font-bold mb-4">Light Theme (Gemini)</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(66, 133, 244, 0.08)',
                boxShadow: '0 1px 3px rgba(60, 64, 67, 0.05)'
              }}>
                <div className="font-medium" style={{ color: '#0d1421' }}>Clean Card Design</div>
                <div className="text-sm mt-1" style={{ color: '#3c4043' }}>
                  Clean whites with Gemini brand colors
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full" 
                  style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' }}
                ></div>
                <div>
                  <div className="font-medium" style={{ color: '#0d1421' }}>AI Assistant</div>
                  <div className="text-sm" style={{ color: '#5f6368' }}>
                    Gemini blue-green gradient
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#4285f4' }}></div>
                <div className="w-3 h-3 rounded-full" style={{ background: '#34a853' }}></div>
                <div className="w-3 h-3 rounded-full" style={{ background: '#fbbc04' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ComponentShowcase: Story = {
  render: () => (
    <div className="p-8 space-y-12">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Gemini-Style Components
        </h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Key components styled with Gemini design principles
        </p>
      </div>
      
      {/* Buttons */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Buttons & Controls
        </h3>
        <div className="flex items-center gap-4 flex-wrap">
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)'
            }}
          >
            Primary Action
          </button>
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          >
            Secondary Action
          </button>
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: '#34a853',
              color: 'white',
              boxShadow: '0 2px 8px rgba(52, 168, 83, 0.3)'
            }}
          >
            Success Action
          </button>
        </div>
      </section>
      
      {/* Input Elements */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Input Elements
        </h3>
        <div className="max-w-md space-y-4">
          <input 
            type="text" 
            placeholder="Search or ask anything..."
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          />
          <textarea 
            placeholder="Type your message here..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none resize-none"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </section>
      
      {/* Cards */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Card Layouts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="p-6 rounded-xl transition-all hover:scale-105"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 2px 8px rgba(60, 64, 67, 0.08)'
            }}
          >
            <div className="flex items-center mb-4">
              <div 
                className="w-10 h-10 rounded-full mr-3"
                style={{ background: '#4285f4' }}
              ></div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Blue Feature
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Primary feature card
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              This card showcases the primary Gemini blue color with clean typography and subtle shadows.
            </p>
          </div>
          
          <div 
            className="p-6 rounded-xl transition-all hover:scale-105"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 2px 8px rgba(60, 64, 67, 0.08)'
            }}
          >
            <div className="flex items-center mb-4">
              <div 
                className="w-10 h-10 rounded-full mr-3"
                style={{ background: '#34a853' }}
              ></div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Green Success
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Success state card
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Green variant for positive actions and successful operations in the interface.
            </p>
          </div>
          
          <div 
            className="p-6 rounded-xl transition-all hover:scale-105"
            style={{
              background: 'var(--glass-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 2px 8px rgba(60, 64, 67, 0.08)'
            }}
          >
            <div className="flex items-center mb-4">
              <div 
                className="w-10 h-10 rounded-full mr-3"
                style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' }}
              ></div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Gradient Magic
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Multi-color gradient
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gradient combinations using multiple Gemini brand colors for visual interest.
            </p>
          </div>
        </div>
      </section>
    </div>
  ),
};