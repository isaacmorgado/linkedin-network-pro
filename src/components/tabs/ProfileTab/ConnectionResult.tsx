/**
 * Connection Result Components
 * Displays connection path results and strategies
 */

import type { ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';
import { RouteResultCard } from '../../shared/RouteResultCard';
import { transformConnectionStrategyForUI } from './transformUtils';

interface ConnectionResultProps {
  connectionPath: ConnectionStrategy;
  onSaveToWatchlist: () => void;
  isSaving?: boolean;
}

export function ConnectionResult({ connectionPath, onSaveToWatchlist, isSaving }: ConnectionResultProps) {
  // If there's a full path (mutual connections), transform it to the correct format
  if (connectionPath.path) {
    const route = transformConnectionStrategyForUI(connectionPath);

    if (!route) {
      console.error('[Uproot] Failed to transform connection path to route');
      return (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#FEE', borderRadius: '8px' }}>
          <p style={{ color: '#C00', margin: 0 }}>Error displaying connection path</p>
        </div>
      );
    }

    return (
      <div style={{ marginTop: '16px' }}>
        <RouteResultCard
          route={route}
          onSaveToWatchlist={onSaveToWatchlist}
          isSaving={isSaving}
        />
      </div>
    );
  }

  // For strategies without full path (direct similarity, cold outreach)
  // Determine styling based on strategy type and confidence
  const isLowConfidence = connectionPath.lowConfidence || false;
  const isColdOutreach = connectionPath.type === 'cold-outreach';

  // Use amber/warning colors for low confidence or cold outreach
  const backgroundColor = isColdOutreach || isLowConfidence ? '#FEF3C7' : '#F0F9FF';
  const borderColor = isColdOutreach || isLowConfidence ? '#F59E0B' : '#3B82F6';
  const textColor = isColdOutreach || isLowConfidence ? '#92400E' : '#1E3A8A';
  const headingColor = isColdOutreach || isLowConfidence ? '#92400E' : '#1E40AF';
  const badgeColor = isColdOutreach || isLowConfidence ? '#FEF3C7' : '#DBEAFE';

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        style={{
          padding: '16px',
          backgroundColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h4
          style={{
            margin: '0 0 8px 0',
            color: headingColor,
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          Connection Strategy: {connectionPath.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          {isLowConfidence && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                fontWeight: '500',
                padding: '2px 6px',
                backgroundColor: '#FCD34D',
                color: '#78350F',
                borderRadius: '4px',
              }}
            >
              Limited Data
            </span>
          )}
        </h4>
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: textColor,
            lineHeight: '1.5',
          }}
        >
          {connectionPath.reasoning}
        </p>

        {/* Display candidate if available (for cold-outreach or low-confidence intermediary) */}
        {(connectionPath.candidate || connectionPath.intermediary) && (
          <div
            style={{
              padding: '12px',
              backgroundColor: badgeColor,
              borderRadius: '8px',
              marginBottom: '12px',
              border: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: '12px', color: headingColor, fontWeight: '600', marginBottom: '6px' }}>
              {connectionPath.candidate ? 'Suggested Gateway:' : 'Recommended Intermediary:'}
            </div>
            <div style={{ fontSize: '14px', color: textColor, fontWeight: '500' }}>
              {(connectionPath.candidate || connectionPath.intermediary)?.person.name}
            </div>
            <div style={{ fontSize: '12px', color: textColor, marginTop: '4px' }}>
              {(connectionPath.candidate || connectionPath.intermediary)?.reasoning}
            </div>
          </div>
        )}

        {/* Estimated Acceptance Rate */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: badgeColor,
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: headingColor, marginBottom: '4px' }}>
            Estimated Acceptance Rate
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: headingColor }}>
            {(connectionPath.estimatedAcceptanceRate * 100).toFixed(0)}%
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ fontSize: '13px', color: textColor }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Next Steps:</strong>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            {connectionPath.nextSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={onSaveToWatchlist}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '10px 16px',
            marginTop: '16px',
            backgroundColor: isSaving ? '#10B981' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isSaving ? 'default' : 'pointer',
            opacity: isSaving ? 0.9 : 1,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving) {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }
          }}
        >
          {isSaving ? '✓ Saved to Watchlist' : 'Save to Watchlist'}
        </button>
      </div>
    </div>
  );
}

/**
 * @deprecated This component is no longer used as the pathfinding system ALWAYS returns a viable strategy.
 * The 'none' type has been replaced with 'cold-outreach' which provides actionable next steps.
 * Keeping this for backward compatibility only.
 */
export function NoPathMessage({ connectionPath }: { connectionPath: ConnectionStrategy }) {
  // This should never be called in the new implementation
  console.warn('[NoPathMessage] DEPRECATED: This component should not be called. Type:', connectionPath.type);

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h4
        style={{
          margin: '0 0 8px 0',
          color: '#92400E',
          fontSize: '15px',
          fontWeight: '600',
        }}
      >
        No Strong Connection Path
      </h4>
      <p
        style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          color: '#92400E',
          lineHeight: '1.5',
        }}
      >
        {connectionPath.reasoning}
      </p>
      <div style={{ fontSize: '13px', color: '#92400E' }}>
        <strong style={{ display: 'block', marginBottom: '8px' }}>Suggestions:</strong>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          {connectionPath.nextSteps.map((step, i) => (
            <li key={i} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
