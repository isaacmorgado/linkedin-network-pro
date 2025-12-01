/**
 * Tab Switcher Component
 * Switches between network/people/companies views
 */

import { User, Building2, GitBranch } from 'lucide-react';
import type { WatchlistView } from './types';

interface TabSwitcherProps {
  activeView: WatchlistView;
  onViewChange: (view: WatchlistView) => void;
  pathCount: number;
  peopleCount: number;
  companyCount: number;
  panelWidth?: number;
}

export function TabSwitcher({ activeView, onViewChange, pathCount, peopleCount, companyCount, panelWidth = 400 }: TabSwitcherProps) {
  // Responsive sizing based on panel width - adjusted for 3 tabs
  const isVeryNarrow = panelWidth < 320;
  const isNarrow = panelWidth < 380;
  const isCompact = panelWidth < 450;
  const showIcons = true; // Always show icons with just 3 tabs
  const fontSize = isVeryNarrow ? '11px' : isNarrow ? '12px' : '13px';
  const padding = isVeryNarrow ? '6px 8px' : isNarrow ? '8px 12px' : isCompact ? '10px 14px' : '12px 16px';
  const gap = isVeryNarrow ? '4px' : isNarrow ? '8px' : '12px';
  const iconSize = 16; // Larger icons for 3 tabs

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(255, 149, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', gap }}>
        <button
          onClick={() => onViewChange('network')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'network' ? '#0077B5' : 'transparent',
            color: activeView === 'network' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'network' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'network') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'network') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <GitBranch size={iconSize} strokeWidth={2} />}
          Network
          {pathCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'network' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {pathCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('people')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'people' ? '#0077B5' : 'transparent',
            color: activeView === 'people' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'people' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'people') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'people') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <User size={iconSize} strokeWidth={2} />}
          People
          {peopleCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'people' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {peopleCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('companies')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'companies' ? '#0077B5' : 'transparent',
            color: activeView === 'companies' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'companies' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'companies') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'companies') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <Building2 size={iconSize} strokeWidth={2} />}
          Companies
          {companyCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'companies' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {companyCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
