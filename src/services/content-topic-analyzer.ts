/**
 * Content Topic Analyzer
 * Analyzes engagement content to identify topics, keywords, and preferences
 *
 * Features:
 * - Keyword extraction from content
 * - Topic categorization (stoicism, sales, AI, etc.)
 * - Frequency analysis
 * - Confidence scoring
 */

import type { ActivityEvent } from '@/types/network';

/**
 * Topic with confidence and keywords
 */
export interface ContentTopic {
  name: string;
  confidence: number; // 0-1
  keywords: string[];
  count: number; // How many posts mention this topic
}

/**
 * Content topics analysis result
 */
export interface ContentTopics {
  topics: ContentTopic[];
  primaryTopic: string | null; // Most frequent topic
  topicFrequency: Map<string, number>; // topic -> percentage (0-100)
  totalActivities: number;
}

/**
 * Topic patterns with keywords for detection
 */
const TOPIC_PATTERNS: Record<string, {
  keywords: string[];
  aliases: string[];
}> = {
  'stoicism': {
    keywords: [
      'stoic', 'stoicism', 'marcus aurelius', 'seneca', 'epictetus',
      'virtue', 'discipline', 'temperance', 'wisdom', 'courage',
      'meditations', 'obstacle is the way', 'amor fati',
      'control what you can control', 'dichotomy of control'
    ],
    aliases: ['philosophy', 'ancient wisdom']
  },
  'sales': {
    keywords: [
      'sales', 'selling', 'close', 'closing', 'deal', 'deals',
      'prospect', 'prospecting', 'pipeline', 'quota', 'revenue',
      'objection', 'objections', 'negotiation', 'cold call',
      'outreach', 'follow-up', 'conversion', 'funnel'
    ],
    aliases: ['business development', 'revenue generation']
  },
  'marketing': {
    keywords: [
      'marketing', 'brand', 'branding', 'advertising', 'campaign',
      'seo', 'content marketing', 'social media', 'engagement',
      'audience', 'reach', 'impressions', 'ctr', 'roi',
      'growth hacking', 'viral', 'influencer', 'content strategy'
    ],
    aliases: ['digital marketing', 'growth']
  },
  'leadership': {
    keywords: [
      'leadership', 'leader', 'management', 'team', 'culture',
      'vision', 'mission', 'values', 'coaching', 'mentoring',
      'delegation', 'accountability', 'feedback', 'performance',
      'motivation', 'inspiration', 'servant leadership'
    ],
    aliases: ['management', 'team building']
  },
  'entrepreneurship': {
    keywords: [
      'startup', 'entrepreneur', 'entrepreneurship', 'founder',
      'business', 'venture', 'scale', 'scaling', 'growth',
      'hustle', 'grind', 'bootstrapped', 'funding', 'investor',
      'pivot', 'product-market fit', 'mvp'
    ],
    aliases: ['startups', 'business']
  },
  'ai-ml': {
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'ml',
      'deep learning', 'neural network', 'gpt', 'chatgpt',
      'llm', 'large language model', 'transformer', 'bert',
      'computer vision', 'nlp', 'natural language processing',
      'data science', 'algorithm', 'model training'
    ],
    aliases: ['artificial intelligence', 'technology', 'tech']
  },
  'productivity': {
    keywords: [
      'productivity', 'efficiency', 'time management', 'focus',
      'deep work', 'flow state', 'habits', 'routine', 'system',
      'automation', 'optimization', 'prioritization', 'gtd',
      'pomodoro', 'distraction', 'procrastination'
    ],
    aliases: ['efficiency', 'time management']
  },
  'fitness': {
    keywords: [
      'fitness', 'workout', 'exercise', 'gym', 'training',
      'muscle', 'strength', 'cardio', 'diet', 'nutrition',
      'health', 'wellness', 'bodybuilding', 'crossfit',
      'running', 'lifting', 'protein', 'macros'
    ],
    aliases: ['health', 'wellness', 'exercise']
  },
  'mindset': {
    keywords: [
      'mindset', 'growth mindset', 'mental', 'psychology',
      'belief', 'attitude', 'resilience', 'grit', 'perseverance',
      'positive thinking', 'self-belief', 'confidence',
      'mental toughness', 'mental health', 'awareness'
    ],
    aliases: ['psychology', 'mental strength']
  },
  'finance': {
    keywords: [
      'finance', 'investing', 'investment', 'stocks', 'portfolio',
      'wealth', 'money', 'compound interest', 'dividend',
      'crypto', 'cryptocurrency', 'real estate', 'roi',
      'financial freedom', 'passive income', 'assets'
    ],
    aliases: ['investing', 'wealth building']
  }
};

/**
 * Extract keywords from text content
 * Converts to lowercase and removes punctuation
 * (Currently unused but kept for potential future enhancements)
 */
export function extractKeywords(content: string): string[] {
  const normalized = content.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // Keep hyphens and apostrophes
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words and filter out common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'am', 'so', 'just', 'very', 'too', 'also'
  ]);

  const words = normalized.split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));

  return words;
}

/**
 * Detect topics from content using keyword matching
 */
function detectTopics(content: string): Map<string, { confidence: number; matchedKeywords: string[] }> {
  const normalizedContent = content.toLowerCase();
  const detectedTopics = new Map<string, { confidence: number; matchedKeywords: string[] }>();

  for (const [topicName, pattern] of Object.entries(TOPIC_PATTERNS)) {
    const matchedKeywords: string[] = [];
    let totalMatches = 0;

    // Check for keyword matches
    // Sort keywords by length (longest first) to match phrases before individual words
    const sortedKeywords = [...pattern.keywords].sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = normalizedContent.match(regex);
      if (matches) {
        matchedKeywords.push(keyword);
        totalMatches += matches.length;
      }
    }

    if (matchedKeywords.length > 0) {
      // Confidence based on:
      // - Number of unique keywords matched (30%)
      // - Total number of matches (40%)
      // - Keyword density in content (30%)
      const uniqueKeywordScore = matchedKeywords.length / pattern.keywords.length;
      const matchCountScore = Math.min(totalMatches / 5, 1); // Cap at 5 matches
      const densityScore = Math.min(totalMatches / (content.length / 100), 1); // Matches per 100 chars

      const confidence = (
        uniqueKeywordScore * 0.3 +
        matchCountScore * 0.4 +
        densityScore * 0.3
      );

      detectedTopics.set(topicName, {
        confidence: Math.min(confidence, 1),
        matchedKeywords
      });
    }
  }

  return detectedTopics;
}

/**
 * Analyze content topics from activity events
 */
export function analyzeContentTopics(activities: ActivityEvent[]): ContentTopics {
  const topicCounts = new Map<string, {
    count: number;
    totalConfidence: number;
    allKeywords: Set<string>;
  }>();

  let activitiesWithContent = 0;

  // Process each activity
  for (const activity of activities) {
    if (!activity.content || activity.content.trim().length === 0) {
      continue;
    }

    activitiesWithContent++;

    const detectedTopics = detectTopics(activity.content);

    for (const [topicName, { confidence, matchedKeywords }] of detectedTopics.entries()) {
      const existing = topicCounts.get(topicName);
      if (existing) {
        existing.count++;
        existing.totalConfidence += confidence;
        matchedKeywords.forEach(kw => existing.allKeywords.add(kw));
      } else {
        topicCounts.set(topicName, {
          count: 1,
          totalConfidence: confidence,
          allKeywords: new Set(matchedKeywords)
        });
      }
    }
  }

  // Build topics array
  const topics: ContentTopic[] = [];
  for (const [topicName, data] of topicCounts.entries()) {
    const avgConfidence = data.totalConfidence / data.count;
    topics.push({
      name: topicName,
      confidence: avgConfidence,
      keywords: Array.from(data.allKeywords),
      count: data.count
    });
  }

  // Sort by count (descending)
  topics.sort((a, b) => b.count - a.count);

  // Calculate topic frequency (percentage)
  const topicFrequency = new Map<string, number>();
  for (const topic of topics) {
    const percentage = activitiesWithContent > 0
      ? (topic.count / activitiesWithContent) * 100
      : 0;
    topicFrequency.set(topic.name, percentage);
  }

  // Determine primary topic (highest count)
  const primaryTopic = topics.length > 0 ? topics[0].name : null;

  return {
    topics,
    primaryTopic,
    topicFrequency,
    totalActivities: activitiesWithContent
  };
}

/**
 * Analyze content topics for a specific user from their activities
 * Filters activities to only those where user is the actor
 */
export function analyzeUserTopics(
  userId: string,
  activities: ActivityEvent[]
): ContentTopics {
  const userActivities = activities.filter(activity => activity.actorId === userId);
  return analyzeContentTopics(userActivities);
}

/**
 * Find common topics between two users
 */
export function findCommonTopics(
  user1Topics: ContentTopics,
  user2Topics: ContentTopics,
  minConfidence: number = 0.3
): Array<{
  topic: string;
  user1Frequency: number;
  user2Frequency: number;
  averageConfidence: number;
}> {
  const commonTopics: Array<{
    topic: string;
    user1Frequency: number;
    user2Frequency: number;
    averageConfidence: number;
  }> = [];

  // Find topics that appear in both users' profiles
  const user1TopicNames = new Set(
    user1Topics.topics
      .filter(t => t.confidence >= minConfidence)
      .map(t => t.name)
  );

  for (const topic of user2Topics.topics) {
    if (topic.confidence >= minConfidence && user1TopicNames.has(topic.name)) {
      const user1Topic = user1Topics.topics.find(t => t.name === topic.name)!;

      commonTopics.push({
        topic: topic.name,
        user1Frequency: user1Topics.topicFrequency.get(topic.name) || 0,
        user2Frequency: user2Topics.topicFrequency.get(topic.name) || 0,
        averageConfidence: (user1Topic.confidence + topic.confidence) / 2
      });
    }
  }

  // Sort by average frequency
  commonTopics.sort((a, b) => {
    const avgFreqA = (a.user1Frequency + a.user2Frequency) / 2;
    const avgFreqB = (b.user1Frequency + b.user2Frequency) / 2;
    return avgFreqB - avgFreqA;
  });

  return commonTopics;
}

/**
 * Get topic summary as human-readable string
 */
export function getTopicSummary(topics: ContentTopics, topN: number = 3): string {
  if (topics.topics.length === 0) {
    return 'No topics identified from activity';
  }

  const topTopics = topics.topics.slice(0, topN);
  const parts = topTopics.map(topic => {
    const frequency = topics.topicFrequency.get(topic.name) || 0;
    return `${topic.name} (${Math.round(frequency)}%)`;
  });

  return `Engages primarily with: ${parts.join(', ')}`;
}
