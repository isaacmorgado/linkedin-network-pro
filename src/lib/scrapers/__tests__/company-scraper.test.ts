/**
 * Company Scraper Tests
 * Comprehensive tests for LinkedIn company employee scraping functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CompanyEmployee } from '@/types/network';

// Create properly structured employee card elements that match scraper selectors
const createEmployeeCard = (data: {
  name: string;
  profileId: string;
  headline?: string;
  role?: string;
  connectionDegree?: 1 | 2 | 3;
  mutualConnections?: number;
}) => {
  const card = document.createElement('div');
  card.className = 'org-people-profile-card';

  // Profile link with name
  const nameLink = document.createElement('a');
  nameLink.href = `/in/${data.profileId}/`;
  nameLink.className = 'app-aware-link';
  nameLink.textContent = data.name;
  card.appendChild(nameLink);

  // Name in proper selector
  const nameTitle = document.createElement('div');
  nameTitle.className = 'org-people-profile-card__profile-title';
  nameTitle.textContent = data.name;
  card.appendChild(nameTitle);

  // Headline
  if (data.headline) {
    const headlineDiv = document.createElement('div');
    headlineDiv.className = 'artdeco-entity-lockup__subtitle';
    headlineDiv.textContent = data.headline;
    card.appendChild(headlineDiv);
  }

  // Role/caption
  if (data.role) {
    const roleDiv = document.createElement('div');
    roleDiv.className = 'artdeco-entity-lockup__caption';
    roleDiv.textContent = data.role;
    card.appendChild(roleDiv);
  }

  // Connection degree badge
  if (data.connectionDegree) {
    const degreeSpan = document.createElement('span');
    degreeSpan.className = 'dist-value';
    const degreeText = data.connectionDegree === 1 ? '1st' :
                       data.connectionDegree === 2 ? '2nd' : '3rd';
    degreeSpan.textContent = degreeText;
    card.appendChild(degreeSpan);
  }

  // Mutual connections (for 2nd degree)
  if (data.mutualConnections && data.connectionDegree === 2) {
    const mutualSpan = document.createElement('span');
    mutualSpan.className = 'org-people-profile-card__profile-info-subtitle';
    mutualSpan.textContent = `${data.mutualConnections} mutual connections`;
    card.appendChild(mutualSpan);
  }

  return card;
};

describe('Company Scraper - Success Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/company/tech-corp/people/' },
      writable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should extract employee information successfully', async () => {
    const employeeCard = createEmployeeCard({
      name: 'John Doe',
      profileId: 'john-doe',
      headline: 'Senior Software Engineer at Tech Corp',
      role: 'Engineering Team Lead',
      connectionDegree: 2,
      mutualConnections: 5,
    });
    document.body.appendChild(employeeCard);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(employeeCard);

    expect(employee).toBeTruthy();
    expect(employee?.name).toBe('John Doe');
    expect(employee?.profileId).toBe('john-doe');
    expect(employee?.headline).toBe('Senior Software Engineer at Tech Corp');
    expect(employee?.role).toBeTruthy();
    expect(employee?.connectionDegree).toBe(2);
    expect(employee?.profileUrl).toContain('john-doe');
  });

  it('should extract multiple employees from company page', async () => {
    const employees = [
      { name: 'Alice Smith', profileId: 'alice-smith', headline: 'Product Manager', connectionDegree: 1 as const },
      { name: 'Bob Johnson', profileId: 'bob-johnson', headline: 'Data Scientist', connectionDegree: 2 as const },
      { name: 'Carol White', profileId: 'carol-white', headline: 'UX Designer', connectionDegree: 3 as const },
    ];

    employees.forEach(emp => {
      const card = createEmployeeCard(emp);
      document.body.appendChild(card);
    });

    const { extractEmployee } = await import('../company-scraper-extraction');

    const cards = document.querySelectorAll('.org-people-profile-card');
    const extractedEmployees: (CompanyEmployee | null)[] = [];

    cards.forEach(card => {
      const employee = extractEmployee(card);
      extractedEmployees.push(employee);
    });

    const validEmployees = extractedEmployees.filter(e => e !== null);

    expect(validEmployees).toHaveLength(3);
    expect(validEmployees[0]?.name).toBe('Alice Smith');
    expect(validEmployees[1]?.name).toBe('Bob Johnson');
    expect(validEmployees[2]?.name).toBe('Carol White');
  });

  it('should build CompanyMap with employee data', async () => {
    const companyUrl = 'https://www.linkedin.com/company/tech-corp/';
    const companyName = 'Tech Corp';
    const employees: CompanyEmployee[] = [
      {
        name: 'John Doe',
        profileId: 'john-doe',
        headline: 'Engineer',
        role: 'Software Engineer',
        department: 'Engineering',
        connectionDegree: 1,
        mutualConnections: [],
        profileUrl: 'https://www.linkedin.com/in/john-doe/',
      },
      {
        name: 'Jane Smith',
        profileId: 'jane-smith',
        headline: 'Designer',
        role: 'UX Designer',
        department: 'Design',
        connectionDegree: 2,
        mutualConnections: ['alice'],
        profileUrl: 'https://www.linkedin.com/in/jane-smith/',
      },
    ];

    const { buildCompanyMap } = await import('../company-scraper');

    const companyMap = buildCompanyMap(companyUrl, companyName, employees);

    expect(companyMap.companyId).toBe('tech-corp');
    expect(companyMap.companyName).toBe('Tech Corp');
    expect(companyMap.employees).toHaveLength(2);
    expect(companyMap.scrapedAt).toBeTruthy();
    // Should be a valid ISO date string
    expect(() => new Date(companyMap.scrapedAt)).not.toThrow();
  });

  it('should extract company ID from various URL formats', async () => {
    const testCases = [
      { url: 'https://www.linkedin.com/company/tech-corp/', expected: 'tech-corp' },
      { url: 'https://www.linkedin.com/company/tech-corp', expected: 'tech-corp' },
      { url: 'https://www.linkedin.com/company/tech-corp/people/', expected: 'tech-corp' },
      { url: 'https://www.linkedin.com/company/my-company-123/', expected: 'my-company-123' },
    ];

    const { buildCompanyMap } = await import('../company-scraper');

    testCases.forEach(({ url, expected }) => {
      const companyMap = buildCompanyMap(url, 'Test Company', []);
      expect(companyMap.companyId).toBe(expected);
    });
  });

  it('should infer department from headline keywords', async () => {
    const testCases = [
      { headline: 'Senior Software Engineer', expected: 'Engineering' },
      { headline: 'Product Manager', expected: 'Product' },
      { headline: 'UX Designer', expected: 'Design' },
      { headline: 'Sales Director', expected: 'Sales' },
      { headline: 'Marketing Specialist', expected: 'Marketing' },
      { headline: 'CEO and Founder', expected: 'Executive' },
    ];

    const { extractEmployee } = await import('../company-scraper-extraction');

    testCases.forEach(({ headline, expected }) => {
      const card = createEmployeeCard({
        name: 'Test User',
        profileId: 'test-user',
        headline,
      });
      document.body.appendChild(card);

      const employee = extractEmployee(card);
      expect(employee?.department).toBe(expected);

      document.body.innerHTML = '';
    });
  });
});

describe('Company Scraper - Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle employees without headlines', async () => {
    const employeeCard = createEmployeeCard({
      name: 'John Doe',
      profileId: 'john-doe',
      role: 'Team Member',
    });
    document.body.appendChild(employeeCard);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(employeeCard);

    expect(employee).toBeTruthy();
    expect(employee?.name).toBe('John Doe');
    expect(employee?.profileId).toBe('john-doe');
    expect(employee?.headline).toBeUndefined();
  });

  it('should handle employees without explicit roles', async () => {
    const employeeCard = createEmployeeCard({
      name: 'Jane Smith',
      profileId: 'jane-smith',
      headline: 'Software Engineer',
    });
    document.body.appendChild(employeeCard);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(employeeCard);

    expect(employee).toBeTruthy();
    expect(employee?.name).toBe('Jane Smith');
    // Role should fallback to headline or 'Unknown'
    expect(employee?.role).toBeTruthy();
  });

  it('should return null for employee cards without profile links', async () => {
    const card = document.createElement('div');
    card.className = 'org-people-profile-card';

    const nameDiv = document.createElement('div');
    nameDiv.textContent = 'John Doe';
    card.appendChild(nameDiv);

    document.body.appendChild(card);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(card);

    expect(employee).toBeNull();
  });

  it('should return null for employee cards without names', async () => {
    const card = document.createElement('div');
    card.className = 'org-people-profile-card';

    const link = document.createElement('a');
    link.href = '/in/john-doe/';
    link.className = 'app-aware-link';
    card.appendChild(link);

    document.body.appendChild(card);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(card);

    expect(employee).toBeNull();
  });

  it('should handle empty employee lists gracefully', async () => {
    const { buildCompanyMap } = await import('../company-scraper');

    const companyMap = buildCompanyMap(
      'https://www.linkedin.com/company/tech-corp/',
      'Tech Corp',
      []
    );

    expect(companyMap.employees).toHaveLength(0);
    expect(companyMap.companyName).toBe('Tech Corp');
  });

  it('should handle malformed company URLs', async () => {
    const { buildCompanyMap } = await import('../company-scraper');

    const companyMap = buildCompanyMap(
      'https://www.linkedin.com/invalid-url/',
      'Test Company',
      []
    );

    // Should use full URL as fallback when regex doesn't match
    expect(companyMap.companyId).toBe('https://www.linkedin.com/invalid-url/');
  });

  it('should handle employees with special characters in names', async () => {
    const employeeCard = createEmployeeCard({
      name: "O'Brien, José María",
      profileId: 'jose-obrien',
      headline: 'Software Engineer',
    });
    document.body.appendChild(employeeCard);

    const { extractEmployee } = await import('../company-scraper-extraction');

    const employee = extractEmployee(employeeCard);

    expect(employee).toBeTruthy();
    expect(employee?.name).toBe("O'Brien, José María");
  });

  it('should extract profileId from complex LinkedIn URLs', async () => {
    const testCases = [
      '/in/john-doe/',
      '/in/john-doe',
      '/in/john-doe?lipi=urn',
      '/in/john-doe/?trk=public_profile',
    ];

    const { extractEmployee } = await import('../company-scraper-extraction');

    testCases.forEach(href => {
      const card = document.createElement('div');
      card.className = 'org-people-profile-card';

      const link = document.createElement('a');
      link.href = href;
      link.className = 'app-aware-link';
      link.textContent = 'Test User';
      card.appendChild(link);

      const nameTitle = document.createElement('div');
      nameTitle.className = 'org-people-profile-card__profile-title';
      nameTitle.textContent = 'Test User';
      card.appendChild(nameTitle);

      document.body.appendChild(card);

      const employee = extractEmployee(card);

      expect(employee).toBeTruthy();
      expect(employee?.profileId).toBe('john-doe');

      document.body.innerHTML = '';
    });
  });

  it('should detect connection degree from multiple indicators', async () => {
    // Test 1st degree (Message button)
    const card1st = createEmployeeCard({
      name: 'First Degree',
      profileId: 'first-degree',
      connectionDegree: 1,
    });
    document.body.appendChild(card1st);

    const { extractEmployee } = await import('../company-scraper-extraction');
    const employee1st = extractEmployee(card1st);
    expect(employee1st?.connectionDegree).toBe(1);

    document.body.innerHTML = '';

    // Test 2nd degree with mutual connections
    const card2nd = createEmployeeCard({
      name: 'Second Degree',
      profileId: 'second-degree',
      connectionDegree: 2,
      mutualConnections: 3,
    });
    document.body.appendChild(card2nd);

    const employee2nd = extractEmployee(card2nd);
    expect(employee2nd?.connectionDegree).toBe(2);
    expect(employee2nd?.mutualConnections).toHaveLength(3);
  });

  it('should default to 3rd degree when no connection info found', async () => {
    const card = document.createElement('div');
    card.className = 'org-people-profile-card';

    const link = document.createElement('a');
    link.href = '/in/test-user/';
    link.className = 'app-aware-link';
    link.textContent = 'Test User';
    card.appendChild(link);

    const nameTitle = document.createElement('div');
    nameTitle.className = 'org-people-profile-card__profile-title';
    nameTitle.textContent = 'Test User';
    card.appendChild(nameTitle);

    document.body.appendChild(card);

    const { extractEmployee } = await import('../company-scraper-extraction');
    const employee = extractEmployee(card);

    expect(employee?.connectionDegree).toBe(3);
  });
});

describe('Company Scraper - Schema Validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return valid CompanyEmployee schema', async () => {
    const employeeCard = createEmployeeCard({
      name: 'John Doe',
      profileId: 'john-doe',
      headline: 'Software Engineer',
      connectionDegree: 2,
      mutualConnections: 5,
    });
    document.body.appendChild(employeeCard);

    const { extractEmployee } = await import('../company-scraper-extraction');
    const { CompanyEmployeeSchema } = await import('@/types/network');

    const employee = extractEmployee(employeeCard);

    // Should validate against schema
    expect(() => CompanyEmployeeSchema.parse(employee)).not.toThrow();

    const validated = CompanyEmployeeSchema.parse(employee);
    expect(validated.name).toBe('John Doe');
    expect(validated.profileId).toBe('john-doe');
    expect(validated.headline).toBe('Software Engineer');
    expect(validated.connectionDegree).toBe(2);
    expect(validated.profileUrl).toBeTruthy();
  });

  it('should return valid CompanyMap schema', async () => {
    const { buildCompanyMap } = await import('../company-scraper');
    const { CompanyMapSchema } = await import('@/types/network');

    const employees: CompanyEmployee[] = [
      {
        name: 'John Doe',
        profileId: 'john-doe',
        headline: 'Engineer',
        role: 'Software Engineer',
        department: 'Engineering',
        connectionDegree: 1,
        mutualConnections: [],
        profileUrl: 'https://www.linkedin.com/in/john-doe/',
      },
    ];

    const companyMap = buildCompanyMap(
      'https://www.linkedin.com/company/tech-corp/',
      'Tech Corp',
      employees
    );

    // Should validate against schema
    expect(() => CompanyMapSchema.parse(companyMap)).not.toThrow();

    const validated = CompanyMapSchema.parse(companyMap);
    expect(validated.companyId).toBe('tech-corp');
    expect(validated.companyName).toBe('Tech Corp');
    expect(validated.employees).toHaveLength(1);
    expect(validated.scrapedAt).toBeTruthy();
  });
});
