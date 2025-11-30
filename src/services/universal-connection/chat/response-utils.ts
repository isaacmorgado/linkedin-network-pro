/**
 * Response Utilities
 * Helper functions for response generation
 */

import type { Intent } from './intent-classifier';
import type { ChatMessage } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

/**
 * Build human-readable criteria string from entities
 */
export function buildCriteriaString(entities: Intent['entities']): string {
  const parts: string[] = [];

  if (entities.role) parts.push(entities.role);
  if (entities.query) parts.push(entities.query);
  if (entities.company) parts.push(`at ${entities.company}`);
  if (entities.location) parts.push(`in ${entities.location}`);
  if (entities.connectionDegree) {
    const degrees = entities.connectionDegree.map(d => `${d}${getDegreeOrdinal(d)}`).join('/');
    parts.push(`(${degrees} degree)`);
  }

  return parts.join(' ') || 'your criteria';
}

/**
 * Get degree ordinal suffix
 */
export function getDegreeOrdinal(degree: number): string {
  return degree === 1 ? 'st' : degree === 2 ? 'nd' : 'rd';
}

/**
 * Get degree label
 */
export function getDegreeLabel(degree: number): string {
  return degree === 1 ? 'st degree' : degree === 2 ? 'nd degree' : 'rd degree';
}

/**
 * Find user by name in graph
 */
export async function findUserByName(
  name: string | undefined,
  graph: Graph
): Promise<UserProfile | null> {
  if (!name) return null;

  const nameLower = name.toLowerCase();

  // Search through graph nodes for matching name
  for (const [, node] of Object.entries(graph)) {
    if (node?.profile?.name?.toLowerCase().includes(nameLower)) {
      return node.profile;
    }
  }

  return null;
}

/**
 * Create a simple chat message
 */
export function createMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
  };
}
