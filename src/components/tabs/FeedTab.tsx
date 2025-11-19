/**
 * Feed Tab - Activity Dashboard
 * Shows job alerts, company updates, and connection activity
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import type { FeedItem, FeedItemType } from '../../types/feed';

type FeedFilter = 'all' | 'jobs' | 'companies' | 'people' | 'unread';

interface FeedTabProps {
  panelWidth?: number;
}

export function FeedTab({ panelWidth = 400 }: FeedTabProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  // Mock feed data - will be replaced with actual hook
  const mockFeedItems: FeedItem[] = [
    {
      id: '1',
      type: 'job_alert',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
      read: false,
      title: 'New Job Match',
      description: 'Senior Product Manager',
      company: 'Google',
      location: 'Mountain View, CA',
      jobUrl: 'https://linkedin.com',
      matchScore: 95,
      actionLabel: 'View Job',
    },
    {
      id: '2',
      type: 'company_update',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      read: false,
      title: 'Company Update',
      description: 'Microsoft posted about their new AI initiative',
      company: 'Microsoft',
      actionLabel: 'See Post',
    },
    {
      id: '3',
      type: 'connection_update',
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      read: true,
      title: 'Connection Update',
      description: 'Sarah Chen started a new position as VP of Engineering at Stripe',
      connectionName: 'Sarah Chen',
      actionLabel: 'View Profile',
    },
  ];

  const feedItems = mockFeedItems;
  const hasItems = feedItems.length > 0;

  // Filter logic
  const filteredItems = feedItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'jobs') return item.type === 'job_alert';
    if (activeFilter === 'companies') return item.type === 'company_update';
    if (activeFilter === 'people')
      return item.type === 'person_update' || item.type === 'connection_update';
    return true;
  });

  const unreadCount = feedItems.filter((item) => !item.read).length;

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
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Activity Feed
          </h2>
          {unreadCount > 0 && (
            <div
              style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(255, 149, 0, 0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#FF9500',
              }}
            >
              {unreadCount} new
            </div>
          )}
        </div>
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: 0,
          }}
        >
          Job alerts, updates, and activity from your watchlist
        </p>
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
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
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
  const isNarrow = panelWidth < 360;
  const fontSize = isNarrow ? '11px' : '12px';
  const padding = isNarrow ? '6px 10px' : '8px 12px';

  const filters: { value: FeedFilter; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { value: 'jobs', label: 'Jobs', icon: <Briefcase size={12} /> },
    { value: 'companies', label: 'Companies', icon: <Building2 size={12} /> },
    { value: 'people', label: 'People', icon: <User size={12} /> },
  ];

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'inline-flex', gap: '6px' }}>
        {filters.map(({ value, label, icon }) => (
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 150ms',
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
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Feed Card Component
interface FeedCardProps {
  item: FeedItem;
}

function FeedCard({ item }: FeedCardProps) {
  const [isRead, setIsRead] = useState(item.read);

  const handleMarkRead = () => {
    setIsRead(true);
    // TODO: Update in storage
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'job_alert':
        return <Briefcase size={16} color="#0077B5" />;
      case 'company_update':
        return <Building2 size={16} color="#FF9500" />;
      case 'connection_update':
      case 'person_update':
        return <User size={16} color="#34C759" />;
      case 'recommendation':
        return <Sparkles size={16} color="#AF52DE" />;
      default:
        return <TrendingUp size={16} color="#6e6e73" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'job_alert':
        return 'rgba(0, 119, 181, 0.1)';
      case 'company_update':
        return 'rgba(255, 149, 0, 0.1)';
      case 'connection_update':
      case 'person_update':
        return 'rgba(52, 199, 89, 0.1)';
      case 'recommendation':
        return 'rgba(175, 82, 222, 0.1)';
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
        borderRadius: '12px',
        padding: '16px',
        border: `2px solid ${isRead ? 'transparent' : '#0077B5'}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 150ms',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
              }}
            >
              {item.title}
            </h3>
            {item.matchScore && (
              <span
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#34C759',
                }}
              >
                {item.matchScore}% match
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: '13px',
              color: '#1d1d1f',
              margin: '0 0 8px 0',
              fontWeight: '500',
            }}
          >
            {item.description}
          </p>

          {(item.company || item.location) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {item.company && (
                <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                  <Building2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {item.company}
                </span>
              )}
              {item.location && (
                <span style={{ fontSize: '12px', color: '#6e6e73' }}>{item.location}</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleMarkRead}
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
          title={isRead ? 'Read' : 'Mark as read'}
        >
          {isRead ? (
            <CheckCircle2 size={16} color="#34C759" />
          ) : (
            <Circle size={16} color="#6e6e73" />
          )}
        </button>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#86868b' }}>
          <Clock size={12} />
          {formatTimestamp(item.timestamp)}
        </div>

        {item.actionUrl && (
          <a
            href={item.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#0077B5',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#005885';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0077B5';
            }}
          >
            {item.actionLabel || 'View'}
            <ExternalLink size={12} />
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
        💡 Tip: Use Alt+2 to open your Watchlist
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
