/**
 * Keyword Matchers
 * Pattern matching for intent type classification
 */

import type { IntentType } from './intent-types';

/**
 * Check if message contains SEARCH intent keywords
 */
export function hasSearchKeywords(lower: string): boolean {
  const searchKeywords = [
    // Question words (flexible for typos: "who r" also matches)
    /\bwho\s+(are|is|were|r)\b/i,
    /\bwhich\s+people/i,
    /\bwhat\s+people/i,

    // Action verbs
    /\b(show|list|find|search|display|get)\b/i,
    /\blooking\s+for/i,
    /\bshow\s+me/i,

    // Plural forms (strong signal for search)
    /\b(people|candidates|connections|folks|contacts|professionals)\b/i,

    // Job titles (plural forms - flexible for typos)
    /\b(engineers?|engneers?|designers?|managers?|recruiters?|developers?|analysts?)\b/i,
    /\bhr\s+(reps|people|managers)/i,
  ];

  return searchKeywords.some(pattern => pattern.test(lower));
}

/**
 * Check if message contains FIND_PATH intent keywords
 */
export function hasPathKeywords(lower: string): boolean {
  const pathKeywords = [
    // Introduction keywords
    /\b(introduce|intro|introduction)\b/i,
    /\bconnect\s+me/i,

    // Path finding
    /\bpath\s+to/i,
    /\bhow\s+(can\s+i|do\s+i|to)\s+(reach|contact|get\s+to|meet)/i,
    /\bway\s+to\s+(reach|contact|meet)/i,

    // Connection actions
    /\bget\s+in\s+touch\s+with/i,
    /\bmeet\s+with/i,
  ];

  return pathKeywords.some(pattern => pattern.test(lower));
}

/**
 * Check if message contains GENERATE_MESSAGE intent keywords
 */
export function hasMessageKeywords(lower: string): boolean {
  const messageKeywords = [
    // Message verbs
    /\b(write|draft|compose|generate|create)\b/i,

    // Message nouns
    /\b(message|email|note|outreach|letter)\b/i,

    // Action context
    /\breach\s+out/i,
    /\bsend\s+(a\s+)?(message|email)/i,
  ];

  return messageKeywords.some(pattern => pattern.test(lower));
}

/**
 * Detect proper nouns in message (capitalized words not at sentence start)
 */
export function detectProperNouns(message: string): boolean {
  // Look for capitalized sequences that aren't at the start of the message
  const words = message.split(/\s+/);

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (word && /^[A-Z][a-z]+/.test(word)) {
      return true;
    }
  }

  return false;
}

/**
 * Count keyword matches for confidence calculation
 */
export function countKeywordMatches(intentType: IntentType, lower: string): number {
  const keywords: Record<IntentType, RegExp[]> = {
    SEARCH: [
      /\bwho\b/i,
      /\bshow\b/i,
      /\blist\b/i,
      /\bfind\b/i,
      /\bsearch\b/i,
      /\bpeople\b/i,
      /\bconnections\b/i,
    ],
    FIND_PATH: [
      /\bintroduce\b/i,
      /\bconnect\b/i,
      /\bpath\b/i,
      /\breach\b/i,
      /\bhow\s+to\b/i,
    ],
    GENERATE_MESSAGE: [
      /\bwrite\b/i,
      /\bdraft\b/i,
      /\bmessage\b/i,
      /\bemail\b/i,
      /\boutreach\b/i,
    ],
    GENERAL: [
      /\bthanks\b/i,
      /\bhello\b/i,
      /\bhelp\b/i,
    ],
  };

  const intentKeywords = keywords[intentType] || [];
  return intentKeywords.filter(pattern => pattern.test(lower)).length;
}
