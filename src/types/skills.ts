/**
 * Skills Database Type Definitions & Utilities
 * Provides O(1) lookup performance for skill matching and validation
 */

import { Skill as UserSkill } from './resume';
import { Skill as DatabaseSkill, SKILLS_DATA } from '../data/skills-database';

// Re-export skill category type
export type SkillCategory = UserSkill['category'];

/**
 * Skills database with O(1) lookup performance
 * Uses dual indexing: skill ID and synonym mapping
 */
export class SkillsDatabase {
  private skills: Map<string, DatabaseSkill>;
  private synonymIndex: Map<string, string>;

  constructor(skillsData: DatabaseSkill[] = []) {
    this.skills = new Map();
    this.synonymIndex = new Map();

    // Initialize indexes from provided data
    skillsData.forEach((skill) => {
      this.addSkill(skill);
    });
  }

  /**
   * Add a skill to the database with its synonyms indexed
   * @param skill - Skill object to add
   */
  private addSkill(skill: DatabaseSkill): void {
    const normalizedId = skill.id.toLowerCase();

    // Index by skill ID
    this.skills.set(normalizedId, skill);

    // Index skill name as a synonym
    this.synonymIndex.set(skill.name.toLowerCase(), normalizedId);

    // Index all provided synonyms
    if (skill.synonyms && Array.isArray(skill.synonyms)) {
      skill.synonyms.forEach((synonym) => {
        this.synonymIndex.set(synonym.toLowerCase(), normalizedId);
      });
    }
  }

  /**
   * Find a skill by name or synonym
   * @param term - Skill name or synonym (case-insensitive)
   * @returns Skill object or null if not found
   */
  findSkill(term: string): DatabaseSkill | null {
    if (!term || typeof term !== 'string') {
      return null;
    }

    const normalizedTerm = term.toLowerCase().trim();
    const skillId = this.synonymIndex.get(normalizedTerm);

    if (!skillId) {
      return null;
    }

    return this.skills.get(skillId) || null;
  }

  /**
   * Find all skills matching a specific category
   * @param category - Skill category to filter by
   * @returns Array of skills in the category
   */
  findSkillsByCategory(category: SkillCategory): DatabaseSkill[] {
    const results: DatabaseSkill[] = [];

    this.skills.forEach((skill) => {
      if (skill.category === category) {
        results.push(skill);
      }
    });

    return results;
  }

  /**
   * Get all skills in the database
   * @returns Array of all skills
   */
  getAllSkills(): DatabaseSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get the canonical skill ID for a term
   * @param term - Skill name or synonym (case-insensitive)
   * @returns Canonical skill ID or null if not found
   */
  getCanonicalName(term: string): string | null {
    if (!term || typeof term !== 'string') {
      return null;
    }

    const normalizedTerm = term.toLowerCase().trim();
    return this.synonymIndex.get(normalizedTerm) || null;
  }

  /**
   * Check if a term is a known skill
   * Fast boolean check for skill existence
   * @param term - Skill name or synonym (case-insensitive)
   * @returns True if skill exists in database
   */
  isKnownSkill(term: string): boolean {
    if (!term || typeof term !== 'string') {
      return false;
    }

    const normalizedTerm = term.toLowerCase().trim();
    return this.synonymIndex.has(normalizedTerm);
  }

  /**
   * Get total number of skills in database
   * @returns Count of unique skills
   */
  getTotalSkills(): number {
    return this.skills.size;
  }

  /**
   * Get all synonyms for a skill
   * @param skillId - Skill ID
   * @returns Array of all synonyms including the skill name
   */
  getSynonyms(skillId: string): string[] {
    const normalizedId = skillId.toLowerCase();
    const skill = this.skills.get(normalizedId);

    if (!skill) {
      return [];
    }

    const synonyms = [skill.name];
    if (skill.synonyms && Array.isArray(skill.synonyms)) {
      synonyms.push(...skill.synonyms);
    }

    return synonyms;
  }

  /**
   * Find multiple skills by an array of terms
   * @param terms - Array of skill names or synonyms
   * @returns Array of found skills (null entries for not found)
   */
  findMultipleSkills(terms: string[]): (DatabaseSkill | null)[] {
    return terms.map((term) => this.findSkill(term));
  }
}

/**
 * Singleton instance of the skills database
 * Initialize with empty array - should be populated from data source
 */
// Create singleton instance with all skills data loaded
export const skillsDatabase = new SkillsDatabase(SKILLS_DATA);

/**
 * Example usage:
 *
 * const db = new SkillsDatabase();
 *
 * // Find skill by ID
 * db.findSkill('react'); // Returns React skill object
 *
 * // Find skill by name
 * db.findSkill('React'); // Returns React skill object
 *
 * // Find skill by synonym
 * db.findSkill('reactjs'); // Returns React skill (via synonym)
 * db.findSkill('react.js'); // Returns React skill (via synonym)
 *
 * // Get canonical name
 * db.getCanonicalName('react.js'); // Returns 'react'
 *
 * // Check if skill exists
 * db.isKnownSkill('react'); // Returns true
 * db.isKnownSkill('unknown-skill'); // Returns false
 *
 * // Get skills by category
 * db.findSkillsByCategory('frontend'); // Returns all frontend skills
 *
 * // Get all skills
 * const allSkills = db.getAllSkills(); // Returns array of all skills
 */
