# scrapeOwnProfile() Usage Guide

## Overview

The `scrapeOwnProfile()` function scrapes the current user's own LinkedIn profile and returns it in the `UserProfile` format used throughout the application.

## Features

- **Automatic Caching**: Profiles are cached for 7 days to minimize scraping
- **Smart Navigation**: Automatically navigates to /me if not already on own profile
- **Error Handling**: Returns a minimal profile if scraping fails
- **Type-Safe**: Full TypeScript support with UserProfile type

## Basic Usage

```typescript
import { scrapeOwnProfile } from '@/utils/linkedin-scraper';

// Get the current user's profile
const userProfile = await scrapeOwnProfile();

console.log(userProfile.name);
console.log(userProfile.title);
console.log(userProfile.workExperience);
```

## Cache Management

```typescript
import { scrapeOwnProfile, clearCachedProfile } from '@/utils/linkedin-scraper';

// Clear cache to force fresh scrape
await clearCachedProfile();

// Get fresh profile
const freshProfile = await scrapeOwnProfile();
```

## Integration Points

### 1. Universal Connection Pathfinding

Use the scraped profile to initialize pathfinding:

```typescript
import { scrapeOwnProfile } from '@/utils/linkedin-scraper';
import { UniversalPathfinder } from '@/services/universal-connection/universal-pathfinder';

const currentUser = await scrapeOwnProfile();
const pathfinder = new UniversalPathfinder(currentUser);

// Find path to target
const path = await pathfinder.findPath(targetProfile);
```

### 2. Resume Generation

Use the profile as the base for resume generation:

```typescript
import { scrapeOwnProfile } from '@/utils/linkedin-scraper';
import { generateResume } from '@/services/resume-generator';

const userProfile = await scrapeOwnProfile();
const jobDescription = getJobDescription(); // Your job description

const tailoredResume = await generateResume(userProfile, jobDescription);
```

### 3. Profile Builder

Pre-populate the profile builder with existing LinkedIn data:

```typescript
import { scrapeOwnProfile } from '@/utils/linkedin-scraper';

const userProfile = await scrapeOwnProfile();

// Pre-fill form
setFormData({
  name: userProfile.name,
  title: userProfile.title,
  location: userProfile.location,
  workExperience: userProfile.workExperience,
  // ... etc
});
```

## Storage Details

- **Storage Key**: `uproot_current_user`
- **TTL**: 7 days (604,800,000 milliseconds)
- **Storage Type**: Chrome Local Storage
- **Data Structure**:
  ```typescript
  {
    profile: UserProfile,
    cachedAt: number,      // Timestamp when cached
    expiresAt: number      // Timestamp when cache expires
  }
  ```

## Error Handling

The function gracefully handles errors by returning a minimal profile:

```typescript
{
  name: 'LinkedIn User',
  title: '',
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  metadata: {
    totalYearsExperience: 0,
    domains: [],
    seniority: 'entry',
    careerStage: 'professional',
  }
}
```

## Implementation Notes

### Type Conversion

The function converts from `LinkedInPersonProfile` (monitoring format) to `UserProfile` (resume-tailoring format):

- `LinkedInPersonProfile.name` → `UserProfile.name`
- `LinkedInPersonProfile.headline` → `UserProfile.title`
- `LinkedInPersonProfile.currentRole` → `UserProfile.workExperience[0]`
- `LinkedInPersonProfile.location` → `UserProfile.location`
- `LinkedInPersonProfile.photoUrl` → `UserProfile.avatarUrl`
- `LinkedInPersonProfile.profileUrl` → `UserProfile.url`

### Seniority Inference

The function infers seniority level from job title:

- "principal", "distinguished" → `principal`
- "staff", "lead" → `staff`
- "senior", "sr." → `senior`
- "junior", "jr.", "associate" → `entry`
- Default → `mid`

## Future Enhancements

Potential improvements to consider:

1. **Full Experience Scraping**: Currently only captures current role; could expand to scrape full work history
2. **Education Scraping**: Add education parsing from LinkedIn profile
3. **Skills Extraction**: Parse skills section
4. **Custom TTL**: Allow configurable cache duration
5. **Incremental Updates**: Update only changed fields instead of full re-scrape
6. **Background Sync**: Periodically refresh cache in background

## File Location

`/home/imorgado/Documents/agent-girl/chat-abc62d98/linkedin-network-pro/src/utils/linkedin-scraper.ts`
