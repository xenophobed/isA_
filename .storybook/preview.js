import '../styles/globals.css';
import React from 'react';

// Theme switcher for Storybook
const themeGlobal = {
  name: 'Theme',
  description: 'Switch between light and dark themes',
  defaultValue: 'dark',
  toolbar: {
    icon: 'circlehollow',
    items: [
      { value: 'light', title: 'Light Theme', left: '☀️' },
      { value: 'dark', title: 'Dark Theme', left: '🌙' },
    ],
    showName: true,
  },
};

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        },
        {
          name: 'light',
          value: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f1f3f4 100%)',
        },
        {
          name: 'gemini-light',
          value: '#ffffff',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
    docs: {
      theme: {
        colorPrimary: '#4285f4', // Gemini blue
        colorSecondary: '#34a853', // Gemini green
        
        // UI - Updated for Gemini style
        appBg: '#ffffff',
        appContentBg: '#f8f9fa',
        appBorderColor: 'rgba(66, 133, 244, 0.12)',
        appBorderRadius: 16,
        
        // Text colors
        textColor: '#0d1421',
        textInverseColor: '#ffffff',
        
        // Toolbar colors
        barTextColor: '#3c4043',
        barSelectedColor: '#4285f4',
        barBg: '#f1f3f4',
        
        // Form colors
        inputBg: 'rgba(255, 255, 255, 0.95)',
        inputBorder: 'rgba(66, 133, 244, 0.12)',
        inputTextColor: '#0d1421',
        inputBorderRadius: 8,
      },
    },
  },
  globalTypes: {
    theme: themeGlobal,
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark';
      
      // Apply theme to document
      React.useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
          root.setAttribute('data-theme', 'light');
          root.style.colorScheme = 'light';
        } else {
          root.removeAttribute('data-theme');
          root.style.colorScheme = 'dark';
        }
      }, [theme]);

      return (
        <div style={{ 
          background: theme === 'light' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f1f3f4 100%)'
            : 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
          color: theme === 'light' ? '#0d1421' : '#f8fafc'
        }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;