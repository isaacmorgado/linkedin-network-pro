/**
 * Test Helpers
 * Utilities for creating test profiles
 */

import type { UserProfile } from '../../../types/resume-tailoring';

export function createTestProfile(
  id: string,
  name: string,
  overrides: Partial<UserProfile> = {}
): UserProfile {
  return {
    id,
    name,
    email: `${id}@test.com`,
    location: overrides.location || 'San Francisco, CA',
    title: overrides.title || 'Software Engineer',
    workExperience: overrides.workExperience || [
      {
        id: 'exp1',
        company: 'Tech Corp',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        location: 'San Francisco, CA',
        description: '',
        industry: 'Technology',
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: []
      }
    ],
    education: overrides.education || [
      {
        id: 'edu1',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-06-01'
      }
    ],
    projects: [],
    skills: overrides.skills || [
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 5, category: 'Technical' },
      { name: 'TypeScript', level: 'advanced', yearsOfExperience: 4, category: 'Technical' }
    ],
    metadata: {
      totalYearsExperience: 4,
      domains: ['Software Development'],
      seniority: 'mid',
      careerStage: 'professional'
    }
  };
}
