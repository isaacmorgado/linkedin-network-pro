/**
 * Intent Handlers
 * Handle specific intent types and execute appropriate actions
 */

import type { Intent } from './intent-classifier';
import type { ChatMessage, SearchQuery } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph } from '../universal-connection-types';
import { searchGraph } from '../search/graph-query';
import { findUniversalConnection } from '../universal-pathfinder';
import { formatSearchResponse, formatPathResponse } from './response-formatters';
import { createMessage, findUserByName } from './response-utils';

/**
 * Handle SEARCH intent - find people in network
 */
export async function handleSearchIntent(
  intent: Intent,
  graph?: Graph
): Promise<ChatMessage> {
  // Check if graph is available
  if (!graph) {
    return createMessage(
      "I need access to your network graph to search. Please make sure your LinkedIn data is loaded."
    );
  }

  // Build search query from intent entities
  const searchQuery: SearchQuery = {
    query: intent.entities.query || '',
    filters: {
      company: intent.entities.company,
      role: intent.entities.role,
      location: intent.entities.location,
      connectionDegree: intent.entities.connectionDegree,
    }
  };

  // Execute search
  const results = await searchGraph(searchQuery);

  // Format and return response
  return formatSearchResponse(results, intent);
}

/**
 * Handle FIND_PATH intent - discover connection paths
 */
export async function handleFindPathIntent(
  intent: Intent,
  graph?: Graph,
  sourceUser?: UserProfile
): Promise<ChatMessage> {
  // Check dependencies
  if (!graph) {
    return createMessage(
      "I need access to your network graph to find connection paths. Please make sure your LinkedIn data is loaded."
    );
  }

  if (!sourceUser) {
    return createMessage(
      "I need your profile information to find connection paths. Please make sure you're logged in."
    );
  }

  // Find target person in graph
  const targetUser = await findUserByName(intent.entities.target, graph);

  if (!targetUser) {
    const targetName = intent.entities.target || "this person";
    return createMessage(
      `I couldn't find "${targetName}" in your network. Would you like me to search for people with a similar name or company?`
    );
  }

  // Find connection strategy
  const strategy = await findUniversalConnection(sourceUser, targetUser, graph);

  // Format and return response
  return formatPathResponse(strategy, targetUser);
}

/**
 * Handle GENERATE_MESSAGE intent - stub for Week 4
 */
export function handleGenerateMessageIntent(intent: Intent): ChatMessage {
  const target = intent.entities.target || "this person";

  return createMessage(
    `Message generation is coming in Week 4! For now, here's a template you can use to reach out to ${target}:

"Hi [Name],

I noticed we share [common background/interest]. I'd love to connect and learn more about your work at [Company].

Best regards,
[Your Name]"

Tip: Personalize the message by mentioning specific shared experiences or interests!`
  );
}

/**
 * Handle GENERAL intent - acknowledgments and help
 */
export function handleGeneralIntent(intent: Intent): ChatMessage {
  const lower = intent.rawMessage.toLowerCase();

  // Greetings
  if (/\b(hello|hi|hey|greetings)\b/i.test(lower)) {
    return createMessage(
      "Hello! I can help you find people in your LinkedIn network and discover connection paths. Try asking me:\n• 'Who are the engineers at Google?'\n• 'How can I reach John Doe?'\n• 'Find HR reps at Netflix'"
    );
  }

  // Thanks
  if (/\b(thanks|thank you|thx|appreciated)\b/i.test(lower)) {
    return createMessage(
      "You're welcome! Let me know if you need help finding anyone else in your network."
    );
  }

  // Help
  if (/\b(help|what can you do|how do you work|capabilities)\b/i.test(lower)) {
    return createMessage(
      `I can help you with:

**Search your network**
• "Find product managers at Meta"
• "Show me 2nd degree connections at Netflix"
• "Who are the senior engineers in SF?"

**Discover connection paths**
• "How can I reach Jane Smith?"
• "Find the best path to John Doe"
• "Introduce me to someone at Google"

**Draft outreach messages** (coming soon!)
• "Write a message to Jane Smith"
• "Draft an intro email to John Doe"

Ask me anything about your LinkedIn network!`
    );
  }

  // Tell me more / context references
  if (/\btell\s+me\s+more/i.test(lower) || intent.entities.contextReference) {
    return createMessage(
      "I'd love to help! Could you ask a more specific question? For example:\n• 'Who are the engineers at this company?'\n• 'Find the best path to connect with them'\n• 'Show me their profile details'"
    );
  }

  // Default
  return createMessage(
    "I'm not sure I understood that. I can help you:\n• Search your network (e.g., 'Find engineers at Google')\n• Discover connection paths (e.g., 'How can I reach John Doe?')\n\nWhat would you like to do?"
  );
}
