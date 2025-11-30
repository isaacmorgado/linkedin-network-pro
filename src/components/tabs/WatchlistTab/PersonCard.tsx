/**
 * Person Card Component
 * Displays a person from the watchlist
 */

import { useState } from 'react';
import { User, Briefcase, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import type { WatchlistPerson } from '../../../types/watchlist';

interface PersonCardProps {
  person: WatchlistPerson;
  onRemove: () => void;
  onViewProfile: () => void;
  isRemoving: boolean;
}

export function PersonCard({ person, onRemove, onViewProfile, isRemoving }: PersonCardProps) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Profile Image or Fallback */}
        {person.profileImage ? (
          <img
            src={person.profileImage}
            alt={person.name}
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
            {person.name}
          </h3>
          {person.headline && (
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
              <span style={{ flex: 1 }}>{person.headline}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
      </div>
    </div>
  );
}
