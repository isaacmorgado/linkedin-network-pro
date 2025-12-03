/**
 * Universal Search Component
 * Natural language search input for network exploration
 * Now with AI-powered conversational interface + enhanced UI
 */

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, Sparkles, Bot, Copy, Check, History, ChevronDown, ChevronUp } from 'lucide-react';
import { chatAgent } from '../../../services/universal-connection/chat';
import { aiSearchChat } from '../../../services/universal-connection/search/ai-search-chat';
import type { SearchResult } from '../../../types/search';
import type { AIChatMessage } from '../../../services/universal-connection/search/ai-search-chat';

interface UniversalSearchProps {
  onSearchResults: (results: SearchResult[]) => void;
  onError?: (error: Error) => void;
}

export function UniversalSearch({ onSearchResults, onError }: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [useAI, setUseAI] = useState(true); // Toggle AI chat mode
  const [isTyping, setIsTyping] = useState(false); // AI typing animation
  const [conversationHistory, setConversationHistory] = useState<AIChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, showHistory]);

  // Typing animation effect
  const typeMessage = async (message: string, setter: (text: string) => void) => {
    setIsTyping(true);
    let currentText = '';

    // Type character by character
    for (let i = 0; i < message.length; i++) {
      currentText += message[i];
      setter(currentText);

      // Vary typing speed (faster on spaces, slower on punctuation)
      const char = message[i];
      let delay = 15; // Base delay

      if (char === ' ') delay = 5;
      else if (char === '.' || char === '!' || char === '?') delay = 100;
      else if (char === ',') delay = 50;
      else if (char === '\n') delay = 30;

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setIsTyping(false);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setAiResponse('');

    try {
      if (useAI) {
        // Use AI chat interface (conversational ChatGPT-like experience)
        const chatMessage = await aiSearchChat.chat(searchQuery);

        // Add to conversation history
        setConversationHistory(prev => [...prev, chatMessage]);

        // Typing animation for AI response
        await typeMessage(chatMessage.content, setAiResponse);

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

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const clearHistory = () => {
    setConversationHistory([]);
    aiSearchChat.clearHistory();
    setShowHistory(false);
  };

  const copyResponse = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index ?? -1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('[UniversalSearch] Failed to copy:', error);
    }
  };

  // Format message with markdown-like syntax highlighting
  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold text (**text**)
      let formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Numbered lists (1., 2., etc.)
      if (/^\d+\./.test(line)) {
        formatted = `<div style="margin-left: 16px; margin-top: 6px;">${formatted}</div>`;
      }

      // Bullet points (-, •, *)
      if (/^[-•*]\s/.test(line)) {
        formatted = `<div style="margin-left: 16px; margin-top: 4px;">• ${formatted.replace(/^[-•*]\s/, '')}</div>`;
      }

      // Headers (## text)
      if (/^##\s/.test(line)) {
        formatted = `<div style="font-weight: 600; font-size: 14px; margin-top: 12px; margin-bottom: 6px; color: #0077B5;">${formatted.replace(/^##\s/, '')}</div>`;
      }

      // Code-like text (`text`)
      formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;">$1</code>');

      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* AI Mode Toggle & History Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        {/* History Button */}
        {useAI && conversationHistory.length > 0 && (
          <button
            onClick={toggleHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#6e6e73',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <History size={14} />
            <span>{conversationHistory.length} messages</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {/* Clear History */}
          {useAI && conversationHistory.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#ff3b30',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Clear
            </button>
          )}

          {/* AI Mode Toggle */}
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
      </div>

      {/* Conversation History */}
      {useAI && showHistory && conversationHistory.length > 0 && (
        <div
          style={{
            marginBottom: '12px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {conversationHistory.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: idx < conversationHistory.length - 1 ? '16px' : 0,
                paddingBottom: idx < conversationHistory.length - 1 ? '16px' : 0,
                borderBottom: idx < conversationHistory.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
              }}
            >
              {/* User Message */}
              {msg.role === 'user' && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#0077B5',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    maxWidth: '80%',
                    marginLeft: 'auto',
                  }}
                >
                  {msg.content}
                </div>
              )}

              {/* AI Response */}
              {msg.role === 'assistant' && (
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 119, 181, 0.2)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#1d1d1f',
                      maxWidth: '90%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Sparkles size={14} color="#0077B5" />
                      <span style={{ fontWeight: '600', fontSize: '12px', color: '#0077B5' }}>
                        AI Assistant
                      </span>
                      <button
                        onClick={() => copyResponse(msg.content, idx)}
                        style={{
                          marginLeft: 'auto',
                          padding: '4px 8px',
                          border: 'none',
                          background: 'rgba(0, 119, 181, 0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#0077B5',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 119, 181, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 119, 181, 0.1)';
                        }}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={12} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    {formatMessage(msg.content)}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      )}

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

      {/* AI Response Display (Current) */}
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
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="#0077B5" />
            <span style={{ fontWeight: '600', fontSize: '12px', color: '#0077B5' }}>
              AI Assistant
              {isTyping && <span style={{ marginLeft: '8px', opacity: 0.6 }}>typing...</span>}
            </span>
            <button
              onClick={() => copyResponse(aiResponse)}
              style={{
                marginLeft: 'auto',
                padding: '4px 8px',
                border: 'none',
                background: 'rgba(0, 119, 181, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#0077B5',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 119, 181, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 119, 181, 0.1)';
              }}
            >
              {copiedIndex === -1 ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          {formatMessage(aiResponse)}
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
