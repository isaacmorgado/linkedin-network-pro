/**
 * Connection Sampling
 * Efficiently samples large connection lists for performance
 *
 * Strategy:
 * - If ≤ maxConnections: return all
 * - If > maxConnections: take 50% most recent + 50% most active
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionSample } from './types';

/**
 * Sample connections for performance
 *
 * Strategy:
 * - If ≤ maxConnections: return all
 * - If > maxConnections: take 50% most recent + 50% most active
 *
 * @param connections Full list of connections
 * @param maxConnections Maximum connections to sample (default: 500)
 * @returns ConnectionSample with sampled connections and metadata
 */
export function sampleConnections(
  connections: UserProfile[],
  maxConnections: number = 500
): ConnectionSample {
  if (connections.length <= maxConnections) {
    return {
      sampled: connections,
      strategy: 'all',
      originalCount: connections.length,
      sampledCount: connections.length,
    };
  }

  const halfSize = Math.floor(maxConnections / 2);

  // Sort by connection date (most recent first)
  // Note: connectionDate is a metadata field we'd need to add to UserProfile
  const byRecent = [...connections].sort((_a, _b) => {
    // If connectionDate is available, use it
    // Otherwise, use a heuristic (e.g., more recent work experience)
    return 0; // Placeholder - would need actual dates
  });

  // Sort by activity score (most active first)
  // Note: activityScore is a metadata field we'd need to add to UserProfile
  const byActive = [...connections].sort((_a, _b) => {
    // If activityScore is available, use it
    // Otherwise, default to 0
    return 0; // Placeholder - would need actual scores
  });

  // Combine: 50% most recent + 50% most active
  const recentSet = new Set(byRecent.slice(0, halfSize).map((c) => c.email || c.name));
  const sampled = [
    ...byRecent.slice(0, halfSize),
    ...byActive.slice(0, halfSize).filter((c) => !recentSet.has(c.email || c.name)),
  ];

  return {
    sampled: sampled.slice(0, maxConnections),
    strategy: 'mixed',
    originalCount: connections.length,
    sampledCount: Math.min(sampled.length, maxConnections),
  };
}
