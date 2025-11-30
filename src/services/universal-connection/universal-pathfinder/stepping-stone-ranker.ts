/**
 * Stepping Stone Ranker
 * Ranks stepping stones by bridge quality and generates connection messages
 *
 * Core logic:
 * 1. Rank all stepping stones by weighted score
 * 2. Select top N candidates
 * 3. Generate personalized connection messages for each
 */

import type { UserProfile } from '@/types/resume-tailoring';
import type { SteppingStoneBridge, BridgeQuality, SteppingStone } from '../universal-connection-types';

/**
 * Rank stepping stones by bridge quality
 * Uses weighted scoring: quality (40%), proximity (30%), engagement (20%), overlap (10%)
 *
 * @param steppingStoneBridges Array of stepping stone bridges
 * @returns Ranked array (best first)
 */
export function rankSteppingStones(
  steppingStoneBridges: SteppingStoneBridge[]
): SteppingStoneBridge[] {
  // Calculate composite score for each
  const scored = steppingStoneBridges.map(bridge => {
    const qualityScore = bridge.bridgeQuality.overallBridgeQuality; // 0-1
    const proximityScore =
      bridge.steppingStone.connectionDegree === 1 ? 1.0 :
      bridge.steppingStone.connectionDegree === 2 ? 0.7 :
      0.4;
    const engagementScore = bridge.steppingStone.person.engagementStrength; // 0-1
    const overlapScore = 0.5; // TODO: Use actual network overlap when available

    const compositeScore =
      (qualityScore * 0.4) +
      (proximityScore * 0.3) +
      (engagementScore * 0.2) +
      (overlapScore * 0.1);

    return {
      bridge,
      compositeScore,
    };
  });

  // Sort by score (descending)
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  return scored.map((item, index) => ({
    ...item.bridge,
    rank: index + 1,
  }));
}

/**
 * Select top N stepping stones
 * Filters by minimum quality threshold and returns top N
 *
 * @param rankedStones Ranked stepping stones
 * @param maxCount Maximum number to return (default: 3)
 * @param minQuality Minimum bridge quality threshold (default: 0.5)
 * @returns Top N stepping stones
 */
export function selectTopSteppingStones(
  rankedStones: SteppingStoneBridge[],
  maxCount: number = 3,
  minQuality: number = 0.5
): SteppingStoneBridge[] {
  return rankedStones
    .filter(stone => stone.bridgeQuality.overallBridgeQuality >= minQuality)
    .slice(0, maxCount);
}

/**
 * Generate personalized connection message
 * Creates a message to reach out to the stepping stone
 *
 * @param sourceUser User's profile
 * @param steppingStone Stepping stone's data
 * @param targetUser Target's profile
 * @param bridgeQuality Bridge quality analysis
 * @returns Personalized outreach message
 */
export function generateConnectionMessage(
  sourceUser: UserProfile,
  steppingStone: SteppingStone,
  targetUser: UserProfile,
  bridgeQuality: BridgeQuality
): string {
  const stoneName = steppingStone.person.personName || 'there';
  const targetName = targetUser.name || 'them';
  const sourceName = sourceUser.name || 'me';

  // Build shared interests string
  const interests = bridgeQuality.sharedInterests.length > 0
    ? bridgeQuality.sharedInterests.slice(0, 3).join(', ')
    : 'professional development';

  // Engagement frequency description
  const engagementDesc =
    bridgeQuality.engagementFrequency > 0.7 ? 'frequently' :
    bridgeQuality.engagementFrequency > 0.4 ? 'regularly' :
    'occasionally';

  // Build message based on connection degree
  if (steppingStone.connectionDegree === 1) {
    // 1st degree connection - direct ask
    return `Hey ${stoneName},

I noticed your work on ${interests} - I've been working on similar topics as well.

I also saw you ${engagementDesc} engage with ${targetName}'s content on these same areas.

Since we all share these interests in ${interests}, would you be open to introducing us? I think we'd have great conversations together.

Best,
${sourceName}`;
  } else if (steppingStone.connectionDegree === 2) {
    // 2nd degree - ask via intermediary
    const intermediary = steppingStone.pathToSource[1]?.name || 'our mutual connection';

    return `Hey ${intermediary},

I'd like to connect with ${stoneName} - I saw they're very active in ${interests} work, which aligns with my interests.

I also noticed they ${engagementDesc} engage with ${targetName}'s content on similar topics. Would you be willing to introduce us so we can explore these shared interests?

Best,
${sourceName}`;
  } else {
    // 3rd degree or indirect
    return `I'd like to connect regarding our shared interests in ${interests}. I noticed your engagement with ${targetName}'s work and think we could have valuable professional conversations.`;
  }
}

/**
 * Generate reasoning for why this is a good stepping stone
 *
 * @param steppingStone Stepping stone data
 * @param bridgeQuality Bridge quality analysis
 * @param targetUser Target user
 * @returns Human-readable reasoning
 */
export function generateReasoning(
  steppingStone: SteppingStone,
  bridgeQuality: BridgeQuality,
  targetUser: UserProfile
): string {
  const stoneName = steppingStone.person.personName || 'This person';
  const targetName = targetUser.name || 'the target';
  const engagementCount = steppingStone.person.inboundCount + steppingStone.person.outboundCount;
  const engagementTypes = Array.from(steppingStone.person.engagementTypes).join(', ');

  const degreeText =
    steppingStone.connectionDegree === 1 ? 'your direct connection' :
    steppingStone.connectionDegree === 2 ? 'your 2nd-degree connection' :
    'in your extended network';

  return `${stoneName} is ${degreeText} who ${engagementCount > 0 ? `regularly engages with ${targetName} (${engagementCount} interactions, including ${engagementTypes})` : `knows ${targetName}`}. ${bridgeQuality.sharedInterests.length > 0 ? `You all share interests in ${bridgeQuality.sharedInterests.slice(0, 2).join(' and ')}.` : ''} This creates a natural introduction path.`;
}

/**
 * Generate action steps for using this stepping stone
 *
 * @param steppingStone Stepping stone data
 * @param targetUser Target user
 * @returns Step-by-step action items
 */
export function generateActionSteps(
  steppingStone: SteppingStone,
  targetUser: UserProfile
): string[] {
  const stoneName = steppingStone.person.personName || 'the stepping stone';
  const targetName = targetUser.name || 'the target';

  if (steppingStone.connectionDegree === 1) {
    return [
      `Reach out to ${stoneName} (your direct connection)`,
      `Mention your interest in connecting with ${targetName}`,
      `Reference their engagement relationship`,
      `Request an introduction based on shared interests`,
      `Follow up within 3-5 days if no response`,
    ];
  } else if (steppingStone.connectionDegree === 2) {
    const intermediary = steppingStone.pathToSource[1]?.name || 'your mutual connection';
    return [
      `Contact ${intermediary} (your direct connection)`,
      `Ask for an introduction to ${stoneName}`,
      `Explain your interest in ${targetName} and the shared connection`,
      `Once connected to ${stoneName}, request introduction to ${targetName}`,
      `Maintain the relationship with both ${stoneName} and ${intermediary}`,
    ];
  } else {
    return [
      `Research ${stoneName}'s recent activity and posts`,
      `Engage with their content authentically`,
      `Build rapport over 2-3 interactions`,
      `Then request introduction to ${targetName}`,
    ];
  }
}
