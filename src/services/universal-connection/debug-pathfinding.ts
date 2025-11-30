/**
 * Debug Utility for Connection Pathfinding
 *
 * Provides tools to manually test and verify the pathfinding logic
 * with synthetic graph data.
 *
 * Usage in browser console:
 * 1. Build the extension with this file included
 * 2. Open browser console
 * 3. Access via window.__debugPathfinding
 */

import {
  testDirectConnection,
  testSecondDegree,
  testThirdDegree,
  testSemanticFallback,
  runAllScenarios,
} from './debug/test-scenarios';
import { DebugGraph } from './debug/debug-graph';
import { createTestProfile } from './debug/test-helpers';

// Browser Console Integration
if (typeof window !== 'undefined') {
  (window as any).__debugPathfinding = {
    testDirectConnection,
    testSecondDegree,
    testThirdDegree,
    testSemanticFallback,
    runAllScenarios,
    createTestProfile,
    DebugGraph
  };

  console.log('[Uproot Debug] Pathfinding debug utilities loaded. Use window.__debugPathfinding to access.');
}

// Export for testing
export { DebugGraph, createTestProfile };
export {
  testDirectConnection,
  testSecondDegree,
  testThirdDegree,
  testSemanticFallback,
  runAllScenarios,
};
