/**
 * Context Resolver
 * Resolves context references in user messages (follow-up questions, pronouns, etc.)
 */

import type { Intent } from './intent-classifier';
import type { ConversationContext } from './types';

/**
 * Resolve context references in intent
 * Handles: "the first one", "that person", "their profile", etc.
 */
export function resolveContextReferences(
  intent: Intent,
  message: string,
  context: ConversationContext
): Intent {
  const lower = message.toLowerCase();

  // Handle result references: "first one", "second person", etc.
  if (hasResultReference(lower) && context.lastSearchResults) {
    const index = extractResultIndex(lower, context);
    if (index !== null && context.lastSearchResults[index]) {
      const result = context.lastSearchResults[index];

      // Convert to appropriate intent
      if (intent.type === 'GENERAL' || intent.type === 'FIND_PATH') {
        return {
          ...intent,
          type: 'FIND_PATH',
          entities: {
            ...intent.entities,
            target: result.name,
            targetCompany: result.company,
          },
          reasoning: `Resolved context reference to ${result.name}`,
        };
      }
    }
  }

  // Handle pronoun references: "them", "that person", etc.
  if (hasPronounReference(lower)) {
    // Use last search result or path
    if (context.lastSearchResults && context.lastSearchResults.length > 0) {
      const firstResult = context.lastSearchResults[0];

      if (intent.type === 'GENERAL' || intent.type === 'FIND_PATH') {
        return {
          ...intent,
          type: 'FIND_PATH',
          entities: {
            ...intent.entities,
            target: firstResult.name,
            targetCompany: firstResult.company,
          },
          reasoning: `Resolved pronoun reference to ${firstResult.name}`,
        };
      }

      if (intent.type === 'GENERATE_MESSAGE') {
        return {
          ...intent,
          entities: {
            ...intent.entities,
            target: firstResult.name,
          },
          reasoning: `Resolved pronoun reference to ${firstResult.name}`,
        };
      }
    }
  }

  // Handle refinement: "only 2nd degree", "filter by location", etc.
  if (isRefinement(lower) && context.lastIntent?.type === 'SEARCH') {
    // Merge with previous search query
    return {
      ...intent,
      type: 'SEARCH',
      entities: {
        ...context.lastIntent.entities,
        ...intent.entities,
      },
      reasoning: 'Refined previous search query',
    };
  }

  return intent;
}

/**
 * Check if message has result reference
 */
function hasResultReference(message: string): boolean {
  return /\b(first|second|third|last|top)\s+(one|person|result|candidate)/.test(message);
}

/**
 * Extract result index from message
 */
function extractResultIndex(message: string, context: ConversationContext): number | null {
  const match = message.match(/\b(first|second|third|last|top)\s+(one|person|result|candidate)/);
  if (!match) return null;

  const ordinal = match[1];
  switch (ordinal) {
    case 'first':
    case 'top':
      return 0;
    case 'second':
      return 1;
    case 'third':
      return 2;
    case 'last':
      return context.lastSearchResults ? context.lastSearchResults.length - 1 : null;
    default:
      return null;
  }
}

/**
 * Check if message has pronoun reference
 */
function hasPronounReference(message: string): boolean {
  return /\b(them|that person|this person|they|their)\b/.test(message);
}

/**
 * Check if message is a refinement of previous query
 */
function isRefinement(message: string): boolean {
  return (
    /\b(only|just|filter|refine|narrow|exclude)\b/.test(message) ||
    /\b(show me|give me)\s+(only|just)/.test(message)
  );
}
