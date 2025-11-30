/**
 * Example Usage - LinkedIn Universal Connection System
 * Demonstrates how to integrate and use the universal pathfinding system
 */

import type { UserProfile } from '../chat-abc62d98/linkedin-network-pro/src/types/resume-tailoring';
import type { Graph, ConnectionStrategy } from './universal-connection-types';
import { findUniversalConnection, batchDiscoverConnections } from './universal-pathfinder';
import { calculateProfileSimilarity } from './intermediary-scorer';

// ============================================================================
// Example 1: Single Connection Lookup
// ============================================================================

async function findConnectionToTarget(
  myProfile: UserProfile,
  targetProfile: UserProfile,
  networkGraph: Graph
): Promise<void> {
  console.log(`\n🔍 Finding connection path from ${myProfile.name} to ${targetProfile.name}...\n`);

  // Find best connection strategy
  const strategy = await findUniversalConnection(myProfile, targetProfile, networkGraph);

  // Display results
  console.log(`Strategy: ${strategy.type}`);
  console.log(`Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
  console.log(`Estimated Acceptance Rate: ${(strategy.estimatedAcceptanceRate * 100).toFixed(1)}%`);
  console.log(`\nReasoning: ${strategy.reasoning}`);

  console.log(`\nNext Steps:`);
  strategy.nextSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });

  // Strategy-specific details
  switch (strategy.type) {
    case 'mutual':
      if (strategy.path) {
        console.log(`\n📊 Path Details:`);
        console.log(`  Intermediaries: ${strategy.path.nodes.length - 2}`);
        console.log(`  Mutual Connections: ${strategy.path.mutualConnections}`);
        console.log(`  Success Probability: ${(strategy.path.successProbability * 100).toFixed(1)}%`);
      }
      break;

    case 'direct-similarity':
    case 'cold-similarity':
      if (strategy.directSimilarity) {
        console.log(`\n📊 Similarity Breakdown:`);
        const breakdown = strategy.directSimilarity.breakdown;
        console.log(`  Industry: ${(breakdown.industry * 100).toFixed(0)}%`);
        console.log(`  Skills: ${(breakdown.skills * 100).toFixed(0)}%`);
        console.log(`  Education: ${(breakdown.education * 100).toFixed(0)}%`);
        console.log(`  Location: ${(breakdown.location * 100).toFixed(0)}%`);
        console.log(`  Companies: ${(breakdown.companies * 100).toFixed(0)}%`);
      }
      break;

    case 'intermediary':
      if (strategy.intermediary) {
        console.log(`\n📊 Intermediary Details:`);
        console.log(`  Name: ${strategy.intermediary.person.name}`);
        console.log(`  Direction: ${strategy.intermediary.direction}`);
        console.log(`  Path Strength: ${(strategy.intermediary.pathStrength * 100).toFixed(1)}%`);
        console.log(`  You → Intermediary: ${(strategy.intermediary.sourceToIntermediary * 100).toFixed(0)}%`);
        console.log(`  Intermediary → Target: ${(strategy.intermediary.intermediaryToTarget * 100).toFixed(0)}%`);
      }
      break;
  }

  // Return strategy for further processing
  return strategy;
}

// ============================================================================
// Example 2: Batch Discovery (Find Multiple Connections)
// ============================================================================

async function _discoverMultipleConnections(
  myProfile: UserProfile,
  potentialTargets: UserProfile[],
  networkGraph: Graph
): Promise<void> {
  console.log(`\n🔍 Discovering connections to ${potentialTargets.length} targets...\n`);

  // Batch process all targets
  const strategies = await batchDiscoverConnections(myProfile, potentialTargets, networkGraph);

  console.log(`✅ Found ${strategies.length} viable connections (confidence > 45%)\n`);

  // Display top 10 results
  const top10 = strategies.slice(0, 10);
  console.log(`📊 Top 10 Connection Opportunities:\n`);

  top10.forEach((strategy, i) => {
    const target = strategy.intermediary?.person ||
                   (strategy.path?.nodes[strategy.path.nodes.length - 1]);

    console.log(`${i + 1}. ${target?.name || 'Unknown'}`);
    console.log(`   Strategy: ${strategy.type}`);
    console.log(`   Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
    console.log(`   Acceptance: ${(strategy.estimatedAcceptanceRate * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${strategy.reasoning}`);
    console.log('');
  });

  return strategies;
}

// ============================================================================
// Example 3: Compare Strategies (A/B Testing)
// ============================================================================

async function _compareConnectionStrategies(
  myProfile: UserProfile,
  targetProfile: UserProfile,
  networkGraph: Graph
): Promise<void> {
  console.log(`\n🔬 Comparing all strategies for ${targetProfile.name}...\n`);

  // Import compareStrategies
  const { compareStrategies } = await import('./universal-pathfinder');

  const strategies = await compareStrategies(myProfile, targetProfile, networkGraph);

  console.log(`Found ${strategies.length} valid strategies:\n`);

  strategies.forEach((strategy, i) => {
    console.log(`${i + 1}. ${strategy.type.toUpperCase()}`);
    console.log(`   Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
    console.log(`   Acceptance: ${(strategy.estimatedAcceptanceRate * 100).toFixed(1)}%`);
    console.log(`   ${strategy.reasoning}`);
    console.log('');
  });

  // Recommend best strategy
  const best = strategies[0];
  console.log(`✅ Recommended: ${best.type} (${(best.confidence * 100).toFixed(1)}% confidence)\n`);

  return strategies;
}

// ============================================================================
// Example 4: Profile Similarity Calculator
// ============================================================================

function analyzeProfileSimilarity(
  profile1: UserProfile,
  profile2: UserProfile
): void {
  console.log(`\n📊 Analyzing similarity between ${profile1.name} and ${profile2.name}...\n`);

  const similarity = calculateProfileSimilarity(profile1, profile2);

  console.log(`Overall Similarity: ${(similarity.overall * 100).toFixed(1)}%`);
  console.log(`\nBreakdown:`);
  console.log(`  Industry:  ${(similarity.breakdown.industry * 100).toFixed(0)}% ${'█'.repeat(Math.floor(similarity.breakdown.industry * 20))}`);
  console.log(`  Skills:    ${(similarity.breakdown.skills * 100).toFixed(0)}% ${'█'.repeat(Math.floor(similarity.breakdown.skills * 20))}`);
  console.log(`  Education: ${(similarity.breakdown.education * 100).toFixed(0)}% ${'█'.repeat(Math.floor(similarity.breakdown.education * 20))}`);
  console.log(`  Location:  ${(similarity.breakdown.location * 100).toFixed(0)}% ${'█'.repeat(Math.floor(similarity.breakdown.location * 20))}`);
  console.log(`  Companies: ${(similarity.breakdown.companies * 100).toFixed(0)}% ${'█'.repeat(Math.floor(similarity.breakdown.companies * 20))}`);

  // Interpret similarity
  console.log(`\n💡 Interpretation:`);
  if (similarity.overall >= 0.65) {
    console.log('   High similarity - Direct outreach recommended (35-42% acceptance)');
  } else if (similarity.overall >= 0.45) {
    console.log('   Moderate similarity - Cold outreach with personalization (20-35% acceptance)');
  } else if (similarity.overall >= 0.25) {
    console.log('   Low similarity - Consider building profile first (15-20% acceptance)');
  } else {
    console.log('   Very low similarity - Not recommended (<15% acceptance)');
  }

  return similarity;
}

// ============================================================================
// Example 5: Integration with React UI
// ============================================================================

/**
 * Example React component showing how to integrate with UI
 */
export const ConnectionStrategyCard = ({ strategy }: { strategy: ConnectionStrategy }) => {
  // Get color based on confidence
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return 'green';
    if (confidence >= 0.5) return 'yellow';
    return 'orange';
  };

  // Get icon based on strategy type
  const getStrategyIcon = (type: string): string => {
    switch (type) {
      case 'mutual': return '🎯';
      case 'direct-similarity': return '🎯';
      case 'intermediary': return '🔗';
      case 'cold-similarity': return '❄️';
      case 'none': return '⛔';
      default: return '❓';
    }
  };

  return `
    <div className="connection-strategy-card">
      <header>
        <span className="icon">${getStrategyIcon(strategy.type)}</span>
        <h2>${strategy.type.replace('-', ' ').toUpperCase()}</h2>
      </header>

      <div className="metrics">
        <div className="progress-bar">
          <label>Match Confidence</label>
          <div className="bar ${getConfidenceColor(strategy.confidence)}">
            <div className="fill" style="width: ${strategy.confidence * 100}%"></div>
          </div>
          <span>${(strategy.confidence * 100).toFixed(1)}%</span>
        </div>

        <div className="progress-bar">
          <label>Estimated Acceptance Rate</label>
          <div className="bar ${getConfidenceColor(strategy.estimatedAcceptanceRate)}">
            <div className="fill" style="width: ${strategy.estimatedAcceptanceRate * 100}%"></div>
          </div>
          <span>${(strategy.estimatedAcceptanceRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="reasoning">
        <p>${strategy.reasoning}</p>
      </div>

      <div className="next-steps">
        <h3>Next Steps</h3>
        <ol>
          ${strategy.nextSteps.map((step) => `<li>${step}</li>`).join('')}
        </ol>
      </div>

      ${strategy.intermediary ? `
        <div className="intermediary-info">
          <h3>Via Intermediary</h3>
          <div className="person">
            <img src="${strategy.intermediary.person.avatar}" alt="${strategy.intermediary.person.name}" />
            <div>
              <strong>${strategy.intermediary.person.name}</strong>
              <p>${strategy.intermediary.person.title}</p>
            </div>
          </div>
          <div className="path-strength">
            Path Strength: ${(strategy.intermediary.pathStrength * 100).toFixed(0)}%
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

// ============================================================================
// Example 6: Track Connection Results (Metrics)
// ============================================================================

async function _trackConnectionAttempt(
  strategy: ConnectionStrategy,
  targetProfile: UserProfile,
  wasAccepted: boolean
): Promise<void> {
  console.log(`\n📊 Tracking connection attempt to ${targetProfile.name}...\n`);

  const { trackConnectionResult } = await import('./universal-pathfinder');

  const result = trackConnectionResult(strategy, wasAccepted);

  console.log(`Strategy: ${result.strategy}`);
  console.log(`Predicted Acceptance: ${(result.predicted * 100).toFixed(1)}%`);
  console.log(`Actual Result: ${wasAccepted ? 'Accepted ✅' : 'Declined ❌'}`);
  console.log(`Error: ${(result.error * 100).toFixed(1)} percentage points`);

  // Store result for calibration analysis
  // In production, you would save this to a database
  await saveToDatabase({
    targetUserId: targetProfile.email || targetProfile.name,
    strategy: strategy.type,
    predictedRate: result.predicted,
    actualResult: wasAccepted,
    timestamp: new Date().toISOString(),
  });

  return result;
}

// Mock database save function
async function saveToDatabase(data: any): Promise<void> {
  console.log('\n💾 Saving to database:', data);
  // In production: await db.connectionResults.insert(data);
}

// ============================================================================
// Example 7: Generate Calibration Report
// ============================================================================

async function _generateCalibrationReport(
  results: Array<{ predicted: number; actual: number; strategy: string }>
): Promise<void> {
  console.log(`\n📈 Calibration Report\n`);
  console.log(`Total Attempts: ${results.length}\n`);

  const { calculateCalibrationMetrics } = await import('./universal-pathfinder');

  const metrics = calculateCalibrationMetrics(results);

  console.log(`Strategy Performance:\n`);

  Object.entries(metrics).forEach(([strategy, data]) => {
    console.log(`${strategy.toUpperCase()}:`);
    console.log(`  Attempts: ${data.count}`);
    console.log(`  Avg Predicted: ${(data.avgPredicted * 100).toFixed(1)}%`);
    console.log(`  Avg Actual: ${(data.avgActual * 100).toFixed(1)}%`);
    console.log(`  Error: ${(data.error * 100).toFixed(1)} percentage points`);
    console.log(`  Calibration: ${data.error < 0.05 ? '✅ Good' : data.error < 0.10 ? '⚠️ Fair' : '❌ Needs tuning'}`);
    console.log('');
  });
}

// ============================================================================
// Main Example
// ============================================================================

export async function main() {
  console.log('============================================');
  console.log('LinkedIn Universal Connection System');
  console.log('Example Usage');
  console.log('============================================');

  // Note: In production, these would come from your actual data sources
  const myProfile: UserProfile = {
    name: 'Alice Chen',
    email: 'alice@example.com',
    title: 'Senior Software Engineer',
    // ... rest of profile
  } as any;

  const targetProfile: UserProfile = {
    name: 'Bob Smith',
    email: 'bob@example.com',
    title: 'Engineering Manager',
    // ... rest of profile
  } as any;

  // Create mock graph (in production, use your actual graph implementation)
  const mockGraph: Graph = {
    getConnections: async (_userId: string) => [],
    bidirectionalBFS: async (_source: string, _target: string) => null,
  };

  // Example 1: Find single connection
  console.log('\n📍 Example 1: Single Connection Lookup');
  await findConnectionToTarget(myProfile, targetProfile, mockGraph);

  // Example 4: Analyze similarity
  console.log('\n📍 Example 4: Profile Similarity Analysis');
  analyzeProfileSimilarity(myProfile, targetProfile);

  console.log('\n============================================');
  console.log('For more examples, see the function definitions above');
  console.log('============================================\n');
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
