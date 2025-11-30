/**
 * Fact Extractor
 * Extracts verifiable facts from bullet points
 */

import type { Achievement } from '../../types/resume-tailoring';
import type { ExtractedFacts } from './types';

/**
 * Extract verifiable facts from the original bullet
 */
export function extractFacts(achievement: Achievement): ExtractedFacts {
  const bullet = achievement.bullet;

  // Extract action (first verb-like word)
  const action = achievement.action || extractAction(bullet);

  // Extract object (main thing being acted upon)
  const object = achievement.object || extractObject(bullet);

  // Extract result/outcome
  const result = achievement.result;

  // Extract all metrics (numbers, percentages, scales)
  const metrics = extractMetrics(bullet, achievement.metrics);

  // Extract technologies
  const technologies = achievement.skills.filter(skill =>
    isTechnology(skill)
  );

  // Extract team scopes (e.g., "team of 5", "10 engineers")
  const teamScopes = extractTeamScopes(bullet);

  // Extract other specific claims
  const specificClaims = extractSpecificClaims(bullet);

  return {
    action,
    object,
    result,
    metrics,
    technologies,
    teamScopes,
    specificClaims,
  };
}

function extractAction(bullet: string): string {
  // Common action verbs in resume bullets
  const actionVerbs = [
    'built', 'developed', 'created', 'designed', 'implemented', 'led', 'managed',
    'optimized', 'improved', 'increased', 'reduced', 'launched', 'established',
    'architected', 'engineered', 'delivered', 'shipped', 'deployed', 'migrated',
    'refactored', 'maintained', 'collaborated', 'coordinated', 'analyzed',
  ];

  const lowerBullet = bullet.toLowerCase();
  for (const verb of actionVerbs) {
    if (lowerBullet.startsWith(verb) || lowerBullet.includes(` ${verb} `)) {
      return verb.charAt(0).toUpperCase() + verb.slice(1);
    }
  }

  // Fallback: first word
  return bullet.split(' ')[0];
}

function extractObject(bullet: string): string {
  // Remove action verb and extract the main object phrase
  const words = bullet.split(' ');

  // Skip first word (action) and take next 3-5 words
  const objectPhrase = words.slice(1, 6).join(' ');

  // Remove trailing punctuation
  return objectPhrase.replace(/[,;:]$/, '');
}

export function extractMetrics(bullet: string, achievementMetrics?: any[]): string[] {
  const metrics: string[] = [];

  // Extract from achievement.metrics if available
  if (achievementMetrics && achievementMetrics.length > 0) {
    for (const metric of achievementMetrics) {
      metrics.push(`${metric.value}${metric.unit}`);
    }
  }

  // Extract percentages (e.g., "40%", "100%")
  const percentageMatches = bullet.match(/\d+%/g);
  if (percentageMatches) {
    metrics.push(...percentageMatches);
  }

  // Extract numbers with context (e.g., "5 engineers", "10,000 users")
  const numberMatches = bullet.match(/\d+[,\d]*\s+\w+/g);
  if (numberMatches) {
    metrics.push(...numberMatches);
  }

  // Extract multipliers (e.g., "2x", "10x")
  const multiplierMatches = bullet.match(/\d+x/gi);
  if (multiplierMatches) {
    metrics.push(...multiplierMatches);
  }

  return [...new Set(metrics)]; // Remove duplicates
}

export function extractTeamScopes(bullet: string): string[] {
  const scopes: string[] = [];

  // Match patterns like "team of X", "X engineers", "X developers"
  const teamPatterns = [
    /team of \d+/gi,
    /\d+[\s-](?:person|people|member|engineer|developer|designer)s?/gi,
    /(?:led|managed|coordinated)\s+\d+/gi,
  ];

  for (const pattern of teamPatterns) {
    const matches = bullet.match(pattern);
    if (matches) {
      scopes.push(...matches);
    }
  }

  return scopes;
}

function extractSpecificClaims(bullet: string): string[] {
  const claims: string[] = [];

  // Extract time periods (e.g., "in 6 months", "within 3 weeks")
  const timeMatches = bullet.match(/(?:in|within)\s+\d+\s+(?:days?|weeks?|months?|years?)/gi);
  if (timeMatches) {
    claims.push(...timeMatches);
  }

  // Extract scales (e.g., "enterprise-scale", "production-level")
  const scaleMatches = bullet.match(/\b(?:enterprise|production|large-scale|high-traffic)\b/gi);
  if (scaleMatches) {
    claims.push(...scaleMatches);
  }

  return claims;
}

function isTechnology(skill: string): boolean {
  // Simple heuristic: technology names are usually capitalized or well-known
  const knownTechs = new Set([
    'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'redis',
    'graphql', 'rest', 'api', 'sql', 'nosql', 'git', 'jenkins', 'terraform',
  ]);

  return knownTechs.has(skill.toLowerCase()) || /^[A-Z]/.test(skill);
}
