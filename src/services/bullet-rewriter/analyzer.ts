/**
 * Change Analyzer
 * Analyzes differences between original and rewritten bullets
 */

import type { Change } from '../../types/resume-tailoring';

/**
 * Analyze what changed between original and rewritten
 */
export function analyzeChanges(original: string, rewritten: string): Change[] {
  const changes: Change[] = [];

  // Simple diff: if significantly different, mark as rephrasing
  if (original !== rewritten) {
    const similarity = calculateSimilarity(original, rewritten);

    if (similarity < 0.7) {
      changes.push({
        type: 'rephrasing',
        from: original,
        to: rewritten,
        justification: 'Rephrased for ATS optimization and keyword inclusion',
      });
    } else {
      changes.push({
        type: 'keyword-injection',
        justification: 'Added relevant keywords while preserving facts',
      });
    }
  }

  return changes;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find which keywords were added in the rewrite
 */
export function findAddedKeywords(original: string, rewritten: string, targetKeywords: string[]): string[] {
  const added: string[] = [];
  const lowerOriginal = original.toLowerCase();
  const lowerRewritten = rewritten.toLowerCase();

  for (const keyword of targetKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // If keyword wasn't in original but is in rewritten
    if (!lowerOriginal.includes(lowerKeyword) && lowerRewritten.includes(lowerKeyword)) {
      added.push(keyword);
    }
  }

  return added;
}
