/**
 * Message Composer Component
 * Displays and edits AI-generated connection messages
 */

import { useState } from 'react';
import { X, Copy, RefreshCw, Check, Sparkles } from 'lucide-react';

interface MessageComposerProps {
  message: string;
  alternatives?: string[];
  reasoning?: string[];
  characterCount?: number;
  onRegenerate?: (tone: 'professional' | 'casual' | 'enthusiastic') => void;
  onCopy?: (message: string) => void;
  onClose: () => void;
}

export function MessageComposer({
  message: initialMessage,
  alternatives = [],
  reasoning = [],
  characterCount: _characterCount,
  onRegenerate,
  onCopy,
  onClose,
}: MessageComposerProps) {
  const [selectedMessage, setSelectedMessage] = useState(initialMessage);
  const [editedMessage, setEditedMessage] = useState(initialMessage);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'enthusiastic'>('professional');
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const currentCharacterCount = editedMessage.length;
  const maxLength = 300; // LinkedIn connection request limit
  const isOverLimit = currentCharacterCount > maxLength;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(editedMessage);
    } else {
      navigator.clipboard.writeText(editedMessage);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;

    setIsRegenerating(true);
    try {
      await onRegenerate(selectedTone);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectAlternative = (alt: string) => {
    setSelectedMessage(alt);
    setEditedMessage(alt);
  };

  const tones = [
    { value: 'professional' as const, label: 'Professional', emoji: '👔' },
    { value: 'casual' as const, label: 'Casual', emoji: '😊' },
    { value: 'enthusiastic' as const, label: 'Enthusiastic', emoji: '🚀' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#0077B5" />
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
              }}
            >
              Connection Message
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color="#6e6e73" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Tone Selector */}
          {onRegenerate && (
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 8px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Tone
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {tones.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: selectedTone === tone.value ? 'rgba(0, 119, 181, 0.1)' : 'transparent',
                      color: selectedTone === tone.value ? '#0077B5' : '#6e6e73',
                      border: selectedTone === tone.value ? '2px solid #0077B5' : '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{tone.emoji}</span>
                    <span>{tone.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Editor */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: 0,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Your Message
              </p>
              <span
                style={{
                  fontSize: '12px',
                  color: isOverLimit ? '#EF4444' : '#6e6e73',
                  fontWeight: '600',
                }}
              >
                {currentCharacterCount} / {maxLength}
              </span>
            </div>
            <textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '14px',
                border: isOverLimit ? '2px solid #EF4444' : '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: '#FFFFFF',
                transition: 'all 150ms',
              }}
              onFocus={(e) => {
                if (!isOverLimit) {
                  e.currentTarget.style.borderColor = '#0077B5';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!isOverLimit) {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {isOverLimit && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  margin: '6px 0 0 0',
                }}
              >
                Message exceeds LinkedIn's {maxLength} character limit
              </p>
            )}
          </div>

          {/* Reasoning */}
          {reasoning.length > 0 && (
            <div
              style={{
                padding: '14px',
                backgroundColor: 'rgba(0, 119, 181, 0.05)',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 8px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Why This Message?
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1d1d1f', lineHeight: '1.6' }}>
                {reasoning.map((point, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 8px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Alternative Messages
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAlternative(alt)}
                    style={{
                      padding: '12px',
                      border: selectedMessage === alt ? '2px solid #0077B5' : '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '8px',
                      backgroundColor: selectedMessage === alt ? 'rgba(0, 119, 181, 0.05)' : 'transparent',
                      fontSize: '13px',
                      color: '#1d1d1f',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      lineHeight: '1.5',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMessage !== alt) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMessage !== alt) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {onRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                  color: '#0077B5',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 150ms',
                  opacity: isRegenerating ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isRegenerating) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
                }}
              >
                <RefreshCw size={16} style={{ animation: isRegenerating ? 'spin 1s linear infinite' : 'none' }} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}

            <button
              onClick={handleCopy}
              disabled={isOverLimit}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: copied ? '#10B981' : '#0077B5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isOverLimit ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 150ms',
                opacity: isOverLimit ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!copied && !isOverLimit) {
                  e.currentTarget.style.backgroundColor = '#006399';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = '#0077B5';
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Message'}
            </button>
          </div>

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
      </div>
    </div>
  );
}
