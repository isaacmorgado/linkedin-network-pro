/**
 * Test Data Generator
 * Creates fake LinkedIn profiles for testing search and AI features
 *
 * Run this to populate IndexedDB with test data:
 * - Realistic profiles with skills, endorsements, experience
 * - Test scenarios like "who endorsed Alex Hormozi"
 */

import { networkDB } from '../lib/storage/network-db';
import type { NetworkNode } from '../types';

/**
 * Generate fake test data for search testing
 */
export async function generateTestData(): Promise<void> {
  console.log('[TestDataGenerator] Starting test data generation...');

  const testProfiles: NetworkNode[] = [
    // Alex Hormozi (Target for "who endorsed" queries)
    {
      id: 'alex-hormozi',
      profile: {
        id: 'alex-hormozi',
        name: 'Alex Hormozi',
        headline: 'CEO at Acquisition.com | $100M Portfolio',
        location: 'Las Vegas, Nevada',
        industry: 'Business Consulting',
        avatarUrl: 'https://via.placeholder.com/150',
        about: 'I scaled my companies to $100M+ and now I help entrepreneurs do the same.',
        currentRole: {
          title: 'CEO',
          company: 'Acquisition.com',
        },
        experience: [
          {
            company: 'Acquisition.com',
            title: 'CEO & Founder',
            duration: '2020 - Present',
            location: 'Las Vegas, NV',
          },
          {
            company: 'Gym Launch',
            title: 'Founder',
            duration: '2017 - 2021',
            location: 'Las Vegas, NV',
          },
        ],
        education: [
          {
            school: 'Vanderbilt University',
            degree: 'Bachelor of Science',
            field: 'Human & Organizational Development',
            startYear: 2007,
            endYear: 2011,
          },
        ],
        skills: [
          { name: 'Business Strategy', endorsementCount: 450, endorsedBy: ['sarah-chen', 'mike-johnson', 'emily-rodriguez'] },
          { name: 'Sales', endorsementCount: 380, endorsedBy: ['john-smith', 'lisa-anderson'] },
          { name: 'Marketing', endorsementCount: 320, endorsedBy: ['david-kim', 'rachel-brown'] },
          { name: 'Leadership', endorsementCount: 500, endorsedBy: ['jennifer-lee', 'robert-garcia', 'amanda-wilson'] },
        ],
        connections: 25000,
        mutualConnections: ['sarah-chen', 'mike-johnson'],
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'not_contacted',
      degree: 2, // 2nd degree connection
      matchScore: 85,
      activityScore: 95,
    },

    // Sarah Chen (Endorsed Alex Hormozi - Leadership)
    {
      id: 'sarah-chen',
      profile: {
        id: 'sarah-chen',
        name: 'Sarah Chen',
        headline: 'VP of Sales at TechCorp | SaaS Growth Expert',
        location: 'San Francisco, California',
        industry: 'Software',
        avatarUrl: 'https://via.placeholder.com/150',
        about: 'Building high-performing sales teams. Scaled TechCorp from $1M to $50M ARR.',
        currentRole: {
          title: 'VP of Sales',
          company: 'TechCorp',
        },
        experience: [
          {
            company: 'TechCorp',
            title: 'VP of Sales',
            duration: '2021 - Present',
            location: 'San Francisco, CA',
          },
          {
            company: 'Salesforce',
            title: 'Enterprise Account Executive',
            duration: '2018 - 2021',
            location: 'San Francisco, CA',
          },
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'MBA',
            field: 'Business Administration',
            startYear: 2016,
            endYear: 2018,
          },
        ],
        skills: [
          { name: 'Sales Leadership', endorsementCount: 280, endorsedBy: [] },
          { name: 'SaaS', endorsementCount: 210, endorsedBy: [] },
          { name: 'Business Development', endorsementCount: 190, endorsedBy: [] },
        ],
        connections: 8500,
        mutualConnections: ['mike-johnson'],
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [
          {
            authorId: 'alex-hormozi',
            authorName: 'Alex Hormozi',
            topic: 'How to scale your business',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            engagementType: 'comment',
          },
        ],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'connected',
      degree: 1, // 1st degree (your connection)
      matchScore: 78,
      activityScore: 85,
    },

    // Mike Johnson (Endorsed Alex - Business Strategy & Leadership)
    {
      id: 'mike-johnson',
      profile: {
        id: 'mike-johnson',
        name: 'Mike Johnson',
        headline: 'Founder & CEO at StartupX | Y Combinator Alum',
        location: 'Austin, Texas',
        industry: 'Technology',
        avatarUrl: 'https://via.placeholder.com/150',
        about: 'Built and sold 2 companies. Now helping founders scale their startups.',
        currentRole: {
          title: 'CEO',
          company: 'StartupX',
        },
        experience: [
          {
            company: 'StartupX',
            title: 'Founder & CEO',
            duration: '2022 - Present',
            location: 'Austin, TX',
          },
          {
            company: 'Google',
            title: 'Product Manager',
            duration: '2018 - 2022',
            location: 'Mountain View, CA',
          },
        ],
        education: [
          {
            school: 'MIT',
            degree: 'Master of Science',
            field: 'Computer Science',
            startYear: 2016,
            endYear: 2018,
          },
        ],
        skills: [
          { name: 'Product Management', endorsementCount: 320, endorsedBy: [] },
          { name: 'Entrepreneurship', endorsementCount: 280, endorsedBy: [] },
          { name: 'Strategy', endorsementCount: 250, endorsedBy: [] },
        ],
        connections: 12000,
        mutualConnections: ['sarah-chen'],
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'connected',
      degree: 1,
      matchScore: 82,
      activityScore: 88,
    },

    // Emily Rodriguez (Endorsed Alex - Business Strategy)
    {
      id: 'emily-rodriguez',
      profile: {
        id: 'emily-rodriguez',
        name: 'Emily Rodriguez',
        headline: 'Marketing Director at Netflix | Brand Strategy',
        location: 'Los Angeles, California',
        industry: 'Entertainment',
        avatarUrl: 'https://via.placeholder.com/150',
        about: 'Leading brand strategy for Netflix Originals. Ex-Disney, Ex-HBO.',
        currentRole: {
          title: 'Marketing Director',
          company: 'Netflix',
        },
        experience: [
          {
            company: 'Netflix',
            title: 'Marketing Director',
            duration: '2020 - Present',
            location: 'Los Angeles, CA',
          },
          {
            company: 'Disney',
            title: 'Senior Marketing Manager',
            duration: '2017 - 2020',
            location: 'Burbank, CA',
          },
        ],
        education: [
          {
            school: 'UCLA',
            degree: 'Bachelor of Arts',
            field: 'Marketing',
            startYear: 2013,
            endYear: 2017,
          },
        ],
        skills: [
          { name: 'Brand Strategy', endorsementCount: 340, endorsedBy: [] },
          { name: 'Marketing', endorsementCount: 310, endorsedBy: [] },
          { name: 'Content Strategy', endorsementCount: 280, endorsedBy: [] },
        ],
        connections: 9500,
        mutualConnections: [],
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'not_contacted',
      degree: 2,
      matchScore: 75,
      activityScore: 80,
    },

    // John Smith (Endorsed Alex - Sales)
    {
      id: 'john-smith',
      profile: {
        id: 'john-smith',
        name: 'John Smith',
        headline: 'Senior ML Engineer at Google | AI Research',
        location: 'Mountain View, California',
        industry: 'Technology',
        avatarUrl: 'https://via.placeholder.com/150',
        about: 'Building the future of AI at Google Brain. PhD in Machine Learning.',
        currentRole: {
          title: 'Senior ML Engineer',
          company: 'Google',
        },
        experience: [
          {
            company: 'Google',
            title: 'Senior ML Engineer',
            duration: '2019 - Present',
            location: 'Mountain View, CA',
          },
          {
            company: 'OpenAI',
            title: 'Research Engineer',
            duration: '2017 - 2019',
            location: 'San Francisco, CA',
          },
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'PhD',
            field: 'Machine Learning',
            startYear: 2013,
            endYear: 2017,
          },
        ],
        skills: [
          { name: 'Machine Learning', endorsementCount: 480, endorsedBy: [] },
          { name: 'Python', endorsementCount: 420, endorsedBy: [] },
          { name: 'TensorFlow', endorsementCount: 390, endorsedBy: [] },
        ],
        connections: 15000,
        mutualConnections: ['mike-johnson'],
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'not_contacted',
      degree: 2,
      matchScore: 88,
      activityScore: 92,
    },

    // More profiles for variety...
    {
      id: 'lisa-anderson',
      profile: {
        id: 'lisa-anderson',
        name: 'Lisa Anderson',
        headline: 'Product Designer at Airbnb | UX/UI Expert',
        location: 'San Francisco, California',
        industry: 'Design',
        avatarUrl: 'https://via.placeholder.com/150',
        currentRole: {
          title: 'Product Designer',
          company: 'Airbnb',
        },
        experience: [
          {
            company: 'Airbnb',
            title: 'Product Designer',
            duration: '2021 - Present',
          },
        ],
        education: [
          {
            school: 'Rhode Island School of Design',
            degree: 'BFA',
            field: 'Graphic Design',
            startYear: 2015,
            endYear: 2019,
          },
        ],
        skills: [
          { name: 'UI/UX Design', endorsementCount: 290, endorsedBy: [] },
          { name: 'Figma', endorsementCount: 250, endorsedBy: [] },
        ],
        connections: 7200,
        certifications: [],
        recentPosts: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
        mutualConnections: [],
        scrapedAt: new Date().toISOString(),
      },
      status: 'connected',
      degree: 1,
      matchScore: 72,
      activityScore: 75,
    },
  ];

  // Clear existing test data
  await networkDB.nodes.clear();
  console.log('[TestDataGenerator] Cleared existing nodes');

  // Insert test profiles
  await networkDB.nodes.bulkAdd(testProfiles);
  console.log(`[TestDataGenerator] Added ${testProfiles.length} test profiles`);

  // Log test scenario queries
  console.log('\n[TestDataGenerator] Test Scenarios:');
  console.log('1. "Who endorsed Alex Hormozi?" → Should show Sarah Chen, Mike Johnson, Emily Rodriguez');
  console.log('2. "Who endorsed Alex Hormozi for leadership?" → Should show Jennifer Lee, Robert Garcia, Amanda Wilson');
  console.log('3. "What is the shortest path to Alex Hormozi?" → Should recommend Sarah Chen (1st degree) who endorsed him');
  console.log('4. "Find ML engineers at Google" → Should show John Smith');
  console.log('5. "Who do I know at Netflix?" → Should show Emily Rodriguez');
  console.log('6. "Who works in AI?" → Should show John Smith');
  console.log('7. "Tell me about Sarah Chen" → Should provide her profile details');

  console.log('\n[TestDataGenerator] ✅ Test data includes endorsement relationships for pathfinding!');
  console.log('[TestDataGenerator] Test data generation complete!');
}

/**
 * Clear all test data
 */
export async function clearTestData(): Promise<void> {
  await networkDB.nodes.clear();
  await networkDB.edges.clear();
  await networkDB.activities.clear();
  console.log('[TestDataGenerator] Cleared all test data');
}
