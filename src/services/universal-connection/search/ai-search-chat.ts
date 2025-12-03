/**
 * AI-Powered Search Chat Interface
 * Wraps algorithmic search with conversational AI responses
 *
 * Uses OpenAI or Anthropic to provide ChatGPT-like experience while
 * keeping search fast and local
 */

import { aiProvider } from '../../ai-provider';
import { searchGraph } from './graph-query';
import type { SearchQuery, SearchResult } from '../../../types/search';
import type { AIMessage } from '../../ai-provider';
import {
  extractCompany,
  extractLocation,
  extractRole,
  extractConnectionDegree,
  extractYearsExperience,
  buildCleanQuery,
} from './query-extractors';
import { getDegreeSuffix } from './search-helpers';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    searchResults?: SearchResult[];
    resultCount?: number;
    query?: SearchQuery;
  };
}

export interface AIChatHistory {
  messages: AIChatMessage[];
  context: {
    lastSearchResults?: SearchResult[];
    lastQuery?: SearchQuery;
  };
}

/**
 * AI Chat Interface for Search
 * Provides conversational wrapper around algorithmic search
 */
export class AISearchChat {
  private history: AIChatMessage[] = [];
  private context: AIChatHistory['context'] = {};

  /**
   * Process user query with AI chat interface
   */
  async chat(userMessage: string): Promise<AIChatMessage> {
    // Add user message to history
    this.addMessage('user', userMessage);

    try {
      // Parse query using existing search query parser
      const searchQuery = this.parseSearchQuery(userMessage);

      // Execute algorithmic search
      const results = await searchGraph(searchQuery);

      // Store results in context for follow-ups
      this.context.lastSearchResults = results;
      this.context.lastQuery = searchQuery;

      // Generate conversational response with AI
      const aiResponse = await this.generateConversationalResponse(
        userMessage,
        results,
        searchQuery
      );

      // Add AI response to history
      const assistantMessage = this.addMessage('assistant', aiResponse, {
        searchResults: results.slice(0, 10), // Top 10 results
        resultCount: results.length,
        query: searchQuery,
      });

      return assistantMessage;
    } catch (error) {
      const errorMessage = `I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return this.addMessage('assistant', errorMessage);
    }
  }

  /**
   * Generate conversational AI response based on search results
   */
  private async generateConversationalResponse(
    userQuery: string,
    results: SearchResult[],
    _searchQuery: SearchQuery
  ): Promise<string> {
    // Build context for AI
    const topResults = results.slice(0, 5);

    const resultsContext = topResults
      .map((r, i) => `${i + 1}. ${r.name} - ${r.headline || 'No headline'} (${r.connectionDegree}${getDegreeSuffix(r.connectionDegree)} degree, ${r.matchScore}% match)\n   Company: ${r.company || 'Unknown'}\n   Role: ${r.role || 'Unknown'}\n   Reasoning: ${r.reasoning}`)
      .join('\n\n');

    const prompt = `You are a LinkedIn networking assistant helping users understand their network search results.

USER QUERY: "${userQuery}"

SEARCH RESULTS (${results.length} total, showing top 5):
${resultsContext}

${results.length === 0 ? 'No results were found.' : ''}

INSTRUCTIONS:
1. Provide a natural, conversational response explaining the search results
2. Highlight the best matches (highest scores)
3. Explain WHY these people match (based on reasoning)
4. Suggest next steps (e.g., "Would you like me to find the best path to connect?")
5. Keep tone professional but friendly
6. Format with clear sections and bullet points
7. If no results, suggest refining the search

IMPORTANT: Use ONLY the information provided above. Do not invent or hallucinate data.

Response:`;

    // Get AI response
    const aiMessages: AIMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const aiResponse = await aiProvider.sendMessage(aiMessages, {
      temperature: 0.4, // Lower temperature for factual responses
      maxTokens: 500,
    });

    return aiResponse.content;
  }

  /**
   * Parse natural language query into structured search query
   * Uses shared query extractors for consistency
   */
  private parseSearchQuery(message: string): SearchQuery {
    // Extract filters using shared extractor functions
    const company = extractCompany(message);
    const location = extractLocation(message);
    const role = extractRole(message);
    const connectionDegree = extractConnectionDegree(message);
    const yearsExperience = extractYearsExperience(message);

    // Build extracted object for buildCleanQuery
    const extracted = {
      company,
      location,
      role,
      connectionDegree,
    };

    // Build clean query by removing filter keywords
    const query = buildCleanQuery(message, extracted);

    return {
      query,
      filters: {
        company: company || undefined,
        location: location || undefined,
        role: role || undefined,
        connectionDegree: connectionDegree || undefined,
        yearsExperience: yearsExperience || undefined,
      },
    };
  }

  /**
   * Add message to history
   */
  private addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: AIChatMessage['metadata']
  ): AIChatMessage {
    const message: AIChatMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.history.push(message);

    // Keep only last 10 messages to prevent token overflow
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
    }

    return message;
  }

  /**
   * Handle follow-up questions
   */
  async handleFollowUp(userMessage: string): Promise<AIChatMessage> {
    const lowerMessage = userMessage.toLowerCase();

    // Check if this is a follow-up question
    const isFollowUp =
      lowerMessage.includes('tell me more') ||
      lowerMessage.includes('what about') ||
      lowerMessage.includes('how about') ||
      lowerMessage.includes('details on') ||
      lowerMessage.startsWith('who ') ||
      this.context.lastSearchResults !== undefined;

    if (isFollowUp && this.context.lastSearchResults) {
      return this.answerFollowUpQuestion(userMessage, this.context.lastSearchResults);
    }

    // Otherwise, treat as new search
    return this.chat(userMessage);
  }

  /**
   * Answer follow-up questions about previous search results
   */
  private async answerFollowUpQuestion(
    question: string,
    previousResults: SearchResult[]
  ): Promise<AIChatMessage> {
    this.addMessage('user', question);

    try {
      const resultsContext = previousResults
        .slice(0, 10)
        .map((r, i) => `${i + 1}. ${r.name} - ${r.headline || 'No headline'}\n   Company: ${r.company}\n   Match: ${r.matchScore}%\n   Degree: ${r.connectionDegree}${getDegreeSuffix(r.connectionDegree)}\n   Reasoning: ${r.reasoning}`)
        .join('\n\n');

      const prompt = `You are a LinkedIn networking assistant. The user previously searched and got these results:

PREVIOUS RESULTS:
${resultsContext}

USER FOLLOW-UP QUESTION: "${question}"

INSTRUCTIONS:
1. Answer the follow-up question using ONLY the results above
2. Be specific - reference names and details from the results
3. If asking about a specific person, provide their full details
4. If the question can't be answered from the results, say so clearly
5. Keep response concise and actionable

IMPORTANT: Use ONLY the information from the results above. Do not invent data.

Response:`;

      const aiMessages: AIMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const aiResponse = await aiProvider.sendMessage(aiMessages, {
        temperature: 0.3, // Even lower for follow-ups
        maxTokens: 400,
      });

      return this.addMessage('assistant', aiResponse.content, {
        searchResults: previousResults.slice(0, 10),
      });
    } catch (error) {
      const errorMessage = `Sorry, I couldn't process that follow-up question: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return this.addMessage('assistant', errorMessage);
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): AIChatMessage[] {
    return [...this.history];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.history = [];
    this.context = {};
  }
}

// Singleton instance
export const aiSearchChat = new AISearchChat();
