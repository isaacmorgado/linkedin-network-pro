/**
 * LinkedIn Message Generator
 *
 * Generates hyper-personalized LinkedIn connection messages using:
 * - Claude 3.5 Sonnet API
 * - Profile scraper data for deep personalization
 * - Connection path context
 * - Anti-hallucination constraints
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LinkedInProfile } from '../types';
import { log, LogCategory } from '../utils/logger';

export interface MessageGenerationContext {
  // Who is sending the message
  senderProfile: LinkedInProfile;

  // Who is receiving the message
  recipientProfile: LinkedInProfile;

  // Connection context
  isDirectConnection: boolean;
  mutualConnections?: LinkedInProfile[];
  degreeOfSeparation: number;

  // Optional context
  referralFrom?: LinkedInProfile; // If asking for introduction
  targetGoal?: string; // e.g., "job opportunity", "networking", "collaboration"
}

export interface GeneratedMessage {
  message: string;
  characterCount: number;
  personalizationPoints: string[]; // What was personalized
  confidence: number; // 0-1 (quality of personalization)
}

/**
 * Generate a hyper-personalized LinkedIn connection message
 *
 * @param context - Full context for message generation
 * @returns Generated message with metadata
 */
export async function generateLinkedInMessage(
  context: MessageGenerationContext
): Promise<GeneratedMessage> {
  const endTrace = log.trace(LogCategory.SERVICE, 'generateLinkedInMessage', {
    recipient: context.recipientProfile.name,
    degree: context.degreeOfSeparation,
  });

  try {
    log.info(LogCategory.SERVICE, 'Generating personalized LinkedIn message', {
      recipient: context.recipientProfile.name,
      isDirectConnection: context.isDirectConnection,
      hasMutualConnections: (context.mutualConnections?.length || 0) > 0,
    });

    // Initialize Anthropic client
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY environment variable not set');
    }

    const anthropic = new Anthropic({ apiKey });

    // Build the prompt with all context
    const prompt = buildMessagePrompt(context);

    log.debug(LogCategory.SERVICE, 'Sending request to Claude API');

    // Generate message with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.6, // Slightly higher for natural variation
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract personalization points
    const personalizationPoints = extractPersonalizationPoints(context);

    // Calculate confidence based on available data
    const confidence = calculateConfidence(context);

    const result: GeneratedMessage = {
      message: responseText.trim(),
      characterCount: responseText.trim().length,
      personalizationPoints,
      confidence,
    };

    log.info(LogCategory.SERVICE, 'Message generation complete', {
      characterCount: result.characterCount,
      confidence: result.confidence,
      personalizationPoints: result.personalizationPoints.length,
    });

    endTrace();
    return result;

  } catch (error) {
    log.error(LogCategory.SERVICE, 'Message generation failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Build the AI prompt with all context
 */
function buildMessagePrompt(context: MessageGenerationContext): string {
  const { senderProfile, recipientProfile, mutualConnections, degreeOfSeparation, referralFrom, targetGoal } = context;

  // Extract key commonalities
  const commonSkills = findCommonSkills(senderProfile, recipientProfile);
  const commonEducation = findCommonEducation(senderProfile, recipientProfile);
  const commonCompanies = findCommonCompanies(senderProfile, recipientProfile);
  const industryConnection = findIndustryConnection(senderProfile, recipientProfile);

  // Build context sections
  let contextSections = '';

  // Mutual connections
  if (mutualConnections && mutualConnections.length > 0) {
    const mutualNames = mutualConnections.slice(0, 3).filter(m => m && m.name).map(m => m.name).join(', ');
    contextSections += `\nMUTUAL CONNECTIONS: ${mutualNames}${mutualConnections.length > 3 ? ` and ${mutualConnections.length - 3} others` : ''}`;
  }

  // Common skills
  if (commonSkills.length > 0) {
    contextSections += `\nCOMMON SKILLS: ${commonSkills.slice(0, 3).join(', ')}`;
  }

  // Common education
  if (commonEducation.length > 0) {
    contextSections += `\nCOMMON EDUCATION: ${commonEducation.join(', ')}`;
  }

  // Common companies
  if (commonCompanies.length > 0) {
    contextSections += `\nCOMMON COMPANIES: ${commonCompanies.join(', ')}`;
  }

  // Industry connection
  if (industryConnection) {
    contextSections += `\nINDUSTRY CONNECTION: ${industryConnection}`;
  }

  // Recent activity (if available)
  if (recipientProfile.recentPosts && recipientProfile.recentPosts.length > 0) {
    const recentPost = recipientProfile.recentPosts[0];
    contextSections += `\nRECENT ACTIVITY: Recently posted about "${recentPost.content.substring(0, 100)}..."`;
  }

  const prompt = `You are writing a personalized LinkedIn connection request or introduction message.

STRICT RULES:
1. ONLY use information provided below - DO NOT invent details
2. Keep it under 300 characters for connection requests (LinkedIn limit)
3. For introduction requests, keep it under 1000 characters
4. Be genuine and specific - reference REAL commonalities
5. DO NOT use generic phrases like "I'd love to connect" or "expand my network"
6. DO NOT mention "mutual connections" unless there are specific names
7. Focus on ONE specific commonality or reason
8. End with a clear, soft call-to-action

YOUR PROFILE (SENDER):
- Name: ${senderProfile.name}
- Headline: ${senderProfile.headline || 'Professional'}
- Industry: ${senderProfile.industry || 'Not specified'}
- Current Role: ${senderProfile.experience?.[0]?.title || 'Not specified'}
- Location: ${senderProfile.location || 'Not specified'}

RECIPIENT PROFILE:
- Name: ${recipientProfile.name}
- Headline: ${recipientProfile.headline || 'Professional'}
- Industry: ${recipientProfile.industry || 'Not specified'}
- Current Role: ${recipientProfile.experience?.[0]?.title || 'Not specified'} at ${recipientProfile.experience?.[0]?.company || 'company'}
- Location: ${recipientProfile.location || 'Not specified'}
${contextSections}

${referralFrom ? `\nREFERRAL CONTEXT:\nAsking ${referralFrom.name} to introduce you to ${recipientProfile.name}` : ''}

${targetGoal ? `\nGOAL: ${targetGoal}` : ''}

MESSAGE TYPE: ${referralFrom ? 'Introduction request to mutual connection' : degreeOfSeparation === 1 ? 'Direct connection request' : 'Connection request with path context'}

Write ONLY the message text. Be conversational, specific, and authentic.

Begin:`;

  return prompt;
}

/**
 * Extract what was personalized in the message
 */
function extractPersonalizationPoints(context: MessageGenerationContext): string[] {
  const points: string[] = [];

  if (context.mutualConnections && context.mutualConnections.length > 0) {
    points.push(`${context.mutualConnections.length} mutual connection${context.mutualConnections.length > 1 ? 's' : ''}`);
  }

  const commonSkills = findCommonSkills(context.senderProfile, context.recipientProfile);
  if (commonSkills.length > 0) {
    points.push(`${commonSkills.length} shared skill${commonSkills.length > 1 ? 's' : ''}`);
  }

  const commonEducation = findCommonEducation(context.senderProfile, context.recipientProfile);
  if (commonEducation.length > 0) {
    points.push('Same school');
  }

  const commonCompanies = findCommonCompanies(context.senderProfile, context.recipientProfile);
  if (commonCompanies.length > 0) {
    points.push('Same company');
  }

  if (context.recipientProfile.industry && context.senderProfile.industry &&
      context.recipientProfile.industry === context.senderProfile.industry) {
    points.push('Same industry');
  }

  if (context.recipientProfile.recentPosts && context.recipientProfile.recentPosts.length > 0) {
    points.push('Recent activity');
  }

  return points;
}

/**
 * Calculate confidence in personalization quality
 */
function calculateConfidence(context: MessageGenerationContext): number {
  let confidence = 0.5; // Base confidence

  // Mutual connections boost
  if (context.mutualConnections && context.mutualConnections.length > 0) {
    confidence += 0.2;
  }

  // Common background boost
  const commonSkills = findCommonSkills(context.senderProfile, context.recipientProfile);
  const commonEducation = findCommonEducation(context.senderProfile, context.recipientProfile);
  const commonCompanies = findCommonCompanies(context.senderProfile, context.recipientProfile);

  if (commonEducation.length > 0) confidence += 0.15;
  if (commonCompanies.length > 0) confidence += 0.1;
  if (commonSkills.length >= 3) confidence += 0.05;

  // Recent activity boost
  if (context.recipientProfile.recentPosts && context.recipientProfile.recentPosts.length > 0) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

// Utility functions for finding commonalities
function findCommonSkills(profile1: LinkedInProfile, profile2: LinkedInProfile): string[] {
  const skills2 = new Set(profile2.skills.map(s => s.name.toLowerCase()));
  return profile1.skills.filter(s => skills2.has(s.name.toLowerCase())).map(s => s.name);
}

function findCommonEducation(profile1: LinkedInProfile, profile2: LinkedInProfile): string[] {
  const schools2 = new Set(profile2.education.map(e => e.school.toLowerCase()));
  return profile1.education
    .filter(e => schools2.has(e.school.toLowerCase()))
    .map(e => e.school);
}

function findCommonCompanies(profile1: LinkedInProfile, profile2: LinkedInProfile): string[] {
  const companies2 = new Set(profile2.experience.map(e => e.company.toLowerCase()));
  return profile1.experience
    .filter(e => companies2.has(e.company.toLowerCase()))
    .map(e => e.company);
}

function findIndustryConnection(profile1: LinkedInProfile, profile2: LinkedInProfile): string | null {
  if (!profile1.industry || !profile2.industry) return null;

  if (profile1.industry.toLowerCase() === profile2.industry.toLowerCase()) {
    return `Both in ${profile1.industry}`;
  }

  // Could add related industry logic here
  return null;
}
