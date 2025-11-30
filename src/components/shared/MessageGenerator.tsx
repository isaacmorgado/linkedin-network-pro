/**
 * MessageGenerator Component
 *
 * Generates hyper-personalized LinkedIn messages for connection path hops.
 * Uses Claude AI to create context-aware, authentic messages based on profile data.
 */

import { useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import type { LinkedInProfile } from '../../types';
import { generateLinkedInMessage, type MessageGenerationContext } from '../../services/linkedin-message-generator';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, ICON } from '../../styles/tokens';
import { Button } from './Button';

export interface MessageGeneratorProps {
  // The person sending the message (you or previous hop)
  senderProfile: LinkedInProfile;

  // The person receiving the message
  recipientProfile: LinkedInProfile;

  // Connection context
  degreeOfSeparation: number;
  mutualConnections?: LinkedInProfile[];
  isDirectConnection?: boolean;

  // Optional: If this is asking someone for an introduction
  referralFrom?: LinkedInProfile;

  // Optional: What's the goal of this connection
  targetGoal?: string;

  // Size variant
  variant?: 'compact' | 'full';
}

export function MessageGenerator({
  senderProfile,
  recipientProfile,
  degreeOfSeparation,
  mutualConnections = [],
  isDirectConnection = false,
  referralFrom,
  targetGoal,
  variant = 'compact',
}: MessageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [personalizationPoints, setPersonalizationPoints] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const context: MessageGenerationContext = {
        senderProfile,
        recipientProfile,
        isDirectConnection,
        mutualConnections: mutualConnections.length > 0 ? mutualConnections : undefined,
        degreeOfSeparation,
        referralFrom,
        targetGoal,
      };

      const result = await generateLinkedInMessage(context);

      setGeneratedMessage(result.message);
      setPersonalizationPoints(result.personalizationPoints);
      setConfidence(result.confidence);
    } catch (err) {
      console.error('Failed to generate message:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedMessage) return;

    try {
      await navigator.clipboard.writeText(generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    setGeneratedMessage(null);
    setPersonalizationPoints([]);
    setConfidence(0);
    setError(null);
    setIsCopied(false);
  };

  if (variant === 'compact' && !generatedMessage) {
    return (
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="secondary"
        size="sm"
        icon={<Sparkles size={14} />}
      >
        {isGenerating ? 'Generating...' : 'Generate Message'}
      </Button>
    );
  }

  return (
    <div
      style={{
        padding: `${SPACING.md}px`,
        backgroundColor: COLORS.background.secondary,
        borderRadius: `${RADIUS.md}px`,
        border: `1px solid ${COLORS.border.light}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${SPACING.sm}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
          <Sparkles size={ICON.size.sm} color={COLORS.accent.default} />
          <span
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
            }}
          >
            AI-Generated Message
          </span>
        </div>

        {generatedMessage && (
          <button
            onClick={handleReset}
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              color: COLORS.text.tertiary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: `${SPACING.xxs}px ${SPACING.xs}px`,
            }}
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Generate Button (full variant) */}
      {!generatedMessage && variant === 'full' && (
        <div style={{ marginBottom: `${SPACING.md}px` }}>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            fullWidth
            variant="primary"
            icon={<Sparkles size={16} />}
          >
            {isGenerating ? 'Generating Message...' : 'Generate Personalized Message'}
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: `${SPACING.xs}px`,
            padding: `${SPACING.sm}px`,
            backgroundColor: COLORS.status.errorBg,
            borderRadius: `${RADIUS.sm}px`,
            marginTop: `${SPACING.sm}px`,
          }}
        >
          <AlertCircle size={ICON.size.sm} color={COLORS.status.error} />
          <div>
            <div
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.status.error,
              }}
            >
              Generation Failed
            </div>
            <div
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: COLORS.text.secondary,
                marginTop: '2px',
              }}
            >
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Generated Message */}
      {generatedMessage && (
        <>
          {/* Message Text */}
          <div
            style={{
              padding: `${SPACING.sm}px`,
              backgroundColor: COLORS.background.primary,
              borderRadius: `${RADIUS.sm}px`,
              border: `1px solid ${COLORS.border.light}`,
              marginBottom: `${SPACING.sm}px`,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                color: COLORS.text.primary,
                lineHeight: TYPOGRAPHY.lineHeight.relaxed,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {generatedMessage}
            </div>

            {/* Character count */}
            <div
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: COLORS.text.tertiary,
                marginTop: `${SPACING.xs}px`,
                textAlign: 'right',
              }}
            >
              {generatedMessage.length} characters
            </div>
          </div>

          {/* Personalization Points */}
          {personalizationPoints.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${SPACING.xxs}px`,
                marginBottom: `${SPACING.sm}px`,
              }}
            >
              {personalizationPoints.map((point, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                    color: COLORS.accent.default,
                    backgroundColor: COLORS.accent.lighter,
                    padding: '2px 8px',
                    borderRadius: `${RADIUS.sm}px`,
                  }}
                >
                  {point}
                </span>
              ))}
            </div>
          )}

          {/* Confidence Score */}
          {confidence > 0 && (
            <div
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: COLORS.text.secondary,
                marginBottom: `${SPACING.sm}px`,
              }}
            >
              Personalization quality:{' '}
              <span
                style={{
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: confidence >= 0.7 ? COLORS.status.success : confidence >= 0.5 ? COLORS.accent.default : COLORS.text.tertiary,
                }}
              >
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {/* Copy Button */}
          <Button
            onClick={handleCopy}
            disabled={isCopied}
            fullWidth
            variant="secondary"
            icon={isCopied ? <Check size={16} /> : <Copy size={16} />}
          >
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </>
      )}
    </div>
  );
}
