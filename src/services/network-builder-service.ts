/**
 * Network Builder Service
 * Automatically builds and maintains the network graph by scraping LinkedIn profiles
 */

import { NetworkGraph } from '../lib/graph';
import type { NetworkNode, NetworkEdge, LinkedInProfile } from '../types';
import { scrapePersonProfile } from '../utils/linkedin-scraper';
import { calculateProfileSimilarity } from './universal-connection/intermediary-scorer';
import { log, LogCategory } from '../utils/logger';

interface ProfileCache {
  profileUrl: string;
  lastScraped: number;
  expiresAt: number;
}

const SCRAPE_DELAY_MIN = 2000; // 2 seconds minimum
const SCRAPE_DELAY_MAX = 5000; // 5 seconds maximum
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_KEY = 'networkGraph';
const CACHE_KEY = 'profile_scrape_cache';

/**
 * Load network graph from chrome storage
 */
export async function loadNetworkGraph(): Promise<NetworkGraph> {
  const graph = new NetworkGraph();

  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    if (result[STORAGE_KEY]) {
      graph.import(result[STORAGE_KEY]);
      log.info(LogCategory.NETWORK, `Loaded network graph with ${graph.getAllNodes().length} nodes`);
    }
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to load network graph', error as Error);
  }

  return graph;
}

/**
 * Save network graph to chrome storage
 */
export async function saveNetworkGraph(graph: NetworkGraph): Promise<void> {
  try {
    const data = graph.export();
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    log.info(LogCategory.NETWORK, `Saved network graph with ${data.nodes.length} nodes, ${data.edges.length} edges`);
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to save network graph', error as Error);
    throw error;
  }
}

/**
 * Check if profile was recently scraped
 */
async function wasRecentlyScraped(profileUrl: string): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get([CACHE_KEY]);
    const cache: ProfileCache[] = result[CACHE_KEY] || [];

    const cached = cache.find(c => c.profileUrl === profileUrl);
    if (cached && Date.now() < cached.expiresAt) {
      log.debug(LogCategory.NETWORK, `Profile ${profileUrl} was recently scraped, skipping`);
      return true;
    }

    return false;
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to check scrape cache', error as Error);
    return false;
  }
}

/**
 * Mark profile as scraped
 */
async function markProfileScraped(profileUrl: string): Promise<void> {
  try {
    const result = await chrome.storage.local.get([CACHE_KEY]);
    const cache: ProfileCache[] = result[CACHE_KEY] || [];

    // Remove old entry if exists
    const filtered = cache.filter(c => c.profileUrl !== profileUrl);

    // Add new entry
    const now = Date.now();
    filtered.push({
      profileUrl,
      lastScraped: now,
      expiresAt: now + CACHE_TTL
    });

    // Keep only last 500 entries
    const trimmed = filtered.slice(-500);

    await chrome.storage.local.set({ [CACHE_KEY]: trimmed });
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to mark profile scraped', error as Error);
  }
}

/**
 * Convert LinkedIn profile to NetworkNode
 */
function convertToNetworkNode(profile: LinkedInProfile, currentUserId?: string): NetworkNode {
  // Use profile URL as ID (most stable)
  const id = profile.profileUrl || profile.publicId || profile.name;

  // Determine degree (1st, 2nd, or 3rd degree connection)
  // For now, assume all are 2nd degree unless it's the current user
  const degree = id === currentUserId ? 0 : 2;

  return {
    id,
    profile,
    status: 'not_contacted',
    degree: degree as 1 | 2 | 3,
    matchScore: 0, // Will be calculated when finding paths
  };
}

/**
 * Calculate edge weight between two profiles
 */
function calculateEdgeWeight(profile1: LinkedInProfile, profile2: LinkedInProfile): number {
  // Base weight
  let weight = 1.0;

  // Same company reduces weight (stronger connection)
  if (profile1.currentRole?.company && profile2.currentRole?.company) {
    if (profile1.currentRole.company === profile2.currentRole.company) {
      weight -= 0.2;
    }
  }

  // Same school reduces weight
  const schools1 = profile1.education?.map(e => e.school) || [];
  const schools2 = profile2.education?.map(e => e.school) || [];
  if (schools1.some(s => schools2.includes(s))) {
    weight -= 0.15;
  }

  // Ensure weight stays in valid range
  return Math.max(0.1, Math.min(1.0, weight));
}

/**
 * Add profile to network graph
 */
export async function addProfileToGraph(
  profileUrl: string,
  currentUserId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already scraped recently
    if (await wasRecentlyScraped(profileUrl)) {
      return { success: true, message: 'Profile already in cache' };
    }

    // Add random delay to avoid detection
    const delay = SCRAPE_DELAY_MIN + Math.random() * (SCRAPE_DELAY_MAX - SCRAPE_DELAY_MIN);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Scrape profile
    log.info(LogCategory.NETWORK, `Scraping profile: ${profileUrl}`);
    const profileData = scrapePersonProfile();

    if (!profileData) {
      log.warn(LogCategory.NETWORK, `Failed to scrape profile: ${profileUrl}`);
      return { success: false, message: 'Failed to scrape profile data' };
    }

    // Load existing graph
    const graph = await loadNetworkGraph();

    // Convert to network node
    const node = convertToNetworkNode(profileData, currentUserId);

    // Add node to graph
    graph.addNode(node);
    log.info(LogCategory.NETWORK, `Added node to graph: ${node.id}`);

    // If current user is known, add bidirectional edges for mutual connection
    if (currentUserId) {
      const currentUserNode = graph.getNode(currentUserId);
      if (currentUserNode) {
        const weight = calculateEdgeWeight(currentUserNode.profile, profileData);

        // Forward edge: current user -> profile
        graph.addEdge({
          from: currentUserId,
          to: node.id,
          weight,
          relationshipType: 'mutual'
        });
        log.info(LogCategory.NETWORK, `Added edge: ${currentUserId} -> ${node.id} (weight: ${weight})`);

        // Reverse edge: profile -> current user (for bidirectional mutual connection)
        graph.addEdge({
          from: node.id,
          to: currentUserId,
          weight,
          relationshipType: 'mutual'
        });
        log.info(LogCategory.NETWORK, `Added reverse edge: ${node.id} -> ${currentUserId} (weight: ${weight})`);
      }
    }

    // Save updated graph
    await saveNetworkGraph(graph);

    // Mark as scraped
    await markProfileScraped(profileUrl);

    return {
      success: true,
      message: `Added ${profileData.name} to network (${graph.getAllNodes().length} total profiles)`
    };
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to add profile to graph', error as Error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Clear network graph (for testing/reset)
 */
export async function clearNetworkGraph(): Promise<void> {
  try {
    await chrome.storage.local.remove([STORAGE_KEY, CACHE_KEY]);
    log.info(LogCategory.NETWORK, 'Cleared network graph');
  } catch (error) {
    log.error(LogCategory.NETWORK, 'Failed to clear network graph', error as Error);
    throw error;
  }
}

/**
 * Get network graph statistics
 */
export async function getNetworkStats(): Promise<{
  nodeCount: number;
  edgeCount: number;
  lastUpdated?: number;
}> {
  const graph = await loadNetworkGraph();
  const data = graph.export();

  return {
    nodeCount: data.nodes.length,
    edgeCount: data.edges.length,
  };
}
