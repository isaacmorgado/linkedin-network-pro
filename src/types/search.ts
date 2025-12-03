/**
 * Search Types
 * Type definitions for natural language search and chat features
 */

import { z } from 'zod';

/**
 * Natural Language Search Query
 */
export const SearchQuerySchema = z.object({
  query: z.string(),
  filters: z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    yearsExperience: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    location: z.string().optional(),
    connectionDegree: z.array(z.number().min(1).max(3)).optional(),
  }).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * Search Result
 */
export const SearchResultSchema = z.object({
  profileId: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  connectionDegree: z.number(),
  matchScore: z.number().min(0).max(100),
  pathAvailable: z.boolean(),
  reasoning: z.string(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * Chat Message
 */
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    searchResults: z.array(SearchResultSchema).optional(),
    paths: z.array(z.any()).optional(), // EnhancedConnectionRoute[]
  }).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
