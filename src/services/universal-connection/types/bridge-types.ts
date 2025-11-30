/**
 * Bridge Types
 * Types related to engagement bridges and stepping stones
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { LinkedInProfile } from '../../../types';

/**
 * Engaged person from target's activity
 * Represents someone the target engages with (or who engages with target)
 */
export interface EngagedPerson {
  personId: string;
  personName: string;
  inboundCount: number;    // Times they engaged WITH target
  outboundCount: number;   // Times target engaged WITH them
  isBidirectional: boolean; // Both directions exist
  lastEngaged: Date;
  engagementTypes: Set<string>;
  engagementStrength: number; // 0-1 composite score
}

/**
 * Stepping stone candidate
 * Someone in user's network who also engages with the target
 */
export interface SteppingStone {
  person: EngagedPerson;
  connectionDegree: number; // 1, 2, or 3
  pathToSource: UserProfile[]; // Path from source to stepping stone
  profile?: LinkedInProfile; // Scraped profile data (optional)
}

/**
 * Bridge quality analysis result
 * Analyzes the 3-way connection: User → Stepping Stone → Target
 */
export interface BridgeQuality {
  userToStone: number;         // Similarity: user → stepping stone (0-1)
  stoneToTarget: number;       // Similarity: stepping stone → target (0-1)
  overallBridgeQuality: number; // Geometric mean + multipliers (0-1)
  sharedInterests: string[];   // Common topics/skills/industries
  connectionDegree: number;    // 1, 2, or 3
  engagementFrequency: number; // How often stone engages with target
  bestAngle: string;           // Personalized message angle
  estimatedAcceptanceRate: number; // 0-1
}

/**
 * Stepping stone bridge result
 * Complete analysis of a stepping stone path
 */
export interface SteppingStoneBridge {
  steppingStone: SteppingStone;
  bridgeQuality: BridgeQuality;
  rank: number;                // 1 = best, 2 = second best, etc.
  reasoning: string;           // Why this is a good bridge
  actionSteps: string[];       // Step-by-step instructions
  connectionMessage: string;   // Personalized outreach message
}

/**
 * Network overlap analysis
 * Shows how many people in user's network know the stepping stone
 */
export interface OverlapAnalysis {
  steppingStoneName: string;
  sourceConnectionsWhoKnowHer: Array<{
    name: string;
    engagementCount: number;
  }>;
  overlapDensity: number; // 0-1 (percentage of user's network that knows stone)
  networkStrength: number; // 0-1 (strength of connections)
}
