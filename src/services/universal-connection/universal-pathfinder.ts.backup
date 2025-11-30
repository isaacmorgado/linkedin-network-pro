/**
 * Universal Pathfinder
 * Main orchestrator for LinkedIn universal connection pathfinding
 *
 * Multi-stage algorithm that tries strategies in order of preference:
 * 1. Mutual connections (existing A* algorithm)
 * 2. Direct similarity (> 0.65)
 * 3. Intermediary matching (score > 0.35)
 * 4. Cold similarity (> 0.45)
 * 5. No recommendation (< 0.45)
 *
 * Research Foundation:
 * - LinkedIn PYMK algorithm
 * - Academic link prediction research
 * - B2B outreach benchmarks
 */

import type { UserProfile } from '../../types/resume-tailoring';
import type {
  ConnectionStrategy,
  ProfileSimilarity,
  Graph,
  DEFAULT_THRESHOLDS,
} from './universal-connection-types';

import {
  calculateProfileSimilarity,
  findBestIntermediaries,
} from './intermediary-scorer';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find node ID in graph by trying multiple ID formats
 *
 * Tries in order: id, email, name, publicId
 * Returns null if not found in graph
 *
 * @param graph Network graph
 * @param user User profile to find
 * @returns Node ID string or null if not found
 */
function findNodeIdInGraph(graph: Graph, user: UserProfile): string | null {
  // Try multiple ID formats in order of preference
  const possibleIds = [
    user.id,
    user.email,
    user.name,
    (user as any).publicId, // Some profiles may have publicId
  ].filter(Boolean);

  // Try each ID to see if it exists in the graph
  for (const id of possibleIds) {
    if (id && graph.getNode?.(id)) {
      return id;
    }
  }

  // If getNode isn't available, return the most likely ID
  // (for backwards compatibility with graphs that don't implement getNode)
  return user.id || user.email || user.name || null;
}

// ============================================================================
// Universal Connection Pathfinding
// ============================================================================

/**
 * Find universal connection path to anyone on LinkedIn
 *
 * Tries multiple strategies in order:
 * 1. Mutual connections via A* (best option)
 * 2. Direct high similarity (> 0.65)
 * 3. Intermediary matching via similarity
 * 4. Cold similarity-based outreach (> 0.45)
 * 5. No recommendation (< 0.45)
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param graph Network graph with connections
 * @returns ConnectionStrategy with type, confidence, acceptance rate, and next steps
 */
export async function findUniversalConnection(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy> {
  // ========================================================================
  // STAGE 1: Mutual Connections (Use Existing A* Algorithm)
  // ========================================================================

  // Try existing A* or BFS algorithm if available
  if (graph.bidirectionalBFS) {
    try {
      // Find node IDs in graph
      const sourceId = findNodeIdInGraph(graph, sourceUser);
      const targetId = findNodeIdInGraph(graph, targetUser);

      if (!sourceId || !targetId) {
        throw new Error(
          'Unable to find profile in your network. Please visit some LinkedIn profiles to build your network graph, then try again.'
        );
      }

      const astarResult = await graph.bidirectionalBFS(sourceId, targetId);

      if (astarResult && astarResult.path.length > 0) {
        // Found path via mutual connections
        const intermediaryCount = astarResult.path.length - 2;

        return {
          type: 'mutual',
          confidence: astarResult.probability,
          path: {
            nodes: astarResult.path,
            edges: [], // Would be populated by actual graph
            totalWeight: 1 - astarResult.probability,
            successProbability: astarResult.probability,
            mutualConnections: astarResult.mutualConnections,
          },
          estimatedAcceptanceRate: astarResult.probability * 0.50, // 45-55% for mutuals
          reasoning: `Found path via ${intermediaryCount} ${intermediaryCount === 1 ? 'intermediary' : 'intermediaries'} with ${astarResult.mutualConnections} mutual connections`,
          nextSteps: generateMutualNextSteps(astarResult.path, targetUser),
        };
      }
    } catch (error) {
      console.warn('A* pathfinding failed, falling back to similarity-based strategies:', error);
    }
  }

  // ========================================================================
  // STAGE 2: Direct High Similarity (> 0.65)
  // ========================================================================

  const directSimilarity = calculateProfileSimilarity(sourceUser, targetUser);

  if (directSimilarity.overall >= 0.65) {
    // High similarity = "same school" quality connection
    const acceptanceRate = 0.35 + (directSimilarity.overall - 0.65) * (0.07 / 0.35); // 35-42%

    return {
      type: 'direct-similarity',
      confidence: directSimilarity.overall,
      directSimilarity,
      estimatedAcceptanceRate: acceptanceRate,
      reasoning: `Very high profile similarity (${(directSimilarity.overall * 100).toFixed(1)}%): ${getTopSimilarities(directSimilarity.breakdown)}`,
      nextSteps: generateDirectSimilarityNextSteps(
        targetUser,
        directSimilarity
      ),
    };
  }

  // ========================================================================
  // STAGE 3: Intermediary Matching
  // ========================================================================

  try {
    // Find node IDs in graph
    const sourceId = findNodeIdInGraph(graph, sourceUser);
    const targetId = findNodeIdInGraph(graph, targetUser);

    // If either user isn't found, skip intermediary matching
    // (fall through to similarity-based strategies)
    if (!sourceId) {
      throw new Error('Unable to load your profile from the network. Please ensure you are logged into LinkedIn or have completed your profile in the Resume tab.');
    }

    const sourceConnections = await graph.getConnections(sourceId);

    // If target isn't in graph, we can't get their connections
    // Try to find intermediaries just from source's connections
    let targetConnections: any[] = [];
    if (targetId && graph.getNode && graph.getNode(targetId)) {
      targetConnections = await graph.getConnections(targetId);
    }

    const intermediaries = findBestIntermediaries(
      sourceUser,
      targetUser,
      sourceConnections,
      targetConnections
    );

    if (intermediaries.length > 0 && intermediaries[0].score > 0.35) {
      const bestIntermediary = intermediaries[0];

      return {
        type: 'intermediary',
        confidence: bestIntermediary.score,
        intermediary: bestIntermediary,
        estimatedAcceptanceRate: bestIntermediary.estimatedAcceptance,
        reasoning: bestIntermediary.reasoning,
        nextSteps: generateIntermediaryNextSteps(
          bestIntermediary,
          sourceUser,
          targetUser
        ),
      };
    }
  } catch (error) {
    console.warn('Intermediary search failed, falling back to cold similarity:', error);
  }

  // ========================================================================
  // STAGE 4: Cold Similarity (0.45-0.65)
  // ========================================================================

  if (directSimilarity.overall >= 0.45) {
    const acceptanceRate = 0.18 + (directSimilarity.overall - 0.45) * (0.07 / 0.20); // 18-25%

    return {
      type: 'cold-similarity',
      confidence: directSimilarity.overall,
      directSimilarity,
      estimatedAcceptanceRate: acceptanceRate,
      reasoning: `Moderate profile similarity (${(directSimilarity.overall * 100).toFixed(1)}%). Cold outreach with personalization recommended.`,
      nextSteps: generateColdSimilarityNextSteps(targetUser, directSimilarity),
    };
  }

  // ========================================================================
  // STAGE 5: No Recommendation (< 0.45)
  // ========================================================================

  return {
    type: 'none',
    confidence: 0,
    directSimilarity,
    estimatedAcceptanceRate: 0.12, // Pure cold outreach rate
    reasoning: `Low profile similarity (${(directSimilarity.overall * 100).toFixed(1)}%). Not recommended for direct connection at this time.`,
    nextSteps: generateNoRecommendationNextSteps(targetUser),
  };
}

// ============================================================================
// Acceptance Rate Mapping
// ============================================================================

/**
 * Map similarity score to acceptance rate
 *
 * Based on research benchmarks:
 * - 0.65-1.0 → 40-45% (same school quality)
 * - 0.45-0.65 → 20-40% (cold personalized)
 * - 0.25-0.45 → 15-20% (some commonalities)
 * - <0.25 → 12-15% (pure cold)
 *
 * @param similarity Profile similarity score (0-1)
 * @returns Acceptance rate (0-1)
 */
export function mapSimilarityToAcceptanceRate(similarity: number): number {
  if (similarity >= 0.65) {
    // 0.65-1.0 maps to 40-45% (same school to best case)
    return 0.40 + (similarity - 0.65) * (0.05 / 0.35);
  }

  if (similarity >= 0.45) {
    // 0.45-0.65 maps to 20-40% (cold personalized to same school)
    return 0.20 + (similarity - 0.45) * (0.20 / 0.20);
  }

  if (similarity >= 0.25) {
    // 0.25-0.45 maps to 15-20% (pure cold to cold personalized)
    return 0.15 + (similarity - 0.25) * (0.05 / 0.20);
  }

  // < 0.25: pure cold outreach (12-15%)
  return 0.12 + similarity * (0.03 / 0.25);
}

/**
 * Get top similarities from breakdown (for UI display)
 *
 * Returns human-readable string like:
 * - "industry and skills"
 * - "education and location"
 * - "skills"
 *
 * @param breakdown Similarity breakdown by attribute
 * @returns Human-readable similarity description
 */
export function getTopSimilarities(
  breakdown: ProfileSimilarity['breakdown']
): string {
  const sorted = Object.entries(breakdown)
    .filter(([_, score]) => score > 0.5)
    .sort(([_, a], [__, b]) => b - a)
    .map(([attr]) => attr);

  if (sorted.length === 0) return 'background';
  if (sorted.length === 1) return sorted[0];
  return `${sorted[0]} and ${sorted[1]}`;
}

// ============================================================================
// Next Steps Generation
// ============================================================================

/**
 * Generate action items for mutual connection strategy
 */
function generateMutualNextSteps(
  path: UserProfile[],
  target: UserProfile
): string[] {
  if (path.length < 2) {
    return ['Error: Invalid path'];
  }

  const firstIntermediary = path[1];
  const steps: string[] = [];

  steps.push(
    `Message ${firstIntermediary.name} (mutual connection)`
  );
  steps.push(`Ask for introduction to ${target.name}`);
  steps.push(`Mention shared connections in your outreach`);

  if (path.length > 2) {
    steps.push(`Consider multiple paths to increase success probability`);
  }

  return steps;
}

/**
 * Generate action items for direct similarity strategy
 */
function generateDirectSimilarityNextSteps(
  target: UserProfile,
  similarity: ProfileSimilarity
): string[] {
  const topSims = getTopSimilarities(similarity.breakdown);

  return [
    `Direct message ${target.name}`,
    `Mention shared ${topSims} in your message`,
    `Reference specific recent posts or achievements`,
    `Keep message concise (200-250 characters)`,
    `Include clear value proposition`,
  ];
}

/**
 * Generate action items for intermediary strategy
 */
function generateIntermediaryNextSteps(
  intermediary: any,
  source: UserProfile,
  target: UserProfile
): string[] {
  const steps: string[] = [];

  if (intermediary.direction === 'outbound') {
    // You already know the intermediary
    steps.push(
      `Connect with ${intermediary.person.name} first (if not already connected)`
    );
    steps.push(`Build relationship by engaging with their posts`);
    steps.push(
      `Ask ${intermediary.person.name} to introduce you to ${target.name}`
    );
    steps.push(
      `Alternative: Message ${target.name} mentioning ${intermediary.person.name} as a mutual connection`
    );
  } else {
    // Intermediary is one of target's connections
    steps.push(`Reach out to ${intermediary.person.name} first`);
    steps.push(
      `Mention similarities with ${intermediary.person.name} (${(intermediary.sourceToIntermediary * 100).toFixed(0)}% match)`
    );
    steps.push(`Build relationship before asking for introduction`);
    steps.push(
      `After connection is established, ask for introduction to ${target.name}`
    );
  }

  return steps;
}

/**
 * Generate action items for cold similarity strategy
 */
function generateColdSimilarityNextSteps(
  target: UserProfile,
  similarity: ProfileSimilarity
): string[] {
  const topSims = getTopSimilarities(similarity.breakdown);

  return [
    `Research ${target.name}'s recent posts and articles`,
    `Craft highly personalized message (200-250 characters)`,
    `Mention specific shared interests: ${topSims}`,
    `Include clear value proposition`,
    `Follow up with engagement on their content`,
  ];
}

/**
 * Generate action items when no recommendation is possible
 */
function generateNoRecommendationNextSteps(target: UserProfile): string[] {
  return [
    `Build your profile first (add relevant skills, join common groups)`,
    `Engage with ${target.name}'s content regularly (comment, share)`,
    `Look for alternative paths via events, webinars, or mutual groups`,
    `Consider joining professional organizations in ${target.name}'s industry`,
    `Build credibility through content creation in shared interest areas`,
  ];
}

// ============================================================================
// Batch Processing (For "Discover Connections" Feature)
// ============================================================================

/**
 * Batch discover connections for multiple targets
 *
 * Processes targets in parallel batches of 100
 * Filters out low-confidence matches (< 0.45)
 *
 * @param sourceUser Your profile
 * @param targetUsers List of target profiles
 * @param graph Network graph
 * @returns Array of ConnectionStrategy sorted by confidence
 */
export async function batchDiscoverConnections(
  sourceUser: UserProfile,
  targetUsers: UserProfile[],
  graph: Graph
): Promise<ConnectionStrategy[]> {
  const BATCH_SIZE = 100;
  const results: ConnectionStrategy[] = [];

  for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
    const batch = targetUsers.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((target) => findUniversalConnection(sourceUser, target, graph))
    );

    results.push(...batchResults);
  }

  // Only recommend good matches (confidence > 0.45)
  return results
    .filter((r) => r.confidence > 0.45)
    .sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// Strategy Comparison (For A/B Testing)
// ============================================================================

/**
 * Compare multiple strategies for a given connection
 *
 * Useful for:
 * - A/B testing different approaches
 * - Showing alternative paths to user
 * - Validating acceptance rate predictions
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param graph Network graph
 * @returns Array of all valid strategies sorted by confidence
 */
export async function compareStrategies(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy[]> {
  const strategies: ConnectionStrategy[] = [];

  // Get the recommended strategy
  const recommended = await findUniversalConnection(sourceUser, targetUser, graph);
  strategies.push(recommended);

  // Calculate direct similarity (if not already tried)
  if (recommended.type !== 'direct-similarity' && recommended.type !== 'cold-similarity') {
    const directSimilarity = calculateProfileSimilarity(sourceUser, targetUser);

    if (directSimilarity.overall >= 0.45) {
      const acceptanceRate = mapSimilarityToAcceptanceRate(directSimilarity.overall);

      strategies.push({
        type: directSimilarity.overall >= 0.65 ? 'direct-similarity' : 'cold-similarity',
        confidence: directSimilarity.overall,
        directSimilarity,
        estimatedAcceptanceRate: acceptanceRate,
        reasoning: `Alternative: Direct outreach (${(directSimilarity.overall * 100).toFixed(1)}% similarity)`,
        nextSteps: directSimilarity.overall >= 0.65
          ? generateDirectSimilarityNextSteps(targetUser, directSimilarity)
          : generateColdSimilarityNextSteps(targetUser, directSimilarity),
      });
    }
  }

  // Try finding intermediaries (if not already recommended)
  if (recommended.type !== 'intermediary') {
    try {
      // Find node IDs in graph
      const sourceId = findNodeIdInGraph(graph, sourceUser);
      const targetId = findNodeIdInGraph(graph, targetUser);

      if (!sourceId || !targetId) {
        throw new Error(
          'Unable to find profiles in your network. Please visit more LinkedIn profiles to expand your network graph.'
        );
      }

      const sourceConnections = await graph.getConnections(sourceId);
      const targetConnections = await graph.getConnections(targetId);

      const intermediaries = findBestIntermediaries(
        sourceUser,
        targetUser,
        sourceConnections,
        targetConnections
      );

      if (intermediaries.length > 0 && intermediaries[0].score > 0.35) {
        const bestIntermediary = intermediaries[0];

        strategies.push({
          type: 'intermediary',
          confidence: bestIntermediary.score,
          intermediary: bestIntermediary,
          estimatedAcceptanceRate: bestIntermediary.estimatedAcceptance,
          reasoning: `Alternative: ${bestIntermediary.reasoning}`,
          nextSteps: generateIntermediaryNextSteps(
            bestIntermediary,
            sourceUser,
            targetUser
          ),
        });
      }
    } catch (error) {
      console.warn('Could not find alternative intermediary strategy:', error);
    }
  }

  // Sort by confidence (highest first)
  return strategies.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// Metrics Tracking (For Validation)
// ============================================================================

/**
 * Track connection attempt result
 *
 * Used to validate acceptance rate predictions
 * Call this after user attempts a connection
 *
 * @param strategy Original strategy recommendation
 * @param accepted Whether the connection was accepted
 * @returns Metrics object for analysis
 */
export function trackConnectionResult(
  strategy: ConnectionStrategy,
  accepted: boolean
): {
  predicted: number;
  actual: number;
  strategy: string;
  error: number;
} {
  return {
    predicted: strategy.estimatedAcceptanceRate,
    actual: accepted ? 1.0 : 0.0,
    strategy: strategy.type,
    error: Math.abs(strategy.estimatedAcceptanceRate - (accepted ? 1.0 : 0.0)),
  };
}

/**
 * Calculate calibration metrics across multiple results
 *
 * Useful for:
 * - Validating research-backed thresholds
 * - Tuning acceptance rate formulas
 * - A/B testing different approaches
 *
 * @param results Array of tracked results
 * @returns Calibration metrics by strategy type
 */
export function calculateCalibrationMetrics(
  results: Array<{
    predicted: number;
    actual: number;
    strategy: string;
  }>
): Record<
  string,
  {
    avgPredicted: number;
    avgActual: number;
    count: number;
    error: number;
  }
> {
  const byStrategy: Record<string, typeof results> = {};

  // Group by strategy
  for (const result of results) {
    if (!byStrategy[result.strategy]) {
      byStrategy[result.strategy] = [];
    }
    byStrategy[result.strategy].push(result);
  }

  // Calculate metrics for each strategy
  const metrics: Record<
    string,
    {
      avgPredicted: number;
      avgActual: number;
      count: number;
      error: number;
    }
  > = {};

  for (const [strategy, strategyResults] of Object.entries(byStrategy)) {
    const avgPredicted =
      strategyResults.reduce((sum, r) => sum + r.predicted, 0) /
      strategyResults.length;
    const avgActual =
      strategyResults.reduce((sum, r) => sum + r.actual, 0) /
      strategyResults.length;
    const error = Math.abs(avgPredicted - avgActual);

    metrics[strategy] = {
      avgPredicted,
      avgActual,
      count: strategyResults.length,
      error,
    };
  }

  return metrics;
}
