/**
 * ============================================================================
 * Theme Toggle Component (ThemeToggle.tsx) - 主题切换组件
 * ============================================================================
 * 
 * 功能：
 * - 深色/浅色主题一键切换
 * - 记住用户选择（localStorage）
 * - 响应系统主题偏好
 * - 流畅的切换动画
 * - 优化的浅色主题视觉效果
 */

import React, { useState, useEffect } from 'react';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // 确保组件挂载后再显示，避免服务端渲染不一致
  useEffect(() => {
    setMounted(true);
    
    // 从localStorage获取保存的主题，如果没有则使用系统偏好
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else {
      root.removeAttribute('data-theme');
      root.style.colorScheme = 'dark';
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // 优化的滑块位置计算
  const getSliderPosition = () => {
    if (theme === 'dark') {
      return 'left-0.5';
    }
    
    // 浅色主题下的精确位置计算
    switch (size) {
      case 'sm':
        return 'left-4';
      case 'md':
        return 'left-5';
      case 'lg':
        return 'left-7';
      default:
        return 'left-5';
    }
  };

  // 避免服务端渲染闪烁
  if (!mounted) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} 
        relative rounded-full transition-all duration-300 ease-in-out
        transform hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e8eaed 100%)',
        border: theme === 'light' ? '1px solid rgba(66, 133, 244, 0.15)' : 'none',
        boxShadow: theme === 'dark'
          ? '0 2px 8px rgba(0, 0, 0, 0.2)'
          : '0 2px 8px rgba(60, 64, 67, 0.12), 0 0 0 1px rgba(66, 133, 244, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {/* 优化的切换滑块 */}
      <div
        className={`
          absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${getSliderPosition()}
        `}
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
            : 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 100%)',
          boxShadow: theme === 'dark'
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 2px 6px rgba(66, 133, 244, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.9)' : 'none'
        }}
      >
        {/* Gemini 风格的主题图标 */}
        {theme === 'dark' ? (
          // 月亮图标 - 暗色主题
          <svg 
            className={`${iconSizes[size]} text-gray-100`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Gemini logo 样式的太阳 - 浅色主题
          <svg 
            className={`${iconSizes[size]} text-white`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </div>

      {/* 优化的背景装饰 */}
      <div className="absolute inset-0 rounded-full opacity-40">
        {theme === 'dark' ? (
          // 星星装饰 - 暗色主题
          <div className="flex items-center justify-end pr-2 h-full">
            <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-60 animate-pulse" />
            <div className="w-0.5 h-0.5 bg-yellow-200 rounded-full ml-1 opacity-40 animate-pulse delay-100" />
          </div>
        ) : (
          // 优化的 Gemini 彩色光点装饰 - 浅色主题
          <div className="flex items-center justify-start pl-2 h-full space-x-0.5">
            <div className="w-1 h-1 bg-red-400 rounded-full opacity-80 shadow-sm" />
            <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-80 shadow-sm" />
            <div className="w-1 h-1 bg-green-400 rounded-full opacity-80 shadow-sm" />
            <div className="w-1 h-1 bg-blue-400 rounded-full opacity-80 shadow-sm" />
            {/* 添加额外的装饰元素 */}
            <div className="w-0.5 h-0.5 bg-purple-400 rounded-full opacity-60 ml-1" />
            <div className="w-0.5 h-0.5 bg-orange-400 rounded-full opacity-60 ml-0.5" />
          </div>
        )}
      </div>

      {/* 浅色主题下的额外视觉层次 */}
      {theme === 'light' && (
        <div className="absolute inset-0 rounded-full opacity-20">
          <div className="absolute top-1 right-1 w-1 h-1 bg-blue-300 rounded-full" />
          <div className="absolute bottom-1 right-2 w-0.5 h-0.5 bg-green-300 rounded-full" />
        </div>
      )}
    </button>
  );
};