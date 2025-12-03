/**
 * Path Card Component
 * Displays a connection path from the watchlist
 * Enhanced with target bubble + expandable sub-steps
 */

import React, { useState } from 'react';
import { User, Trash2, ExternalLink, Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import type { ConnectionPath } from '../../../types/watchlist';

interface PathCardProps {
  path: ConnectionPath;
  onRemove: () => void;
  onViewProfile: () => void;
  onMarkStepConnected: (pathId: string, stepIndex: number) => void;
  isRemoving: boolean;
}

export function PathCard({ path, onRemove, onViewProfile, onMarkStepConnected, isRemoving }: PathCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const progressPercentage = path.totalSteps > 0 ? (path.completedSteps / path.totalSteps) * 100 : 0;

  return (
    <div
      style={{
        borderRadius: '16px',
        border: '2px solid #0077B5',
        backgroundColor: '#FFFFFF',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 119, 181, 0.15)' : '0 2px 8px rgba(0, 119, 181, 0.1)',
        transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Target Person Bubble - Clickable Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          backgroundColor: '#FAFAFA',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F0F0F0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FAFAFA';
        }}
      >
        {/* Target Profile Image or Fallback */}
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
          {path.targetProfileImage ? (
            <img
              src={path.targetProfileImage}
              alt={path.targetName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <User size={28} color="#0077B5" />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '700',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {path.targetName}
          </h3>
          {path.targetHeadline && (
            <p
              style={{
                fontSize: '13px',
                color: '#6e6e73',
                margin: '0 0 6px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {path.targetHeadline}
            </p>
          )}

          {/* Progress Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                backgroundColor: path.isComplete ? '#D1FAE5' : '#E5F1FB',
                color: path.isComplete ? '#065F46' : '#0077B5',
                borderRadius: '12px',
              }}
            >
              {path.isComplete ? '🎉 Complete!' : `${path.completedSteps}/${path.totalSteps} Steps`}
            </span>
            <div
              style={{
                flex: 1,
                minWidth: '60px',
                height: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  backgroundColor: path.isComplete ? '#30D158' : '#0077B5',
                  transition: 'width 300ms',
                }}
              />
            </div>
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
          <h4
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1d1d1f',
            }}
          >
            Connection Path ({path.totalSteps} {path.totalSteps === 1 ? 'Step' : 'Steps'})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {path.path.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: step.connected ? '#F0FDF4' : '#FFFFFF',
                    border: `1px solid ${step.connected ? '#BBF7D0' : '#E5E5EA'}`,
                    borderRadius: '8px',
                    transition: 'all 150ms',
                  }}
                >
                  {/* Status Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkStepConnected(path.id, index);
                    }}
                    disabled={step.connected}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: step.connected ? 'none' : '2px solid rgba(0, 119, 181, 0.4)',
                      backgroundColor: step.connected ? '#30D158' : 'transparent',
                      color: 'white',
                      cursor: step.connected ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 150ms',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!step.connected) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!step.connected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {step.connected ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>

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
                    {step.profileImage ? (
                      <img
                        src={step.profileImage}
                        alt={step.name}
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
                        color: step.connected ? '#065F46' : '#1d1d1f',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {step.name}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '12px',
                        color: '#6e6e73',
                      }}
                    >
                      {step.degree}° Connection
                    </p>
                  </div>

                  {/* Step Number */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: step.connected ? '#30D158' : '#0077B5',
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
                {index < path.path.length - 1 && (
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#0077B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#006399';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }}
        >
          <ExternalLink size={12} />
          View Profile
        </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={isRemoving}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            color: '#FF3B30',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: isRemoving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms',
            opacity: isRemoving ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRemoving) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
          }}
        >
              {isRemoving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
