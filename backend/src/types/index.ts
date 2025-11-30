import { z } from 'zod';

// ============================================================================
// SHARED TYPES WITH FRONTEND
// ============================================================================

// Network Node (from extension)
export const NetworkNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  profileUrl: z.string().url(),
  degree: z.number().min(1).max(3),
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  connectionDate: z.string().optional(),
});

export type NetworkNode = z.infer<typeof NetworkNodeSchema>;

// Search Request/Response
export const SearchRequestSchema = z.object({
  userId: z.string(),
  query: z.string(),
  filters: z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    location: z.string().optional(),
    connectionDegree: z.array(z.number()).optional(),
  }).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResultSchema = z.object({
  profile: NetworkNodeSchema,
  matchScore: z.number().min(0).max(100),
  reasoning: z.string(),
  pathAvailable: z.boolean(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Pathfinding Request/Response
export const FindPathRequestSchema = z.object({
  userId: z.string(),
  sourceProfileId: z.string(),
  targetProfileId: z.string(),
  strategy: z.enum(['direct', 'mutual', 'engagement_bridge', 'company_bridge', 'semantic']).optional(),
});

export type FindPathRequest = z.infer<typeof FindPathRequestSchema>;

export const EnhancedConnectionRouteSchema = z.object({
  path: z.array(NetworkNodeSchema),
  strategy: z.enum(['direct', 'mutual', 'engagement_bridge', 'company_bridge', 'semantic']),
  successProbability: z.number().min(0).max(100),
  actionSteps: z.array(z.string()),
  reasoning: z.string(),
});

export type EnhancedConnectionRoute = z.infer<typeof EnhancedConnectionRouteSchema>;

// Message Generation Request/Response
export const GenerateMessageRequestSchema = z.object({
  userId: z.string(),
  targetProfile: NetworkNodeSchema,
  sourceProfile: NetworkNodeSchema,
  context: z.object({
    purpose: z.enum(['intro_request', 'job_inquiry', 'networking', 'referral']),
    sharedContext: z.array(z.string()).optional(),
    pathInfo: EnhancedConnectionRouteSchema.optional(),
  }),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).default('professional'),
});

export type GenerateMessageRequest = z.infer<typeof GenerateMessageRequestSchema>;

export const GenerateMessageResponseSchema = z.object({
  message: z.string(),
  alternatives: z.array(z.string()),
  reasoning: z.array(z.string()),
  characterCount: z.number(),
});

export type GenerateMessageResponse = z.infer<typeof GenerateMessageResponseSchema>;

// Chat Request/Response
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  metadata: z.any().optional(),
  timestamp: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  userId: z.string(),
  message: z.string(),
  conversationHistory: z.array(ChatMessageSchema).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Embeddings Request/Response
export const EmbeddingsRequestSchema = z.object({
  texts: z.array(z.string()).max(100),
  model: z.string().default('text-embedding-3-large'),
  dimensions: z.number().default(1536),
});

export type EmbeddingsRequest = z.infer<typeof EmbeddingsRequestSchema>;

// API Response Wrappers
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// User Request Extension (for Express)
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email?: string;
    };
  }
}
