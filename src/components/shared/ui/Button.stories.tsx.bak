import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button, PrimaryButton, SecondaryButton, DangerButton, IconButton } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      description: {
        component: `
The Button component provides a unified button system with multiple variants, sizes, and states. 
It includes built-in accessibility features, loading states, and icon support.

## Features
- Multiple variants (primary, secondary, success, danger, warning, ghost, link, icon)
- Various sizes (xs, sm, md, lg, xl)
- Loading states with spinner
- Icon support with configurable positioning
- Full accessibility support with ARIA attributes
- Optimized performance with memoization
- Design system integration with CSS custom properties

## Accessibility
- Proper ARIA labels for icon-only buttons
- Loading state announcements
- Keyboard navigation support
- High contrast focus indicators
        `,
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'ghost', 'link', 'icon'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    state: {
      control: 'select',
      options: ['normal', 'loading', 'disabled', 'pressed'],
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Save Changes',
    icon: '💾',
    iconPosition: 'left',
  },
};

export const IconOnly: Story = {
  args: {
    variant: 'icon',
    icon: '⚙️',
    onlyIcon: true,
    'aria-label': 'Settings',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Processing...',
    loading: true,
    loadingText: 'Processing your request',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary" size="xs">Extra Small</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
      <Button variant="primary" size="xl">Extra Large</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <Button variant="success">Success</Button>
      <DangerButton>Danger</DangerButton>
      <Button variant="warning">Warning</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <IconButton icon="⭐" aria-label="Favorite" />
    </div>
  ),
};

export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-white mb-2">Icon Button with Proper ARIA Label</h3>
        <IconButton 
          icon="🔍" 
          aria-label="Search for content"
          aria-describedby="search-help"
        />
        <div id="search-help" className="text-sm text-white/60 mt-1">
          Click to open search dialog
        </div>
      </div>
      
      <div>
        <h3 className="text-white mb-2">Toggle Button</h3>
        <Button 
          variant="secondary"
          aria-pressed={false}
          role="switch"
          aria-label="Enable notifications"
        >
          🔔 Notifications: Off
        </Button>
      </div>
      
      <div>
        <h3 className="text-white mb-2">Loading State with Announcement</h3>
        <Button 
          variant="primary"
          loading={true}
          loadingText="Saving your changes, please wait"
        >
          Save Changes
        </Button>
      </div>
    </div>
  ),
};