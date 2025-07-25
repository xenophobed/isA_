/**
 * ============================================================================
 * Hunt Widget Module (HuntWidgetModule.tsx) - Hunt小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理Hunt小部件的所有业务逻辑
 * - 管理产品搜索和比较的流程
 * - 封装搜索参数处理和结果管理
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Hunt小部件业务逻辑的统一管理
 *   - 搜索API和状态管理的集成
 *   - 产品搜索请求的协调
 *   - 用户输入的处理和验证
 *   - 搜索结果的处理和格式化
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由HuntWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → HuntWidgetModule → HuntWidget UI
 * hooks → HuntWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget, useWidgetActions } from '../../hooks/useWidget';
import { HuntWidgetParams, HuntWidgetResult } from '../../types/widgetTypes';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';

interface HuntWidgetModuleProps {
  triggeredInput?: string;
  onSearchCompleted?: (results: HuntWidgetResult) => void;
  children: (moduleProps: {
    isSearching: boolean;
    searchResults: any[];
    lastQuery: string;
    onSearch: (params: HuntWidgetParams) => Promise<void>;
    onClearResults: () => void;
  }) => React.ReactNode;
}

/**
 * Hunt Widget Module - Business logic module for Hunt widget
 * 
 * This module:
 * - Uses hooks to get hunt widget state and AI client
 * - Handles all product search business logic
 * - Manages user input processing and validation
 * - Passes pure data and callbacks to Hunt UI component
 * - Keeps Hunt UI component pure
 */
export const HuntWidgetModule: React.FC<HuntWidgetModuleProps> = ({
  triggeredInput,
  onSearchCompleted,
  children
}) => {
  // Get hunt widget state using hooks
  const { huntState } = useWidget();
  const { hunt: huntActions } = useWidgetActions();
  
  console.log('🔍 HUNT_MODULE: Providing data to Hunt UI:', {
    isSearching: huntState.isSearching,
    resultCount: huntState.searchResults.length,
    lastQuery: huntState.lastQuery,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !huntState.isSearching) {
      console.log('🔍 HUNT_MODULE: Processing triggered input:', triggeredInput);
      
      // Extract search query from triggered input
      const query = extractQueryFromInput(triggeredInput);
      if (query) {
        const params: HuntWidgetParams = {
          query,
          category: 'all'
        };
        
        handleSearch(params);
      }
    }
  }, [triggeredInput, huntState.isSearching]);
  
  // Business logic: Extract search query from user input
  const extractQueryFromInput = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    // Common trigger patterns for product search
    const patterns = [
      /search (?:for )?(.+)/i,
      /find (?:me )?(.+)/i,
      /look (?:for|up) (.+)/i,
      /hunt (?:for )?(.+)/i,
      /show me (.+)/i,
      /compare (.+)/i,
      /buy (.+)/i,
      /purchase (.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches, check for product-related keywords
    const productKeywords = ['laptop', 'phone', 'headphones', 'camera', 'book', 'clothes', 'shoes'];
    if (productKeywords.some(keyword => lowerInput.includes(keyword))) {
      return input;
    }
    
    return null;
  };
  
  // Business logic: Handle product search via WidgetHandler
  const handleSearch = useCallback(async (params: HuntWidgetParams) => {
    console.log('🔍 HUNT_MODULE: search called with:', params);
    
    if (!params.query) {
      console.error('❌ HUNT_MODULE: No search query provided');
      return;
    }
    
    // Use WidgetHandler to route request to store → chatService → API
    console.log('🔄 HUNT_MODULE: Routing request via WidgetHandler');
    logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt module routing request via WidgetHandler', { params });
    
    try {
      await widgetHandler.processRequest({
        type: 'hunt',
        params,
        sessionId: 'hunt_widget',
        userId: 'widget_user'
      });
      
      console.log('✅ HUNT_MODULE: Request successfully routed to store');
    } catch (error) {
      console.error('❌ HUNT_MODULE: WidgetHandler request failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Hunt WidgetHandler request failed', { error, params });
    }
    
  }, []);
  
  // Monitor hunt state changes to notify parent component
  useEffect(() => {
    if (huntState.searchResults.length > 0 && !huntState.isSearching) {
      // Notify parent component when search is completed
      const result: HuntWidgetResult = {
        products: huntState.searchResults,
        totalResults: huntState.searchResults.length,
        searchQuery: huntState.lastQuery
      };
      onSearchCompleted?.(result);
      logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search completed, parent notified');
    }
  }, [huntState.searchResults, huntState.isSearching, huntState.lastQuery, onSearchCompleted]);
  
  // Business logic: Clear search results
  const handleClearResults = useCallback(() => {
    console.log('🔍 HUNT_MODULE: Clearing search results');
    huntActions.clearHuntData();
    logger.info(LogCategory.ARTIFACT_CREATION, 'Hunt search results cleared');
  }, [huntActions]);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isSearching: huntState.isSearching,
        searchResults: huntState.searchResults,
        lastQuery: huntState.lastQuery,
        onSearch: handleSearch,
        onClearResults: handleClearResults
      })}
    </>
  );
};