/**
 * ATS Optimization Service
 * Analyzes and scores resumes for ATS compatibility
 */

import type { ATSOptimization } from '../types/resume';
import { log, LogCategory } from '../utils/logger';

/**
 * Calculate ATS optimization score for resume content
 * Based on research from ATS_Comprehensive_Research_Report.md
 */
export function calculateATSScore(
  content: string,
  extractedKeywords: string[],
  jobKeywords: string[]
): ATSOptimization {
  const endTrace = log.trace(LogCategory.SERVICE, 'calculateATSScore', {
    contentLength: content.length,
    extractedKeywords: extractedKeywords.length,
    jobKeywords: jobKeywords.length,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Starting ATS score calculation', {
      resumeWordCount: content.split(/\s+/).length,
      jobKeywordsToMatch: jobKeywords.length,
    });

    // Keyword analysis
    log.debug(LogCategory.SERVICE, 'Analyzing keyword matches');
    const keywordsUsed = findKeywordsInContent(content, jobKeywords);
    const keywordMatchRate = jobKeywords.length > 0
      ? (keywordsUsed.length / jobKeywords.length) * 100
      : 0;

    const totalWords = content.split(/\s+/).length;
    const keywordDensity = totalWords > 0
      ? (keywordsUsed.length / totalWords) * 100
      : 0;

    log.info(LogCategory.SERVICE, 'Keyword analysis complete', {
      keywordsUsed: keywordsUsed.length,
      matchRate: `${keywordMatchRate.toFixed(1)}%`,
      density: `${keywordDensity.toFixed(2)}%`,
    });

    // Format compliance checks
    log.debug(LogCategory.SERVICE, 'Checking format compliance');
    const formatCompliance = checkFormatCompliance(content);
    log.info(LogCategory.SERVICE, 'Format compliance checked', {
      score: formatCompliance.score,
      issues: Object.entries(formatCompliance).filter(([k, v]) => k !== 'score' && v === false).map(([k]) => k),
    });

    // Content quality checks
    log.debug(LogCategory.SERVICE, 'Checking content quality');
    const contentQuality = checkContentQuality(content);
    log.info(LogCategory.SERVICE, 'Content quality checked', {
      score: contentQuality.score,
      hasMetrics: contentQuality.hasMetrics,
      usesActionVerbs: contentQuality.usesActionVerbs,
      aprFormatUsed: contentQuality.aprFormatUsed,
    });

    // Calculate overall ATS score (weighted average)
    log.debug(LogCategory.SERVICE, 'Calculating overall ATS score (weighted average)');
    const overallATSScore = Math.round(
      keywordMatchRate * 0.4 +        // 40% weight on keyword matching
      formatCompliance.score * 0.3 +  // 30% weight on format
      contentQuality.score * 0.3       // 30% weight on content quality
    );

    log.info(LogCategory.SERVICE, 'Overall ATS score calculated', {
      score: overallATSScore,
      breakdown: {
        keywords: `${keywordMatchRate.toFixed(1)}% (40% weight)`,
        format: `${formatCompliance.score} (30% weight)`,
        quality: `${contentQuality.score} (30% weight)`,
      },
    });

    // Generate recommendations
    log.debug(LogCategory.SERVICE, 'Generating recommendations');
    const recommendations = generateRecommendations({
      keywordMatchRate,
      keywordDensity,
      formatCompliance,
      contentQuality,
    });
    log.info(LogCategory.SERVICE, `Generated ${recommendations.length} recommendations`);

    const result = {
      keywordDensity,
      keywordMatchRate,
      totalKeywords: extractedKeywords.length,
      keywordsUsed,
      formatCompliance,
      contentQuality,
      overallATSScore,
      recommendations,
    };

    log.info(LogCategory.SERVICE, 'ATS score calculation completed', {
      overallScore: overallATSScore,
      recommendationsCount: recommendations.length,
    });

    endTrace(result);
    return result;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'ATS score calculation failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Find which keywords from job description appear in resume content
 */
function findKeywordsInContent(content: string, keywords: string[]): string[] {
  const found: string[] = [];

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();

    // Check for exact match or word boundary match
    const regex = new RegExp(`\\b${escapeRegex(lowerKeyword)}\\b`, 'i');
    if (regex.test(content)) {
      found.push(keyword);
    }
  }

  return found;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check resume format compliance with ATS best practices
 * Based on research showing these factors cause the most parsing failures
 */
function checkFormatCompliance(content: string): ATSOptimization['formatCompliance'] {
  const checks = {
    singleColumn: true, // Assume true if content is plain text
    noHeadersFooters: true, // Assume true for plain text
    standardFont: true, // Assume true for plain text
    noGraphics: !content.match(/\[image\]|\[graphic\]|\[photo\]/i),
    noTables: !content.match(/\|.*\||\t.*\t/), // Simple table detection
  };

  // Calculate score (each check worth 20 points)
  let score = 0;
  if (checks.singleColumn) score += 20;
  if (checks.noHeadersFooters) score += 20;
  if (checks.standardFont) score += 20;
  if (checks.noGraphics) score += 20;
  if (checks.noTables) score += 20;

  return {
    ...checks,
    score,
  };
}

/**
 * Check content quality using resume best practices
 * Based on resume_best_practices_2024-2025.md research
 */
function checkContentQuality(content: string): ATSOptimization['contentQuality'] {
  const bullets = extractBullets(content);

  // Check for quantifiable metrics in bullets
  const bulletsWithMetrics = bullets.filter((bullet) =>
    hasQuantifiableMetric(bullet)
  );
  const hasMetrics = bulletsWithMetrics.length >= bullets.length * 0.7; // 70% threshold

  // Check for strong action verbs
  const usesActionVerbs = checkActionVerbs(bullets);

  // Check APR format (Action + Project + Result)
  const aprFormatUsed = checkAPRFormat(bullets);

  // Calculate average bullet length (15-20 words is ideal)
  const bulletLengths = bullets.map((b) => b.split(/\s+/).length);
  const avgLength = bulletLengths.length > 0
    ? bulletLengths.reduce((a, b) => a + b, 0) / bulletLengths.length
    : 0;
  const averageBulletLength = Math.round(avgLength);

  // Calculate score
  let score = 0;
  if (hasMetrics) score += 30;
  if (usesActionVerbs) score += 30;
  if (aprFormatUsed) score += 25;
  // Bullet length scoring (ideal 15-20 words)
  if (averageBulletLength >= 15 && averageBulletLength <= 20) {
    score += 15;
  } else if (averageBulletLength >= 10 && averageBulletLength <= 25) {
    score += 10;
  } else if (averageBulletLength > 0) {
    score += 5;
  }

  return {
    hasMetrics,
    usesActionVerbs,
    aprFormatUsed,
    averageBulletLength,
    score,
  };
}

/**
 * Extract bullet points from resume content
 */
function extractBullets(content: string): string[] {
  const bullets: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with bullet markers
    if (/^[•\-*]/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[•\-*]\s*/, ''));
    }
  }

  return bullets;
}

/**
 * Check if text contains quantifiable metrics
 * Numbers, percentages, dollar amounts, etc.
 */
function hasQuantifiableMetric(text: string): boolean {
  const patterns = [
    /\d+%/,                    // Percentages: 40%, 2.5%
    /\$[\d,]+/,                // Dollar amounts: $2M, $50,000
    /\d+[KMB]/,                // Abbreviated numbers: 50K, 2M, 1B
    /\d+[\s-]?(users|people|members|customers|clients)/i,
    /\d+x/,                    // Multipliers: 2x, 10x
    /\d+[\s-]?(seconds|minutes|hours|days|weeks|months|years)/i,
    /increased|decreased|improved|reduced.*?\d+/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Check if bullets use strong action verbs
 * Based on resume best practices research
 */
function checkActionVerbs(bullets: string[]): boolean {
  if (bullets.length === 0) return false;

  const strongVerbs = [
    // Leadership
    'led', 'managed', 'directed', 'orchestrated', 'spearheaded', 'championed',
    'coordinated', 'supervised', 'mentored', 'coached', 'trained',

    // Achievement
    'achieved', 'exceeded', 'surpassed', 'outperformed', 'delivered',
    'generated', 'produced', 'increased', 'improved', 'enhanced', 'optimized',
    'boosted', 'accelerated', 'maximized',

    // Innovation
    'pioneered', 'innovated', 'designed', 'launched', 'created', 'developed',
    'engineered', 'architected', 'transformed', 'revolutionized',

    // Problem-solving
    'resolved', 'streamlined', 'simplified', 'restructured', 'overhauled',
    'diagnosed', 'analyzed', 'evaluated',

    // Technical
    'implemented', 'deployed', 'automated', 'integrated', 'programmed',
    'coded', 'built', 'configured', 'migrated',
  ];

  const bulletsWithStrongVerbs = bullets.filter((bullet) => {
    const firstWord = bullet.split(/\s+/)[0].toLowerCase();
    return strongVerbs.includes(firstWord);
  });

  // At least 60% of bullets should start with strong verbs
  return bulletsWithStrongVerbs.length >= bullets.length * 0.6;
}

/**
 * Check if bullets follow APR format
 * Action + Project/Problem + Result
 */
function checkAPRFormat(bullets: string[]): boolean {
  if (bullets.length === 0) return false;

  const bulletsWithAPR = bullets.filter((bullet) => {
    // Has action verb (checked by first word)
    const hasAction = /^[A-Z][a-z]+/.test(bullet);

    // Has context/project (long enough and has descriptive content)
    const hasProject = bullet.split(/\s+/).length >= 10;

    // Has result (contains metrics or outcome indicators)
    const hasResult = hasQuantifiableMetric(bullet) ||
                     /resulting in|leading to|which|thereby/i.test(bullet);

    return hasAction && hasProject && hasResult;
  });

  // At least 50% of bullets should follow APR format
  return bulletsWithAPR.length >= bullets.length * 0.5;
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateRecommendations(analysis: {
  keywordMatchRate: number;
  keywordDensity: number;
  formatCompliance: ATSOptimization['formatCompliance'];
  contentQuality: ATSOptimization['contentQuality'];
}): string[] {
  const recommendations: string[] = [];

  // Keyword recommendations
  if (analysis.keywordMatchRate < 65) {
    recommendations.push(
      `❌ Low keyword match (${Math.round(analysis.keywordMatchRate)}%). Add more keywords from job description.`
    );
  } else if (analysis.keywordMatchRate < 75) {
    recommendations.push(
      `⚠️ Keyword match could be better (${Math.round(analysis.keywordMatchRate)}%). Target 75-80%.`
    );
  } else {
    recommendations.push(
      `✅ Excellent keyword match (${Math.round(analysis.keywordMatchRate)}%)!`
    );
  }

  // Keyword density
  if (analysis.keywordDensity < 2) {
    recommendations.push('⚠️ Keyword density too low. Naturally incorporate more relevant keywords.');
  } else if (analysis.keywordDensity > 3.5) {
    recommendations.push('⚠️ Keyword density too high. Avoid keyword stuffing.');
  }

  // Format recommendations
  if (!analysis.formatCompliance.noTables) {
    recommendations.push('❌ Remove tables - they confuse ATS parsers.');
  }
  if (!analysis.formatCompliance.noGraphics) {
    recommendations.push('❌ Remove graphics/images - ATS cannot read them.');
  }

  // Content quality recommendations
  if (!analysis.contentQuality.hasMetrics) {
    recommendations.push('❌ Add quantifiable metrics to at least 70% of bullets (numbers, %, $, timeframes).');
  }
  if (!analysis.contentQuality.usesActionVerbs) {
    recommendations.push('⚠️ Use stronger action verbs (led, achieved, increased, etc.).');
  }
  if (!analysis.contentQuality.aprFormatUsed) {
    recommendations.push('⚠️ Use APR format: Action + Project + Result for better impact.');
  }

  // Bullet length
  const { averageBulletLength } = analysis.contentQuality;
  if (averageBulletLength < 10) {
    recommendations.push('⚠️ Bullets too short. Add more context (15-20 words ideal).');
  } else if (averageBulletLength > 25) {
    recommendations.push('⚠️ Bullets too long. Condense to 15-20 words for readability.');
  }

  // If resume is excellent
  if (recommendations.length === 1 && recommendations[0].startsWith('✅')) {
    recommendations.push('✅ Format compliance looks great!');
    recommendations.push('✅ Content quality is excellent!');
  }

  return recommendations;
}

/**
 * Quick ATS score check (for displaying score badge)
 */
export function getATSScoreLevel(score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  label: string;
} {
  const endTrace = log.trace(LogCategory.SERVICE, 'getATSScoreLevel', { score });

  try {
    let result;
    if (score >= 80) {
      result = { level: 'excellent' as const, color: '#34C759', label: 'Excellent' };
    } else if (score >= 65) {
      result = { level: 'good' as const, color: '#0077B5', label: 'Good' };
    } else if (score >= 50) {
      result = { level: 'fair' as const, color: '#FF9500', label: 'Needs Work' };
    } else {
      result = { level: 'poor' as const, color: '#FF3B30', label: 'Poor' };
    }

    log.debug(LogCategory.SERVICE, 'ATS score level determined', {
      score,
      level: result.level,
      label: result.label,
    });

    endTrace(result);
    return result;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'ATS score level determination failed', error as Error);
    endTrace();
    throw error;
  }
}
