/**
 * Path Card Component
 * Displays a connection path from the watchlist
 */

import { useState } from 'react';
import { User, Briefcase, Trash2, ExternalLink, Loader2, CheckCircle2, Circle } from 'lucide-react';
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
  const progressPercentage = path.totalSteps > 0 ? (path.completedSteps / path.totalSteps) * 100 : 0;

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        {/* Target Profile Image or Fallback */}
        {path.targetProfileImage ? (
          <img
            src={path.targetProfileImage}
            alt={path.targetName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0, 119, 181, 0.2)',
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            <User size={24} strokeWidth={2} />
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
              wordBreak: 'break-word',
            }}
          >
            {path.targetName}
          </h3>
          {path.targetHeadline && (
            <p
              style={{
                fontSize: '13px',
                color: '#6e6e73',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              <Briefcase size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{path.targetHeadline}</span>
            </p>
          )}

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                flex: 1,
                height: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '3px',
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
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6e6e73', minWidth: '60px', textAlign: 'right' }}>
              {path.completedSteps}/{path.totalSteps} steps
            </span>
          </div>

          {/* Status Badge */}
          {path.isComplete && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#30D158',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              <CheckCircle2 size={12} />
              Path Complete!
            </div>
          )}
        </div>
      </div>

      {/* Connection Steps */}
      <div style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(0, 119, 181, 0.2)' }}>
        {path.path.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              opacity: step.connected ? 0.6 : 1,
            }}
          >
            <button
              onClick={() => onMarkStepConnected(path.id, index)}
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
              {step.connected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            </button>
            <span style={{ fontSize: '13px', color: step.connected ? '#6e6e73' : '#1d1d1f' }}>
              {step.name}
            </span>
            {step.connected && (
              <span style={{ fontSize: '11px', color: '#30D158', marginLeft: 'auto' }}>✓ Connected</span>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onViewProfile}
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
          onClick={onRemove}
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
  );
}
