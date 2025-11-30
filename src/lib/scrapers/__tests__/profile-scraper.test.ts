/**
 * Profile Scraper Tests
 * Comprehensive tests for LinkedIn profile scraping functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM elements
const createMockElement = (textContent: string, selector?: string) => {
  const element = document.createElement('div');
  // If selector indicates this should have an aria-hidden span child (for scraper compatibility)
  if (selector?.includes('t-bold') || selector?.includes('t-black--light') || selector?.includes('t-14')) {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = textContent;
    element.appendChild(span);
  } else {
    element.textContent = textContent;
  }
  if (selector) {
    element.classList.add(...selector.split('.').filter(Boolean));
  }
  return element;
};

// Create properly structured profile elements that match scraper selectors
const createProfileStructure = (data: {
  name?: string;
  headline?: string;
  location?: string;
  avatarUrl?: string;
}) => {
  const topCard = createMockElement('', 'pv-top-card');

  // Name structure: .pv-top-card--list li:first-child
  if (data.name) {
    const nameList = document.createElement('ul');
    nameList.className = 'pv-top-card--list';
    const nameLi = document.createElement('li');
    nameLi.textContent = data.name;
    nameList.appendChild(nameLi);
    topCard.appendChild(nameList);
  }

  // Headline/Location structure: .pv-top-card--list-bullet li
  if (data.headline || data.location) {
    const bulletList = document.createElement('ul');
    bulletList.className = 'pv-top-card--list-bullet';

    if (data.headline) {
      const headlineLi = document.createElement('li');
      headlineLi.textContent = data.headline;
      bulletList.appendChild(headlineLi);
    }

    if (data.location) {
      const locationLi = document.createElement('li');
      locationLi.textContent = data.location;
      bulletList.appendChild(locationLi);
    }

    topCard.appendChild(bulletList);
  }

  // Avatar
  if (data.avatarUrl) {
    const img = document.createElement('img');
    img.src = data.avatarUrl;
    img.className = 'pv-top-card__photo';
    topCard.appendChild(img);
  }

  return topCard;
};

describe('Profile Scraper - Success Cases', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/in/john-doe/' },
      writable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should extract basic profile information successfully', async () => {
    // Setup mock DOM with proper structure
    const topCard = createProfileStructure({
      name: 'John Doe',
      headline: 'Senior Software Engineer at Tech Corp',
      location: 'San Francisco, CA',
    });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile).toBeDefined();
    expect(profile).toHaveProperty('name', 'John Doe');
    expect(profile).toHaveProperty('headline', 'Senior Software Engineer at Tech Corp');
    expect(profile).toHaveProperty('location', 'San Francisco, CA');
    expect(profile).toHaveProperty('publicId', 'john-doe');
  });

  it('should extract public ID from LinkedIn URL correctly', async () => {
    // Test various URL formats
    const testCases = [
      { url: 'https://www.linkedin.com/in/jane-smith/', expected: 'jane-smith' },
      { url: 'https://www.linkedin.com/in/john-doe-123/', expected: 'john-doe-123' },
      { url: 'https://www.linkedin.com/in/alice/', expected: 'alice' },
      { url: 'https://www.linkedin.com/in/bob-jones/overlay/', expected: 'bob-jones' },
    ];

    for (const { url, expected } of testCases) {
      Object.defineProperty(window, 'location', {
        value: { href: url },
        writable: true,
      });

      const topCard = createProfileStructure({ name: 'Test User' });
      document.body.appendChild(topCard);

      const { scrapeProfileData } = await import('../profile-scraper');
      const profile = await scrapeProfileData();

      expect(profile?.publicId).toBe(expected);
      document.body.innerHTML = '';
    }
  });

  it('should infer industry from headline keywords', async () => {
    const testCases = [
      { headline: 'Software Engineer at Google', expectedIndustry: 'Software Development' },
      { headline: 'Data Scientist | Machine Learning', expectedIndustry: 'Data Science' },
      { headline: 'Marketing Manager at Nike', expectedIndustry: 'Marketing' },
      { headline: 'Financial Analyst | Banking', expectedIndustry: 'Finance' },
    ];

    for (const { headline, expectedIndustry } of testCases) {
      document.body.innerHTML = '';
      const { inferIndustryFromHeadline } = await import('../helpers');
      const industry = inferIndustryFromHeadline(headline);

      expect(industry).toBe(expectedIndustry);
    }
  });

  it('should extract experience section with multiple jobs', async () => {
    document.body.innerHTML = `
      <div id="experience"></div>
    `;

    const experienceSection = document.getElementById('experience')!;
    const parentDiv = document.createElement('div');
    experienceSection.appendChild(parentDiv);

    // Add 3 job entries
    for (let i = 1; i <= 3; i++) {
      const item = createMockElement('', 'pvs-list__item--line-separated');
      const company = createMockElement(`Company ${i}`, 't-bold');
      const title = createMockElement(`Title ${i}`, 't-14');
      const duration = createMockElement(`${i} years`, 't-black--light');

      item.appendChild(company);
      item.appendChild(title);
      item.appendChild(duration);
      parentDiv.appendChild(item);
    }

    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile?.experience).toBeDefined();
    expect(profile?.experience?.length).toBe(3);
    expect(profile?.experience?.[0]).toHaveProperty('company', 'Company 1');
    expect(profile?.experience?.[0]).toHaveProperty('title', 'Title 1');
    expect(profile?.experience?.[0]).toHaveProperty('duration', '1 years');
  });

  it('should extract skills with endorsement counts', async () => {
    document.body.innerHTML = `
      <div id="skills"></div>
    `;

    const skillsSection = document.getElementById('skills')!;
    const parentDiv = document.createElement('div');
    skillsSection.appendChild(parentDiv);

    const skillData = [
      { name: 'Python', endorsements: '99 endorsements' },
      { name: 'JavaScript', endorsements: '45 endorsements' },
      { name: 'React', endorsements: '30 endorsements' },
    ];

    for (const skill of skillData) {
      const item = createMockElement('', 'pvs-list__item--line-separated');
      const skillName = createMockElement(skill.name, 't-bold');
      const endorsement = createMockElement(skill.endorsements, 't-black--light');

      item.appendChild(skillName);
      item.appendChild(endorsement);
      parentDiv.appendChild(item);
    }

    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile?.skills).toBeDefined();
    expect(profile?.skills?.length).toBe(3);
    expect(profile?.skills?.[0]).toHaveProperty('name', 'Python');
    expect(profile?.skills?.[0]).toHaveProperty('endorsementCount', 99);
    expect(profile?.skills?.[1]).toHaveProperty('endorsementCount', 45);
  });
});

describe('Profile Scraper - Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/in/test/' },
      writable: true,
    });
  });

  it('should handle missing profile sections gracefully', async () => {
    // Only add top card, no other sections
    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile).toBeDefined();
    expect(profile?.experience).toEqual([]);
    expect(profile?.education).toEqual([]);
    expect(profile?.skills).toEqual([]);
    expect(profile?.certifications).toEqual([]);
  });

  it('should return null when profile card fails to load', async () => {
    // Don't add pv-top-card element
    document.body.innerHTML = '<div>Not a profile page</div>';

    const { scrapeProfileData } = await import('../profile-scraper');

    // Mock waitForElement to reject after timeout
    vi.useFakeTimers();
    const promise = scrapeProfileData();
    vi.advanceTimersByTime(6000); // Exceed timeout

    const profile = await promise;
    expect(profile).toBeNull();

    vi.useRealTimers();
  });

  it('should handle malformed experience entries', async () => {
    document.body.innerHTML = `
      <div id="experience"></div>
    `;

    const experienceSection = document.getElementById('experience')!;
    const parentDiv = document.createElement('div');
    experienceSection.appendChild(parentDiv);

    // Add entry with missing company
    const item1 = createMockElement('', 'pvs-list__item--line-separated');
    const title1 = createMockElement('Title Without Company', 't-14');
    item1.appendChild(title1);
    parentDiv.appendChild(item1);

    // Add entry with missing title
    const item2 = createMockElement('', 'pvs-list__item--line-separated');
    const company2 = createMockElement('Company Without Title', 't-bold');
    item2.appendChild(company2);
    parentDiv.appendChild(item2);

    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    // Should not include malformed entries
    expect(profile?.experience).toEqual([]);
  });

  it('should extract avatar URL from multiple selectors', async () => {
    const topCard = createProfileStructure({
      name: 'Test User',
      avatarUrl: 'https://media.licdn.com/dms/image/v2/photo.jpg',
    });

    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile?.avatarUrl).toBe('https://media.licdn.com/dms/image/v2/photo.jpg');
  });

  it('should filter out placeholder avatar images', async () => {
    const topCard = createProfileStructure({
      name: 'Test User',
      avatarUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDA...',
    });

    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile?.avatarUrl).toBeUndefined();
  });

  it('should parse education dates correctly', async () => {
    document.body.innerHTML = `
      <div id="education"></div>
    `;

    const educationSection = document.getElementById('education')!;
    const parentDiv = document.createElement('div');
    educationSection.appendChild(parentDiv);

    const testCases = [
      { dateStr: '2015 - 2019', expectedStart: 2015, expectedEnd: 2019 },
      { dateStr: '2020 - Present', expectedStart: 2020, expectedEnd: new Date().getFullYear() },
      { dateStr: '2018', expectedStart: 2018, expectedEnd: 2018 },
    ];

    for (const { dateStr, expectedStart: _expectedStart, expectedEnd: _expectedEnd } of testCases) {
      const item = createMockElement('', 'pvs-list__item--line-separated');
      const school = createMockElement('Test University', 't-bold');
      const degree = createMockElement('Bachelor of Science', 't-14');
      const dateElement = createMockElement(dateStr, 't-black--light');

      item.appendChild(school);
      item.appendChild(degree);
      item.appendChild(dateElement);
      parentDiv.appendChild(item);
    }

    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData();

    expect(profile?.education).toBeDefined();
    expect(profile?.education?.length).toBe(testCases.length);

    profile?.education?.forEach((edu, index) => {
      expect(edu.startYear).toBe(testCases[index].expectedStart);
      expect(edu.endYear).toBe(testCases[index].expectedEnd);
    });
  });
});

describe('Profile Scraper - Activity Scraping', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/in/test-user/' },
      writable: true,
    });
  });

  it('should scrape profile with activity when includeActivity is true', async () => {
    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    // Mock activity scraper
    vi.mock('../activity-scraper', () => ({
      scrapeProfileActivitySafe: vi.fn().mockResolvedValue([
        {
          type: 'post',
          actorId: 'test-user',
          targetId: 'test-user',
          content: 'Excited to announce...',
          timestamp: new Date('2024-01-15').toISOString(),
        },
        {
          type: 'comment',
          actorId: 'test-user',
          targetId: 'other-user',
          content: 'Great insights!',
          timestamp: new Date('2024-01-14').toISOString(),
        },
      ]),
    }));

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData({ includeActivity: true });

    expect(profile).toHaveProperty('activities');
    expect(profile?.activities?.length).toBe(2);
    expect(profile).toHaveProperty('userPosts');
    expect(profile).toHaveProperty('engagedPosts');
  });

  it('should not scrape activity when includeActivity is false', async () => {
    const topCard = createProfileStructure({ name: 'Test User' });
    document.body.appendChild(topCard);

    const { scrapeProfileData } = await import('../profile-scraper');
    const profile = await scrapeProfileData({ includeActivity: false });

    expect(profile?.activities).toBeUndefined();
    expect(profile?.userPosts).toBeUndefined();
    expect(profile?.engagedPosts).toBeUndefined();
  });
});

describe('Profile Scraper - Helper Functions', () => {
  it('should extract numbers from text correctly', async () => {
    const { extractNumberFromText } = await import('../helpers');

    expect(extractNumberFromText('99 endorsements')).toBe(99);
    expect(extractNumberFromText('1,234 connections')).toBe(1234);
    expect(extractNumberFromText('No numbers here')).toBe(0);
    expect(extractNumberFromText('500+')).toBe(500);
  });

  it('should parse date strings into year ranges', async () => {
    const { parseDateString } = await import('../helpers');

    const test1 = parseDateString('2015 - 2019');
    expect(test1).toEqual({ startYear: 2015, endYear: 2019 });

    const test2 = parseDateString('2020 - Present');
    expect(test2.startYear).toBe(2020);
    expect(test2.endYear).toBeGreaterThanOrEqual(2024);

    const test3 = parseDateString('2018');
    expect(test3).toEqual({ startYear: 2018, endYear: 2018 });

    const test4 = parseDateString('Invalid date');
    expect(test4).toEqual({ startYear: undefined, endYear: undefined });
  });

  it('should wait for element to appear in DOM', async () => {
    const { waitForElement } = await import('../helpers');

    // Element not present initially
    const promise = waitForElement('.test-element', 100);

    // Add element after 50ms
    setTimeout(() => {
      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);
    }, 50);

    const element = await promise;
    expect(element).toBeDefined();
  });

  it('should timeout when element never appears', async () => {
    const { waitForElement } = await import('../helpers');

    await expect(waitForElement('.non-existent', 100)).rejects.toThrow();
  });
});
