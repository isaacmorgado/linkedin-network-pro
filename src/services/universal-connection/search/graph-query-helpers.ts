/**
 * Graph Query Helper Functions
 * Filtering and reasoning generation
 */

import type { NetworkNode } from '@/types';
import type { SearchQuery } from '@/types/search';
import { extractCurrentCompany, extractCurrentRole, calculateExperienceYears } from './graph-query-scoring';

/**
 * Check if node matches query and filters
 */
export function matchesFilters(
  node: NetworkNode,
  query: string,
  filters?: SearchQuery['filters']
): boolean {
  // Check keyword match in name, headline, or company
  const queryLower = query.toLowerCase();
  const keywordMatch =
    !query || // Empty query matches all
    node.profile.name.toLowerCase().includes(queryLower) ||
    node.profile.headline?.toLowerCase().includes(queryLower) ||
    extractCurrentCompany(node)?.toLowerCase().includes(queryLower) ||
    extractCurrentRole(node)?.toLowerCase().includes(queryLower) ||
    node.profile.skills.some(skill => skill.name.toLowerCase().includes(queryLower));

  if (!keywordMatch) {
    return false;
  }

  // Check company filter
  if (filters?.company) {
    const currentCompany = extractCurrentCompany(node);
    if (!currentCompany || !currentCompany.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }
  }

  // Check location filter
  if (filters?.location) {
    if (!node.profile.location || !node.profile.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
  }

  // Check role filter
  if (filters?.role) {
    const currentRole = extractCurrentRole(node);
    if (!currentRole || !currentRole.toLowerCase().includes(filters.role.toLowerCase())) {
      return false;
    }
  }

  // Check years of experience filter
  if (filters?.yearsExperience) {
    const totalYears = calculateExperienceYears(node);
    if (filters.yearsExperience.min && totalYears < filters.yearsExperience.min) {
      return false;
    }
    if (filters.yearsExperience.max && totalYears > filters.yearsExperience.max) {
      return false;
    }
  }

  return true;
}

/**
 * Generate reasoning explanation for why this result matches
 */
export function generateReasoning(
  node: NetworkNode,
  query: string,
  filters?: SearchQuery['filters']
): string {
  const reasons: string[] = [];

  // Connection degree
  const degreeText = node.degree === 1 ? '1st-degree connection' :
                     node.degree === 2 ? '2nd-degree connection' :
                     '3rd-degree connection';
  reasons.push(degreeText);

  // Keyword matches
  if (query) {
    const queryLower = query.toLowerCase();
    if (node.profile.name.toLowerCase().includes(queryLower)) {
      reasons.push('name match');
    }
    if (node.profile.headline?.toLowerCase().includes(queryLower)) {
      reasons.push('headline match');
    }
    const company = extractCurrentCompany(node);
    if (company?.toLowerCase().includes(queryLower)) {
      reasons.push(`works at ${company}`);
    }
  }

  // Filter matches
  if (filters?.company) {
    reasons.push(`at ${filters.company}`);
  }
  if (filters?.location) {
    reasons.push(`in ${filters.location}`);
  }
  if (filters?.role) {
    reasons.push(`${filters.role} role`);
  }

  // Profile quality
  if (node.profile.experience.length > 0) {
    reasons.push(`${node.profile.experience.length} experiences`);
  }
  if (node.profile.mutualConnections.length > 0) {
    reasons.push(`${node.profile.mutualConnections.length} mutual connections`);
  }

  return reasons.join(', ');
}
