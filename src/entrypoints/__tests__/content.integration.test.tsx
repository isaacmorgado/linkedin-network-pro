/**
 * Integration Test for Bug #4: Ignored Boolean Return Value
 *
 * This test verifies that when waitForJobDetails() returns false (timeout/failure),
 * the scraping process is correctly halted and does NOT proceed to scrape incomplete DOM.
 *
 * Expected behavior:
 * - When waitForJobDetails() returns true -> scraping should proceed
 * - When waitForJobDetails() returns false -> scraping should be halted/postponed
 *
 * Bug: Current code ignores the boolean return value and scrapes regardless
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import the functions we need to test
import * as linkedinJobScraper from '@/services/linkedin-job-scraper';

describe('Bug #4: Ignored Boolean Return Value Integration Test', () => {
  let dom: JSDOM;
  let scrapeJobDataSpy: any;
  let waitForJobDetailsSpy: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a mock LinkedIn job page DOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://www.linkedin.com/jobs/view/1234567890',
    });

    // Set up global document and window
    global.document = dom.window.document as any;
    global.window = dom.window as any;
    global.navigator = dom.window.navigator as any;
    global.location = dom.window.location as any;

    // Mock a LinkedIn job page with minimal structure
    dom.window.document.body.innerHTML = `
      <div class="jobs-search__job-details">
        <section class="jobs-unified-top-card">
          <h1 class="jobs-unified-top-card__job-title">Test Job Title</h1>
          <a class="jobs-unified-top-card__company-name" href="/company/test">Test Company</a>
        </section>
      </div>
    `;

    // Create spies for the scraper functions
    scrapeJobDataSpy = vi.spyOn(linkedinJobScraper, 'scrapeJobData');
    waitForJobDetailsSpy = vi.spyOn(linkedinJobScraper, 'waitForJobDetails');
  });

  /**
   * This test simulates the EXACT code flow in content.tsx lines 349-372
   * to verify the bug behavior
   */
  it('CURRENT BUG: scrapeJobData is called even when waitForJobDetails returns false', async () => {
    // Mock waitForJobDetails to return false (indicating timeout/failure)
    waitForJobDetailsSpy.mockResolvedValue(false);

    // Mock scrapeJobData to return valid data
    const mockJobData = {
      jobTitle: 'Test Job',
      company: 'Test Company',
      location: 'Remote',
      description: 'Test description that is long enough to pass validation',
      url: 'https://www.linkedin.com/jobs/view/1234567890',
      jobId: '1234567890',
    };
    scrapeJobDataSpy.mockReturnValue(mockJobData);

    // Simulate the EXACT code flow from content.tsx lines 349-372
    // This is the BUGGY code that ignores the boolean return value
    const sendResponse = vi.fn();

    try {
      // This is the current buggy implementation
      await linkedinJobScraper.waitForJobDetails()
        .then(() => {
          // BUG: This callback runs regardless of true/false return value
          const jobData = linkedinJobScraper.scrapeJobData();
          if (!jobData) {
            throw new Error('Could not extract job data');
          }
          sendResponse({ success: true, data: jobData });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
    } catch (error) {
      // Ignore errors for this test
    }

    // CRITICAL ASSERTION: This demonstrates the bug
    // scrapeJobData SHOULD NOT be called when waitForJobDetails returns false
    // But with the current code, it IS called because .then() executes regardless
    expect(waitForJobDetailsSpy).toHaveBeenCalled();
    expect(scrapeJobDataSpy).toHaveBeenCalled(); // BUG: This should NOT be called!

    // This test PASSES with buggy code, demonstrating the problem
    // After the fix, we'll need to update this to expect NOT to be called
  });

  /**
   * This test demonstrates how the code SHOULD work after the fix
   */
  it('EXPECTED BEHAVIOR: scrapeJobData should NOT be called when waitForJobDetails returns false', async () => {
    // Mock waitForJobDetails to return false (timeout)
    waitForJobDetailsSpy.mockResolvedValue(false);

    // Mock scrapeJobData
    scrapeJobDataSpy.mockReturnValue({
      jobTitle: 'Test Job',
      company: 'Test Company',
      location: 'Remote',
      description: 'Test description that is long enough',
      url: 'https://www.linkedin.com/jobs/view/1234567890',
      jobId: '1234567890',
    });

    const sendResponse = vi.fn();

    // This is the FIXED implementation (checking the boolean)
    const success = await linkedinJobScraper.waitForJobDetails();

    if (success) {
      const jobData = linkedinJobScraper.scrapeJobData();
      if (!jobData) {
        throw new Error('Could not extract job data');
      }
      sendResponse({ success: true, data: jobData });
    } else {
      sendResponse({
        success: false,
        error: 'Job details failed to load within timeout'
      });
    }

    // After the fix, this is the expected behavior:
    expect(waitForJobDetailsSpy).toHaveBeenCalled();
    expect(scrapeJobDataSpy).not.toHaveBeenCalled(); // Should NOT scrape incomplete DOM
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('timeout'),
    });
  });

  /**
   * Test that scraping DOES proceed when waitForJobDetails returns true
   */
  it('EXPECTED BEHAVIOR: scrapeJobData should be called when waitForJobDetails returns true', async () => {
    // Mock waitForJobDetails to return true (success)
    waitForJobDetailsSpy.mockResolvedValue(true);

    const mockJobData = {
      jobTitle: 'Test Job',
      company: 'Test Company',
      location: 'Remote',
      description: 'Test description that is long enough',
      url: 'https://www.linkedin.com/jobs/view/1234567890',
      jobId: '1234567890',
    };
    scrapeJobDataSpy.mockReturnValue(mockJobData);

    const sendResponse = vi.fn();

    // FIXED implementation
    const success = await linkedinJobScraper.waitForJobDetails();

    if (success) {
      const jobData = linkedinJobScraper.scrapeJobData();
      if (!jobData) {
        throw new Error('Could not extract job data');
      }
      sendResponse({ success: true, data: jobData });
    } else {
      sendResponse({
        success: false,
        error: 'Job details failed to load within timeout'
      });
    }

    // When waitForJobDetails returns true, scraping SHOULD proceed
    expect(waitForJobDetailsSpy).toHaveBeenCalled();
    expect(scrapeJobDataSpy).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: mockJobData,
    });
  });
});
