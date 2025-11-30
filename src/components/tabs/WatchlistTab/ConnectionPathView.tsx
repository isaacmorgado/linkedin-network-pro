/**
 * Connection Path View Component
 * Displays visual connection path with strategy and action steps
 */

import { X, MessageSquare, ArrowRight } from 'lucide-react';
import type { EnhancedConnectionRoute } from '../../../services/universal-connection/universal-connection-types';

interface ConnectionPathViewProps {
  path: EnhancedConnectionRoute | null;
  onGenerateMessage: () => void;
  onClose: () => void;
}

export function ConnectionPathView({ path, onGenerateMessage, onClose }: ConnectionPathViewProps) {
  if (!path) return null;

  // Get success probability color
  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: 'High' };
    if (probability >= 0.4) return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', label: 'Medium' };
    return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', label: 'Low' };
  };

  const probabilityStyle = getProbabilityColor(path.successProbability);
  const percentage = Math.round(path.successProbability * 100);

  // Format strategy name
  const formatStrategy = (strategy: string) => {
    return strategy
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Connection Path
          </h2>
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
          {/* Path Visualization */}
          <div
            style={{
              backgroundColor: 'rgba(0, 119, 181, 0.03)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {path.path.map((node, index) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Node */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      className="network-node"
                      style={{
                        width: index === 0 || index === path.path.length - 1 ? '64px' : '56px',
                        height: index === 0 || index === path.path.length - 1 ? '64px' : '56px',
                      }}
                    >
                      {node.profileImage ? (
                        <img
                          src={node.profileImage}
                          alt={node.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                          }}
                        >
                          {node.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#1d1d1f',
                        maxWidth: '100px',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      {index === 0 ? 'You' : index === path.path.length - 1 ? 'Target' : node.name}
                    </span>
                  </div>

                  {/* Arrow */}
                  {index < path.path.length - 1 && (
                    <ArrowRight size={24} color="#0077B5" strokeWidth={2} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strategy & Probability */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Strategy */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 6px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Strategy
              </p>
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0077B5',
                }}
              >
                {formatStrategy(path.strategy)}
              </div>
            </div>

            {/* Success Probability */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 6px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Success Probability
              </p>
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: probabilityStyle.bg,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: probabilityStyle.text,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{percentage}%</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {probabilityStyle.label}
                </span>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          {path.reasoning && (
            <div style={{ marginBottom: '24px' }}>
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
                Why This Path?
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#1d1d1f',
                  margin: 0,
                  lineHeight: '1.6',
                }}
              >
                {path.reasoning}
              </p>
            </div>
          )}

          {/* Action Steps */}
          {path.actionSteps && path.actionSteps.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6e6e73',
                  margin: '0 0 12px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Action Steps
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {path.actionSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 119, 181, 0.1)',
                        color: '#0077B5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#1d1d1f',
                        margin: '2px 0 0 0',
                        lineHeight: '1.5',
                      }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Message Button */}
          <button
            onClick={onGenerateMessage}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#006399';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0077B5';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <MessageSquare size={18} />
            Generate Connection Message
          </button>
        </div>
      </div>
    </div>
  );
}
