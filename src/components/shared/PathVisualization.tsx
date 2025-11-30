/**
 * Path Visualization Component (Shared)
 * Reusable component for displaying connection paths
 * Used by ConnectionPathView, CompanyExplorer, and other features
 */

import { ArrowRight, User } from 'lucide-react';
import type { NetworkNode } from '../../services/universal-connection/universal-connection-types';

interface PathVisualizationProps {
  path: NetworkNode[];
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  highlightTarget?: boolean;
}

export function PathVisualization({
  path,
  size = 'medium',
  showLabels = true,
  highlightTarget = true
}: PathVisualizationProps) {
  // Size configurations
  const sizes = {
    small: { nodeSize: 40, iconSize: 16, fontSize: 11, gap: 8, arrowSize: 16 },
    medium: { nodeSize: 56, iconSize: 20, fontSize: 12, gap: 12, arrowSize: 20 },
    large: { nodeSize: 64, iconSize: 24, fontSize: 13, gap: 16, arrowSize: 24 },
  };

  const config = sizes[size];

  if (!path || path.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#6e6e73',
          fontSize: '14px',
        }}
      >
        No path available
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${config.gap}px`,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {path.map((node, index) => (
        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: `${config.gap}px` }}>
          {/* Node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* Profile Image or Avatar */}
            <div
              style={{
                width: `${config.nodeSize}px`,
                height: `${config.nodeSize}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: index === path.length - 1 && highlightTarget
                  ? '3px solid #0077B5'
                  : '2px solid rgba(0, 119, 181, 0.3)',
                boxShadow: index === path.length - 1 && highlightTarget
                  ? '0 0 0 3px rgba(0, 119, 181, 0.1)'
                  : 'none',
                transition: 'all 200ms',
              }}
            >
              {node.profileImage ? (
                <img
                  src={node.profileImage}
                  alt={node.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: index === 0
                      ? 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)'
                      : index === path.length - 1
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: `${config.fontSize + 4}px`,
                    fontWeight: 'bold',
                  }}
                >
                  {node.profileImage === undefined ? (
                    <User size={config.iconSize} strokeWidth={2} />
                  ) : (
                    node.name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
            </div>

            {/* Label */}
            {showLabels && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  maxWidth: '100px',
                }}
              >
                <span
                  style={{
                    fontSize: `${config.fontSize}px`,
                    fontWeight: '600',
                    color: '#1d1d1f',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: '1.3',
                  }}
                >
                  {index === 0 ? 'You' : index === path.length - 1 ? node.name : getShortName(node.name)}
                </span>

                {/* Connection Degree Badge */}
                {index > 0 && node.connectionDegree !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: getDegreeBadgeColor(node.connectionDegree),
                      backgroundColor: getDegreeBadgeBackground(node.connectionDegree),
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {node.connectionDegree === 1 ? '1st' : node.connectionDegree === 2 ? '2nd' : '3rd'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow */}
          {index < path.length - 1 && (
            <ArrowRight
              size={config.arrowSize}
              color="#0077B5"
              strokeWidth={2}
              style={{
                flexShrink: 0,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Get short version of name (first name only for intermediaries)
 */
function getShortName(fullName: string): string {
  const parts = fullName.split(' ');
  return parts[0];
}

/**
 * Get badge color for connection degree
 */
function getDegreeBadgeColor(degree: number): string {
  if (degree === 1) return '#10B981';
  if (degree === 2) return '#3B82F6';
  return '#F59E0B';
}

/**
 * Get badge background for connection degree
 */
function getDegreeBadgeBackground(degree: number): string {
  if (degree === 1) return 'rgba(16, 185, 129, 0.1)';
  if (degree === 2) return 'rgba(59, 130, 246, 0.1)';
  return 'rgba(245, 158, 11, 0.1)';
}
