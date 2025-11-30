/**
 * Bullet Rewriter Types
 */

export interface RewriteConfig {
  /** Target keywords to emphasize */
  targetKeywords: string[];

  /** Anthropic API key (optional - falls back to env var) */
  apiKey?: string;

  /** Maximum keywords to inject per bullet */
  maxKeywordsPerBullet?: number;

  /** Tone of the rewrite */
  tone?: 'professional' | 'technical' | 'casual';

  /** Whether to allow implied keywords (e.g., "e-commerce" implies "REST APIs") */
  allowImpliedKeywords?: boolean;

  /** Maximum number of retry attempts if hallucination detected */
  maxRetries?: number;
}

export interface ExtractedFacts {
  /** Core action verb (e.g., "Built", "Led", "Optimized") */
  action: string;

  /** Object of the action (e.g., "microservices platform") */
  object: string;

  /** Result or outcome (e.g., "reducing latency by 40%") */
  result?: string;

  /** All metrics mentioned (numbers, percentages, scales) */
  metrics: string[];

  /** Technologies/tools mentioned */
  technologies: string[];

  /** Team sizes or organizational scope */
  teamScopes: string[];

  /** Any other specific claims */
  specificClaims: string[];
}
