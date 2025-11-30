/**
 * Query Extractors
 * Extract specific filter types from natural language queries
 */

import { capitalizeCompanyName, capitalizeLocation } from './query-formatters';

/**
 * Extract company name from query
 * Patterns: "at Netflix", "from Google", "works at Microsoft"
 */
export function extractCompany(query: string): string | null {
  // Pattern 1: "at [Company]"
  const atPattern = /\bat\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:in|with|who|that|and|or|,)|$)/i;
  let match = query.match(atPattern);
  if (match?.[1]) {
    return capitalizeCompanyName(match[1].trim());
  }

  // Pattern 2: "from [Company]"
  const fromPattern = /\bfrom\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:in|with|who|that|and|or|,)|$)/i;
  match = query.match(fromPattern);
  if (match?.[1]) {
    return capitalizeCompanyName(match[1].trim());
  }

  // Pattern 3: "works at [Company]" or "working at [Company]"
  const worksAtPattern = /\bworks?\s+at\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:in|with|who|that|and|or|,)|$)/i;
  match = query.match(worksAtPattern);
  if (match?.[1]) {
    return capitalizeCompanyName(match[1].trim());
  }

  return null;
}

/**
 * Extract location from query
 * Patterns: "in SF", "in San Francisco", "based in NYC", "located in Boston"
 */
export function extractLocation(query: string): string | null {
  // Pattern 1: "in [Location]"
  const inPattern = /\bin\s+([A-Za-z\s.-]+?)(?:\s+(?:at|with|who|that|and|or|,)|$)/i;
  let match = query.match(inPattern);
  if (match?.[1]) {
    return capitalizeLocation(match[1].trim());
  }

  // Pattern 2: "based in [Location]"
  const basedPattern = /\bbased\s+in\s+([A-Za-z\s.-]+?)(?:\s+(?:at|with|who|that|and|or|,)|$)/i;
  match = query.match(basedPattern);
  if (match?.[1]) {
    return capitalizeLocation(match[1].trim());
  }

  // Pattern 3: "located in [Location]"
  const locatedPattern = /\blocated\s+in\s+([A-Za-z\s.-]+?)(?:\s+(?:at|with|who|that|and|or|,)|$)/i;
  match = query.match(locatedPattern);
  if (match?.[1]) {
    return capitalizeLocation(match[1].trim());
  }

  return null;
}

/**
 * Extract years of experience
 * Patterns: "5+ years", "3-5 years", "5 years experience", "with 5 years"
 */
export function extractYearsExperience(query: string): { min?: number; max?: number } | null {
  // Pattern 1: "5+ years" or "5 + years"
  const plusPattern = /(\d+)\s*\+\s*years?/i;
  let match = query.match(plusPattern);
  if (match?.[1]) {
    return { min: parseInt(match[1], 10) };
  }

  // Pattern 2: "3-5 years" or "3 to 5 years"
  const rangePattern = /(\d+)\s*(?:-|to)\s*(\d+)\s*years?/i;
  match = query.match(rangePattern);
  if (match?.[1] && match?.[2]) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10),
    };
  }

  // Pattern 3: "5 years" or "5 years experience"
  const exactPattern = /(\d+)\s*years?(?:\s+(?:of\s+)?experience)?/i;
  match = query.match(exactPattern);
  if (match?.[1]) {
    const years = parseInt(match[1], 10);
    return { min: years, max: years };
  }

  return null;
}

/**
 * Extract connection degree
 * Patterns: "1st degree", "2nd degree", "3rd degree", "first degree"
 */
export function extractConnectionDegree(query: string): number[] | null {
  const degrees: number[] = [];

  // Pattern 1: "1st", "2nd", "3rd"
  if (/\b1st\s+degree/i.test(query) || /\bfirst\s+degree/i.test(query)) {
    degrees.push(1);
  }
  if (/\b2nd\s+degree/i.test(query) || /\bsecond\s+degree/i.test(query)) {
    degrees.push(2);
  }
  if (/\b3rd\s+degree/i.test(query) || /\bthird\s+degree/i.test(query)) {
    degrees.push(3);
  }

  // Pattern 2: "1st connections", "2nd connections"
  if (/\b1st\s+connections?/i.test(query)) {
    degrees.push(1);
  }
  if (/\b2nd\s+connections?/i.test(query)) {
    degrees.push(2);
  }
  if (/\b3rd\s+connections?/i.test(query)) {
    degrees.push(3);
  }

  // Pattern 3: Direct mentions
  if (/\bdirect\s+connections?/i.test(query)) {
    degrees.push(1);
  }

  return degrees.length > 0 ? degrees : null;
}

/**
 * Extract role/seniority level
 * Patterns: "senior engineers", "junior developers", "lead designer"
 */
export function extractRole(query: string): string | null {
  const seniorityLevels = [
    'senior', 'sr', 'junior', 'jr', 'lead', 'principal',
    'staff', 'entry level', 'mid level', 'executive', 'chief',
    'head of', 'vp', 'director', 'manager', 'associate'
  ];

  for (const level of seniorityLevels) {
    const pattern = new RegExp(`\\b${level}\\b`, 'i');
    if (pattern.test(query)) {
      return level.toLowerCase();
    }
  }

  return null;
}

/**
 * Build clean query string by removing extracted filter keywords
 */
export function buildCleanQuery(
  query: string,
  extracted: {
    company: string | null;
    location: string | null;
    role: string | null;
    connectionDegree: number[] | null;
  }
): string {
  let clean = query;

  // Remove company mentions (use same stopping pattern as extraction)
  if (extracted.company) {
    clean = clean.replace(/\bat\s+[A-Za-z0-9\s&.'-]+?(?=\s+(?:in|with|who|that|and|or|,)|$)/gi, '');
    clean = clean.replace(/\bfrom\s+[A-Za-z0-9\s&.'-]+?(?=\s+(?:in|with|who|that|and|or|,)|$)/gi, '');
    clean = clean.replace(/\bworks?\s+at\s+[A-Za-z0-9\s&.'-]+?(?=\s+(?:in|with|who|that|and|or|,)|$)/gi, '');
  }

  // Remove location mentions (use same stopping pattern as extraction)
  if (extracted.location) {
    clean = clean.replace(/\bin\s+[A-Za-z\s.-]+?(?=\s+(?:at|with|who|that|and|or|,)|$)/gi, '');
    clean = clean.replace(/\bbased\s+in\s+[A-Za-z\s.-]+?(?=\s+(?:at|with|who|that|and|or|,)|$)/gi, '');
    clean = clean.replace(/\blocated\s+in\s+[A-Za-z\s.-]+?(?=\s+(?:at|with|who|that|and|or|,)|$)/gi, '');
  }

  // Remove experience mentions (order matters: most specific first)
  clean = clean.replace(/\bwith\s+\d+\s*\+\s*years?/gi, ''); // "with 5+ years"
  clean = clean.replace(/\bwith\s+\d+\s*(?:-|to)\s*\d+\s*years?/gi, ''); // "with 3-5 years"
  clean = clean.replace(/\bwith\s+\d+\s*years?/gi, ''); // "with 5 years"
  clean = clean.replace(/\d+\s*\+\s*years?/gi, ''); // "5+ years"
  clean = clean.replace(/\d+\s*(?:-|to)\s*\d+\s*years?/gi, ''); // "3-5 years"
  clean = clean.replace(/\d+\s*years?\s*(?:of\s+)?(?:experience)?/gi, ''); // "5 years experience"

  // Remove degree mentions
  clean = clean.replace(/\b(?:1st|2nd|3rd|first|second|third)\s+degree\s+connections?/gi, '');
  clean = clean.replace(/\b(?:1st|2nd|3rd|first|second|third)\s+(?:degree|connections?)/gi, '');
  clean = clean.replace(/\bdirect\s+connections?/gi, '');

  // Remove role/seniority if it was extracted
  if (extracted.role) {
    const rolePattern = new RegExp(`\\b${extracted.role}\\b`, 'gi');
    clean = clean.replace(rolePattern, '');
  }

  // Clean up whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  // Remove common filler words at start/end
  clean = clean.replace(/^(?:find|show|get|list|search|looking for)\s+/i, '');
  clean = clean.replace(/\s+(?:who|that|with)$/i, '');

  return clean;
}
