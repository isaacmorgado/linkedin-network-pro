/**
 * Response Generator
 * Executes actions based on classified intents and generates natural language responses
 *
 * Routes intents to appropriate handlers:
 * - SEARCH → searchGraph()
 * - FIND_PATH → findUniversalConnection()
 * - GENERATE_MESSAGE → stub for Week 4
 * - GENERAL → simple acknowledgment
 */

import type { Intent } from './intent-classifier';
import type { ChatMessage } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph } from '../universal-connection-types';
import {
  handleSearchIntent,
  handleFindPathIntent,
  handleGenerateMessageIntent,
  handleGeneralIntent,
} from './intent-handlers';
import { createMessage } from './response-utils';

/**
 * Generate chat response from classified intent
 */
export async function generateResponse(
  intent: Intent,
  graph?: Graph,
  sourceUser?: UserProfile
): Promise<ChatMessage> {
  try {
    switch (intent.type) {
      case 'SEARCH':
        return await handleSearchIntent(intent, graph);

      case 'FIND_PATH':
        return await handleFindPathIntent(intent, graph, sourceUser);

      case 'GENERATE_MESSAGE':
        return handleGenerateMessageIntent(intent);

      case 'GENERAL':
        return handleGeneralIntent(intent);

      default:
        return createMessage("I'm not sure how to help with that. Try asking me to find people or discover connection paths!");
    }
  } catch (error) {
    console.error('[ResponseGenerator] Error generating response:', error);
    return createMessage(
      "I encountered an error processing your request. Please try again or rephrase your question."
    );
  }
}
