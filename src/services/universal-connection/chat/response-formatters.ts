/**
 * Response Formatters
 * Format search and pathfinding results into natural language responses
 */

import type { Intent } from './intent-classifier';
import type { ChatMessage, SearchResult } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { ConnectionStrategy } from '../universal-connection-types';
import { buildCriteriaString, getDegreeLabel } from './response-utils';

/**
 * Format search results into natural language response
 */
export function formatSearchResponse(
  results: SearchResult[],
  intent: Intent
): ChatMessage {
  const count = results.length;

  let content: string;

  if (count === 0) {
    const criteria = buildCriteriaString(intent.entities);
    content = `I couldn't find anyone matching ${criteria} in your network.\n\nTips:\n• Try removing some filters\n• Search for a broader role or company\n• Check if you have 2nd or 3rd degree connections`;
  } else if (count === 1) {
    const person = results[0];
    const headline = person.headline ? `, ${person.headline}` : '';
    const company = person.company ? ` at ${person.company}` : '';
    content = `I found **${person.name}**${headline}${company}.\n\n• Connection degree: ${person.connectionDegree}${getDegreeLabel(person.connectionDegree)}\n• Match score: ${person.matchScore}%\n\nWould you like me to find the best path to connect with them?`;
  } else if (count <= 5) {
    const names = results.map(r => `• ${r.name} (${r.connectionDegree}${getDegreeLabel(r.connectionDegree)}${r.company ? ` at ${r.company}` : ''})`).join('\n');
    content = `I found ${count} people matching your search:\n\n${names}\n\nWould you like details on any of them or help connecting?`;
  } else {
    const topNames = results.slice(0, 5).map(r => `• ${r.name} (${r.connectionDegree}${getDegreeLabel(r.connectionDegree)}${r.company ? ` at ${r.company}` : ''})`).join('\n');
    content = `I found **${count} professionals** matching your search! Here are the top 5:\n\n${topNames}\n\n(Showing top 5 of ${count} results. Ask me for more details!)`;
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    metadata: {
      searchResults: results.slice(0, 20), // Limit metadata size
    },
  };
}

/**
 * Format path finding results into natural language response
 */
export function formatPathResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): ChatMessage {
  let content: string;

  switch (strategy.type) {
    case 'mutual':
      content = formatMutualPathResponse(strategy, targetUser);
      break;

    case 'direct-similarity':
      content = formatDirectSimilarityResponse(strategy, targetUser);
      break;

    case 'engagement_bridge':
      content = formatEngagementBridgeResponse(strategy, targetUser);
      break;

    case 'company_bridge':
      content = formatCompanyBridgeResponse(strategy, targetUser);
      break;

    case 'intermediary':
      content = formatIntermediaryResponse(strategy, targetUser);
      break;

    case 'cold-similarity':
    case 'cold-outreach':
      content = formatColdOutreachResponse(strategy, targetUser);
      break;

    case 'semantic':
      content = formatSemanticFallbackResponse(strategy, targetUser);
      break;

    default:
      content = `Found a path to ${targetUser.name}. ${strategy.reasoning}`;
  }

  // Add acceptance rate and next steps
  const acceptanceRate = (strategy.estimatedAcceptanceRate * 100).toFixed(0);
  content += `\n\n**Estimated acceptance rate:** ${acceptanceRate}%\n\n**Next steps:**\n${strategy.nextSteps.map(step => `• ${step}`).join('\n')}`;

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    metadata: {
      paths: [strategy],
    },
  };
}

/**
 * Format mutual connection path response
 */
function formatMutualPathResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  if (!strategy.path) {
    return `Great news! You can reach **${targetUser.name}** through mutual connections.`;
  }

  const hopCount = strategy.path.nodes.length - 2; // Exclude source and target
  const mutualCount = strategy.path.mutualConnections;

  if (hopCount === 1) {
    const intermediary = strategy.path.nodes[1];
    return `Great news! You can reach **${targetUser.name}** through **${intermediary.name}**, who is connected to both of you.\n\nYou share ${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''} with ${targetUser.name}.`;
  } else {
    const intermediaries = strategy.path.nodes.slice(1, -1).map(n => n.name).join(' → ');
    return `I found a path to **${targetUser.name}** through ${hopCount} people:\n\n${intermediaries}\n\nThis path has ${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''} and a ${(strategy.path.successProbability * 100).toFixed(0)}% success probability.`;
  }
}

/**
 * Format direct similarity response
 */
function formatDirectSimilarityResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  if (!strategy.directSimilarity) {
    return `You have high profile similarity with **${targetUser.name}**. Consider sending a direct connection request.`;
  }

  const similarity = (strategy.directSimilarity.overall * 100).toFixed(0);
  const commonalities: string[] = [];

  if (strategy.directSimilarity.breakdown.industry > 0.5) {
    commonalities.push('same industry');
  }
  if (strategy.directSimilarity.breakdown.skills > 0.3) {
    commonalities.push('similar skills');
  }
  if (strategy.directSimilarity.breakdown.companies > 0.5) {
    commonalities.push('overlapping company experience');
  }
  if (strategy.directSimilarity.breakdown.education > 0.5) {
    commonalities.push('shared educational background');
  }

  const commonString = commonalities.length > 0 ? ` You share: ${commonalities.join(', ')}.` : '';

  return `You have **${similarity}% profile similarity** with **${targetUser.name}**.${commonString}\n\nConsider sending a direct connection request highlighting your common background!`;
}

/**
 * Format engagement bridge response
 */
function formatEngagementBridgeResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  if (!strategy.intermediary) {
    return `I found a path to **${targetUser.name}** through people who engage with them on LinkedIn.`;
  }

  return `I found **${strategy.intermediary.person.name}** who actively engages with **${targetUser.name}**'s content.\n\n${strategy.intermediary.person.name} can introduce you based on their existing relationship (engagement score: ${(strategy.intermediary.score * 100).toFixed(0)}%).`;
}

/**
 * Format company bridge response
 */
function formatCompanyBridgeResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  if (!strategy.intermediary) {
    return `I found a path to **${targetUser.name}** through colleagues at their company.`;
  }

  const currentCompany = targetUser.workExperience?.[0]?.company || 'their company';
  return `I found **${strategy.intermediary.person.name}** who works at ${currentCompany} with **${targetUser.name}**.\n\nThey can provide a warm introduction as colleagues (connection strength: ${(strategy.intermediary.score * 100).toFixed(0)}%).`;
}

/**
 * Format intermediary response
 */
function formatIntermediaryResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  if (!strategy.intermediary) {
    return `I found an intermediary who can bridge you to **${targetUser.name}**.`;
  }

  const { person, sourceToIntermediary, intermediaryToTarget } = strategy.intermediary;

  return `I found **${person.name}** who can bridge you to **${targetUser.name}**.\n\n• Your similarity with ${person.name}: ${(sourceToIntermediary * 100).toFixed(0)}%\n• ${person.name}'s similarity with ${targetUser.name}: ${(intermediaryToTarget * 100).toFixed(0)}%\n\nThey're a strong intermediary with connections to both of you.`;
}

/**
 * Format cold outreach response
 */
function formatColdOutreachResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  const hasCandidate = strategy.candidate;

  if (!hasCandidate) {
    return `No direct path found to **${targetUser.name}**. I recommend a cold outreach strategy with a personalized message highlighting shared interests or background.`;
  }

  return `No direct path found to **${targetUser.name}**, but I found **${strategy.candidate!.person.name}** who might help.\n\nAlternatively, consider a direct cold outreach to ${targetUser.name} with a highly personalized message emphasizing any shared background or interests.`;
}

/**
 * Format semantic fallback response
 */
function formatSemanticFallbackResponse(
  strategy: ConnectionStrategy,
  targetUser: UserProfile
): string {
  return `Based on AI-powered analysis, I suggest reaching out to **${targetUser.name}** with a personalized message.\n\n${strategy.reasoning}`;
}
