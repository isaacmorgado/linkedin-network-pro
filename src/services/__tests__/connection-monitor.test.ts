/**
 * Connection Monitor Service Tests
 * Tests for detecting and logging connection acceptances
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ConnectionPath } from '../../types/watchlist';
import type { FeedItem } from '../../types/feed';

// ============================================================================
// Mock Chrome Storage
// ============================================================================

type StorageData = Record<string, any>;

let mockStorage: StorageData = {};

const mockChromeStorage = {
  local: {
    get: vi.fn((keys: string | string[] | null) => {
      if (keys === null) {
        return Promise.resolve(mockStorage);
      }
      if (Array.isArray(keys)) {
        const result: StorageData = {};
        keys.forEach((key) => {
          if (key in mockStorage) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      return Promise.resolve({});
    }),
    set: vi.fn((items: StorageData) => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach((key) => {
        delete mockStorage[key];
      });
      return Promise.resolve();
    }),
  },
};

// Mock chrome.storage BEFORE importing service
vi.stubGlobal('chrome', {
  storage: mockChromeStorage,
});

// Import actual service functions
import {
  detectConnectionAcceptances,
  logConnectionAcceptance,
  trackConnectionStatus,
} from '../connection-monitor';

const LOGGED_ACCEPTANCES_KEY = 'uproot_logged_acceptances';

// ============================================================================
// Mock Data - Connection Paths
// ============================================================================

const mockConnectionPath1: ConnectionPath = {
  id: 'https://linkedin.com/in/target-person',
  targetName: 'John Target',
  targetProfileUrl: 'https://linkedin.com/in/target-person',
  targetProfileImage: 'https://example.com/john.jpg',
  targetHeadline: 'CEO at Target Company',
  path: [
    {
      name: 'Alice Intermediary',
      profileUrl: 'https://linkedin.com/in/alice',
      profileImage: 'https://example.com/alice.jpg',
      degree: 1,
      connected: false, // Not yet connected
    },
    {
      name: 'Bob Bridge',
      profileUrl: 'https://linkedin.com/in/bob',
      profileImage: 'https://example.com/bob.jpg',
      degree: 2,
      connected: false,
    },
  ],
  totalSteps: 2,
  completedSteps: 0,
  isComplete: false,
  addedAt: Date.now() - 86400000,
  lastUpdated: Date.now() - 86400000,
};

const mockConnectionPath2: ConnectionPath = {
  id: 'https://linkedin.com/in/target-person-2',
  targetName: 'Jane Target',
  targetProfileUrl: 'https://linkedin.com/in/target-person-2',
  targetProfileImage: 'https://example.com/jane.jpg',
  targetHeadline: 'CTO at Another Company',
  path: [
    {
      name: 'Charlie Connect',
      profileUrl: 'https://linkedin.com/in/charlie',
      profileImage: 'https://example.com/charlie.jpg',
      degree: 1,
      connected: true, // Already connected
    },
  ],
  totalSteps: 1,
  completedSteps: 1,
  isComplete: true,
  addedAt: Date.now() - 172800000,
  lastUpdated: Date.now() - 86400000,
};

// ============================================================================
// Tests - detectConnectionAcceptances
// ============================================================================

describe('detectConnectionAcceptances', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should detect newly accepted connections', async () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const paths = [mockConnectionPath1];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    expect(acceptances.length).toBe(1);
    expect(acceptances[0]).toEqual({
      pathId: 'https://linkedin.com/in/target-person',
      stepIndex: 0,
      personName: 'Alice Intermediary',
    });
  });

  it('should return empty array when no new acceptances', async () => {
    const currentConnections: string[] = [];
    const paths = [mockConnectionPath1];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    expect(acceptances.length).toBe(0);
  });

  it('should not duplicate already-logged acceptances', async () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const paths = [mockConnectionPath1];

    // First detection
    const firstAcceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );
    expect(firstAcceptances.length).toBe(1);

    // Log the acceptance
    await logConnectionAcceptance(
      firstAcceptances[0].pathId,
      firstAcceptances[0].stepIndex,
      firstAcceptances[0].personName,
      'https://linkedin.com/in/alice'
    );

    // Second detection - should not detect again
    const secondAcceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );
    expect(secondAcceptances.length).toBe(0);
  });

  it('should handle multiple paths with different acceptances', async () => {
    const currentConnections = [
      'https://linkedin.com/in/alice',
      'https://linkedin.com/in/bob',
    ];
    const paths = [mockConnectionPath1, mockConnectionPath2];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    // Should detect Alice and Bob (Charlie already marked as connected)
    expect(acceptances.length).toBe(2);
    expect(acceptances.some((a) => a.personName === 'Alice Intermediary')).toBe(
      true
    );
    expect(acceptances.some((a) => a.personName === 'Bob Bridge')).toBe(true);
  });

  it('should not detect already-marked connections', async () => {
    const currentConnections = ['https://linkedin.com/in/charlie'];
    const paths = [mockConnectionPath2];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    // Charlie is already marked as connected, should not detect
    expect(acceptances.length).toBe(0);
  });

  it('should handle empty connection paths', async () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const paths: ConnectionPath[] = [];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    expect(acceptances.length).toBe(0);
  });

  it('should handle empty current connections', async () => {
    const currentConnections: string[] = [];
    const paths = [mockConnectionPath1, mockConnectionPath2];

    const acceptances = await detectConnectionAcceptances(
      currentConnections,
      paths
    );

    expect(acceptances.length).toBe(0);
  });
});

// ============================================================================
// Tests - logConnectionAcceptance
// ============================================================================

describe('logConnectionAcceptance', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();

    // Reset mock data to original state
    mockConnectionPath1.path[0].connected = false;
    mockConnectionPath1.path[1].connected = false;
    mockConnectionPath1.completedSteps = 0;
    mockConnectionPath1.isComplete = false;
  });

  it('should create feed item with connection_update type', async () => {
    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      0,
      'Alice Intermediary',
      'https://linkedin.com/in/alice'
    );

    const feedResult = await chrome.storage.local.get('uproot_feed');
    const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

    expect(feedItems.length).toBe(1);
    expect(feedItems[0].type).toBe('connection_update');
    expect(feedItems[0].connectionName).toBe('Alice Intermediary');
    expect(feedItems[0].title).toBe('Connection Accepted');
    expect(feedItems[0].read).toBe(false);
  });

  it('should update connection path storage', async () => {
    // Store timestamp before the operation
    const timestampBefore = Date.now();

    // Initialize storage with a path
    await chrome.storage.local.set({
      uproot_connection_paths: [mockConnectionPath1],
    });

    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      0,
      'Alice Intermediary',
      'https://linkedin.com/in/alice'
    );

    const pathsResult = await chrome.storage.local.get(
      'uproot_connection_paths'
    );
    const paths: ConnectionPath[] =
      pathsResult['uproot_connection_paths'] || [];

    expect(paths.length).toBe(1);
    expect(paths[0].path[0].connected).toBe(true);
    expect(paths[0].completedSteps).toBe(1);
    expect(paths[0].lastUpdated).toBeGreaterThanOrEqual(timestampBefore);
  });

  it('should mark step as connected', async () => {
    // Initialize storage
    await chrome.storage.local.set({
      uproot_connection_paths: [mockConnectionPath1],
    });

    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      0,
      'Alice Intermediary',
      'https://linkedin.com/in/alice'
    );

    const pathsResult = await chrome.storage.local.get(
      'uproot_connection_paths'
    );
    const paths: ConnectionPath[] =
      pathsResult['uproot_connection_paths'] || [];

    const step = paths[0].path[0];
    expect(step.connected).toBe(true);
  });

  it('should update isComplete when all steps are connected', async () => {
    const singleStepPath: ConnectionPath = {
      ...mockConnectionPath1,
      path: [mockConnectionPath1.path[0]], // Only one step
      totalSteps: 1,
    };

    await chrome.storage.local.set({
      uproot_connection_paths: [singleStepPath],
    });

    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      0,
      'Alice Intermediary',
      'https://linkedin.com/in/alice'
    );

    const pathsResult = await chrome.storage.local.get(
      'uproot_connection_paths'
    );
    const paths: ConnectionPath[] =
      pathsResult['uproot_connection_paths'] || [];

    expect(paths[0].isComplete).toBe(true);
    expect(paths[0].completedSteps).toBe(1);
  });

  it('should store acceptance in logged list', async () => {
    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      0,
      'Alice Intermediary',
      'https://linkedin.com/in/alice'
    );

    const result = await chrome.storage.local.get(LOGGED_ACCEPTANCES_KEY);
    const logged: string[] = result[LOGGED_ACCEPTANCES_KEY] || [];

    expect(logged.length).toBe(1);
    expect(logged[0]).toBe(
      'https://linkedin.com/in/target-person_https://linkedin.com/in/alice'
    );
  });

  it('should handle invalid step index gracefully', async () => {
    await chrome.storage.local.set({
      uproot_connection_paths: [mockConnectionPath1],
    });

    // Should not throw error with invalid index
    await logConnectionAcceptance(
      'https://linkedin.com/in/target-person',
      999, // Invalid index
      'Invalid Person',
      'https://linkedin.com/in/invalid'
    );

    // Path should remain unchanged
    const pathsResult = await chrome.storage.local.get(
      'uproot_connection_paths'
    );
    const paths: ConnectionPath[] =
      pathsResult['uproot_connection_paths'] || [];

    expect(paths[0].completedSteps).toBe(0);
  });

  it('should handle non-existent path gracefully', async () => {
    // No paths in storage
    await chrome.storage.local.set({ uproot_connection_paths: [] });

    // Should not throw error
    await logConnectionAcceptance(
      'https://linkedin.com/in/non-existent',
      0,
      'Non Existent',
      'https://linkedin.com/in/non-existent'
    );

    // Feed item should still be created
    const feedResult = await chrome.storage.local.get('uproot_feed');
    const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];
    expect(feedItems.length).toBe(1);
  });
});

// ============================================================================
// Tests - trackConnectionStatus
// ============================================================================

describe('trackConnectionStatus', () => {
  it('should return connected status for accepted connections', () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const status = trackConnectionStatus(
      'https://linkedin.com/in/alice',
      currentConnections
    );

    expect(status).toBe('connected');
  });

  it('should return not_connected for not-yet-accepted connections', () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const status = trackConnectionStatus(
      'https://linkedin.com/in/bob',
      currentConnections
    );

    expect(status).toBe('not_connected');
  });

  it('should handle empty connections list', () => {
    const currentConnections: string[] = [];
    const status = trackConnectionStatus(
      'https://linkedin.com/in/alice',
      currentConnections
    );

    expect(status).toBe('not_connected');
  });

  it('should be case sensitive for profile URLs', () => {
    const currentConnections = ['https://linkedin.com/in/alice'];
    const status = trackConnectionStatus(
      'https://linkedin.com/in/Alice', // Different case
      currentConnections
    );

    // Should not match due to case difference
    expect(status).toBe('not_connected');
  });

  it('should handle multiple connections', () => {
    const currentConnections = [
      'https://linkedin.com/in/alice',
      'https://linkedin.com/in/bob',
      'https://linkedin.com/in/charlie',
    ];

    expect(
      trackConnectionStatus('https://linkedin.com/in/alice', currentConnections)
    ).toBe('connected');
    expect(
      trackConnectionStatus('https://linkedin.com/in/bob', currentConnections)
    ).toBe('connected');
    expect(
      trackConnectionStatus('https://linkedin.com/in/david', currentConnections)
    ).toBe('not_connected');
  });
});
