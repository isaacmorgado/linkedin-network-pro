/**
 * Research-Backed Message Template Selector
 * Based on CONNECTION_MESSAGE_RESEARCH.md findings
 *
 * Core Logic:
 * 1. Analyze shared context (school, company, skills, engagement)
 * 2. Determine connection degree (1st, 2nd, 3rd, none)
 * 3. Select proven template based on research data
 * 4. Return template with expected acceptance rate
 */

export interface MessageTemplate {
  id: string;
  name: string;
  template: string;
  expectedAcceptanceRate: string;
  characterLimit: number;
  tone: 'professional' | 'casual' | 'warm' | 'peer';
  keyElements: string[];
  researchNotes: string;
}

export interface SharedContext {
  school?: {
    name: string;
    userYear?: number;
    targetYear?: number;
    degree?: string;
  };
  company?: {
    name: string;
    type: 'current' | 'former';
    userRole?: string;
    targetRole?: string;
  };
  skills?: string[];
  interests?: string[];
  engagementBridge?: {
    type: 'content' | 'endorsement' | 'mutual_endorsement';
    details: any;
  };
  mutualConnection?: {
    name: string;
    degree: number;
  };
}

export interface TemplateSelection {
  primaryTemplate: MessageTemplate;
  alternativeTemplates: MessageTemplate[];
  context: SharedContext;
  reasoning: string[];
}

/**
 * Select the best message template based on connection degree and shared context
 */
export function selectMessageTemplate(
  connectionDegree: number | 'none',
  sharedContext: SharedContext
): TemplateSelection {
  const templates: MessageTemplate[] = [];
  const reasoning: string[] = [];

  // ============================================================================
  // 1ST DEGREE CONNECTIONS (Already Connected)
  // ============================================================================

  if (connectionDegree === 1) {
    templates.push({
      id: '1st-degree-reengagement',
      name: '1st Degree Re-engagement',
      template: `Hi [Name],

I hope you've been well! I wanted to reach out because [specific reason].

Given your experience with [topic], I'd really value your perspective on [specific question]. Do you have 15 minutes for a quick call this week?

Thanks,
[Your Name]`,
      expectedAcceptanceRate: '15-25%',
      characterLimit: 300,
      tone: 'casual',
      keyElements: [
        'Reference previous interactions',
        'Specific question or ask',
        'Time-bound request (15 min)',
        'Casual but professional tone',
      ],
      researchNotes:
        '1st degree connections have direct messaging access. Response rate 15-25%. More conversational tone acceptable.',
    });

    reasoning.push('Already a 1st degree connection - can message directly');
    reasoning.push('Use conversational re-engagement approach');
  }

  // ============================================================================
  // 2ND DEGREE CONNECTIONS (Mutual Connection)
  // ============================================================================

  if (connectionDegree === 2 || sharedContext.mutualConnection) {
    templates.push({
      id: '2nd-degree-mutual',
      name: '2nd Degree via Mutual Connection',
      template: `Hi [Name],

I noticed we're both connected to [Mutual Contact Name]. [He/She] spoke highly of your work in [specific area]. I'm impressed by your approach to [specific topic], and I'd love to connect and learn from your experience.

[Optional: We both [shared context]]

Best,
[Your Name]`,
      expectedAcceptanceRate: '40-55%',
      characterLimit: 250,
      tone: 'professional',
      keyElements: [
        'Mention mutual connection name early',
        'Reference specific accomplishment',
        'Highlight genuine commonality',
        'Keep brief (under 250 chars)',
      ],
      researchNotes:
        '2nd degree with personalization achieves 20-55% acceptance. Mentioning mutual connection increases acceptance by 50%. 3x better than cold outreach.',
    });

    reasoning.push('2nd degree connection available (3x better than cold outreach)');
    reasoning.push('Mutual connection mention increases acceptance by 50%');
  }

  // ============================================================================
  // SHARED SCHOOL (Alumni Connection)
  // ============================================================================

  if (sharedContext.school) {
    templates.push({
      id: 'alumni-connection',
      name: 'Alumni Connection (Same School)',
      template: `Hi [Name], fellow [School] alum here! [Shared experience detail]. I'm impressed by your work on [specific achievement]. Would love to connect and exchange insights on [relevant topic].`,
      expectedAcceptanceRate: '45-60%',
      characterLimit: 250,
      tone: 'warm',
      keyElements: [
        'Graduation year',
        'Major/concentration',
        'Specific accomplishment',
        'Shared interest from university',
      ],
      researchNotes:
        'Alumni connections perform exceptionally well (45-60% acceptance). Strong built-in commonality and trust.',
    });

    reasoning.push(`Shared school: ${sharedContext.school.name} (45-60% acceptance rate)`);

    if (sharedContext.school.userYear && sharedContext.school.targetYear) {
      const yearDiff = Math.abs(sharedContext.school.userYear - sharedContext.school.targetYear);
      if (yearDiff <= 2) {
        reasoning.push('Graduated within 2 years - likely overlapped on campus');
      }
    }
  }

  // ============================================================================
  // SHARED COMPANY (Current or Former)
  // ============================================================================

  if (sharedContext.company) {
    if (sharedContext.company.type === 'current') {
      templates.push({
        id: 'same-company-current',
        name: 'Same Company (Current)',
        template: `Hello [Name], I noticed we both work at [Company]. I wanted to connect because [specific reason]. Would love to exchange insights about our experiences here!`,
        expectedAcceptanceRate: '50-65%',
        characterLimit: 250,
        tone: 'professional',
        keyElements: [
          'Reference specific project or initiative',
          'Suggest collaboration or knowledge sharing',
          'Keep it professional yet friendly',
        ],
        researchNotes:
          'Same company (current) achieves 50-65% acceptance. Shared organizational knowledge builds credibility.',
      });

      reasoning.push(`Both work at ${sharedContext.company.name} (50-65% acceptance)`);
    } else {
      templates.push({
        id: 'same-company-former',
        name: 'Same Company (Former)',
        template: `Hi [Name], I noticed we both worked at [Company]—I was there from [years]. Your current work at [current company] in [area] looks fascinating. Would love to connect and hear about your journey since leaving [Company]!`,
        expectedAcceptanceRate: '40-55%',
        characterLimit: 250,
        tone: 'warm',
        keyElements: [
          'Mention your tenure years',
          'Reference their current work',
          'Show interest in their journey',
        ],
        researchNotes:
          'Former company connections achieve 40-55% acceptance. +27% boost from shared employer.',
      });

      reasoning.push(`Both worked at ${sharedContext.company.name} (40-55% acceptance)`);
    }
  }

  // ============================================================================
  // SHARED PROFESSIONAL INTEREST/TOPIC
  // ============================================================================

  if (sharedContext.interests && sharedContext.interests.length > 0) {
    templates.push({
      id: 'shared-interest',
      name: 'Shared Professional Interest',
      template: `Hi [Name], I came across your work on [topic] and found your perspective on [specific point] really insightful. I'm working on [related challenge] and would love to connect and exchange ideas!`,
      expectedAcceptanceRate: '40-50%',
      characterLimit: 250,
      tone: 'peer',
      keyElements: [
        'Reference specific post or content',
        'Quote specific insight',
        'Explain shared challenge',
        'Suggest value exchange',
      ],
      researchNotes:
        'Shared interest approach achieves 40-50% acceptance. Works well when no direct commonality exists.',
    });

    reasoning.push(
      `Shared interests: ${sharedContext.interests.slice(0, 3).join(', ')} (40-50% acceptance)`
    );
  }

  // ============================================================================
  // ENGAGED WITH SAME CONTENT (Engagement Bridge)
  // ============================================================================

  if (sharedContext.engagementBridge?.type === 'content') {
    templates.push({
      id: 'engagement-bridge',
      name: 'Engaged with Same Content',
      template: `Hi [Name], I noticed we both engaged with [thought leader's] recent post about [topic]. Your perspective on [point] was great. Would love to connect and continue the conversation!`,
      expectedAcceptanceRate: '45-55%',
      characterLimit: 250,
      tone: 'peer',
      keyElements: [
        'Reference the specific post',
        'Quote their comment',
        'Show you read their perspective',
        'Natural conversation continuation',
      ],
      researchNotes:
        'Engagement bridge achieves 45-55% acceptance. Proves shared content consumption and interests.',
    });

    reasoning.push('Engagement bridge found - both engaged with same content (45-55% acceptance)');
  }

  // ============================================================================
  // SKILL/ENDORSEMENT OVERLAP
  // ============================================================================

  if (sharedContext.skills && sharedContext.skills.length >= 2) {
    templates.push({
      id: 'skill-overlap',
      name: 'Skill/Expertise Overlap',
      template: `Hi [Name], I noticed we both have deep expertise in [specific skill]. I'm impressed by your work at [company/project], and would love to connect with someone at your level in this space.`,
      expectedAcceptanceRate: '40-55%',
      characterLimit: 250,
      tone: 'professional',
      keyElements: [
        'Name the specific skill/domain',
        'Reference their accomplishments',
        'Mention how you learned from them',
        'Peer-level collaboration',
      ],
      researchNotes:
        'Skill overlap achieves 40-55% acceptance. Recognition of expertise resonates well.',
    });

    reasoning.push(`Shared skills: ${sharedContext.skills.slice(0, 3).join(', ')} (40-55% acceptance)`);
  }

  // ============================================================================
  // COLD OUTREACH (3rd Degree or No Connection)
  // ============================================================================

  if ((connectionDegree === 3 || connectionDegree === 'none') && templates.length === 0) {
    templates.push({
      id: '3rd-degree-cold',
      name: '3rd Degree Cold Outreach',
      template: `Hi [Name],

I came across your article on [specific topic] and found your perspective on [specific point] really valuable. I'm currently working on [related project], and your insight about [detail] resonated with me.

I'd love to connect with someone with your expertise in [area]. Would be great to stay in touch!

Best,
[Your Name]`,
      expectedAcceptanceRate: '25-40%',
      characterLimit: 300,
      tone: 'professional',
      keyElements: [
        'Reference specific content they created',
        'Quote specific insight',
        'Show genuine interest (not salesy)',
        'Consider engaging with content first',
      ],
      researchNotes:
        '3rd degree requires exceptional personalization (25-40% acceptance). Consider finding 2nd-degree path instead (3x better results).',
    });

    reasoning.push('No direct path - requires cold outreach (25-40% acceptance)');
    reasoning.push('Recommendation: Find 2nd-degree path for 3x better results');
  }

  // ============================================================================
  // TEMPLATE SELECTION LOGIC
  // ============================================================================

  // Sort templates by expected acceptance rate (descending)
  const sortedTemplates = templates.sort((a, b) => {
    const rateA = parseInt(a.expectedAcceptanceRate.split('-')[1]!) || 0;
    const rateB = parseInt(b.expectedAcceptanceRate.split('-')[1]!) || 0;
    return rateB - rateA;
  });

  return {
    primaryTemplate: sortedTemplates[0]!,
    alternativeTemplates: sortedTemplates.slice(1, 3),
    context: sharedContext,
    reasoning,
  };
}

/**
 * Analyze profiles and extract shared context
 */
export function analyzeSharedContext(
  sourceProfile: any,
  targetProfile: any,
  mutualConnections?: any[]
): SharedContext {
  const context: SharedContext = {};

  // School overlap
  if (sourceProfile.education && targetProfile.education) {
    const sharedSchools = sourceProfile.education.filter((sourceEdu: any) =>
      targetProfile.education.some(
        (targetEdu: any) => targetEdu.school?.toLowerCase() === sourceEdu.school?.toLowerCase()
      )
    );

    if (sharedSchools.length > 0) {
      const school = sharedSchools[0];
      context.school = {
        name: school.school,
        userYear: school.endYear,
        targetYear: targetProfile.education.find(
          (e: any) => e.school?.toLowerCase() === school.school?.toLowerCase()
        )?.endYear,
        degree: school.degree,
      };
    }
  }

  // Company overlap
  if (sourceProfile.experience && targetProfile.experience) {
    // Check current company
    const sourceCurrentCompany = sourceProfile.experience[0]?.company;
    const targetCurrentCompany = targetProfile.experience[0]?.company;

    if (
      sourceCurrentCompany &&
      targetCurrentCompany &&
      sourceCurrentCompany.toLowerCase() === targetCurrentCompany.toLowerCase()
    ) {
      context.company = {
        name: sourceCurrentCompany,
        type: 'current',
        userRole: sourceProfile.experience[0]?.role,
        targetRole: targetProfile.experience[0]?.role,
      };
    } else {
      // Check former companies
      const sharedCompanies = sourceProfile.experience.filter((sourceExp: any) =>
        targetProfile.experience.some(
          (targetExp: any) => targetExp.company?.toLowerCase() === sourceExp.company?.toLowerCase()
        )
      );

      if (sharedCompanies.length > 0) {
        context.company = {
          name: sharedCompanies[0].company,
          type: 'former',
          userRole: sharedCompanies[0].role,
        };
      }
    }
  }

  // Skill overlap
  if (sourceProfile.skills && targetProfile.skills) {
    const sourceSkillNames = sourceProfile.skills.map((s: any) =>
      typeof s === 'string' ? s : s.name
    );
    const targetSkillNames = targetProfile.skills.map((s: any) =>
      typeof s === 'string' ? s : s.name
    );

    const sharedSkills = sourceSkillNames.filter((skill: string) =>
      targetSkillNames.some((tSkill: string) => tSkill.toLowerCase() === skill.toLowerCase())
    );

    if (sharedSkills.length >= 2) {
      context.skills = sharedSkills.slice(0, 5);
    }
  }

  // Interests overlap (from industry, headline, or engagement topics)
  const sourceInterests = extractInterests(sourceProfile);
  const targetInterests = extractInterests(targetProfile);

  const sharedInterests = sourceInterests.filter((interest) =>
    targetInterests.includes(interest)
  );

  if (sharedInterests.length > 0) {
    context.interests = sharedInterests.slice(0, 3);
  }

  // Mutual connection
  if (mutualConnections && mutualConnections.length > 0) {
    context.mutualConnection = {
      name: mutualConnections[0].name,
      degree: mutualConnections[0].degree || 1,
    };
  }

  return context;
}

/**
 * Extract interests from profile data
 */
function extractInterests(profile: any): string[] {
  const interests: Set<string> = new Set();

  // From industry
  if (profile.industry) {
    interests.add(profile.industry);
  }

  // From headline (extract keywords)
  if (profile.headline) {
    const keywords = extractKeywordsFromText(profile.headline);
    keywords.forEach((kw) => interests.add(kw));
  }

  // From recent posts topics
  if (profile.recentPosts) {
    profile.recentPosts.forEach((post: any) => {
      const keywords = extractKeywordsFromText(post.content);
      keywords.slice(0, 2).forEach((kw: string) => interests.add(kw));
    });
  }

  // From engaged posts topics
  if (profile.engagedPosts) {
    profile.engagedPosts.forEach((post: any) => {
      const keywords = extractKeywordsFromText(post.topic);
      keywords.slice(0, 1).forEach((kw: string) => interests.add(kw));
    });
  }

  return Array.from(interests).slice(0, 10);
}

/**
 * Extract keywords from text (simple implementation)
 */
function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];

  // Simple keyword extraction - can be enhanced with NLP
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'about',
    'as',
    'is',
    'was',
    'are',
    'were',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Return unique words
  return [...new Set(words)].slice(0, 10);
}

/**
 * Generate research-backed reasoning for template selection
 */
export function generateTemplateReasoning(
  template: MessageTemplate,
  context: SharedContext
): string[] {
  const reasoning: string[] = [];

  reasoning.push(`Selected template: ${template.name}`);
  reasoning.push(`Expected acceptance rate: ${template.expectedAcceptanceRate}`);

  if (context.school) {
    reasoning.push(`✅ Alumni advantage: ${context.school.name}`);
  }

  if (context.company) {
    reasoning.push(
      `✅ Company connection: ${context.company.name} (${context.company.type})`
    );
  }

  if (context.skills && context.skills.length > 0) {
    reasoning.push(`✅ Shared skills: ${context.skills.slice(0, 3).join(', ')}`);
  }

  if (context.mutualConnection) {
    reasoning.push(
      `✅ Mutual connection: ${context.mutualConnection.name} (increases acceptance by 50%)`
    );
  }

  reasoning.push(
    `📊 Research basis: ${template.researchNotes.split('.')[0]}`
  );

  return reasoning;
}
