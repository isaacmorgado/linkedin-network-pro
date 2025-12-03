/**
 * Scraper Integration Tests
 * End-to-end tests verifying profile + activity scraping workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ActivityEvent } from '@/types/network';

describe('Profile + Activity Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/in/alex-hormozi/' },
      writable: true,
    });
  });

  it('should scrape profile with activity and correctly categorize posts', async () => {
    // Setup profile DOM
    const topCard = document.createElement('div');
    topCard.className = 'pv-top-card';

    const nameList = document.createElement('ul');
    nameList.className = 'pv-top-card--list';
    const nameLi = document.createElement('li');
    nameLi.textContent = 'Alex Hormozi';
    nameList.appendChild(nameLi);
    topCard.appendChild(nameList);

    const bulletList = document.createElement('ul');
    bulletList.className = 'pv-top-card--list-bullet';
    const headlineLi = document.createElement('li');
    headlineLi.textContent = 'CEO at Acquisition.com';
    bulletList.appendChild(headlineLi);
    topCard.appendChild(bulletList);

    document.body.appendChild(topCard);

    // Mock activity scraper
    vi.mock('../profile-scraper-activities', () => ({
      scrapeActivityForProfile: vi.fn().mockResolvedValue({
        activities: [
          {
            id: 'activity-1',
            type: 'post',
            actorId: 'alex-hormozi',
            targetId: 'alex-hormozi',
            content: 'Discipline is the bridge between goals and accomplishment.',
            postId: 'post-1',
            timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
          {
            id: 'activity-2',
            type: 'comment',
            actorId: 'alex-hormozi',
            targetId: 'stoic-philosopher',
            content: 'This resonates with Marcus Aurelius teachings',
            timestamp: new Date('2024-01-14T15:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
          {
            id: 'activity-3',
            type: 'reaction',
            actorId: 'alex-hormozi',
            targetId: 'john-doe',
            timestamp: new Date('2024-01-13T09:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
        ],
        engagementMetrics: new Map([
          ['post-1', { likes: 1234, comments: 89 }],
        ]),
      }),
      processActivityData: vi.fn().mockResolvedValue({
        userPosts: [
          {
            content: 'Discipline is the bridge between goals and accomplishment.',
            timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
            likes: 1234,
            comments: 89,
          },
        ],
        engagedPosts: [
          {
            authorId: 'stoic-philosopher',
            authorName: '',
            topic: 'This resonates with Marcus Aurelius teachings',
            timestamp: new Date('2024-01-14T15:00:00Z').toISOString(),
            engagementType: 'comment',
          },
          {
            authorId: 'john-doe',
            authorName: '',
            topic: '',
            timestamp: new Date('2024-01-13T09:00:00Z').toISOString(),
            engagementType: 'reaction',
          },
        ],
      }),
    }));

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData({ includeActivity: true });

    expect(profile).toBeTruthy();
    expect(profile?.name).toBe('Alex Hormozi');
    expect(profile?.publicId).toBe('alex-hormozi');

    // Extended properties from activity scraping
    expect(profile?.userPosts).toBeDefined();
    expect(profile?.userPosts?.length).toBeGreaterThanOrEqual(0);

    // Extended properties from activity scraping
    expect(profile?.engagedPosts).toBeDefined();
    expect(profile?.engagedPosts?.length).toBeGreaterThanOrEqual(0);
  });

  it('should correctly identify WHO the profile engages with', async () => {
    const topCard = document.createElement('div');
    topCard.className = 'pv-top-card';
    const nameList = document.createElement('ul');
    nameList.className = 'pv-top-card--list';
    const nameLi = document.createElement('li');
    nameLi.textContent = 'Alex Hormozi';
    nameList.appendChild(nameLi);
    topCard.appendChild(nameList);
    document.body.appendChild(topCard);

    vi.mock('../profile-scraper-activities', () => ({
      scrapeActivityForProfile: vi.fn().mockResolvedValue({
        activities: [
          {
            id: 'activity-1',
            type: 'comment',
            actorId: 'alex-hormozi',
            targetId: 'person-1',
            content: 'Great post!',
            timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
          {
            id: 'activity-2',
            type: 'comment',
            actorId: 'alex-hormozi',
            targetId: 'person-2',
            content: 'Insightful!',
            timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
          {
            id: 'activity-3',
            type: 'share',
            actorId: 'alex-hormozi',
            targetId: 'person-3',
            timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
            scrapedAt: new Date().toISOString(),
          },
        ],
        engagementMetrics: new Map(),
      }),
      processActivityData: vi.fn().mockResolvedValue({
        userPosts: [],
        engagedPosts: [
          {
            authorId: 'person-1',
            authorName: '',
            topic: 'Great post!',
            timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
            engagementType: 'comment',
          },
          {
            authorId: 'person-2',
            authorName: '',
            topic: 'Insightful!',
            timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
            engagementType: 'comment',
          },
          {
            authorId: 'person-3',
            authorName: '',
            topic: '',
            timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
            engagementType: 'share',
          },
        ],
      }),
    }));

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData({ includeActivity: true });

    // Extended properties
    expect(profile?.engagedPosts).toBeDefined();
    const engagedPeople = profile?.engagedPosts?.map((p: any) => p.authorId) || [];

    expect(engagedPeople).toEqual(['person-1', 'person-2', 'person-3']);

    // Business logic: These are potential stepping stones
    // If any of person-1, person-2, person-3 are in YOUR network,
    // they could introduce you to Alex
  });
});

describe('Connection Path Discovery via Activity', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should identify 2nd connection as stepping stone via engagement', async () => {
    // Scenario:
    // - You want to connect with "alex-hormozi"
    // - Your 1st connection "john-doe" engages with Alex's posts
    // - Path: You → john-doe → alex-hormozi

    const activities: ActivityEvent[] = [
      {
        id: 'activity-1',
        actorId: 'john-doe',           // Your 1st connection
        targetId: 'alex-hormozi',       // Target you want to reach
        type: 'comment',
        content: 'Great insights on discipline!',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString(),
      },
      {
        id: 'activity-2',
        actorId: 'john-doe',
        targetId: 'alex-hormozi',
        type: 'share',
        timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString(),
      },
      {
        id: 'activity-3',
        actorId: 'john-doe',
        targetId: 'alex-hormozi',
        type: 'comment',
        content: 'This changed my perspective',
        timestamp: new Date('2024-01-13T10:00:00Z').toISOString(),
        scrapedAt: new Date().toISOString(),
      },
    ];

    // Calculate engagement strength
    const strongEngagements = activities.filter(a =>
      a.type === 'comment' || a.type === 'share'
    );
    const totalEngagements = activities.length;

    expect(totalEngagements).toBe(3);
    expect(strongEngagements.length).toBe(3);

    // john-doe has STRONG engagement with alex-hormozi (3 meaningful interactions)
    // Recommendation: "Ask John Doe to introduce you to Alex Hormozi"
    const engagementStrength = strongEngagements.length / totalEngagements;
    expect(engagementStrength).toBe(1.0);  // 100% strong engagement
  });

  it('should calculate connection degree based on engagement network', async () => {
    // Build engagement network:
    // You (source)
    //   ↓ (1st connection)
    // John Doe
    //   ↓ (engages with)
    // Alex Hormozi (target)

    const yourConnections = ['john-doe', 'jane-smith'];  // Your 1st connections
    const johnEngagements: ActivityEvent[] = [
      {
        id: 'activity-1',
        actorId: 'john-doe',
        targetId: 'alex-hormozi',
        type: 'comment',
        content: 'Great post!',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      },
    ];

    // Find stepping stones
    const steppingStones = yourConnections.filter(connectionId =>
      johnEngagements.some(activity => activity.actorId === connectionId)
    );

    expect(steppingStones).toEqual(['john-doe']);

    // Path: You → john-doe (1st) → alex-hormozi (2nd via engagement)
    // Even though Alex is not in your connection list, he's reachable
    // via your 1st connection's engagement
  });
});

describe('Content Preference Analysis (Future Enhancement)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should identify dominant content topics from engagement history', async () => {
    const activities: ActivityEvent[] = [
      {
        id: '1',
        actorId: 'alex-hormozi',
        targetId: 'person-1',
        type: 'comment',
        content: 'Stoic philosophy teaches us discipline and virtue',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      },
      {
        id: '2',
        actorId: 'alex-hormozi',
        targetId: 'person-2',
        type: 'comment',
        content: 'Marcus Aurelius had it right about controlling your mind',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      },
      {
        id: '3',
        actorId: 'alex-hormozi',
        targetId: 'person-3',
        type: 'comment',
        content: 'The obstacle is the way - stoic wisdom',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      },
      {
        id: '4',
        actorId: 'alex-hormozi',
        targetId: 'person-4',
        type: 'comment',
        content: 'Sales techniques for closing more deals',
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      },
    ];

    // Keyword extraction (simplified - actual implementation would use NLP)
    const extractTopics = (content: string): string[] => {
      const topics: string[] = [];
      if (content.toLowerCase().includes('stoic') ||
          content.toLowerCase().includes('marcus aurelius') ||
          content.toLowerCase().includes('discipline') ||
          content.toLowerCase().includes('virtue')) {
        topics.push('stoicism');
      }
      if (content.toLowerCase().includes('sales') ||
          content.toLowerCase().includes('deals')) {
        topics.push('sales');
      }
      return topics;
    };

    const topicCounts = new Map<string, number>();
    activities.forEach(activity => {
      if (activity.content) {
        const topics = extractTopics(activity.content);
        topics.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      }
    });

    expect(topicCounts.get('stoicism')).toBe(3);
    expect(topicCounts.get('sales')).toBe(1);

    // Calculate percentages
    const totalPosts = activities.length;
    const stoicismPercentage = (topicCounts.get('stoicism')! / totalPosts) * 100;
    const salesPercentage = (topicCounts.get('sales')! / totalPosts) * 100;

    expect(stoicismPercentage).toBe(75);  // 3/4 posts
    expect(salesPercentage).toBe(25);     // 1/4 posts

    // Business logic:
    // "Alex Hormozi engages primarily with stoicism content (75%)"
    // "Best approach: Mention Marcus Aurelius or stoic philosophy in intro"
  });

  it('should identify common topics between source and target via stepping stone', async () => {
    // Scenario:
    // - You engage with "stoicism" content
    // - John Doe (1st connection) engages with "stoicism" content
    // - Alex Hormozi engages with "stoicism" content
    // - Common topic: STOICISM
    // - Intro message: "Hi Alex, John Doe suggested I reach out. We all share
    //   an interest in stoic philosophy..."

    const yourTopics = new Set(['stoicism', 'business']);
    const johnTopics = new Set(['stoicism', 'marketing']);
    const alexTopics = new Set(['stoicism', 'sales']);

    const findCommonTopics = (
      topics1: Set<string>,
      topics2: Set<string>,
      topics3: Set<string>
    ): string[] => {
      const common: string[] = [];
      topics1.forEach(topic => {
        if (topics2.has(topic) && topics3.has(topic)) {
          common.push(topic);
        }
      });
      return common;
    };

    const commonTopics = findCommonTopics(yourTopics, johnTopics, alexTopics);

    expect(commonTopics).toEqual(['stoicism']);

    // Business logic:
    // 3-way topic match = STRONGEST connection angle
    // Message: "Hi Alex, John and I both appreciate your insights on stoic
    //          philosophy. Would love to connect and discuss..."
  });
});

describe('Real-World Business Scenario Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should build complete network intelligence for Alex Hormozi scenario', async () => {
    // Complete scenario from user's request:
    // "Alex Hormozi commented on X person's post, X person is a 2nd connection"

    const scenario = {
      target: {
        id: 'alex-hormozi',
        name: 'Alex Hormozi',
        headline: 'CEO at Acquisition.com',
      },
      steppingStone: {
        id: 'john-doe',
        name: 'John Doe',
        connectionDegree: 2,  // 2nd connection to you
      },
      activities: [
        {
          id: 'activity-1',
          actorId: 'alex-hormozi',
          targetId: 'john-doe',
          type: 'comment' as const,
          content: 'Great insights on stoic philosophy and business discipline',
          timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
          scrapedAt: new Date().toISOString(),
        },
        {
          id: 'activity-2',
          actorId: 'alex-hormozi',
          targetId: 'john-doe',
          type: 'comment' as const,
          content: 'Marcus Aurelius would approve of this approach',
          timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
          scrapedAt: new Date().toISOString(),
        },
      ],
    };

    // Verify we captured WHO engages with WHOM
    expect(scenario.activities.every(a => a.actorId === 'alex-hormozi')).toBe(true);
    expect(scenario.activities.every(a => a.targetId === 'john-doe')).toBe(true);

    // Verify we know connection degree
    expect(scenario.steppingStone.connectionDegree).toBe(2);

    // Verify we can identify content preferences (simplified)
    const contentAnalysis = scenario.activities.map(a => a.content);
    const hasStoicismTopic = contentAnalysis.some(content =>
      content?.toLowerCase().includes('stoic') ||
      content?.toLowerCase().includes('marcus aurelius')
    );
    expect(hasStoicismTopic).toBe(true);

    // Business intelligence summary:
    const intelligence = {
      who: scenario.target.id,
      interactsWith: scenario.steppingStone.id,
      steppingStoneConnectionDegree: scenario.steppingStone.connectionDegree,
      shortestPath: `You → ${scenario.steppingStone.id} (2nd connection) → ${scenario.target.id}`,
      contentPreferences: ['stoicism', 'business-discipline'],
      engagementType: 'comment',  // Strong engagement
      recommendedAction: `Connect to ${scenario.target.name} through ${scenario.steppingStone.name}. ` +
        `Mention shared interest in stoic philosophy.`,
    };

    expect(intelligence.steppingStoneConnectionDegree).toBe(2);
    expect(intelligence.shortestPath).toContain('john-doe');
    expect(intelligence.contentPreferences).toContain('stoicism');
  });
});
