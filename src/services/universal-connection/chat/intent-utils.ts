/**
 * Intent Utilities
 * Helper functions for intent classification
 */

import type { Intent, IntentType } from './intent-types';

/**
 * Calculate confidence score
 */
export function calculateConfidence(
  intentType: IntentType,
  keywordMatches: number,
  hasEntities: boolean
): number {
  // Base confidence from keyword strength
  let confidence = 0.5 + (keywordMatches * 0.1);

  // Boost if we successfully extracted entities
  if (hasEntities) {
    confidence += 0.2;
  }

  // GENERAL intent has lower baseline confidence (fallback)
  if (intentType === 'GENERAL' && keywordMatches === 0) {
    confidence = 0.4;
  }

  // Ensure minimum distance from thresholds (avoid exactly 0.7)
  if (Math.abs(confidence - 0.7) < 0.01) {
    confidence += 0.05;
  }

  // Cap at 0.95 (never 100% certain with keyword matching)
  return Math.min(confidence, 0.95);
}

/**
 * Generate human-readable reasoning
 */
export function generateReasoning(
  intentType: IntentType,
  entities: Intent['entities'],
  confidence: number
): string {
  const reasons: string[] = [];

  switch (intentType) {
    case 'SEARCH':
      reasons.push('Detected search intent');
      if (entities.query) reasons.push(`query: "${entities.query}"`);
      if (entities.company) reasons.push(`company: ${entities.company}`);
      if (entities.role) reasons.push(`role: ${entities.role}`);
      if (entities.location) reasons.push(`location: ${entities.location}`);
      if (entities.connectionDegree) reasons.push(`degrees: ${entities.connectionDegree.join(', ')}`);
      break;

    case 'FIND_PATH':
      reasons.push('Detected path-finding intent');
      if (entities.target) reasons.push(`target: ${entities.target}`);
      if (entities.targetCompany) reasons.push(`company: ${entities.targetCompany}`);
      if (!entities.target) reasons.push('(no specific person identified)');
      break;

    case 'GENERATE_MESSAGE': {
      reasons.push('Detected message generation intent');
      // Only add target if it's not a verb/action word
      const skipTargets = ['draft', 'write', 'compose', 'generate', 'create'];
      if (entities.target && !skipTargets.includes(entities.target.toLowerCase())) {
        reasons.push(`recipient: ${entities.target}`);
      } else if (entities.contextReference) {
        reasons.push(`context: ${entities.contextReference}`);
      } else {
        reasons.push('no recipient specified');
      }
      break;
    }

    case 'GENERAL':
      reasons.push('General query or acknowledgment');
      if (entities.contextReference) reasons.push(`reference: ${entities.contextReference}`);
      break;
  }

  const confidenceLabel = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  reasons.push(`confidence: ${confidenceLabel} (${confidence.toFixed(2)})`);

  return reasons.join(', ');
}
