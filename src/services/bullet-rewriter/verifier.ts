/**
 * Fact Verifier
 * Verifies that no hallucination occurred in rewrites
 */

import type { FactVerification } from '../../types/resume-tailoring';
import type { ExtractedFacts } from './types';
import { extractMetrics, extractTeamScopes } from './fact-extractor';

/**
 * Verify that no hallucination occurred in the rewrite
 */
export function verifyNoHallucination(facts: ExtractedFacts, rewritten: string): FactVerification {
  const addedFacts: string[] = [];
  const removedFacts: string[] = [];
  let confidence = 1.0;

  // CHECK 1: All metrics must be preserved
  for (const metric of facts.metrics) {
    if (!rewritten.includes(metric)) {
      removedFacts.push(`Metric: ${metric}`);
      confidence -= 0.2;
    }
  }

  // CHECK 2: No new metrics added
  const rewrittenMetrics = extractMetrics(rewritten, undefined);
  for (const metric of rewrittenMetrics) {
    if (!facts.metrics.includes(metric)) {
      addedFacts.push(`New metric: ${metric}`);
      confidence -= 0.3;
    }
  }

  // CHECK 3: No new team scopes added
  const rewrittenTeamScopes = extractTeamScopes(rewritten);
  for (const scope of rewrittenTeamScopes) {
    if (!facts.teamScopes.includes(scope)) {
      addedFacts.push(`New team scope: ${scope}`);
      confidence -= 0.4; // This is serious hallucination
    }
  }

  // CHECK 4: Core action and object should be preserved (or semantically equivalent)
  const lowerRewritten = rewritten.toLowerCase();
  if (!lowerRewritten.includes(facts.action.toLowerCase())) {
    // Check for synonyms
    const actionSynonyms = getActionSynonyms(facts.action);
    const hasSynonym = actionSynonyms.some(syn => lowerRewritten.includes(syn.toLowerCase()));

    if (!hasSynonym) {
      removedFacts.push(`Action: ${facts.action}`);
      confidence -= 0.1;
    }
  }

  // CHECK 5: Technologies mentioned should still be there
  for (const tech of facts.technologies) {
    if (!lowerRewritten.includes(tech.toLowerCase())) {
      removedFacts.push(`Technology: ${tech}`);
      confidence -= 0.1;
    }
  }

  const allFactsPreserved = addedFacts.length === 0 && removedFacts.length === 0;

  return {
    allFactsPreserved,
    addedFacts,
    removedFacts,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * Get synonyms for action verbs
 */
function getActionSynonyms(action: string): string[] {
  const synonymMap: Record<string, string[]> = {
    'built': ['developed', 'created', 'constructed', 'engineered'],
    'developed': ['built', 'created', 'engineered', 'implemented'],
    'created': ['built', 'developed', 'designed', 'established'],
    'led': ['managed', 'directed', 'headed', 'coordinated'],
    'optimized': ['improved', 'enhanced', 'refined', 'streamlined'],
    'implemented': ['deployed', 'executed', 'established', 'introduced'],
  };

  return synonymMap[action.toLowerCase()] || [];
}

// Re-export fact extraction functions needed by verifier
export { extractMetrics, extractTeamScopes } from './fact-extractor';
