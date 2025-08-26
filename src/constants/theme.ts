/**
 * 统一的主题颜色系统
 * Unified theme color system for consistent design
 */

export const THEME_COLORS = {
  // Dark theme (default)
  dark: {
    primaryGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    secondaryGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  
  // Light theme
  light: {
    primaryGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    secondaryGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  
  // Legacy support - defaults to dark theme
  primaryGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
  secondaryGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  
  // Glassmorphism colors for different themes
  glass: {
    dark: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      heavy: 'rgba(255, 255, 255, 0.18)',
      overlay: 'rgba(0, 0, 0, 0.2)',
      accent: 'rgba(99, 102, 241, 0.1)',
    },
    light: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.06)',
      heavy: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(255, 255, 255, 0.7)',
      accent: 'rgba(99, 102, 241, 0.08)',
    }
  },
  
  // Border colors for different themes
  border: {
    dark: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(255, 255, 255, 0.3)',
    },
    light: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.15)',
      heavy: 'rgba(0, 0, 0, 0.2)',
    }
  },
  
  // Text colors for different themes - enhanced contrast
  text: {
    dark: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.75)',
      muted: 'rgba(255, 255, 255, 0.55)',
      accent: 'rgba(99, 102, 241, 1)',
      accentMuted: 'rgba(99, 102, 241, 0.8)',
    },
    light: {
      primary: 'rgba(31, 41, 55, 1)',
      secondary: 'rgba(75, 85, 99, 1)',
      muted: 'rgba(107, 114, 128, 1)',
      accent: 'rgba(99, 102, 241, 1)',
      accentMuted: 'rgba(99, 102, 241, 0.8)',
    }
  }
};

// Utility function to get current theme colors
export const getCurrentThemeColors = () => {
  const isDark = !document.documentElement.hasAttribute('data-theme') || 
                 document.documentElement.getAttribute('data-theme') === 'dark';
  const theme = isDark ? 'dark' : 'light';
  
  return {
    theme,
    colors: {
      primaryGradient: THEME_COLORS[theme].primaryGradient,
      secondaryGradient: THEME_COLORS[theme].secondaryGradient,
      accentGradient: THEME_COLORS[theme].accentGradient,
      glass: THEME_COLORS.glass[theme],
      border: THEME_COLORS.border[theme],
      text: THEME_COLORS.text[theme],
    }
  };
};

export const getThemeClasses = (isDark: boolean = false) => ({
  // Background classes
  primaryBg: isDark ? 'bg-gray-900' : 'bg-white',
  secondaryBg: isDark ? 'bg-gray-800' : 'bg-gray-50',
  
  // Text classes
  primaryText: isDark ? 'text-white/90' : 'text-gray-900',
  secondaryText: isDark ? 'text-white/60' : 'text-gray-600',
  mutedText: isDark ? 'text-white/40' : 'text-gray-500',
  
  // Border classes
  border: isDark ? 'border-white/20' : 'border-gray-300/50',
  borderHover: isDark ? 'hover:border-white/30' : 'hover:border-gray-400/50',
});