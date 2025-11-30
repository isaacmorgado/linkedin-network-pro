/**
 * Intent Classifier
 * Classifies user intent from natural language messages and routes to appropriate handlers
 *
 * Intent types:
 * - SEARCH: "find", "who", "list", "show me" → calls searchGraph()
 * - FIND_PATH: "introduce", "connect", "path to", "how to reach" → calls pathfinder
 * - GENERATE_MESSAGE: "write", "draft", "message", "reach out" → calls message generator
 * - GENERAL: everything else → simple acknowledgment
 */

import type { Intent, IntentType } from './intent-types';
import {
  hasSearchKeywords,
  hasPathKeywords,
  hasMessageKeywords,
  detectProperNouns,
  countKeywordMatches,
} from './keyword-matchers';
import { extractEntities } from './entity-extractors';
import { calculateConfidence, generateReasoning } from './intent-utils';

// Re-export types for convenience
export type { Intent, IntentType } from './intent-types';

/**
 * Classify user intent from natural language message
 */
export async function classifyIntent(message: string): Promise<Intent> {
  const trimmed = message.trim();

  // Handle empty messages
  if (!trimmed) {
    return {
      type: 'GENERAL',
      confidence: 0.95,
      entities: {},
      reasoning: 'Empty message',
      rawMessage: message,
    };
  }

  const lower = trimmed.toLowerCase();

  // Phase 1: Determine intent type (with priority ordering)
  const intentType = classifyIntentType(lower, trimmed);

  // Phase 2: Extract entities based on intent type
  const entities = await extractEntities(intentType, trimmed);

  // Phase 3: Calculate confidence
  const keywordMatches = countKeywordMatches(intentType, lower);
  const hasEntities = Object.keys(entities).length > 0;
  const confidence = calculateConfidence(intentType, keywordMatches, hasEntities);

  // Phase 4: Generate reasoning
  const reasoning = generateReasoning(intentType, entities, confidence);

  return {
    type: intentType,
    confidence,
    entities,
    reasoning,
    rawMessage: message,
  };
}

/**
 * Classify intent type based on keyword matching
 */
function classifyIntentType(lower: string, original: string): IntentType {
  // Handle overlapping keywords: MESSAGE keywords take priority over PATH keywords
  // This handles "reach out" and "connect" in message contexts
  if (hasMessageKeywords(lower)) {
    return 'GENERATE_MESSAGE';
  }

  // Handle overlapping keywords: FIND_PATH takes priority if proper nouns detected
  const hasProperNouns = detectProperNouns(original);

  // Priority check for FIND_PATH with proper nouns (handles "Show me how to reach John Doe")
  if (hasProperNouns && hasPathKeywords(lower)) {
    return 'FIND_PATH';
  }

  // Priority 1: SEARCH (most common)
  if (hasSearchKeywords(lower)) {
    return 'SEARCH';
  }

  // Priority 2: FIND_PATH (without proper nouns already handled above)
  if (hasPathKeywords(lower)) {
    return 'FIND_PATH';
  }

  // Priority 3: GENERAL (fallback)
  return 'GENERAL';
}
