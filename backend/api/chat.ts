/**
 * POST /api/chat
 * Conversational interface for network exploration
 *
 * VERCEL SERVERLESS FUNCTION
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ChatRequestSchema, type ChatMessage } from '../src/types/index.js';
import { generateMessage } from '../src/services/openai.js';
import { successResponse, errorResponse } from '../src/middleware/validation.js';

/**
 * Main handler for chat endpoint
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json(
      errorResponse('METHOD_NOT_ALLOWED', 'Only POST requests are allowed', undefined, 405)
    );
    return;
  }

  try {
    // Validate request body
    const validation = ChatRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json(
        errorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          400
        )
      );
      return;
    }

    const { userId, message: userMessage, conversationHistory } = validation.data;

    console.log(`[Chat] User ${userId}: "${userMessage}"`);

    // ========================================================================
    // STEP 1: Classify user intent
    // ========================================================================

    const intent = await classifyIntent(userMessage);
    console.log(`[Chat] Detected intent: ${intent.type}`);

    // ========================================================================
    // STEP 2: Execute action based on intent
    // ========================================================================

    let response: string;
    let metadata: any = {};

    switch (intent.type) {
      case 'search':
        // User wants to search their network
        response = await handleSearchIntent(userId, intent.query);
        metadata = { intent: 'search', query: intent.query };
        break;

      case 'find_path':
        // User wants to find path to someone
        response = await handleFindPathIntent(userId, intent.targetName);
        metadata = { intent: 'find_path', targetName: intent.targetName };
        break;

      case 'generate_message':
        // User wants help writing a message
        response = await handleMessageIntent(userId, intent.targetName);
        metadata = { intent: 'generate_message', targetName: intent.targetName };
        break;

      case 'general':
        // General conversation
        response = await handleGeneralIntent(userMessage, conversationHistory);
        metadata = { intent: 'general' };
        break;

      default:
        response = "I'm not sure how to help with that. Try asking me to search your network, find a path to someone, or help you write a message.";
        metadata = { intent: 'unknown' };
    }

    // ========================================================================
    // STEP 3: Return response
    // ========================================================================

    const responseMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      metadata,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(
      successResponse({
        message: responseMessage,
        intent: intent.type,
      })
    );
  } catch (error: any) {
    console.error('❌ Chat error:', error);

    res.status(500).json(
      errorResponse(
        'CHAT_ERROR',
        'Chat failed',
        process.env.NODE_ENV === 'development' ? error.message : undefined,
        500
      )
    );
  }
}

// ============================================================================
// Intent Classification
// ============================================================================

interface Intent {
  type: 'search' | 'find_path' | 'generate_message' | 'general';
  query?: string;
  targetName?: string;
}

/**
 * Classify user intent using GPT-4
 */
async function classifyIntent(message: string): Promise<Intent> {
  const systemPrompt = `You are a intent classifier for a LinkedIn networking assistant.

Classify the user's message into one of these intents:
- "search": User wants to search their network (e.g., "find software engineers", "who works at Google?")
- "find_path": User wants to find a path to someone (e.g., "how do I reach John Smith?", "connect me to Jane")
- "generate_message": User wants help writing a message (e.g., "help me message Jane", "write intro to John")
- "general": General question or conversation

Return ONLY a JSON object with:
{
  "type": "search" | "find_path" | "generate_message" | "general",
  "query": "extracted search query" (for search intent),
  "targetName": "extracted person name" (for find_path or generate_message)
}`;

  const response = await generateMessage(message, {
    systemPrompt,
    temperature: 0.3, // Low temperature for consistent classification
    maxTokens: 100,
  });

  try {
    const parsed = JSON.parse(response);
    return parsed as Intent;
  } catch {
    // Fallback to general intent if parsing fails
    return { type: 'general' };
  }
}

// ============================================================================
// Intent Handlers
// ============================================================================

/**
 * Handle search intent
 */
async function handleSearchIntent(userId: string, query?: string): Promise<string> {
  if (!query) {
    return 'What would you like to search for in your network?';
  }

  // TODO: Call search API internally
  return `I'd search your network for "${query}". This functionality will call the /api/search endpoint.`;
}

/**
 * Handle find-path intent
 */
async function handleFindPathIntent(userId: string, targetName?: string): Promise<string> {
  if (!targetName) {
    return 'Who would you like to connect with?';
  }

  // TODO: Look up target profile and call find-path API
  return `I'd find the best path to connect with ${targetName}. This functionality will call the /api/find-path endpoint.`;
}

/**
 * Handle message generation intent
 */
async function handleMessageIntent(userId: string, targetName?: string): Promise<string> {
  if (!targetName) {
    return 'Who would you like to send a message to?';
  }

  // TODO: Call generate-message API
  return `I'd help you craft a personalized message to ${targetName} using research-backed templates. This functionality will call the /api/generate-message endpoint.`;
}

/**
 * Handle general conversation
 */
async function handleGeneralIntent(
  message: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  const systemPrompt = `You are a helpful LinkedIn networking assistant.

You help users:
- Search their network for specific people or skills
- Find connection paths to people they want to meet
- Write personalized connection messages based on research

Keep responses concise, friendly, and actionable.`;

  // Build conversation context
  const conversationContext =
    conversationHistory && conversationHistory.length > 0
      ? conversationHistory
          .slice(-5) // Last 5 messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join('\n')
      : '';

  const fullPrompt = conversationContext
    ? `${conversationContext}\n\nuser: ${message}`
    : message;

  return generateMessage(fullPrompt, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 300,
  });
}
