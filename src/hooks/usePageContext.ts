/**
 * Hook to detect LinkedIn page context
 * Determines what type of page user is on to show/hide context-sensitive tabs
 */

import { useState, useEffect } from 'react';
import type { PageContext } from '../types/navigation';

// Detect context function (outside hook so it can be called immediately)
function detectContext(): PageContext {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Profile page detection
  if (url.includes('/in/') || pathname.match(/^\/in\/[^/]+\/?$/)) {
    // Try multiple selectors for name (LinkedIn changes DOM frequently)
    const nameElement =
      document.querySelector('h1.text-heading-xlarge') ||
      document.querySelector('h1[class*="text-heading"]') ||
      document.querySelector('[data-anonymize="person-name"]') ||
      document.querySelector('h1');

    // Try multiple selectors for headline
    const headlineElement =
      document.querySelector('div.text-body-medium.break-words') ||
      document.querySelector('div.text-body-medium') ||
      document.querySelector('[data-generated-suggestion-target]') ||
      document.querySelector('.pv-text-details__left-panel .text-body-medium');

    // Try to get profile image - multiple strategies for reliability
    let profileImage: string | null = null;

    // Method 1: Try direct profile photo selectors
    const imageElement =
      document.querySelector('img.pv-top-card-profile-picture__image') ||
      document.querySelector('img[class*="profile"][class*="photo"]') ||
      document.querySelector('button[aria-label*="profile"] img') ||
      document.querySelector('.pv-top-card img') ||
      document.querySelector('.pv-top-card-profile-picture img');

    if (imageElement) {
      profileImage = (imageElement as HTMLImageElement).src;
    }

    // Method 2: Extract from JSON-LD as fallback for better reliability
    let jsonLdData: any = null;
    try {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript?.textContent) {
        jsonLdData = JSON.parse(jsonLdScript.textContent);
      }
    } catch (e) {
      // JSON-LD parsing failed, use DOM selectors
    }

    if (!profileImage && jsonLdData?.image) {
      profileImage = jsonLdData.image.url || jsonLdData.image;
    }

    // Method 3: Try meta tags as additional fallback
    if (!profileImage) {
      const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (ogImage?.content) {
        profileImage = ogImage.content;
      }
    }

    // Method 4: Try LinkedIn relay data (client-side data store)
    if (!profileImage) {
      try {
        const windowAny = window as any;
        if (windowAny.__RELAY_BOOTSTRAP_DATA__) {
          const relayData = windowAny.__RELAY_BOOTSTRAP_DATA__;
          for (const key in relayData) {
            const entry = relayData[key];
            if (entry?.included) {
              // Search for profile photo in included entities
              for (const included of entry.included) {
                if (included?.picture?.rootUrl && !profileImage) {
                  profileImage = included.picture.rootUrl;
                  break;
                }
              }
            }
          }
        }
      } catch (e) {
        // Skip if we can't access window data
      }
    }

    const name = nameElement?.textContent?.trim() ||
                 jsonLdData?.name ||
                 'Unknown Person';

    const headline = headlineElement?.textContent?.trim() ||
                    jsonLdData?.headline ||
                    '';

    // Extract publicId from URL path
    const publicIdMatch = url.match(/\/in\/([^\/]+)/);
    const publicId = publicIdMatch ? publicIdMatch[1] : undefined;

    // Debug logging
    console.log('[Uproot] Profile detected:', {
      name,
      headline,
      profileImage,
      hasImage: !!profileImage,
      publicId,
      url,
    });

    return {
      type: 'profile',
      isProfilePage: true,
      isJobPage: false,
      profileData: {
        name,
        headline,
        profileUrl: url,
        profileImage,
        publicId,
      },
      jobData: null,
    };
  }

  // Job page detection - expanded to catch all job URL patterns
  if (
    url.includes('/jobs/view/') ||
    pathname.startsWith('/jobs/view/') ||
    pathname.includes('/jobs/collections/') ||
    (pathname.startsWith('/jobs/') && (url.includes('currentJobId=') || url.includes('jobId=')))
  ) {
    const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
                        document.querySelector('.jobs-unified-top-card__job-title') ||
                        document.querySelector('[data-job-title]');
    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                          document.querySelector('.jobs-unified-top-card__company-name') ||
                          document.querySelector('[data-company-name]');

    return {
      type: 'job',
      isProfilePage: false,
      isJobPage: true,
      profileData: null,
      jobData: {
        title: titleElement?.textContent?.trim() || 'Unknown Job',
        company: companyElement?.textContent?.trim() || 'Unknown Company',
        jobUrl: url,
      },
    };
  }

  // Company page detection
  if (url.includes('/company/') || pathname.match(/^\/company\/[^/]+\/?$/)) {
    // Try multiple selectors for company name
    const nameElement =
      document.querySelector('h1.org-top-card-summary__title') ||
      document.querySelector('h1[data-anonymize="company-name"]') ||
      document.querySelector('.org-top-card-summary__title') ||
      document.querySelector('h1');

    // Try to get industry/tagline
    const industryElement =
      document.querySelector('.org-top-card-summary__tagline') ||
      document.querySelector('[data-anonymize="industry"]') ||
      document.querySelector('.org-page-details__definition-text');

    // Try to get company logo
    const logoElement =
      document.querySelector('img.org-top-card-primary-content__logo') ||
      document.querySelector('img[alt*="logo" i]') ||
      document.querySelector('.org-top-card-primary-content__logo img');

    // Try to get follower/employee counts
    const statsElements = document.querySelectorAll('.org-top-card-summary-info-list__info-item');
    let followerCount = '';
    let employeeCount = '';

    statsElements.forEach((stat) => {
      const text = stat.textContent?.trim() || '';
      if (text.includes('followers')) {
        followerCount = text.replace(/\s*followers/i, '').trim();
      } else if (text.includes('employees')) {
        employeeCount = text.replace(/\s*employees/i, '').trim();
      }
    });

    const name = nameElement?.textContent?.trim() || 'Unknown Company';
    const industry = industryElement?.textContent?.trim() || '';
    const companyLogo = (logoElement as HTMLImageElement)?.src || null;

    // Debug logging
    console.log('[Uproot] Company detected:', {
      name,
      industry,
      hasLogo: !!companyLogo,
      followerCount,
      employeeCount,
      url,
    });

    return {
      type: 'company',
      isProfilePage: false,
      isJobPage: false,
      profileData: null,
      jobData: null,
      companyData: {
        name,
        industry: industry || undefined,
        companyUrl: url,
        companyLogo,
        followerCount: followerCount || undefined,
        employeeCount: employeeCount || undefined,
      },
    };
  }

  // Messaging page
  if (url.includes('/messaging/')) {
    return {
      type: 'messaging',
      isProfilePage: false,
      isJobPage: false,
      profileData: null,
      jobData: null,
    };
  }

  // Network/connections page
  if (url.includes('/mynetwork/')) {
    return {
      type: 'network',
      isProfilePage: false,
      isJobPage: false,
      profileData: null,
      jobData: null,
    };
  }

  // Default to feed
  console.log('[Uproot] Page type detected: feed/other', { url, pathname });
  return {
    type: 'feed',
    isProfilePage: false,
    isJobPage: false,
    profileData: null,
    jobData: null,
  };
}

export function usePageContext(): PageContext {
  // IMMEDIATE detection on mount - no delay!
  const [context, setContext] = useState<PageContext>(() => detectContext());

  useEffect(() => {
    // Listen for URL changes (SPA navigation)
    const handleUrlChange = () => {
      setContext(detectContext());
    };

    // Poll for URL changes (LinkedIn is an SPA) - FASTER polling: 200ms instead of 1000ms
    const intervalId = setInterval(handleUrlChange, 200);

    // Also listen for custom events from content script
    window.addEventListener('linkedin-extension:page-change', handleUrlChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('linkedin-extension:page-change', handleUrlChange);
    };
  }, []);

  return context;
}
