/**
 * Vitest Setup
 * Loads test environment variables and mocks
 */

import { config } from 'dotenv';
import { vi } from 'vitest';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '.env.test') });

// Verify required env vars are set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env.test');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY must be set in .env.test');
}

console.log('✅ Test environment loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

// Mock database queries for tests that don't need real DB
vi.mock('./src/db/client.js', async () => {
  const actual = await vi.importActual('./src/db/client.js');
  return {
    ...actual,
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  };
});

// Mock OpenAI service for tests that don't need real API
vi.mock('./src/services/openai.js', async () => {
  const actual = await vi.importActual('./src/services/openai.js');
  return {
    ...actual,
    generateMessage: vi.fn().mockResolvedValue('Mock generated message'),
    generateMessageAlternatives: vi.fn().mockResolvedValue([
      'Mock message 1',
      'Mock message 2',
      'Mock message 3',
    ]),
  };
});

// Mock embeddings service for tests that don't need real embeddings
vi.mock('./src/services/embeddings.js', async () => {
  const actual = await vi.importActual('./src/services/embeddings.js');
  return {
    ...actual,
    getEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1)),
    getEmbeddings: vi.fn().mockResolvedValue([
      Array(1536).fill(0.1),
      Array(1536).fill(0.2),
    ]),
    cosineSimilarity: vi.fn().mockReturnValue(0.85),
  };
});
