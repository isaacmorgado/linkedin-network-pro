/**
 * Chat Agent
 * Main orchestrator for managing conversation state and multi-turn interactions
 *
 * Features:
 * - Conversation history (last 10 messages)
 * - Context from previous queries
 * - Follow-up question handling
 * - Search result memory
 */

import { classifyIntent } from './intent-classifier';
import { generateResponse } from './response-generator';
import { resolveContextReferences } from './context-resolver';
import { isCommandMessage, handleCommand } from './command-handler';
import type { Intent } from './intent-classifier';
import type { ChatMessage } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph } from '../universal-connection-types';
import type { ConversationContext } from './types';

/**
 * Chat Agent for managing conversational interactions
 */
export class ChatAgent {
  private history: ChatMessage[] = [];
  private context: ConversationContext = {};
  private graph?: Graph;
  private sourceUser?: UserProfile;
  private maxHistorySize = 10;

  /**
   * Set network graph for search and pathfinding
   */
  setGraph(graph: Graph): void {
    this.graph = graph;
  }

  /**
   * Set source user profile for pathfinding
   */
  setSourceUser(user: UserProfile): void {
    this.sourceUser = user;
  }

  /**
   * Process a chat message and return response
   */
  async chat(message: string): Promise<ChatMessage> {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    this.addToHistory(userMessage);

    // Handle special commands
    if (isCommandMessage(message)) {
      const response = handleCommand(message);
      this.addToHistory(response);
      // Clear context if it's a reset command
      if (response.content.includes('Conversation cleared')) {
        this.clearHistory();
      }
      return response;
    }

    // Classify intent
    let intent = await classifyIntent(message);

    // Handle context references (follow-up questions)
    intent = resolveContextReferences(intent, message, this.context);

    // Generate response
    const response = await generateResponse(intent, this.graph, this.sourceUser);

    // Update context from response metadata
    this.updateContext(response, intent);

    // Add response to history
    this.addToHistory(response);

    return response;
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Clear conversation history and context
   */
  clearHistory(): void {
    this.history = [];
    this.context = {};
  }

  /**
   * Get last search results from context
   */
  getLastSearchResults() {
    return this.context.lastSearchResults;
  }

  /**
   * Get last connection paths from context
   */
  getLastPaths() {
    return this.context.lastPaths;
  }

  /**
   * Update context from response
   */
  private updateContext(response: ChatMessage, intent: Intent): void {
    // Store search results
    if (response.metadata?.searchResults) {
      this.context.lastSearchResults = response.metadata.searchResults;
    }

    // Store paths
    if (response.metadata?.paths) {
      this.context.lastPaths = response.metadata.paths;
    }

    // Store last intent and query
    this.context.lastIntent = intent;
    this.context.lastQuery = intent.rawMessage;
  }

  /**
   * Add message to history (maintain max size)
   */
  private addToHistory(message: ChatMessage): void {
    this.history.push(message);

    // Trim to max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Singleton chat agent instance
 */
export const chatAgent = new ChatAgent();
