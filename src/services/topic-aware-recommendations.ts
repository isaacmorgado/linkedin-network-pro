/**
 * Topic-Aware Recommendations
 * Generates personalized connection strategies based on content preferences
 *
 * Features:
 * - Topic-based stepping stone ranking
 * - Personalized connection messages
 * - Shared interest identification
 * - Content-driven networking intelligence
 */

import type { ActivityEvent } from '@/types/network';
import type { ContentTopics } from './content-topic-analyzer';
import { analyzeUserTopics, findCommonTopics, getTopicSummary } from './content-topic-analyzer';
import { calculateEngagementStrength } from './engagement-quality-scorer';

/**
 * Stepping stone with topic-aware scoring
 */
export interface TopicAwareSteppingStone {
  userId: string;
  userName: string;
  connectionDegree: number; // 1, 2, or 3
  engagementStrength: number; // 0-1
  topicOverlap: number; // 0-1 (how much topics overlap with target)
  sharedTopics: string[]; // Topics shared between stepping stone and target
  recommendationScore: number; // 0-1 (overall recommendation strength)
  reasoning: string;
  connectionMessage: string;
}

/**
 * Connection recommendation with topic intelligence
 */
export interface TopicAwareRecommendation {
  targetUserId: string;
  targetName: string;
  primaryApproach: string; // Main connection strategy
  topSteppingStones: TopicAwareSteppingStone[];
  sharedInterests: string[]; // Topics you AND target both engage with
  targetContentPreferences: string[]; // What target engages with
  personalizedMessage: string;
  confidence: number; // 0-1
}

/**
 * Calculate topic overlap between two users
 */
export function calculateTopicOverlap(
  user1Topics: ContentTopics,
  user2Topics: ContentTopics
): number {
  if (user1Topics.topics.length === 0 || user2Topics.topics.length === 0) {
    return 0;
  }

  const user1TopicNames = new Set(user1Topics.topics.map(t => t.name));
  const user2TopicNames = new Set(user2Topics.topics.map(t => t.name));

  const commonTopics = Array.from(user1TopicNames).filter(topic =>
    user2TopicNames.has(topic)
  );

  if (commonTopics.length === 0) {
    return 0;
  }

  // Calculate weighted overlap based on topic frequencies
  let totalOverlap = 0;
  for (const topic of commonTopics) {
    const user1Freq = user1Topics.topicFrequency.get(topic) || 0;
    const user2Freq = user2Topics.topicFrequency.get(topic) || 0;

    // Geometric mean of frequencies (emphasizes mutual interest)
    const overlap = Math.sqrt((user1Freq / 100) * (user2Freq / 100));
    totalOverlap += overlap;
  }

  // Normalize by number of potential common topics
  const maxPossibleTopics = Math.min(user1Topics.topics.length, user2Topics.topics.length);
  return Math.min(totalOverlap / maxPossibleTopics, 1);
}

/**
 * Rank stepping stones by topic relevance to target
 */
export function rankSteppingStonesByTopics(
  steppingStones: Array<{
    userId: string;
    userName: string;
    connectionDegree: number;
    activities: ActivityEvent[];
  }>,
  targetUserId: string,
  targetActivities: ActivityEvent[],
  _sourceActivities: ActivityEvent[], // Reserved for future use
  minTopicOverlap: number = 0.2
): TopicAwareSteppingStone[] {
  const targetTopics = analyzeUserTopics(targetUserId, targetActivities);
  const rankedStones: TopicAwareSteppingStone[] = [];

  for (const stone of steppingStones) {
    const stoneTopics = analyzeUserTopics(stone.userId, stone.activities);

    // Calculate topic overlap between stepping stone and target
    const topicOverlap = calculateTopicOverlap(stoneTopics, targetTopics);

    // Skip stepping stones with insufficient topic overlap
    if (topicOverlap < minTopicOverlap) {
      continue;
    }

    // Find shared topics
    const commonTopics = findCommonTopics(stoneTopics, targetTopics, 0.3);
    const sharedTopics = commonTopics.map(t => t.topic);

    // Calculate engagement strength
    const engagementStrength = calculateEngagementStrength(
      stone.activities,
      stone.userId,
      targetUserId
    ).strength;

    // Calculate overall recommendation score
    // Factors:
    // - Connection degree (40%): Closer = better
    // - Topic overlap (30%): More shared interests = better
    // - Engagement strength (30%): Stronger relationship = better

    const degreeScore = stone.connectionDegree === 1 ? 1.0 :
                        stone.connectionDegree === 2 ? 0.7 : 0.4;

    const recommendationScore =
      degreeScore * 0.4 +
      topicOverlap * 0.3 +
      engagementStrength * 0.3;

    // Generate reasoning
    const reasoning = generateSteppingStoneReasoning(
      stone,
      sharedTopics,
      topicOverlap,
      engagementStrength
    );

    // Generate personalized connection message
    const connectionMessage = generateConnectionMessage(
      stone.userName,
      sharedTopics,
      targetTopics
    );

    rankedStones.push({
      userId: stone.userId,
      userName: stone.userName,
      connectionDegree: stone.connectionDegree,
      engagementStrength,
      topicOverlap,
      sharedTopics,
      recommendationScore,
      reasoning,
      connectionMessage
    });
  }

  // Sort by recommendation score (highest first)
  rankedStones.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return rankedStones;
}

/**
 * Generate reasoning for stepping stone recommendation
 */
function generateSteppingStoneReasoning(
  stone: { userName: string; connectionDegree: number },
  sharedTopics: string[],
  topicOverlap: number,
  engagementStrength: number
): string {
  const parts: string[] = [];

  // Connection degree
  if (stone.connectionDegree === 1) {
    parts.push(`${stone.userName} is your 1st-degree connection`);
  } else if (stone.connectionDegree === 2) {
    parts.push(`${stone.userName} is your 2nd-degree connection`);
  } else {
    parts.push(`${stone.userName} is your 3rd-degree connection`);
  }

  // Shared topics
  if (sharedTopics.length > 0) {
    const topicList = sharedTopics.slice(0, 2).join(' and ');
    parts.push(`both discuss ${topicList}`);
  }

  // Engagement strength
  if (engagementStrength > 0.7) {
    parts.push(`strong engagement relationship`);
  } else if (engagementStrength > 0.4) {
    parts.push(`moderate engagement relationship`);
  }

  // Topic overlap quality
  if (topicOverlap > 0.6) {
    parts.push(`high topic alignment (${Math.round(topicOverlap * 100)}%)`);
  }

  return parts.join(', ');
}

/**
 * Generate personalized connection message template
 */
function generateConnectionMessage(
  steppingStoneName: string,
  sharedTopics: string[],
  targetTopics: ContentTopics
): string {
  if (sharedTopics.length === 0) {
    return `Hi! ${steppingStoneName} suggested I reach out. I'd love to connect and learn more about your work.`;
  }

  const primaryTopic = sharedTopics[0];
  const targetPrimaryTopic = targetTopics.primaryTopic || primaryTopic;

  // Generate context-aware message based on shared topics
  const topicContext = getTopicContext(primaryTopic);

  return `Hi! ${steppingStoneName} suggested I reach out. I noticed you both share an interest in ${primaryTopic}. ${topicContext} I'd love to connect and discuss ${targetPrimaryTopic} further.`;
}

/**
 * Get contextual message snippet for topic
 */
function getTopicContext(topic: string): string {
  const contexts: Record<string, string> = {
    'stoicism': "I'm also interested in stoic philosophy and its applications to modern life.",
    'sales': "I'm passionate about sales strategies and improving conversion rates.",
    'ai-ml': "I'm fascinated by AI and machine learning developments.",
    'marketing': "I'm interested in marketing strategies and growth tactics.",
    'leadership': "I value leadership principles and team development.",
    'entrepreneurship': "I'm passionate about entrepreneurship and building businesses.",
    'productivity': "I'm always looking to improve productivity and efficiency.",
    'fitness': "I'm committed to fitness and overall wellness.",
    'mindset': "I believe mindset is crucial to success.",
    'finance': "I'm interested in financial strategies and wealth building."
  };

  return contexts[topic] || `I share your interest in ${topic}.`;
}

/**
 * Generate comprehensive topic-aware recommendation
 */
export function generateTopicAwareRecommendation(
  sourceUserId: string,
  targetUserId: string,
  targetName: string,
  sourceActivities: ActivityEvent[],
  targetActivities: ActivityEvent[],
  steppingStones: Array<{
    userId: string;
    userName: string;
    connectionDegree: number;
    activities: ActivityEvent[];
  }>
): TopicAwareRecommendation {
  // Analyze topics
  const sourceTopics = analyzeUserTopics(sourceUserId, sourceActivities);
  const targetTopics = analyzeUserTopics(targetUserId, targetActivities);

  // Find shared interests
  const commonTopics = findCommonTopics(sourceTopics, targetTopics, 0.3);
  const sharedInterests = commonTopics.map(t => t.topic);

  // Get target's primary content preferences
  const targetContentPreferences = targetTopics.topics
    .slice(0, 3)
    .map(t => t.name);

  // Rank stepping stones by topic relevance
  const topSteppingStones = rankSteppingStonesByTopics(
    steppingStones,
    targetUserId,
    targetActivities,
    sourceActivities
  ).slice(0, 3); // Top 3

  // Determine primary approach
  let primaryApproach: string;
  let confidence: number;

  if (topSteppingStones.length > 0 && topSteppingStones[0].recommendationScore > 0.6) {
    const topStone = topSteppingStones[0];
    primaryApproach = `Connect via ${topStone.userName} (${topStone.sharedTopics.join(', ')} in common)`;
    confidence = topStone.recommendationScore;
  } else if (sharedInterests.length > 0) {
    primaryApproach = `Direct connection via shared interest in ${sharedInterests[0]}`;
    confidence = calculateTopicOverlap(sourceTopics, targetTopics);
  } else {
    primaryApproach = 'Cold outreach (no strong topic overlap)';
    confidence = 0.3;
  }

  // Generate personalized message
  const personalizedMessage = generatePersonalizedMessage(
    targetName,
    sharedInterests,
    targetTopics,
    topSteppingStones[0]
  );

  return {
    targetUserId,
    targetName,
    primaryApproach,
    topSteppingStones,
    sharedInterests,
    targetContentPreferences,
    personalizedMessage,
    confidence
  };
}

/**
 * Generate personalized outreach message
 */
function generatePersonalizedMessage(
  targetName: string,
  sharedInterests: string[],
  targetTopics: ContentTopics,
  topSteppingStone?: TopicAwareSteppingStone
): string {
  // With stepping stone and shared topics
  if (topSteppingStone && sharedInterests.length > 0) {
    const topic = sharedInterests[0];
    return `Hi ${targetName},\n\n${topSteppingStone.userName} suggested I reach out. I noticed you both share a passion for ${topic}. ${getTopicContext(topic)}\n\nI'd love to connect and exchange ideas about ${topic}.\n\nBest regards`;
  }

  // With shared topics (no stepping stone)
  if (sharedInterests.length > 0) {
    const topic = sharedInterests[0];
    return `Hi ${targetName},\n\nI came across your content on ${topic} and really appreciated your perspective. ${getTopicContext(topic)}\n\nWould love to connect and continue the conversation.\n\nBest regards`;
  }

  // With stepping stone (no shared topics)
  if (topSteppingStone) {
    const targetSummary = getTopicSummary(targetTopics, 1);
    return `Hi ${targetName},\n\n${topSteppingStone.userName} suggested I reach out. I've been following your insights on ${targetTopics.primaryTopic || 'your industry'}. ${targetSummary}\n\nI'd love to connect and learn from your perspective.\n\nBest regards`;
  }

  // Cold outreach (no stepping stone, no shared topics)
  return `Hi ${targetName},\n\nI came across your profile and was impressed by your work. I'd love to connect and learn more about what you do.\n\nBest regards`;
}

/**
 * Get connection strategy summary
 */
export function getConnectionStrategySummary(
  recommendation: TopicAwareRecommendation
): string {
  const parts: string[] = [];

  parts.push(`Strategy: ${recommendation.primaryApproach}`);
  parts.push(`Confidence: ${Math.round(recommendation.confidence * 100)}%`);

  if (recommendation.sharedInterests.length > 0) {
    parts.push(`Shared interests: ${recommendation.sharedInterests.join(', ')}`);
  }

  if (recommendation.topSteppingStones.length > 0) {
    const topStone = recommendation.topSteppingStones[0];
    parts.push(`Best stepping stone: ${topStone.userName} (${Math.round(topStone.recommendationScore * 100)}% match)`);
  }

  return parts.join(' | ');
}
