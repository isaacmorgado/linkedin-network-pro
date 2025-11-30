/**
 * Vitest Setup File
 * Configures test environment with necessary polyfills and mocks
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Setup IndexedDB for tests
globalThis.indexedDB = new IDBFactory();
