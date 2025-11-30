/**
 * Hallucination Detector Service
 * Verifies that AI rewrites don't add fake information or inflate facts
 */

import type { FactVerification } from '../types/resume-tailoring';

/**
 * Extracted facts from a resume bullet for comparison
 */
export interface ExtractedFacts {
  actionVerbs: string[];
  objects: string[];
  technologies: string[];
  metrics: MetricInfo[];
  teamInvolvement: boolean;
  teamSize?: number;
  scope: string; // 'feature', 'product', 'platform', 'system', etc.
  employment?: 'internship' | 'full-time' | 'contract' | 'part-time';
  otherFacts: string[]; // catch-all for other specific claims
}

export interface MetricInfo {
  value: number;
  unit: string;
  context?: string;
}

/**
 * Verify that the rewritten bullet doesn't contain hallucinations
 * STRICT mode: when in doubt, flag as hallucination
 */
export function verifyNoHallucination(
  _original: string,
  rewritten: string,
  facts: ExtractedFacts
): FactVerification {
  const addedFacts: string[] = [];
  const removedFacts: string[] = [];
  let confidence = 1.0; // Start at 100%, deduct for issues

  // Extract facts from rewritten bullet
  const rewrittenFacts = extractFacts(rewritten);

  // Check 1: Action verbs - should not add stronger verbs
  const unauthorizedActionVerbs = detectUnauthorizedActionVerbs(facts, rewrittenFacts);
  if (unauthorizedActionVerbs.length > 0) {
    addedFacts.push(
      `Added team leadership verb: ${unauthorizedActionVerbs.join(', ')} (not in original)`
    );
    confidence -= 0.2;
  }

  // Check 2: Team involvement - should not add "led team", "managed", etc.
  if (!facts.teamInvolvement && rewrittenFacts.teamInvolvement) {
    addedFacts.push('Added team leadership claim: "led team" or "managed" (not in original)');
    confidence -= 0.25;
  }

  // Check 3: Team size - should not add specific numbers
  if (facts.teamSize === undefined && rewrittenFacts.teamSize !== undefined) {
    addedFacts.push(
      `Added specific team size: "${rewrittenFacts.teamSize}" (not in original)`
    );
    confidence -= 0.25;
  } else if (
    facts.teamSize !== undefined &&
    rewrittenFacts.teamSize !== undefined &&
    rewrittenFacts.teamSize > facts.teamSize * 1.2
  ) {
    addedFacts.push(
      `Inflated team size from ${facts.teamSize} to ${rewrittenFacts.teamSize}`
    );
    confidence -= 0.2;
  }

  // Check 4: Scope creep - detect changes like "feature" → "platform"
  const scopeIssue = detectScopeCreep(facts.scope, rewrittenFacts.scope);
  if (scopeIssue) {
    addedFacts.push(scopeIssue);
    confidence -= 0.25;
  }

  // Check 5: Metrics - should not add/inflate numbers
  const metricIssues = detectMetricIssues(facts.metrics, rewrittenFacts.metrics);
  for (const issue of metricIssues) {
    addedFacts.push(issue);
    confidence -= 0.15;
  }

  // Check 6: Employment type change - internship → full-time is hallucination
  if (
    facts.employment === 'internship' &&
    rewrittenFacts.employment &&
    rewrittenFacts.employment !== 'internship'
  ) {
    addedFacts.push(`Changed employment type from internship to ${rewrittenFacts.employment}`);
    confidence -= 0.25;
  }

  // Check 7: Technologies - can be preserved or highlighted, not added
  const technologyIssues = detectUnauthorizedTechnologies(facts.technologies, rewrittenFacts.technologies);
  if (technologyIssues.length > 0) {
    addedFacts.push(`Added technologies not in original: ${technologyIssues.join(', ')}`);
    confidence -= 0.15;
  }

  // Check 8: Removed facts - if core action or object was removed, that's suspicious
  const removedIssues = detectRemovedFacts(facts, rewrittenFacts);
  for (const issue of removedIssues) {
    removedFacts.push(issue);
    confidence -= 0.1; // Less severe than adding facts
  }

  // Ensure confidence is between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    allFactsPreserved: addedFacts.length === 0 && removedFacts.length === 0,
    addedFacts,
    removedFacts,
    confidence,
  };
}

/**
 * Extract structured facts from a resume bullet
 */
export function extractFacts(bullet: string): ExtractedFacts {
  const lowerBullet = bullet.toLowerCase();

  // Extract action verbs (first verb in the bullet)
  const actionVerbs = extractActionVerbs(bullet);

  // Extract objects (what was built/done)
  const objects = extractObjects(bullet, actionVerbs);

  // Extract technologies
  const technologies = extractTechnologies(bullet);

  // Detect team involvement keywords
  const teamInvolvement =
    /\b(led|lead|managed|manages|directed|mentored|oversaw|supervised|coached|guided)\b.*\b(team|group|engineers?|developers?|people)\b/.test(
      lowerBullet
    ) ||
    /\bteam\s+(of\s+)?\d+/.test(lowerBullet);

  // Extract team size if mentioned
  const teamSizeMatch = lowerBullet.match(/\bteam\s+of\s+(\d+)/);
  const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1]) : undefined;

  // Determine scope
  const scope = extractScope(bullet);

  // Detect employment type
  const employment = extractEmploymentType(bullet);

  // Other specific facts to track
  const otherFacts = extractOtherFacts(bullet);

  // Extract metrics
  const metrics = extractMetrics(bullet);

  return {
    actionVerbs,
    objects,
    technologies,
    metrics,
    teamInvolvement,
    teamSize,
    scope,
    employment,
    otherFacts,
  };
}

/**
 * Extract action verbs from bullet
 */
function extractActionVerbs(bullet: string): string[] {
  const commonActionVerbs = [
    'built',
    'developed',
    'created',
    'designed',
    'implemented',
    'led',
    'managed',
    'directed',
    'optimized',
    'improved',
    'increased',
    'reduced',
    'achieved',
    'delivered',
    'architected',
    'engineered',
    'produced',
    'deployed',
    'launched',
    'drove',
    'established',
    'transformed',
    'automated',
    'integrated',
    'mentored',
    'coached',
    'supervised',
    'oversaw',
    'collaborated',
    'contributed',
    'participated',
  ];

  const found: string[] = [];
  const lowerBullet = bullet.toLowerCase();

  for (const verb of commonActionVerbs) {
    // Match whole word at beginning or after whitespace
    if (new RegExp(`\\b${verb}\\b`).test(lowerBullet)) {
      found.push(verb);
    }
  }

  return found;
}

/**
 * Extract what was built/created/done
 */
function extractObjects(bullet: string, _actionVerbs: string[]): string[] {
  const objects: string[] = [];

  // Common patterns: "Built X", "Created Y", etc.
  const patterns = [
    /(?:built|developed|created|designed)\s+(?:a|an|the)?\s*([^,\.]+?)(?:\s+(?:with|using|for|to)|\s*[,\.]|$)/i,
    /(?:architected|designed|implemented)\s+(?:a|an|the)?\s*([^,\.]+?)(?:\s+(?:with|using|for|to)|\s*[,\.]|$)/i,
    /(?:led|managed|directed|oversaw)\s+(?:the)?\s*([^,\.]+?)(?:\s+(?:with|using|for|to)|\s*[,\.]|$)/i,
  ];

  for (const pattern of patterns) {
    const matches = bullet.match(pattern);
    if (matches && matches[1]) {
      const obj = matches[1].trim();
      if (obj && !objects.includes(obj)) {
        objects.push(obj);
      }
    }
  }

  return objects;
}

/**
 * Extract technologies mentioned
 */
function extractTechnologies(bullet: string): string[] {
  const technologies: string[] = [];

  // Common tech keywords to look for
  const techKeywords = [
    'react',
    'vue',
    'angular',
    'javascript',
    'typescript',
    'python',
    'java',
    'golang',
    'node',
    'node.js',
    'express',
    'django',
    'flask',
    'fastapi',
    'sql',
    'mongodb',
    'postgresql',
    'mysql',
    'redis',
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'graphql',
    'rest',
    'api',
    'microservices',
    'ci/cd',
    'jenkins',
    'github',
    'gitlab',
    'git',
    'html',
    'css',
    'sass',
    'webpack',
    'jest',
    'testing',
    'nextjs',
    'next.js',
    'rails',
    'spring',
    'scala',
    'rust',
    'c++',
    'c#',
  ];

  const lowerBullet = bullet.toLowerCase();

  for (const tech of techKeywords) {
    // Escape special regex characters
    const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escapedTech}\\b`).test(lowerBullet)) {
      technologies.push(tech);
    }
  }

  return technologies;
}

/**
 * Extract scope of the work
 */
function extractScope(bullet: string): string {
  const lowerBullet = bullet.toLowerCase();

  if (/\bfeature\b/.test(lowerBullet)) return 'feature';
  if (/\bproduct\b/.test(lowerBullet)) return 'product';
  if (/\bplatform\b/.test(lowerBullet)) return 'platform';
  if (/\bsystem\b|\binfrastructure\b|\barchitecture\b/.test(lowerBullet))
    return 'system';
  if (/\bwebsite\b|\bweb app\b|\bapp\b/.test(lowerBullet)) return 'application';
  if (/\bservice\b|\bapi\b/.test(lowerBullet)) return 'service';
  if (/\bmodule\b|\bcomponent\b/.test(lowerBullet)) return 'component';
  if (/\blibrary\b|\bframework\b/.test(lowerBullet)) return 'library';

  return 'undefined';
}

/**
 * Extract employment type
 */
function extractEmploymentType(
  bullet: string
): 'internship' | 'full-time' | 'contract' | 'part-time' | undefined {
  const lowerBullet = bullet.toLowerCase();

  if (/\bintern\b|\binternship\b/.test(lowerBullet)) return 'internship';
  if (/\bfull[\s-]?time\b|\bfull-time\b/.test(lowerBullet)) return 'full-time';
  if (/\bcontract\b|\bcontractor\b/.test(lowerBullet)) return 'contract';
  if (/\bpart[\s-]?time\b|\bpart-time\b/.test(lowerBullet)) return 'part-time';

  return undefined;
}

/**
 * Extract other specific facts that might be hallucinated
 */
function extractOtherFacts(bullet: string): string[] {
  const facts: string[] = [];

  // Extract company names or proper nouns
  const properNounMatches = bullet.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (properNounMatches) {
    facts.push(...properNounMatches);
  }

  // Extract awards/recognition
  if (/award|recognition|promoted|promotion/.test(bullet.toLowerCase())) {
    const match = bullet.match(/(?:won|received|got|earned|awarded)\s+(?:the\s+)?([^,\.]+)/i);
    if (match && match[1]) {
      facts.push(`Award: ${match[1]}`);
    }
  }

  return facts;
}

/**
 * Extract numeric metrics
 */
function extractMetrics(bullet: string): MetricInfo[] {
  const metrics: MetricInfo[] = [];

  // Match patterns like "100 users", "40% increase", "$1M revenue"
  const metricPatterns = [
    /(\d+(?:[.,]\d{3})*(?:\.\d+)?)\s*([%€$£¥]|\s*(?:users?|customers?|employees?|developers?|engineers?|hours|days|weeks|months|years|revenue|profit|savings|reduction|increase|growth|improvement))/gi,
    /(\d+(?:[.,]\d{3})*(?:\.\d+)?)\s*([%])\s*(increase|decrease|growth|improvement|reduction)/gi,
  ];

  for (const pattern of metricPatterns) {
    let match;
    while ((match = pattern.exec(bullet)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2];
      const context = match[3];

      metrics.push({
        value,
        unit,
        context,
      });
    }
  }

  return metrics;
}

/**
 * Detect unauthorized action verbs (adding "led" when no leadership in original)
 */
function detectUnauthorizedActionVerbs(original: ExtractedFacts, rewritten: ExtractedFacts): string[] {
  const leadershipVerbs = ['led', 'managed', 'directed', 'mentored', 'coached', 'supervised', 'oversaw'];
  const originalHasLeadership =
    original.teamInvolvement || original.actionVerbs.some((v) => leadershipVerbs.includes(v));

  const rewrittenLeadershipVerbs = rewritten.actionVerbs.filter((v) =>
    leadershipVerbs.includes(v)
  );

  if (!originalHasLeadership && rewrittenLeadershipVerbs.length > 0) {
    return rewrittenLeadershipVerbs;
  }

  return [];
}

/**
 * Detect scope creep (e.g., "feature" → "platform")
 */
function detectScopeCreep(originalScope: string, rewrittenScope: string): string | null {
  // Define scope hierarchy: smaller to larger
  const scopeHierarchy: Record<string, number> = {
    component: 1,
    feature: 2,
    module: 2,
    service: 3,
    application: 4,
    product: 5,
    platform: 6,
    system: 6,
    infrastructure: 6,
    library: 3,
    undefined: 0,
  };

  const originalLevel = scopeHierarchy[originalScope] || 0;
  const rewrittenLevel = scopeHierarchy[rewrittenScope] || 0;

  // If scope significantly increased (more than 1 level), flag it
  if (rewrittenLevel > originalLevel + 1) {
    return `Inflated scope from "${originalScope}" to "${rewrittenScope}"`;
  }

  return null;
}

/**
 * Detect metric issues (added or inflated numbers)
 */
function detectMetricIssues(originalMetrics: MetricInfo[], rewrittenMetrics: MetricInfo[]): string[] {
  const issues: string[] = [];

  // Check for added metrics
  if (originalMetrics.length === 0 && rewrittenMetrics.length > 0) {
    for (const metric of rewrittenMetrics) {
      issues.push(
        `Added metric: ${metric.value}${metric.unit}${metric.context ? ' ' + metric.context : ''} (not in original)`
      );
    }
    return issues;
  }

  // Check for inflated metrics
  for (const rewrittenMetric of rewrittenMetrics) {
    const originalMetric = originalMetrics.find(
      (m) => m.unit === rewrittenMetric.unit && m.context === rewrittenMetric.context
    );

    if (originalMetric) {
      // Metrics with same context - check for inflation
      // Allow 10% variance for rounding
      if (rewrittenMetric.value > originalMetric.value * 1.1) {
        issues.push(
          `Inflated metric from ${originalMetric.value}${originalMetric.unit} to ${rewrittenMetric.value}${rewrittenMetric.unit}`
        );
      }
    } else if (!isSameMetricContext(rewrittenMetric, originalMetrics)) {
      // Check if it's a completely new metric
      issues.push(
        `Added new metric: ${rewrittenMetric.value}${rewrittenMetric.unit}${rewrittenMetric.context ? ' ' + rewrittenMetric.context : ''} (not in original)`
      );
    }
  }

  return issues;
}

/**
 * Check if metric context exists in original (for fuzzy matching)
 */
function isSameMetricContext(metric: MetricInfo, originalMetrics: MetricInfo[]): boolean {
  if (!metric.context) return false;

  const lowerContext = metric.context.toLowerCase();
  return originalMetrics.some((m) => m.context?.toLowerCase().includes(lowerContext));
}

/**
 * Detect unauthorized technologies (adding tech not in original)
 */
function detectUnauthorizedTechnologies(
  originalTechs: string[],
  rewrittenTechs: string[]
): string[] {
  const added: string[] = [];

  for (const tech of rewrittenTechs) {
    if (!originalTechs.includes(tech)) {
      added.push(tech);
    }
  }

  // Only flag if significant additions (more than 1-2 techs)
  // Minor additions might be acceptable for emphasis
  return added.length > 2 ? added : [];
}

/**
 * Detect facts that were removed or significantly changed
 */
function detectRemovedFacts(original: ExtractedFacts, rewritten: ExtractedFacts): string[] {
  const issues: string[] = [];

  // Check if core action verbs were removed
  if (original.actionVerbs.length > 0 && rewritten.actionVerbs.length === 0) {
    issues.push(`Removed all action verbs: ${original.actionVerbs.join(', ')}`);
  }

  // Check if core objects were removed
  if (original.objects.length > 0 && rewritten.objects.length === 0) {
    issues.push(`Removed what was built: ${original.objects.join(', ')}`);
  }

  return issues;
}
