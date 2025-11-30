/**
 * Example Usage: Profile Converter
 *
 * This file demonstrates how to use the profile-converter utility
 * to convert between LinkedInProfile and UserProfile formats.
 */

import type { LinkedInProfile } from '../types/index';
import {
  convertLinkedInProfileToUserProfile,
  convertUserProfileToLinkedInProfile,
  convertLinkedInProfilesToUserProfiles,
} from './profile-converter';

// ============================================================================
// EXAMPLE 1: Basic Conversion (LinkedIn -> UserProfile)
// ============================================================================

const linkedInProfile: LinkedInProfile = {
  id: 'alice-johnson',
  publicId: 'alice-johnson',
  name: 'Alice Johnson',
  headline: 'Senior Product Manager at TechCorp',
  location: 'Seattle, WA',
  industry: 'Technology',
  avatarUrl: 'https://example.com/alice.jpg',
  about: 'Passionate about building products that solve real problems',
  experience: [
    {
      company: 'TechCorp',
      title: 'Senior Product Manager',
      duration: 'Jan 2021 - Present',
      location: 'Seattle, WA',
    },
    {
      company: 'StartupXYZ',
      title: 'Product Manager',
      duration: 'Jun 2018 - Dec 2020',
      location: 'San Francisco, CA',
    },
  ],
  education: [
    {
      school: 'Stanford University',
      degree: 'MBA',
      field: 'Business Administration',
    },
  ],
  skills: [

    { name: 'Product Management', endorsementCount: 0, endorsedBy: [] },

    { name: 'Agile', endorsementCount: 0, endorsedBy: [] },

    { name: 'User Research', endorsementCount: 0, endorsedBy: [] },

    { name: 'Roadmap Planning', endorsementCount: 0, endorsedBy: [] },

  ],
  certifications: [],
  userPosts: [],
  engagedPosts: [],
  recentActivity: [],
  scrapedAt: new Date().toISOString(),
  connections: 1500,
  mutualConnections: [],
  recentPosts: [],
};

// Convert to UserProfile (for pathfinding/resume generation)
const userProfile = convertLinkedInProfileToUserProfile(linkedInProfile);

console.log('User Profile:', {
  name: userProfile.name,
  title: userProfile.title,
  seniority: userProfile.metadata.seniority,
  yearsExperience: userProfile.metadata.totalYearsExperience,
  workExperience: userProfile.workExperience.length,
  education: userProfile.education.length,
  skills: userProfile.skills.length,
});

// ============================================================================
// EXAMPLE 2: Reverse Conversion (UserProfile -> LinkedIn)
// ============================================================================

// Convert back to LinkedInProfile (for syncing to monitoring/watchlist)
const backToLinkedIn = convertUserProfileToLinkedInProfile(userProfile);

console.log('LinkedIn Profile:', {
  name: backToLinkedIn.name,
  headline: backToLinkedIn.headline,
  experience: backToLinkedIn.experience.map(exp => ({
    company: exp.company,
    title: exp.title,
    duration: exp.duration,
  })),
});

// ============================================================================
// EXAMPLE 3: Batch Conversion
// ============================================================================

const multipleProfiles: LinkedInProfile[] = [
  linkedInProfile,
  {
    ...linkedInProfile,
    id: 'bob-smith',
    name: 'Bob Smith',
    headline: 'Software Engineer at Amazon',
  },
  {
    ...linkedInProfile,
    id: 'carol-white',
    name: 'Carol White',
    headline: 'Principal Engineer at Google',
  },
];

// Convert all profiles at once
const userProfiles = convertLinkedInProfilesToUserProfiles(multipleProfiles);

console.log('Converted Profiles:', userProfiles.map(profile => ({
  name: profile.name,
  seniority: profile.metadata.seniority,
})));

// ============================================================================
// EXAMPLE 4: Use in ProfileTab Component
// ============================================================================

/**
 * Example integration with ProfileTab component:
 *
 * ```tsx
 * import { convertLinkedInProfileToUserProfile } from '@/utils/profile-converter';
 *
 * function ProfileTab({ linkedInProfile }: { linkedInProfile: LinkedInProfile }) {
 *   // Convert LinkedIn profile to UserProfile for pathfinding
 *   const userProfile = convertLinkedInProfileToUserProfile(linkedInProfile);
 *
 *   return (
 *     <div>
 *       <h2>{userProfile.name}</h2>
 *       <p>{userProfile.title}</p>
 *       <p>Seniority: {userProfile.metadata.seniority}</p>
 *       <p>Experience: {userProfile.metadata.totalYearsExperience} years</p>
 *
 *       {/\* Use userProfile with pathfinding *\/}
 *       <PathfinderComponent profile={userProfile} />
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// EXAMPLE 5: Handling Missing Data
// ============================================================================

const minimalProfile: LinkedInProfile = {
  id: 'minimal-user',
  name: 'Minimal User',
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

const minimalUserProfile = convertLinkedInProfileToUserProfile(minimalProfile);

console.log('Minimal Profile:', {
  name: minimalUserProfile.name,
  title: minimalUserProfile.title, // Defaults to 'Professional'
  seniority: minimalUserProfile.metadata.seniority, // Inferred from years
  domains: minimalUserProfile.metadata.domains, // Defaults to ['Professional Services']
});
