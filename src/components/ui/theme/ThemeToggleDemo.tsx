/**
 * ============================================================================
 * ThemeToggle Demo Component (ThemeToggleDemo.tsx) - 主题切换演示组件
 * ============================================================================
 * 
 * 功能：
 * - 展示优化后的ThemeToggle组件
 * - 对比深色和浅色主题效果
 * - 展示不同尺寸的组件
 * - 提供主题切换的实时预览
 */

import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export const ThemeToggleDemo: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    
    // 应用主题到文档
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else {
      root.removeAttribute('data-theme');
      root.style.colorScheme = 'dark';
    }
  };

  return (
    <div className="min-h-screen p-8 transition-all duration-300"
         style={{
           background: currentTheme === 'dark' 
             ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
             : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f1f3f4 100%)',
           color: currentTheme === 'dark' ? '#f8fafc' : '#0d1421'
         }}>
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" 
            style={{ color: currentTheme === 'dark' ? '#f8fafc' : '#0d1421' }}>
          ThemeToggle 优化演示
        </h1>
        <p className="text-lg opacity-80" 
           style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#5f6368' }}>
          展示优化后的浅色主题效果和深色主题对比
        </p>
      </div>

      {/* Theme Toggle Section */}
      <div className="max-w-4xl mx-auto">
        {/* Main Toggle */}
        <div className="text-center mb-12">
          <div className="inline-block p-6 rounded-2xl mb-4"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.8)' 
                   : 'rgba(255, 255, 255, 0.9)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.1)' 
                   : '1px solid rgba(66, 133, 244, 0.15)',
                 boxShadow: currentTheme === 'dark'
                   ? '0 8px 32px rgba(0, 0, 0, 0.2)'
                   : '0 8px 32px rgba(60, 64, 67, 0.12), 0 0 0 1px rgba(66, 133, 244, 0.1)'
               }}>
            <ThemeToggle size="lg" />
          </div>
          <p className="text-sm opacity-70" 
             style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#9aa0a6' }}>
            点击切换主题
          </p>
        </div>

        {/* Size Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 rounded-xl"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.6)' 
                   : 'rgba(255, 255, 255, 0.8)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.08)' 
                   : '1px solid rgba(66, 133, 244, 0.12)'
               }}>
            <ThemeToggle size="sm" />
            <p className="mt-3 font-medium" 
               style={{ color: currentTheme === 'dark' ? '#e2e8f0' : '#3c4043' }}>
              小尺寸 (sm)
            </p>
          </div>

          <div className="text-center p-6 rounded-xl"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.6)' 
                   : 'rgba(255, 255, 255, 0.8)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.08)' 
                   : '1px solid rgba(66, 133, 244, 0.12)'
               }}>
            <ThemeToggle size="md" />
            <p className="mt-3 font-medium" 
               style={{ color: currentTheme === 'dark' ? '#e2e8f0' : '#3c4043' }}>
              中尺寸 (md)
            </p>
          </div>

          <div className="text-center p-6 rounded-xl"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.6)' 
                   : 'rgba(255, 255, 255, 0.8)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.08)' 
                   : '1px solid rgba(66, 133, 244, 0.12)'
               }}>
            <ThemeToggle size="lg" />
            <p className="mt-3 font-medium" 
               style={{ color: currentTheme === 'dark' ? '#e2e8f0' : '#3c4043' }}>
              大尺寸 (lg)
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.6)' 
                   : 'rgba(255, 255, 255, 0.8)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.08)' 
                   : '1px solid rgba(66, 133, 244, 0.12)'
               }}>
            <h3 className="text-lg font-semibold mb-3" 
                style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#0d1421' }}>
              🎨 浅色主题优化
            </h3>
            <ul className="space-y-2 text-sm opacity-80" 
                style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#5f6368' }}>
              <li>• 增强的边框对比度</li>
              <li>• 优化的阴影效果</li>
              <li>• 丰富的渐变背景</li>
              <li>• 彩色装饰元素</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl"
               style={{
                 background: currentTheme === 'dark' 
                   ? 'rgba(30, 41, 59, 0.6)' 
                   : 'rgba(255, 255, 255, 0.8)',
                 border: currentTheme === 'dark' 
                   ? '1px solid rgba(99, 102, 241, 0.08)' 
                   : '1px solid rgba(66, 133, 244, 0.12)'
               }}>
            <h3 className="text-lg font-semibold mb-3" 
                style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#0d1421' }}>
              ✨ 交互体验
            </h3>
            <ul className="space-y-2 text-sm opacity-80" 
                style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#5f6368' }}>
              <li>• 流畅的动画过渡</li>
              <li>• 精确的滑块定位</li>
              <li>• 响应式悬停效果</li>
              <li>• 无障碍访问支持</li>
            </ul>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="text-center mt-12 p-4 rounded-lg"
             style={{
               background: currentTheme === 'dark' 
                 ? 'rgba(99, 102, 241, 0.1)' 
                 : 'rgba(66, 133, 244, 0.08)',
               border: currentTheme === 'dark' 
                 ? '1px solid rgba(99, 102, 241, 0.2)' 
                 : '1px solid rgba(66, 133, 244, 0.15)'
             }}>
          <p className="text-sm" 
             style={{ color: currentTheme === 'dark' ? '#a5b4fc' : '#4285f4' }}>
            当前主题: <span className="font-semibold">
              {currentTheme === 'dark' ? '深色主题 🌙' : '浅色主题 ☀️'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
