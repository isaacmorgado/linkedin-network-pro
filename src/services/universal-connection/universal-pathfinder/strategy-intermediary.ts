/**
 * Intermediary Strategy (Stage 3)
 * Find best intermediaries when no mutual connections exist
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, Graph } from '../universal-connection-types';
import { findBestIntermediaries } from '../intermediary-scorer';
import { findNodeIdInGraph } from './strategy-mutual';

/**
 * Generate action items for intermediary strategy
 */
export function generateIntermediaryNextSteps(
  intermediary: any,
  _source: UserProfile,
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
 * Attempt intermediary matching strategy
 */
export async function tryIntermediaryStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy | null> {
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

    if (intermediaries.length > 0) {
      const bestIntermediary = intermediaries[0];
      const isLowConfidence = bestIntermediary.score <= 0.35;

      return {
        type: 'intermediary',
        confidence: bestIntermediary.score,
        intermediary: bestIntermediary,
        lowConfidence: isLowConfidence,
        estimatedAcceptanceRate: bestIntermediary.estimatedAcceptance,
        reasoning: isLowConfidence
          ? `${bestIntermediary.reasoning} (Note: Limited similarity - consider building relationship first)`
          : bestIntermediary.reasoning,
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

  return null;
}
