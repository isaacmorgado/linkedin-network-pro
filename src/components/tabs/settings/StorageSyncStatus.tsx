/**
 * Storage Sync Status Component
 * Displays synchronization status between storage systems and allows manual sync
 */

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { COLORS } from '../../../styles/tokens';
import { checkAllSync, manualSync, type AllSyncStatus } from '../../../utils/storage/sync-checker';

export function StorageSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<AllSyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Check sync status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkAllSync();
      setSyncStatus(status);
    } catch (error) {
      console.error('[StorageSyncStatus] Error checking sync:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await manualSync();
      setLastSyncTime(Date.now());

      // Re-check status after sync
      setTimeout(checkStatus, 500);
    } catch (error) {
      console.error('[StorageSyncStatus] Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!syncStatus) return COLORS.text.secondary;
    return syncStatus.overall === 'synced' ? '#10B981' : '#F59E0B';
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Database size={20} color={COLORS.text.secondary} />;
    return syncStatus.overall === 'synced'
      ? <CheckCircle size={20} color="#10B981" />
      : <AlertTriangle size={20} color="#F59E0B" />;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div style={{
      padding: '24px',
      borderTop: `1px solid ${COLORS.border.default}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.text.primary,
            marginBottom: '4px',
          }}>
            Storage Sync Status
          </h3>
          <p style={{
            fontSize: '12px',
            color: COLORS.text.secondary,
          }}>
            Synchronization between job preferences, watchlist, and feed settings
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: COLORS.accent.default,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            opacity: isSyncing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Overall Status */}
      {syncStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: COLORS.background.secondary,
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {getStatusIcon()}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: getStatusColor(),
              marginBottom: '4px',
            }}>
              {syncStatus.overall === 'synced' ? 'All Systems Synced' : 'Out of Sync'}
            </div>
            <div style={{
              fontSize: '12px',
              color: COLORS.text.secondary,
            }}>
              {lastSyncTime
                ? `Last synced at ${formatTime(lastSyncTime)}`
                : `Last checked at ${formatTime(syncStatus.jobPreferences.lastChecked)}`
              }
            </div>
          </div>
        </div>
      )}

      {/* Detailed Status */}
      {syncStatus && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Job Preferences */}
          <div style={{
            padding: '12px',
            backgroundColor: COLORS.background.primary,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: '6px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {syncStatus.jobPreferences.isSynced
                ? <CheckCircle size={16} color="#10B981" />
                : <AlertTriangle size={16} color="#F59E0B" />
              }
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: COLORS.text.primary,
              }}>
                Job Preferences
              </span>
            </div>
            {syncStatus.jobPreferences.issues.length > 0 && (
              <ul style={{
                margin: 0,
                paddingLeft: '24px',
                fontSize: '12px',
                color: COLORS.text.secondary,
              }}>
                {syncStatus.jobPreferences.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
            {syncStatus.jobPreferences.isSynced && (
              <div style={{
                fontSize: '12px',
                color: COLORS.text.secondary,
                paddingLeft: '24px',
              }}>
                ✓ Synced with feed preferences
              </div>
            )}
          </div>

          {/* Watchlist Companies */}
          <div style={{
            padding: '12px',
            backgroundColor: COLORS.background.primary,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: '6px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {syncStatus.watchlistCompanies.isSynced
                ? <CheckCircle size={16} color="#10B981" />
                : <AlertTriangle size={16} color="#F59E0B" />
              }
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: COLORS.text.primary,
              }}>
                Watchlist Companies
              </span>
            </div>
            {syncStatus.watchlistCompanies.issues.length > 0 && (
              <ul style={{
                margin: 0,
                paddingLeft: '24px',
                fontSize: '12px',
                color: COLORS.text.secondary,
              }}>
                {syncStatus.watchlistCompanies.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
            {syncStatus.watchlistCompanies.isSynced && (
              <div style={{
                fontSize: '12px',
                color: COLORS.text.secondary,
                paddingLeft: '24px',
              }}>
                ✓ Synced with enabled companies
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isChecking && !syncStatus && (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: COLORS.text.secondary,
        }}>
          Checking sync status...
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
