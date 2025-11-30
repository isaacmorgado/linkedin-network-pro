/**
 * Tests for Profile Converter Utility
 */

import { describe, it, expect } from 'vitest';
import {
  convertLinkedInProfileToUserProfile,
  convertUserProfileToLinkedInProfile,
  convertLinkedInProfilesToUserProfiles,
} from './profile-converter';
import type { LinkedInProfile } from '../types/index';

describe('Profile Converter', () => {
  const mockLinkedInProfile: LinkedInProfile = {
    id: 'john-doe',
    publicId: 'john-doe',
    name: 'John Doe',
    headline: 'Senior Software Engineer at Tech Corp',
    location: 'San Francisco, CA',
    industry: 'Technology',
    avatarUrl: 'https://example.com/avatar.jpg',
    about: 'Passionate about building scalable systems',
    experience: [
      {
        company: 'Tech Corp',
        title: 'Senior Software Engineer',
        duration: 'Jan 2020 - Present',
        location: 'San Francisco, CA',
      },
      {
        company: 'Startup Inc',
        title: 'Software Engineer',
        duration: 'Jan 2018 - Dec 2019',
        location: 'New York, NY',
      },
    ],
    education: [
      {
        school: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
      },
    ],
    skills: [

      { name: 'JavaScript', endorsementCount: 0, endorsedBy: [] },

      { name: 'TypeScript', endorsementCount: 0, endorsedBy: [] },

      { name: 'React', endorsementCount: 0, endorsedBy: [] },

      { name: 'Node.js', endorsementCount: 0, endorsedBy: [] },

    ],
    connections: 500,
    mutualConnections: [],
    recentPosts: [],
    certifications: [],
    userPosts: [],
    engagedPosts: [],
    recentActivity: [],
    scrapedAt: new Date().toISOString(),
  };

  describe('convertLinkedInProfileToUserProfile', () => {
    it('should convert basic profile information', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);

      expect(userProfile.id).toBe('john-doe');
      expect(userProfile.name).toBe('John Doe');
      expect(userProfile.title).toBe('Senior Software Engineer at Tech Corp');
      expect(userProfile.location).toBe('San Francisco, CA');
      expect(userProfile.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(userProfile.publicId).toBe('john-doe');
      expect(userProfile.url).toBe('https://www.linkedin.com/in/john-doe/');
    });

    it('should convert work experience correctly', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);

      expect(userProfile.workExperience).toHaveLength(2);
      expect(userProfile.workExperience[0].company).toBe('Tech Corp');
      expect(userProfile.workExperience[0].title).toBe('Senior Software Engineer');
      expect(userProfile.workExperience[0].location).toBe('San Francisco, CA');
      expect(userProfile.workExperience[0].endDate).toBeNull(); // Present
    });

    it('should convert education correctly', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);

      expect(userProfile.education).toHaveLength(1);
      expect(userProfile.education[0].school).toBe('University of California');
      expect(userProfile.education[0].degree).toBe('Bachelor of Science');
      expect(userProfile.education[0].field).toBe('Computer Science');
    });

    it('should convert skills correctly', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);

      expect(userProfile.skills).toHaveLength(4);
      expect(userProfile.skills[0].name).toBe('JavaScript');
      expect(userProfile.skills[0].level).toBe('intermediate');
    });

    it('should infer metadata correctly', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);

      expect(userProfile.metadata).toBeDefined();
      expect(userProfile.metadata.seniority).toBe('senior');
      expect(userProfile.metadata.domains).toContain('Technology');
      expect(userProfile.metadata.totalYearsExperience).toBeGreaterThan(0);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalProfile: LinkedInProfile = {
        id: 'jane-smith',
        name: 'Jane Smith',
        experience: [],
        education: [],
        skills: [],
        mutualConnections: [],
        recentPosts: [],
        certifications: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      };

      const userProfile = convertLinkedInProfileToUserProfile(minimalProfile);

      expect(userProfile.name).toBe('Jane Smith');
      expect(userProfile.title).toBe('Professional');
      expect(userProfile.workExperience).toHaveLength(0);
      expect(userProfile.education).toHaveLength(0);
      expect(userProfile.skills).toHaveLength(0);
    });

    it('should infer seniority from headline', () => {
      const profiles = [
        { headline: 'Junior Developer', expectedSeniority: 'entry' },
        { headline: 'Software Engineer', expectedSeniority: 'mid' },
        { headline: 'Senior Engineer', expectedSeniority: 'senior' },
        { headline: 'Staff Engineer', expectedSeniority: 'staff' },
        { headline: 'Principal Engineer', expectedSeniority: 'principal' },
      ];

      profiles.forEach(({ headline, expectedSeniority }) => {
        const profile: LinkedInProfile = {
          ...mockLinkedInProfile,
          headline,
          experience: [],
        };
        const userProfile = convertLinkedInProfileToUserProfile(profile);
        expect(userProfile.metadata.seniority).toBe(expectedSeniority);
      });
    });
  });

  describe('convertUserProfileToLinkedInProfile', () => {
    it('should convert UserProfile back to LinkedInProfile', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);
      const linkedInProfile = convertUserProfileToLinkedInProfile(userProfile);

      expect(linkedInProfile.id).toBe('john-doe');
      expect(linkedInProfile.name).toBe('John Doe');
      expect(linkedInProfile.headline).toBe('Senior Software Engineer at Tech Corp');
      expect(linkedInProfile.experience).toHaveLength(2);
      expect(linkedInProfile.education).toHaveLength(1);
      expect(linkedInProfile.skills).toHaveLength(4);
    });

    it('should format duration correctly', () => {
      const userProfile = convertLinkedInProfileToUserProfile(mockLinkedInProfile);
      const linkedInProfile = convertUserProfileToLinkedInProfile(userProfile);

      expect(linkedInProfile.experience[0].duration).toMatch(/\w{3} \d{4} - Present/);
    });
  });

  describe('convertLinkedInProfilesToUserProfiles', () => {
    it('should convert multiple profiles', () => {
      const profiles: LinkedInProfile[] = [
        mockLinkedInProfile,
        { ...mockLinkedInProfile, id: 'jane-doe', name: 'Jane Doe' },
      ];

      const userProfiles = convertLinkedInProfilesToUserProfiles(profiles);

      expect(userProfiles).toHaveLength(2);
      expect(userProfiles[0].name).toBe('John Doe');
      expect(userProfiles[1].name).toBe('Jane Doe');
    });
  });
});
