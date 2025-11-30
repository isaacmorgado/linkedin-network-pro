/**
 * POST /api/find-path
 * Server-side pathfinding using semantic embeddings
 * Fallback when client-side pathfinding fails
 *
 * VERCEL SERVERLESS FUNCTION
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FindPathRequestSchema,
  type EnhancedConnectionRoute,
  type NetworkNode,
} from '../src/types/index.js';
import { getEmbedding, cosineSimilarity } from '../src/services/embeddings.js';
import { query } from '../src/db/client.js';
import { successResponse, errorResponse } from '../src/middleware/validation.js';

/**
 * Main handler for find-path endpoint
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
    const validation = FindPathRequestSchema.safeParse(req.body);

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

    const { userId, sourceProfileId, targetProfileId, strategy } = validation.data;

    console.log(
      `[FindPath] User ${userId} finding path: ${sourceProfileId} -> ${targetProfileId}`
    );

    // ========================================================================
    // STEP 1: Get source and target profiles from database
    // ========================================================================

    const sourceProfile = await query(
      'SELECT * FROM network_nodes WHERE user_id = $1 AND id = $2',
      [userId, sourceProfileId]
    );

    const targetProfile = await query(
      'SELECT * FROM network_nodes WHERE user_id = $1 AND id = $2',
      [userId, targetProfileId]
    );

    if (sourceProfile.rows.length === 0 || targetProfile.rows.length === 0) {
      res.status(404).json(
        errorResponse('PROFILE_NOT_FOUND', 'Source or target profile not found', undefined, 404)
      );
      return;
    }

    const source = sourceProfile.rows[0];
    const target = targetProfile.rows[0];

    // ========================================================================
    // STEP 2: Try different pathfinding strategies
    // ========================================================================

    let route: EnhancedConnectionRoute | null = null;

    // Strategy: Direct connection (1st degree)
    if (!strategy || strategy === 'direct') {
      route = await tryDirectConnection(userId, source, target);
      if (route) {
        res.status(200).json(successResponse({ route }));
        return;
      }
    }

    // Strategy: Mutual connections (2nd degree)
    if (!strategy || strategy === 'mutual') {
      route = await tryMutualConnection(userId, source, target);
      if (route) {
        res.status(200).json(successResponse({ route }));
        return;
      }
    }

    // Strategy: Semantic similarity (fallback)
    if (!strategy || strategy === 'semantic') {
      route = await trySemanticPath(userId, source, target);
      if (route) {
        res.status(200).json(successResponse({ route }));
        return;
      }
    }

    // ========================================================================
    // STEP 3: No path found
    // ========================================================================

    console.log('[FindPath] No path found');

    res.status(404).json(
      errorResponse(
        'NO_PATH_FOUND',
        'No connection path found to target',
        {
          source: source.name,
          target: target.name,
          strategiesTried: ['direct', 'mutual', 'semantic'],
        },
        404
      )
    );
  } catch (error: any) {
    console.error('❌ FindPath error:', error);

    res.status(500).json(
      errorResponse(
        'PATHFINDING_ERROR',
        'Pathfinding failed',
        process.env.NODE_ENV === 'development' ? error.message : undefined,
        500
      )
    );
  }
}

// ============================================================================
// Strategy Implementations
// ============================================================================

/**
 * Try direct connection (1st degree)
 */
async function tryDirectConnection(
  userId: string,
  source: any,
  target: any
): Promise<EnhancedConnectionRoute | null> {
  console.log('[FindPath] Trying direct connection strategy');

  // Check if target is 1st degree connection
  if (target.degree === 1) {
    return {
      path: [
        formatNode(source),
        formatNode(target),
      ],
      strategy: 'direct',
      successProbability: 90,
      actionSteps: [
        `Reach out directly to ${target.name}`,
        'Send personalized connection message',
        'Reference shared interests or mutual connections',
      ],
      reasoning: `${target.name} is your direct connection (1st degree). You can message them directly on LinkedIn.`,
    };
  }

  return null;
}

/**
 * Try mutual connection path (2nd degree)
 */
async function tryMutualConnection(
  userId: string,
  source: any,
  target: any
): Promise<EnhancedConnectionRoute | null> {
  console.log('[FindPath] Trying mutual connection strategy');

  // Check if target is 2nd degree connection
  if (target.degree === 2) {
    // Find mutual connection (1st degree who connects to target)
    // TODO: Query actual mutual connections from database
    const mutualConnections = await query(
      `SELECT * FROM network_nodes
       WHERE user_id = $1
       AND degree = 1
       AND id IN (
         SELECT intermediary_id FROM connection_paths
         WHERE source_id = $2 AND target_id = $3
       )
       LIMIT 1`,
      [userId, source.id, target.id]
    );

    if (mutualConnections.rows.length > 0) {
      const intermediary = mutualConnections.rows[0];

      return {
        path: [
          formatNode(source),
          formatNode(intermediary),
          formatNode(target),
        ],
        strategy: 'mutual',
        successProbability: 75,
        actionSteps: [
          `Reach out to ${intermediary.name} (your mutual connection)`,
          `Ask ${intermediary.name} for an introduction to ${target.name}`,
          'Explain why you want to connect',
          'Offer value or context for the introduction',
        ],
        reasoning: `${intermediary.name} is your direct connection who also knows ${target.name}. They can introduce you.`,
      };
    }
  }

  return null;
}

/**
 * Try semantic similarity path (AI-powered fallback)
 */
async function trySemanticPath(
  userId: string,
  source: any,
  target: any
): Promise<EnhancedConnectionRoute | null> {
  console.log('[FindPath] Trying semantic similarity strategy');

  try {
    // Generate profile embeddings
    const sourceText = [source.name, source.headline, source.company, source.role]
      .filter(Boolean)
      .join(' ');

    const targetText = [target.name, target.headline, target.company, target.role]
      .filter(Boolean)
      .join(' ');

    const sourceEmbedding = await getEmbedding(sourceText);
    const targetEmbedding = await getEmbedding(targetText);

    // Calculate similarity
    const similarity = cosineSimilarity(sourceEmbedding, targetEmbedding);
    const matchScore = Math.round(similarity * 100);

    console.log(`[FindPath] Semantic similarity: ${matchScore}%`);

    // If similarity is high enough, suggest a "soft path"
    if (matchScore >= 60) {
      // Find similar people in user's network who might bridge the gap
      const bridgeCandidates = await query(
        `SELECT * FROM network_nodes
         WHERE user_id = $1
         AND degree <= 2
         AND (company ILIKE $2 OR industry ILIKE $3)
         LIMIT 5`,
        [userId, `%${target.company}%`, `%${target.industry}%`]
      );

      const actionSteps = [
        `${target.name} shares ${matchScore}% profile similarity with you`,
        `Consider reaching out through shared interests:`,
      ];

      // Add common elements
      if (source.company === target.company) {
        actionSteps.push(`• Both work at ${source.company}`);
      }
      if (source.industry === target.industry) {
        actionSteps.push(`• Both in ${source.industry} industry`);
      }

      if (bridgeCandidates.rows.length > 0) {
        actionSteps.push(
          `• Connect through ${bridgeCandidates.rows[0].name} who works at similar companies`
        );
      }

      return {
        path: [formatNode(source), formatNode(target)],
        strategy: 'semantic',
        successProbability: Math.min(matchScore, 70),
        actionSteps,
        reasoning: `No direct path found, but ${target.name} has ${matchScore}% profile similarity to you based on interests, industry, and background. Consider a personalized cold outreach.`,
      };
    }

    return null;
  } catch (error) {
    console.error('[FindPath] Semantic path error:', error);
    return null;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format database node to API response format
 */
function formatNode(node: any): NetworkNode {
  return {
    id: node.id,
    name: node.name,
    headline: node.headline,
    profileUrl: node.profile_url,
    degree: node.degree,
    company: node.company,
    role: node.role,
    location: node.location,
  };
}
