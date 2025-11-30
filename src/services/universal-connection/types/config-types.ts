/**
 * Config Types
 * Types related to configuration and metrics
 */

import { AcceptanceThresholds, DEFAULT_THRESHOLDS } from './similarity-types';

/**
 * Performance metrics for universal connection system
 */
export interface ConnectionMetrics {
  // Acceptance rate tracking
  acceptanceRateByStrategy: {
    mutual: number; // Target: 45-55%
    directSimilarity: number; // Target: 35-42%
    intermediary: number; // Target: 25-32%
    coldSimilarity: number; // Target: 18-25%
  };

  // Calibration metrics
  predictedVsActual: Array<{
    predicted: number;
    actual: number;
    strategy: string;
  }>;

  // Performance metrics
  avgLatency: number; // Target: < 500ms
  cacheHitRate: number; // Target: > 70%
  recommendationsPerUser: number; // Target: 5-10/day
}

/**
 * Configuration for universal pathfinding
 */
export interface UniversalPathfindingConfig {
  // Performance
  maxConnectionsToSample: number; // Default: 500
  enableCaching: boolean; // Default: true
  cacheExpirationDays: number; // Default: 7

  // Thresholds
  thresholds: AcceptanceThresholds;

  // Features
  enableIntermediarySearch: boolean; // Default: true
  enableDirectSimilarity: boolean; // Default: true

  // Timeouts
  maxSearchTimeMs: number; // Default: 5000 (5 seconds)
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: UniversalPathfindingConfig = {
  maxConnectionsToSample: 500,
  enableCaching: true,
  cacheExpirationDays: 7,
  thresholds: DEFAULT_THRESHOLDS,
  enableIntermediarySearch: true,
  enableDirectSimilarity: true,
  maxSearchTimeMs: 5000,
};
