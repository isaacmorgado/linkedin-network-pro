/**
 * People Watchlist Storage Tests
 * Unit tests for people watchlist storage operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WatchlistPerson } from '../../../types/watchlist';

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
  getWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistPerson,
  isInWatchlist,
} from '../watchlist-storage';

// ============================================================================
// Mock Data
// ============================================================================

const mockPersonSarah: Omit<WatchlistPerson, 'id' | 'addedAt'> = {
  name: 'Sarah Chen',
  headline: 'Senior ML Engineer at Anthropic',
  profileUrl: 'https://linkedin.com/in/sarachen',
  profileImage: 'https://example.com/sarah.jpg',
};

const mockPersonMike: Omit<WatchlistPerson, 'id' | 'addedAt'> = {
  name: 'Mike Johnson',
  headline: 'Product Manager at Stripe',
  profileUrl: 'https://linkedin.com/in/mikejohnson',
  profileImage: 'https://example.com/mike.jpg',
  notes: 'Met at conference',
  tags: ['recruiter', 'warm intro'],
};

const mockPersonAlice: Omit<WatchlistPerson, 'id' | 'addedAt'> = {
  name: 'Alice Smith',
  headline: 'Engineering Manager at Google',
  profileUrl: 'https://linkedin.com/in/alicesmith',
};

// ============================================================================
// Tests
// ============================================================================

describe('People Watchlist Storage', () => {
  beforeEach(() => {
    // Reset mock storage before each test
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Adding People
  // ==========================================================================

  describe('Adding People', () => {
    it('should add a new person to watchlist', async () => {
      const person = await addToWatchlist(mockPersonSarah);

      expect(person).toMatchObject({
        name: 'Sarah Chen',
        headline: 'Senior ML Engineer at Anthropic',
        profileUrl: 'https://linkedin.com/in/sarachen',
      });
      expect(person.id).toBe('https://linkedin.com/in/sarachen');
      expect(person.addedAt).toBeGreaterThan(0);

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
      expect(watchlist[0]).toEqual(person);
    });

    it('should add person with optional fields (profileImage, notes, tags)', async () => {
      const person = await addToWatchlist(mockPersonMike);

      expect(person.profileImage).toBe('https://example.com/mike.jpg');
      expect(person.notes).toBe('Met at conference');
      expect(person.tags).toEqual(['recruiter', 'warm intro']);
    });

    it('should add person without optional fields', async () => {
      const person = await addToWatchlist(mockPersonAlice);

      expect(person.profileImage).toBeUndefined();
      expect(person.notes).toBeUndefined();
      expect(person.tags).toBeUndefined();
      expect(person.lastViewed).toBeUndefined();
    });
  });

  // ==========================================================================
  // Duplicate Prevention
  // ==========================================================================

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate people by ID (profileUrl)', async () => {
      const person1 = await addToWatchlist(mockPersonSarah);
      const person2 = await addToWatchlist(mockPersonSarah);

      expect(person1.id).toBe(person2.id);
      expect(person1.addedAt).toBe(person2.addedAt);

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
    });

    it('should prevent duplicate by profileUrl even if different name', async () => {
      const person1 = await addToWatchlist(mockPersonSarah);

      const differentName: Omit<WatchlistPerson, 'id' | 'addedAt'> = {
        ...mockPersonSarah,
        name: 'Sarah C.', // Different name, same URL
      };

      const person2 = await addToWatchlist(differentName);

      expect(person1.id).toBe(person2.id);
      expect(person2.name).toBe('Sarah Chen'); // Should keep original

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Updating People
  // ==========================================================================

  describe('Updating People', () => {
    it('should update person (notes)', async () => {
      const person = await addToWatchlist(mockPersonSarah);

      await updateWatchlistPerson(person.id, {
        notes: 'Great connection, works at Anthropic',
      });

      const watchlist = await getWatchlist();
      expect(watchlist[0].notes).toBe('Great connection, works at Anthropic');
      expect(watchlist[0].name).toBe('Sarah Chen'); // Other fields unchanged
    });

    it('should update person (tags)', async () => {
      const person = await addToWatchlist(mockPersonAlice);

      await updateWatchlistPerson(person.id, {
        tags: ['engineer', 'manager', 'google'],
      });

      const watchlist = await getWatchlist();
      expect(watchlist[0].tags).toEqual(['engineer', 'manager', 'google']);
    });

    it('should update person (lastViewed timestamp)', async () => {
      const person = await addToWatchlist(mockPersonSarah);

      const viewedTimestamp = Date.now();
      await updateWatchlistPerson(person.id, {
        lastViewed: viewedTimestamp,
      });

      const watchlist = await getWatchlist();
      expect(watchlist[0].lastViewed).toBe(viewedTimestamp);
    });

    it('should update multiple fields at once', async () => {
      const person = await addToWatchlist(mockPersonAlice);

      await updateWatchlistPerson(person.id, {
        notes: 'Engineering Manager',
        tags: ['manager', 'target'],
        lastViewed: Date.now(),
      });

      const watchlist = await getWatchlist();
      expect(watchlist[0].notes).toBe('Engineering Manager');
      expect(watchlist[0].tags).toEqual(['manager', 'target']);
      expect(watchlist[0].lastViewed).toBeGreaterThan(0);
    });

    it('should throw error when updating non-existent person', async () => {
      await expect(
        updateWatchlistPerson('non-existent-id', { notes: 'Test' })
      ).rejects.toThrow('Person not found in watchlist');
    });
  });

  // ==========================================================================
  // Removing People
  // ==========================================================================

  describe('Removing People', () => {
    it('should remove person from watchlist', async () => {
      const person = await addToWatchlist(mockPersonSarah);
      await addToWatchlist(mockPersonMike);

      let watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(2);

      await removeFromWatchlist(person.id);

      watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
      expect(watchlist[0].name).toBe('Mike Johnson');
    });

    it('should handle removing non-existent person gracefully', async () => {
      await addToWatchlist(mockPersonSarah);

      await expect(
        removeFromWatchlist('non-existent-id')
      ).resolves.not.toThrow();

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
      expect(watchlist[0].name).toBe('Sarah Chen');
    });
  });

  // ==========================================================================
  // Checking Existence
  // ==========================================================================

  describe('Checking Existence', () => {
    it('should correctly identify if person is in watchlist', async () => {
      const person = await addToWatchlist(mockPersonSarah);

      const isInList = await isInWatchlist(person.profileUrl);
      expect(isInList).toBe(true);

      const isNotInList = await isInWatchlist('https://linkedin.com/in/notexist');
      expect(isNotInList).toBe(false);
    });

    it('should return false for empty watchlist', async () => {
      const isInList = await isInWatchlist('https://linkedin.com/in/sarachen');
      expect(isInList).toBe(false);
    });
  });

  // ==========================================================================
  // Corrupted Storage Handling
  // ==========================================================================

  describe('Corrupted Storage Handling', () => {
    it('should return empty array when storage is empty', async () => {
      const watchlist = await getWatchlist();
      expect(watchlist).toEqual([]);
    });

    it('should handle null/undefined storage gracefully', async () => {
      mockStorage['uproot_watchlist'] = null;

      const watchlist = await getWatchlist();
      expect(watchlist).toEqual([]);
    });

    it('should filter out entries missing required fields (name)', async () => {
      const validPerson = await addToWatchlist(mockPersonSarah);

      // Manually corrupt storage by adding invalid entry
      const people = await getWatchlist();
      people.push({
        id: 'corrupted-id',
        profileUrl: 'https://linkedin.com/in/corrupted',
        headline: 'Corrupted Entry',
        addedAt: Date.now(),
        // Missing 'name' field
      } as any);

      await saveWatchlist(people);

      // getWatchlist should filter out corrupted entry
      const retrievedPeople = await getWatchlist();

      // Valid person should still be present
      const validEntry = retrievedPeople.find(p => p.id === validPerson.id);
      expect(validEntry).toBeDefined();
      expect(validEntry?.name).toBe('Sarah Chen');
    });

    it('should filter out entries with invalid profileUrl', async () => {
      const validPerson = await addToWatchlist(mockPersonSarah);

      const people = await getWatchlist();
      people.push({
        id: 'corrupted-id',
        name: 'Corrupted Person',
        headline: 'Test',
        addedAt: Date.now(),
        // Missing 'profileUrl' field
      } as any);

      await saveWatchlist(people);

      const retrievedPeople = await getWatchlist();

      // Valid person should still be present
      const validEntry = retrievedPeople.find(p => p.id === validPerson.id);
      expect(validEntry).toBeDefined();
      expect(validEntry?.name).toBe('Sarah Chen');
    });
  });

  // ==========================================================================
  // Multiple People
  // ==========================================================================

  describe('Multiple People', () => {
    it('should handle multiple people correctly', async () => {
      await addToWatchlist(mockPersonSarah);
      await addToWatchlist(mockPersonMike);
      await addToWatchlist(mockPersonAlice);

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(3);

      // Most recent should be first (unshift behavior)
      expect(watchlist[0].name).toBe('Alice Smith');
      expect(watchlist[1].name).toBe('Mike Johnson');
      expect(watchlist[2].name).toBe('Sarah Chen');
    });

    it('should maintain order when removing from middle', async () => {
// @ts-expect-error - Used to maintain test array size
      const __person1 = await addToWatchlist(mockPersonSarah);
      const person2 = await addToWatchlist(mockPersonMike);
// @ts-expect-error - Used to maintain test array size
      const __person3 = await addToWatchlist(mockPersonAlice);

      await removeFromWatchlist(person2.id);

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(2);
      expect(watchlist[0].name).toBe('Alice Smith');
      expect(watchlist[1].name).toBe('Sarah Chen');
    });
  });
});
