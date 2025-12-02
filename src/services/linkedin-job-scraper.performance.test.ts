/**
 * Performance Test for LinkedIn Job Scraper - Bug #7: Timeout Too Short
 *
 * This test simulates slow network conditions where job description takes 6-8 seconds to load.
 * It verifies that the current 5-second timeout fails, and that an increased timeout succeeds.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { waitForJobDetails } from './linkedin-job-scraper';

describe('LinkedIn Job Scraper - Timeout Performance Test', () => {
  let pendingTimeouts: NodeJS.Timeout[] = [];

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '';
    pendingTimeouts = [];
  });

  afterEach(() => {
    // Clear all pending timeouts to prevent interference between tests
    pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    pendingTimeouts = [];
    document.body.innerHTML = '';
  });

  it('SHOULD FAIL: Current 5-second timeout fails with 6-8 second slow network', async () => {
    // Simulate slow network: job description loads after 7 seconds (7000ms)
    const SLOW_NETWORK_DELAY = 7000;

    // Schedule DOM update to occur after delay (simulating slow network)
    const timeout1 = setTimeout(() => {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'jobs-description__content';
      descriptionDiv.textContent = 'A'.repeat(150); // Sufficient content (>100 chars)
      document.body.appendChild(descriptionDiv);
    }, SLOW_NETWORK_DELAY);
    pendingTimeouts.push(timeout1);

    // Test with current timeout (5000ms) - should fail because content loads at 7000ms
    const startTime = Date.now();
    const result = await waitForJobDetails(5000);
    const elapsed = Date.now() - startTime;

    // Assertions
    expect(result).toBe(false); // Should timeout before content loads
    expect(elapsed).toBeGreaterThanOrEqual(4900); // Should wait close to full timeout
    expect(elapsed).toBeLessThan(6000); // Should not wait for the 7s delay

    console.log(`✓ Test confirmed: 5-second timeout failed as expected (elapsed: ${elapsed}ms, content arrives at: ${SLOW_NETWORK_DELAY}ms)`);
  }, 10000); // Test timeout set to 10s to allow for delays

  it('SHOULD PASS: Increased 10-second timeout succeeds with 6-8 second slow network', async () => {
    // Simulate slow network: job description loads after 7 seconds
    const SLOW_NETWORK_DELAY = 7000;

    // Schedule DOM update to occur after delay
    const timeout2 = setTimeout(() => {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'jobs-description__content';
      descriptionDiv.textContent = 'A'.repeat(150); // Sufficient content (>100 chars)
      document.body.appendChild(descriptionDiv);
    }, SLOW_NETWORK_DELAY);
    pendingTimeouts.push(timeout2);

    // Test with increased timeout (10000ms) - should succeed
    const startTime = Date.now();
    const result = await waitForJobDetails(10000);
    const elapsed = Date.now() - startTime;

    // Assertions - focus on the key behavior
    expect(result).toBe(true); // Should successfully detect content
    expect(elapsed).toBeLessThan(10000); // Should not need full timeout

    console.log(`✓ Test confirmed: 10-second timeout succeeded (elapsed: ${elapsed}ms, timeout: 10000ms)`);
  }, 15000); // Test timeout set to 15s to allow for delays

  it('Performance benchmark: 8-second load time with various timeout values', async () => {
    const SLOW_NETWORK_DELAY = 8000;

    const testScenarios = [
      { timeout: 5000, expectedResult: false, description: 'Current timeout (5s) - should fail' },
      { timeout: 10000, expectedResult: true, description: 'Proposed timeout (10s) - should succeed' },
      { timeout: 15000, expectedResult: true, description: 'Conservative timeout (15s) - should succeed' },
    ];

    for (const scenario of testScenarios) {
      // Reset DOM
      document.body.innerHTML = '';

      // Schedule DOM update
      const timeout = setTimeout(() => {
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'job-details-jobs-unified-description__content';
        descriptionDiv.textContent = 'B'.repeat(200); // Sufficient content
        document.body.appendChild(descriptionDiv);
      }, SLOW_NETWORK_DELAY);
      pendingTimeouts.push(timeout);

      const startTime = Date.now();
      const result = await waitForJobDetails(scenario.timeout);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(scenario.expectedResult);
      console.log(`  ${scenario.description}: ${result ? 'PASSED' : 'FAILED'} (${elapsed}ms)`);

      // Wait a bit before next test
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, 30000); // Extended timeout for multiple scenarios

  it('Edge case: Content loads exactly at timeout boundary (5s)', async () => {
    // Content loads at exactly 5000ms
    const BOUNDARY_DELAY = 5000;

    const timeout4 = setTimeout(() => {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'jobs-description__content';
      descriptionDiv.textContent = 'C'.repeat(150);
      document.body.appendChild(descriptionDiv);
    }, BOUNDARY_DELAY);
    pendingTimeouts.push(timeout4);

    const result = await waitForJobDetails(5000);

    // At boundary, result is unpredictable due to timing, but should be documented
    console.log(`  Boundary test (5s timeout, 5s delay): ${result ? 'PASSED' : 'FAILED'}`);
    console.log(`  Note: This demonstrates the fragility of the current 5s timeout`);
  }, 10000);
});
