/**
 * Entity Extractors
 * Extract structured data from natural language messages
 */

import type { Intent, IntentType } from './intent-types';
import { parseQuery } from '../search/query-parser';

/**
 * Extract entities based on intent type
 */
export async function extractEntities(
  intentType: IntentType,
  message: string
): Promise<Intent['entities']> {
  switch (intentType) {
    case 'SEARCH':
      return extractSearchEntities(message);
    case 'FIND_PATH':
      return extractPathEntities(message);
    case 'GENERATE_MESSAGE':
      return extractMessageEntities(message);
    case 'GENERAL':
      return extractGeneralEntities(message);
    default:
      return {};
  }
}

/**
 * Extract entities for SEARCH intent using query parser
 */
function extractSearchEntities(message: string): Intent['entities'] {
  // Remove trailing punctuation for better parsing
  const cleanMessage = message.replace(/[?!.]+$/, '');
  const parsed = parseQuery(cleanMessage);

  return {
    query: parsed.query || undefined,
    company: parsed.filters?.company,
    role: parsed.filters?.role,
    location: parsed.filters?.location,
    connectionDegree: parsed.filters?.connectionDegree,
  };
}

/**
 * Extract entities for FIND_PATH intent
 */
function extractPathEntities(message: string): Intent['entities'] {
  const entities: Intent['entities'] = {};

  // Extract proper nouns as target names
  const properNouns = extractProperNouns(message);
  if (properNouns.length > 0) {
    entities.target = properNouns.join(' and ');
  }

  // Extract company context using parseQuery (remove punctuation first)
  const cleanMessage = message.replace(/[?!.]+$/, '');
  const parsed = parseQuery(cleanMessage);
  if (parsed.filters?.company) {
    entities.targetCompany = parsed.filters.company;
  }

  return entities;
}

/**
 * Extract entities for GENERATE_MESSAGE intent
 */
function extractMessageEntities(message: string): Intent['entities'] {
  const entities: Intent['entities'] = {};

  // Extract recipient after "to" or "for"
  const toPattern = /(?:to|for)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/i;
  const toMatch = message.match(toPattern);
  if (toMatch?.[1]) {
    entities.target = toMatch[1];
  }

  // Extract context references
  const contextPattern = /(first|second|third|last)\s+(result|person|candidate)/i;
  const contextMatch = message.match(contextPattern);
  if (contextMatch?.[0]) {
    entities.contextReference = contextMatch[0];
  }

  // If no target found, try extracting any proper nouns
  if (!entities.target) {
    const properNouns = extractProperNouns(message);
    if (properNouns.length > 0) {
      entities.target = properNouns.join(' and ');
    }
  }

  return entities;
}

/**
 * Extract entities for GENERAL intent
 */
function extractGeneralEntities(message: string): Intent['entities'] {
  const entities: Intent['entities'] = {};

  // Extract context references
  const contextPatterns = [
    /(first|second|third|last)\s+(result|person|candidate|one)/i,
    /\b(that|this|them|it)\b/i,
    /\btell\s+me\s+more\s+about\s+(that|this|them|it)/i,
  ];

  for (const pattern of contextPatterns) {
    const match = message.match(pattern);
    if (match?.[0]) {
      entities.contextReference = match[0];
      break;
    }
  }

  return entities;
}

/**
 * Extract proper nouns from message
 */
export function extractProperNouns(message: string): string[] {
  const properNouns: string[] = [];
  const words = message.split(/\s+/);

  let currentName: string[] = [];

  // Words to skip (common words, action verbs, sentence starters)
  const skipWords = [
    'i', 'draft', 'write', 'compose', 'generate', 'create', 'help', 'show', 'find', 'list',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december'
  ];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if word is capitalized (and not common words)
    if (word && /^[A-Z][a-z]+/.test(word)) {
      // Skip if it's a common word that happens to be capitalized
      const lower = word.toLowerCase();

      if (!skipWords.includes(lower)) {
        currentName.push(word);
      }
    } else {
      // End of proper noun sequence
      if (currentName.length > 0) {
        properNouns.push(currentName.join(' '));
        currentName = [];
      }
    }
  }

  // Add final sequence if exists
  if (currentName.length > 0) {
    properNouns.push(currentName.join(' '));
  }

  return properNouns;
}
