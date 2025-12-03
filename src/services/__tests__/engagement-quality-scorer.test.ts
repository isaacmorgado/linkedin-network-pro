/**
 * Engagement Quality Scorer Tests
 * Comprehensive tests ensuring accurate quality classification
 */

import { describe, it, expect } from 'vitest';
import type { ActivityEvent } from '@/types/network';
import {
  classifyEngagementQuality,
  calculateAggregateQuality,
  filterByQuality,
  calculateEngagementStrength,
  getQualitySummary
} from '../engagement-quality-scorer';

describe('Engagement Quality Scorer - Reactions (Passive)', () => {
  it('should classify reactions as passive', () => {
    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'reaction',
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('passive');
    expect(result.score).toBeLessThan(0.3);
    expect(result.reasoning).toContain('passive');
  });
});

describe('Engagement Quality Scorer - Comments', () => {
  it('should classify long comments (100+ chars) as strong', () => {
    const longComment = 'This is an incredibly thoughtful post. I especially appreciate your point about discipline being the bridge between goals and accomplishment. In my experience working with hundreds of entrepreneurs, this resonates deeply.';

    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'comment',
      content: longComment,
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(0.65);
    expect(result.factors.contentLength).toBeGreaterThan(100);
  });

  it('should classify medium comments (30-100 chars) as moderate', () => {
    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'comment',
      content: 'This is a great point about sales!',
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('moderate');
    expect(result.score).toBeGreaterThan(0.4);
    expect(result.score).toBeLessThan(0.65);
  });

  it('should classify short comments (<30 chars) as moderate', () => {
    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'comment',
      content: 'Great post!',
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('moderate');
    expect(result.factors.contentLength).toBeLessThan(30);
  });

  it('should boost quality for substantive keywords', () => {
    const substantiveComment = 'I agree because this perspective is interesting';

    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'comment',
      content: substantiveComment,
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.factors.hasSubstantiveContent).toBe(true);
    // Should be boosted to strong due to thoughtful keywords
    expect(result.quality).toBe('strong');
  });
});

describe('Engagement Quality Scorer - Shares', () => {
  it('should classify share without commentary as moderate', () => {
    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'share',
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('moderate');
    expect(result.score).toBeGreaterThan(0.4);
    expect(result.score).toBeLessThan(0.65);
  });

  it('should classify share with substantial commentary as strong', () => {
    const commentary = 'This article brilliantly captures the essence of stoic philosophy. Marcus Aurelius would approve. I highly recommend reading this if you want to understand discipline and virtue at a deeper level.';

    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'share',
      content: commentary,
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(0.65);
  });

  it('should classify share with brief commentary as moderate', () => {
    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'target',
      type: 'share',
      content: 'Great read!',
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('moderate');
  });
});

describe('Engagement Quality Scorer - Posts', () => {
  it('should classify original posts as strong', () => {
    const postContent = 'Discipline is the bridge between goals and accomplishment. This is a principle I learned from studying stoic philosophy and applying it to business.';

    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'user',
      type: 'post',
      content: postContent,
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(0.65);
  });

  it('should give highest score to long original posts', () => {
    const longPost = 'A'.repeat(150);

    const activity: ActivityEvent = {
      id: '1',
      actorId: 'user',
      targetId: 'user',
      type: 'post',
      content: longPost,
      timestamp: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };

    const result = classifyEngagementQuality(activity);

    expect(result.quality).toBe('strong');
    expect(result.score).toBe(1.0);
  });
});

describe('Engagement Quality Scorer - Aggregate Quality', () => {
  it('should calculate aggregate quality for mixed activities', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'This is a thoughtful comment with substantial analysis because I think this perspective is interesting',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'reaction',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'user',
        targetId: 'target',
        type: 'share',
        content: 'Great article!',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = calculateAggregateQuality(activities);

    expect(result.totalActivities).toBe(3);
    expect(result.qualityDistribution.strong).toBeGreaterThan(0);
    expect(result.qualityDistribution.moderate).toBeGreaterThan(0);
    expect(result.qualityDistribution.passive).toBeGreaterThan(0);
    expect(result.averageScore).toBeGreaterThan(0);
    expect(result.strongEngagementRate).toBeGreaterThan(0);
  });

  it('should classify overall quality based on average score', () => {
    const strongActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'A'.repeat(150),
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'B'.repeat(150),
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = calculateAggregateQuality(strongActivities);

    expect(result.overallQuality).toBe('strong');
    expect(result.averageScore).toBeGreaterThanOrEqual(0.65);
  });

  it('should handle empty activity list', () => {
    const result = calculateAggregateQuality([]);

    expect(result.overallQuality).toBe('passive');
    expect(result.averageScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.strongEngagementRate).toBe(0);
  });
});

describe('Engagement Quality Scorer - Filtering', () => {
  it('should filter activities by minimum quality', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'A'.repeat(150), // Strong
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'Short', // Moderate
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'user',
        targetId: 'target',
        type: 'reaction', // Passive
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const strongOnly = filterByQuality(activities, 'strong');
    const moderateAndUp = filterByQuality(activities, 'moderate');

    expect(strongOnly.length).toBe(1);
    expect(moderateAndUp.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Engagement Quality Scorer - Engagement Strength', () => {
  it('should calculate engagement strength between two users', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'Great insights on discipline!',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'I agree with this perspective because it resonates with stoic philosophy',
        timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'share',
        content: 'Everyone should read this',
        timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = calculateEngagementStrength(
      activities,
      'alex-hormozi',
      'john-doe'
    );

    expect(result.activityCount).toBe(3);
    expect(result.strongActivities).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
    expect(result.quality).toBe('strong');
    expect(result.lastEngagement).toBe('2024-01-15T10:00:00.000Z');
  });

  it('should return zero strength for no interactions', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user1',
        targetId: 'user2',
        type: 'comment',
        content: 'Test',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = calculateEngagementStrength(activities, 'user3', 'user4');

    expect(result.strength).toBe(0);
    expect(result.activityCount).toBe(0);
    expect(result.lastEngagement).toBeNull();
  });

  it('should account for recency in strength calculation', () => {
    const recentActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user1',
        targetId: 'user2',
        type: 'comment',
        content: 'A'.repeat(150),
        timestamp: new Date().toISOString(), // Today
        scrapedAt: new Date().toISOString()
      }
    ];

    const oldActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'user1',
        targetId: 'user2',
        type: 'comment',
        content: 'A'.repeat(150),
        timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
        scrapedAt: new Date().toISOString()
      }
    ];

    const recentStrength = calculateEngagementStrength(recentActivities, 'user1', 'user2');
    const oldStrength = calculateEngagementStrength(oldActivities, 'user1', 'user2');

    expect(recentStrength.strength).toBeGreaterThan(oldStrength.strength);
  });
});

describe('Engagement Quality Scorer - Quality Summary', () => {
  it('should generate human-readable summary', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'A'.repeat(150),
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'Short',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'user',
        targetId: 'target',
        type: 'reaction',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const summary = getQualitySummary(activities);

    expect(summary).toContain('3 engagement');
    expect(summary).toContain('strong');
    expect(summary).toContain('moderate');
    expect(summary).toContain('passive');
  });

  it('should handle empty list gracefully', () => {
    const summary = getQualitySummary([]);

    expect(summary).toBe('No engagement activities');
  });
});

describe('Engagement Quality Scorer - Real-World Scenarios', () => {
  it('should identify high-quality engagement pattern (Alex Hormozi scenario)', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'Discipline is the bridge between goals and accomplishment. This resonates deeply with my experience building multiple 8-figure businesses.',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'jane-smith',
        type: 'share',
        content: 'Everyone in business should read this. Marcus Aurelius teachings apply directly to modern entrepreneurship.',
        timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'bob-jones',
        type: 'comment',
        content: 'I appreciate this perspective because it aligns with stoic philosophy',
        timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const aggregate = calculateAggregateQuality(activities);

    expect(aggregate.overallQuality).toBe('strong');
    expect(aggregate.strongEngagementRate).toBe(100); // All strong
    expect(aggregate.qualityDistribution.strong).toBe(3);
    expect(aggregate.qualityDistribution.moderate).toBe(0);
    expect(aggregate.qualityDistribution.passive).toBe(0);

    const summary = getQualitySummary(activities);
    expect(summary).toContain('100% strong engagement rate');
  });

  it('should identify weak engagement pattern (mostly reactions)', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target1',
        type: 'reaction',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target2',
        type: 'reaction',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'user',
        targetId: 'target3',
        type: 'comment',
        content: 'Cool',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const aggregate = calculateAggregateQuality(activities);

    expect(aggregate.overallQuality).toBe('passive');
    expect(aggregate.strongEngagementRate).toBe(0);
    expect(aggregate.qualityDistribution.passive).toBeGreaterThan(0);
  });
});
