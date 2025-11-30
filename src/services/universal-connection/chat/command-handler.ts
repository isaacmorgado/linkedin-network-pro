/**
 * Command Handler
 * Handles special chat commands like clear, reset, etc.
 */

import type { ChatMessage } from '@/types/search';

/**
 * Check if message is a special command
 */
export function isCommandMessage(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return (
    lower === 'start over' ||
    lower === 'clear' ||
    lower === 'reset' ||
    lower === 'new conversation'
  );
}

/**
 * Handle special commands
 */
export function handleCommand(message: string): ChatMessage {
  const lower = message.toLowerCase().trim();

  if (
    lower === 'start over' ||
    lower === 'clear' ||
    lower === 'reset' ||
    lower === 'new conversation'
  ) {
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Conversation cleared! How can I help you with your LinkedIn network?',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: "I'm not sure how to help with that command.",
    timestamp: new Date().toISOString(),
  };
}
