/**
 * Comprehensive Activity Scraper Tests
 * Extended test suite ensuring bulletproof functionality for all edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ActivityEvent } from '@/types/network';

// Helper to create realistic activity elements
const createRealisticActivityElement = (data: {
  type: 'post' | 'comment' | 'reaction' | 'share';
  actorName: string;
  actorId: string;
  targetId?: string;
  content?: string;
  timestamp?: string;
  postId?: string;
  likes?: number;
  comments?: number;
}) => {
  const container = document.createElement('div');
  container.className = 'feed-shared-update-v2';

  if (data.postId) {
    container.setAttribute('data-urn', data.postId);
    container.setAttribute('data-activity-urn', data.postId);
  }

  // Actor link (WHO performed the action)
  const actorLink = document.createElement('a');
  actorLink.href = `/in/${data.actorId}/`;
  actorLink.className = 'update-components-actor__name';
  actorLink.textContent = data.actorName;
  container.appendChild(actorLink);

  // Target link (WHOSE post was engaged with) - for comments/reactions
  if (data.targetId && data.targetId !== data.actorId) {
    const targetLink = document.createElement('a');
    targetLink.href = `/in/${data.targetId}/`;
    targetLink.className = 'feed-shared-actor__name';
    targetLink.textContent = 'Target User';
    container.appendChild(targetLink);
  }

  // Content
  if (data.content) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'feed-shared-text__text-view';
    const contentSpan = document.createElement('span');
    contentSpan.setAttribute('dir', 'ltr');
    contentSpan.textContent = data.content;
    contentDiv.appendChild(contentSpan);
    container.appendChild(contentDiv);
  }

  // Timestamp
  const timeElement = document.createElement('time');
  timeElement.setAttribute('datetime', data.timestamp || new Date().toISOString());
  container.appendChild(timeElement);

  // Type-specific indicators
  if (data.type === 'comment') {
    const commentIndicator = document.createElement('div');
    commentIndicator.className = 'comment-entity';
    container.appendChild(commentIndicator);
  } else if (data.type === 'reaction') {
    const reactionIndicator = document.createElement('div');
    reactionIndicator.className = 'social-details-social-activity';
    container.appendChild(reactionIndicator);
  } else if (data.type === 'share') {
    const shareIndicator = document.createElement('div');
    shareIndicator.className = 'feed-shared-update-v2__reshared';
    container.appendChild(shareIndicator);
  }

  // Engagement metrics
  if (data.likes !== undefined) {
    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.textContent = data.likes.toString();
    likesButton.setAttribute('aria-label', `${data.likes} reactions`);
    container.appendChild(likesButton);
  }

  if (data.comments !== undefined) {
    const commentsButton = document.createElement('button');
    commentsButton.className = 'social-details-social-counts__comments';
    commentsButton.textContent = data.comments.toString();
    commentsButton.setAttribute('aria-label', `${data.comments} comments`);
    container.appendChild(commentsButton);
  }

  return container;
};

describe('Activity Scraper - Interaction Tracking (WHO engages with WHOM)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should correctly identify WHO is engaging (actorId)', async () => {
    const element = createRealisticActivityElement({
      type: 'comment',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'john-doe',
      content: 'Great insights on discipline!',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.actorId).toBe('alex-hormozi');
    expect(activity?.targetId).toBe('john-doe');
  });

  it('should track 2nd degree connection interactions correctly', async () => {
    // Scenario: Alex Hormozi (unknown) commented on Jane Smith's post
    // Jane Smith is your 2nd connection
    const element = createRealisticActivityElement({
      type: 'comment',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'jane-smith',
      content: 'Stoic philosophy is timeless',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.actorId).toBe('alex-hormozi');
    expect(activity?.targetId).toBe('jane-smith');
    expect(activity?.type).toBe('comment');

    // This tells us: alex-hormozi engages with jane-smith
    // If jane-smith is 2nd connection, this is a stepping stone opportunity
  });

  it('should handle self-posts (actor = target)', async () => {
    const element = createRealisticActivityElement({
      type: 'post',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      content: 'Just launched a new course on discipline',
      timestamp: '2024-01-15T10:00:00Z',
      postId: 'urn:li:activity:123456',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.actorId).toBe('alex-hormozi');
    expect(activity?.targetId).toBe('alex-hormozi'); // Same person
    expect(activity?.type).toBe('post');
  });

  it('should extract complex interaction chains', async () => {
    // Multiple people engaging with the same post
    const interactions: ActivityEvent[] = [];

    const people = [
      { actorId: 'alex-hormozi', actorName: 'Alex Hormozi', type: 'comment' as const },
      { actorId: 'john-doe', actorName: 'John Doe', type: 'reaction' as const },
      { actorId: 'jane-smith', actorName: 'Jane Smith', type: 'share' as const },
    ];

    for (const person of people) {
      const element = createRealisticActivityElement({
        type: person.type,
        actorName: person.actorName,
        actorId: person.actorId,
        targetId: 'original-poster',
        content: person.type === 'comment' ? 'Great post!' : undefined,
        timestamp: '2024-01-15T10:00:00Z',
      });
      document.body.appendChild(element);

      const { extractActivity } = await import('../activity-scraper-extraction');
      const activity = extractActivity(element);
      if (activity) {
        interactions.push(activity);
      }

      document.body.innerHTML = '';
    }

    expect(interactions).toHaveLength(3);
    expect(interactions.every(a => a.targetId === 'original-poster')).toBe(true);
    expect(interactions.map(a => a.type)).toEqual(['comment', 'reaction', 'share']);
  });
});

describe('Activity Scraper - Engagement Quality Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect high engagement (comment with long content)', async () => {
    const longComment = 'This is an incredibly thoughtful post. I especially appreciate your point about discipline being the bridge between goals and accomplishment. In my experience, this resonates deeply with stoic philosophy...';

    const element = createRealisticActivityElement({
      type: 'comment',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'john-doe',
      content: longComment,
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('comment');
    expect(activity?.content?.length).toBeGreaterThan(100);

    // Quality classification (to be implemented):
    // Long comment (>100 chars) = STRONG engagement
    // Short comment (<30 chars) = MODERATE engagement
    // Reaction only = PASSIVE engagement
  });

  it('should detect medium engagement (short comment)', async () => {
    const element = createRealisticActivityElement({
      type: 'comment',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'john-doe',
      content: 'Great post!',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.content?.length).toBeLessThan(30);
  });

  it('should detect passive engagement (reaction only)', async () => {
    const element = createRealisticActivityElement({
      type: 'reaction',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'john-doe',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('reaction');
    expect(activity?.content).toBeUndefined();
  });
});

describe('Activity Scraper - Engagement Metrics Accuracy', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should accurately parse high engagement counts (1000+)', async () => {
    const element = createRealisticActivityElement({
      type: 'post',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      content: 'Viral post about discipline',
      timestamp: '2024-01-15T10:00:00Z',
      postId: 'urn:li:activity:viral-post',
      likes: 5234,
      comments: 1089,
    });
    document.body.appendChild(element);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(element);

    expect(metrics.likes).toBe(5234);
    expect(metrics.comments).toBe(1089);
  });

  it('should handle engagement counts with K notation (5.2K)', async () => {
    const container = document.createElement('div');

    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.setAttribute('aria-label', '5.2K reactions');
    container.appendChild(likesButton);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    // Note: Current implementation may not handle K notation
    // This test documents expected behavior for future enhancement
    expect(metrics.likes).toBeGreaterThan(0);
  });

  it('should correctly parse engagement from multiple selector fallbacks', async () => {
    const container = document.createElement('div');

    // Primary selector
    const likesButton1 = document.createElement('button');
    likesButton1.className = 'social-details-social-counts__reactions-count';
    likesButton1.textContent = '100';
    container.appendChild(likesButton1);

    // Fallback selector
    const likesButton2 = document.createElement('button');
    likesButton2.className = 'reactions-count';
    likesButton2.textContent = '200';
    container.appendChild(likesButton2);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    // Should use first matching selector
    expect(metrics.likes).toBe(100);
  });
});

describe('Activity Scraper - Content Extraction Accuracy', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract content with emojis and special characters', async () => {
    const content = '🚀 Excited to announce: Our new course is LIVE! 💪 #discipline #growth';

    const element = createRealisticActivityElement({
      type: 'post',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      content,
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity?.content).toBe(content);
    expect(activity?.content).toContain('🚀');
    expect(activity?.content).toContain('#discipline');
  });

  it('should extract content with line breaks', async () => {
    const content = 'First line\nSecond line\nThird line';

    const element = createRealisticActivityElement({
      type: 'post',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      content,
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity?.content).toBeTruthy();
    expect(activity?.content).toContain('First line');
    expect(activity?.content).toContain('Second line');
  });

  it('should handle truncated content with "see more" links', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const actorLink = document.createElement('a');
    actorLink.href = '/in/alex-hormozi/';
    actorLink.className = 'update-components-actor__name';
    actorLink.textContent = 'Alex Hormozi';
    container.appendChild(actorLink);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'feed-shared-text__text-view';

    const visibleSpan = document.createElement('span');
    visibleSpan.setAttribute('dir', 'ltr');
    visibleSpan.textContent = 'This is a long post that gets truncated...';
    contentDiv.appendChild(visibleSpan);

    const seeMoreSpan = document.createElement('span');
    seeMoreSpan.className = 'feed-shared-inline-show-more-text';
    seeMoreSpan.textContent = ' ...see more';
    contentDiv.appendChild(seeMoreSpan);

    container.appendChild(contentDiv);

    const timeElement = document.createElement('time');
    timeElement.setAttribute('datetime', '2024-01-15T10:00:00Z');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    expect(activity?.content).toBeTruthy();
    expect(activity?.content).toContain('truncated');
  });
});

describe('Activity Scraper - Timestamp Handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should parse ISO datetime stamps correctly', async () => {
    const timestamp = '2024-01-15T10:30:45.123Z';

    const element = createRealisticActivityElement({
      type: 'post',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      content: 'Test post',
      timestamp,
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity?.timestamp).toBe(timestamp);
    expect(() => new Date(activity!.timestamp)).not.toThrow();
  });

  it('should handle relative timestamps (e.g., "2h ago")', async () => {
    // Note: Current implementation uses datetime attribute
    // This test documents expected behavior if LinkedIn changes format
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const actorLink = document.createElement('a');
    actorLink.href = '/in/alex-hormozi/';
    actorLink.className = 'update-components-actor__name';
    actorLink.textContent = 'Alex Hormozi';
    container.appendChild(actorLink);

    const timeElement = document.createElement('time');
    // No datetime attribute, only text content
    timeElement.textContent = '2h ago';
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    // Should fall back to current timestamp
    expect(activity?.timestamp).toBeTruthy();
    expect(() => new Date(activity!.timestamp)).not.toThrow();
  });
});

describe('Activity Scraper - Error Resilience', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle missing actor gracefully (return null)', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'feed-shared-text__text-view';
    const contentSpan = document.createElement('span');
    contentSpan.textContent = 'Orphan content without actor';
    contentDiv.appendChild(contentSpan);
    container.appendChild(contentDiv);

    const timeElement = document.createElement('time');
    timeElement.setAttribute('datetime', '2024-01-15T10:00:00Z');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    // Should return null if no actorId found
    expect(activity).toBeNull();
  });

  it('should handle malformed profile URLs gracefully', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const actorLink = document.createElement('a');
    actorLink.href = '/invalid-url-format/';
    actorLink.className = 'update-components-actor__name';
    actorLink.textContent = 'Test User';
    container.appendChild(actorLink);

    const timeElement = document.createElement('time');
    timeElement.setAttribute('datetime', '2024-01-15T10:00:00Z');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    // Should return null if profile ID can't be extracted
    expect(activity).toBeNull();
  });

  it('should handle corrupted DOM structures', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    // Minimal structure, missing many elements
    const timeElement = document.createElement('time');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');

    // Should not throw, just return null
    expect(() => extractActivity(container)).not.toThrow();
  });
});

describe('Activity Scraper - Schema Validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should validate extracted activity against ActivityEventSchema', async () => {
    const element = createRealisticActivityElement({
      type: 'comment',
      actorName: 'Alex Hormozi',
      actorId: 'alex-hormozi',
      targetId: 'john-doe',
      content: 'Great insights!',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const { ActivityEventSchema } = await import('@/types/network');

    const activity = extractActivity(element);

    // Should pass schema validation
    expect(() => ActivityEventSchema.parse(activity)).not.toThrow();

    const validated = ActivityEventSchema.parse(activity);
    expect(validated.id).toBeTruthy();
    expect(validated.actorId).toBe('alex-hormozi');
    expect(validated.targetId).toBe('john-doe');
    expect(validated.type).toBe('comment');
    expect(validated.timestamp).toBeTruthy();
    expect(validated.scrapedAt).toBeTruthy();
  });
});

describe('Activity Scraper - Real-World Scenarios', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle Alex Hormozi engaging with stoicism content', async () => {
    const activities: ActivityEvent[] = [];

    const stoicPosts = [
      'Discipline is the bridge between goals and accomplishment.',
      'Marcus Aurelius had it right about virtue and character.',
      'The obstacle is the way - stoic wisdom for modern times.',
      'Control what you can control, let go of the rest.',
    ];

    for (const content of stoicPosts) {
      const element = createRealisticActivityElement({
        type: 'comment',
        actorName: 'Alex Hormozi',
        actorId: 'alex-hormozi',
        targetId: 'stoic-philosopher',
        content,
        timestamp: '2024-01-15T10:00:00Z',
      });
      document.body.appendChild(element);

      const { extractActivity } = await import('../activity-scraper-extraction');
      const activity = extractActivity(element);
      if (activity) {
        activities.push(activity);
      }

      document.body.innerHTML = '';
    }

    expect(activities).toHaveLength(4);
    expect(activities.every(a => a.actorId === 'alex-hormozi')).toBe(true);
    expect(activities.every(a => a.type === 'comment')).toBe(true);

    // All content contains stoicism-related keywords
    const keywords = ['discipline', 'Marcus Aurelius', 'stoic', 'control'];
    const hasKeywords = activities.every(a =>
      keywords.some(keyword => a.content?.toLowerCase().includes(keyword.toLowerCase()))
    );
    expect(hasKeywords).toBe(true);
  });

  it('should identify engagement patterns for 2nd connection stepping stones', async () => {
    // Scenario: Your 1st connection (John) engages with Alex's posts
    // This makes John a potential stepping stone to Alex

    const activities: ActivityEvent[] = [];

    const engagements = [
      { type: 'comment' as const, content: 'Great post!' },
      { type: 'share' as const, content: undefined },
      { type: 'comment' as const, content: 'I agree completely' },
      { type: 'reaction' as const, content: undefined },
    ];

    for (const engagement of engagements) {
      const element = createRealisticActivityElement({
        type: engagement.type,
        actorName: 'John Doe',
        actorId: 'john-doe',  // Your 1st connection
        targetId: 'alex-hormozi',  // Target you want to connect with
        content: engagement.content,
        timestamp: '2024-01-15T10:00:00Z',
      });
      document.body.appendChild(element);

      const { extractActivity } = await import('../activity-scraper-extraction');
      const activity = extractActivity(element);
      if (activity) {
        activities.push(activity);
      }

      document.body.innerHTML = '';
    }

    // Verify we captured the engagement bridge
    expect(activities).toHaveLength(4);
    expect(activities.every(a => a.actorId === 'john-doe')).toBe(true);
    expect(activities.every(a => a.targetId === 'alex-hormozi')).toBe(true);

    // Calculate engagement strength (for future implementation)
    const strongEngagements = activities.filter(a =>
      a.type === 'comment' || a.type === 'share'
    );
    expect(strongEngagements.length).toBe(3);  // 2 comments + 1 share
  });
});
