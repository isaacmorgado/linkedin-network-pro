/**
 * RouteResultCard Component
 *
 * Displays connection path results with visual step-by-step guide.
 */

import React, { useState } from 'react';
import { ChevronRight, Check, User, BookmarkPlus, X } from 'lucide-react';
import type { ConnectionRoute } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, ICON } from '../../styles/tokens';
import { ProgressBar } from './ProgressBar';
import { Button } from './Button';
import { MessageGenerator } from './MessageGenerator';

export interface RouteResultCardProps {
  route: ConnectionRoute;
  onSaveToWatchlist?: () => void;
  onClose?: () => void;
  isSaving?: boolean;
}

export function RouteResultCard({
  route,
  onSaveToWatchlist,
  onClose,
  isSaving = false,
}: RouteResultCardProps) {
  const totalSteps = route.nodes.length - 1; // Exclude yourself
  const degreeOfSeparation = route.nodes.length - 1;

  // Track which nodes have expanded message generators
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const toggleMessageGenerator = (index: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div
      style={{
        padding: `${SPACING.lg}px`,
        backgroundColor: COLORS.accent.lighter,
        border: `1px solid ${COLORS.accent.light}`,
        borderRadius: `${RADIUS.lg}px`,
        boxShadow: SHADOWS.md,
        marginTop: `${SPACING.md}px`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: `${SPACING.md}px` }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              margin: `0 0 ${SPACING.xs}px 0`,
            }}
          >
            Connection Path Found! 🎯
          </h3>
          <p
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              color: COLORS.text.secondary,
              margin: 0,
            }}
          >
            {degreeOfSeparation === 1
              ? "You're 1st degree connections"
              : degreeOfSeparation === 2
              ? "You're 2nd degree connections"
              : `You're ${degreeOfSeparation}${degreeOfSeparation === 3 ? 'rd' : 'th'} degree connections`}
          </p>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: `${SPACING.xs}px`,
              borderRadius: `${RADIUS.sm}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color 150ms ease-out`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={ICON.size.sm} color={COLORS.text.tertiary} />
          </button>
        )}
      </div>

      {/* Success probability */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${SPACING.xs}px`,
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          backgroundColor: COLORS.background.primary,
          borderRadius: `${RADIUS.md}px`,
          marginBottom: `${SPACING.lg}px`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: '4px',
            }}
          >
            Success Probability
          </div>
          <ProgressBar
            value={route.successProbability}
            max={100}
            variant="linear"
            height={6}
            showLabel
            isComplete={route.successProbability >= 80}
          />
        </div>
      </div>

      {/* Connection path steps */}
      <div style={{ marginBottom: `${SPACING.lg}px` }}>
        <div
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
            marginBottom: `${SPACING.sm}px`,
          }}
        >
          Connection Path ({totalSteps} step{totalSteps !== 1 ? 's' : ''}):
        </div>

        {/* Path visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING.xs}px` }}>
          {route.nodes.map((node, index) => {
            const isFirst = index === 0;
            const isLast = index === route.nodes.length - 1;
            const showConnector = !isLast;

            return (
              <React.Fragment key={node.id}>
                {/* Node */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: `${SPACING.sm}px`,
                    padding: `${SPACING.sm}px`,
                    backgroundColor: COLORS.background.primary,
                    borderRadius: `${RADIUS.md}px`,
                    border: isFirst || isLast ? `2px solid ${COLORS.accent.default}` : `1px solid ${COLORS.border.light}`,
                  }}
                >
                  {/* Avatar with image or gradient fallback */}
                  {node.profile?.avatarUrl ? (
                    <img
                      src={node.profile.avatarUrl}
                      alt={node.profile.name || 'Profile'}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        // If image fails to load, replace with gradient fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isFirst
                        ? 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: node.profile?.avatarUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {isFirst ? (
                      <Check size={16} color="white" />
                    ) : node.profile?.name ? (
                      node.profile.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={16} color="white" />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                        color: COLORS.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isFirst ? 'You' : node.profile.name || 'Connection'}
                    </div>
                    <div
                      style={{
                        fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                        color: COLORS.text.tertiary,
                      }}
                    >
                      {isFirst
                        ? 'Start here'
                        : isLast
                        ? 'Your target'
                        : `${node.degree}${node.degree === 1 ? 'st' : node.degree === 2 ? 'nd' : 'rd'} degree`}
                    </div>
                  </div>

                  {/* Match score */}
                  {!isFirst && node.matchScore !== undefined && (
                    <div
                      style={{
                        fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                        color: node.matchScore >= 70 ? '#30D158' : node.matchScore >= 40 ? COLORS.accent.default : COLORS.text.tertiary,
                        backgroundColor: node.matchScore >= 70 ? '#E8F5E9' : node.matchScore >= 40 ? COLORS.accent.lighter : COLORS.background.tertiary,
                        padding: '4px 8px',
                        borderRadius: `${RADIUS.sm}px`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.matchScore}% match
                    </div>
                  )}
                </div>

                {/* Message Generator - Show for all hops except yourself */}
                {!isFirst && (
                  <div
                    style={{
                      marginTop: `${SPACING.xs}px`,
                      marginBottom: `${SPACING.xs}px`,
                      marginLeft: '44px', // Align with node content (32px avatar + 12px gap)
                    }}
                  >
                    {expandedMessages.has(index) ? (
                      <MessageGenerator
                        senderProfile={route.nodes[index - 1].profile}
                        recipientProfile={node.profile}
                        degreeOfSeparation={node.degree}
                        mutualConnections={[]} // Could be populated from graph data
                        isDirectConnection={index === 1}
                        referralFrom={index > 1 ? route.nodes[index - 1].profile : undefined}
                        targetGoal="networking"
                        variant="full"
                      />
                    ) : (
                      <button
                        onClick={() => toggleMessageGenerator(index)}
                        style={{
                          background: 'none',
                          border: `1px solid ${COLORS.border.light}`,
                          borderRadius: `${RADIUS.sm}px`,
                          padding: `${SPACING.xs}px ${SPACING.sm}px`,
                          fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                          color: COLORS.accent.default,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 150ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.accent.lighter;
                          e.currentTarget.style.borderColor = COLORS.accent.default;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = COLORS.border.light;
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>✨</span>
                        Generate Message
                      </button>
                    )}
                  </div>
                )}

                {/* Connector arrow */}
                {showConnector && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: `${SPACING.xs}px 0`,
                    }}
                  >
                    <ChevronRight size={ICON.size.sm} color={COLORS.text.tertiary} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      {onSaveToWatchlist && (
        <Button
          onClick={onSaveToWatchlist}
          disabled={isSaving}
          fullWidth
          variant="primary"
          icon={<BookmarkPlus size={16} />}
        >
          {isSaving ? 'Saving...' : 'Save Path to Watchlist'}
        </Button>
      )}

      {/* Tips */}
      <div
        style={{
          marginTop: `${SPACING.md}px`,
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          backgroundColor: 'rgba(255, 149, 0, 0.05)',
          borderLeft: `3px solid #FF9500`,
          borderRadius: `${RADIUS.sm}px`,
        }}
      >
        <div
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            color: COLORS.text.secondary,
            lineHeight: TYPOGRAPHY.lineHeight.relaxed,
          }}
        >
          💡 <strong>Tip:</strong> Start by connecting with the closest person in your path. Once connected, ask them
          for an introduction to the next person.
        </div>
      </div>
    </div>
  );
}
