/**
 * ============================================================================
 * Knowledge Widget Module (KnowledgeWidgetModule.tsx) - Refactored with BaseWidgetModule
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseWidgetModule for standardized widget management
 * - Provides Knowledge-specific configuration and customizations
 * - Manages RAG (Retrieval-Augmented Generation) business logic
 * - Integrates seamlessly with BaseWidget UI components
 * 
 * Benefits of BaseWidgetModule integration:
 * - Automatic output history management for knowledge results
 * - Built-in edit and management actions
 * - Streaming status display
 * - Standard error handling and logging
 * - Consistent UI patterns across all widgets
 */
import React, { ReactNode } from 'react';
import { BaseWidgetModule, createWidgetConfig } from './BaseWidgetModule';
import { EditAction, ManagementAction } from '../../components/ui/widgets/BaseWidget';
import { useAppStore } from '../../stores/useAppStore';

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
  children: ReactNode;
}

/**
 * Knowledge Widget Module - Template mapping and configuration for RAG and knowledge management
 * 
 * Search Types:
 * - semantic: Semantic similarity search using embeddings
 * - keyword: Traditional keyword-based search
 * - hybrid: Combined semantic and keyword search
 * - rag_search: Intelligent RAG search and retrieval
 */

// Knowledge search type to MCP template mapping
const KNOWLEDGE_TEMPLATE_MAPPING = {
  'rag_search': {
    template_id: 'intelligent_rag_search_prompt',
    focus: 'knowledge_retrieval'
  },
  'semantic': {
    template_id: 'intelligent_rag_search_prompt',
    focus: 'semantic_search'
  },
  'keyword': {
    template_id: 'knowledge_analyze_prompt',
    focus: 'keyword_search'
  },
  'hybrid': {
    template_id: 'intelligent_rag_search_prompt',
    focus: 'hybrid_search'
  },
  'document_analysis': {
    template_id: 'knowledge_analyze_prompt',
    focus: 'document_analysis'
  }
};

// Knowledge-specific template parameter preparation
const prepareKnowledgeTemplateParams = (params: KnowledgeWidgetParams) => {
  const { query, searchType = 'hybrid', contextSize = 'medium', documents } = params;
  
  const mapping = KNOWLEDGE_TEMPLATE_MAPPING[searchType] || KNOWLEDGE_TEMPLATE_MAPPING['hybrid'];
  
  // Build prompt_args for knowledge search
  const prompt_args = {
    query: query || 'Search knowledge base',
    search_type: searchType,
    context_size: contextSize,
    has_documents: documents && documents.length > 0
  };
  
  console.log('🧠 KNOWLEDGE_MODULE: Prepared template params for search type', searchType, ':', {
    template_id: mapping.template_id,
    prompt_args
  });
  
  return {
    template_id: mapping.template_id,
    prompt_args
  };
};

// Knowledge widget configuration
const knowledgeWidgetConfig = createWidgetConfig({
  type: 'knowledge',
  title: 'Knowledge RAG Assistant',
  icon: '🧠',
  sessionIdPrefix: 'knowledge_widget',
  maxHistoryItems: 25,
  
  // Extract parameters from triggered input
  extractParamsFromInput: (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Determine search type based on keywords
    let searchType: 'semantic' | 'keyword' | 'hybrid' = 'hybrid';
    let contextSize: 'small' | 'medium' | 'large' = 'medium';
    
    // Search type detection
    if (lowerInput.includes('semantic') || lowerInput.includes('meaning') || lowerInput.includes('similar')) {
      searchType = 'semantic';
    } else if (lowerInput.includes('keyword') || lowerInput.includes('exact') || lowerInput.includes('literal')) {
      searchType = 'keyword';
    }
    
    // Context size detection
    if (lowerInput.includes('detailed') || lowerInput.includes('comprehensive') || lowerInput.includes('full')) {
      contextSize = 'large';
    } else if (lowerInput.includes('brief') || lowerInput.includes('quick') || lowerInput.includes('summary')) {
      contextSize = 'small';
    }
    
    return {
      query: input.trim(),
      searchType,
      contextSize
    };
  },
  editActions: [
    {
      id: 'cite_sources',
      label: 'Cite',
      icon: '📚',
      onClick: (content) => {
        console.log('📚 Generating citations for:', content);
      }
    },
    {
      id: 'export_knowledge', 
      label: 'Export',
      icon: '📤',
      onClick: (content) => {
        console.log('📤 Exporting knowledge:', content);
      }
    },
    {
      id: 'related_topics',
      label: 'Related',
      icon: '🔗', 
      onClick: (content) => {
        console.log('🔗 Finding related topics for:', content);
      }
    }
  ],
  managementActions: [
    {
      id: 'upload_docs',
      label: 'Upload Docs',
      icon: '📁',
      onClick: () => console.log('📁 Document upload dialog'),
      variant: 'primary' as const,
      disabled: false
    },
    {
      id: 'knowledge_base',
      label: 'Knowledge Base',
      icon: '🗂️',
      onClick: () => console.log('🗂️ Knowledge base manager'),
      disabled: false
    },
    {
      id: 'embeddings',
      label: 'Embeddings', 
      icon: '🔍',
      onClick: () => console.log('🔍 Embedding management - coming soon'),
      disabled: true
    },
    {
      id: 'graph_view',
      label: 'Graph View',
      icon: '🕸️',
      onClick: () => console.log('🕸️ Knowledge graph view - coming soon'),
      disabled: true
    }
  ]
});

/**
 * Knowledge Widget Module - Uses BaseWidgetModule with Knowledge-specific configuration
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
  
  // Convert searchResult to outputHistory format for BaseWidget display
  const outputHistory = React.useMemo(() => {
    if (!searchResult) {
      return [];
    }
    
    return [{
      id: `knowledge_result_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'knowledge_search',
      title: 'Knowledge Search Results',
      content: searchResult.answer,
      metadata: {
        sourceCount: searchResult.sources?.length || 0,
        relatedQuestions: searchResult.relatedQuestions || [],
        hasKnowledgeGraph: !!searchResult.knowledgeGraph
      }
    }];
  }, [searchResult]);
  
  console.log('🧠 KNOWLEDGE_MODULE: Converting search result to output history:', {
    hasResult: !!searchResult,
    outputHistoryCount: outputHistory.length,
    latestResult: outputHistory[0]?.title
  });
  
  return (
    <BaseWidgetModule
      config={knowledgeWidgetConfig}
      triggeredInput={triggeredInput}
      onCompleted={onAnalysisCompleted}
    >
      {(moduleProps) => {
        // Pass state to KnowledgeWidget via props with template support
        if (React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...children.props,
            // Knowledge state
            isProcessing,
            result: searchResult, // Map searchResult to result
            knowledgeBase,
            // Add knowledge actions with template parameter preparation
            onUploadDocuments: async (files: File[]) => {
              console.log('🧠 KNOWLEDGE_MODULE: Uploading documents:', files.length);
              
              // Prepare template parameters for document upload
              const templateParams = prepareKnowledgeTemplateParams({
                query: 'Document upload and processing',
                documents: files,
                searchType: 'hybrid',
                contextSize: 'medium'
              });
              
              const enrichedParams = {
                documents: files,
                templateParams
              };
              
              console.log('🧠 KNOWLEDGE_MODULE: Sending enriched upload params to store:', enrichedParams);
              await moduleProps.startProcessing(enrichedParams);
            },
            onProcess: async (params: KnowledgeWidgetParams) => {
              // 记录widget使用（用户真正使用了功能）
              const { recordWidgetUsage } = useAppStore.getState();
              recordWidgetUsage('knowledge');
              
              // Prepare template parameters based on the search type
              const templateParams = prepareKnowledgeTemplateParams(params);
              
              // Add template information to params before sending to store
              const enrichedParams = {
                ...params,
                templateParams // Add template configuration
              };
              
              console.log('🧠 KNOWLEDGE_MODULE: Sending enriched search params to store:', enrichedParams);
              await moduleProps.startProcessing(enrichedParams);
              
              // 模拟成功生成的结果（在真实应用中，这应该在API回调中处理）
              setTimeout(() => {
                const { markWidgetWithArtifacts } = useAppStore.getState();
                markWidgetWithArtifacts('knowledge');
                setSearchResult({
                  answer: 'Knowledge search completed successfully.',
                  sources: [],
                  relatedQuestions: []
                });
              }, 1000);
            },
            onSearchKnowledge: async (params: KnowledgeWidgetParams) => {
              // Prepare template parameters based on the search type
              const templateParams = prepareKnowledgeTemplateParams(params);
              
              // Add template information to params before sending to store
              const enrichedParams = {
                ...params,
                templateParams // Add template configuration
              };
              
              console.log('🧠 KNOWLEDGE_MODULE: Sending enriched search params to store:', enrichedParams);
              await moduleProps.startProcessing(enrichedParams);
            },
            onRemoveDocument: (docId: string) => {
              console.log('🧠 KNOWLEDGE_MODULE: Removing document:', docId);
              setKnowledgeBase(prev => prev.filter(doc => doc.id !== docId));
            },
            onClearResults: () => {
              console.log('🧠 KNOWLEDGE_MODULE: Clearing results');
              setSearchResult(null);
              moduleProps.onClearHistory();
            },
            // BaseWidget state with converted data
            outputHistory: outputHistory,
            currentOutput: outputHistory[0] || null,
            isStreaming: moduleProps.isStreaming,
            streamingContent: moduleProps.streamingContent,
            onSelectOutput: moduleProps.onSelectOutput,
            onClearHistory: moduleProps.onClearHistory
          });
        }
        return children;
      }}
    </BaseWidgetModule>
  );
};