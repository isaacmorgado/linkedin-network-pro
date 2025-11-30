/**
 * Graph Query Scoring Logic
 * Extracted scoring functions for relevance and completeness
 */

import type { NetworkNode } from '@/types';
import type { SearchQuery } from '@/types/search';

/**
 * Calculate relevance match score (0-100)
 * Higher score = better match
 */
export function calculateMatchScore(
  node: NetworkNode,
  query: string,
  _filters?: SearchQuery['filters']
): number {
  let score = 0;

  // Connection degree weight (closer = higher)
  // 1st degree: 40 points, 2nd: 30 points, 3rd: 20 points
  const connectionWeight = node.degree === 1 ? 40 : node.degree === 2 ? 30 : 20;
  score += connectionWeight;

  // Keyword match weight (30 points max)
  const keywordWeight = calculateKeywordScore(node, query);
  score += keywordWeight * 0.3;

  // Profile completeness weight (20 points max)
  const completenessWeight = calculateCompletenessScore(node);
  score += completenessWeight * 0.2;

  // Activity weight (10 points max) - if we have activity data
  const activityWeight = node.activityScore || 0;
  score += activityWeight * 0.1;

  // Boost score if node has existing match score
  if (node.matchScore) {
    score += node.matchScore * 0.1; // Add up to 10 points from existing match
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate keyword match score (0-100)
 */
export function calculateKeywordScore(node: NetworkNode, query: string): number {
  if (!query) return 0;

  const queryLower = query.toLowerCase();
  let score = 0;
  let matches = 0;

  // Name match (exact = 100, contains = 75)
  if (node.profile.name.toLowerCase() === queryLower) {
    return 100;
  }
  if (node.profile.name.toLowerCase().includes(queryLower)) {
    score += 75;
    matches++;
  }

  // Headline match (contains = 50)
  if (node.profile.headline?.toLowerCase().includes(queryLower)) {
    score += 50;
    matches++;
  }

  // Company match (contains = 40)
  const company = extractCurrentCompany(node);
  if (company?.toLowerCase().includes(queryLower)) {
    score += 40;
    matches++;
  }

  // Role match (contains = 40)
  const role = extractCurrentRole(node);
  if (role?.toLowerCase().includes(queryLower)) {
    score += 40;
    matches++;
  }

  // Skills match (each = 20)
  const skillMatches = node.profile.skills.filter(skill =>
    skill.name.toLowerCase().includes(queryLower)
  );
  score += skillMatches.length * 20;
  matches += skillMatches.length;

  // Average if multiple matches
  return matches > 1 ? Math.min(Math.round(score / matches), 100) : Math.min(score, 100);
}

/**
 * Calculate profile completeness score (0-100)
 */
export function calculateCompletenessScore(node: NetworkNode): number {
  let score = 0;

  if (node.profile.name) score += 10;
  if (node.profile.headline) score += 15;
  if (node.profile.location) score += 10;
  if (node.profile.about) score += 15;
  if (node.profile.avatarUrl) score += 5;
  if (node.profile.experience.length > 0) score += 20;
  if (node.profile.education.length > 0) score += 10;
  if (node.profile.skills.length > 0) score += 15;

  return Math.min(score, 100);
}

/**
 * Extract current company from node profile
 */
export function extractCurrentCompany(node: NetworkNode): string | undefined {
  // Try to get from most recent experience
  if (node.profile.experience.length > 0) {
    return node.profile.experience[0]?.company;
  }
  return undefined;
}

/**
 * Extract current role from node profile
 */
export function extractCurrentRole(node: NetworkNode): string | undefined {
  // Try to get from most recent experience
  if (node.profile.experience.length > 0) {
    return node.profile.experience[0]?.title;
  }
  // Fallback to headline
  return node.profile.headline;
}

/**
 * Calculate total years of experience
 */
export function calculateExperienceYears(node: NetworkNode): number {
  // Simple approximation: count number of experiences
  // In production, would parse duration strings
  return node.profile.experience.length;
}
