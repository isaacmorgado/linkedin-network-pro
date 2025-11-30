/**
 * Network Types
 * Type definitions for network analysis and pathfinding features
 */

import { z } from 'zod';

/**
 * Activity Event - Who engaged with whom
 */
export const ActivityEventSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string(), // Person who performed action
  targetId: z.string(), // Person who was acted upon
  type: z.enum(['comment', 'reaction', 'share', 'post']),
  content: z.string().optional(),
  postId: z.string().optional(),
  timestamp: z.string().datetime(),
  scrapedAt: z.string().datetime(),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

/**
 * Engagement Bridge - Aggregated activity between two people
 */
export const EngagementBridgeSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  engagementCount: z.number().min(0),
  lastEngaged: z.string().datetime(),
  types: z.array(z.enum(['comment', 'reaction', 'share'])),
  strength: z.number().min(0).max(1), // 0-1 normalized strength
});

export type EngagementBridge = z.infer<typeof EngagementBridgeSchema>;

/**
 * Company Employee Map
 */
export const CompanyEmployeeSchema = z.object({
  profileId: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  role: z.string(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  connectionDegree: z.number().min(0).max(3), // 0=you, 1=1st, 2=2nd, 3=3rd
  mutualConnections: z.array(z.string()).default([]),
  profileUrl: z.string().url(),
});

export type CompanyEmployee = z.infer<typeof CompanyEmployeeSchema>;

export const CompanyMapSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  employees: z.array(CompanyEmployeeSchema),
  scrapedAt: z.string().datetime(),
});

export type CompanyMap = z.infer<typeof CompanyMapSchema>;

/**
 * Connection Path Strategy
 */
export const PathStrategySchema = z.enum([
  'direct',           // 1st-degree connection
  'mutual',           // 2nd/3rd-degree via mutual
  'engagement_bridge', // Via who target engages with
  'company_bridge',   // Via company connections
  'semantic',         // No path, but similar profiles
]);

export type PathStrategy = z.infer<typeof PathStrategySchema>;

/**
 * Enhanced Connection Route
 */
export const EnhancedConnectionRouteSchema = z.object({
  targetId: z.string(),
  strategy: PathStrategySchema,
  nodes: z.array(z.any()), // NetworkNode[]
  edges: z.array(z.any()), // NetworkEdge[]
  totalWeight: z.number(),
  successProbability: z.number().min(0).max(100),
  reasoning: z.string(), // Why this path is recommended
  actionSteps: z.array(z.string()), // Step-by-step instructions
  computedAt: z.string().datetime(),
});

export type EnhancedConnectionRoute = z.infer<typeof EnhancedConnectionRouteSchema>;
