/**
 * POST /api/embeddings
 * Batch embeddings generation with caching
 *
 * VERCEL SERVERLESS FUNCTION
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EmbeddingsRequestSchema } from '../src/types/index.js';
import { getEmbeddings } from '../src/services/embeddings.js';
import { successResponse, errorResponse } from '../src/middleware/validation.js';

/**
 * Main handler for embeddings endpoint
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json(
      errorResponse('METHOD_NOT_ALLOWED', 'Only POST requests are allowed', undefined, 405)
    );
    return;
  }

  try {
    // Validate request body
    const validation = EmbeddingsRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json(
        errorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          400
        )
      );
      return;
    }

    const { texts, model, dimensions } = validation.data;

    console.log(`[Embeddings] Generating embeddings for ${texts.length} texts`);

    // Validate batch size
    if (texts.length > 100) {
      res.status(400).json(
        errorResponse(
          'BATCH_SIZE_EXCEEDED',
          'Maximum batch size is 100 texts',
          { received: texts.length, maximum: 100 },
          400
        )
      );
      return;
    }

    // ========================================================================
    // Generate embeddings (with automatic caching)
    // ========================================================================

    const embeddings = await getEmbeddings(texts, {
      model,
      dimensions,
    });

    console.log(`[Embeddings] Generated ${embeddings.length} embeddings`);

    // ========================================================================
    // Return embeddings
    // ========================================================================

    res.status(200).json(
      successResponse({
        embeddings,
        count: embeddings.length,
        model,
        dimensions,
      })
    );
  } catch (error: any) {
    console.error('❌ Embeddings error:', error);

    res.status(500).json(
      errorResponse(
        'EMBEDDINGS_ERROR',
        'Failed to generate embeddings',
        process.env.NODE_ENV === 'development' ? error.message : undefined,
        500
      )
    );
  }
}
