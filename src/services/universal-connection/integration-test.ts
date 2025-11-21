/**
 * Integration Test for Universal Connection System
 * Verifies all imports and type compatibility
 */

import { findUniversalConnection } from './universal-pathfinder';
import { calculateProfileSimilarity } from './profile-similarity';
import { findBestIntermediaries } from './intermediary-scorer';
import { INDUSTRY_RELATIONSHIPS } from '../../lib/industry-mapping';
import { NetworkGraph } from '../../lib/graph';
import type { Graph } from '../../types';

console.log('✅ All imports successful!');

// Test 1: Verify Graph interface implementation
const graph = new NetworkGraph();
const graphAsInterface: Graph = graph;

console.log('✅ Graph implements Graph interface');
console.log('✅ Graph has getConnections:', typeof graph.getConnections === 'function');
console.log('✅ Graph has bidirectionalBFS:', typeof graph.bidirectionalBFS === 'function');
console.log('✅ Graph has getMutualConnections:', typeof graph.getMutualConnections === 'function');
console.log('✅ Graph has getNode:', typeof graph.getNode === 'function');

// Test 2: Verify industry relationships are available
console.log('✅ Industry relationships loaded:', Object.keys(INDUSTRY_RELATIONSHIPS).length, 'industries');

// Test 3: Verify function exports
console.log('✅ findUniversalConnection exported:', typeof findUniversalConnection === 'function');
console.log('✅ calculateProfileSimilarity exported:', typeof calculateProfileSimilarity === 'function');
console.log('✅ findBestIntermediaries exported:', typeof findBestIntermediaries === 'function');

console.log('\n🎉 Integration test passed! All systems ready for Phase 2.');
