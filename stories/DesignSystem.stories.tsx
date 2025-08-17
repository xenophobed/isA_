import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# IsA UI Design System

A comprehensive design system built for modern web applications with a focus on accessibility, 
performance, and developer experience.

## Design Principles

### 🎨 Glassmorphism Aesthetic
Our design language is inspired by modern glassmorphism trends, featuring:
- Translucent backgrounds with backdrop blur effects
- Subtle borders and shadows
- Gradient overlays and sophisticated color palettes
- Smooth transitions and micro-interactions

### ♿ Accessibility First
Every component is built with accessibility in mind:
- WCAG 2.1 AA compliance
- Screen reader support with proper ARIA attributes
- Keyboard navigation for all interactive elements
- High contrast focus indicators
- Semantic HTML structure

### ⚡ Performance Optimized
- CSS Custom Properties for dynamic theming
- Memoized components to prevent unnecessary re-renders
- Virtual scrolling for large datasets
- Optimized bundle size with tree-shaking
- CSS Grid and modern layout techniques

### 🎯 Developer Experience
- TypeScript first with comprehensive type definitions
- Consistent API patterns across components
- Storybook documentation with interactive examples
- ESLint and Prettier configurations
- Automated testing setup

## Architecture

### Design Tokens
Our design system is built on a foundation of design tokens that ensure consistency:

- **Colors**: Semantic color palette with light/dark mode support
- **Spacing**: Consistent spacing scale (4px base unit)
- **Typography**: Hierarchical type scale with proper contrast ratios
- **Shadows**: Layered shadow system for depth and elevation
- **Border Radius**: Consistent corner radius values
- **Animation**: Standardized timing and easing functions

### Component Structure
Each component follows a consistent structure:

1. **Props Interface**: Comprehensive TypeScript definitions
2. **Styling**: CSS-in-JS or CSS Custom Properties
3. **Accessibility**: Built-in ARIA attributes and keyboard support
4. **Documentation**: Storybook stories with usage examples
5. **Testing**: Unit tests and accessibility tests

## Usage Guidelines

### Import Components
\`\`\`typescript
import { Button, Modal, Toast } from '@/components/shared/ui';
\`\`\`

### Apply Theme
The design system automatically applies the glassmorphism theme through CSS Custom Properties:

\`\`\`css
:root {
  --glass-primary: rgba(15, 15, 35, 0.8);
  --glass-secondary: rgba(26, 26, 46, 0.9);
  --glass-border: rgba(99, 102, 241, 0.1);
  /* ... more tokens */
}
\`\`\`

### Component Composition
Components are designed to work together seamlessly:

\`\`\`tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
  footer={
    <div className="layout-center gap-lg">
      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to continue?</p>
</Modal>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorPalette: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Color Palette</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Brand Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg" style={{ background: 'var(--color-primary)' }}></div>
                <div className="text-sm text-white/80">Primary</div>
                <div className="text-xs text-white/60">--color-primary</div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg" style={{ background: 'var(--color-secondary)' }}></div>
                <div className="text-sm text-white/80">Secondary</div>
                <div className="text-xs text-white/60">--color-secondary</div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg" style={{ background: 'var(--color-accent)' }}></div>
                <div className="text-sm text-white/80">Accent</div>
                <div className="text-xs text-white/60">--color-accent</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Glass System</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg glass-primary border border-glass-border"></div>
                <div className="text-sm text-white/80">Glass Primary</div>
                <div className="text-xs text-white/60">--glass-primary</div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg glass-secondary border border-glass-border"></div>
                <div className="text-sm text-white/80">Glass Secondary</div>
                <div className="text-xs text-white/60">--glass-secondary</div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg glass-tertiary border border-glass-border"></div>
                <div className="text-sm text-white/80">Glass Tertiary</div>
                <div className="text-xs text-white/60">--glass-tertiary</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Gradients</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg" style={{ background: 'var(--gradient-primary)' }}></div>
                <div className="text-sm text-white/80">Primary Gradient</div>
                <div className="text-xs text-white/60">--gradient-primary</div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 rounded-lg" style={{ background: 'var(--gradient-secondary)' }}></div>
                <div className="text-sm text-white/80">Secondary Gradient</div>
                <div className="text-xs text-white/60">--gradient-secondary</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Typography Scale</h2>
      
      <div className="space-y-4">
        <div className="text-4xl font-bold text-white">Heading 1</div>
        <div className="text-3xl font-bold text-white">Heading 2</div>
        <div className="text-2xl font-semibold text-white">Heading 3</div>
        <div className="text-xl font-semibold text-white">Heading 4</div>
        <div className="text-lg font-medium text-white">Heading 5</div>
        <div className="text-base font-medium text-white">Heading 6</div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="text-lg font-semibold text-white">Body Text</div>
        <div className="text-base text-primary">Large body text with primary color</div>
        <div className="text-base text-secondary">Regular body text with secondary color</div>
        <div className="text-sm text-muted">Small text with muted color</div>
        <div className="text-xs text-disabled">Extra small text with disabled color</div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="text-lg font-semibold text-white">Interactive Text</div>
        <div className="text-base text-primary hover:text-primary-hover cursor-pointer transition-colors">
          Hover to see color change
        </div>
        <div className="text-gradient text-lg font-bold">
          Gradient Text Effect
        </div>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Spacing Scale</h2>
      
      <div className="space-y-4">
        {[
          { name: 'xs', value: 'var(--space-xs)', px: '4px' },
          { name: 'sm', value: 'var(--space-sm)', px: '8px' },
          { name: 'md', value: 'var(--space-md)', px: '12px' },
          { name: 'lg', value: 'var(--space-lg)', px: '16px' },
          { name: 'xl', value: 'var(--space-xl)', px: '20px' },
          { name: '2xl', value: 'var(--space-2xl)', px: '24px' },
          { name: '3xl', value: 'var(--space-3xl)', px: '32px' },
          { name: '4xl', value: 'var(--space-4xl)', px: '40px' },
          { name: '5xl', value: 'var(--space-5xl)', px: '48px' },
        ].map(({ name, value, px }) => (
          <div key={name} className="flex items-center gap-4">
            <div className="w-16 text-sm text-white/80">{name}</div>
            <div 
              className="bg-primary rounded"
              style={{ width: value, height: '24px' }}
            ></div>
            <div className="text-sm text-white/60">{px}</div>
            <div className="text-xs text-white/40">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Shadow System</h2>
      
      <div className="grid grid-cols-3 gap-6">
        {[
          { name: 'Small', class: 'shadow-sm' },
          { name: 'Medium', class: 'shadow-md' },
          { name: 'Large', class: 'shadow-lg' },
          { name: 'Extra Large', class: 'shadow-xl' },
          { name: '2X Large', class: 'shadow-2xl' },
          { name: 'Glow', class: 'shadow-glow' },
        ].map(({ name, class: shadowClass }) => (
          <div key={name} className="space-y-2">
            <div 
              className={`w-full h-24 glass-primary rounded-xl ${shadowClass}`}
            ></div>
            <div className="text-sm text-white/80">{name}</div>
            <div className="text-xs text-white/60">{shadowClass}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Border Radius Scale</h2>
      
      <div className="grid grid-cols-4 gap-6">
        {[
          { name: 'XS', class: 'rounded-xs', value: '4px' },
          { name: 'SM', class: 'rounded-sm', value: '8px' },
          { name: 'MD', class: 'rounded-md', value: '12px' },
          { name: 'LG', class: 'rounded-lg', value: '16px' },
          { name: 'XL', class: 'rounded-xl', value: '20px' },
          { name: '2XL', class: 'rounded-2xl', value: '24px' },
          { name: 'Full', class: 'rounded-full', value: '9999px' },
        ].map(({ name, class: radiusClass, value }) => (
          <div key={name} className="space-y-2">
            <div 
              className={`w-16 h-16 glass-primary border border-glass-border ${radiusClass}`}
            ></div>
            <div className="text-sm text-white/80">{name}</div>
            <div className="text-xs text-white/60">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Utilities: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Utility Classes</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Layout Utilities</h3>
          <div className="space-y-4">
            <div className="layout-center w-32 h-16 glass-primary rounded-lg">
              <span className="text-sm text-white/80">layout-center</span>
            </div>
            <div className="layout-between w-32 h-16 glass-primary rounded-lg px-4">
              <span className="text-xs text-white/80">A</span>
              <span className="text-xs text-white/80">B</span>
            </div>
            <div className="layout-start w-32 h-16 glass-primary rounded-lg px-4">
              <span className="text-xs text-white/80">layout-start</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Interactive Utilities</h3>
          <div className="space-y-4">
            <div className="interactive w-32 h-16 glass-primary rounded-lg layout-center">
              <span className="text-sm text-white/80">interactive</span>
            </div>
            <div className="interactive-scale w-32 h-16 glass-secondary rounded-lg layout-center">
              <span className="text-sm text-white/80">interactive-scale</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Glass Utilities</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-primary h-16 rounded-lg layout-center">
              <span className="text-sm text-white/80">glass-primary</span>
            </div>
            <div className="glass-secondary h-16 rounded-lg layout-center">
              <span className="text-sm text-white/80">glass-secondary</span>
            </div>
            <div className="glass-tertiary h-16 rounded-lg layout-center">
              <span className="text-sm text-white/80">glass-tertiary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};