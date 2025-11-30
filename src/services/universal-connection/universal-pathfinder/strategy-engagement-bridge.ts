import type { UserProfile } from '@/types/resume-tailoring';
import type { ConnectionStrategy, Graph, SteppingStoneBridge } from '../universal-connection-types';
import { getActivitiesForTarget } from '@/lib/storage/network-db';
import { findSteppingStones } from './stepping-stone-analyzer';
import {
  rankSteppingStones,
  selectTopSteppingStones,
  generateConnectionMessage,
  generateReasoning,
  generateActionSteps,
} from './stepping-stone-ranker';
import {
  getEngagedPosts,
  mergeEngagementDirections,
  calculateBridgeQualityBasic,
} from './engagement-helpers';

/**
 * Engagement Bridge Strategy - ENHANCED
 * Finds paths through people who actively engage with the target (bidirectional)
 *
 * Logic:
 * 1. Get INBOUND engagement: People who engage WITH target (from activity database)
 * 2. Get OUTBOUND engagement: People target engages WITH (from target's profile)
 * 3. Merge both directions into unified engagement map
 * 4. Find stepping stones: engaged people who are in source's network
 * 5. Scrape stepping stone profiles for 3-way bridge quality analysis
 * 6. Rank stepping stones and select top 3
 * 7. Generate personalized connection messages
 *
 * Acceptance Rate: 28-48% (based on bridge quality and engagement strength)
 */
export async function tryEngagementBridgeStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy | null> {
  try {
    // Get target's LinkedIn ID (needed for lookups)
    const targetLinkedInId = targetUser.id;
    if (!targetLinkedInId) {
      console.log('[EngagementBridge] No LinkedIn ID for target');
      return null;
    }

    // ========================================================================
    // STEP 1: Get INBOUND Engagement (people who engage WITH target)
    // ========================================================================

    const inboundActivities = await getActivitiesForTarget(targetLinkedInId);
    console.log(`[EngagementBridge] Found ${inboundActivities.length} inbound activities`);

    // ========================================================================
    // STEP 2: Get OUTBOUND Engagement (people target engages WITH)
    // ========================================================================

    const outboundEngagement = await getEngagedPosts(targetUser);
    console.log(`[EngagementBridge] Found ${outboundEngagement.length} outbound engagements`);

    // ========================================================================
    // STEP 3: Merge Both Directions
    // ========================================================================

    const allEngagedPeople = mergeEngagementDirections(
      inboundActivities,
      outboundEngagement
    );

    console.log(`[EngagementBridge] Total ${allEngagedPeople.length} engaged people`);

    if (allEngagedPeople.length === 0) {
      console.log('[EngagementBridge] No engagement data available');
      return null;
    }

    // ========================================================================
    // STEP 4: Find Stepping Stones (engaged people in source's network)
    // ========================================================================

    const steppingStones = await findSteppingStones(
      sourceUser,
      allEngagedPeople,
      graph
    );

    console.log(`[EngagementBridge] Found ${steppingStones.length} stepping stones`);

    if (steppingStones.length === 0) {
      console.log('[EngagementBridge] No stepping stones in user network');
      return null;
    }

    // ========================================================================
    // STEP 5: Analyze Bridge Quality for Each Stepping Stone
    // ========================================================================

    const steppingStoneBridges: SteppingStoneBridge[] = [];

    for (const stone of steppingStones.slice(0, 5)) {  // Limit to top 5
      const bridgeQuality = await calculateBridgeQualityBasic(
        sourceUser,
        stone,
        targetUser
      );

      const reasoning = generateReasoning(stone, bridgeQuality, targetUser);
      const actionSteps = generateActionSteps(stone, targetUser);
      const connectionMessage = generateConnectionMessage(
        sourceUser,
        stone,
        targetUser,
        bridgeQuality
      );

      steppingStoneBridges.push({
        steppingStone: stone,
        bridgeQuality,
        rank: 0,
        reasoning,
        actionSteps,
        connectionMessage,
      });
    }

    // ========================================================================
    // STEP 6: Rank and Select Top 3
    // ========================================================================

    const rankedStones = rankSteppingStones(steppingStoneBridges);
    const topStones = selectTopSteppingStones(rankedStones, 3, 0.5);

    console.log(`[EngagementBridge] Selected ${topStones.length} top stepping stones`);

    if (topStones.length === 0) {
      console.log('[EngagementBridge] No high-quality stepping stones found');
      return null;
    }

    // ========================================================================
    // STEP 7: Return Strategy with Stepping Stones
    // ========================================================================

    const bestStone = topStones[0];

    return {
      type: 'engagement_bridge',
      confidence: bestStone.bridgeQuality.overallBridgeQuality,
      estimatedAcceptanceRate: bestStone.bridgeQuality.estimatedAcceptanceRate,
      path: {
        nodes: bestStone.steppingStone.pathToSource,
        edges: [],
        totalWeight: 1 - bestStone.bridgeQuality.overallBridgeQuality,
        successProbability: bestStone.bridgeQuality.estimatedAcceptanceRate * 100,
        mutualConnections: 0,
      },
      reasoning: bestStone.reasoning,
      nextSteps: bestStone.actionSteps,
      steppingStones: topStones,
    };
  } catch (error) {
    console.error('[EngagementBridge] Strategy failed:', error);
    return null;
  }
}
