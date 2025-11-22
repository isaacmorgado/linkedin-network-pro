/**
 * Test Suite for Universal Pathfinder
 * Comprehensive tests for LinkedIn universal connection system
 */

import type { UserProfile } from '../chat-abc62d98/linkedin-network-pro/src/types/resume-tailoring';
import type { Graph, ConnectionStrategy } from './universal-connection-types';
import {
  findUniversalConnection,
  mapSimilarityToAcceptanceRate,
  getTopSimilarities,
  batchDiscoverConnections,
} from './universal-pathfinder';
import {
  calculateProfileSimilarity,
  findBestIntermediaries,
  estimateAcceptanceRate,
  sampleConnections,
} from './intermediary-scorer';

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Create mock user profile
 */
function createMockUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: 'Test User',
    email: 'test@example.com',
    title: 'Software Engineer',
    workExperience: [
      {
        id: '1',
        company: 'TechCorp',
        title: 'Senior Software Engineer',
        startDate: '2020-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'React', 'AWS'],
        domains: ['web', 'backend'],
        responsibilities: ['Build features', 'Lead team'],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2012-09-01',
        endDate: '2016-06-01',
      },
    ],
    projects: [],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
      { name: 'React', level: 'advanced', yearsOfExperience: 4, category: 'framework' },
      { name: 'AWS', level: 'intermediate', yearsOfExperience: 3, category: 'tool' },
    ],
    metadata: {
      totalYearsExperience: 5,
      domains: ['web', 'backend'],
      seniority: 'senior',
      careerStage: 'professional',
    },
    location: 'San Francisco, CA',
    ...overrides,
  };
}

/**
 * Mock graph implementation
 */
class MockGraph implements Graph {
  private connections: Map<string, UserProfile[]> = new Map();
  private mockBFSResult: any = null;

  setConnections(userId: string, connections: UserProfile[]): void {
    this.connections.set(userId, connections);
  }

  setMockBFSResult(result: any): void {
    this.mockBFSResult = result;
  }

  async getConnections(userId: string): Promise<UserProfile[]> {
    return this.connections.get(userId) || [];
  }

  async bidirectionalBFS(
    sourceId: string,
    targetId: string
  ): Promise<{
    path: UserProfile[];
    probability: number;
    mutualConnections: number;
  } | null> {
    return this.mockBFSResult;
  }

  getNode(nodeId: string): UserProfile | null {
    return null;
  }

  getMutualConnections(userId1: string, userId2: string): UserProfile[] {
    return [];
  }
}

// ============================================================================
// Test Cases
// ============================================================================

/**
 * Test Case 1: Mutual connections exist
 * Should return 'mutual' strategy with ~50% acceptance
 */
async function testMutualConnections(): Promise<void> {
  console.log('\n=== Test Case 1: Mutual Connections ===');

  const sourceUser = createMockUser({
    name: 'Alice Chen',
    email: 'alice@example.com',
  });

  const targetUser = createMockUser({
    name: 'Bob Smith',
    email: 'bob@example.com',
  });

  const mutual = createMockUser({
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
  });

  const graph = new MockGraph();

  // Mock BFS result (found mutual path)
  graph.setMockBFSResult({
    path: [sourceUser, mutual, targetUser],
    probability: 0.75,
    mutualConnections: 12,
  });

  const result = await findUniversalConnection(sourceUser, targetUser, graph);

  console.log(`Strategy: ${result.type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Acceptance: ${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log(`Next Steps:`, result.nextSteps);

  // Assertions
  if (result.type !== 'mutual') {
    throw new Error(`Expected 'mutual', got '${result.type}'`);
  }

  if (result.estimatedAcceptanceRate < 0.30 || result.estimatedAcceptanceRate > 0.60) {
    throw new Error(`Acceptance rate ${result.estimatedAcceptanceRate} outside expected range (30-60%)`);
  }

  console.log('✅ Test passed!');
}

/**
 * Test Case 2: No mutuals, high similarity (0.75)
 * Should return 'direct-similarity' with ~40% acceptance
 */
async function testDirectHighSimilarity(): Promise<void> {
  console.log('\n=== Test Case 2: Direct High Similarity ===');

  const sourceUser = createMockUser({
    name: 'Alice Chen',
    email: 'alice@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Senior Software Engineer',
        startDate: '2020-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'TensorFlow', 'Kubernetes'],
        domains: ['ml', 'backend'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'Master of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2018-06-01',
      },
    ],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 6, category: 'programming-language' },
      { name: 'TensorFlow', level: 'advanced', yearsOfExperience: 4, category: 'framework' },
      { name: 'Kubernetes', level: 'advanced', yearsOfExperience: 3, category: 'tool' },
    ],
    location: 'San Francisco, CA',
  });

  const targetUser = createMockUser({
    name: 'David Lee',
    email: 'david@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Meta',
        title: 'Staff Software Engineer',
        startDate: '2019-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'PyTorch', 'Kubernetes'],
        domains: ['ml', 'infrastructure'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'PhD',
        field: 'Computer Science',
        startDate: '2014-09-01',
        endDate: '2019-06-01',
      },
    ],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 8, category: 'programming-language' },
      { name: 'PyTorch', level: 'expert', yearsOfExperience: 5, category: 'framework' },
      { name: 'Kubernetes', level: 'advanced', yearsOfExperience: 4, category: 'tool' },
    ],
    location: 'Menlo Park, CA',
  });

  const graph = new MockGraph();
  graph.setMockBFSResult(null); // No mutual path
  graph.setConnections(sourceUser.email!, []);
  graph.setConnections(targetUser.email!, []);

  const result = await findUniversalConnection(sourceUser, targetUser, graph);

  console.log(`Strategy: ${result.type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Acceptance: ${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log(`Next Steps:`, result.nextSteps);

  // Check similarity calculation
  if (result.directSimilarity) {
    console.log(`\nSimilarity Breakdown:`);
    console.log(`  Industry: ${(result.directSimilarity.breakdown.industry * 100).toFixed(1)}%`);
    console.log(`  Skills: ${(result.directSimilarity.breakdown.skills * 100).toFixed(1)}%`);
    console.log(`  Education: ${(result.directSimilarity.breakdown.education * 100).toFixed(1)}%`);
    console.log(`  Location: ${(result.directSimilarity.breakdown.location * 100).toFixed(1)}%`);
    console.log(`  Companies: ${(result.directSimilarity.breakdown.companies * 100).toFixed(1)}%`);
  }

  // Assertions
  if (result.type !== 'direct-similarity') {
    throw new Error(`Expected 'direct-similarity', got '${result.type}'`);
  }

  if (result.confidence < 0.65) {
    throw new Error(`Confidence ${result.confidence} below expected threshold (0.65)`);
  }

  if (result.estimatedAcceptanceRate < 0.35 || result.estimatedAcceptanceRate > 0.45) {
    throw new Error(`Acceptance rate ${result.estimatedAcceptanceRate} outside expected range (35-45%)`);
  }

  console.log('✅ Test passed!');
}

/**
 * Test Case 3: No mutuals, moderate similarity (0.55), good intermediary
 * Should return 'intermediary' with ~28% acceptance
 */
async function testIntermediaryMatching(): Promise<void> {
  console.log('\n=== Test Case 3: Intermediary Matching ===');

  const sourceUser = createMockUser({
    name: 'Alice Chen',
    email: 'alice@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Startup Inc',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['JavaScript', 'React', 'Node.js'],
        domains: ['web', 'frontend'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'UC Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-06-01',
      },
    ],
    skills: [
      { name: 'JavaScript', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
      { name: 'React', level: 'advanced', yearsOfExperience: 4, category: 'framework' },
    ],
  });

  const targetUser = createMockUser({
    name: 'Emma Wilson',
    email: 'emma@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Enterprise Corp',
        title: 'Senior Product Manager',
        startDate: '2018-01-01',
        endDate: null,
        industry: 'Technology',
        achievements: [],
        skills: ['Product Management', 'Agile', 'UX'],
        domains: ['product', 'strategy'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'MIT',
        degree: 'Master of Business Administration',
        field: 'Business Administration',
        startDate: '2016-09-01',
        endDate: '2018-06-01',
      },
    ],
    skills: [
      { name: 'Product Management', level: 'expert', yearsOfExperience: 6, category: 'other' },
      { name: 'Agile', level: 'advanced', yearsOfExperience: 5, category: 'methodology' },
    ],
  });

  // Create intermediary: your connection who is similar to target
  const intermediary = createMockUser({
    name: 'Frank Zhang',
    email: 'frank@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Tech Solutions',
        title: 'Engineering Manager',
        startDate: '2017-01-01',
        endDate: null,
        industry: 'Technology',
        achievements: [],
        skills: ['Product Management', 'JavaScript', 'Leadership'],
        domains: ['product', 'engineering'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'UC Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2012-09-01',
        endDate: '2016-06-01',
      },
    ],
    skills: [
      { name: 'Product Management', level: 'advanced', yearsOfExperience: 4, category: 'other' },
      { name: 'JavaScript', level: 'expert', yearsOfExperience: 7, category: 'programming-language' },
      { name: 'Leadership', level: 'advanced', yearsOfExperience: 5, category: 'soft-skill' },
    ],
  });

  const graph = new MockGraph();
  graph.setMockBFSResult(null); // No mutual path
  graph.setConnections(sourceUser.email!, [intermediary]); // Your connection
  graph.setConnections(targetUser.email!, []);

  const result = await findUniversalConnection(sourceUser, targetUser, graph);

  console.log(`Strategy: ${result.type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Acceptance: ${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);

  if (result.intermediary) {
    console.log(`\nIntermediary: ${result.intermediary.person.name}`);
    console.log(`  Path Strength: ${(result.intermediary.pathStrength * 100).toFixed(1)}%`);
    console.log(`  Direction: ${result.intermediary.direction}`);
    console.log(`  Source → Intermediary: ${(result.intermediary.sourceToIntermediary * 100).toFixed(1)}%`);
    console.log(`  Intermediary → Target: ${(result.intermediary.intermediaryToTarget * 100).toFixed(1)}%`);
  }

  console.log(`\nNext Steps:`, result.nextSteps);

  // Assertions
  if (result.type !== 'intermediary') {
    throw new Error(`Expected 'intermediary', got '${result.type}'`);
  }

  if (result.estimatedAcceptanceRate < 0.20 || result.estimatedAcceptanceRate > 0.35) {
    throw new Error(`Acceptance rate ${result.estimatedAcceptanceRate} outside expected range (20-35%)`);
  }

  console.log('✅ Test passed!');
}

/**
 * Test Case 4: No mutuals, low similarity (0.30)
 * Should return 'cold-similarity' or 'none'
 */
async function testLowSimilarity(): Promise<void> {
  console.log('\n=== Test Case 4: Low Similarity ===');

  const sourceUser = createMockUser({
    name: 'Alice Chen',
    email: 'alice@example.com',
    workExperience: [
      {
        id: '1',
        company: 'TechCorp',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'Django'],
        domains: ['web', 'backend'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'State University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-06-01',
      },
    ],
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 4, category: 'programming-language' },
    ],
    location: 'San Francisco, CA',
  });

  const targetUser = createMockUser({
    name: 'John Doe',
    email: 'john@example.com',
    workExperience: [
      {
        id: '1',
        company: 'Marketing Agency',
        title: 'Creative Director',
        startDate: '2015-01-01',
        endDate: null,
        industry: 'Marketing',
        achievements: [],
        skills: ['Photoshop', 'Branding', 'Creative Strategy'],
        domains: ['marketing', 'design'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Art Institute',
        degree: 'Bachelor of Fine Arts',
        field: 'Graphic Design',
        startDate: '2011-09-01',
        endDate: '2015-06-01',
      },
    ],
    skills: [
      { name: 'Photoshop', level: 'expert', yearsOfExperience: 10, category: 'tool' },
      { name: 'Branding', level: 'expert', yearsOfExperience: 8, category: 'other' },
    ],
    location: 'New York, NY',
  });

  const graph = new MockGraph();
  graph.setMockBFSResult(null); // No mutual path
  graph.setConnections(sourceUser.email!, []);
  graph.setConnections(targetUser.email!, []);

  const result = await findUniversalConnection(sourceUser, targetUser, graph);

  console.log(`Strategy: ${result.type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Acceptance: ${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log(`Next Steps:`, result.nextSteps);

  // Assertions
  if (result.type === 'mutual' || result.type === 'direct-similarity' || result.type === 'intermediary') {
    throw new Error(`Expected 'cold-similarity' or 'none', got '${result.type}'`);
  }

  console.log('✅ Test passed!');
}

/**
 * Test Case 5: Edge case - Empty connections
 * Should gracefully degrade to similarity-based recommendation
 */
async function testEmptyConnections(): Promise<void> {
  console.log('\n=== Test Case 5: Empty Connections (Edge Case) ===');

  const sourceUser = createMockUser({
    name: 'New User',
    email: 'new@example.com',
  });

  const targetUser = createMockUser({
    name: 'Target User',
    email: 'target@example.com',
  });

  const graph = new MockGraph();
  graph.setMockBFSResult(null);
  graph.setConnections(sourceUser.email!, []); // Empty connections
  graph.setConnections(targetUser.email!, []); // Empty connections

  const result = await findUniversalConnection(sourceUser, targetUser, graph);

  console.log(`Strategy: ${result.type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Acceptance: ${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);

  // Should not crash, should return some recommendation
  if (!result.type) {
    throw new Error('Result type is undefined');
  }

  console.log('✅ Test passed!');
}

/**
 * Test similarity calculation
 */
function testSimilarityCalculation(): void {
  console.log('\n=== Test: Similarity Calculation ===');

  const user1 = createMockUser({
    name: 'User 1',
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Engineer',
        startDate: '2020-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'Java', 'C++'],
        domains: ['backend'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-06-01',
      },
    ],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
      { name: 'Java', level: 'advanced', yearsOfExperience: 4, category: 'programming-language' },
      { name: 'C++', level: 'intermediate', yearsOfExperience: 3, category: 'programming-language' },
    ],
    location: 'San Francisco, CA',
  });

  const user2 = createMockUser({
    name: 'User 2',
    workExperience: [
      {
        id: '1',
        company: 'Meta',
        title: 'Engineer',
        startDate: '2019-01-01',
        endDate: null,
        industry: 'Software Development',
        achievements: [],
        skills: ['Python', 'JavaScript', 'C++'],
        domains: ['frontend'],
        responsibilities: [],
      },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'MS',
        field: 'Computer Science',
        startDate: '2020-09-01',
        endDate: '2022-06-01',
      },
    ],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 6, category: 'programming-language' },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 5, category: 'programming-language' },
      { name: 'C++', level: 'advanced', yearsOfExperience: 4, category: 'programming-language' },
    ],
    location: 'Menlo Park, CA',
  });

  const similarity = calculateProfileSimilarity(user1, user2);

  console.log(`Overall Similarity: ${(similarity.overall * 100).toFixed(1)}%`);
  console.log(`Breakdown:`);
  console.log(`  Industry: ${(similarity.breakdown.industry * 100).toFixed(1)}%`);
  console.log(`  Skills: ${(similarity.breakdown.skills * 100).toFixed(1)}%`);
  console.log(`  Education: ${(similarity.breakdown.education * 100).toFixed(1)}%`);
  console.log(`  Location: ${(similarity.breakdown.location * 100).toFixed(1)}%`);
  console.log(`  Companies: ${(similarity.breakdown.companies * 100).toFixed(1)}%`);

  // Should have high overall similarity
  if (similarity.overall < 0.60) {
    throw new Error(`Expected high similarity (>60%), got ${similarity.overall}`);
  }

  // Should detect same school
  if (similarity.breakdown.education !== 1.0) {
    throw new Error(`Expected education match (1.0), got ${similarity.breakdown.education}`);
  }

  // Should detect skill overlap
  if (similarity.breakdown.skills < 0.30) {
    throw new Error(`Expected skill overlap (>30%), got ${similarity.breakdown.skills}`);
  }

  console.log('✅ Test passed!');
}

/**
 * Test acceptance rate mapping
 */
function testAcceptanceRateMapping(): void {
  console.log('\n=== Test: Acceptance Rate Mapping ===');

  const testCases = [
    { similarity: 0.85, expectedRange: [0.40, 0.45] },
    { similarity: 0.70, expectedRange: [0.35, 0.42] },
    { similarity: 0.55, expectedRange: [0.25, 0.35] },
    { similarity: 0.50, expectedRange: [0.20, 0.30] },
    { similarity: 0.30, expectedRange: [0.15, 0.20] },
    { similarity: 0.10, expectedRange: [0.12, 0.15] },
  ];

  for (const { similarity, expectedRange } of testCases) {
    const acceptanceRate = mapSimilarityToAcceptanceRate(similarity);
    console.log(`Similarity ${(similarity * 100).toFixed(0)}% → Acceptance ${(acceptanceRate * 100).toFixed(1)}%`);

    if (acceptanceRate < expectedRange[0] || acceptanceRate > expectedRange[1]) {
      throw new Error(`Acceptance rate ${acceptanceRate} outside expected range [${expectedRange[0]}, ${expectedRange[1]}]`);
    }
  }

  console.log('✅ Test passed!');
}

/**
 * Test connection sampling
 */
function testConnectionSampling(): void {
  console.log('\n=== Test: Connection Sampling ===');

  // Create 1000 mock connections
  const connections: UserProfile[] = [];
  for (let i = 0; i < 1000; i++) {
    connections.push(
      createMockUser({
        name: `Connection ${i}`,
        email: `conn${i}@example.com`,
      })
    );
  }

  const sample = sampleConnections(connections, 500);

  console.log(`Original: ${sample.originalCount} connections`);
  console.log(`Sampled: ${sample.sampledCount} connections`);
  console.log(`Strategy: ${sample.strategy}`);

  if (sample.sampledCount > 500) {
    throw new Error(`Expected ≤500 connections, got ${sample.sampledCount}`);
  }

  console.log('✅ Test passed!');
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('===================================');
  console.log('Universal Pathfinder Test Suite');
  console.log('===================================');

  try {
    // Core pathfinding tests
    await testMutualConnections();
    await testDirectHighSimilarity();
    await testIntermediaryMatching();
    await testLowSimilarity();
    await testEmptyConnections();

    // Utility function tests
    testSimilarityCalculation();
    testAcceptanceRateMapping();
    testConnectionSampling();

    console.log('\n===================================');
    console.log('✅ All tests passed!');
    console.log('===================================');
  } catch (error) {
    console.error('\n===================================');
    console.error('❌ Test failed:');
    console.error(error);
    console.error('===================================');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export {
  runAllTests,
  testMutualConnections,
  testDirectHighSimilarity,
  testIntermediaryMatching,
  testLowSimilarity,
  testEmptyConnections,
  testSimilarityCalculation,
  testAcceptanceRateMapping,
  testConnectionSampling,
};
