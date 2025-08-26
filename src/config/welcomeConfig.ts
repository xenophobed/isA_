/**
 * Welcome Module Configuration - Dynamic Widget and Prompt Management
 * ====================================================================
 * 
 * This file contains all configurable content for the ChatWelcome component.
 * Allows easy modification of widgets, prompts, and welcome content without
 * touching the component code.
 */

import React from 'react';
import { WidgetType } from '../types/widgetTypes';

export interface WelcomeWidget {
  id: WidgetType;
  title: string;
  icon: React.ReactNode;
  description: string;
  accentColor: string;
  defaultPrompt: string;
  featured?: boolean; // For highlighting specific widgets
}

export interface WelcomeConfig {
  title: string;
  subtitle: string;
  widgets: WelcomeWidget[];
  examplePrompts: string[];
  tipText: string;
}

// SVG Icons for widgets - Using React.createElement to avoid JSX in .ts files
const OmniIcon = React.createElement('svg', 
  { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
  React.createElement('path', { 
    strokeLinecap: "round", 
    strokeLinejoin: "round", 
    strokeWidth: 2, 
    d: "M13 10V3L4 14h7v7l9-11h-7z" 
  })
);

const HuntIcon = React.createElement('svg',
  { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
  React.createElement('path', { 
    strokeLinecap: "round", 
    strokeLinejoin: "round", 
    strokeWidth: 2, 
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
  })
);

const DreamIcon = React.createElement('svg',
  { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
  React.createElement('path', { 
    strokeLinecap: "round", 
    strokeLinejoin: "round", 
    strokeWidth: 2, 
    d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
  })
);

const KnowledgeIcon = React.createElement('svg',
  { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
  React.createElement('path', { 
    strokeLinecap: "round", 
    strokeLinejoin: "round", 
    strokeWidth: 2, 
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
  })
);

// Dynamic Welcome Configuration
export const welcomeConfig: WelcomeConfig = {
  title: "Welcome to Intelligent Systems Assistant",
  subtitle: "Your AI-powered productivity companion. Select a specialized assistant or start chatting below.",
  
  widgets: [
    {
      id: 'omni' as WidgetType,
      title: 'Creative Projects',
      icon: OmniIcon,
      description: 'Generate content, write stories, or brainstorm ideas',
      accentColor: 'var(--color-primary)',
      defaultPrompt: 'Help me create something amazing! I need assistance with creative content generation.',
      featured: true // This will make it span more columns in the grid
    },
    {
      id: 'hunt' as WidgetType,
      title: 'Product Search',
      icon: HuntIcon,
      description: 'Search and compare products, find the best deals',
      accentColor: 'var(--color-secondary)',
      defaultPrompt: 'Help me find and compare products. What are you looking for?'
    },
    {
      id: 'dream' as WidgetType,
      title: 'Image Generation',
      icon: DreamIcon,
      description: 'Generate images, create artwork, or visualize ideas',
      accentColor: 'var(--color-accent)',
      defaultPrompt: 'Create a beautiful image for me. Describe what you want to see generated.'
    },
    {
      id: 'knowledge' as WidgetType,
      title: 'Knowledge Analysis',
      icon: KnowledgeIcon,
      description: 'Analyze documents, research topics, or get explanations',
      accentColor: 'var(--color-blue-500)',
      defaultPrompt: 'Analyze this content or help me research a topic. What would you like to explore?'
    }
  ],
  
  examplePrompts: [
    "Create a logo for my startup",
    "Help me debug this code", 
    "Analyze this data trend",
    "Explain quantum computing"
  ],
  
  tipText: "Click any widget above to get started, or type your message below"
};

// Utility functions for configuration management
export const getWidgetById = (id: WidgetType): WelcomeWidget | undefined => {
  return welcomeConfig.widgets.find(widget => widget.id === id);
};

export const getFeaturedWidgets = (): WelcomeWidget[] => {
  return welcomeConfig.widgets.filter(widget => widget.featured);
};

export const getRegularWidgets = (): WelcomeWidget[] => {
  return welcomeConfig.widgets.filter(widget => !widget.featured);
};

// Configuration validation
export const validateWelcomeConfig = (): boolean => {
  const requiredFields = ['title', 'subtitle', 'widgets', 'examplePrompts', 'tipText'];
  
  for (const field of requiredFields) {
    if (!(field in welcomeConfig)) {
      console.error(`WelcomeConfig missing required field: ${field}`);
      return false;
    }
  }
  
  if (!Array.isArray(welcomeConfig.widgets) || welcomeConfig.widgets.length === 0) {
    console.error('WelcomeConfig widgets must be a non-empty array');
    return false;
  }
  
  if (!Array.isArray(welcomeConfig.examplePrompts) || welcomeConfig.examplePrompts.length === 0) {
    console.error('WelcomeConfig examplePrompts must be a non-empty array');
    return false;
  }
  
  return true;
};