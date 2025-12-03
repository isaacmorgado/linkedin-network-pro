/**
 * Activity Scraper Tests
 * Comprehensive tests for LinkedIn activity/engagement scraping functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create properly structured activity elements that match scraper selectors
const createActivityElement = (data: {
  type: 'post' | 'comment' | 'reaction' | 'share';
  actorName: string;
  actorId: string;
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
  }

  // Actor (author) link
  const actorLink = document.createElement('a');
  actorLink.href = `/in/${data.actorId}/`;
  actorLink.className = 'update-components-actor__name';
  actorLink.textContent = data.actorName;
  container.appendChild(actorLink);

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

  // Engagement metrics (likes/comments counts)
  if (data.likes !== undefined) {
    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.textContent = data.likes.toString();
    container.appendChild(likesButton);
  }

  if (data.comments !== undefined) {
    const commentsButton = document.createElement('button');
    commentsButton.className = 'social-details-social-counts__comments';
    commentsButton.textContent = data.comments.toString();
    container.appendChild(commentsButton);
  }

  return container;
};

describe('Activity Scraper - Success Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/in/test-user/recent-activity/all/' },
      writable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should extract post activities with engagement metrics', async () => {
    const postElement = createActivityElement({
      type: 'post',
      actorName: 'John Doe',
      actorId: 'john-doe',
      content: 'Excited to announce my new project!',
      timestamp: '2024-01-15T10:00:00Z',
      postId: 'urn:li:activity:123456',
      likes: 42,
      comments: 8,
    });
    document.body.appendChild(postElement);

    const { extractActivity, extractEngagementMetrics } = await import('../activity-scraper-extraction');

    const activity = extractActivity(postElement);
    const metrics = extractEngagementMetrics(postElement);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('post');
    expect(activity?.actorId).toBe('john-doe');
    expect(activity?.content).toBe('Excited to announce my new project!');
    expect(activity?.postId).toBe('urn:li:activity:123456');
    expect(metrics.likes).toBe(42);
    expect(metrics.comments).toBe(8);
  });

  it('should extract comment activities correctly', async () => {
    const commentElement = createActivityElement({
      type: 'comment',
      actorName: 'Jane Smith',
      actorId: 'jane-smith',
      content: 'Great insights! Thanks for sharing.',
      timestamp: '2024-01-14T15:30:00Z',
    });
    document.body.appendChild(commentElement);

    const { extractActivity } = await import('../activity-scraper-extraction');

    const activity = extractActivity(commentElement);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('comment');
    expect(activity?.actorId).toBe('jane-smith');
    expect(activity?.content).toBe('Great insights! Thanks for sharing.');
  });

  it('should extract reaction activities correctly', async () => {
    const reactionElement = createActivityElement({
      type: 'reaction',
      actorName: 'Bob Johnson',
      actorId: 'bob-johnson',
      timestamp: '2024-01-13T09:15:00Z',
    });
    document.body.appendChild(reactionElement);

    const { extractActivity } = await import('../activity-scraper-extraction');

    const activity = extractActivity(reactionElement);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('reaction');
    expect(activity?.actorId).toBe('bob-johnson');
  });

  it('should extract share/reshare activities correctly', async () => {
    const shareElement = createActivityElement({
      type: 'share',
      actorName: 'Alice Brown',
      actorId: 'alice-brown',
      content: 'Must-read article about AI trends',
      timestamp: '2024-01-12T14:00:00Z',
    });
    document.body.appendChild(shareElement);

    const { extractActivity } = await import('../activity-scraper-extraction');

    const activity = extractActivity(shareElement);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('share');
    expect(activity?.actorId).toBe('alice-brown');
    expect(activity?.content).toBe('Must-read article about AI trends');
  });
});

describe('Activity Scraper - Engagement Metrics', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should parse engagement metrics with comma separators', async () => {
    const container = document.createElement('div');

    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.textContent = '1,234';
    container.appendChild(likesButton);

    const commentsButton = document.createElement('button');
    commentsButton.className = 'social-details-social-counts__comments';
    commentsButton.textContent = '567';
    container.appendChild(commentsButton);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    expect(metrics.likes).toBe(1234);
    expect(metrics.comments).toBe(567);
  });

  it('should handle zero engagement metrics', async () => {
    const container = document.createElement('div');

    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.textContent = '0';
    container.appendChild(likesButton);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    expect(metrics.likes).toBe(0);
    expect(metrics.comments).toBe(0);
  });

  it('should extract metrics from aria-label attributes', async () => {
    const container = document.createElement('div');

    const likesButton = document.createElement('button');
    likesButton.setAttribute('aria-label', '85 reactions');
    likesButton.className = 'social-details-social-counts__reactions-count';
    container.appendChild(likesButton);

    const commentsButton = document.createElement('button');
    commentsButton.setAttribute('aria-label', '12 comments');
    commentsButton.className = 'social-details-social-counts__comments';
    container.appendChild(commentsButton);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    expect(metrics.likes).toBe(85);
    expect(metrics.comments).toBe(12);
  });

  it('should default to 0 when engagement metrics are missing', async () => {
    const container = document.createElement('div');

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    expect(metrics.likes).toBe(0);
    expect(metrics.comments).toBe(0);
  });
});

describe('Activity Scraper - Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle activities with missing content gracefully', async () => {
    const element = createActivityElement({
      type: 'post',
      actorName: 'Test User',
      actorId: 'test-user',
      timestamp: '2024-01-15T10:00:00Z',
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.content).toBeUndefined();
  });

  it('should return null for activities without actor ID', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const timeElement = document.createElement('time');
    timeElement.setAttribute('datetime', '2024-01-15T10:00:00Z');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    expect(activity).toBeNull();
  });

  it('should handle malformed engagement metric text', async () => {
    const container = document.createElement('div');

    const likesButton = document.createElement('button');
    likesButton.className = 'social-details-social-counts__reactions-count';
    likesButton.textContent = 'N/A';
    container.appendChild(likesButton);

    const { extractEngagementMetrics } = await import('../activity-scraper-extraction');
    const metrics = extractEngagementMetrics(container);

    expect(metrics.likes).toBe(0);
    expect(metrics.comments).toBe(0);
  });

  it('should use current timestamp when datetime attribute is missing', async () => {
    const element = createActivityElement({
      type: 'post',
      actorName: 'Test User',
      actorId: 'test-user',
      content: 'Test content',
    });

    // Remove the time element to simulate missing timestamp
    const timeElement = element.querySelector('time');
    if (timeElement) {
      element.removeChild(timeElement);
    }

    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(element);

    expect(activity).toBeTruthy();
    expect(activity?.timestamp).toBeTruthy();
    // Should be a valid ISO date string
    expect(() => new Date(activity!.timestamp)).not.toThrow();
  });

  it('should detect activity type as post when no type indicators present', async () => {
    const container = document.createElement('div');
    container.className = 'feed-shared-update-v2';

    const actorLink = document.createElement('a');
    actorLink.href = '/in/test-user/';
    actorLink.className = 'update-components-actor__name';
    actorLink.textContent = 'Test User';
    container.appendChild(actorLink);

    const timeElement = document.createElement('time');
    timeElement.setAttribute('datetime', '2024-01-15T10:00:00Z');
    container.appendChild(timeElement);

    document.body.appendChild(container);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const activity = extractActivity(container);

    expect(activity).toBeTruthy();
    expect(activity?.type).toBe('post');
  });
});

describe('Activity Scraper - Schema Validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return valid ActivityEvent schema', async () => {
    const element = createActivityElement({
      type: 'post',
      actorName: 'John Doe',
      actorId: 'john-doe',
      content: 'Test content',
      timestamp: '2024-01-15T10:00:00Z',
      postId: 'urn:li:activity:123456',
      likes: 10,
      comments: 2,
    });
    document.body.appendChild(element);

    const { extractActivity } = await import('../activity-scraper-extraction');
    const { ActivityEventSchema } = await import('@/types/network');

    const activity = extractActivity(element);

    // Should validate against schema
    expect(() => ActivityEventSchema.parse(activity)).not.toThrow();

    const validated = ActivityEventSchema.parse(activity);
    expect(validated.id).toBeTruthy();
    expect(validated.actorId).toBe('john-doe');
    expect(validated.type).toBe('post');
    expect(validated.timestamp).toBe('2024-01-15T10:00:00Z');
    expect(validated.scrapedAt).toBeTruthy();
  });
});
