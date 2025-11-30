/**
 * Transform Utilities Tests
 * Tests for data transformation functions
 */

import { describe, it, expect } from 'vitest';
import { userProfileToNetworkNode, connectionPathToRoute, transformConnectionStrategyForUI } from './transformUtils';
import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionPath, ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';

describe('TransformUtils', () => {
  describe('userProfileToNetworkNode', () => {
    it('should transform a valid UserProfile to NetworkNode', () => {
      const profile: UserProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        url: 'https://linkedin.com/in/johndoe',
        title: 'Software Engineer',
        location: 'San Francisco',
        avatarUrl: 'https://example.com/avatar.jpg',
        workExperience: [
          {
            id: '1',
            company: 'Tech Corp',
            title: 'Engineer',
            startDate: '2020-01',
            endDate: '2023-01',
            location: 'SF',
            description: '',
            industry: 'tech',
            achievements: [],
            skills: [],
            domains: [],
            responsibilities: [],
          },
        ],
        education: [
          {
            id: '1',
            school: 'MIT',
            degree: 'BS',
            field: 'Computer Science',
            startDate: '2016',
            endDate: '2020',
          },
        ],
        projects: [],
        skills: [{ name: 'JavaScript', level: 'expert', yearsOfExperience: 5, category: 'Programming' }],
        metadata: {
          totalYearsExperience: 3,
          domains: ['Web Development'],
          seniority: 'mid',
          careerStage: 'professional',
        },
      };

      const result = userProfileToNetworkNode(profile, 0);

      expect(result).toMatchObject({
        id: 'john@example.com',
        profile: {
          name: 'John Doe',
          headline: 'Software Engineer',
          location: 'San Francisco',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        status: 'not_contacted',
        degree: 1,
        matchScore: 0,
      });

      expect(result.profile.experience).toHaveLength(1);
      expect(result.profile.education).toHaveLength(1);
      expect(result.profile.skills).toEqual([{
        name: 'JavaScript',
        endorsementCount: 0,
        endorsedBy: []
      }]);
    });

    it('should handle minimal UserProfile with only name', () => {
      const profile: UserProfile = {
        name: 'Jane Smith',
        email: '',
        url: '',
        title: '',
        location: '',
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        metadata: {
          totalYearsExperience: 0,
          domains: [],
          seniority: 'entry',
          careerStage: 'professional',
        },
      };

      const result = userProfileToNetworkNode(profile, 1);

      expect(result).toMatchObject({
        profile: {
          name: 'Jane Smith',
          headline: '',
          location: '',
        },
        status: 'not_contacted',
        degree: 2, // index + 1
      });
    });

    it('should handle UserProfile with no name (edge case)', () => {
      const profile: UserProfile = {
        name: '',
        email: 'anonymous@example.com',
        url: '',
        title: '',
        location: '',
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        metadata: {
          totalYearsExperience: 0,
          domains: [],
          seniority: 'entry',
          careerStage: 'professional',
        },
      };

      const result = userProfileToNetworkNode(profile, 0);

      expect(result.profile.name).toBe('Unknown');
      expect(result.id).toBe('anonymous@example.com');
    });
  });

  describe('connectionPathToRoute', () => {
    it('should transform valid ConnectionPath to ConnectionRoute', () => {
      const mockProfiles: UserProfile[] = [
        {
          name: 'Alice',
          email: 'alice@example.com',
          url: '',
          title: 'Dev',
          location: '',
          workExperience: [],
          education: [],
          projects: [],
          skills: [],
          metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
        },
        {
          name: 'Bob',
          email: 'bob@example.com',
          url: '',
          title: 'Manager',
          location: '',
          workExperience: [],
          education: [],
          projects: [],
          skills: [],
          metadata: { totalYearsExperience: 0, domains: [], seniority: 'mid', careerStage: 'professional' },
        },
      ];

      const path: ConnectionPath = {
        nodes: mockProfiles,
        edges: [],
        totalWeight: 1.0,
        successProbability: 0.65,
        mutualConnections: 1,
      };

      const result = connectionPathToRoute(path, 'target-123');

      expect(result.targetId).toBe('target-123');
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].profile.name).toBe('Alice');
      expect(result.nodes[1].profile.name).toBe('Bob');
      expect(result.successProbability).toBe(65); // Converted from 0-1 to 0-100
    });

    it('should filter out null/undefined nodes', () => {
      const mockProfiles = [
        {
          name: 'Alice',
          email: 'alice@example.com',
          url: '',
          title: '',
          location: '',
          workExperience: [],
          education: [],
          projects: [],
          skills: [],
          metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
        },
        null as any,
        undefined as any,
        {
          name: 'Charlie',
          email: 'charlie@example.com',
          url: '',
          title: '',
          location: '',
          workExperience: [],
          education: [],
          projects: [],
          skills: [],
          metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
        },
      ];

      const path: ConnectionPath = {
        nodes: mockProfiles,
        edges: [],
        totalWeight: 1.0,
        successProbability: 0.85,
        mutualConnections: 0,
      };

      const result = connectionPathToRoute(path, 'target-456');

      // Should only have 2 valid nodes (Alice and Charlie)
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].profile.name).toBe('Alice');
      expect(result.nodes[1].profile.name).toBe('Charlie');
    });

    it('should handle empty nodes array', () => {
      const path: ConnectionPath = {
        nodes: [],
        edges: [],
        totalWeight: 0,
        successProbability: 0,
        mutualConnections: 0,
      };

      const result = connectionPathToRoute(path, 'target-789');

      expect(result.nodes).toHaveLength(0);
      expect(result.targetId).toBe('target-789');
    });
  });

  describe('transformConnectionStrategyForUI', () => {
    it('should transform mutual connection strategy with path', () => {
      const strategy: ConnectionStrategy = {
        type: 'mutual',
        confidence: 0.85,
        path: {
          nodes: [
            {
              name: 'User',
              email: 'user@example.com',
              url: '',
              title: '',
              location: '',
              workExperience: [],
              education: [],
              projects: [],
              skills: [],
              metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
            },
            {
              name: 'Mutual',
              email: 'mutual@example.com',
              url: '',
              title: '',
              location: '',
              workExperience: [],
              education: [],
              projects: [],
              skills: [],
              metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
            },
            {
              name: 'Target',
              email: 'target@example.com',
              url: '',
              title: '',
              location: '',
              workExperience: [],
              education: [],
              projects: [],
              skills: [],
              metadata: { totalYearsExperience: 0, domains: [], seniority: 'entry', careerStage: 'professional' },
            },
          ],
          edges: [],
          totalWeight: 1.0,
          successProbability: 0.65,
          mutualConnections: 1,
        },
        estimatedAcceptanceRate: 0.65,
        reasoning: 'Found via mutual connection',
        nextSteps: ['Message mutual', 'Request introduction'],
      };

      const result = transformConnectionStrategyForUI(strategy);

      expect(result).not.toBeNull();
      expect(result?.nodes).toHaveLength(3);
      expect(result?.nodes[2].profile.name).toBe('Target');
      expect(result?.targetId).toBe('target@example.com');
    });

    it('should return null for strategy without path', () => {
      const strategy: ConnectionStrategy = {
        type: 'direct-similarity',
        confidence: 0.40,
        estimatedAcceptanceRate: 0.40,
        reasoning: 'Direct similarity approach',
        nextSteps: ['Send connection request'],
        directSimilarity: {
          overall: 0.70,
          breakdown: {
            industry: 0.8,
            skills: 0.7,
            education: 0.6,
            location: 0.9,
            companies: 0.5,
          },
        },
      };

      const result = transformConnectionStrategyForUI(strategy);

      expect(result).toBeNull();
    });

    it('should handle strategy with undefined or null nodes gracefully', () => {
      const strategy: ConnectionStrategy = {
        type: 'mutual',
        confidence: 0.50,
        path: {
          nodes: [null as any, undefined as any],
          edges: [],
          totalWeight: 1.0,
          successProbability: 0.50,
          mutualConnections: 0,
        },
        estimatedAcceptanceRate: 0.50,
        reasoning: 'Invalid path',
        nextSteps: [],
      };

      const result = transformConnectionStrategyForUI(strategy);

      // Should still return a route, but with 0 nodes
      expect(result).not.toBeNull();
      expect(result?.nodes).toHaveLength(0);
    });
  });
});
