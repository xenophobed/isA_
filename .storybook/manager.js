import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'dark',
  brandTitle: 'IsA UI Components',
  brandUrl: './',
  brandTarget: '_self',

  colorPrimary: '#6366f1',
  colorSecondary: '#8b5cf6',

  // UI
  appBg: '#0f0f23',
  appContentBg: '#1a1a2e',
  appBorderColor: 'rgba(99, 102, 241, 0.1)',
  appBorderRadius: 16,

  // Typography
  fontBase: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  fontCode: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',

  // Text colors
  textColor: '#f8fafc',
  textInverseColor: '#0f172a',

  // Toolbar default and active colors
  barTextColor: '#e2e8f0',
  barSelectedColor: '#6366f1',
  barBg: '#16213e',

  // Form colors
  inputBg: 'rgba(26, 26, 46, 0.9)',
  inputBorder: 'rgba(99, 102, 241, 0.1)',
  inputTextColor: '#f8fafc',
  inputBorderRadius: 12,
});

addons.setConfig({
  theme,
});