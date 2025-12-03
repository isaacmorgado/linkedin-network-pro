/**
 * Content Topic Analyzer Tests
 * Comprehensive tests ensuring bulletproof topic detection and analysis
 */

import { describe, it, expect } from 'vitest';
import type { ActivityEvent } from '@/types/network';
import {
  analyzeContentTopics,
  analyzeUserTopics,
  findCommonTopics,
  getTopicSummary,
  type ContentTopics
} from '../content-topic-analyzer';

describe('Content Topic Analyzer - Stoicism Detection', () => {
  it('should identify stoicism as primary topic from multiple posts', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'john-doe',
        type: 'comment',
        content: 'Discipline is the bridge between goals and accomplishment. Stoic philosophy teaches this.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'jane-smith',
        type: 'comment',
        content: 'Marcus Aurelius had it right about virtue and character.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'bob-jones',
        type: 'post',
        content: 'The obstacle is the way - ancient stoic wisdom for modern times.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);

    expect(result.primaryTopic).toBe('stoicism');
    expect(result.topics.length).toBeGreaterThan(0);

    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');
    expect(stoicismTopic).toBeDefined();
    expect(stoicismTopic?.count).toBe(3);
    expect(stoicismTopic?.keywords).toContain('stoic');
    expect(stoicismTopic?.keywords).toContain('marcus aurelius');
    expect(stoicismTopic?.confidence).toBeGreaterThan(0);
  });

  it('should detect stoicism keywords accurately', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'Seneca and Epictetus both emphasized control what you can control',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');

    expect(stoicismTopic).toBeDefined();
    expect(stoicismTopic?.keywords).toContain('seneca');
    expect(stoicismTopic?.keywords).toContain('epictetus');
  });

  it('should calculate topic frequency correctly', () => {
    const activities: ActivityEvent[] = [
      { id: '1', actorId: 'user', targetId: 't', type: 'post', content: 'Stoic philosophy is timeless', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '2', actorId: 'user', targetId: 't', type: 'post', content: 'Sales techniques for closing deals', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '3', actorId: 'user', targetId: 't', type: 'post', content: 'Discipline and virtue from stoicism', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '4', actorId: 'user', targetId: 't', type: 'post', content: 'Marcus Aurelius meditations', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() }
    ];

    const result = analyzeContentTopics(activities);

    const stoicismFreq = result.topicFrequency.get('stoicism');
    const salesFreq = result.topicFrequency.get('sales');

    expect(stoicismFreq).toBe(75); // 3/4 posts
    expect(salesFreq).toBe(25);    // 1/4 posts
  });
});

describe('Content Topic Analyzer - Multi-Topic Detection', () => {
  it('should detect multiple topics in same content', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'Using stoic discipline to improve sales performance and close more deals',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);

    const topicNames = result.topics.map(t => t.name);
    expect(topicNames).toContain('stoicism');
    expect(topicNames).toContain('sales');
  });

  it('should rank topics by frequency', () => {
    const activities: ActivityEvent[] = [
      { id: '1', actorId: 'u', targetId: 't', type: 'post', content: 'AI and machine learning are transforming business', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '2', actorId: 'u', targetId: 't', type: 'post', content: 'Deep learning models for NLP', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '3', actorId: 'u', targetId: 't', type: 'post', content: 'GPT and large language models', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '4', actorId: 'u', targetId: 't', type: 'post', content: 'Sales pipeline optimization', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() }
    ];

    const result = analyzeContentTopics(activities);

    expect(result.topics[0].name).toBe('ai-ml'); // Most frequent
    expect(result.topics[0].count).toBe(3);
  });
});

describe('Content Topic Analyzer - Sales Detection', () => {
  it('should identify sales topic from keywords', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'Best sales techniques for closing deals and handling objections in the pipeline',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const salesTopic = result.topics.find(t => t.name === 'sales');

    expect(salesTopic).toBeDefined();
    expect(salesTopic?.keywords).toContain('sales');
    expect(salesTopic?.keywords).toContain('closing');
    expect(salesTopic?.keywords).toContain('deals');
  });
});

describe('Content Topic Analyzer - AI/ML Detection', () => {
  it('should identify AI and machine learning topics', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'ChatGPT and large language model technology are revolutionizing AI. Deep learning with neural networks.',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const aiTopic = result.topics.find(t => t.name === 'ai-ml');

    expect(aiTopic).toBeDefined();
    expect(aiTopic?.keywords).toContain('chatgpt');
    expect(aiTopic?.keywords).toContain('large language model');
    expect(aiTopic?.keywords).toContain('deep learning');
    expect(aiTopic?.confidence).toBeGreaterThan(0);
  });
});

describe('Content Topic Analyzer - User-Specific Analysis', () => {
  it('should filter activities by user', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'john',
        type: 'comment',
        content: 'Stoic philosophy and discipline',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'other-user',
        targetId: 'jane',
        type: 'comment',
        content: 'Sales and marketing strategies',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'bob',
        type: 'post',
        content: 'Marcus Aurelius teachings',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeUserTopics('alex-hormozi', activities);

    expect(result.totalActivities).toBe(2); // Only Alex's activities
    expect(result.primaryTopic).toBe('stoicism');
  });
});

describe('Content Topic Analyzer - Common Topics', () => {
  it('should find common topics between two users', () => {
    const user1Activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user1',
        targetId: 't',
        type: 'post',
        content: 'Stoic philosophy and discipline are key',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user1',
        targetId: 't',
        type: 'post',
        content: 'Sales strategies for growth',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const user2Activities: ActivityEvent[] = [
      {
        id: '3',
        actorId: 'user2',
        targetId: 't',
        type: 'post',
        content: 'Marcus Aurelius and stoic wisdom',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '4',
        actorId: 'user2',
        targetId: 't',
        type: 'post',
        content: 'Marketing and branding tips',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const user1Topics = analyzeContentTopics(user1Activities);
    const user2Topics = analyzeContentTopics(user2Activities);

    const commonTopics = findCommonTopics(user1Topics, user2Topics);

    expect(commonTopics.length).toBeGreaterThan(0);
    expect(commonTopics[0].topic).toBe('stoicism');
    expect(commonTopics[0].user1Frequency).toBeGreaterThan(0);
    expect(commonTopics[0].user2Frequency).toBeGreaterThan(0);
  });

  it('should filter by minimum confidence', () => {
    const user1Topics: ContentTopics = {
      topics: [
        { name: 'stoicism', confidence: 0.8, keywords: ['stoic'], count: 3 },
        { name: 'sales', confidence: 0.2, keywords: ['sales'], count: 1 }
      ],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 75], ['sales', 25]]),
      totalActivities: 4
    };

    const user2Topics: ContentTopics = {
      topics: [
        { name: 'stoicism', confidence: 0.7, keywords: ['discipline'], count: 2 },
        { name: 'sales', confidence: 0.3, keywords: ['deals'], count: 1 }
      ],
      primaryTopic: 'stoicism',
      topicFrequency: new Map([['stoicism', 67], ['sales', 33]]),
      totalActivities: 3
    };

    const commonTopics = findCommonTopics(user1Topics, user2Topics, 0.5);

    // Only stoicism should pass (0.8 and 0.7), sales fails (0.2 and 0.3)
    expect(commonTopics.length).toBe(1);
    expect(commonTopics[0].topic).toBe('stoicism');
  });
});

describe('Content Topic Analyzer - Edge Cases', () => {
  it('should handle empty activity list', () => {
    const activities: ActivityEvent[] = [];
    const result = analyzeContentTopics(activities);

    expect(result.topics).toEqual([]);
    expect(result.primaryTopic).toBeNull();
    expect(result.totalActivities).toBe(0);
  });

  it('should handle activities without content', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'reaction',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);

    expect(result.topics).toEqual([]);
    expect(result.totalActivities).toBe(0);
  });

  it('should handle content with no recognizable topics', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'Hello world this is a test',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);

    expect(result.topics).toEqual([]);
    expect(result.primaryTopic).toBeNull();
  });

  it('should handle very short content', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'comment',
        content: 'stoic',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');

    expect(stoicismTopic).toBeDefined();
  });

  it('should handle content with special characters and emojis', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: '🚀 Stoic philosophy!!! #discipline @marcus_aurelius',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');

    expect(stoicismTopic).toBeDefined();
    expect(stoicismTopic?.keywords).toContain('stoic');
    expect(stoicismTopic?.keywords).toContain('discipline');
  });
});

describe('Content Topic Analyzer - Confidence Scoring', () => {
  it('should give higher confidence to content with multiple keyword matches', () => {
    const singleKeyword: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'Stoic philosophy',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const multipleKeywords: ActivityEvent[] = [
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'Stoic philosophy, Marcus Aurelius, discipline, virtue, and wisdom from ancient stoicism',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result1 = analyzeContentTopics(singleKeyword);
    const result2 = analyzeContentTopics(multipleKeywords);

    const confidence1 = result1.topics.find(t => t.name === 'stoicism')?.confidence || 0;
    const confidence2 = result2.topics.find(t => t.name === 'stoicism')?.confidence || 0;

    expect(confidence2).toBeGreaterThan(confidence1);
  });

  it('should calculate average confidence across multiple activities', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'stoic',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'user',
        targetId: 'target',
        type: 'post',
        content: 'Stoicism, Marcus Aurelius, Seneca, Epictetus, discipline, virtue, wisdom, courage',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeContentTopics(activities);
    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');

    expect(stoicismTopic?.confidence).toBeGreaterThan(0);
    expect(stoicismTopic?.confidence).toBeLessThanOrEqual(1);
  });
});

describe('Content Topic Analyzer - Topic Summary', () => {
  it('should generate human-readable summary', () => {
    const activities: ActivityEvent[] = [
      { id: '1', actorId: 'u', targetId: 't', type: 'post', content: 'Stoicism and discipline', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '2', actorId: 'u', targetId: 't', type: 'post', content: 'Marcus Aurelius teachings', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '3', actorId: 'u', targetId: 't', type: 'post', content: 'Stoic wisdom', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() },
      { id: '4', actorId: 'u', targetId: 't', type: 'post', content: 'Sales strategies', timestamp: new Date().toISOString(), scrapedAt: new Date().toISOString() }
    ];

    const result = analyzeContentTopics(activities);
    const summary = getTopicSummary(result, 2);

    expect(summary).toContain('stoicism');
    expect(summary).toContain('75%');
    expect(summary).toContain('sales');
    expect(summary).toContain('25%');
  });

  it('should handle no topics gracefully', () => {
    const result: ContentTopics = {
      topics: [],
      primaryTopic: null,
      topicFrequency: new Map(),
      totalActivities: 0
    };

    const summary = getTopicSummary(result);

    expect(summary).toBe('No topics identified from activity');
  });
});

describe('Content Topic Analyzer - Real-World Alex Hormozi Scenario', () => {
  it('should identify that Alex Hormozi engages with stoicism content', () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'person-1',
        type: 'comment',
        content: 'Discipline is the bridge between goals and accomplishment.',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'person-2',
        type: 'comment',
        content: 'Marcus Aurelius had it right about controlling your mind and focusing on virtue.',
        timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'person-3',
        type: 'share',
        content: 'The obstacle is the way - stoic wisdom for modern entrepreneurs',
        timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      },
      {
        id: '4',
        actorId: 'alex-hormozi',
        targetId: 'person-4',
        type: 'comment',
        content: 'Sales techniques for closing more deals in Q1',
        timestamp: new Date('2024-01-12T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString()
      }
    ];

    const result = analyzeUserTopics('alex-hormozi', activities);

    // Verify business intelligence
    expect(result.primaryTopic).toBe('stoicism');
    expect(result.topicFrequency.get('stoicism')).toBe(75); // 3/4 posts
    expect(result.topicFrequency.get('sales')).toBe(25);    // 1/4 posts

    const summary = getTopicSummary(result);
    expect(summary).toContain('stoicism');
    expect(summary).toContain('75%');

    // Business logic: "Alex Hormozi engages primarily with stoicism content"
    const stoicismTopic = result.topics.find(t => t.name === 'stoicism');
    expect(stoicismTopic?.count).toBe(3);
    expect(stoicismTopic?.keywords).toContain('discipline');
    expect(stoicismTopic?.keywords).toContain('marcus aurelius');
    expect(stoicismTopic?.keywords).toContain('stoic');
  });
});
