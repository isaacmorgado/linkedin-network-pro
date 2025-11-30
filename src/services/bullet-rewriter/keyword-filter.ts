/**
 * Keyword Filter
 * Filters keywords to only relevant ones based on context
 */

import type { Achievement } from '../../types/resume-tailoring';
import type { ExtractedFacts } from './types';

/**
 * Filter target keywords to only those that are relevant to the achievement
 */
export function filterRelevantKeywords(
  targetKeywords: string[],
  achievement: Achievement,
  facts: ExtractedFacts,
  allowImplied: boolean
): string[] {
  const relevant: string[] = [];
  const bullet = achievement.bullet.toLowerCase();

  for (const keyword of targetKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // RULE 1: Already mentioned in bullet (direct match)
    if (bullet.includes(lowerKeyword)) {
      relevant.push(keyword);
      continue;
    }

    // RULE 2: Already in achievement's skills
    if (achievement.skills.some(s => s.toLowerCase() === lowerKeyword)) {
      relevant.push(keyword);
      continue;
    }

    // RULE 3: Implied by the context (if allowed)
    if (allowImplied && isImpliedByContext(keyword, achievement, facts)) {
      relevant.push(keyword);
      continue;
    }
  }

  return relevant;
}

/**
 * Check if a keyword is implied by the achievement's context
 */
function isImpliedByContext(
  keyword: string,
  achievement: Achievement,
  _facts: ExtractedFacts
): boolean {
  const lowerKeyword = keyword.toLowerCase();
  const bullet = achievement.bullet.toLowerCase();

  // E-commerce implies certain technologies
  if (bullet.includes('e-commerce') || bullet.includes('ecommerce')) {
    if (['rest api', 'api', 'payment processing', 'checkout'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Web development implies certain tech
  if (bullet.includes('web') || bullet.includes('website')) {
    if (['html', 'css', 'javascript', 'responsive design'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Full-stack implies both frontend and backend
  if (bullet.includes('full-stack') || bullet.includes('fullstack')) {
    if (['frontend', 'backend', 'database', 'api'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Microservices implies certain patterns
  if (bullet.includes('microservice')) {
    if (['docker', 'kubernetes', 'rest', 'api', 'distributed systems'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Data science projects imply tools
  if (bullet.includes('machine learning') || bullet.includes('data analysis')) {
    if (['python', 'data visualization', 'statistics'].includes(lowerKeyword)) {
      return true;
    }
  }

  return false;
}
