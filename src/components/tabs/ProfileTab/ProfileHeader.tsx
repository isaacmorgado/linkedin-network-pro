/**
 * Profile Header Component
 * Displays profile image, name, and headline
 */

import { User, Briefcase } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  headline: string;
  profileImage?: string;
}

export function ProfileHeader({ name, headline, profileImage }: ProfileHeaderProps) {
  return (
    <div
      style={{
        padding: '20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(0, 119, 181, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        {/* Profile Image or Fallback Icon */}
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0, 119, 181, 0.2)',
              flexShrink: 0,
            }}
            onError={(e) => {
              // If image fails to load, hide it and show fallback
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            <User size={28} strokeWidth={2} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 6px 0',
              color: '#1d1d1f',
              wordBreak: 'break-word',
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
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              <Briefcase size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{headline}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
