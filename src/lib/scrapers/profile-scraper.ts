/**
 * Profile Scraper
 * Scrapes LinkedIn profile data with optional activity/engagement data
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import { LinkedInProfile } from '@/types';
import type { ActivityEvent } from '@/types/network';
import { waitForElement, inferIndustryFromHeadline, parseDateString, extractNumberFromText } from './helpers';
import { scrapeActivityForProfile, processActivityData } from './profile-scraper-activities';
import { scrapeMultipleSkillEndorsers } from './endorsement-scraper';

/**
 * Scrape profile data from LinkedIn profile page
 *
 * @param options - Optional scraping configuration
 * @param options.includeActivity - Whether to scrape activity/engagement data (default: false)
 * @param options.includeEndorsers - Whether to scrape WHO endorsed each skill (default: false, slower)
 * @param options.maxEndorsedSkills - Maximum number of skills to scrape endorsers for (default: 5)
 * @returns Profile data with optional activity events
 */
export async function scrapeProfileData(options?: {
  includeActivity?: boolean;
  includeEndorsers?: boolean;
  maxEndorsedSkills?: number;
}): Promise<Partial<LinkedInProfile> & { activities?: ActivityEvent[] } | null> {
  try {
    // Wait for profile to load
    await waitForElement('.pv-top-card');

    const profileData: Partial<LinkedInProfile> = {
      scrapedAt: new Date().toISOString(),
    };

    // Extract public identifier from URL
    const urlMatch = window.location.href.match(/\/in\/([^\/]+)/);
    if (urlMatch) {
      profileData.publicId = urlMatch[1];
      profileData.id = urlMatch[1];
    }

    // Name
    const nameElement = document.querySelector('.pv-top-card--list li:first-child');
    if (nameElement) {
      profileData.name = nameElement.textContent?.trim() || '';
    }

    // Headline
    const headlineElement = document.querySelector('.pv-top-card--list-bullet li:first-child');
    if (headlineElement) {
      const headline = headlineElement.textContent?.trim();
      profileData.headline = headline;

      // Infer industry from headline
      if (headline) {
        profileData.industry = inferIndustryFromHeadline(headline);
      }
    }

    // Location
    const locationElement = document.querySelector('.pv-top-card--list-bullet li:nth-child(2)');
    if (locationElement) {
      profileData.location = locationElement.textContent?.trim();
    }

    // Avatar - Try multiple selectors
    const avatarElement =
      document.querySelector('.pv-top-card__photo') as HTMLImageElement ||
      document.querySelector('.pv-top-card-profile-picture__image') as HTMLImageElement ||
      document.querySelector('img[data-ghost-classes*="profile"]') as HTMLImageElement ||
      document.querySelector('.profile-photo-edit__preview') as HTMLImageElement ||
      document.querySelector('.pv-top-card-profile-picture__image--show') as HTMLImageElement;

    if (avatarElement?.src && !avatarElement.src.includes('data:image')) {
      profileData.avatarUrl = avatarElement.src;
      console.log('[Uproot] [AVATAR] Extracted avatar URL:', profileData.avatarUrl);
    } else {
      console.warn('[Uproot] [AVATAR] No avatar found or using placeholder image');
    }

    // About section
    const aboutElement = document.querySelector('#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"]');
    if (aboutElement) {
      profileData.about = aboutElement.textContent?.trim();
    }

    // Experience
    profileData.experience = [];
    const experienceSection = document.querySelector('#experience');
    if (experienceSection) {
      const experienceItems = experienceSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      experienceItems?.forEach((item) => {
        const companyElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const titleElement = item.querySelector('.t-14 span[aria-hidden="true"]');
        const durationElement = item.querySelector('.t-black--light span[aria-hidden="true"]');

        if (companyElement && titleElement) {
          profileData.experience?.push({
            company: companyElement.textContent?.trim() || '',
            title: titleElement.textContent?.trim() || '',
            duration: durationElement?.textContent?.trim(),
          });
        }
      });
    }

    // Infer industry from first job if not set
    if (!profileData.industry && profileData.experience && profileData.experience.length > 0) {
      const firstJobTitle = profileData.experience[0].title;
      if (firstJobTitle) {
        profileData.industry = inferIndustryFromHeadline(firstJobTitle);
      }
    }

    // Education
    profileData.education = [];
    const educationSection = document.querySelector('#education');
    if (educationSection) {
      const educationItems = educationSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      educationItems?.forEach((item) => {
        const schoolElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const degreeElement = item.querySelector('.t-14 span[aria-hidden="true"]');
        const dateElement =
          item.querySelector('.pvs-entity__caption-wrapper') ||
          item.querySelector('.t-black--light:last-child span[aria-hidden="true"]') ||
          item.querySelector('.pvs-entity__sub-components span[aria-hidden="true"]');

        const dates = parseDateString(dateElement?.textContent?.trim());

        if (schoolElement) {
          profileData.education?.push({
            school: schoolElement.textContent?.trim() || '',
            degree: degreeElement?.textContent?.trim(),
            field: undefined,
            startYear: dates.startYear,
            endYear: dates.endYear,
          });
        }
      });
    }

    // Certifications
    profileData.certifications = [];
    const certificationsSection = document.querySelector('#licenses_and_certifications');
    if (certificationsSection) {
      const certItems = certificationsSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      certItems?.forEach((item) => {
        const nameElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const issuerElement = item.querySelector('.t-14 span[aria-hidden="true"]');
        const dateElement =
          item.querySelector('.pvs-entity__caption-wrapper') ||
          item.querySelector('.t-black--light span[aria-hidden="true"]');

        if (nameElement) {
          profileData.certifications?.push({
            name: nameElement.textContent?.trim() || '',
            issuer: issuerElement?.textContent?.trim(),
            dateObtained: dateElement?.textContent?.trim(),
          });
        }
      });
    }

    // Skills
    profileData.skills = [];
    const skillsSection = document.querySelector('#skills');
    if (skillsSection) {
      const skillItems = skillsSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');

      // First pass: Collect skill names and counts
      const skillElements: Array<{ element: Element; name: string; count: number }> = [];

      skillItems?.forEach((item) => {
        const skillElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const endorsementElement =
          item.querySelector('.pvs-entity__supplementary-info') ||
          item.querySelector('.t-black--light span[aria-hidden="true"]');

        const endorsementCount = endorsementElement
          ? extractNumberFromText(endorsementElement.textContent)
          : 0;

        if (skillElement) {
          const skillName = skillElement.textContent?.trim() || '';
          skillElements.push({
            element: item,
            name: skillName,
            count: endorsementCount,
          });

          // Add skill with empty endorsedBy (will fill in if includeEndorsers is true)
          profileData.skills?.push({
            name: skillName,
            endorsementCount,
            endorsedBy: [],
          });
        }
      });

      // Second pass (optional): Scrape WHO endorsed each skill
      if (options?.includeEndorsers && skillElements.length > 0) {
        console.log('[ProfileScraper] Scraping endorsers for skills...');

        const maxSkills = options?.maxEndorsedSkills || 5;
        const endorserMap = await scrapeMultipleSkillEndorsers(
          skillElements.map(s => ({ element: s.element, name: s.name })),
          maxSkills
        );

        // Update skills with endorser data
        profileData.skills?.forEach((skill) => {
          const endorsers = endorserMap.get(skill.name);
          if (endorsers) {
            skill.endorsedBy = endorsers;
            console.log(`[ProfileScraper] Found ${endorsers.length} endorsers for ${skill.name}`);
          }
        });

        console.log('[ProfileScraper] Finished scraping endorsers');
      }
    }

    // Connection count
    const connectionsElement = document.querySelector('.pv-top-card--list-bullet li span.t-black--light');
    if (connectionsElement) {
      const text = connectionsElement.textContent?.trim() || '';
      const match = text.match(/(\d+)/);
      if (match) {
        profileData.connections = parseInt(match[1], 10);
      }
    }

    console.log('Scraped profile data:', profileData);

    // Optionally scrape activity/engagement data
    if (options?.includeActivity) {
      const profileUrl = window.location.href;
      const activities = await scrapeActivityForProfile(profileUrl, profileData.id);
      const { userPosts, engagedPosts } = await processActivityData(profileData, activities);

      console.log(`[ProfileScraper] Extracted ${userPosts.length} user posts, ${engagedPosts.length} engaged posts`);

      return {
        ...profileData,
        userPosts,
        engagedPosts,
        activities,
      };
    }

    return profileData;
  } catch (error) {
    console.error('Profile scraping error:', error);
    return null;
  }
}

/**
 * Scrape recent posts from profile's activity feed
 *
 * @deprecated Use `scrapeProfileData({ includeActivity: true })` instead.
 */
export function scrapeRecentActivity(): Array<{ content: string; date: string }> {
  console.warn(
    '[ProfileScraper] scrapeRecentActivity() is DEPRECATED. ' +
    'Use scrapeProfileData({ includeActivity: true }) instead for richer activity data.'
  );

  const posts: Array<{ content: string; date: string }> = [];

  try {
    const activitySection = document.querySelector('#recent-activity');
    if (!activitySection) return posts;

    const postItems = activitySection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
    postItems?.forEach((item) => {
      const contentElement = item.querySelector('.visually-hidden');
      const dateElement = item.querySelector('.t-black--light span[aria-hidden="true"]');

      if (contentElement && dateElement) {
        posts.push({
          content: contentElement.textContent?.trim() || '',
          date: dateElement.textContent?.trim() || '',
        });
      }
    });
  } catch (error) {
    console.error('Activity scraping error:', error);
  }

  return posts.slice(0, 10);
}
