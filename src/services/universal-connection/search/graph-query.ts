/**
 * Local Graph Query Engine
 * Searches IndexedDB network graph based on parsed natural language queries
 *
 * Features:
 * - Fast IndexedDB queries using Dexie indexes
 * - Multi-field matching (name, headline, company, role)
 * - Connection degree filtering
 * - Basic relevance scoring
 * - Optimized for 1000+ node graphs
 */

import { networkDB } from '@/lib/storage/network-db';
import type { SearchQuery, SearchResult } from '@/types/search';
// @ts-expect-error - Type imported for reference, used indirectly through SearchResult
import type { NetworkNode } from '@/types';
import { matchesFilters, generateReasoning } from './graph-query-helpers';
import { calculateMatchScore, extractCurrentCompany, extractCurrentRole } from './graph-query-scoring';

/**
 * Search the local network graph
 * Returns top 50 results sorted by relevance
 */
export async function searchGraph(searchQuery: SearchQuery): Promise<SearchResult[]> {
  const { query, filters } = searchQuery;

  try {
    // Start with all nodes
    let collection = networkDB.nodes.toCollection();

    // Apply connection degree filter if specified
    if (filters?.connectionDegree && filters.connectionDegree.length > 0) {
      collection = collection.filter(node =>
        filters.connectionDegree!.includes(node.degree)
      );
    }

    // Get all matching nodes
    const allNodes = await collection.toArray();

    // Apply keyword and filter matching
    const matchedNodes = allNodes.filter(node => matchesFilters(node, query, filters));

    // Calculate match scores
    const results: SearchResult[] = matchedNodes.map(node => ({
      profileId: node.id,
      name: node.profile.name,
      headline: node.profile.headline,
      company: extractCurrentCompany(node),
      role: extractCurrentRole(node),
      connectionDegree: node.degree,
      matchScore: calculateMatchScore(node, query, filters),
      pathAvailable: node.degree <= 3, // Assume path exists for 1st/2nd/3rd degree
      reasoning: generateReasoning(node, query, filters),
    }));

    // Sort by match score (highest first), then by connection degree (closest first)
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.connectionDegree - b.connectionDegree;
    });

    // Return top 50 results
    return results.slice(0, 50);
  } catch (error) {
    console.error('[GraphQuery] Failed to search graph:', error);
    return [];
  }
}

/**
 * Search by company (optimized query)
 */
export async function searchByCompany(companyName: string, limit = 50): Promise<SearchResult[]> {
  try {
    const nodes = await networkDB.nodes.toArray();
    const matchingNodes = nodes.filter(node => {
      const company = extractCurrentCompany(node);
      return company?.toLowerCase().includes(companyName.toLowerCase());
    });

    return matchingNodes.slice(0, limit).map(node => ({
      profileId: node.id,
      name: node.profile.name,
      headline: node.profile.headline,
      company: extractCurrentCompany(node),
      role: extractCurrentRole(node),
      connectionDegree: node.degree,
      matchScore: calculateMatchScore(node, '', { company: companyName }),
      pathAvailable: true,
      reasoning: `Works at ${extractCurrentCompany(node)}`,
    }));
  } catch (error) {
    console.error('[GraphQuery] Failed to search by company:', error);
    return [];
  }
}

/**
 * Search by connection degree (optimized query)
 */
export async function searchByDegree(degree: number, limit = 50): Promise<SearchResult[]> {
  try {
    const nodes = await networkDB.nodes
      .where('degree')
      .equals(degree)
      .limit(limit)
      .toArray();

    return nodes.map(node => ({
      profileId: node.id,
      name: node.profile.name,
      headline: node.profile.headline,
      company: extractCurrentCompany(node),
      role: extractCurrentRole(node),
      connectionDegree: node.degree,
      matchScore: calculateMatchScore(node, ''),
      pathAvailable: true,
      reasoning: `${degree === 1 ? '1st' : degree === 2 ? '2nd' : '3rd'}-degree connection`,
    }));
  } catch (error) {
    console.error('[GraphQuery] Failed to search by degree:', error);
    return [];
  }
}

/**
 * Get total node count in graph
 */
export async function getNodeCount(): Promise<number> {
  try {
    return await networkDB.nodes.count();
  } catch (error) {
    console.error('[GraphQuery] Failed to get node count:', error);
    return 0;
  }
}

/**
 * Get graph statistics
 */
export async function getGraphStats(): Promise<{
  totalNodes: number;
  firstDegree: number;
  secondDegree: number;
  thirdDegree: number;
}> {
  try {
    const [total, first, second, third] = await Promise.all([
      networkDB.nodes.count(),
      networkDB.nodes.where('degree').equals(1).count(),
      networkDB.nodes.where('degree').equals(2).count(),
      networkDB.nodes.where('degree').equals(3).count(),
    ]);

    return {
      totalNodes: total,
      firstDegree: first,
      secondDegree: second,
      thirdDegree: third,
    };
  } catch (error) {
    console.error('[GraphQuery] Failed to get graph stats:', error);
    return { totalNodes: 0, firstDegree: 0, secondDegree: 0, thirdDegree: 0 };
  }
}
