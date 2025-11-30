/**
 * Test Scenarios
 * Predefined test cases for pathfinding logic
 */

import { findUniversalConnection } from '../universal-pathfinder';
import { DebugGraph } from './debug-graph';
import { createTestProfile } from './test-helpers';

/**
 * Scenario A: Direct Connection (1 hop, 85%)
 */
export async function testDirectConnection() {
  console.log('\n=== Scenario A: Direct Connection (1 hop) ===');

  const graph = new DebugGraph();
  const source = createTestProfile('alice', 'Alice Source');
  const target = createTestProfile('bob', 'Bob Target');

  graph.addNode(source);
  graph.addNode(target);
  graph.addConnection(source.id!, target);
  graph.setMockPath(source.id!, target.id!, [source, target], 0.85, 0);

  const result = await findUniversalConnection(source, target, graph);

  console.log('Result:', {
    type: result.type,
    mode: result.type === 'mutual' ? 'graph' : 'semantic',
    hops: result.path?.nodes.length ? result.path.nodes.length - 1 : 'N/A',
    probability: result.estimatedAcceptanceRate,
    path: result.path?.nodes.map(n => n.name).join(' → ') || 'None'
  });

  console.log('✅ Expected: type=mutual, hops=1, probability=0.85');
  console.log(result.type === 'mutual' && result.estimatedAcceptanceRate === 0.85 ? '✅ PASS' : '❌ FAIL');

  return result;
}

/**
 * Scenario B: 2nd-Degree (2 hops, 65%)
 */
export async function testSecondDegree() {
  console.log('\n=== Scenario B: 2nd-Degree Connection (2 hops) ===');

  const graph = new DebugGraph();
  const source = createTestProfile('alice', 'Alice Source');
  const mutual = createTestProfile('charlie', 'Charlie Mutual');
  const target = createTestProfile('dave', 'Dave Target');

  graph.addNode(source);
  graph.addNode(mutual);
  graph.addNode(target);
  graph.addConnection(source.id!, mutual);
  graph.addConnection(mutual.id!, target);
  graph.setMockPath(source.id!, target.id!, [source, mutual, target], 0.65, 1);

  const result = await findUniversalConnection(source, target, graph);

  console.log('Result:', {
    type: result.type,
    mode: result.type === 'mutual' ? 'graph' : 'semantic',
    hops: result.path?.nodes.length ? result.path.nodes.length - 1 : 'N/A',
    probability: result.estimatedAcceptanceRate,
    path: result.path?.nodes.map(n => n.name).join(' → ') || 'None'
  });

  console.log('✅ Expected: type=mutual, hops=2, probability=0.65');
  console.log(result.type === 'mutual' && result.estimatedAcceptanceRate === 0.65 ? '✅ PASS' : '❌ FAIL');

  return result;
}

/**
 * Scenario C: 3rd-Degree (3 hops, 45%)
 */
export async function testThirdDegree() {
  console.log('\n=== Scenario C: 3rd-Degree Connection (3 hops) ===');

  const graph = new DebugGraph();
  const source = createTestProfile('alice', 'Alice Source');
  const inter1 = createTestProfile('bob', 'Bob Intermediary 1');
  const inter2 = createTestProfile('charlie', 'Charlie Intermediary 2');
  const target = createTestProfile('dave', 'Dave Target');

  graph.addNode(source);
  graph.addNode(inter1);
  graph.addNode(inter2);
  graph.addNode(target);
  graph.setMockPath(source.id!, target.id!, [source, inter1, inter2, target], 0.45, 2);

  const result = await findUniversalConnection(source, target, graph);

  console.log('Result:', {
    type: result.type,
    mode: result.type === 'mutual' ? 'graph' : 'semantic',
    hops: result.path?.nodes.length ? result.path.nodes.length - 1 : 'N/A',
    probability: result.estimatedAcceptanceRate,
    path: result.path?.nodes.map(n => n.name).join(' → ') || 'None'
  });

  console.log('✅ Expected: type=mutual, hops=3, probability=0.45');
  console.log(result.type === 'mutual' && result.estimatedAcceptanceRate === 0.45 ? '✅ PASS' : '❌ FAIL');

  return result;
}

/**
 * Scenario D: No Graph Path → Semantic Fallback
 */
export async function testSemanticFallback() {
  console.log('\n=== Scenario D: No Graph Path (Semantic Fallback) ===');

  const graph = new DebugGraph();
  const source = createTestProfile('alice', 'Alice Source');
  const target = createTestProfile('eve', 'Eve Target', {
    // High similarity
    location: source.location,
    title: source.title,
    education: source.education,
    skills: source.skills
  });

  graph.addNode(source);
  graph.addNode(target);
  // NO path in graph
  graph.setMockPath(source.id!, target.id!, null);

  const result = await findUniversalConnection(source, target, graph);

  console.log('Result:', {
    type: result.type,
    mode: result.type === 'mutual' ? 'graph' : 'semantic',
    hops: result.path?.nodes.length ? result.path.nodes.length - 1 : 'N/A',
    probability: result.estimatedAcceptanceRate,
    path: result.path?.nodes.map(n => n.name).join(' → ') || 'None',
    hasSimilarity: !!result.directSimilarity
  });

  console.log('✅ Expected: type=semantic (direct-similarity/intermediary/cold), no path, probability ≠ 0.85/0.65/0.45');
  const isSemanticMode = result.type !== 'mutual';
  const hasNoPath = !result.path;
  const hasCorrectProb = result.estimatedAcceptanceRate !== 0.85 &&
                         result.estimatedAcceptanceRate !== 0.65 &&
                         result.estimatedAcceptanceRate !== 0.45;
  console.log(isSemanticMode && hasNoPath && hasCorrectProb ? '✅ PASS' : '❌ FAIL');

  return result;
}

/**
 * Run all scenarios
 */
export async function runAllScenarios() {
  console.log('\n========================================');
  console.log('Connection Pathfinding Debug Suite');
  console.log('========================================');

  await testDirectConnection();
  await testSecondDegree();
  await testThirdDegree();
  await testSemanticFallback();

  console.log('\n========================================');
  console.log('Debug Suite Complete');
  console.log('========================================\n');
}
