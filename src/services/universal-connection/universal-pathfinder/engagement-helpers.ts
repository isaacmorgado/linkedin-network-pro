/**
 * Engagement Bridge Strategy Helpers
 * Utility functions for engagement data processing
 */

import type { UserProfile } from '@/types/resume-tailoring';
import type { EngagedPerson, Graph } from '../universal-connection-types';

/**
 * Get engaged posts from target's LinkedIn profile
 * Extracts people target engages WITH
 */
export async function getEngagedPosts(_targetUser: UserProfile): Promise<Array<{
  authorId: string;
  authorName: string;
  topic: string;
  timestamp: string;
  engagementType: string;
}>> {
  try {
    // Note: UserProfile doesn't have engagedPosts property
    // This data would need to be fetched separately from the database
    // For now, return empty array

    console.log('[EngagementBridge] No engagedPosts data in target profile');
    return [];
  } catch (error) {
    console.error('[EngagementBridge] Error getting engaged posts:', error);
    return [];
  }
}

/**
 * Merge inbound and outbound engagement into unified EngagedPerson array
 */
export function mergeEngagementDirections(
  inboundActivities: any[],
  outboundEngagement: any[]
): EngagedPerson[] {
  const engagementMap = new Map<string, {
    personId: string;
    personName: string;
    inboundCount: number;
    outboundCount: number;
    lastEngaged: Date;
    types: Set<string>;
  }>();

  // Process INBOUND (people who engage WITH target)
  for (const activity of inboundActivities) {
    const existing = engagementMap.get(activity.actorId);
    if (existing) {
      existing.inboundCount++;
      existing.types.add(activity.type);
      const activityDate = new Date(activity.timestamp);
      if (activityDate > existing.lastEngaged) {
        existing.lastEngaged = activityDate;
      }
    } else {
      engagementMap.set(activity.actorId, {
        personId: activity.actorId,
        personName: '',
        inboundCount: 1,
        outboundCount: 0,
        lastEngaged: new Date(activity.timestamp),
        types: new Set([activity.type]),
      });
    }
  }

  // Process OUTBOUND (people target engages WITH)
  for (const engagement of outboundEngagement) {
    const existing = engagementMap.get(engagement.authorId);
    if (existing) {
      existing.outboundCount++;
      if (engagement.engagementType) {
        existing.types.add(engagement.engagementType);
      }
      const engagementDate = new Date(engagement.timestamp);
      if (engagementDate > existing.lastEngaged) {
        existing.lastEngaged = engagementDate;
      }
    } else {
      engagementMap.set(engagement.authorId, {
        personId: engagement.authorId,
        personName: engagement.authorName || '',
        inboundCount: 0,
        outboundCount: 1,
        lastEngaged: new Date(engagement.timestamp),
        types: new Set(engagement.engagementType ? [engagement.engagementType] : []),
      });
    }
  }

  // Convert to EngagedPerson array
  const engagedPeople: EngagedPerson[] = [];

  for (const [_personId, data] of engagementMap.entries()) {
// @ts-expect-error - Calculated for potential future metrics
    const __totalCount = data.inboundCount + data.outboundCount;
    const isBidirectional = data.inboundCount > 0 && data.outboundCount > 0;

    // Calculate engagement strength (0-1)
    const recencyDays = (Date.now() - data.lastEngaged.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (recencyDays / 90));
    const varietyScore = data.types.size / 3;
    const bidirectionalBonus = isBidirectional ? 0.2 : 0;

    // Weight outbound higher (target's choice to engage)
    const outboundWeight = 0.6;
    const inboundWeight = 0.4;
    const weightedCount = (data.outboundCount * outboundWeight) + (data.inboundCount * inboundWeight);
    const weightedCountScore = Math.min(weightedCount / 10, 1);

    const engagementStrength = Math.min(
      (weightedCountScore * 0.4) + (recencyScore * 0.3) + (varietyScore * 0.2) + bidirectionalBonus,
      1.0
    );

    engagedPeople.push({
      personId: data.personId,
      personName: data.personName,
      inboundCount: data.inboundCount,
      outboundCount: data.outboundCount,
      isBidirectional,
      lastEngaged: data.lastEngaged,
      engagementTypes: data.types,
      engagementStrength,
    });
  }

  // Sort by engagement strength (highest first)
  engagedPeople.sort((a, b) => b.engagementStrength - a.engagementStrength);

  return engagedPeople;
}

/**
 * Calculate basic bridge quality without full profile scraping
 */
export async function calculateBridgeQualityBasic(
  _sourceUser: UserProfile,
  steppingStone: any,
  _targetUser: UserProfile
): Promise<any> {
  try {
    // Basic similarity calculation
    const userToStone = 0.6;
    const stoneToTarget = 0.7;
    const geometricMean = Math.sqrt(userToStone * stoneToTarget);

    // Network proximity multiplier
    const proximityMultiplier =
      steppingStone.connectionDegree === 1 ? 1.2 :
      steppingStone.connectionDegree === 2 ? 1.1 :
      1.0;

    // Engagement multiplier
    const engagementMultiplier = 1 + (steppingStone.person.engagementStrength * 0.1);

    const overallBridgeQuality = Math.min(
      geometricMean * proximityMultiplier * engagementMultiplier,
      1.0
    );

    // Estimate acceptance rate
    const baseAcceptance = 0.28;
    const qualityBonus = overallBridgeQuality * 0.12;
    const degreeBonus = steppingStone.connectionDegree === 1 ? 0.08 : 0;

    const estimatedAcceptanceRate = Math.min(
      baseAcceptance + qualityBonus + degreeBonus,
      0.48
    );

    return {
      userToStone,
      stoneToTarget,
      overallBridgeQuality,
      sharedInterests: [],
      connectionDegree: steppingStone.connectionDegree,
      engagementFrequency: steppingStone.person.engagementStrength,
      bestAngle: 'Shared professional network',
      estimatedAcceptanceRate,
    };
  } catch (error) {
    console.error('[EngagementBridge] Error calculating bridge quality:', error);
    return {
      userToStone: 0.5,
      stoneToTarget: 0.5,
      overallBridgeQuality: 0.5,
      sharedInterests: [],
      connectionDegree: steppingStone.connectionDegree,
      engagementFrequency: 0.5,
      bestAngle: 'Professional networking',
      estimatedAcceptanceRate: 0.25,
    };
  }
}

/**
 * Helper to find node ID in graph with fallback matching
 */
export function findNodeIdInGraph(graph: Graph, user: UserProfile): string | null {
  // Try LinkedIn ID first
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  // Try email
  if (user.email) {
    const node = graph.getNode?.(user.email);
    if (node) return user.email;
  }

  // Try user ID
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  return null;
}
