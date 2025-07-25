/**
 * ============================================================================
 * Knowledge Widget Module (KnowledgeWidgetModule.tsx) - 知识管理小部件的业务逻辑模块
 * ============================================================================
 * 
 * 【核心职责】
 * - 处理Knowledge小部件的所有业务逻辑
 * - 管理文档分析和知识检索的流程
 * - 封装RAG（检索增强生成）和向量搜索
 * - 向纯UI组件提供数据和事件回调
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - Knowledge小部件业务逻辑的统一管理
 *   - 文档处理和知识图谱构建
 *   - 向量搜索和语义检索
 *   - 用户查询的处理和上下文管理
 *   - 知识库结果的处理和格式化
 * 
 * ❌ 不负责：
 *   - UI布局和样式处理（由KnowledgeWidget UI组件处理）
 *   - 组件的直接渲染（由UI components处理）
 *   - 底层数据存储（由stores处理）
 *   - 网络通信（由api处理）
 * 
 * 【数据流向】
 * WidgetManager → KnowledgeWidgetModule → KnowledgeWidget UI
 * hooks → KnowledgeWidgetModule → 事件回调 → stores → api/services
 */
import React, { useCallback, useEffect } from 'react';
import { useWidget } from '../../hooks/useWidget';
import { logger, LogCategory } from '../../utils/logger';
import { widgetHandler } from '../../components/core/WidgetHandler';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'doc' | 'txt' | 'web' | 'note';
  uploadedAt: string;
  size: number;
  tags: string[];
}

interface KnowledgeSearchResult {
  document: KnowledgeDocument;
  relevanceScore: number;
  matchedSegments: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
}

interface KnowledgeWidgetParams {
  query?: string;
  documents?: File[];
  searchType?: 'semantic' | 'keyword' | 'hybrid';
  contextSize?: 'small' | 'medium' | 'large';
}

interface KnowledgeWidgetResult {
  answer: string;
  sources: KnowledgeSearchResult[];
  relatedQuestions: string[];
  knowledgeGraph?: {
    entities: Array<{ id: string; label: string; type: string }>;
    relationships: Array<{ source: string; target: string; type: string }>;
  };
}

interface KnowledgeWidgetModuleProps {
  triggeredInput?: string;
  onAnalysisCompleted?: (result: KnowledgeWidgetResult) => void;
  children: (moduleProps: {
    isProcessing: boolean;
    knowledgeBase: KnowledgeDocument[];
    searchResult: KnowledgeWidgetResult | null;
    onUploadDocuments: (files: File[]) => Promise<void>;
    onSearchKnowledge: (params: KnowledgeWidgetParams) => Promise<void>;
    onRemoveDocument: (docId: string) => void;
    onClearResults: () => void;
  }) => React.ReactNode;
}

/**
 * Knowledge Widget Module - Business logic module for Knowledge widget
 * 
 * This module:
 * - Uses hooks to get knowledge widget state and AI client
 * - Handles all document processing and knowledge retrieval
 * - Manages RAG pipeline and vector search
 * - Passes pure data and callbacks to Knowledge UI component
 * - Keeps Knowledge UI component pure
 */
export const KnowledgeWidgetModule: React.FC<KnowledgeWidgetModuleProps> = ({
  triggeredInput,
  onAnalysisCompleted,
  children
}) => {
  // Local state for knowledge base (in real app, this would be in a store)
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [knowledgeBase, setKnowledgeBase] = React.useState<KnowledgeDocument[]>([]);
  const [searchResult, setSearchResult] = React.useState<KnowledgeWidgetResult | null>(null);
  
  // Get widget state through hooks
  const widgetState = useWidget();
  
  console.log('🧠 KNOWLEDGE_MODULE: Providing data to Knowledge UI:', {
    isProcessing,
    documentCount: knowledgeBase.length,
    hasResult: !!searchResult,
    triggeredInput: triggeredInput?.substring(0, 50)
  });
  
  // Business logic: Handle triggered input from chat
  useEffect(() => {
    if (triggeredInput && !isProcessing) {
      console.log('🧠 KNOWLEDGE_MODULE: Processing triggered input:', triggeredInput);
      
      // Check if it's a file upload trigger or search query
      if (triggeredInput.toLowerCase().includes('analyze') && 
          (triggeredInput.toLowerCase().includes('document') || triggeredInput.toLowerCase().includes('file'))) {
        // This is likely a file upload trigger - we'll wait for actual files
        return;
      }
      
      // This is a search query
      const params: KnowledgeWidgetParams = {
        query: triggeredInput,
        searchType: 'hybrid',
        contextSize: 'medium'
      };
      
      handleSearchKnowledge(params);
    }
  }, [triggeredInput, isProcessing]);
  
  // Business logic: Handle document upload
  const handleUploadDocuments = useCallback(async (files: File[]) => {
    console.log('🧠 KNOWLEDGE_MODULE: uploadDocuments called with:', files.length, 'files');
    
    try {
      setIsProcessing(true);
      
      logger.info(LogCategory.ARTIFACT_CREATION, 'Starting document upload', { fileCount: files.length });
      
      // Use WidgetHandler to process request
      const params: KnowledgeWidgetParams = {
        documents: files,
        searchType: 'hybrid',
        contextSize: 'medium'
      };
      
      await widgetHandler.processRequest({
        type: 'knowledge',
        params,
        sessionId: 'knowledge_widget',
        userId: 'widget_user'
      });
      
      logger.info(LogCategory.ARTIFACT_CREATION, 'Document upload completed', { 
        fileCount: files.length
      });
      
    } catch (error) {
      console.error('❌ KNOWLEDGE_MODULE: Document upload failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Document upload failed', { error });
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Business logic: Handle knowledge search
  const handleSearchKnowledge = useCallback(async (params: KnowledgeWidgetParams) => {
    console.log('🧠 KNOWLEDGE_MODULE: searchKnowledge called with:', params);
    
    if (!params.query) {
      console.error('❌ KNOWLEDGE_MODULE: No search query provided');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      logger.info(LogCategory.ARTIFACT_CREATION, 'Starting knowledge search', { params });
      
      // Use WidgetHandler to process request
      await widgetHandler.processRequest({
        type: 'knowledge',
        params,
        sessionId: 'knowledge_widget',
        userId: 'widget_user'
      });
      
      logger.info(LogCategory.ARTIFACT_CREATION, 'Knowledge search completed', { 
        query: params.query
      });
      console.log('✅ KNOWLEDGE_MODULE: Knowledge search completed');
      
    } catch (error) {
      console.error('❌ KNOWLEDGE_MODULE: Knowledge search failed:', error);
      logger.error(LogCategory.ARTIFACT_CREATION, 'Knowledge search failed', { error, params });
    } finally {
      setIsProcessing(false);
    }
  }, [onAnalysisCompleted]);
  
  // Widget state changes are handled through local state management
  // Results are set directly in handleSearchKnowledge function
  
  // Business logic: Remove document from knowledge base
  const handleRemoveDocument = useCallback((docId: string) => {
    console.log('🧠 KNOWLEDGE_MODULE: Removing document:', docId);
    setKnowledgeBase(prev => prev.filter(doc => doc.id !== docId));
    logger.info(LogCategory.ARTIFACT_CREATION, 'Document removed from knowledge base', { docId });
  }, []);
  
  // Business logic: Clear search results
  const handleClearResults = useCallback(() => {
    console.log('🧠 KNOWLEDGE_MODULE: Clearing results');
    setSearchResult(null);
    logger.info(LogCategory.ARTIFACT_CREATION, 'Knowledge search results cleared');
  }, []);
  
  // Pass all data and business logic callbacks to pure UI component
  return (
    <>
      {children({
        isProcessing,
        knowledgeBase,
        searchResult,
        onUploadDocuments: handleUploadDocuments,
        onSearchKnowledge: handleSearchKnowledge,
        onRemoveDocument: handleRemoveDocument,
        onClearResults: handleClearResults
      })}
    </>
  );
};