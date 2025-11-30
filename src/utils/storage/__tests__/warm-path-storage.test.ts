/**
 * Warm Path Storage Tests
 * Unit tests for warm path deduplication storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WarmPathDedupeEntry } from '../warm-path-storage';

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

// Mock logger to reduce noise
vi.mock('../../logger', () => ({
  log: {
    trackAsync: vi.fn((_category: string, _operation: string, fn: () => any) => fn()),
    debug: vi.fn(),
    info: vi.fn(),
    change: vi.fn(),
    error: vi.fn(),
  },
  LogCategory: {
    STORAGE: 'STORAGE',
  },
}));

// Import actual storage functions AFTER mocking
import {
  getWarmPathDedupe,
  addWarmPathDedupe,
  pruneWarmPathDedupe,
  isDuplicateWarmPath,
  clearWarmPathDedupe,
} from '../warm-path-storage';

// ============================================================================
// Helper Functions
// ============================================================================

const DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ============================================================================
// Tests
// ============================================================================

describe('Warm Path Storage', () => {
  beforeEach(async () => {
    // Reset mock storage before each test
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Deduplication
  // ==========================================================================

  describe('Deduplication', () => {
    it('should detect duplicate warm path within 30-day window', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(isDuplicate).toBe(true);
    });

    it('should not detect duplicate for different company', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/openai',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(isDuplicate).toBe(false);
    });

    it('should not detect duplicate for different person', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/mike',
        1
      );

      expect(isDuplicate).toBe(false);
    });

    it('should not detect duplicate for different path length', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        2
      );

      expect(isDuplicate).toBe(false);
    });

    it('should not detect duplicate after 30-day window expires', async () => {
      const now = Date.now();
      const expiredTimestamp = now - DEDUPE_WINDOW_MS - 1000; // 30 days + 1 second ago

      // Manually add entry with expired timestamp
      const entries: WarmPathDedupeEntry[] = [
        {
          key: 'https://linkedin.com/company/anthropic_https://linkedin.com/in/sarah_1',
          targetCompanyUrl: 'https://linkedin.com/company/anthropic',
          viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
          pathLength: 1,
          createdAt: expiredTimestamp,
        },
      ];

      await chrome.storage.local.set({ uproot_warm_path_dedupe: entries });

      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(isDuplicate).toBe(false);
    });

    it('should handle empty dedupe storage', async () => {
      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(isDuplicate).toBe(false);
    });
  });

  // ==========================================================================
  // Pruning
  // ==========================================================================

  describe('Pruning', () => {
    it('should prune entries older than 30 days', async () => {
      const now = Date.now();

      const entries: WarmPathDedupeEntry[] = [
        {
          key: 'old_entry_1',
          targetCompanyUrl: 'https://linkedin.com/company/anthropic',
          viaPersonProfileUrl: 'https://linkedin.com/in/old1',
          pathLength: 1,
          createdAt: now - 35 * 24 * 60 * 60 * 1000, // 35 days ago (should be pruned)
        },
        {
          key: 'recent_entry_1',
          targetCompanyUrl: 'https://linkedin.com/company/openai',
          viaPersonProfileUrl: 'https://linkedin.com/in/recent1',
          pathLength: 1,
          createdAt: now - 15 * 24 * 60 * 60 * 1000, // 15 days ago (should remain)
        },
        {
          key: 'recent_entry_2',
          targetCompanyUrl: 'https://linkedin.com/company/meta',
          viaPersonProfileUrl: 'https://linkedin.com/in/recent2',
          pathLength: 1,
          createdAt: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago (should remain)
        },
      ];

      await chrome.storage.local.set({ uproot_warm_path_dedupe: entries });

      await pruneWarmPathDedupe();

      const remainingEntries = await getWarmPathDedupe();

      expect(remainingEntries).toHaveLength(2);
      expect(remainingEntries[0].key).toBe('recent_entry_1');
      expect(remainingEntries[1].key).toBe('recent_entry_2');
    });

    it('should not prune entries within 30-day window', async () => {
      const now = Date.now();

      const entries: WarmPathDedupeEntry[] = [
        {
          key: 'entry_1',
          targetCompanyUrl: 'https://linkedin.com/company/anthropic',
          viaPersonProfileUrl: 'https://linkedin.com/in/person1',
          pathLength: 1,
          createdAt: now - 29 * 24 * 60 * 60 * 1000, // 29 days ago
        },
        {
          key: 'entry_2',
          targetCompanyUrl: 'https://linkedin.com/company/openai',
          viaPersonProfileUrl: 'https://linkedin.com/in/person2',
          pathLength: 1,
          createdAt: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        },
      ];

      await chrome.storage.local.set({ uproot_warm_path_dedupe: entries });

      await pruneWarmPathDedupe();

      const remainingEntries = await getWarmPathDedupe();

      expect(remainingEntries).toHaveLength(2);
    });

    it('should handle empty storage when pruning', async () => {
      await expect(pruneWarmPathDedupe()).resolves.not.toThrow();

      const entries = await getWarmPathDedupe();
      expect(entries).toEqual([]);
    });

    it('should prune all entries if all are expired', async () => {
      const now = Date.now();

      const entries: WarmPathDedupeEntry[] = [
        {
          key: 'old_entry_1',
          targetCompanyUrl: 'https://linkedin.com/company/anthropic',
          viaPersonProfileUrl: 'https://linkedin.com/in/old1',
          pathLength: 1,
          createdAt: now - 35 * 24 * 60 * 60 * 1000,
        },
        {
          key: 'old_entry_2',
          targetCompanyUrl: 'https://linkedin.com/company/openai',
          viaPersonProfileUrl: 'https://linkedin.com/in/old2',
          pathLength: 1,
          createdAt: now - 40 * 24 * 60 * 60 * 1000,
        },
      ];

      await chrome.storage.local.set({ uproot_warm_path_dedupe: entries });

      await pruneWarmPathDedupe();

      const remainingEntries = await getWarmPathDedupe();
      expect(remainingEntries).toEqual([]);
    });
  });

  // ==========================================================================
  // Adding Entries
  // ==========================================================================

  describe('Adding Entries', () => {
    it('should add new dedupe entry with correct key format', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const entries = await getWarmPathDedupe();

      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe(
        'https://linkedin.com/company/anthropic_https://linkedin.com/in/sarah_1'
      );
      expect(entries[0].targetCompanyUrl).toBe('https://linkedin.com/company/anthropic');
      expect(entries[0].viaPersonProfileUrl).toBe('https://linkedin.com/in/sarah');
      expect(entries[0].pathLength).toBe(1);
      expect(entries[0].createdAt).toBeGreaterThan(0);
    });

    it('should not add duplicate entries with same key', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      const entries = await getWarmPathDedupe();
      expect(entries).toHaveLength(1);
    });

    it('should add entries with different path lengths', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 2,
      });

      const entries = await getWarmPathDedupe();
      expect(entries).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Clearing
  // ==========================================================================

  describe('Clearing', () => {
    it('should clear all dedupe entries', async () => {
      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
        pathLength: 1,
      });

      await addWarmPathDedupe({
        targetCompanyUrl: 'https://linkedin.com/company/openai',
        viaPersonProfileUrl: 'https://linkedin.com/in/mike',
        pathLength: 1,
      });

      let entries = await getWarmPathDedupe();
      expect(entries).toHaveLength(2);

      await clearWarmPathDedupe();

      entries = await getWarmPathDedupe();
      expect(entries).toEqual([]);
    });

    it('should handle clearing empty storage', async () => {
      await expect(clearWarmPathDedupe()).resolves.not.toThrow();

      const entries = await getWarmPathDedupe();
      expect(entries).toEqual([]);
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should auto-prune expired entries when checking for duplicates', async () => {
      const now = Date.now();

      const entries: WarmPathDedupeEntry[] = [
        {
          key: 'https://linkedin.com/company/expired_https://linkedin.com/in/expired_1',
          targetCompanyUrl: 'https://linkedin.com/company/expired',
          viaPersonProfileUrl: 'https://linkedin.com/in/expired',
          pathLength: 1,
          createdAt: now - 35 * 24 * 60 * 60 * 1000, // 35 days ago
        },
        {
          key: 'https://linkedin.com/company/anthropic_https://linkedin.com/in/sarah_1',
          targetCompanyUrl: 'https://linkedin.com/company/anthropic',
          viaPersonProfileUrl: 'https://linkedin.com/in/sarah',
          pathLength: 1,
          createdAt: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        },
      ];

      await chrome.storage.local.set({ uproot_warm_path_dedupe: entries });

      // isDuplicateWarmPath should auto-prune expired entries
      const isDuplicate = await isDuplicateWarmPath(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(isDuplicate).toBe(true);

      // Expired entry should be removed
      const remainingEntries = await getWarmPathDedupe();
      expect(remainingEntries).toHaveLength(1);
      expect(remainingEntries[0].key).toBe('https://linkedin.com/company/anthropic_https://linkedin.com/in/sarah_1');
    });
  });
});
