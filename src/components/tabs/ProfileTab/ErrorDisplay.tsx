/**
 * Error Display Component
 * Shows errors with retry and refresh options
 */

import { RefreshCw, Loader2 } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  isRefreshingProfile: boolean;
  onRetry: () => void;
  onRefresh: () => void;
}

export function ErrorDisplay({
  error,
  isRefreshingProfile,
  onRetry,
  onRefresh
}: ErrorDisplayProps) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#FEE2E2',
        border: '1px solid #F87171',
        borderRadius: '12px',
        marginTop: '12px',
      }}
    >
      <p
        style={{
          fontSize: '13px',
          color: '#991B1B',
          margin: '0 0 12px 0',
        }}
      >
        <strong>Error:</strong> {error}
      </p>
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={onRetry}
          disabled={isRefreshingProfile}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: isRefreshingProfile ? '#8e8e93' : '#991B1B',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isRefreshingProfile ? 'not-allowed' : 'pointer',
            transition: 'background-color 150ms',
            opacity: isRefreshingProfile ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRefreshingProfile) {
              e.currentTarget.style.backgroundColor = '#7F1D1D';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshingProfile) {
              e.currentTarget.style.backgroundColor = '#991B1B';
            }
          }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshingProfile}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: isRefreshingProfile ? '#8e8e93' : '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isRefreshingProfile ? 'not-allowed' : 'pointer',
            transition: 'background-color 150ms',
            opacity: isRefreshingProfile ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRefreshingProfile) {
              e.currentTarget.style.backgroundColor = '#005582';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshingProfile) {
              e.currentTarget.style.backgroundColor = '#0077B5';
            }
          }}
        >
          {isRefreshingProfile ? (
            <>
              <Loader2
                size={14}
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Refresh Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}
