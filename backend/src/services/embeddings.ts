import { createHash } from 'crypto';
import { query } from '../db/client.js';
import { generateEmbeddings as generateOpenAIEmbeddings } from './openai.js';

// ============================================================================
// Embeddings Service with PostgreSQL Caching
// ============================================================================

/**
 * Hash text to create a unique cache key
 */
function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Get embedding from cache or generate new one
 * Caches embeddings for 30 days to reduce API costs
 */
export async function getEmbedding(
  text: string,
  options: {
    model?: string;
    dimensions?: number;
  } = {}
): Promise<number[]> {
  const model = options.model || 'text-embedding-3-large';
  const dimensions = options.dimensions || 1536;
  const textHash = hashText(text);

  try {
    // Check cache first
    const cached = await query<{
      embedding: number[];
      expires_at: Date;
    }>(
      `SELECT embedding, expires_at
       FROM embeddings_cache
       WHERE text_hash = $1 AND model = $2 AND expires_at > NOW()`,
      [textHash, model]
    );

    if (cached.rows.length > 0) {
      console.log('✅ Cache hit for embedding');
      return cached.rows[0]!.embedding;
    }

    // Cache miss - generate new embedding
    console.log('⚠️ Cache miss - generating new embedding');
    const embeddings = await generateOpenAIEmbeddings([text], {
      model,
      dimensions,
    });
    const embedding = embeddings[0]!;

    // Store in cache
    await query(
      `INSERT INTO embeddings_cache (text_hash, embedding, model, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
       ON CONFLICT (text_hash)
       DO UPDATE SET
         embedding = EXCLUDED.embedding,
         model = EXCLUDED.model,
         created_at = NOW(),
         expires_at = NOW() + INTERVAL '30 days'`,
      [textHash, JSON.stringify(embedding), model]
    );

    console.log('💾 Stored embedding in cache');
    return embedding;
  } catch (error) {
    console.error('❌ Error in getEmbedding:', error);
    throw error;
  }
}

/**
 * Get embeddings for multiple texts (batch processing)
 * Checks cache for each text and only generates embeddings for cache misses
 */
export async function getEmbeddings(
  texts: string[],
  options: {
    model?: string;
    dimensions?: number;
  } = {}
): Promise<number[][]> {
  const model = options.model || 'text-embedding-3-large';
  const dimensions = options.dimensions || 1536;

  // Create hash map for all texts
  const textHashes = texts.map((text) => ({
    text,
    hash: hashText(text),
  }));

  // Check cache for all hashes at once
  const hashes = textHashes.map((t) => t.hash);
  const cached = await query<{
    text_hash: string;
    embedding: number[];
  }>(
    `SELECT text_hash, embedding
     FROM embeddings_cache
     WHERE text_hash = ANY($1) AND model = $2 AND expires_at > NOW()`,
    [hashes, model]
  );

  // Create cache lookup map
  const cacheMap = new Map<string, number[]>();
  cached.rows.forEach((row) => {
    cacheMap.set(row.text_hash, row.embedding);
  });

  // Find texts that need new embeddings
  const textsToGenerate: string[] = [];
  const textIndexMap = new Map<string, number>();

  textHashes.forEach(({ text, hash }, index) => {
    if (!cacheMap.has(hash)) {
      textsToGenerate.push(text);
      textIndexMap.set(text, index);
    }
  });

  console.log(`📊 Cache stats: ${cacheMap.size} hits, ${textsToGenerate.length} misses`);

  // Generate embeddings for cache misses
  let newEmbeddings: number[][] = [];
  if (textsToGenerate.length > 0) {
    newEmbeddings = await generateOpenAIEmbeddings(textsToGenerate, {
      model,
      dimensions,
    });

    // Store new embeddings in cache
    const insertPromises = textsToGenerate.map((text, i) => {
      const hash = hashText(text);
      const embedding = newEmbeddings[i]!;

      return query(
        `INSERT INTO embeddings_cache (text_hash, embedding, model, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
         ON CONFLICT (text_hash)
         DO UPDATE SET
           embedding = EXCLUDED.embedding,
           model = EXCLUDED.model,
           created_at = NOW(),
           expires_at = NOW() + INTERVAL '30 days'`,
        [hash, JSON.stringify(embedding), model]
      );
    });

    await Promise.all(insertPromises);
    console.log(`💾 Stored ${textsToGenerate.length} new embeddings in cache`);
  }

  // Combine cached and new embeddings in original order
  const result: number[][] = [];
  textHashes.forEach(({ hash, text }, index) => {
    if (cacheMap.has(hash)) {
      result[index] = cacheMap.get(hash)!;
    } else {
      const newIndex = textsToGenerate.indexOf(text);
      result[index] = newEmbeddings[newIndex]!;
    }
  });

  return result;
}

// ============================================================================
// Similarity Calculations
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 * Returns a score between 0 and 1 (higher = more similar)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i]! * vec2[i]!;
    magnitude1 += vec1[i]! * vec1[i]!;
    magnitude2 += vec2[i]! * vec2[i]!;
  }

  // Calculate magnitudes
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitude1 * magnitude2);

  // Clamp to [0, 1] range (in case of floating point errors)
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Find most similar embeddings from a list
 * Returns sorted array of {index, similarity} objects
 */
export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: number[][],
  topK: number = 10
): Array<{ index: number; similarity: number }> {
  const similarities = embeddings.map((embedding, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, embedding),
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Return top K results
  return similarities.slice(0, topK);
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clean up expired embeddings from cache
 */
export async function cleanupExpiredEmbeddings(): Promise<number> {
  const result = await query(`DELETE FROM embeddings_cache WHERE expires_at < NOW()`);
  const deletedCount = result.rowCount || 0;

  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} expired embeddings`);
  }

  return deletedCount;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEmbeddings: number;
  expiredEmbeddings: number;
  cacheSize: string;
}> {
  const stats = await query<{
    total: string;
    expired: string;
    size: string;
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
      pg_size_pretty(pg_total_relation_size('embeddings_cache')) as size
    FROM embeddings_cache
  `);

  return {
    totalEmbeddings: parseInt(stats.rows[0]?.total || '0'),
    expiredEmbeddings: parseInt(stats.rows[0]?.expired || '0'),
    cacheSize: stats.rows[0]?.size || '0 bytes',
  };
}
