import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { ToastProvider, ToastContainer, useToast } from './Toast';
import { Button } from './Button';

const meta: Meta<typeof ToastContainer> = {
  title: 'UI/Toast',
  component: ToastContainer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Toast system provides non-intrusive notifications with multiple types, 
positions, and advanced features like virtualization and batch operations.

## Features
- Multiple types (success, error, warning, info, loading)
- Configurable positions (6 different positions)
- Auto-dismiss with customizable duration
- Progress indicators and animations
- Batch operations for multiple toasts
- Virtualization support for performance
- Full accessibility with screen reader support
- Interactive elements with action buttons

## Accessibility
- Proper ARIA roles (alert for errors, status for others)
- Screen reader announcements
- Keyboard-accessible close buttons
- Focus management for interactive elements
- High contrast indicators
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Toast Demo Component
const ToastDemo = () => {
  const { addToast, addToasts, removeAllToasts, removeByType } = useToast();

  const showSuccessToast = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Your action was completed successfully.',
      duration: 4000,
    });
  };

  const showErrorToast = () => {
    addToast({
      type: 'error',
      title: 'Error Occurred',
      message: 'Something went wrong. Please try again.',
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  const showWarningToast = () => {
    addToast({
      type: 'warning',
      title: 'Warning',
      message: 'This action may have consequences.',
      duration: 5000,
    });
  };

  const showInfoToast = () => {
    addToast({
      type: 'info',
      title: 'Information',
      message: 'Here is some useful information for you.',
      duration: 4000,
    });
  };

  const showLoadingToast = () => {
    addToast({
      type: 'loading',
      title: 'Processing',
      message: 'Please wait while we process your request...',
      duration: 0, // No auto-dismiss for loading
      closable: false,
    });
  };

  const showBatchToasts = () => {
    addToasts([
      {
        type: 'info',
        message: 'First notification',
        position: 'top-right',
      },
      {
        type: 'success',
        message: 'Second notification',
        position: 'top-right',
      },
      {
        type: 'warning',
        message: 'Third notification',
        position: 'top-right',
      },
    ]);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Toast Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Button variant="success" onClick={showSuccessToast} size="sm">
            Success
          </Button>
          <Button variant="danger" onClick={showErrorToast} size="sm">
            Error
          </Button>
          <Button variant="warning" onClick={showWarningToast} size="sm">
            Warning
          </Button>
          <Button variant="secondary" onClick={showInfoToast} size="sm">
            Info
          </Button>
          <Button variant="ghost" onClick={showLoadingToast} size="sm">
            Loading
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Batch Operations</h2>
        <div className="flex gap-4">
          <Button variant="primary" onClick={showBatchToasts} size="sm">
            Show Batch
          </Button>
          <Button variant="ghost" onClick={removeAllToasts} size="sm">
            Clear All
          </Button>
          <Button variant="ghost" onClick={() => removeByType('error')} size="sm">
            Clear Errors
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Positions</h2>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {[
            'top-left', 'top-center', 'top-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ].map((position) => (
            <Button
              key={position}
              variant="secondary"
              size="xs"
              onClick={() => addToast({
                type: 'info',
                message: `Toast from ${position}`,
                position: position as any,
                duration: 3000,
              })}
            >
              {position}
            </Button>
          ))}
        </div>
      </div>

      {/* Toast Containers for all positions */}
      <ToastContainer position="top-left" />
      <ToastContainer position="top-center" />
      <ToastContainer position="top-right" />
      <ToastContainer position="bottom-left" />
      <ToastContainer position="bottom-center" />
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <ToastDemo />,
};

const PositionDemo = ({ position }: { position: any }) => {
  const { addToast } = useToast();
  
  return (
    <div className="p-8">
      <Button
        variant="primary"
        onClick={() => addToast({
          type: 'success',
          title: 'Position Demo',
          message: `This toast appears at ${position}`,
          position,
          duration: 4000,
        })}
      >
        Show Toast at {position}
      </Button>
      <ToastContainer position={position} />
    </div>
  );
};

export const TopRight: Story = {
  render: () => <PositionDemo position="top-right" />,
};

export const BottomCenter: Story = {
  render: () => <PositionDemo position="bottom-center" />,
};

const VirtualizedDemo = () => {
  const { addToasts } = useToast();

  const showManyToasts = () => {
    const toasts = Array.from({ length: 20 }, (_, i) => ({
      type: 'info' as const,
      title: `Toast ${i + 1}`,
      message: `This is toast number ${i + 1} in a large batch.`,
      duration: 8000,
    }));
    addToasts(toasts);
  };

  return (
    <div className="p-8">
      <Button variant="primary" onClick={showManyToasts}>
        Show 20 Toasts (Virtualized)
      </Button>
      <ToastContainer 
        position="top-right" 
        virtualized={true}
        maxHeight={400}
        maxToasts={5}
      />
    </div>
  );
};

export const Virtualized: Story = {
  render: () => <VirtualizedDemo />,
};

const AccessibilityDemo = () => {
  const { addToast } = useToast();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Accessibility Features</h2>
        <p className="text-white/60 mb-4">
          These toasts demonstrate enhanced accessibility features for screen readers.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          variant="danger"
          onClick={() => addToast({
            type: 'error',
            title: 'Critical Error',
            message: 'This error will be announced immediately to screen readers.',
            'aria-label': 'Critical error notification',
            announceOnShow: true,
            duration: 0, // Don't auto-dismiss errors
          })}
        >
          Critical Error (Announced)
        </Button>

        <Button
          variant="success"
          onClick={() => addToast({
            type: 'success',
            title: 'Action Completed',
            message: 'Your changes have been saved successfully.',
            'aria-label': 'Success notification: Changes saved',
            announceOnShow: true,
          })}
        >
          Success (Announced)
        </Button>

        <Button
          variant="secondary"
          onClick={() => addToast({
            type: 'info',
            message: 'This notification has enhanced accessibility features and proper ARIA attributes.',
            'aria-describedby': 'toast-help',
            role: 'status',
          })}
        >
          Info with ARIA
        </Button>
      </div>

      <div id="toast-help" className="text-sm text-white/40">
        Screen reader users will hear announcements for important notifications.
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
};

export const Accessibility: Story = {
  render: () => <AccessibilityDemo />,
};