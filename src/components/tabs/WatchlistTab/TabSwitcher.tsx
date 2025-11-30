/**
 * Tab Switcher Component
 * Switches between network/people/companies views
 */

import { User, Building2, GitBranch, Search } from 'lucide-react';
import type { WatchlistView } from './types';

interface TabSwitcherProps {
  activeView: WatchlistView;
  onViewChange: (view: WatchlistView) => void;
  pathCount: number;
  peopleCount: number;
  companyCount: number;
  searchCount?: number;
  panelWidth?: number;
}

export function TabSwitcher({ activeView, onViewChange, pathCount, peopleCount, companyCount, searchCount = 0, panelWidth = 400 }: TabSwitcherProps) {
  // Responsive sizing based on panel width - adjusted for 4 tabs
  const isVeryNarrow = panelWidth < 380;
  const isNarrow = panelWidth < 450;
  const isCompact = panelWidth < 550;
  const showIcons = !isNarrow; // Hide icons earlier with 4 tabs
  const fontSize = isVeryNarrow ? '11px' : isNarrow ? '12px' : '13px';
  const padding = isVeryNarrow ? '6px 8px' : isNarrow ? '8px 10px' : isCompact ? '9px 12px' : '10px 14px';
  const gap = isVeryNarrow ? '4px' : isNarrow ? '6px' : '8px';
  const iconSize = 14; // Smaller icons for 4 tabs

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

        <button
          onClick={() => onViewChange('search')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'search' ? '#0077B5' : 'transparent',
            color: activeView === 'search' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'search' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
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
            if (activeView !== 'search') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'search') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <Search size={iconSize} strokeWidth={2} />}
          Search
          {searchCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'search' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {searchCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
