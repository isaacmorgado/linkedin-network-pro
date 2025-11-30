import type { UserProfile } from '@/types/resume-tailoring';
import type { ConnectionStrategy, Graph } from '../universal-connection-types';
import { getCompany } from '@/lib/storage/network-db';
import { calculateProfileSimilarity as _calculateProfileSimilarity } from '../profile-similarity';

/**
 * Company Bridge Strategy
 * Finds paths through colleagues at target's company
 *
 * Logic:
 * 1. Identify target's current company
 * 2. Find employees at that company in the database
 * 3. Check if source user is connected to any employees
 * 4. Prioritize by connection degree and role similarity
 *
 * Acceptance Rate: 32-40% (higher if 1st-degree colleague)
 */
export async function tryCompanyBridgeStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy | null> {
  try {
    // Get target's current company
    const targetCompany = targetUser.workExperience?.[0]?.company; // Most recent job
    if (!targetCompany) {
      return null;
    }

    // Try to find company in database (using company name as ID for now)
    // In production, you'd have a proper companyId mapping
    const companyId = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const companyData = await getCompany(companyId);

    if (!companyData || companyData.employees.length === 0) {
      // No company data available
      return null;
    }

    // Get source user's connections
    const sourceNodeId = findNodeIdInGraph(graph, sourceUser);
    if (!sourceNodeId) {
      return null;
    }

    const sourceConnections = await graph.getConnections(sourceNodeId);
    const sourceConnectionIds = new Set(sourceConnections.map(c => c.id));

    // Find employees that source user is connected to
    const connectedColleagues = companyData.employees.filter(employee =>
      sourceConnectionIds.has(employee.profileId)
    );

    if (connectedColleagues.length === 0) {
      return null;
    }

    // Find best colleague as bridge
    let bestBridge: {
      employee: typeof connectedColleagues[0];
      score: number;
      path: any[];
    } | null = null;

    for (const colleague of connectedColleagues) {
      // Calculate bridge score based on:
      // 1. Connection degree (1st > 2nd > 3rd)
      // 2. Role similarity to target (same department/role)
      // 3. Seniority (senior people have more influence)

      const degreeScore = colleague.connectionDegree === 1 ? 1.0 :
                         colleague.connectionDegree === 2 ? 0.7 : 0.4;

      // Role similarity (simple keyword matching)
      const targetRole = targetUser.workExperience?.[0]?.title?.toLowerCase() || '';
      const colleagueRole = colleague.role.toLowerCase();
      const sameDepartment = colleague.department &&
        targetRole.includes(colleague.department.toLowerCase());
      const roleScore = sameDepartment ? 1.0 : 0.5;

      // Seniority bonus (based on role keywords)
      const seniorityKeywords = ['senior', 'lead', 'principal', 'director', 'vp', 'head'];
      const isSenior = seniorityKeywords.some(kw => colleagueRole.includes(kw));
      const seniorityBonus = isSenior ? 0.2 : 0;

      const totalScore = (degreeScore * 0.6) + (roleScore * 0.3) + seniorityBonus;

      // Construct path
      const colleagueNode = graph.getNode?.(colleague.profileId);
      const targetNode = graph.getNode?.(targetUser.id || '');

      if (colleagueNode && targetNode) {
        const path = [
          graph.getNode?.(sourceNodeId),
          colleagueNode,
          targetNode,
        ].filter(Boolean);

        if (path.length === 3) {
          if (!bestBridge || totalScore > bestBridge.score) {
            bestBridge = {
              employee: colleague,
              score: totalScore,
              path,
            };
          }
        }
      }
    }

    // Return strategy if we found a good bridge
    if (bestBridge && bestBridge.score >= 0.4) {
      const colleague = bestBridge.employee;

      // Calculate acceptance rate
      const baseAcceptance = 0.32;
      const degreeBonus = colleague.connectionDegree === 1 ? 0.08 :
                         colleague.connectionDegree === 2 ? 0.04 : 0;
      const estimatedAcceptance = Math.min(baseAcceptance + degreeBonus, 0.40);

      return {
        type: 'company_bridge',
        confidence: bestBridge.score,
        estimatedAcceptanceRate: estimatedAcceptance,
        path: {
          nodes: bestBridge.path,
          edges: [],
          totalWeight: 0.5,
          successProbability: 0.7,
          mutualConnections: 0,
        },
        reasoning: `${colleague.name} works at ${targetCompany} in ${colleague.department || 'the same organization'} as ${targetUser.name}. This shared workplace creates a natural introduction path.`,
        nextSteps: [
          `Reach out to ${colleague.name} (your ${colleague.connectionDegree === 1 ? 'direct connection' : colleague.connectionDegree + 'nd-degree connection'})`,
          `Mention your interest in connecting with ${targetUser.name} at ${targetCompany}`,
          `Ask about ${colleague.name}'s experience working with or alongside ${targetUser.name}`,
          `Request an introduction based on shared company context`,
          colleague.department ? `Reference their shared work in ${colleague.department}` : '',
        ].filter(Boolean),
      };
    }

    return null;
  } catch (error) {
    console.error('[CompanyBridge] Strategy failed:', error);
    return null;
  }
}

/**
 * Helper to find node ID in graph with fallback matching
 */
function findNodeIdInGraph(graph: Graph, user: UserProfile): string | null {
  // Try LinkedIn ID first
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  // Try email
  if (user.email) {
    const node = graph.getNode?.(user.email);
    if (node) return user.email;
  }

  // Try user ID
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  return null;
}
