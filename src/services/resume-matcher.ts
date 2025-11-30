/**
 * Semantic Skill Matching Engine
 * Matches user experience to job requirements WITHOUT hallucination
 *
 * Core Philosophy: FIND matches in existing experience, don't create fake experience
 */

import type {
  UserProfile,
  JobRequirements,
  MatchReport,
  Match,
  Recommendation,
  Achievement,
} from '../types/resume-tailoring';
import type { ExtractedKeyword } from '../types/resume';
import { log, LogCategory } from '../utils/logger';
import { skillsDatabase } from '../types/skills';

/**
 * Match types with confidence levels:
 * - Direct: User has exact skill (Python == Python) - confidence: 1.0
 * - Semantic: User has similar skill using keywords - confidence: 0.7-0.9
 * - Transferable: Career changer mapping (teaching → communication) - confidence: 0.5-0.7
 * - Inferred: If they know React, they know JavaScript - confidence: 0.6-0.8
 */

/**
 * Transferable skills mapping for career changers
 * Maps skills from one domain to another (e.g., teaching → tech)
 */
const TRANSFERABLE_SKILLS_MAP: Record<string, string[]> = {
  // Teaching → Tech
  'teaching': ['communication', 'presentation', 'mentoring', 'documentation', 'training'],
  'classroom management': ['project management', 'coordination', 'organization', 'time management'],
  'curriculum development': ['planning', 'strategy', 'content creation', 'documentation'],

  // Sales → Tech
  'sales': ['communication', 'negotiation', 'presentation', 'client relations', 'business development'],
  'account management': ['client relations', 'project management', 'stakeholder management'],
  'cold calling': ['outreach', 'communication', 'persistence', 'networking'],

  // Management → Tech
  'team leadership': ['leadership', 'mentoring', 'people management', 'coaching'],
  'budget management': ['resource planning', 'financial planning', 'prioritization'],
  'strategic planning': ['strategy', 'planning', 'vision', 'roadmap planning'],

  // Customer Service → Tech
  'customer service': ['communication', 'problem solving', 'empathy', 'support'],
  'technical support': ['troubleshooting', 'problem solving', 'documentation', 'customer success'],
  'call center': ['communication', 'efficiency', 'problem solving', 'multitasking'],

  // Military → Tech
  'military': ['leadership', 'discipline', 'teamwork', 'process adherence', 'training'],
  'military leadership': ['leadership', 'decision making', 'crisis management', 'team coordination'],
};

/**
 * Skill inference rules
 * If user knows X, they likely know Y
 */
const SKILL_INFERENCE_MAP: Record<string, string[]> = {
  // Frontend frameworks → languages
  'react': ['javascript', 'html', 'css', 'jsx'],
  'vue': ['javascript', 'html', 'css'],
  'angular': ['typescript', 'javascript', 'html', 'css'],
  'svelte': ['javascript', 'html', 'css'],

  // Backend frameworks → languages
  'django': ['python'],
  'flask': ['python'],
  'fastapi': ['python'],
  'express': ['javascript', 'node.js'],
  'spring': ['java'],
  'rails': ['ruby'],

  // Mobile frameworks → languages
  'react native': ['javascript', 'react'],
  'flutter': ['dart'],
  'swift ui': ['swift'],
  'jetpack compose': ['kotlin'],

  // Testing frameworks → languages
  'jest': ['javascript'],
  'pytest': ['python'],
  'junit': ['java'],
  'rspec': ['ruby'],

  // Tools → concepts
  'git': ['version control'],
  'docker': ['containerization', 'devops'],
  'kubernetes': ['container orchestration', 'devops', 'docker'],
  'jenkins': ['ci/cd', 'automation', 'devops'],
  'terraform': ['infrastructure as code', 'devops', 'cloud'],

  // Cloud platforms → skills
  'aws': ['cloud computing', 'devops'],
  'azure': ['cloud computing', 'devops'],
  'gcp': ['cloud computing', 'devops'],

  // Databases → concepts
  'postgresql': ['sql', 'database', 'relational database'],
  'mysql': ['sql', 'database', 'relational database'],
  'mongodb': ['nosql', 'database'],
  'redis': ['caching', 'nosql'],
};

/**
 * Main matching function
 * Analyzes user profile against job requirements and generates detailed match report
 *
 * @param profile - User's professional profile with all experience
 * @param requirements - Extracted job requirements
 * @returns Detailed match report with findings and recommendations
 */
export function matchUserToJob(profile: UserProfile, requirements: JobRequirements): MatchReport {
  const endTrace = log.trace(LogCategory.SERVICE, 'matchUserToJob', {
    profileSkills: profile.skills.length,
    profileExperiences: profile.workExperience.length,
    requiredSkills: requirements.required.length,
    preferredSkills: requirements.preferred.length,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting semantic skill matching', {
      userName: profile.name,
      userTitle: profile.title,
      totalRequirements: requirements.required.length + requirements.preferred.length,
      seniority: profile.metadata.seniority,
      careerStage: profile.metadata.careerStage,
    });

    // Collect all user skills from various sources
    const userSkills = collectUserSkills(profile);
    log.debug(LogCategory.SERVICE, 'Collected user skills', {
      totalSkills: userSkills.size,
      explicitSkills: profile.skills.length,
      skills: Array.from(userSkills).slice(0, 20),
    });

    // Match required skills
    const requiredMatches = matchRequirements(
      requirements.required,
      profile,
      userSkills,
      true
    );

    // Match preferred skills
    const preferredMatches = matchRequirements(
      requirements.preferred,
      profile,
      userSkills,
      false
    );

    // Combine all matches
    const allMatches = [...requiredMatches, ...preferredMatches];

    // Categorize matches by type
    const directMatches = allMatches.filter(m => m.matchType === 'direct');
    const semanticMatches = allMatches.filter(m => m.matchType === 'semantic');
    const transferableMatches = allMatches.filter(m => m.matchType === 'transferable');
    const inferredMatches = allMatches.filter(m => m.matchType === 'inferred');

    log.info(LogCategory.SERVICE, 'Matches categorized', {
      direct: directMatches.length,
      semantic: semanticMatches.length,
      transferable: transferableMatches.length,
      inferred: inferredMatches.length,
    });

    // Find missing requirements
    const matchedRequirements = new Set(allMatches.map(m => m.requirement.phrase.toLowerCase()));
    const missingRequired = requirements.required.filter(
      req => !matchedRequirements.has(req.phrase.toLowerCase())
    );
    const missingPreferred = requirements.preferred.filter(
      req => !matchedRequirements.has(req.phrase.toLowerCase())
    );
    const missing = [...missingRequired, ...missingPreferred];

    log.info(LogCategory.SERVICE, 'Missing requirements identified', {
      missingRequired: missingRequired.length,
      missingPreferred: missingPreferred.length,
      criticalMissing: missingRequired.filter(r => r.required).map(r => r.phrase),
    });

    // Calculate match score
    const matchScore = calculateMatchScore(
      requirements.required.length,
      requirements.preferred.length,
      requiredMatches.length,
      preferredMatches.length
    );

    log.info(LogCategory.SERVICE, 'Match score calculated', {
      matchScore,
      requiredCoverage: (requiredMatches.length / requirements.required.length * 100).toFixed(1) + '%',
      preferredCoverage: requirements.preferred.length > 0
        ? (preferredMatches.length / requirements.preferred.length * 100).toFixed(1) + '%'
        : 'N/A',
    });

    // Generate recommendations
    const recommendations = generateRecommendations(
      profile,
      missing,
      allMatches,
      matchScore
    );

    log.info(LogCategory.SERVICE, 'Recommendations generated', {
      total: recommendations.length,
      high: recommendations.filter(r => r.priority === 'high').length,
      medium: recommendations.filter(r => r.priority === 'medium').length,
      low: recommendations.filter(r => r.priority === 'low').length,
    });

    const report: MatchReport = {
      matches: allMatches,
      missing,
      matchScore,
      recommendations,
      directMatches,
      semanticMatches,
      transferableMatches,
      inferredMatches,
    };

    log.info(LogCategory.SERVICE, 'Semantic skill matching completed', {
      matchScore,
      totalMatches: allMatches.length,
      missingCount: missing.length,
      recommendationCount: recommendations.length,
    });

    endTrace();
    return report;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Semantic skill matching failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Collect all skills user has from their profile
 * Includes explicit skills, skills from experience, projects, etc.
 */
function collectUserSkills(profile: UserProfile): Set<string> {
  const skills = new Set<string>();

  // Explicit skills
  profile.skills.forEach(skill => {
    if (skill && skill.name) {
      skills.add(skill.name.toLowerCase());
    }
  });

  // Skills from work experience
  profile.workExperience.forEach(exp => {
    exp.skills.forEach(skill => skills.add(skill.toLowerCase()));

    // Extract skills from achievements
    exp.achievements.forEach(achievement => {
      achievement.skills.forEach(skill => skills.add(skill.toLowerCase()));
      achievement.keywords.forEach(keyword => skills.add(keyword.toLowerCase()));
      achievement.transferableSkills.forEach(skill => skills.add(skill.toLowerCase()));
    });
  });

  // Skills from projects
  profile.projects.forEach(project => {
    project.skills.forEach(skill => skills.add(skill.toLowerCase()));

    project.achievements.forEach(achievement => {
      achievement.skills.forEach(skill => skills.add(skill.toLowerCase()));
      achievement.keywords.forEach(keyword => skills.add(keyword.toLowerCase()));
    });
  });

  // Skills from volunteer work
  if (profile.volunteer) {
    profile.volunteer.forEach(vol => {
      vol.skills.forEach(skill => skills.add(skill.toLowerCase()));

      vol.achievements.forEach(achievement => {
        achievement.skills.forEach(skill => skills.add(skill.toLowerCase()));
      });
    });
  }

  // Skills from education
  profile.education.forEach(edu => {
    if (edu.relevantCourses) {
      edu.relevantCourses.forEach(course => skills.add(course.toLowerCase()));
    }
  });

  return skills;
}

/**
 * Match job requirements against user profile
 */
function matchRequirements(
  requirements: ExtractedKeyword[],
  profile: UserProfile,
  userSkills: Set<string>,
  isRequired: boolean
): Match[] {
  const matches: Match[] = [];

  for (const requirement of requirements) {
    const match = findMatchForRequirement(requirement, profile, userSkills);

    if (match) {
      matches.push(match);

      log.debug(LogCategory.SERVICE, `Match found for "${requirement.phrase}"`, {
        type: match.matchType,
        confidence: match.confidence,
        evidence: match.userEvidence.length,
        required: isRequired,
      });
    } else {
      log.debug(LogCategory.SERVICE, `No match found for "${requirement.phrase}"`, {
        required: isRequired,
      });
    }
  }

  return matches;
}

/**
 * Find match for a single requirement
 * Tries multiple matching strategies in order of confidence
 */
function findMatchForRequirement(
  requirement: ExtractedKeyword,
  profile: UserProfile,
  userSkills: Set<string>
): Match | null {

  // LEVEL 1: Direct match - User has exact skill
  const directMatch = findDirectMatch(requirement, profile, userSkills);
  if (directMatch) return directMatch;

  // LEVEL 2: Semantic match - User has similar/related skill
  const semanticMatch = findSemanticMatch(requirement, profile, userSkills);
  if (semanticMatch) return semanticMatch;

  // LEVEL 3: Transferable match - Career changer skill mapping
  const transferableMatch = findTransferableMatch(requirement, profile, userSkills);
  if (transferableMatch) return transferableMatch;

  // LEVEL 4: Inferred match - Skill implied by other skills
  const inferredMatch = findInferredMatch(requirement, profile, userSkills);
  if (inferredMatch) return inferredMatch;

  // No match found
  return null;
}

/**
 * LEVEL 1: Direct match - exact skill match
 */
function findDirectMatch(
  requirement: ExtractedKeyword,
  profile: UserProfile,
  userSkills: Set<string>
): Match | null {
  const reqLower = requirement.phrase.toLowerCase();

  // Check exact match
  if (userSkills.has(reqLower)) {
    const evidence = findEvidenceForSkill(requirement.phrase, profile);

    if (evidence.length > 0) {
      return {
        requirement,
        userEvidence: evidence,
        matchType: 'direct',
        confidence: 1.0,
        explanation: `Direct match: User explicitly lists "${requirement.phrase}" as a skill with ${evidence.length} concrete examples`,
      };
    }
  }

  // Check synonyms using skills database
  const skillMatch = skillsDatabase.findSkill(reqLower);
  if (skillMatch) {
    for (const synonym of skillMatch.synonyms || []) {
      if (userSkills.has(synonym.toLowerCase())) {
        const evidence = findEvidenceForSkill(synonym, profile);

        if (evidence.length > 0) {
          return {
            requirement,
            userEvidence: evidence,
            matchType: 'direct',
            confidence: 0.95,
            explanation: `Direct match via synonym: User has "${synonym}" which matches "${requirement.phrase}"`,
          };
        }
      }
    }
  }

  // Check requirement synonyms
  if (requirement.synonyms) {
    for (const synonym of requirement.synonyms) {
      if (userSkills.has(synonym.toLowerCase())) {
        const evidence = findEvidenceForSkill(synonym, profile);

        if (evidence.length > 0) {
          return {
            requirement,
            userEvidence: evidence,
            matchType: 'direct',
            confidence: 0.95,
            explanation: `Direct match via synonym: User has "${synonym}" which matches "${requirement.phrase}"`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * LEVEL 2: Semantic match - similar skills using keyword similarity
 */
function findSemanticMatch(
  requirement: ExtractedKeyword,
  profile: UserProfile,
  userSkills: Set<string>
): Match | null {
  const reqLower = requirement.phrase.toLowerCase();
  const reqWords = tokenizeSkill(reqLower);

  // Find skills with overlapping keywords
  const similarSkills: Array<{ skill: string; similarity: number }> = [];

  for (const userSkill of Array.from(userSkills)) {
    const userWords = tokenizeSkill(userSkill);
    const similarity = calculateWordSimilarity(reqWords, userWords);

    if (similarity >= 0.5) {
      similarSkills.push({ skill: userSkill, similarity });
    }
  }

  // Sort by similarity
  similarSkills.sort((a, b) => b.similarity - a.similarity);

  // Take best match
  if (similarSkills.length > 0) {
    const bestMatch = similarSkills[0];
    const evidence = findEvidenceForSkill(bestMatch.skill, profile);

    if (evidence.length > 0) {
      const confidence = 0.7 + (bestMatch.similarity * 0.2); // 0.7-0.9

      return {
        requirement,
        userEvidence: evidence,
        matchType: 'semantic',
        confidence,
        explanation: `Semantic match: User has "${bestMatch.skill}" which is related to "${requirement.phrase}" (${(bestMatch.similarity * 100).toFixed(0)}% similar)`,
      };
    }
  }

  return null;
}

/**
 * LEVEL 3: Transferable match - career changer skills
 */
function findTransferableMatch(
  requirement: ExtractedKeyword,
  profile: UserProfile,
  userSkills: Set<string>
): Match | null {
  const reqLower = requirement.phrase.toLowerCase();

  // Check if any user skills map to this requirement via transferable skills
  for (const [sourceSkill, targetSkills] of Object.entries(TRANSFERABLE_SKILLS_MAP)) {
    if (userSkills.has(sourceSkill)) {
      // Check if this requirement is in the target skills
      const isTransferable = targetSkills.some(target =>
        target === reqLower || reqLower.includes(target) || target.includes(reqLower)
      );

      if (isTransferable) {
        const evidence = findEvidenceForSkill(sourceSkill, profile);

        if (evidence.length > 0) {
          return {
            requirement,
            userEvidence: evidence,
            matchType: 'transferable',
            confidence: 0.6,
            explanation: `Transferable skill: User's "${sourceSkill}" experience demonstrates "${requirement.phrase}" (career changer strength)`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * LEVEL 4: Inferred match - skill implied by other skills
 */
function findInferredMatch(
  requirement: ExtractedKeyword,
  profile: UserProfile,
  userSkills: Set<string>
): Match | null {
  const reqLower = requirement.phrase.toLowerCase();

  // Check if user has a skill that implies this requirement
  for (const [parentSkill, impliedSkills] of Object.entries(SKILL_INFERENCE_MAP)) {
    if (userSkills.has(parentSkill)) {
      // Check if this requirement is implied
      const isImplied = impliedSkills.some(implied =>
        implied === reqLower || reqLower.includes(implied) || implied.includes(reqLower)
      );

      if (isImplied) {
        const evidence = findEvidenceForSkill(parentSkill, profile);

        if (evidence.length > 0) {
          return {
            requirement,
            userEvidence: evidence,
            matchType: 'inferred',
            confidence: 0.7,
            explanation: `Inferred skill: Since user knows "${parentSkill}", they likely know "${requirement.phrase}"`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find concrete evidence (achievements) for a skill in user's profile
 */
function findEvidenceForSkill(skillName: string, profile: UserProfile): Achievement[] {
  const evidence: Achievement[] = [];
  const skillLower = skillName.toLowerCase();

  // Search work experience
  for (const exp of profile.workExperience) {
    // Check if skill is in experience skills list
    const hasSkill = exp.skills.some(s => s.toLowerCase() === skillLower);

    if (hasSkill) {
      // Include relevant achievements
      for (const achievement of exp.achievements) {
        const isRelevant =
          achievement.skills.some(s => s.toLowerCase() === skillLower) ||
          achievement.keywords.some(k => k.toLowerCase() === skillLower);

        if (isRelevant) {
          evidence.push(achievement);
        }
      }
    }
  }

  // Search projects
  for (const project of profile.projects) {
    const hasSkill = project.skills.some(s => s.toLowerCase() === skillLower);

    if (hasSkill) {
      for (const achievement of project.achievements) {
        const isRelevant =
          achievement.skills.some(s => s.toLowerCase() === skillLower) ||
          achievement.keywords.some(k => k.toLowerCase() === skillLower);

        if (isRelevant) {
          evidence.push(achievement);
        }
      }
    }
  }

  // Search volunteer work
  if (profile.volunteer) {
    for (const vol of profile.volunteer) {
      const hasSkill = vol.skills.some(s => s.toLowerCase() === skillLower);

      if (hasSkill) {
        for (const achievement of vol.achievements) {
          evidence.push(achievement);
        }
      }
    }
  }

  return evidence;
}

/**
 * Tokenize a skill name into words for comparison
 */
function tokenizeSkill(skill: string): Set<string> {
  // Remove common separators and split
  const words = skill
    .toLowerCase()
    .replace(/[.\-_/]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out short words

  return new Set(words);
}

/**
 * Calculate word-level similarity between two skills
 * Returns 0-1 score based on overlapping words
 */
function calculateWordSimilarity(words1: Set<string>, words2: Set<string>): number {
  if (words1.size === 0 || words2.size === 0) return 0;

  // Count overlapping words
  let overlap = 0;
  for (const word of Array.from(words1)) {
    if (words2.has(word)) {
      overlap++;
    }
  }

  // Jaccard similarity: intersection / union
  const union = words1.size + words2.size - overlap;
  return union > 0 ? overlap / union : 0;
}

/**
 * Calculate overall match score (0-1)
 * Weighted by required vs preferred
 */
function calculateMatchScore(
  totalRequired: number,
  totalPreferred: number,
  matchedRequired: number,
  matchedPreferred: number
): number {
  // Required skills are weighted more heavily (70% of score)
  const requiredScore = totalRequired > 0 ? matchedRequired / totalRequired : 1.0;
  const requiredWeight = 0.7;

  // Preferred skills account for 30%
  const preferredScore = totalPreferred > 0 ? matchedPreferred / totalPreferred : 0.5;
  const preferredWeight = 0.3;

  const weightedScore = (requiredScore * requiredWeight) + (preferredScore * preferredWeight);

  return Math.min(1.0, weightedScore);
}

/**
 * Generate recommendations for improvement
 */
function generateRecommendations(
  profile: UserProfile,
  missing: ExtractedKeyword[],
  matches: Match[],
  matchScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // HIGH PRIORITY: Missing required skills
  const missingRequired = missing.filter(m => m.required);
  for (const skill of missingRequired.slice(0, 3)) { // Top 3
    recommendations.push({
      type: 'add-skill',
      priority: 'high',
      skill: skill.phrase,
      reason: `Critical missing skill: "${skill.phrase}" is a required qualification`,
      suggestion: `Consider gaining experience with "${skill.phrase}" through projects, courses, or professional work. This is a must-have for this role.`,
    });
  }

  // MEDIUM PRIORITY: Missing preferred skills
  const missingPreferred = missing.filter(m => !m.required);
  for (const skill of missingPreferred.slice(0, 2)) { // Top 2
    recommendations.push({
      type: 'add-skill',
      priority: 'medium',
      skill: skill.phrase,
      reason: `Preferred skill missing: "${skill.phrase}" would strengthen your application`,
      suggestion: `Learning "${skill.phrase}" could make you a more competitive candidate. Consider adding this to your skill development plan.`,
    });
  }

  // Reframe weak matches
  const weakMatches = matches.filter(m => m.confidence < 0.7);
  for (const match of weakMatches.slice(0, 2)) {
    recommendations.push({
      type: 'reframe-experience',
      priority: 'medium',
      skill: match.requirement.phrase,
      reason: `Weak match for "${match.requirement.phrase}" (${match.matchType} match)`,
      suggestion: `Emphasize your "${match.requirement.phrase}" experience more prominently in your resume. Add more specific examples.`,
    });
  }

  // If overall score is low, suggest adding projects
  if (matchScore < 0.6 && profile.metadata.careerStage !== 'professional') {
    recommendations.push({
      type: 'add-project',
      priority: 'high',
      reason: 'Overall match score is low',
      suggestion: 'Consider building a project that demonstrates the missing required skills. This is especially valuable for career changers and students.',
    });
  }

  // Certification recommendations for missing technical skills
  const missingTechnicalSkills = missing.filter(m =>
    m.category === 'language' || m.category === 'framework' || m.category === 'cloud' ||
    m.category === 'devops' || m.category === 'db' || m.category === 'tool'
  );
  for (const skill of missingTechnicalSkills.slice(0, 1)) {
    recommendations.push({
      type: 'get-certification',
      priority: 'low',
      skill: skill.phrase,
      reason: `Technical certification could validate "${skill.phrase}" skills`,
      suggestion: `Consider pursuing a certification in "${skill.phrase}" to demonstrate competency and fill this gap.`,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
