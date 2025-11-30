/**
 * Natural Language Query Parser
 * Extracts search intent and filters from natural language queries
 *
 * Examples:
 * - "HR reps at Netflix" → { query: "HR", filters: { company: "Netflix" }}
 * - "senior engineers in SF" → { query: "engineer", filters: { location: "SF", role: "senior" }}
 * - "2nd degree connections at Google" → { query: "", filters: { company: "Google", connectionDegree: [2] }}
 */

import type { SearchQuery } from '@/types/search';
import {
  extractCompany,
  extractLocation,
  extractYearsExperience,
  extractConnectionDegree,
  extractRole,
  buildCleanQuery,
} from './query-extractors';

/**
 * Parse natural language query into structured SearchQuery
 */
export function parseQuery(input: string): SearchQuery {
  const query = input.trim().toLowerCase();

  // Initialize filters
  const filters: SearchQuery['filters'] = {};

  // Extract company (after "at", "from", "works at")
  const company = extractCompany(query);
  if (company) {
    filters.company = company;
  }

  // Extract location (after "in", "based in", "located in")
  const location = extractLocation(query);
  if (location) {
    filters.location = location;
  }

  // Extract years of experience (patterns like "5+ years", "3-5 years")
  const yearsExperience = extractYearsExperience(query);
  if (yearsExperience) {
    filters.yearsExperience = yearsExperience;
  }

  // Extract connection degree (1st, 2nd, 3rd)
  const connectionDegree = extractConnectionDegree(query);
  if (connectionDegree) {
    filters.connectionDegree = connectionDegree;
  }

  // Extract role/seniority level
  const role = extractRole(query);
  if (role) {
    filters.role = role;
  }

  // Build clean query string (remove extracted filters)
  const cleanQuery = buildCleanQuery(query, {
    company,
    location,
    role,
    connectionDegree,
  });

  return {
    query: cleanQuery,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };
}

/**
 * Parse multiple queries (for batch processing)
 */
export function parseQueries(queries: string[]): SearchQuery[] {
  return queries.map(parseQuery);
}
