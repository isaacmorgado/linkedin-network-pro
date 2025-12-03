/**
 * Connection Path Flow - Enhanced Visual UI
 * Shows connection path as card-flow + checklist hybrid
 *
 * Features:
 * - Target person bubble at top (collapsible)
 * - Expandable sub-steps showing full path
 * - Visual progress indicators
 * - Step-by-step checklist with status
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, ArrowRight, User } from 'lucide-react';
import type { ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';

interface ConnectionPathFlowProps {
  connectionPath: ConnectionStrategy;
  onSaveToWatchlist: () => void;
  isSaving?: boolean;
}

export function ConnectionPathFlow({
  connectionPath,
  onSaveToWatchlist,
  isSaving
}: ConnectionPathFlowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract path nodes
  const pathNodes = connectionPath.path?.nodes || [];
  const hasPath = pathNodes.length > 0;

  // Get target name (last node in path or from intermediary/candidate)
  const targetName =
    pathNodes[pathNodes.length - 1]?.name ||
    connectionPath.intermediary?.person.name ||
    connectionPath.candidate?.person.name ||
    'Target Person';

  const targetImage =
    pathNodes[pathNodes.length - 1]?.avatarUrl ||
    connectionPath.intermediary?.person.avatarUrl ||
    connectionPath.candidate?.person.avatarUrl;

  const targetHeadline =
    pathNodes[pathNodes.length - 1]?.title ||
    connectionPath.intermediary?.person.title ||
    '';

  const acceptanceRate = Math.round(connectionPath.estimatedAcceptanceRate * 100);
  const strategyType = connectionPath.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Target Person Bubble */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '2px solid #0077B5',
          boxShadow: '0 4px 12px rgba(0, 119, 181, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header - Target Person */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background-color 150ms',
            backgroundColor: '#FAFAFA',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F0F0F0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FAFAFA';
          }}
        >
          {/* Profile Image */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#E5E5EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid #0077B5',
            }}
          >
            {targetImage ? (
              <img
                src={targetImage}
                alt={targetName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={28} color="#0077B5" />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '700',
                color: '#1d1d1f',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {targetName}
            </h3>
            {targetHeadline && (
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '13px',
                  color: '#6e6e73',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {targetHeadline}
              </p>
            )}
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  backgroundColor: '#E5F1FB',
                  color: '#0077B5',
                  borderRadius: '12px',
                }}
              >
                {strategyType}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  backgroundColor: acceptanceRate >= 40 ? '#D1FAE5' : acceptanceRate >= 25 ? '#FEF3C7' : '#FEE2E2',
                  color: acceptanceRate >= 40 ? '#065F46' : acceptanceRate >= 25 ? '#92400E' : '#991B1B',
                  borderRadius: '12px',
                }}
              >
                {acceptanceRate}% Success Rate
              </span>
            </div>
          </div>

          {/* Expand Icon */}
          <div style={{ flexShrink: 0 }}>
            {isExpanded ? (
              <ChevronUp size={20} color="#0077B5" />
            ) : (
              <ChevronDown size={20} color="#0077B5" />
            )}
          </div>
        </div>

        {/* Expandable Content - Connection Steps */}
        {isExpanded && (
          <div style={{ padding: '16px', borderTop: '1px solid #E5E5EA' }}>
            {/* Strategy Explanation */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#F0F9FF',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #BAE6FD',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#0C4A6E',
                  lineHeight: '1.5',
                }}
              >
                <strong>Strategy:</strong> {connectionPath.reasoning}
              </p>
            </div>

            {/* Connection Path Steps */}
            {hasPath && pathNodes.length > 1 ? (
              <div style={{ marginBottom: '16px' }}>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                  }}
                >
                  Connection Path ({pathNodes.length - 1} {pathNodes.length === 2 ? 'Step' : 'Steps'})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pathNodes.slice(0, -1).map((node, index) => (
                    <React.Fragment key={node.id || index}>
                      {/* Step Card */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E5EA',
                          borderRadius: '8px',
                          transition: 'all 150ms',
                        }}
                      >
                        {/* Status Icon */}
                        <div style={{ flexShrink: 0 }}>
                          <Circle size={18} color="#6e6e73" />
                        </div>

                        {/* Profile Image */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#E5E5EA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {node.avatarUrl ? (
                            <img
                              src={node.avatarUrl}
                              alt={node.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <User size={20} color="#6e6e73" />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1d1d1f',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {node.name}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0 0',
                              fontSize: '12px',
                              color: '#6e6e73',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {node.title || `Step ${index + 1}`}
                          </p>
                        </div>

                        {/* Step Number */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#0077B5',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Arrow Connector */}
                      {index < pathNodes.length - 2 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '4px 0',
                          }}
                        >
                          <ArrowRight size={20} color="#0077B5" strokeWidth={2} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              /* No full path - show intermediary/candidate */
              (connectionPath.intermediary || connectionPath.candidate) && (
                <div style={{ marginBottom: '16px' }}>
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1d1d1f',
                    }}
                  >
                    {connectionPath.intermediary ? 'Recommended Intermediary' : 'Suggested Gateway'}
                  </h4>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#92400E',
                      }}
                    >
                      {(connectionPath.intermediary || connectionPath.candidate)?.person.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#92400E',
                        lineHeight: '1.5',
                      }}
                    >
                      {(connectionPath.intermediary || connectionPath.candidate)?.reasoning}
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Next Steps Checklist */}
            <div style={{ marginBottom: '16px' }}>
              <h4
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                }}
              >
                Action Checklist
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {connectionPath.nextSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <Circle size={16} color="#9CA3AF" />
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#374151',
                        lineHeight: '1.5',
                        flex: 1,
                      }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={onSaveToWatchlist}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: isSaving ? '#10B981' : '#0077B5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'default' : 'pointer',
                transition: 'all 150ms',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#005885';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#0077B5';
                }
              }}
            >
              {isSaving ? (
                <>
                  <CheckCircle2 size={18} />
                  Saved to Network Paths
                </>
              ) : (
                'Save Connection Path'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
