/**
 * Acceptance Rate Mapping
 * Maps similarity scores to research-backed acceptance rate estimates
 */

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
 * Calculate acceptance rate based on hop count for mutual connection paths
 *
 * Research-backed values:
 * - 1-hop (direct connection): 85% acceptance
 * - 2-hop (one mutual): 65% acceptance
 * - 3-hop (two mutuals): 45% acceptance
 * - 4+ hops: 25-30% acceptance (rare, lower confidence)
 *
 * @param hopCount Number of hops/edges in the path (path.length - 1)
 * @returns Acceptance rate (0-1)
 */
export function calculateMutualConnectionAcceptanceRate(hopCount: number): number {
  switch (hopCount) {
    case 1:
      return 0.85; // Direct connection (1st degree)
    case 2:
      return 0.65; // One mutual connection (2nd degree)
    case 3:
      return 0.45; // Two mutual connections (3rd degree)
    case 4:
      return 0.30; // Three mutuals (rare, lower confidence)
    default:
      return 0.25; // 4+ hops (very rare, lowest confidence)
  }
}

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
  strategy: any,
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
