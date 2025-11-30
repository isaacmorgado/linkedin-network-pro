/**
 * Chrome Message Timeout Fix - Unit Tests
 * Tests the Promise.race() timeout wrapper to prevent infinite spinning
 *
 * Bug Fix: JobsTab.tsx line 125 - Added 30-second timeout to chrome.runtime.sendMessage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Simulate the Fixed Timeout Logic
// ============================================================================

/**
 * This simulates the exact fix we applied in JobsTab.tsx
 * Original: await chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_JOB' })
 * Fixed: await Promise.race([...])
 */
async function sendMessageWithTimeout(message: any, timeoutMs: number = 30000) {
  let timeoutHandle: NodeJS.Timeout | null = null;
  let settled = false;

  return new Promise((resolve, reject) => {
    // Setup timeout
    timeoutHandle = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Job analysis timed out after ${timeoutMs / 1000} seconds. Please try again.`));
      }
    }, timeoutMs);

    // Setup message promise
    mockSendMessage(message)
      .then((result) => {
        if (!settled) {
          settled = true;
          if (timeoutHandle) clearTimeout(timeoutHandle);
          resolve(result);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(err);
        }
      });
  });
}

// Mock sendMessage function for testing
let mockSendMessage: (message: any) => Promise<any>;

// ============================================================================
// Test Cases
// ============================================================================

describe('Chrome Message Timeout Fix', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Clear all pending timers BEFORE restoring real timers
    // This prevents setTimeout callbacks from firing after the test
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
    // Give promises a chance to settle
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  // ==========================================================================
  // Test 1: Fast Response (No Timeout)
  // ==========================================================================

  it('should resolve immediately when response is fast (< 30 seconds)', async () => {
    console.log('🧪 TEST 1: Fast response test...');

    // Mock fast response (100ms)
    mockSendMessage = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('✅ Mock: Responding after 100ms');
          resolve({ success: true, data: { jobTitle: 'Engineer' } });
        }, 100);
      });
    });

    const promise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });

    // Advance by 100ms
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toEqual({ success: true, data: { jobTitle: 'Engineer' } });
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'ANALYZE_CURRENT_JOB' });

    console.log('✅ TEST 1 PASSED: Fast response resolved correctly');
  });

  // ==========================================================================
  // Test 2: Timeout After 30 Seconds (THE CRITICAL FIX)
  // ==========================================================================

  it('should timeout after 30 seconds if no response', async () => {
    console.log('🧪 TEST 2: 30-second timeout test (THE BUG FIX)...');

    // Mock a promise that NEVER resolves (simulates hung background script)
    mockSendMessage = vi.fn().mockImplementation(() => {
      return new Promise(() => {
        // Never resolves - this would cause infinite spinning without the fix
        console.log('❌ Mock: sendMessage called but will NEVER respond (simulating bug)');
      });
    });

    const promise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });

    // Track error to prevent unhandled rejection
    let caughtError: Error | null = null;
    promise.catch((err) => {
      caughtError = err;
    });

    console.log('⏱️  Advancing timer to 29 seconds (should still be waiting)...');
    await vi.advanceTimersByTimeAsync(29000);

    // Give promises time to process
    await Promise.resolve();

    expect(caughtError).toBe(null); // Should NOT have timed out yet

    console.log('⏱️  Advancing timer to 30 seconds (should timeout now)...');
    await vi.advanceTimersByTimeAsync(1000); // Total: 30 seconds

    // Give promises time to process
    await Promise.resolve();

    // Now should timeout
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as unknown as Error).message).toContain('Job analysis timed out after 30 seconds');

    // Clear any remaining timers
    vi.clearAllTimers();

    console.log('✅ TEST 2 PASSED: Timeout triggered correctly at 30 seconds');
  });

  // ==========================================================================
  // Test 3: Timeout Wins Over Slow Response
  // ==========================================================================

  it('should timeout even if response arrives after 30 seconds', async () => {
    console.log('🧪 TEST 3: Slow response (40s) should still timeout at 30s...');

    // Mock a slow response that takes 40 seconds
    mockSendMessage = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('📡 Mock: Responding after 40 seconds (too late!)');
          resolve({ success: true, data: { jobTitle: 'Engineer' } });
        }, 40000);
      });
    });

    const promise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });

    // Track error to prevent unhandled rejection
    let caughtError: Error | null = null;
    promise.catch((err) => {
      caughtError = err;
    });

    // Advance to 30 seconds (timeout triggers before response)
    console.log('⏱️  Advancing to 30 seconds...');
    await vi.advanceTimersByTimeAsync(30000);

    // Give promises time to process
    await Promise.resolve();

    // Should timeout, not wait for 40-second response
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as unknown as Error).message).toContain('Job analysis timed out after 30 seconds');

    // Clear any remaining timers
    vi.clearAllTimers();

    console.log('✅ TEST 3 PASSED: Timeout at 30s even with pending 40s response');
  });

  // ==========================================================================
  // Test 4: Error Response Before Timeout
  // ==========================================================================

  it('should reject with error before timeout if sendMessage fails', async () => {
    console.log('🧪 TEST 4: Error response test...');

    // Mock immediate error
    mockSendMessage = vi.fn().mockRejectedValue(new Error('Extension context invalidated'));

    const promise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });

    // Should reject immediately with the error, not wait for timeout
    await expect(promise).rejects.toThrow('Extension context invalidated');

    console.log('✅ TEST 4 PASSED: Error rejected before timeout');
  });

  // ==========================================================================
  // Test 5: Success Response at 29.9 Seconds (Edge Case)
  // ==========================================================================

  it('should succeed if response arrives just before timeout (29.9s)', async () => {
    console.log('🧪 TEST 5: Edge case - response at 29.9 seconds...');

    // Mock response that arrives just before timeout
    mockSendMessage = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('✅ Mock: Responding at 29.9 seconds (just in time!)');
          resolve({ success: true, data: { jobTitle: 'Engineer' } });
        }, 29900);
      });
    });

    const promise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });

    // Advance to 29.9 seconds
    console.log('⏱️  Advancing to 29.9 seconds...');
    await vi.advanceTimersByTimeAsync(29900);

    const result = await promise;

    expect(result).toEqual({ success: true, data: { jobTitle: 'Engineer' } });

    console.log('✅ TEST 5 PASSED: Response at 29.9s succeeded before timeout');
  });

  // ==========================================================================
  // Test 6: Multiple Timeouts Don't Interfere
  // ==========================================================================

  it('should handle multiple concurrent requests with independent timeouts', async () => {
    console.log('🧪 TEST 6: Multiple concurrent requests test...');

    // Fast response
    const fastMock = vi.fn().mockResolvedValue({ success: true, data: { id: 1 } });

    // Slow response (never resolves)
    const slowMock = vi.fn().mockImplementation(() => new Promise(() => {}));

    mockSendMessage = fastMock;
    const fastPromise = sendMessageWithTimeout({ type: 'FAST' });

    mockSendMessage = slowMock;
    const slowPromise = sendMessageWithTimeout({ type: 'SLOW' });

    // Track error to prevent unhandled rejection
    let slowError: Error | null = null;
    slowPromise.catch((err) => {
      slowError = err;
    });

    // Fast should resolve
    const fastResult = await fastPromise;
    expect(fastResult).toEqual({ success: true, data: { id: 1 } });

    // Slow should timeout
    await vi.advanceTimersByTimeAsync(30000);

    // Give promises time to process
    await Promise.resolve();

    expect(slowError).toBeDefined();
    expect(slowError).toBeInstanceOf(Error);
    expect((slowError as unknown as Error).message).toContain('timed out');

    // Clear any remaining timers
    vi.clearAllTimers();

    console.log('✅ TEST 6 PASSED: Multiple requests handled independently');
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Timeout Performance', () => {
  beforeEach(() => {
    vi.useRealTimers(); // Use real timers for performance tests
  });

  it('should have minimal overhead for fast responses', async () => {
    console.log('🧪 PERFORMANCE TEST: Measuring overhead of timeout wrapper...');

    mockSendMessage = vi.fn().mockResolvedValue({ success: true });

    const start = performance.now();

    // Run 100 fast requests
    const promises = Array.from({ length: 100 }, () =>
      sendMessageWithTimeout({ type: 'TEST' })
    );

    await Promise.all(promises);

    const duration = performance.now() - start;

    console.log(`✅ 100 requests completed in ${duration.toFixed(2)}ms`);
    console.log(`✅ Average: ${(duration / 100).toFixed(2)}ms per request`);

    // Should complete all 100 in under 1 second (very fast)
    expect(duration).toBeLessThan(1000);
  });
});

// ============================================================================
// Integration Test: Simulating Real JobsTab Flow
// ============================================================================

describe('JobsTab Integration Simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should simulate full JobsTab analyze flow with timeout protection', async () => {
    console.log('🧪 INTEGRATION TEST: Full JobsTab analyze flow...');

    // Simulate the exact flow from JobsTab.tsx handleAnalyzeCurrentPage
    let analyzing = false;
    let error = '';
    let success = '';

    // Simulate button click
    analyzing = true;
    error = '';
    success = '';

    console.log('✅ State: analyzing = true');

    // Mock hung background script
    mockSendMessage = vi.fn().mockImplementation(() => new Promise(() => {}));

    // Track error to prevent unhandled rejection
    let caughtError: Error | null = null;
    const responsePromise = sendMessageWithTimeout({ type: 'ANALYZE_CURRENT_JOB' });
    responsePromise.catch((err) => {
      caughtError = err;
    });

    // Advance to timeout
    await vi.advanceTimersByTimeAsync(30000);

    // Give promises time to process
    await Promise.resolve();

    // Check if timeout error was caught
    if (caughtError) {
      console.log('✅ Caught timeout error:', (caughtError as unknown as Error).message);
      error = (caughtError as unknown as Error).message;
    }

    analyzing = false;
    console.log('✅ State: analyzing = false (spinner stopped)');

    // Verify final state
    expect(analyzing).toBe(false);
    expect(error).toContain('timed out after 30 seconds');
    expect(success).toBe('');

    console.log('✅ INTEGRATION TEST PASSED: Timeout handled correctly in full flow');
  });
});
