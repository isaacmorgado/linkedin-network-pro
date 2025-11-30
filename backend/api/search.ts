/**
 * POST /api/search
 * Semantic search across user's network using embeddings
 *
 * VERCEL SERVERLESS FUNCTION
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SearchRequestSchema, type SearchResult } from '../src/types/index.js';
import { getEmbedding, cosineSimilarity } from '../src/services/embeddings.js';
import { query } from '../src/db/client.js';
import { successResponse, errorResponse } from '../src/middleware/validation.js';

/**
 * Main handler for search endpoint
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
    const validation = SearchRequestSchema.safeParse(req.body);

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

    const { userId, query: searchQuery, filters } = validation.data;

    console.log(`[Search] User ${userId} searching for: "${searchQuery}"`);

    // ========================================================================
    // STEP 1: Generate embedding for search query
    // ========================================================================

    const queryEmbedding = await getEmbedding(searchQuery);
    console.log(`[Search] Generated query embedding (${queryEmbedding.length} dimensions)`);

    // ========================================================================
    // STEP 2: Get user's network nodes from database
    // ========================================================================

    // In production, this would query the stored network graph
    // For now, we'll query profiles from the database
    // TODO: Replace with actual network graph query

    let sqlQuery = `
      SELECT
        id,
        name,
        headline,
        profile_url,
        degree,
        company,
        role,
        location,
        profile_embedding
      FROM network_nodes
      WHERE user_id = $1
    `;

    const queryParams: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.company) {
      sqlQuery += ` AND company ILIKE $${paramIndex}`;
      queryParams.push(`%${filters.company}%`);
      paramIndex++;
    }

    if (filters?.role) {
      sqlQuery += ` AND role ILIKE $${paramIndex}`;
      queryParams.push(`%${filters.role}%`);
      paramIndex++;
    }

    if (filters?.location) {
      sqlQuery += ` AND location ILIKE $${paramIndex}`;
      queryParams.push(`%${filters.location}%`);
      paramIndex++;
    }

    if (filters?.connectionDegree && filters.connectionDegree.length > 0) {
      sqlQuery += ` AND degree = ANY($${paramIndex})`;
      queryParams.push(filters.connectionDegree);
      paramIndex++;
    }

    sqlQuery += ' LIMIT 100'; // Limit to top 100 for performance

    const networkNodes = await query(sqlQuery, queryParams);

    console.log(`[Search] Found ${networkNodes.rows.length} network nodes`);

    if (networkNodes.rows.length === 0) {
      res.status(200).json(
        successResponse({
          results: [],
          totalResults: 0,
          query: searchQuery,
        })
      );
      return;
    }

    // ========================================================================
    // STEP 3: Calculate similarity scores
    // ========================================================================

    const results: SearchResult[] = [];

    for (const node of networkNodes.rows) {
      // Get profile embedding (stored or generate)
      let profileEmbedding: number[];

      if (node.profile_embedding) {
        // Use cached embedding
        profileEmbedding = JSON.parse(node.profile_embedding);
      } else {
        // Generate embedding from profile text
        const profileText = [
          node.name,
          node.headline || '',
          node.company || '',
          node.role || '',
        ]
          .filter(Boolean)
          .join(' ');

        profileEmbedding = await getEmbedding(profileText);

        // Cache embedding for future searches
        await query(
          'UPDATE network_nodes SET profile_embedding = $1 WHERE id = $2',
          [JSON.stringify(profileEmbedding), node.id]
        );
      }

      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, profileEmbedding);
      const matchScore = Math.round(similarity * 100);

      // Only include results with decent match score
      if (matchScore >= 50) {
        results.push({
          profile: {
            id: node.id,
            name: node.name,
            headline: node.headline,
            profileUrl: node.profile_url,
            degree: node.degree,
            company: node.company,
            role: node.role,
            location: node.location,
          },
          matchScore,
          reasoning: generateReasoning(searchQuery, node, matchScore),
          pathAvailable: true, // TODO: Check if path exists
        });
      }
    }

    // ========================================================================
    // STEP 4: Sort by match score and return top results
    // ========================================================================

    results.sort((a, b) => b.matchScore - a.matchScore);
    const topResults = results.slice(0, 50);

    console.log(`[Search] Returning ${topResults.length} results (filtered from ${results.length})`);

    res.status(200).json(
      successResponse({
        results: topResults,
        totalResults: topResults.length,
        query: searchQuery,
        filters: filters || {},
      })
    );
  } catch (error: any) {
    console.error('❌ Search error:', error);

    res.status(500).json(
      errorResponse(
        'SEARCH_ERROR',
        'Search failed',
        process.env.NODE_ENV === 'development' ? error.message : undefined,
        500
      )
    );
  }
}

/**
 * Generate reasoning for why this profile matches the search
 */
function generateReasoning(
  searchQuery: string,
  profile: any,
  matchScore: number
): string {
  const reasons: string[] = [];

  if (matchScore >= 80) {
    reasons.push(`Excellent match (${matchScore}% similarity)`);
  } else if (matchScore >= 70) {
    reasons.push(`Strong match (${matchScore}% similarity)`);
  } else {
    reasons.push(`Good match (${matchScore}% similarity)`);
  }

  if (profile.company) {
    reasons.push(`Works at ${profile.company}`);
  }

  if (profile.role) {
    reasons.push(`${profile.role}`);
  }

  if (profile.degree === 1) {
    reasons.push('Direct connection (1st degree)');
  } else if (profile.degree === 2) {
    reasons.push('2nd degree connection');
  } else if (profile.degree === 3) {
    reasons.push('3rd degree connection');
  }

  return reasons.join(' • ');
}
