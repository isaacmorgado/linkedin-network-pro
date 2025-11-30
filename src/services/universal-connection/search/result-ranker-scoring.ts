/**
 * Result Ranker Scoring Logic
 * Weight calculation functions for ranking search results
 */

import type { SearchResult } from '@/types/search';
import { networkDB } from '@/lib/storage/network-db';

/**
 * Score breakdown interface
 */
export interface ScoreBreakdown {
  total: number;
  connectionWeight: number;
  keywordWeight: number;
  completenessWeight: number;
  activityWeight: number;
}

/**
 * Calculate enhanced match score with detailed breakdown
 */
export async function calculateEnhancedScore(
  result: SearchResult,
  query: string
): Promise<ScoreBreakdown> {
  // 1. Connection Degree Weight (40 points max)
  const connectionWeight = calculateConnectionWeight(result.connectionDegree);

  // 2. Keyword Match Weight (30 points max)
  const keywordWeight = calculateKeywordWeight(result, query);

  // 3. Profile Completeness Weight (20 points max)
  const completenessWeight = calculateCompletenessWeight(result);

  // 4. Activity Weight (10 points max)
  const activityWeight = await calculateActivityWeight(result);

  // Calculate total with formula: 0.4c + 0.3k + 0.2p + 0.1a
  const total = Math.round(
    connectionWeight * 0.4 +
    keywordWeight * 0.3 +
    completenessWeight * 0.2 +
    activityWeight * 0.1
  );

  return {
    total: Math.min(total, 100),
    connectionWeight,
    keywordWeight,
    completenessWeight,
    activityWeight,
  };
}

/**
 * Calculate connection degree weight
 * 1st degree = 100, 2nd = 75, 3rd = 50
 */
function calculateConnectionWeight(degree: number): number {
  switch (degree) {
    case 1:
      return 100;
    case 2:
      return 75;
    case 3:
      return 50;
    default:
      return 25; // 4th+ degree or unknown
  }
}

/**
 * Calculate keyword match weight (0-100)
 * Considers matches in name, headline, company, role
 */
function calculateKeywordWeight(result: SearchResult, query: string): number {
  if (!query) return 50; // Neutral score for empty query

  const queryLower = query.toLowerCase();
  let score = 0;
  let matchCount = 0;

  // Name match (highest priority)
  if (result.name.toLowerCase().includes(queryLower)) {
    score += 100;
    matchCount++;
  }

  // Headline match
  if (result.headline?.toLowerCase().includes(queryLower)) {
    score += 80;
    matchCount++;
  }

  // Company match
  if (result.company?.toLowerCase().includes(queryLower)) {
    score += 70;
    matchCount++;
  }

  // Role match
  if (result.role?.toLowerCase().includes(queryLower)) {
    score += 70;
    matchCount++;
  }

  // Multiple keywords bonus (split on spaces)
  const keywords = query.toLowerCase().split(/\s+/);
  if (keywords.length > 1) {
    const allFieldsText = [
      result.name,
      result.headline,
      result.company,
      result.role,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchedKeywords = keywords.filter((kw) =>
      allFieldsText.includes(kw)
    );
    const keywordMatchRatio = matchedKeywords.length / keywords.length;
    score += keywordMatchRatio * 50; // Up to 50 bonus points
    matchCount++;
  }

  // Average if multiple matches, cap at 100
  return matchCount > 0
    ? Math.min(Math.round(score / matchCount), 100)
    : 0;
}

/**
 * Calculate profile completeness weight (0-100)
 * More complete profiles = higher score
 */
function calculateCompletenessWeight(result: SearchResult): number {
  let score = 0;

  // Name is required (already present)
  score += 10;

  // Headline (important for context)
  if (result.headline && result.headline.length > 0) {
    score += 25;
  }

  // Company (key filter)
  if (result.company && result.company.length > 0) {
    score += 25;
  }

  // Role (helps with matching)
  if (result.role && result.role.length > 0) {
    score += 20;
  }

  // Path availability (indicates data quality)
  if (result.pathAvailable) {
    score += 20;
  }

  return Math.min(score, 100);
}

/**
 * Calculate activity weight (0-100)
 * Checks for recent activities (last 30 days)
 */
async function calculateActivityWeight(result: SearchResult): Promise<number> {
  try {
    // Check if person has recent activities
    const activities = await networkDB.activities
      .where('actorId')
      .equals(result.profileId)
      .toArray();

    if (activities.length === 0) {
      return 30; // Baseline score (no activity data)
    }

    // Check for recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const recentActivities = activities.filter(
      (activity) => activity.timestamp > thirtyDaysAgoISO
    );

    // Score based on recent activity
    if (recentActivities.length === 0) {
      return 40; // No recent activity
    } else if (recentActivities.length < 5) {
      return 60; // Some recent activity
    } else if (recentActivities.length < 10) {
      return 80; // Active user
    } else {
      return 100; // Very active user
    }
  } catch (error) {
    console.error('[ResultRanker] Failed to calculate activity weight:', error);
    return 30; // Default to baseline on error
  }
}
