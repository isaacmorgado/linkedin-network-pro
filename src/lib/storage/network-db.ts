/**
 * Network Database - IndexedDB storage for network graph data
 *
 * Uses Dexie.js for large-scale network data:
 * - Nodes: LinkedIn profiles in network (1st/2nd/3rd degree)
 * - Edges: Connections between people
 * - Activities: Engagement events (who interacted with whom)
 * - Companies: Employee lists from company pages
 *
 * Separate from chrome.storage (used for small, simple data)
 * IndexedDB for large datasets (thousands of nodes/edges)
 */

import Dexie, { Table } from 'dexie';
import type { NetworkNode, NetworkEdge } from '@/types';
import type { ActivityEvent, CompanyMap } from '@/types/network';

// ============================================================================
// DATABASE CLASS
// ============================================================================

export class NetworkDatabase extends Dexie {
  // Tables
  nodes!: Table<NetworkNode, string>;
  edges!: Table<NetworkEdge, string>;
  activities!: Table<ActivityEvent, string>;
  companies!: Table<CompanyMap, string>;

  constructor() {
    super('UprootNetworkDB');

    // Version 1 - Initial schema
    this.version(1).stores({
      // Nodes: Indexed by id (primary), degree, profile fields, matchScore
      // Allows queries like: "find all 2nd degree connections at Google"
      nodes: 'id, degree, profile.name, profile.company, matchScore, status',

      // Edges: Composite primary key [from+to] prevents duplicates
      // Indexed by from/to for pathfinding (get all edges from a node)
      edges: '[from+to], from, to, weight, relationshipType',

      // Activities: For engagement_bridge strategy
      // Critical index: targetId (find who engages with target person)
      activities: 'id, actorId, targetId, type, timestamp, scrapedAt',

      // Companies: For company_bridge strategy
      // Indexed by companyId (primary), name, and scrape time
      companies: 'companyId, companyName, scrapedAt',
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of the network database
 * Import and use across the extension:
 *
 * import { networkDB } from '@/lib/storage/network-db';
 * await networkDB.nodes.add(newNode);
 */
export const networkDB = new NetworkDatabase();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a node by ID with error handling
 */
export async function getNode(nodeId: string): Promise<NetworkNode | null> {
  try {
    const node = await networkDB.nodes.get(nodeId);
    return node || null;
  } catch (error) {
    console.error('[NetworkDB] Failed to get node:', nodeId, error);
    return null;
  }
}

/**
 * Add or update a node (upsert operation)
 */
export async function upsertNode(node: NetworkNode): Promise<void> {
  try {
    await networkDB.nodes.put(node);
  } catch (error) {
    console.error('[NetworkDB] Failed to upsert node:', node.id, error);
    throw error;
  }
}

/**
 * Bulk add nodes efficiently
 */
export async function bulkAddNodes(nodes: NetworkNode[]): Promise<void> {
  try {
    await networkDB.nodes.bulkPut(nodes);
    console.log(`[NetworkDB] Added ${nodes.length} nodes`);
  } catch (error) {
    console.error('[NetworkDB] Failed to bulk add nodes:', error);
    throw error;
  }
}

/**
 * Get all edges for a specific node (outgoing)
 */
export async function getNodeEdges(nodeId: string): Promise<NetworkEdge[]> {
  try {
    return await networkDB.edges.where('from').equals(nodeId).toArray();
  } catch (error) {
    console.error('[NetworkDB] Failed to get edges for node:', nodeId, error);
    return [];
  }
}

/**
 * Add or update an edge (upsert operation)
 */
export async function upsertEdge(edge: NetworkEdge): Promise<void> {
  try {
    await networkDB.edges.put(edge);
  } catch (error) {
    console.error('[NetworkDB] Failed to upsert edge:', error);
    throw error;
  }
}

/**
 * Bulk add edges efficiently
 */
export async function bulkAddEdges(edges: NetworkEdge[]): Promise<void> {
  try {
    await networkDB.edges.bulkPut(edges);
    console.log(`[NetworkDB] Added ${edges.length} edges`);
  } catch (error) {
    console.error('[NetworkDB] Failed to bulk add edges:', error);
    throw error;
  }
}

/**
 * Get all activities where a person is the target (for engagement_bridge)
 * Returns who has engaged with this person
 */
export async function getActivitiesForTarget(targetId: string): Promise<ActivityEvent[]> {
  try {
    return await networkDB.activities.where('targetId').equals(targetId).toArray();
  } catch (error) {
    console.error('[NetworkDB] Failed to get activities for target:', targetId, error);
    return [];
  }
}

/**
 * Get all activities by an actor
 */
export async function getActivitiesByActor(actorId: string): Promise<ActivityEvent[]> {
  try {
    return await networkDB.activities.where('actorId').equals(actorId).toArray();
  } catch (error) {
    console.error('[NetworkDB] Failed to get activities by actor:', actorId, error);
    return [];
  }
}

/**
 * Add activity events (from scraper)
 */
export async function bulkAddActivities(activities: ActivityEvent[]): Promise<void> {
  try {
    await networkDB.activities.bulkAdd(activities);
    console.log(`[NetworkDB] Added ${activities.length} activities`);
  } catch (error) {
    console.error('[NetworkDB] Failed to bulk add activities:', error);
    throw error;
  }
}

/**
 * Get company data by company ID
 */
export async function getCompany(companyId: string): Promise<CompanyMap | null> {
  try {
    const company = await networkDB.companies.get(companyId);
    return company || null;
  } catch (error) {
    console.error('[NetworkDB] Failed to get company:', companyId, error);
    return null;
  }
}

/**
 * Add or update company data
 */
export async function upsertCompany(company: CompanyMap): Promise<void> {
  try {
    await networkDB.companies.put(company);
  } catch (error) {
    console.error('[NetworkDB] Failed to upsert company:', company.companyId, error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<{
  nodes: number;
  edges: number;
  activities: number;
  companies: number;
}> {
  try {
    const [nodes, edges, activities, companies] = await Promise.all([
      networkDB.nodes.count(),
      networkDB.edges.count(),
      networkDB.activities.count(),
      networkDB.companies.count(),
    ]);

    return { nodes, edges, activities, companies };
  } catch (error) {
    console.error('[NetworkDB] Failed to get database stats:', error);
    return { nodes: 0, edges: 0, activities: 0, companies: 0 };
  }
}

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await networkDB.transaction('rw', networkDB.nodes, networkDB.edges, networkDB.activities, networkDB.companies, async () => {
      await networkDB.nodes.clear();
      await networkDB.edges.clear();
      await networkDB.activities.clear();
      await networkDB.companies.clear();
    });
    console.log('[NetworkDB] All data cleared');
  } catch (error) {
    console.error('[NetworkDB] Failed to clear data:', error);
    throw error;
  }
}

/**
 * Check storage quota and usage
 */
export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentUsed };
    }
    return { usage: 0, quota: 0, percentUsed: 0 };
  } catch (error) {
    console.error('[NetworkDB] Failed to check storage quota:', error);
    return { usage: 0, quota: 0, percentUsed: 0 };
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type NetworkDatabaseType = InstanceType<typeof NetworkDatabase>;
export type NodesTable = Table<NetworkNode, string>;
export type EdgesTable = Table<NetworkEdge, string>;
export type ActivitiesTable = Table<ActivityEvent, string>;
export type CompaniesTable = Table<CompanyMap, string>;
