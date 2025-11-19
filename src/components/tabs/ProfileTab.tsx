/**
 * Profile Actions Tab
 * Shown only on LinkedIn person profile pages
 *
 * Features:
 * 1. Find Best Route - Calculate shortest connection path
 * 2. Generate Connection Message - AI-powered personalized intro
 * 3. Add to Watchlist - Save person for tracking
 */

import React, { useState } from 'react';
import { GitBranch, MessageSquare, BookmarkPlus, User, Briefcase, Loader2 } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';

export function ProfileTab() {
  const pageContext = usePageContext();
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  // Extract profile data from context
  const profileData = pageContext.profileData;
  const name = profileData?.name || 'Unknown Person';
  const headline = profileData?.headline || '';

  const handleFindRoute = async () => {
    setIsLoadingRoute(true);
    // TODO: Implement pathfinding algorithm
    setTimeout(() => {
      setIsLoadingRoute(false);
      console.log('Finding route to', name);
    }, 1500);
  };

  const handleGenerateMessage = async () => {
    setIsLoadingMessage(true);
    // TODO: Implement AI message generation
    setTimeout(() => {
      setIsLoadingMessage(false);
      console.log('Generating message for', name);
    }, 2000);
  };

  const handleAddToWatchlist = async () => {
    setIsAddingToWatchlist(true);
    // TODO: Implement watchlist storage
    setTimeout(() => {
      setIsAddingToWatchlist(false);
      console.log('Added to watchlist:', name);
    }, 1000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Profile Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 119, 181, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
            }}
          >
            <User size={24} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 4px 0',
                color: '#1d1d1f',
              }}
            >
              {name}
            </h2>
            {headline && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#6e6e73',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Briefcase size={14} />
                {headline.length > 60 ? headline.slice(0, 60) + '...' : headline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Find Best Route Card */}
        <ActionCard
          icon={GitBranch}
          title="Find Best Route"
          description="See the shortest connection path to reach this person"
          buttonText={isLoadingRoute ? 'Finding...' : 'Calculate Route'}
          buttonColor="#0077B5"
          isLoading={isLoadingRoute}
          onClick={handleFindRoute}
        />

        {/* Generate Connection Message Card */}
        <ActionCard
          icon={MessageSquare}
          title="Generate Connection Message"
          description="AI-powered personalized introduction message"
          buttonText={isLoadingMessage ? 'Generating...' : 'Generate Message'}
          buttonColor="#30D158"
          isLoading={isLoadingMessage}
          onClick={handleGenerateMessage}
        />

        {/* Add to Watchlist Card */}
        <ActionCard
          icon={BookmarkPlus}
          title="Add to Watchlist"
          description="Track this person's activity and connection status"
          buttonText={isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
          buttonColor="#FF9500"
          isLoading={isAddingToWatchlist}
          onClick={handleAddToWatchlist}
        />
      </div>

      {/* Help Text */}
      <div
        style={{
          padding: '20px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#8e8e93',
            margin: 0,
            textAlign: 'center',
          }}
        >
          💡 Tip: Use Alt+7 to quickly access Profile Actions
        </p>
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  isLoading: boolean;
  onClick: () => void;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor,
  isLoading,
  onClick,
}: ActionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: `${buttonColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={buttonColor} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: '#6e6e73',
              margin: 0,
              lineHeight: '1.4',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: isLoading ? '#8e8e93' : buttonColor,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isLoading && (
          <Loader2
            size={16}
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {buttonText}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </button>
    </div>
  );
}
