/**
 * ============================================================================
 * ThemeToggle Storybook Stories
 * ============================================================================
 * 
 * Stories for the ThemeToggle component showcasing:
 * - Different sizes (sm, md, lg)
 * - Dark and light theme states
 * - Interactive toggling functionality
 * - Gemini-inspired design
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/Theme/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ThemeToggle is a beautiful switch component for toggling between light and dark themes.

Features:
- **Gemini-inspired design** with colorful gradients
- **Three sizes**: sm, md, lg
- **Smooth animations** and hover effects
- **Accessibility support** with proper ARIA labels
- **Theme persistence** via localStorage
- **System theme detection** on first load

The component uses CSS variables and supports both dark and light theme modes with appropriate color schemes for each state.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the toggle button'
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes'
    }
  },
  args: {
    size: 'md',
    className: ''
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default theme toggle
export const Default: Story = {
  args: {
    size: 'md'
  }
};

// Small size
export const Small: Story = {
  args: {
    size: 'sm'
  }
};

// Large size  
export const Large: Story = {
  args: {
    size: 'lg'
  }
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <ThemeToggle size="sm" />
        <p className="mt-2 text-xs opacity-70">Small</p>
      </div>
      <div className="text-center">
        <ThemeToggle size="md" />
        <p className="mt-2 text-xs opacity-70">Medium</p>
      </div>
      <div className="text-center">
        <ThemeToggle size="lg" />
        <p className="mt-2 text-xs opacity-70">Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all available sizes'
      }
    }
  }
};

// Custom styling example
export const CustomStyled: Story = {
  args: {
    size: 'md',
    className: 'transform scale-125 shadow-2xl'
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom CSS classes applied'
      }
    }
  }
};

// Multiple toggles in a layout
export const InLayout: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6 rounded-2xl" style={{
      background: 'var(--glass-primary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Settings Panel
        </h3>
        <ThemeToggle size="sm" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Dark Mode</span>
          <ThemeToggle size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Auto Theme</span>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ThemeToggle components integrated into a settings panel layout'
      }
    }
  }
};