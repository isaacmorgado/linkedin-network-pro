/**
 * Chat types and interfaces
 */

import type { Intent } from './intent-classifier';
import type { SearchResult } from '@/types/search';
import type { ConnectionStrategy } from '../universal-connection-types';

/**
 * Conversation context to remember between messages
 */
export interface ConversationContext {
  lastSearchResults?: SearchResult[];
  lastPaths?: ConnectionStrategy[];
  lastIntent?: Intent;
  lastQuery?: string;
}
