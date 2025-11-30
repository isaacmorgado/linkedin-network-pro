/**
 * API Types
 * Type definitions for backend API requests and responses
 */

import { z } from 'zod';

/**
 * API Request: Search
 */
export const SearchRequestSchema = z.object({
  userId: z.string().uuid(),
  query: z.string(),
  filters: z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    yearsExperience: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    location: z.string().optional(),
    connectionDegree: z.array(z.number().min(1).max(3)).optional(),
  }).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * API Request: Find Path
 */
export const FindPathRequestSchema = z.object({
  userId: z.string().uuid(),
  targetLinkedInId: z.string(),
  sourceProfile: z.any(), // UserProfile
  targetProfile: z.any(), // UserProfile
});

export type FindPathRequest = z.infer<typeof FindPathRequestSchema>;

/**
 * API Request: Generate Message
 */
export const GenerateMessageRequestSchema = z.object({
  userId: z.string().uuid(),
  targetProfile: z.any(), // UserProfile
  sourceProfile: z.any(), // UserProfile
  context: z.object({
    purpose: z.enum(['intro_request', 'cold_outreach', 'follow_up']),
    pathInfo: z.any().optional(), // EnhancedConnectionRoute
    additionalContext: z.string().optional(),
  }),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).default('professional'),
});

export type GenerateMessageRequest = z.infer<typeof GenerateMessageRequestSchema>;

/**
 * API Request: Chat
 */
export const ChatRequestSchema = z.object({
  userId: z.string().uuid(),
  message: z.string(),
  conversationHistory: z.array(z.any()).optional(), // ChatMessage[]
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * API Request: Get Embeddings
 */
export const EmbeddingsRequestSchema = z.object({
  texts: z.array(z.string()).min(1).max(100),
  model: z.string().default('text-embedding-3-large'),
  dimensions: z.number().default(1536),
});

export type EmbeddingsRequest = z.infer<typeof EmbeddingsRequestSchema>;

/**
 * API Response: Generic Success
 */
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  timestamp: z.string().datetime(),
});

export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  timestamp: string;
};

/**
 * API Response: Generic Error
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  timestamp: z.string().datetime(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
