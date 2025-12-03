/**
 * Connection Result Components
 * Displays connection path results and strategies
 */

import type { ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';
import { ConnectionPathFlow } from './ConnectionPathFlow';

interface ConnectionResultProps {
  connectionPath: ConnectionStrategy;
  onSaveToWatchlist: () => void;
  isSaving?: boolean;
}

export function ConnectionResult({ connectionPath, onSaveToWatchlist, isSaving }: ConnectionResultProps) {
  // Use new enhanced card-flow UI for all connection strategies
  return (
    <ConnectionPathFlow
      connectionPath={connectionPath}
      onSaveToWatchlist={onSaveToWatchlist}
      isSaving={isSaving}
    />
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
