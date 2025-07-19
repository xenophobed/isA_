import React, { useState } from 'react';
import { useSimpleAI } from '../providers/SimpleAIProvider';

interface HuntSidebarProps {
  triggeredInput?: string;
}

/**
 * Hunt AI 侧边栏
 * 智能产品搜索和价格对比
 */
export const HuntSidebar: React.FC<HuntSidebarProps> = ({ triggeredInput }) => {
  const client = useSimpleAI();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [priceRange, setPriceRange] = useState('any');
  const [isSearching, setIsSearching] = useState(false);

  // 自动填充搜索查询
  React.useEffect(() => {
    if (triggeredInput && triggeredInput !== searchQuery) {
      setSearchQuery(triggeredInput);
    }
  }, [triggeredInput]);

  const searchTypes = [
    { id: 'general', name: 'General Search', icon: '🔍' },
    { id: 'price', name: 'Price Comparison', icon: '💰' },
    { id: 'reviews', name: 'Review Analysis', icon: '⭐' },
    { id: 'alternatives', name: 'Find Alternatives', icon: '🔄' }
  ];

  const handleSearch = async (inputText?: string) => {
    const textToUse = inputText || searchQuery;
    if (!textToUse || typeof textToUse !== 'string' || !textToUse.trim() || !client || isSearching) return;

    setIsSearching(true);
    try {
      const fullQuery = `Search for "${textToUse}" with ${searchType} analysis. Price range: ${priceRange}. Provide comprehensive product information including prices, reviews, and alternatives.`;
      await client.sendMessage(fullQuery, { 
        sender: 'hunt-app', 
        requestId: `hunt-${Date.now()}`,
        searchType: searchType,
        priceRange: priceRange,
        searchQuery: textToUse,
        analysisType: searchType,
        requestedInfo: ['prices', 'reviews', 'alternatives', 'specifications']
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索输入 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">🔍 产品搜索</h3>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g., iPhone 15 Pro, gaming laptop, wireless headphones"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 搜索类型 */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">📊 搜索类型</h3>
        <div className="space-y-2">
          {searchTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setSearchType(type.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                searchType === type.id
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 搜索按钮 */}
      <button
        onClick={() => handleSearch()}
        disabled={isSearching || !searchQuery.trim()}
        className={`w-full p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg text-white font-medium transition-all hover:from-blue-600 hover:to-green-600 flex items-center justify-center gap-2 ${
          isSearching ? 'animate-pulse' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSearching ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            搜索中...
          </>
        ) : (
          <>
            <span>🔍</span>
            开始搜索
          </>
        )}
      </button>
    </div>
  );
};