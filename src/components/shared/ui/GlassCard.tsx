/**
 * GlassCard Component - Ultra-modern glassmorphism container
 * Core building block for Glassmorphism Pro design system
 */
import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'intense';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  blur?: 'light' | 'medium' | 'heavy';
  opacity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  onClick,
  hover = true,
  blur = 'medium',
  opacity = 'medium'
}) => {
  const getVariantStyles = () => {
    const isDark = document.documentElement.classList.contains('dark');
    
    const blurValues = {
      light: 'backdrop-blur-sm',
      medium: 'backdrop-blur-md', 
      heavy: 'backdrop-blur-lg'
    };

    const opacityValues = isDark ? {
      low: 'bg-white/5',
      medium: 'bg-white/10',
      high: 'bg-white/15'
    } : {
      low: 'bg-white/20',
      medium: 'bg-white/25',
      high: 'bg-white/35'
    };

    const borderOpacity = isDark ? 'border-white/10' : 'border-white/18';
    
    switch (variant) {
      case 'elevated':
        return `
          ${opacityValues.high} ${blurValues.heavy}
          border-2 ${borderOpacity}
          shadow-2xl shadow-black/20
          ring-1 ring-white/30 dark:ring-white/15
          ${hover ? 'hover:bg-white/25 dark:hover:bg-white/18 hover:shadow-3xl hover:ring-white/40' : ''}
        `;
      case 'subtle':
        return `
          ${opacityValues.low} ${blurValues.light}
          border ${borderOpacity}
          shadow-lg shadow-black/5
          ${hover ? 'hover:bg-white/15 dark:hover:bg-white/8' : ''}
        `;
      case 'intense':
        return `
          ${opacityValues.high} ${blurValues.heavy}
          border-2 ${borderOpacity}
          shadow-2xl shadow-black/30
          ring-1 ring-white/20 dark:ring-white/10
          ${hover ? 'hover:bg-white/30 dark:hover:bg-white/20 hover:ring-white/30' : ''}
        `;
      default:
        return `
          ${opacityValues.medium} ${blurValues.medium}
          border ${borderOpacity}
          shadow-xl shadow-black/15
          ring-1 ring-white/20 dark:ring-white/10
          ${hover ? 'hover:bg-white/30 dark:hover:bg-white/15 hover:ring-white/30' : ''}
        `;
    }
  };

  return (
    <div
      className={`
        glass-card
        rounded-2xl
        transition-all duration-300 ease-out
        ${getVariantStyles()}
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{
        background: variant === 'intense' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          : undefined,
        ...style
      }}
    >
      {children}
    </div>
  );
};