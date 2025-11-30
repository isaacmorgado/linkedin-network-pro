/**
 * Background Script Race Condition Tests
 *
 * Tests for Bug #2: Race condition in background.ts where async callbacks
 * don't properly await responses, causing the message channel to close
 * before data is sent back to the UI.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mock Chrome Extension APIs
// ============================================================================

let messageListeners: Array<(_message: any, _sender: any, sendResponse: (response: any) => void) => boolean | void> = [];

const mockChromeTabs = {
  query: vi.fn(),
  sendMessage: vi.fn(),
  get: vi.fn(),
};

const mockChromeRuntime = {
  lastError: null as any,
  onMessage: {
    addListener: vi.fn((listener) => {
      messageListeners.push(listener);
    }),
    removeListener: vi.fn((listener) => {
      messageListeners = messageListeners.filter(l => l !== listener);
    }),
  },
  sendMessage: vi.fn(),
  getManifest: vi.fn().mockReturnValue({
    version: '1.0.0',
  }),
};

// Set up global chrome object
global.chrome = {
  tabs: mockChromeTabs,
  runtime: mockChromeRuntime,
} as any;

// ============================================================================
// Test Suite: Background Message Race Condition
// ============================================================================

describe('Background Script - Message Race Condition (Bug #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageListeners = [];
    mockChromeRuntime.lastError = null;
  });

  it('should demonstrate race condition: BROKEN pattern from original code', async () => {
    // This test demonstrates the BROKEN pattern (before fix)
    // It shows what happens when we DON'T await the callback

    let asyncFunctionExited = false;
    const responses: any[] = [];

    // Mock the BROKEN pattern (original code)
    const brokenHandler = async (_message: any, _sender: any, sendResponse: (r: any) => void) => {
      const [activeTab] = await mockChromeTabs.query({ active: true, currentWindow: true });

      if (!activeTab.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // BROKEN: The callback is not awaited (original code pattern)
      chrome.tabs.sendMessage(activeTab.id, { type: 'ANALYZE_CURRENT_JOB' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });

      // The async function exits here, causing race condition
    };

    // Mock implementations
    mockChromeTabs.query.mockResolvedValue([{ id: 123 }]);
    mockChromeTabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ success: true, data: 'test' });
        }
      }, 50);
    });

    const sendResponse = vi.fn((response) => {
      responses.push({ response, asyncFunctionExited });
    });

    // Execute the broken handler
    const handlerPromise = brokenHandler(
      { type: 'ANALYZE_CURRENT_JOB' },
      { tab: { id: 1 } },
      sendResponse
    );

    // Wait for the async function to complete
    await handlerPromise;
    asyncFunctionExited = true;

    // At this point, the async function has exited
    expect(asyncFunctionExited).toBe(true);

    // Wait for callback to execute
    await new Promise(resolve => setTimeout(resolve, 60));

    // DEMONSTRATES RACE CONDITION: sendResponse called AFTER async function exited
    expect(sendResponse).toHaveBeenCalled();
    const firstResponse = responses[0];
    expect(firstResponse.asyncFunctionExited).toBe(true); // BUG: Response sent after handler exited
  });

  it('should properly handle async chrome.tabs.sendMessage with Promise-based approach', async () => {
    // This test shows the CORRECT implementation after the fix

    // Mock chrome.tabs.query
    mockChromeTabs.query.mockResolvedValue([{ id: 123 }]);

    // Create a Promise-based wrapper that properly awaits the response
    const sendMessageAsync = (tabId: number, message: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    };

    // Mock the response with delay
    mockChromeTabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ success: true, data: { jobTitle: 'Software Engineer' } });
        }
      }, 50);
    });

    // Simulate proper async handling
    const response = await sendMessageAsync(123, { type: 'ANALYZE_CURRENT_JOB' });

    expect(response).toEqual({ success: true, data: { jobTitle: 'Software Engineer' } });
  });

  it('should handle chrome.runtime.lastError in async callback', async () => {
    // Mock chrome.tabs.query
    mockChromeTabs.query.mockResolvedValue([{ id: 123 }]);

    // Simulate an error in the content script
    mockChromeTabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
      setTimeout(() => {
        mockChromeRuntime.lastError = { message: 'Content script not responding' };
        if (callback) {
          callback(null);
        }
        // Reset after callback
        setTimeout(() => {
          mockChromeRuntime.lastError = null;
        }, 0);
      }, 10);
    });

    // Test error handling
    const sendMessageAsync = (tabId: number, message: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    };

    await expect(sendMessageAsync(123, { type: 'ANALYZE_CURRENT_JOB' }))
      .rejects.toThrow('Content script not responding');
  });

  it('should demonstrate the exact issue at lines 217-225 in background.ts', async () => {
    // This test replicates the exact problematic pattern from background.ts

    let asyncFunctionExited = false;
    let callbackExecuted = false;
    const responses: any[] = [];

    // Mock the problematic pattern from lines 217-225
    const problematicHandler = async (_message: any, _sender: any, sendResponse: (r: any) => void) => {
      const [activeTab] = await mockChromeTabs.query({ active: true, currentWindow: true });

      if (!activeTab.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // THIS IS THE BUG: The callback is not awaited
      chrome.tabs.sendMessage(activeTab.id, { type: 'ANALYZE_CURRENT_JOB' }, (response) => {
        callbackExecuted = true;
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });

      // The async function exits here (implicitly returns undefined)
      // This causes the message channel to close
    };

    // Mock implementations
    mockChromeTabs.query.mockResolvedValue([{ id: 123 }]);
    mockChromeTabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ success: true, data: 'test' });
        }
      }, 50);
    });

    // Create a sendResponse that tracks when the async function exits
    const sendResponse = vi.fn((response) => {
      responses.push({ response, asyncFunctionExited });
    });

    // Execute the problematic handler
    const handlerPromise = problematicHandler(
      { type: 'ANALYZE_CURRENT_JOB' },
      { tab: { id: 1 } },
      sendResponse
    );

    // Wait for the async function to complete
    await handlerPromise;
    asyncFunctionExited = true;

    // At this point, the async function has exited
    expect(asyncFunctionExited).toBe(true);
    expect(callbackExecuted).toBe(false); // Callback hasn't fired yet

    // Wait for callback to execute
    await new Promise(resolve => setTimeout(resolve, 60));

    // Now callback has executed
    expect(callbackExecuted).toBe(true);
    expect(sendResponse).toHaveBeenCalled();

    // CRITICAL: The sendResponse was called AFTER the async function exited
    // This is the race condition!
    const firstResponse = responses[0];
    expect(firstResponse.asyncFunctionExited).toBe(true); // BUG: Response sent after handler exited
  });
});

// ============================================================================
// Test Suite: Correct Implementation After Fix
// ============================================================================

describe('Background Script - Correct Implementation (After Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChromeRuntime.lastError = null;
  });

  it('should properly await chrome.tabs.sendMessage before sending response', async () => {
    // This demonstrates the CORRECT implementation

    let asyncFunctionExited = false;
    const responses: any[] = [];

    // Correct implementation: await the Promise
    const correctHandler = async (_message: any, _sender: any, sendResponse: (r: any) => void) => {
      const [activeTab] = await mockChromeTabs.query({ active: true, currentWindow: true });

      if (!activeTab.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // CORRECT: Wrap in Promise and await it
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(activeTab.id!, { type: 'ANALYZE_CURRENT_JOB' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        sendResponse(response);
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    };

    // Mock implementations
    mockChromeTabs.query.mockResolvedValue([{ id: 123 }]);
    mockChromeTabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ success: true, data: 'test' });
        }
      }, 50);
    });

    const sendResponse = vi.fn((response) => {
      responses.push({ response, asyncFunctionExited });
    });

    // Execute the correct handler
    const handlerPromise = correctHandler(
      { type: 'ANALYZE_CURRENT_JOB' },
      { tab: { id: 1 } },
      sendResponse
    );

    // Wait for the async function to complete
    await handlerPromise;
    asyncFunctionExited = true;

    // CORRECT: sendResponse is called BEFORE the async function exits
    expect(sendResponse).toHaveBeenCalled();
    const firstResponse = responses[0];
    expect(firstResponse.asyncFunctionExited).toBe(false); // Response sent BEFORE handler exits
    expect(firstResponse.response).toEqual({ success: true, data: 'test' });
  });
});
