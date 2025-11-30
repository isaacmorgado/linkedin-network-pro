/**
 * POST /api/generate-message
 * Research-backed message generation using proven templates
 *
 * VERCEL SERVERLESS FUNCTION
 *
 * Core Logic:
 * 1. Analyze profiles comprehensively (education, skills, posts, engagement)
 * 2. Determine connection degree (1st, 2nd, 3rd, or none)
 * 3. Select research-backed template (CONNECTION_MESSAGE_RESEARCH.md)
 * 4. Personalize template with GPT-4 (don't create custom messages)
 * 5. Generate 2-3 alternatives with different angles
 * 6. Return with reasoning and research data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateMessageRequestSchema, type GenerateMessageResponse } from '../src/types/index.js';
import { generateMessageAlternatives } from '../src/services/openai.js';
import { successResponse, errorResponse } from '../src/middleware/validation.js';
import {
  selectMessageTemplate,
  analyzeSharedContext,
  generateTemplateReasoning,
} from '../src/services/message-templates.js';

/**
 * Main handler for generate-message endpoint
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json(
      errorResponse('METHOD_NOT_ALLOWED', 'Only POST requests are allowed', undefined, 405)
    );
    return;
  }

  try {
    // Validate request body
    const validation = GenerateMessageRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json(
        errorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          400
        )
      );
      return;
    }

    const { userId, targetProfile, sourceProfile, context, tone } = validation.data;

    console.log(
      `[GenerateMessage] User ${userId} generating message for ${targetProfile.name}`
    );

    // ========================================================================
    // STEP 1: Determine Connection Degree
    // ========================================================================

    const connectionDegree = determineConnectionDegree(targetProfile, context);
    console.log(`[GenerateMessage] Connection degree: ${connectionDegree}`);

    // ========================================================================
    // STEP 2: Analyze Shared Context
    // ========================================================================

    const sharedContext = analyzeSharedContext(
      sourceProfile,
      targetProfile,
      context.pathInfo?.path
    );

    console.log('[GenerateMessage] Shared context:', {
      school: sharedContext.school?.name,
      company: sharedContext.company?.name,
      skills: sharedContext.skills?.length,
      interests: sharedContext.interests?.length,
      mutualConnection: sharedContext.mutualConnection?.name,
    });

    // ========================================================================
    // STEP 3: Select Research-Backed Template
    // ========================================================================

    const templateSelection = selectMessageTemplate(connectionDegree, sharedContext);

    console.log(
      `[GenerateMessage] Selected template: ${templateSelection.primaryTemplate.name}`
    );
    console.log(
      `[GenerateMessage] Expected acceptance: ${templateSelection.primaryTemplate.expectedAcceptanceRate}`
    );

    // ========================================================================
    // STEP 4: Personalize Template with GPT-4
    // ========================================================================

    const personalizedMessages = await personalizeTemplate(
      templateSelection.primaryTemplate.template,
      sourceProfile,
      targetProfile,
      sharedContext,
      tone
    );

    console.log(`[GenerateMessage] Generated ${personalizedMessages.length} message variations`);

    // ========================================================================
    // STEP 5: Build Response with Reasoning
    // ========================================================================

    const reasoning = generateTemplateReasoning(
      templateSelection.primaryTemplate,
      sharedContext
    );

    // Add context-specific reasoning
    if (context.sharedContext && context.sharedContext.length > 0) {
      reasoning.push(`💡 Additional context: ${context.sharedContext.join(', ')}`);
    }

    const response: GenerateMessageResponse = {
      message: personalizedMessages[0]!,
      alternatives: personalizedMessages.slice(1),
      reasoning,
      characterCount: personalizedMessages[0]!.length,
    };

    // ========================================================================
    // STEP 6: Return Response
    // ========================================================================

    res.status(200).json(
      successResponse({
        ...response,
        metadata: {
          template: templateSelection.primaryTemplate.name,
          connectionDegree,
          expectedAcceptanceRate: templateSelection.primaryTemplate.expectedAcceptanceRate,
          researchBasis: templateSelection.primaryTemplate.researchNotes,
          sharedContext: {
            school: sharedContext.school?.name,
            company: sharedContext.company?.name,
            skills: sharedContext.skills,
            interests: sharedContext.interests,
            mutualConnection: sharedContext.mutualConnection?.name,
          },
        },
      })
    );
  } catch (error: any) {
    console.error('❌ Generate message error:', error);

    res.status(500).json(
      errorResponse(
        'MESSAGE_GENERATION_ERROR',
        'Failed to generate message',
        process.env.NODE_ENV === 'development' ? error.message : undefined,
        500
      )
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine connection degree from profile and context
 */
function determineConnectionDegree(
  targetProfile: any,
  context: any
): number | 'none' {
  // Check if degree is explicitly provided
  if (targetProfile.degree) {
    return targetProfile.degree;
  }

  // Check if path info provides degree
  if (context.pathInfo?.path) {
    const pathLength = context.pathInfo.path.length;
    if (pathLength === 2) return 1; // Direct connection
    if (pathLength === 3) return 2; // Through one intermediary
    if (pathLength === 4) return 3; // Through two intermediaries
  }

  // No direct path - requires stepping stones or cold outreach
  return 'none';
}

/**
 * Personalize template using GPT-4
 * IMPORTANT: GPT-4's job is to FILL IN the template, not create custom messages
 */
async function personalizeTemplate(
  template: string,
  sourceProfile: any,
  targetProfile: any,
  sharedContext: any,
  tone: string
): Promise<string[]> {
  // Build context for personalization
  const personalizationContext = buildPersonalizationContext(
    sourceProfile,
    targetProfile,
    sharedContext
  );

  const systemPrompt = `You are a professional networking assistant that personalizes LinkedIn connection messages.

IMPORTANT RULES:
1. Your job is to FILL IN the placeholders in the provided template
2. DO NOT change the template structure or create custom messages
3. Use ONLY the provided profile data for personalization
4. Keep the tone ${tone} but maintain the template's core structure
5. Replace [bracketed placeholders] with specific details
6. Ensure message stays under 250 characters for LinkedIn connection requests
7. Be specific and genuine - avoid generic phrases

Template Structure to Follow:
${template}

Available Data for Personalization:
${JSON.stringify(personalizationContext, null, 2)}

Generate ONE personalized version following the template structure exactly.
Only output the final message text, no explanations.`;

  const prompt = `Personalize the template with the provided data. Replace all [placeholders] with specific details. Keep it under 250 characters.`;

  try {
    const messages = await generateMessageAlternatives(prompt, 3, {
      systemPrompt,
      temperature: 0.8, // Higher temperature for variety
      maxTokens: 200,
    });

    // Filter out messages that are too long
    const validMessages = messages
      .map((msg) => msg.trim())
      .filter((msg) => msg.length <= 300 && msg.length >= 50);

    if (validMessages.length === 0) {
      throw new Error('No valid messages generated');
    }

    return validMessages;
  } catch (error) {
    console.error('Error personalizing template:', error);

    // Fallback: Return template with minimal personalization
    return [
      template
        .replace(/\[Name\]/g, targetProfile.name)
        .replace(/\[Your Name\]/g, sourceProfile.name || 'Me'),
    ];
  }
}

/**
 * Build context object for GPT-4 personalization
 */
function buildPersonalizationContext(
  sourceProfile: any,
  targetProfile: any,
  sharedContext: any
): any {
  const context: any = {
    target: {
      name: targetProfile.name,
      headline: targetProfile.headline,
      company: targetProfile.company,
      role: targetProfile.role,
      location: targetProfile.location,
    },
    source: {
      name: sourceProfile.name,
      headline: sourceProfile.headline,
      company: sourceProfile.company,
      role: sourceProfile.role,
    },
  };

  // Add shared context details
  if (sharedContext.school) {
    context.sharedSchool = {
      name: sharedContext.school.name,
      degree: sharedContext.school.degree,
      userYear: sharedContext.school.userYear,
      targetYear: sharedContext.school.targetYear,
    };
  }

  if (sharedContext.company) {
    context.sharedCompany = {
      name: sharedContext.company.name,
      type: sharedContext.company.type,
      userRole: sharedContext.company.userRole,
      targetRole: sharedContext.company.targetRole,
    };
  }

  if (sharedContext.skills && sharedContext.skills.length > 0) {
    context.sharedSkills = sharedContext.skills.slice(0, 5);
  }

  if (sharedContext.interests && sharedContext.interests.length > 0) {
    context.sharedInterests = sharedContext.interests.slice(0, 3);
  }

  if (sharedContext.mutualConnection) {
    context.mutualConnection = sharedContext.mutualConnection.name;
  }

  // Add recent activity for context
  if (targetProfile.recentPosts && targetProfile.recentPosts.length > 0) {
    context.target.recentActivity = targetProfile.recentPosts[0].content.substring(0, 100);
  }

  // Add engaged posts for engagement bridge
  if (targetProfile.engagedPosts && targetProfile.engagedPosts.length > 0) {
    context.target.engagedWith = targetProfile.engagedPosts
      .slice(0, 2)
      .map((post: any) => ({
        author: post.authorName,
        topic: post.topic.substring(0, 50),
      }));
  }

  return context;
}
