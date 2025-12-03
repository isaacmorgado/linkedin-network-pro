/**
 * Universal Search Component
 * Natural language search input for network exploration
 * Now with AI-powered conversational interface
 */

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, Sparkles, Bot } from 'lucide-react';
import { chatAgent } from '../../../services/universal-connection/chat';
import { aiSearchChat } from '../../../services/universal-connection/search/ai-search-chat';
import type { SearchResult } from '../../../types/search';

interface UniversalSearchProps {
  onSearchResults: (results: SearchResult[]) => void;
  onError?: (error: Error) => void;
}

export function UniversalSearch({ onSearchResults, onError }: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [useAI, setUseAI] = useState(true); // Toggle AI chat mode
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setAiResponse('');

    try {
      if (useAI) {
        // Use AI chat interface (conversational ChatGPT-like experience)
        const chatMessage = await aiSearchChat.chat(searchQuery);

        // Set AI response for display
        setAiResponse(chatMessage.content);

        // Extract results from metadata
        const results = chatMessage.metadata?.searchResults || [];
        onSearchResults(results);
      } else {
        // Use original algorithmic search (no AI)
        const response = await chatAgent.chat(searchQuery);

        // Extract search results from metadata (already in correct format)
        const results = response.metadata?.searchResults || [];
        onSearchResults(results);
      }
    } catch (error) {
      console.error('[UniversalSearch] Search failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setAiResponse('');
    inputRef.current?.focus();
  };

  const toggleAIMode = () => {
    setUseAI(!useAI);
    setAiResponse('');
  };

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* AI Mode Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px',
        }}
      >
        <button
          onClick={toggleAIMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: useAI ? '#FFFFFF' : '#0077B5',
            backgroundColor: useAI ? '#0077B5' : 'transparent',
            border: `1px solid ${useAI ? '#0077B5' : 'rgba(0, 119, 181, 0.3)'}`,
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!useAI) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!useAI) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {useAI ? <Sparkles size={14} /> : <Bot size={14} />}
          <span>{useAI ? 'AI Chat' : 'Fast Search'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Search Icon */}
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {isSearching ? (
              <Loader2
                size={18}
                color="#0077B5"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : useAI ? (
              <Sparkles size={18} color="#0077B5" />
            ) : (
              <Search size={18} color="#6e6e73" />
            )}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={useAI ? "Ask me anything about your network..." : "Search your network..."}
            disabled={isSearching}
            style={{
              width: '100%',
              height: '44px',
              padding: '0 44px 0 44px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '12px',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              transition: 'all 150ms',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0077B5';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {/* Clear Button */}
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={16} color="#6e6e73" />
            </button>
          )}

          {/* Spinner Animation */}
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </form>

      {/* AI Response Display */}
      {aiResponse && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'rgba(0, 119, 181, 0.05)',
            border: '1px solid rgba(0, 119, 181, 0.2)',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#1d1d1f',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="#0077B5" />
            <span style={{ fontWeight: '600', fontSize: '12px', color: '#0077B5' }}>
              AI Assistant
            </span>
          </div>
          {aiResponse}
        </div>
      )}

      {/* Helper Text */}
      <p
        style={{
          fontSize: '12px',
          color: '#6e6e73',
          margin: '8px 0 0 0',
          paddingLeft: '4px',
        }}
      >
        {useAI
          ? 'Try: "Who do I know at Netflix?" or "Find people who endorsed leadership"'
          : 'Try: "Find ML engineers at Google" or "Who works in AI Ethics?"'}
      </p>
    </div>
  );
}
