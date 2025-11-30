import type { UserProfile } from '@/types/resume-tailoring';
import type { ConnectionStrategy } from '../universal-connection-types';

/**
 * Semantic Fallback Strategy
 * Uses backend AI to find connection paths when graph-based methods fail
 *
 * Logic:
 * 1. Only called when ALL graph-based strategies return null
 * 2. Calls backend API with profile embeddings
 * 3. Backend uses semantic similarity to suggest connection approach
 * 4. Returns "soft path" with talking points
 *
 * Acceptance Rate: 15-22% (no direct path, but personalized)
 */
export async function trySemanticFallbackStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile
): Promise<ConnectionStrategy> {
  try {
    // Call backend API for semantic pathfinding
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const response = await fetch(`${backendUrl}/api/find-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        userId: sourceUser.id,
        sourceProfile: {
          id: sourceUser.id,
          name: sourceUser.name,
          headline: sourceUser.title,
          company: sourceUser.workExperience?.[0]?.company,
          role: sourceUser.workExperience?.[0]?.title,
          skills: sourceUser.skills?.map(s => s.name),
          education: sourceUser.education?.map(e => ({
            school: e.school,
            degree: e.degree,
            field: e.field,
          })),
        },
        targetProfile: {
          id: targetUser.id,
          name: targetUser.name,
          headline: targetUser.title,
          company: targetUser.workExperience?.[0]?.company,
          role: targetUser.workExperience?.[0]?.title,
          skills: targetUser.skills?.map(s => s.name),
          education: targetUser.education?.map(e => ({
            school: e.school,
            degree: e.degree,
            field: e.field,
          })),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    // Backend returns semantic similarity analysis
    const { similarity, sharedContext, reasoning, talkingPoints } = data.data;

    // Calculate acceptance rate based on similarity
    const baseAcceptance = 0.15;
    const similarityBonus = similarity * 0.07; // Up to 7% bonus
    const estimatedAcceptance = Math.min(baseAcceptance + similarityBonus, 0.22);

    return {
      type: 'semantic',
      confidence: similarity,
      estimatedAcceptanceRate: estimatedAcceptance,
      reasoning: reasoning || `No direct connection path found, but you share ${sharedContext?.length || 0} areas of professional overlap with ${targetUser.name}.`,
      nextSteps: talkingPoints || [
        'Send a personalized connection request',
        'Mention shared professional interests',
        'Reference common background or expertise areas',
        'Explain why you\'d like to connect professionally',
        'Keep message concise and authentic (under 300 characters)',
      ],
      // Semantic strategy has no graph path
      lowConfidence: true,
    };

  } catch (error) {
    console.error('[SemanticFallback] Backend API call failed:', error);

    // Fallback to basic semantic strategy (client-side)
    return createBasicSemanticStrategy(sourceUser, targetUser);
  }
}

/**
 * Basic semantic strategy (fallback if backend unavailable)
 * Uses simple profile comparison
 */
function createBasicSemanticStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile
): ConnectionStrategy {
  const sharedContext: string[] = [];

  // Find shared schools
  const sourceSchools = new Set(sourceUser.education?.map(e => e.school) || []);
  const targetSchools = targetUser.education?.map(e => e.school) || [];
  const sharedSchools = targetSchools.filter(school => sourceSchools.has(school));
  if (sharedSchools.length > 0) {
    sharedContext.push(`Both attended ${sharedSchools[0]}`);
  }

  // Find shared skills
  const sourceSkills = new Set(sourceUser.skills?.map(s => s.name.toLowerCase()) || []);
  const targetSkills = targetUser.skills?.map(s => s.name.toLowerCase()) || [];
  const sharedSkills = targetSkills.filter(skill => sourceSkills.has(skill));
  if (sharedSkills.length > 0) {
    const topShared = sharedSkills.slice(0, 2);
    sharedContext.push(`Shared expertise: ${topShared.join(', ')}`);
  }

  // Industry overlap
  const sourceIndustry = sourceUser.workExperience?.[0]?.company;
  const targetIndustry = targetUser.workExperience?.[0]?.company;
  if (sourceIndustry && targetIndustry) {
    sharedContext.push(`Both work in professional services`);
  }

  const similarityScore = Math.min(sharedContext.length / 3, 0.7);
  const estimatedAcceptance = 0.15 + (similarityScore * 0.05);

  return {
    type: 'semantic',
    confidence: similarityScore,
    estimatedAcceptanceRate: estimatedAcceptance,
    reasoning: sharedContext.length > 0
      ? `While you don't have a direct connection path, you share: ${sharedContext.join('; ')}`
      : `No direct connection path found. Consider a personalized cold outreach.`,
    nextSteps: [
      `Research ${targetUser.name}'s recent activity and posts`,
      sharedContext.length > 0 ? `Mention your shared background (${sharedContext[0]})` : 'Find common ground',
      `Send a thoughtful connection request`,
      `Explain your reason for connecting`,
      `Follow up with value - share relevant content or insights`,
    ],
    lowConfidence: true,
  };
}

/**
 * Get authentication token (from chrome.storage or context)
 */
async function getAuthToken(): Promise<string> {
  // This should be implemented based on your auth system
  // For now, return a placeholder
  try {
    const result = await chrome.storage.local.get('authToken');
    return result.authToken || '';
  } catch {
    return '';
  }
}
