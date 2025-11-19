/**
 * Hook to detect LinkedIn page context
 * Determines what type of page user is on to show/hide context-sensitive tabs
 */

import { useState, useEffect } from 'react';
import type { PageContext, PageContextType } from '../types/navigation';

export function usePageContext(): PageContext {
  const [context, setContext] = useState<PageContext>({
    type: 'unknown',
    isProfilePage: false,
    isJobPage: false,
    profileData: null,
    jobData: null,
  });

  useEffect(() => {
    const detectContext = (): PageContext => {
      const url = window.location.href;
      const pathname = window.location.pathname;

      // Profile page detection
      if (url.includes('/in/') || pathname.match(/^\/in\/[^/]+\/?$/)) {
        const nameElement = document.querySelector('h1.text-heading-xlarge');
        const headlineElement = document.querySelector('.text-body-medium');

        return {
          type: 'profile',
          isProfilePage: true,
          isJobPage: false,
          profileData: {
            name: nameElement?.textContent?.trim() || 'Unknown',
            headline: headlineElement?.textContent?.trim() || '',
            profileUrl: url,
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
      return {
        type: 'feed',
        isProfilePage: false,
        isJobPage: false,
        profileData: null,
        jobData: null,
      };
    };

    // Initial detection
    setContext(detectContext());

    // Listen for URL changes (SPA navigation)
    const handleUrlChange = () => {
      setContext(detectContext());
    };

    // Poll for URL changes (LinkedIn is an SPA)
    const intervalId = setInterval(handleUrlChange, 1000);

    // Also listen for custom events from content script
    window.addEventListener('linkedin-extension:page-change', handleUrlChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('linkedin-extension:page-change', handleUrlChange);
    };
  }, []);

  return context;
}
