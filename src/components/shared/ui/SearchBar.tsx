/**
 * SearchBar Component - Global search with recent queries and suggestions
 * Based on modern AI chat interfaces (Claude, ChatGPT, Gemini, Grok)
 */
import React, { useState, useRef, useEffect } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'conversation' | 'message' | 'file';
  timestamp: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  results?: SearchResult[];
  recentQueries?: string[];
  suggestions?: string[];
  isSearching?: boolean;
  showResults?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search conversations...',
  results = [],
  recentQueries = [],
  suggestions = [],
  isSearching = false,
  showResults = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800/50 text-gray-900 dark:text-gray-100">
          {part}
        </mark>
      ) : part
    );
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'conversation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'message':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8" />
          </svg>
        );
      case 'file':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`search-bar relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className={`
        relative flex items-center
        bg-gray-50 dark:bg-gray-800/50
        border border-gray-200 dark:border-gray-700
        rounded-lg
        transition-all duration-200
        ${isFocused ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/10' : ''}
        ${showResults ? 'rounded-b-none' : ''}
      `}>
        
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-2.5
            bg-transparent
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            outline-none
            text-sm
          "
        />
        
        {/* Loading/Clear Button */}
        <div className="absolute right-3 flex items-center gap-2">
          {isSearching && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}
          
          {value && !isSearching && (
            <button
              onClick={handleClear}
              className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Clear search"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {showDropdown && (isFocused || showResults) && (
        <div className="
          absolute top-full left-0 right-0 z-50
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700 border-t-0
          rounded-b-lg shadow-lg
          max-h-96 overflow-y-auto
        ">
          
          {/* Recent Queries */}
          {!value && recentQueries.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Recent Searches
              </div>
              {recentQueries.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(query)}
                  className="
                    flex items-center gap-2 w-full p-2 rounded-md
                    text-sm text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {query}
                </button>
              ))}
            </div>
          )}
          
          {/* Suggestions */}
          {value && suggestions.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="
                    flex items-center gap-2 w-full p-2 rounded-md
                    text-sm text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {highlightMatch(suggestion, value)}
                </button>
              ))}
            </div>
          )}
          
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Results
              </div>
              {results.slice(0, 10).map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSearch(result.title)}
                  className="
                    flex items-start gap-3 w-full p-2 rounded-md
                    text-left hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  <div className="flex-shrink-0 mt-0.5 text-gray-400">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {highlightMatch(result.title, value)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {highlightMatch(result.content, value)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {value && !isSearching && results.length === 0 && suggestions.length === 0 && (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No results found for "{value}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};