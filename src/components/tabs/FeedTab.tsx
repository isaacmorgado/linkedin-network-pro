/**
 * Feed Tab - Unified Activity & Notifications Dashboard
 * Shows all activity: job alerts, company updates, connection activity,
 * application status changes, and recommendations in one place
 */

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Building2,
  User,
  TrendingUp,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  Filter,
  Sparkles,
  RefreshCw,
  Flame,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import type { FeedItem } from '../../types/feed';
import { useFeed } from '../../hooks/useFeed';

type FeedFilter = 'all' | 'jobs' | 'companies' | 'people' | 'unread';

interface FeedTabProps {
  panelWidth?: number;
}

export function FeedTab({ panelWidth = 400 }: FeedTabProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Use the useFeed hook for data management
  const { feedItems, stats, isLoading, error, toggleRead, markAllAsRead, clearAllFeed, reload } = useFeed();

  const hasItems = feedItems.length > 0;

  // Filter logic - Memoized to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    console.log('[FeedTab] Filtering items...', { feedItemsCount: feedItems.length, activeFilter });
    return feedItems.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !item.read;
      if (activeFilter === 'jobs') return item.type === 'job_alert';
      if (activeFilter === 'companies') return item.type === 'company_update';
      if (activeFilter === 'people')
        return item.type === 'person_update' || item.type === 'connection_update';
      return true;
    });
  }, [feedItems, activeFilter]);

  // Pagination logic
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const unreadCount = stats.unreadCount;

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Show error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '16px',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle
          size={48}
          color="#FF3B30"
          strokeWidth={2}
        />
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1d1d1f',
              marginBottom: '8px',
            }}
          >
            Failed to load feed
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: '#6e6e73',
              marginBottom: '0',
            }}
          >
            {error}
          </p>
        </div>
        <button
          onClick={reload}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#0077B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#005885';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6e6e73',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <RefreshCw size={32} className="animate-spin" strokeWidth={2} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading feed...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: panelWidth < 360 ? '16px 16px 12px 16px' : '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2
            style={{
              fontSize: panelWidth < 360 ? '18px' : '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            {panelWidth < 360 ? 'Feed' : 'Activity Feed'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <div
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 149, 0, 0.1)',
                  borderRadius: '12px',
                  fontSize: panelWidth < 360 ? '11px' : '12px',
                  fontWeight: '600',
                  color: '#FF9500',
                  whiteSpace: 'nowrap',
                }}
              >
                {unreadCount} new
              </div>
            )}
            {hasItems && (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      padding: panelWidth < 360 ? '4px 8px' : '6px 10px',
                      backgroundColor: '#0077B5',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: panelWidth < 360 ? '10px' : '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 150ms',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#005885';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0077B5';
                    }}
                    title="Mark all as read"
                  >
                    <CheckCircle2 size={panelWidth < 360 ? 10 : 12} />
                    {panelWidth >= 360 && 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
                      clearAllFeed();
                    }
                  }}
                  style={{
                    padding: panelWidth < 360 ? '4px 8px' : '6px 10px',
                    backgroundColor: '#FF3B30',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: panelWidth < 360 ? '10px' : '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 150ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#D32F2F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF3B30';
                  }}
                  title="Clear all notifications"
                >
                  <Trash2 size={panelWidth < 360 ? 10 : 12} />
                  {panelWidth >= 360 && 'Clear All'}
                </button>
              </>
            )}
          </div>
        </div>
        {panelWidth >= 360 && (
          <p
            style={{
              fontSize: '13px',
              color: '#6e6e73',
              margin: 0,
            }}
          >
            All notifications, job alerts, and updates in one place
          </p>
        )}
      </div>

      {/* Filters */}
      {hasItems && (
        <FeedFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={unreadCount}
          panelWidth={panelWidth}
        />
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#FAFAFA',
        }}
      >
        {!hasItems ? (
          <EmptyState />
        ) : filteredItems.length === 0 ? (
          <EmptyFilterState filter={activeFilter} />
        ) : (
          <>
            <div style={{ padding: panelWidth < 360 ? '12px' : '16px', display: 'flex', flexDirection: 'column', gap: panelWidth < 360 ? '10px' : '12px' }}>
              {paginatedItems.map((item) => (
                <FeedCard key={item.id} item={item} panelWidth={panelWidth} onToggleRead={toggleRead} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                panelWidth={panelWidth}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Feed Filters Component
interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  unreadCount: number;
  panelWidth?: number;
}

function FeedFilters({ activeFilter, onFilterChange, unreadCount, panelWidth = 400 }: FeedFiltersProps) {
  const isVeryNarrow = panelWidth < 360;
  const isNarrow = panelWidth < 400;
  const fontSize = isVeryNarrow ? '10px' : isNarrow ? '11px' : '12px';
  const padding = isVeryNarrow ? '6px 8px' : isNarrow ? '6px 10px' : '8px 12px';
  const gap = isVeryNarrow ? '4px' : '6px';
  const iconSize = isVeryNarrow ? 10 : 12;
  const showLabels = panelWidth >= 360; // Hide labels on very narrow widths

  const filters: { value: FeedFilter; label: string; shortLabel?: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter size={iconSize} /> },
    { value: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`, shortLabel: 'New', icon: <Circle size={iconSize} /> },
    { value: 'jobs', label: 'Jobs', icon: <Briefcase size={iconSize} /> },
    { value: 'companies', label: 'Companies', shortLabel: 'Co.', icon: <Building2 size={iconSize} /> },
    { value: 'people', label: 'People', icon: <User size={iconSize} /> },
  ];

  return (
    <div
      style={{
        padding: isVeryNarrow ? '8px 12px' : '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', gap, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {filters.map(({ value, label, shortLabel, icon }) => {
          const displayLabel = showLabels ? label : (shortLabel || '');

          return (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              style={{
                padding,
                backgroundColor: activeFilter === value ? '#0077B5' : 'rgba(0, 0, 0, 0.05)',
                color: activeFilter === value ? '#FFFFFF' : '#1d1d1f',
                border: 'none',
                borderRadius: '16px',
                fontSize,
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: showLabels ? '4px' : '0',
                transition: 'all 150ms',
                whiteSpace: 'nowrap',
                minWidth: showLabels ? 'auto' : '32px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== value) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== value) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              title={!showLabels ? label : undefined}
            >
              {icon}
              {showLabels && displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  panelWidth?: number;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  panelWidth = 400
}: PaginationControlsProps) {
  const isVeryNarrow = panelWidth < 360;
  const isNarrow = panelWidth < 400;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isVeryNarrow ? '6px' : '12px',
        padding: isVeryNarrow ? '12px' : '16px',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{
          padding: isVeryNarrow ? '6px' : '8px 12px',
          backgroundColor: currentPage === 1 ? 'rgba(0, 0, 0, 0.05)' : '#0077B5',
          color: currentPage === 1 ? '#86868b' : '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: isVeryNarrow ? '11px' : '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 150ms',
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = '#005885';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }
        }}
      >
        <ChevronLeft size={isVeryNarrow ? 14 : 16} />
        {!isVeryNarrow && 'Previous'}
      </button>

      {/* Page Indicator */}
      <span
        style={{
          color: '#1d1d1f',
          fontSize: isVeryNarrow ? '11px' : '13px',
          fontWeight: '500',
          minWidth: isVeryNarrow ? '60px' : '80px',
          textAlign: 'center',
        }}
      >
        {isVeryNarrow ? `${currentPage}/${totalPages}` : `Page ${currentPage} of ${totalPages}`}
      </span>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{
          padding: isVeryNarrow ? '6px' : '8px 12px',
          backgroundColor: currentPage === totalPages ? 'rgba(0, 0, 0, 0.05)' : '#0077B5',
          color: currentPage === totalPages ? '#86868b' : '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: isVeryNarrow ? '11px' : '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 150ms',
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = '#005885';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }
        }}
      >
        {!isVeryNarrow && 'Next'}
        <ChevronRight size={isVeryNarrow ? 14 : 16} />
      </button>

      {/* Page Selector (only on wider screens) */}
      {!isNarrow && totalPages <= 10 && (
        <select
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: '#FFFFFF',
            color: '#1d1d1f',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// Feed Card Component
interface FeedCardProps {
  item: FeedItem;
  panelWidth?: number;
  onToggleRead: (itemId: string) => void;
}

function FeedCard({ item, panelWidth = 400, onToggleRead }: FeedCardProps) {
  const isNarrow = panelWidth < 360;

  // Responsive sizing based on panel width
  const getResponsiveSize = () => {
    if (panelWidth < 320) {
      return { iconBox: 28, borderRadius: '6px', padding: '10px', gap: '8px', marginBottom: '8px' };
    } else if (panelWidth < 360) {
      return { iconBox: 32, borderRadius: '8px', padding: '12px', gap: '10px', marginBottom: '10px' };
    } else if (panelWidth < 400) {
      return { iconBox: 36, borderRadius: '10px', padding: '14px', gap: '12px', marginBottom: '12px' };
    } else {
      return { iconBox: 40, borderRadius: '12px', padding: '16px', gap: '12px', marginBottom: '12px' };
    }
  };

  const sizes = getResponsiveSize();

  const handleToggleRead = () => {
    onToggleRead(item.id);
  };

  const getTypeIcon = () => {
    // More granular icon sizing based on panel width
    let iconSize = 16; // Default
    if (panelWidth < 320) {
      iconSize = 12;
    } else if (panelWidth < 360) {
      iconSize = 14;
    } else if (panelWidth < 400) {
      iconSize = 16;
    } else {
      iconSize = 18;
    }

    switch (item.type) {
      case 'job_alert':
        return <Briefcase size={iconSize} color="#0077B5" />;
      case 'application_status':
        return <CheckCircle2 size={iconSize} color="#FF3B30" />;
      case 'company_update':
        return <Building2 size={iconSize} color="#FF9500" />;
      case 'connection_update':
      case 'person_update':
        return <User size={iconSize} color="#34C759" />;
      case 'recommendation':
        return <Sparkles size={iconSize} color="#AF52DE" />;
      case 'hiring_heat':
        return <Flame size={iconSize} color="#FF3B30" />;
      case 'deadline_alert':
        return <AlertCircle size={iconSize} color="#FF9500" />;
      default:
        return <TrendingUp size={iconSize} color="#6e6e73" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'job_alert':
        return 'rgba(0, 119, 181, 0.1)';
      case 'application_status':
        return 'rgba(255, 59, 48, 0.1)';
      case 'company_update':
        return 'rgba(255, 149, 0, 0.1)';
      case 'connection_update':
      case 'person_update':
        return 'rgba(52, 199, 89, 0.1)';
      case 'recommendation':
        return 'rgba(175, 82, 222, 0.1)';
      case 'hiring_heat':
        return 'rgba(255, 59, 48, 0.1)';
      case 'deadline_alert':
        return 'rgba(255, 149, 0, 0.1)';
      default:
        return 'rgba(0, 0, 0, 0.05)';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: sizes.borderRadius,
        padding: sizes.padding,
        border: `2px solid ${item.read ? 'transparent' : '#0077B5'}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 150ms',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: sizes.gap, marginBottom: sizes.marginBottom }}>
        <div
          style={{
            width: `${sizes.iconBox}px`,
            height: `${sizes.iconBox}px`,
            borderRadius: '8px',
            backgroundColor: getTypeColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getTypeIcon()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: isNarrow ? '13px' : '14px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
              }}
            >
              {item.title}
            </h3>
            {item.matchScore != null && item.matchScore > 0 && (
              <span
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  borderRadius: '4px',
                  fontSize: isNarrow ? '10px' : '11px',
                  fontWeight: '600',
                  color: '#34C759',
                }}
              >
                {item.matchScore}%
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: isNarrow ? '12px' : '13px',
              color: '#1d1d1f',
              margin: '0 0 8px 0',
              fontWeight: '500',
            }}
          >
            {item.description}
          </p>

          {(item.company != null || item.location != null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {item.company != null && item.company.trim() !== '' && (
                <span style={{ fontSize: isNarrow ? '11px' : '12px', color: '#6e6e73' }}>
                  <Building2 size={isNarrow ? 10 : 12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {item.company}
                </span>
              )}
              {item.location != null && item.location.trim() !== '' && (
                <span style={{ fontSize: isNarrow ? '11px' : '12px', color: '#6e6e73' }}>{item.location}</span>
              )}
            </div>
          )}
        </div>

        {!isNarrow && (
          <button
            onClick={handleToggleRead}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={item.read ? 'Mark as unread' : 'Mark as read'}
          >
            {item.read ? (
              <CheckCircle2 size={14} color="#34C759" />
            ) : (
              <Circle size={14} color="#6e6e73" />
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isNarrow ? '11px' : '12px', color: '#86868b' }}>
          <Clock size={isNarrow ? 10 : 12} />
          {formatTimestamp(item.timestamp)}
        </div>

        {item.actionUrl != null && item.actionUrl.trim() !== '' && (
          <a
            href={item.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: isNarrow ? '12px' : '13px',
              fontWeight: '600',
              color: '#0077B5',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#005885';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0077B5';
            }}
          >
            {item.actionLabel ?? 'View'}
            <ExternalLink size={isNarrow ? 10 : 12} />
          </a>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <TrendingUp size={48} color="#86868b" strokeWidth={1.5} />
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '16px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        No Activity Yet
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#6e6e73',
          margin: '0 0 16px 0',
          maxWidth: '280px',
        }}
      >
        Add companies and people to your watchlist to start tracking job opportunities and updates
      </p>
      <p
        style={{
          fontSize: '12px',
          color: '#8e8e93',
          margin: 0,
        }}
      >
        💡 Tip: M:control+2 / W:alt+2 to open your Watchlist
      </p>
    </div>
  );
}

// Empty Filter State
function EmptyFilterState({ filter }: { filter: FeedFilter }) {
  const getFilterMessage = () => {
    switch (filter) {
      case 'unread':
        return 'All caught up! No unread items.';
      case 'jobs':
        return 'No job alerts yet. Add companies to your watchlist!';
      case 'companies':
        return 'No company updates yet.';
      case 'people':
        return 'No people updates yet.';
      default:
        return 'No items found.';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <Filter size={40} color="#86868b" strokeWidth={1.5} />
      <p
        style={{
          fontSize: '14px',
          color: '#6e6e73',
          margin: '16px 0 0 0',
        }}
      >
        {getFilterMessage()}
      </p>
    </div>
  );
}
