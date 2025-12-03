/**
 * Engagement Quality Scorer
 * Classifies LinkedIn engagement activities by quality/strength
 *
 * Quality Levels:
 * - STRONG: Deep engagement (long comments, shares with commentary)
 * - MODERATE: Medium engagement (short comments, shares without commentary)
 * - PASSIVE: Low engagement (reactions/likes only)
 */

import type { ActivityEvent } from '@/types/network';

/**
 * Engagement quality classification
 */
export type EngagementQuality = 'strong' | 'moderate' | 'passive';

/**
 * Engagement quality with metadata
 */
export interface EngagementQualityResult {
  quality: EngagementQuality;
  score: number; // 0-1 (higher = stronger engagement)
  reasoning: string;
  factors: {
    activityType: string;
    contentLength?: number;
    hasSubstantiveContent: boolean;
  };
}

/**
 * Quality scoring thresholds
 */
const QUALITY_THRESHOLDS = {
  STRONG_CONTENT_LENGTH: 100, // Characters
  MODERATE_CONTENT_LENGTH: 30,
  SUBSTANTIVE_KEYWORDS: [
    // Words that indicate thoughtful engagement
    'because', 'however', 'although', 'therefore', 'specifically',
    'example', 'experience', 'think', 'believe', 'perspective',
    'insight', 'analysis', 'consider', 'agree', 'disagree',
    'appreciate', 'resonate', 'interesting', 'thought-provoking'
  ]
};

/**
 * Classify engagement quality for a single activity
 */
export function classifyEngagementQuality(
  activity: ActivityEvent
): EngagementQualityResult {
  const activityType = activity.type;
  const content = activity.content || '';
  const contentLength = content.length;

  // Base scores by activity type
  let baseScore = 0;
  let quality: EngagementQuality = 'passive';
  let reasoning = '';

  // REACTION: Always passive (lowest engagement)
  if (activityType === 'reaction') {
    baseScore = 0.2;
    quality = 'passive';
    reasoning = 'Reaction (like) indicates passive engagement';
  }

  // SHARE: Quality depends on whether there's commentary
  else if (activityType === 'share') {
    if (contentLength === 0) {
      baseScore = 0.5;
      quality = 'moderate';
      reasoning = 'Share without commentary indicates moderate engagement';
    } else if (contentLength >= QUALITY_THRESHOLDS.STRONG_CONTENT_LENGTH) {
      baseScore = 0.85;
      quality = 'strong';
      reasoning = 'Share with substantial commentary indicates strong engagement';
    } else {
      baseScore = 0.65;
      quality = 'moderate';
      reasoning = 'Share with brief commentary indicates moderate engagement';
    }
  }

  // COMMENT: Quality depends on length and substance
  else if (activityType === 'comment') {
    const hasSubstantiveKeywords = QUALITY_THRESHOLDS.SUBSTANTIVE_KEYWORDS.some(
      keyword => content.toLowerCase().includes(keyword)
    );

    if (contentLength >= QUALITY_THRESHOLDS.STRONG_CONTENT_LENGTH) {
      baseScore = 0.9;
      quality = 'strong';
      reasoning = 'Long comment (100+ characters) indicates strong engagement';
    } else if (
      contentLength >= QUALITY_THRESHOLDS.MODERATE_CONTENT_LENGTH &&
      hasSubstantiveKeywords
    ) {
      baseScore = 0.75;
      quality = 'strong';
      reasoning = 'Comment with thoughtful content indicates strong engagement';
    } else if (contentLength >= QUALITY_THRESHOLDS.MODERATE_CONTENT_LENGTH) {
      baseScore = 0.6;
      quality = 'moderate';
      reasoning = 'Medium-length comment indicates moderate engagement';
    } else if (contentLength > 0) {
      baseScore = 0.4;
      quality = 'moderate';
      reasoning = 'Short comment indicates moderate engagement';
    } else {
      // Empty comment (shouldn't happen, but handle it)
      baseScore = 0.3;
      quality = 'passive';
      reasoning = 'Empty comment treated as passive engagement';
    }

    // Boost score if contains substantive keywords
    if (hasSubstantiveKeywords && quality !== 'strong') {
      baseScore = Math.min(baseScore + 0.15, 1.0);
      if (baseScore >= 0.65) {
        quality = 'strong';
      }
    }
  }

  // POST: Original content creation (strongest engagement)
  else if (activityType === 'post') {
    if (contentLength >= QUALITY_THRESHOLDS.STRONG_CONTENT_LENGTH) {
      baseScore = 1.0;
      quality = 'strong';
      reasoning = 'Creating original content indicates strongest engagement';
    } else if (contentLength >= QUALITY_THRESHOLDS.MODERATE_CONTENT_LENGTH) {
      baseScore = 0.8;
      quality = 'strong';
      reasoning = 'Creating content indicates strong engagement';
    } else {
      baseScore = 0.6;
      quality = 'moderate';
      reasoning = 'Short post indicates moderate engagement';
    }
  }

  const hasSubstantiveContent = activityType !== 'reaction' && content.length > 0 &&
    QUALITY_THRESHOLDS.SUBSTANTIVE_KEYWORDS.some(kw => content.toLowerCase().includes(kw));

  return {
    quality,
    score: baseScore,
    reasoning,
    factors: {
      activityType,
      contentLength: content.length,
      hasSubstantiveContent
    }
  };
}

/**
 * Calculate aggregate engagement quality for a set of activities
 */
export function calculateAggregateQuality(
  activities: ActivityEvent[]
): {
  overallQuality: EngagementQuality;
  averageScore: number;
  qualityDistribution: {
    strong: number;
    moderate: number;
    passive: number;
  };
  totalActivities: number;
  strongEngagementRate: number; // Percentage of activities that are strong
} {
  if (activities.length === 0) {
    return {
      overallQuality: 'passive',
      averageScore: 0,
      qualityDistribution: { strong: 0, moderate: 0, passive: 0 },
      totalActivities: 0,
      strongEngagementRate: 0
    };
  }

  let totalScore = 0;
  const distribution = { strong: 0, moderate: 0, passive: 0 };

  for (const activity of activities) {
    const result = classifyEngagementQuality(activity);
    totalScore += result.score;
    distribution[result.quality]++;
  }

  const averageScore = totalScore / activities.length;

  // Determine overall quality based on average score
  let overallQuality: EngagementQuality;
  if (averageScore >= 0.65) {
    overallQuality = 'strong';
  } else if (averageScore >= 0.4) {
    overallQuality = 'moderate';
  } else {
    overallQuality = 'passive';
  }

  const strongEngagementRate = (distribution.strong / activities.length) * 100;

  return {
    overallQuality,
    averageScore,
    qualityDistribution: distribution,
    totalActivities: activities.length,
    strongEngagementRate
  };
}

/**
 * Filter activities by minimum quality threshold
 */
export function filterByQuality(
  activities: ActivityEvent[],
  minQuality: EngagementQuality
): ActivityEvent[] {
  const qualityOrder = { passive: 0, moderate: 1, strong: 2 };
  const minQualityLevel = qualityOrder[minQuality];

  return activities.filter(activity => {
    const result = classifyEngagementQuality(activity);
    return qualityOrder[result.quality] >= minQualityLevel;
  });
}

/**
 * Get engagement strength between two users
 * Useful for stepping stone analysis
 */
export function calculateEngagementStrength(
  activities: ActivityEvent[],
  sourceUserId: string,
  targetUserId: string
): {
  strength: number; // 0-1
  quality: EngagementQuality;
  activityCount: number;
  strongActivities: number;
  lastEngagement: string | null;
} {
  // Filter to interactions between these two users
  const relevantActivities = activities.filter(
    activity =>
      (activity.actorId === sourceUserId && activity.targetId === targetUserId) ||
      (activity.actorId === targetUserId && activity.targetId === sourceUserId)
  );

  if (relevantActivities.length === 0) {
    return {
      strength: 0,
      quality: 'passive',
      activityCount: 0,
      strongActivities: 0,
      lastEngagement: null
    };
  }

  const aggregate = calculateAggregateQuality(relevantActivities);

  // Find most recent engagement
  const sorted = [...relevantActivities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastEngagement = sorted[0]?.timestamp || null;

  // Calculate strength based on:
  // - Quality score (60%)
  // - Frequency (number of activities) (20%)
  // - Recency (20%)
  const qualityComponent = aggregate.averageScore * 0.6;

  const frequencyScore = Math.min(relevantActivities.length / 10, 1); // Cap at 10 activities
  const frequencyComponent = frequencyScore * 0.2;

  let recencyComponent = 0;
  if (lastEngagement) {
    const daysSinceLastEngagement =
      (Date.now() - new Date(lastEngagement).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceLastEngagement / 90); // Decay over 90 days
    recencyComponent = recencyScore * 0.2;
  }

  const strength = qualityComponent + frequencyComponent + recencyComponent;

  return {
    strength,
    quality: aggregate.overallQuality,
    activityCount: relevantActivities.length,
    strongActivities: aggregate.qualityDistribution.strong,
    lastEngagement
  };
}

/**
 * Get engagement quality summary as human-readable string
 */
export function getQualitySummary(
  activities: ActivityEvent[]
): string {
  const aggregate = calculateAggregateQuality(activities);

  if (aggregate.totalActivities === 0) {
    return 'No engagement activities';
  }

  const { qualityDistribution, totalActivities, strongEngagementRate } = aggregate;

  const parts: string[] = [];

  if (qualityDistribution.strong > 0) {
    parts.push(`${qualityDistribution.strong} strong`);
  }
  if (qualityDistribution.moderate > 0) {
    parts.push(`${qualityDistribution.moderate} moderate`);
  }
  if (qualityDistribution.passive > 0) {
    parts.push(`${qualityDistribution.passive} passive`);
  }

  const distribution = parts.join(', ');

  return `${totalActivities} engagement${totalActivities > 1 ? 's' : ''} (${distribution}) - ${Math.round(strongEngagementRate)}% strong engagement rate`;
}
