import OpenAI from 'openai';

// ============================================================================
// OpenAI API Client Wrapper
// ============================================================================

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Cost Tracking
// ============================================================================

interface UsageLog {
  timestamp: string;
  operation: 'embeddings' | 'chat';
  model: string;
  tokensUsed: number;
  estimatedCost: number;
}

const usageLogs: UsageLog[] = [];

/**
 * Log API usage for cost tracking
 */
function logUsage(log: UsageLog): void {
  usageLogs.push(log);

  if (process.env.NODE_ENV === 'development') {
    console.log('💰 OpenAI Usage:', {
      operation: log.operation,
      model: log.model,
      tokens: log.tokensUsed,
      cost: `$${log.estimatedCost.toFixed(4)}`,
    });
  }
}

/**
 * Get total usage statistics
 */
export function getUsageStats() {
  const totalCost = usageLogs.reduce((sum, log) => sum + log.estimatedCost, 0);
  const totalTokens = usageLogs.reduce((sum, log) => sum + log.tokensUsed, 0);

  return {
    totalLogs: usageLogs.length,
    totalTokens,
    totalCost,
    recentLogs: usageLogs.slice(-10),
  };
}

// ============================================================================
// Retry Logic for Rate Limits
// ============================================================================

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        if (attempt < maxRetries) {
          // Exponential backoff
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          console.warn(
            `⚠️ Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // If not a rate limit error, or we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError;
}

// ============================================================================
// Embeddings Generation
// ============================================================================

/**
 * Generate embeddings for text(s)
 * Uses text-embedding-3-large by default (1536 dimensions)
 * Includes retry logic and cost tracking
 */
export async function generateEmbeddings(
  texts: string[],
  options: {
    model?: string;
    dimensions?: number;
  } = {}
): Promise<number[][]> {
  const model = options.model || 'text-embedding-3-large';
  const dimensions = options.dimensions || 1536;

  try {
    const response = await withRetry(() =>
      openai.embeddings.create({
        model,
        input: texts,
        dimensions,
      })
    );

    // Calculate cost (approximate)
    // text-embedding-3-large: $0.00013 per 1K tokens
    const tokensUsed = response.usage.total_tokens;
    const costPer1kTokens = 0.00013;
    const estimatedCost = (tokensUsed / 1000) * costPer1kTokens;

    logUsage({
      timestamp: new Date().toISOString(),
      operation: 'embeddings',
      model,
      tokensUsed,
      estimatedCost,
    });

    return response.data.map((item) => item.embedding);
  } catch (error: any) {
    console.error('❌ OpenAI embeddings error:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });
    throw new Error(`Failed to generate embeddings: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate a single embedding (convenience method)
 */
export async function generateEmbedding(
  text: string,
  options?: { model?: string; dimensions?: number }
): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], options);
  return embeddings[0]!;
}

// ============================================================================
// Chat Completions (Message Generation)
// ============================================================================

/**
 * Generate a message using GPT-4
 * Includes retry logic and cost tracking
 */
export async function generateMessage(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 500;
  const systemPrompt =
    options.systemPrompt ||
    'You are a professional networking assistant helping users write personalized LinkedIn messages.';

  try {
    const response = await withRetry(() =>
      openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      })
    );

    // Calculate cost (approximate)
    // gpt-4o-mini: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
    const tokensUsed = response.usage?.total_tokens || 0;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const estimatedCost =
      (inputTokens / 1000) * 0.00015 + (outputTokens / 1000) * 0.0006;

    logUsage({
      timestamp: new Date().toISOString(),
      operation: 'chat',
      model,
      tokensUsed,
      estimatedCost,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('❌ OpenAI chat completion error:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });
    throw new Error(`Failed to generate message: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate multiple message alternatives
 */
export async function generateMessageAlternatives(
  prompt: string,
  count: number = 3,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string[]> {
  const promises = Array.from({ length: count }, () =>
    generateMessage(prompt, {
      ...options,
      temperature: options?.temperature ?? 0.8, // Higher temperature for variety
    })
  );

  return Promise.all(promises);
}

// ============================================================================
// Export configured client for advanced usage
// ============================================================================

export { openai };
export default openai;
