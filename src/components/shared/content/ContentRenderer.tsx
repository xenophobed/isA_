/**
 * ============================================================================
 * ContentRenderer - 通用内容渲染组件
 * ============================================================================
 * 
 * 【核心功能】
 * - 统一处理各种内容类型的渲染
 * - 支持 markdown、代码、图片、搜索结果等
 * - 可配置的功能开关和样式变体
 * - 可在聊天、Widget、Artifact 等场景复用
 * 
 * 【设计原则】
 * - 类型安全：严格的 TypeScript 接口
 * - 可扩展：易于添加新的内容类型
 * - 可配置：通过 props 控制功能和样式
 * - 高性能：memo 优化和懒加载
 */

import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ================================================================================
// 类型定义
// ================================================================================

export type ContentType = 
  | 'text'           // 纯文本
  | 'markdown'       // Markdown 内容
  | 'code'           // 代码块
  | 'image'          // 图片
  | 'search_results' // 搜索结果
  | 'data_analysis'  // 数据分析结果
  | 'json'           // JSON 数据
  | 'html';          // HTML 内容

export type ContentVariant = 
  | 'chat'           // 聊天消息样式
  | 'widget'         // Widget 内容样式
  | 'artifact'       // Artifact 展示样式
  | 'preview'        // 预览样式
  | 'inline';        // 内联样式

export type ContentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ContentFeatures {
  markdown?: boolean;           // 启用 markdown 渲染
  codeHighlight?: boolean;      // 启用代码高亮
  imagePreview?: boolean;       // 启用图片预览
  copyButton?: boolean;         // 显示复制按钮
  saveButton?: boolean;         // 显示保存按钮
  expandButton?: boolean;       // 显示展开按钮
  truncate?: number;            // 字符截断长度
  lineClamp?: number;           // 行数限制
  wordBreak?: boolean;          // 自动换行
}

export interface ContentRendererProps {
  content: any;                 // 内容数据
  type: ContentType;            // 内容类型
  variant?: ContentVariant;     // 样式变体
  size?: ContentSize;           // 尺寸大小
  className?: string;           // 自定义类名
  features?: Partial<ContentFeatures>; // 功能配置
  maxHeight?: number;           // 最大高度
  onAction?: (action: string, data: any) => void; // 动作回调
}

// ================================================================================
// 样式配置
// ================================================================================

const getVariantClasses = (variant: ContentVariant, size: ContentSize): string => {
  const baseClasses = 'content-renderer';
  
  const variantClasses = {
    chat: 'content-chat text-white/90',
    widget: 'content-widget bg-white/5 border border-white/10 rounded-lg p-3',
    artifact: 'content-artifact bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg p-3',
    preview: 'content-preview bg-white/5 border border-white/10 rounded-lg p-2',
    inline: 'content-inline'
  };
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// Markdown 组件样式配置
const getMarkdownComponents = (variant: ContentVariant) => {
  const baseStyles = {
    h1: ({ children }: any) => <h1 className="text-lg font-bold text-white mb-1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-semibold text-white mb-0.5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-medium text-white mb-0.5">{children}</h3>,
    p: ({ children }: any) => <p className="text-white/80 mb-0.5 leading-normal">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-0.5 text-white/80 space-y-0">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-0.5 text-white/80 space-y-0">{children}</ol>,
    li: ({ children }: any) => <li className="text-white/80">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-blue-400 pl-3 mb-0.5 text-white/70 italic">
        {children}
      </blockquote>
    ),
    code: ({ inline, children }: any) => (
      inline ? 
        <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300 text-sm font-mono">{children}</code> :
        <code className="block bg-white/10 p-3 rounded text-green-300 text-sm font-mono overflow-x-auto">{children}</code>
    ),
    pre: ({ children }: any) => <pre className="bg-white/10 p-3 rounded mb-0.5 overflow-x-auto">{children}</pre>,
    a: ({ href, children }: any) => (
      <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-white/90">{children}</em>,
    table: ({ children }: any) => (
      <table className="min-w-full border border-white/20 rounded mb-0.5">{children}</table>
    ),
    thead: ({ children }: any) => <thead className="bg-white/10">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-white/10">{children}</tr>,
    th: ({ children }: any) => <th className="px-3 py-2 text-left text-white font-medium">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 text-white/80">{children}</td>,
  };

  // 根据变体调整样式
  if (variant === 'chat') {
    return {
      ...baseStyles,
      h1: ({ children }: any) => <h1 className="text-base font-bold text-white mb-0.5">{children}</h1>,
      h2: ({ children }: any) => <h2 className="text-sm font-semibold text-white mb-0.5">{children}</h2>,
      p: ({ children }: any) => <p className="text-white/90 mb-0.5 text-sm leading-snug">{children}</p>,
      ul: ({ children }: any) => <ul className="list-disc list-inside mb-0.5 text-white/80 space-y-0 text-sm">{children}</ul>,
      ol: ({ children }: any) => <ol className="list-decimal list-inside mb-0.5 text-white/80 space-y-0 text-sm">{children}</ol>,
    };
  }

  return baseStyles;
};

// ================================================================================
// 子组件
// ================================================================================

// 文本渲染器
const TextRenderer: React.FC<{ content: string; features: Partial<ContentFeatures> }> = memo(({ content, features }) => {
  const processedContent = useMemo(() => {
    if (features.truncate && content.length > features.truncate) {
      return content.substring(0, features.truncate) + '...';
    }
    return content;
  }, [content, features.truncate]);

  return (
    <div className={`whitespace-pre-wrap ${features.wordBreak ? 'break-words' : ''}`}>
      {processedContent}
    </div>
  );
});

// Markdown 渲染器
const MarkdownRenderer: React.FC<{ 
  content: string; 
  variant: ContentVariant; 
  features: Partial<ContentFeatures> 
}> = memo(({ content, variant, features }) => {
  const processedContent = useMemo(() => {
    if (features.truncate && content.length > features.truncate) {
      return content.substring(0, features.truncate) + '...';
    }
    return content;
  }, [content, features.truncate]);

  return (
    <div className="markdown-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={getMarkdownComponents(variant)}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

// 图片渲染器
const ImageRenderer: React.FC<{ 
  content: string; 
  variant: ContentVariant; 
  features: Partial<ContentFeatures>;
  onAction?: (action: string, data: any) => void;
}> = memo(({ content, variant, features, onAction }) => {
  const handleImageClick = () => {
    if (features.imagePreview) {
      onAction?.('preview-image', { url: content });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content;
    link.download = `image-${Date.now()}.jpg`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    onAction?.('copied', { content });
  };

  return (
    <div className="image-renderer">
      <div className="relative group">
        <img
          src={content}
          alt="Generated content"
          className={`
            rounded cursor-pointer transition-all duration-300 max-w-full h-auto
            ${variant === 'chat' ? 'max-h-32' : variant === 'widget' ? 'max-h-24' : 'max-h-64'}
            ${features.imagePreview ? 'hover:opacity-90' : ''}
          `}
          onClick={handleImageClick}
          loading="lazy"
        />
        
        {/* 悬浮操作按钮 */}
        {(features.saveButton || features.copyButton) && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              {features.saveButton && (
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                >
                  💾 Save
                </button>
              )}
              {features.copyButton && (
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs rounded transition-all"
                >
                  📋 Copy
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// 代码渲染器
const CodeRenderer: React.FC<{ 
  content: string; 
  language?: string; 
  features: Partial<ContentFeatures>;
  onAction?: (action: string, data: any) => void;
}> = memo(({ content, language, features, onAction }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    onAction?.('copied', { content });
  };

  return (
    <div className="code-renderer relative">
      {features.copyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 bg-white/10 text-white text-xs rounded hover:bg-white/20 transition-all z-10"
        >
          📋 Copy
        </button>
      )}
      <pre className="bg-white/10 p-3 rounded overflow-x-auto text-sm">
        <code className={`text-green-300 font-mono ${language ? `language-${language}` : ''}`}>
          {content}
        </code>
      </pre>
    </div>
  );
});

// 搜索结果渲染器
const SearchResultsRenderer: React.FC<{ 
  content: any[]; 
  variant: ContentVariant; 
  features: Partial<ContentFeatures> 
}> = memo(({ content, variant, features }) => {
  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="text-white/60 text-sm italic">
        No search results available
      </div>
    );
  }

  return (
    <div className="search-results space-y-3">
      {content.map((result, index) => (
        <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
          {result.title && (
            <h3 className="text-sm font-medium text-white mb-2">
              {result.title}
            </h3>
          )}
          {result.content && (
            <div className="text-white/80 text-xs">
              {features.markdown ? (
                <MarkdownRenderer 
                  content={result.content} 
                  variant={variant} 
                  features={features} 
                />
              ) : (
                <TextRenderer content={result.content} features={features} />
              )}
            </div>
          )}
          {result.url && (
            <a 
              href={result.url} 
              className="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-block"
              target="_blank" 
              rel="noopener noreferrer"
            >
              🔗 View source
            </a>
          )}
        </div>
      ))}
    </div>
  );
});

// ================================================================================
// 主组件
// ================================================================================

export const ContentRenderer: React.FC<ContentRendererProps> = memo(({
  content,
  type,
  variant = 'chat',
  size = 'md',
  className = '',
  features = {},
  maxHeight,
  onAction
}) => {
  // 默认功能配置
  const defaultFeatures: ContentFeatures = {
    markdown: true,
    codeHighlight: false,
    imagePreview: true,
    copyButton: false,
    saveButton: false,
    expandButton: false,
    truncate: undefined,
    lineClamp: undefined,
    wordBreak: true
  };

  const mergedFeatures = { ...defaultFeatures, ...features };
  const containerClasses = `${getVariantClasses(variant, size)} ${className}`;

  // 渲染内容
  const renderContent = () => {
    if (!content) {
      return <div className="text-white/40 text-sm italic">No content available</div>;
    }

    switch (type) {
      case 'markdown':
        return (
          <MarkdownRenderer 
            content={String(content)} 
            variant={variant} 
            features={mergedFeatures} 
          />
        );
      
      case 'image':
        return (
          <ImageRenderer 
            content={String(content)} 
            variant={variant} 
            features={mergedFeatures}
            onAction={onAction}
          />
        );
      
      case 'code':
        return (
          <CodeRenderer 
            content={String(content)} 
            features={mergedFeatures}
            onAction={onAction}
          />
        );
      
      case 'search_results':
        return (
          <SearchResultsRenderer 
            content={Array.isArray(content) ? content : []} 
            variant={variant} 
            features={mergedFeatures} 
          />
        );
      
      case 'json':
        return (
          <CodeRenderer 
            content={JSON.stringify(content, null, 2)} 
            language="json"
            features={mergedFeatures}
            onAction={onAction}
          />
        );
      
      case 'html':
        // 注意：出于安全考虑，这里不直接渲染 HTML
        return (
          <CodeRenderer 
            content={String(content)} 
            language="html"
            features={mergedFeatures}
            onAction={onAction}
          />
        );
      
      case 'text':
      default:
        return (
          <TextRenderer 
            content={String(content)} 
            features={mergedFeatures} 
          />
        );
    }
  };

  return (
    <div 
      className={containerClasses}
      style={{
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        overflowY: maxHeight ? 'auto' : undefined,
        ...(mergedFeatures.lineClamp && {
          display: '-webkit-box',
          WebkitLineClamp: mergedFeatures.lineClamp,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        })
      }}
    >
      {renderContent()}
      
      {/* 展开按钮 */}
      {mergedFeatures.expandButton && mergedFeatures.truncate && content && String(content).length > mergedFeatures.truncate && (
        <button
          onClick={() => onAction?.('expand', { content })}
          className="text-blue-400 hover:text-blue-300 text-sm mt-2 underline"
        >
          Show more
        </button>
      )}
    </div>
  );
});

ContentRenderer.displayName = 'ContentRenderer';