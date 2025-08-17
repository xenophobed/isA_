/**
 * ============================================================================
 * UserButton Storybook Stories
 * ============================================================================
 * 
 * Stories for the UserButton component showcasing:
 * - Authenticated and unauthenticated states
 * - Different user data scenarios
 * - Loading states
 * - Gemini-inspired design
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UserButton } from './UserButton';

// Mock user data for stories
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  picture: 'https://via.placeholder.com/40'
};

const mockUserWithoutName = {
  email: 'jane.smith@example.com'
};

const meta: Meta<typeof UserButton> = {
  title: 'UI/User/UserButton',
  component: UserButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
UserButton displays user authentication status and profile information.

Features:
- **Two states**: Authenticated and unauthenticated
- **Gemini-inspired design** with gradient avatars
- **Loading indicators** for async operations
- **Flexible user data** display (name or email)
- **Accessibility support** with proper ARIA labels
- **Hover effects** and smooth transitions

The component automatically handles user avatars with initials and provides appropriate actions based on authentication state.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onToggleDrawer: {
      action: 'drawer toggled',
      description: 'Callback fired when the drawer toggle is clicked'
    },
    showDrawer: {
      control: { type: 'boolean' },
      description: 'Whether the drawer is currently shown'
    }
  },
  decorators: [
    (Story) => (
      <div className="w-80 p-4 rounded-lg" style={{
        background: 'var(--glass-primary)',
        border: '1px solid var(--glass-border)'
      }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

// Authenticated user with full name
export const AuthenticatedWithName: Story = {
  parameters: {
    mockData: {
      isAuthenticated: true,
      auth0User: mockUser,
      credits: 150,
      currentPlan: 'Pro'
    }
  }
};

// Authenticated user with email only
export const AuthenticatedWithEmail: Story = {
  parameters: {
    mockData: {
      isAuthenticated: true,
      auth0User: mockUserWithoutName,
      credits: 75,
      currentPlan: 'Free'
    }
  }
};

// Unauthenticated state
export const Unauthenticated: Story = {
  parameters: {
    mockData: {
      isAuthenticated: false,
      auth0User: null,
      isLoading: false
    }
  }
};

// Loading state (during authentication)
export const Loading: Story = {
  parameters: {
    mockData: {
      isAuthenticated: false,
      auth0User: null,
      isLoading: true
    }
  }
};

// Low credits warning
export const LowCredits: Story = {
  parameters: {
    mockData: {
      isAuthenticated: true,
      auth0User: mockUser,
      credits: 5,
      currentPlan: 'Free',
      hasCredits: false
    }
  }
};

// Premium user
export const PremiumUser: Story = {
  parameters: {
    mockData: {
      isAuthenticated: true,
      auth0User: {
        ...mockUser,
        name: 'Premium User'
      },
      credits: 1000,
      currentPlan: 'Enterprise',
      hasCredits: true
    }
  }
};

// Different user scenarios
export const UserScenarios: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium mb-2 opacity-70">Authenticated (Pro)</h4>
        <UserButton onToggleDrawer={() => {}} />
      </div>
      
      <div className="p-3 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium mb-2 opacity-70">Unauthenticated</h4>
        <UserButton onToggleDrawer={() => {}} />
      </div>
      
      <div className="p-3 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium mb-2 opacity-70">Loading</h4>
        <UserButton onToggleDrawer={() => {}} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different user authentication and loading states'
      }
    }
  }
};

// In sidebar context
export const InSidebar: Story = {
  render: () => (
    <div className="w-64 p-4 rounded-xl" style={{
      background: 'var(--gradient-primary)',
      border: '1px solid var(--glass-border)'
    }}>
      <div className="space-y-4">
        {/* Other sidebar content */}
        <div className="space-y-2">
          <div className="h-8 bg-white/5 rounded-lg"></div>
          <div className="h-6 bg-white/5 rounded-lg w-3/4"></div>
          <div className="h-6 bg-white/5 rounded-lg w-1/2"></div>
        </div>
        
        {/* User button at bottom */}
        <div className="border-t border-white/10 pt-4 mt-auto">
          <UserButton onToggleDrawer={() => {}} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'UserButton positioned in a typical sidebar layout'
      }
    }
  }
};