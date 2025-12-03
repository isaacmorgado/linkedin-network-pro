/**
 * Topic-Aware Recommendations Tests
 * Comprehensive tests for content-driven connection strategies
 */

import { describe, it, expect } from 'vitest';
import type { ActivityEvent } from '@/types/network';
import type { ContentTopics } from '../content-topic-analyzer';
import {
  calculateTopicOverlap,
  rankSteppingStonesByTopics,
  generateTopicAwareRecommendation,
  getConnectionStrategySummary
} from '../topic-aware-recommendations';

describe('Topic-Aware Recommendations - Topic Overlap Calculation', () => {
  it('should calculate topic overlap for users with common interests', () => {
    const user1Topics: ContentTopics = {
      topics: [
        { name: 'stoicism', confidence: 0.8, keywords: ['stoic'], count: 3 },
        { name: 'sales', confidence: 0.6, keywords: ['sales'], count: 2 }
      ],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 60], ['sales', 40]]),
      totalActivities: 5
    };

    const user2Topics: ContentTopics = {
      topics: [
        { name: 'stoicism', confidence: 0.7, keywords: ['discipline'], count: 4 },
        { name: 'marketing', confidence: 0.5, keywords: ['marketing'], count: 2 }
      ],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 67], ['marketing', 33]]),
      totalActivities: 6
    };

    const overlap = calculateTopicOverlap(user1Topics, user2Topics);

    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThanOrEqual(1);
  });

  it('should return zero overlap for users with no common topics', () => {
    const user1Topics: ContentTopics = {
      topics: [{ name: 'stoicism', confidence: 0.8, keywords: [], count: 1 }],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 100]]),
      totalActivities: 1
    };

    const user2Topics: ContentTopics = {
      topics: [{ name: 'sales', confidence: 0.8, keywords: [], count: 1 }],
      primaryTopic: 'sales',
      topicFrequency: new Map([['sales', 100]]),
      totalActivities: 1
    };

    const overlap = calculateTopicOverlap(user1Topics, user2Topics);

    expect(overlap).toBe(0);
  });

  it('should handle empty topic lists', () => {
    const emptyTopics: ContentTopics = {
      topics: [],
      primaryTopic: null,
      topicFrequency: new Map(),
      totalActivities: 0
    };

    const user2Topics: ContentTopics = {
      topics: [{ name: 'stoicism', confidence: 0.8, keywords: [], count: 1 }],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 100]]),
      totalActivities: 1
    };

    const overlap = calculateTopicOverlap(emptyTopics, user2Topics);

    expect(overlap).toBe(0);
  });
});

describe('Topic-Aware Recommendations - Stepping Stone Ranking', () => {
  it('should rank stepping stones by topic relevance', () => {
    const targetActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'person-1',
        type: 'comment',
        content: 'Stoic philosophy and discipline are key to success',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'person-2',
        type: 'comment',
        content: 'Marcus Aurelius teachings on virtue',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'john-doe',
        userName: 'John Doe',
        connectionDegree: 1,
        activities: [
          {
            id: '3',
            actorId: 'john-doe',
            targetId: 'alex-hormozi',
            type: 'comment',
            content: 'Great insights on stoicism!',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      },
      {
        userId: 'jane-smith',
        userName: 'Jane Smith',
        connectionDegree: 2,
        activities: [
          {
            id: '4',
            actorId: 'jane-smith',
            targetId: 'alex-hormozi',
            type: 'comment',
            content: 'Sales tactics for closing deals',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const ranked = rankSteppingStonesByTopics(
      steppingStones,
      'alex-hormozi',
      targetActivities,
      []
    );

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].userId).toBe('john-doe'); // Should rank higher due to stoicism overlap
    expect(ranked[0].sharedTopics).toContain('stoicism');
    expect(ranked[0].recommendationScore).toBeGreaterThan(0);
  });

  it('should filter out stepping stones with insufficient topic overlap', () => {
    const targetActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'target',
        targetId: 'person',
        type: 'comment',
        content: 'Stoic philosophy is amazing',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'stone1',
        userName: 'Stone 1',
        connectionDegree: 1,
        activities: [
          {
            id: '2',
            actorId: 'stone1',
            targetId: 'target',
            type: 'comment',
            content: 'AI and machine learning',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const ranked = rankSteppingStonesByTopics(
      steppingStones,
      'target',
      targetActivities,
      [],
      0.5 // High threshold
    );

    expect(ranked.length).toBe(0); // Should filter out due to no topic overlap
  });

  it('should boost 1st-degree connections in ranking', () => {
    const targetActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'target',
        targetId: 'p',
        type: 'comment',
        content: 'Stoicism',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'first-degree',
        userName: 'First Degree',
        connectionDegree: 1,
        activities: [
          {
            id: '2',
            actorId: 'first-degree',
            targetId: 'target',
            type: 'comment',
            content: 'Stoic philosophy',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      },
      {
        userId: 'second-degree',
        userName: 'Second Degree',
        connectionDegree: 2,
        activities: [
          {
            id: '3',
            actorId: 'second-degree',
            targetId: 'target',
            type: 'comment',
            content: 'Stoic discipline',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const ranked = rankSteppingStonesByTopics(
      steppingStones,
      'target',
      targetActivities,
      []
    );

    expect(ranked[0].userId).toBe('first-degree');
    expect(ranked[0].connectionDegree).toBe(1);
    expect(ranked[0].recommendationScore).toBeGreaterThan(ranked[1].recommendationScore);
  });
});

describe('Topic-Aware Recommendations - Full Recommendation Generation', () => {
  it('should generate comprehensive recommendation for Alex Hormozi scenario', () => {
    const sourceActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'person',
        type: 'post',
        content: 'Stoic philosophy helps with discipline',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const targetActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'Discipline is the bridge between goals and accomplishment. Stoicism teaches this.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'Marcus Aurelius had it right about virtue',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'john-doe',
        userName: 'John Doe',
        connectionDegree: 2,
        activities: [
          ...targetActivities,
          {
            id: '4',
            actorId: 'john-doe',
            targetId: 'alex-hormozi',
            type: 'comment',
            content: 'Stoic wisdom is timeless',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'alex-hormozi',
      'Alex Hormozi',
      sourceActivities,
      targetActivities,
      steppingStones
    );

    expect(recommendation.targetUserId).toBe('alex-hormozi');
    expect(recommendation.targetName).toBe('Alex Hormozi');
    expect(recommendation.sharedInterests).toContain('stoicism');
    expect(recommendation.targetContentPreferences).toContain('stoicism');
    expect(recommendation.topSteppingStones.length).toBeGreaterThan(0);
    expect(recommendation.topSteppingStones[0].userId).toBe('john-doe');
    expect(recommendation.personalizedMessage).toContain('John Doe');
    expect(recommendation.personalizedMessage).toContain('stoicism');
    expect(recommendation.confidence).toBeGreaterThan(0);
  });

  it('should handle cold outreach scenario (no stepping stones, no shared topics)', () => {
    const sourceActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'person',
        type: 'post',
        content: 'Sales tactics',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const targetActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'target',
        targetId: 'person',
        type: 'post',
        content: 'AI and machine learning',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'target',
      'Target User',
      sourceActivities,
      targetActivities,
      []
    );

    expect(recommendation.sharedInterests.length).toBe(0);
    expect(recommendation.topSteppingStones.length).toBe(0);
    expect(recommendation.primaryApproach).toContain('Cold outreach');
    expect(recommendation.confidence).toBeLessThan(0.5);
  });

  it('should prioritize stepping stones with high topic overlap', () => {
    const targetActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'target',
        targetId: 'p',
        type: 'post',
        content: 'Stoicism and discipline',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'low-overlap',
        userName: 'Low Overlap',
        connectionDegree: 1,
        activities: [
          {
            id: '2',
            actorId: 'low-overlap',
            targetId: 'target',
            type: 'comment',
            content: 'Sales tactics',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      },
      {
        userId: 'high-overlap',
        userName: 'High Overlap',
        connectionDegree: 2,
        activities: [
          {
            id: '3',
            actorId: 'high-overlap',
            targetId: 'target',
            type: 'comment',
            content: 'Stoic philosophy and discipline are key. Marcus Aurelius teachings.',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'target',
      'Target',
      [],
      targetActivities,
      steppingStones
    );

    expect(recommendation.topSteppingStones[0].userId).toBe('high-overlap');
  });
});

describe('Topic-Aware Recommendations - Connection Messages', () => {
  it('should generate personalized message with stepping stone and shared topics', () => {
    const sourceActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'p',
        type: 'post',
        content: 'Stoicism is great',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const targetActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'target',
        targetId: 'p',
        type: 'post',
        content: 'Stoic philosophy',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'john',
        userName: 'John Doe',
        connectionDegree: 1,
        activities: [
          {
            id: '3',
            actorId: 'john',
            targetId: 'target',
            type: 'comment',
            content: 'Stoic wisdom',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'target',
      'Target User',
      sourceActivities,
      targetActivities,
      steppingStones
    );

    const message = recommendation.personalizedMessage;

    expect(message).toContain('John Doe');
    expect(message).toContain('stoicism');
    expect(message.toLowerCase()).toContain('stoic');
  });

  it('should generate appropriate message for direct connection (no stepping stone)', () => {
    const sourceActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'p',
        type: 'post',
        content: 'AI and machine learning',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const targetActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'target',
        targetId: 'p',
        type: 'post',
        content: 'Deep learning and AI',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'target',
      'Target User',
      sourceActivities,
      targetActivities,
      []
    );

    const message = recommendation.personalizedMessage;

    expect(message).toContain('Target User');
    expect(message.toLowerCase()).toContain('ai');
    expect(message).not.toContain('suggested I reach out'); // No stepping stone
  });
});

describe('Topic-Aware Recommendations - Strategy Summary', () => {
  it('should generate readable strategy summary', () => {
    const sourceActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'p',
        type: 'post',
        content: 'Stoicism',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const targetActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'target',
        targetId: 'p',
        type: 'post',
        content: 'Stoic philosophy',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const steppingStones = [
      {
        userId: 'john',
        userName: 'John Doe',
        connectionDegree: 1,
        activities: [
          {
            id: '3',
            actorId: 'john',
            targetId: 'target',
            type: 'comment',
            content: 'Stoic wisdom',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'target',
      'Target',
      sourceActivities,
      targetActivities,
      steppingStones
    );

    const summary = getConnectionStrategySummary(recommendation);

    expect(summary).toContain('Strategy:');
    expect(summary).toContain('Confidence:');
    expect(summary).toContain('%');
  });
});

describe('Topic-Aware Recommendations - Real-World Scenarios', () => {
  it('should recommend "Connect via shared interest in stoicism" for Alex Hormozi', () => {
    const yourActivities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'you',
        targetId: 'p',
        type: 'post',
        content: 'Stoic discipline is key to success in business',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const alexActivities: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'john',
        type: 'comment',
        content: 'Discipline is the bridge. Marcus Aurelius knew this.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'jane',
        type: 'comment',
        content: 'Stoic philosophy applied to modern business',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const johnSteppingStone = [
      {
        userId: 'john-doe',
        userName: 'John Doe',
        connectionDegree: 2,
        activities: [
          ...alexActivities,
          {
            id: '4',
            actorId: 'john-doe',
            targetId: 'alex-hormozi',
            type: 'share',
            content: 'Stoic wisdom for entrepreneurs',
            timestamp: new Date().toISOString(),
            scrapedAt: new Date().toISOString()
          }
        ] as ActivityEvent[]
      }
    ];

    const recommendation = generateTopicAwareRecommendation(
      'you',
      'alex-hormozi',
      'Alex Hormozi',
      yourActivities,
      alexActivities,
      johnSteppingStone
    );

    // Verify business intelligence
    expect(recommendation.sharedInterests).toContain('stoicism');
    expect(recommendation.targetContentPreferences).toContain('stoicism');
    expect(recommendation.topSteppingStones[0].sharedTopics).toContain('stoicism');

    // Verify message personalization
    expect(recommendation.personalizedMessage).toContain('stoicism');
    expect(recommendation.personalizedMessage).toContain('John Doe');

    // Verify strategy
    expect(recommendation.primaryApproach.toLowerCase()).toContain('stoicism');
    expect(recommendation.confidence).toBeGreaterThan(0.5);

    const summary = getConnectionStrategySummary(recommendation);
    expect(summary.toLowerCase()).toContain('stoicism');
  });
});
