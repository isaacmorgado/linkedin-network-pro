/**
 * Hook to detect LinkedIn page context
 * Determines what type of page user is on to show/hide context-sensitive tabs
 */

import { useState, useEffect } from 'react';
import type { PageContext, PageContextType } from '../types/navigation';

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

    // Try to get profile image
    const imageElement =
      document.querySelector('img.pv-top-card-profile-picture__image') ||
      document.querySelector('img[class*="profile"][class*="photo"]') ||
      document.querySelector('button[aria-label*="profile"] img') ||
      document.querySelector('.pv-top-card img');

    // Extract from JSON-LD as fallback for better reliability
    let jsonLdData: any = null;
    try {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript?.textContent) {
        jsonLdData = JSON.parse(jsonLdScript.textContent);
      }
    } catch (e) {
      // JSON-LD parsing failed, use DOM selectors
    }

    const name = nameElement?.textContent?.trim() ||
                 jsonLdData?.name ||
                 'Unknown Person';

    const headline = headlineElement?.textContent?.trim() ||
                    jsonLdData?.headline ||
                    '';

    const profileImage = (imageElement as HTMLImageElement)?.src ||
                        jsonLdData?.image?.url ||
                        jsonLdData?.image ||
                        null;

    // Debug logging
    console.log('[Uproot] Profile detected:', {
      name,
      headline,
      hasImage: !!profileImage,
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
  if (url.includes('/company/')) {
    return {
      type: 'company',
      isProfilePage: false,
      isJobPage: false,
      profileData: null,
      jobData: null,
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
