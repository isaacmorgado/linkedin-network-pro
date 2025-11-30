/**
 * API Client for Backend Communication
 * Handles all HTTP requests to backend API endpoints
 *
 * Features:
 * - Type-safe requests/responses using Zod schemas
 * - Authentication with JWT tokens from chrome.storage
 * - Automatic retries with exponential backoff
 * - Client-side response caching
 * - Error handling and logging
 */

import {
  API_ENDPOINTS,
  DEFAULT_CONFIG,
  type RequestConfig,
  ApiError,
  NetworkError,
  TimeoutError,
  logApiRequest,
  logApiResponse,
} from './endpoints';
import { apiCache, withCache } from './cache';

// Types from backend (should match backend/src/types/index.ts)
export interface SearchRequest {
  userId: string;
  query: string;
  filters?: {
    company?: string;
    role?: string;
    location?: string;
    connectionDegree?: number[];
  };
}

export interface SearchResult {
  profile: {
    id: string;
    name: string;
    headline?: string;
    profileUrl: string;
    degree: number;
    company?: string;
    role?: string;
    location?: string;
  };
  matchScore: number;
  reasoning: string;
  pathAvailable: boolean;
}

export interface FindPathRequest {
  userId: string;
  sourceProfileId: string;
  targetProfileId: string;
  strategy?: 'direct' | 'mutual' | 'engagement_bridge' | 'company_bridge' | 'semantic';
}

export interface EnhancedConnectionRoute {
  path: Array<{
    id: string;
    name: string;
    headline?: string;
    profileUrl: string;
    degree: number;
    company?: string;
    role?: string;
    location?: string;
  }>;
  strategy: 'direct' | 'mutual' | 'engagement_bridge' | 'company_bridge' | 'semantic';
  successProbability: number;
  actionSteps: string[];
  reasoning: string;
}

export interface GenerateMessageRequest {
  userId: string;
  targetProfile: any;
  sourceProfile: any;
  context: {
    purpose: 'intro_request' | 'job_inquiry' | 'networking' | 'referral';
    sharedContext?: string[];
    pathInfo?: EnhancedConnectionRoute;
  };
  tone: 'professional' | 'casual' | 'enthusiastic';
}

export interface GenerateMessageResponse {
  message: string;
  alternatives: string[];
  reasoning: string[];
  characterCount: number;
  metadata?: {
    template: string;
    connectionDegree: number | 'none';
    expectedAcceptanceRate: string;
    researchBasis: string;
    sharedContext: Record<string, any>;
  };
}

export interface ChatRequest {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
    timestamp: string;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  timestamp: string;
}

export interface EmbeddingsRequest {
  texts: string[];
  model?: string;
  dimensions?: number;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private authToken: string | null = null;

  constructor() {
    this.loadAuthToken();
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Load JWT token from chrome.storage
   */
  private async loadAuthToken(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('authToken');
      this.authToken = result.authToken || null;
    } catch (error) {
      console.warn('[ApiClient] Failed to load auth token:', error);
      this.authToken = null;
    }
  }

  /**
   * Set JWT token (for login)
   */
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await chrome.storage.local.set({ authToken: token });
  }

  /**
   * Clear JWT token (for logout)
   */
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await chrome.storage.local.remove('authToken');
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // ==========================================================================
  // Core HTTP Methods
  // ==========================================================================

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit,
    config: RequestConfig = DEFAULT_CONFIG
  ): Promise<T> {
    const startTime = Date.now();

    logApiRequest(endpoint, options.method || 'GET', options.body);

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    const maxRetries = config.retries ?? DEFAULT_CONFIG.retries!;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout
        const controller = new AbortController();
        const timeout = config.timeout ?? DEFAULT_CONFIG.timeout!;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(endpoint, {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: { code: 'UNKNOWN', message: response.statusText },
          }));

          throw new ApiError(
            errorData.error?.message || 'Request failed',
            response.status,
            errorData.error?.code || 'UNKNOWN',
            errorData.error?.details
          );
        }

        // Parse response
        const data = await response.json();
        const duration = Date.now() - startTime;

        logApiResponse(endpoint, data, duration);

        // Return data (unwrap "success" wrapper if present)
        return data.success ? data.data : data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx) or auth errors
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on timeout after max retries
        if (error.name === 'AbortError') {
          if (attempt === maxRetries) {
            throw new TimeoutError(`Request timeout after ${config.timeout}ms`);
          }
        }

        // Network error - retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
          console.warn(`[ApiClient] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Max retries exceeded
        throw new NetworkError(lastError?.message || 'Network request failed');
      }
    }

    // Should never reach here, but TypeScript requires it
    throw lastError || new NetworkError('Request failed');
  }

  // ==========================================================================
  // API Methods - Search & Pathfinding (Task 4.1)
  // ==========================================================================

  /**
   * Search user's network using semantic search
   */
  async search(request: SearchRequest, config?: RequestConfig): Promise<SearchResult[]> {
    const cacheKey = API_ENDPOINTS.SEARCH;
    const cacheTTL = config?.cacheTTL ?? DEFAULT_CONFIG.cacheTTL!;

    // Use cache if enabled
    if (config?.cache !== false && DEFAULT_CONFIG.cache) {
      return withCache(
        cacheKey,
        () => this.request<{ results: SearchResult[] }>(
          API_ENDPOINTS.SEARCH,
          { method: 'POST', body: JSON.stringify(request) },
          config
        ).then((data) => data.results),
        cacheTTL,
        request
      );
    }

    // No cache - direct request
    const data = await this.request<{ results: SearchResult[] }>(
      API_ENDPOINTS.SEARCH,
      { method: 'POST', body: JSON.stringify(request) },
      config
    );

    return data.results;
  }

  /**
   * Find connection path to target person
   */
  async findPath(request: FindPathRequest, config?: RequestConfig): Promise<EnhancedConnectionRoute> {
    const cacheKey = API_ENDPOINTS.FIND_PATH;
    const cacheTTL = config?.cacheTTL ?? DEFAULT_CONFIG.cacheTTL!;

    // Use cache if enabled
    if (config?.cache !== false && DEFAULT_CONFIG.cache) {
      return withCache(
        cacheKey,
        () => this.request<{ route: EnhancedConnectionRoute }>(
          API_ENDPOINTS.FIND_PATH,
          { method: 'POST', body: JSON.stringify(request) },
          config
        ).then((data) => data.route),
        cacheTTL,
        request
      );
    }

    // No cache - direct request
    const data = await this.request<{ route: EnhancedConnectionRoute }>(
      API_ENDPOINTS.FIND_PATH,
      { method: 'POST', body: JSON.stringify(request) },
      config
    );

    return data.route;
  }

  // ==========================================================================
  // API Methods - Messages & Chat (Task 4.2)
  // ==========================================================================

  /**
   * Generate personalized connection message using research-backed templates
   */
  async generateMessage(
    request: GenerateMessageRequest,
    config?: RequestConfig
  ): Promise<GenerateMessageResponse> {
    // Message generation should NOT be cached (always fresh)
    const data = await this.request<GenerateMessageResponse>(
      API_ENDPOINTS.GENERATE_MESSAGE,
      { method: 'POST', body: JSON.stringify(request) },
      { ...config, cache: false }
    );

    return data;
  }

  /**
   * Chat with conversational AI for network exploration
   */
  async chat(request: ChatRequest, config?: RequestConfig): Promise<ChatMessage> {
    // Chat should NOT be cached (conversational context matters)
    const data = await this.request<{ message: ChatMessage }>(
      API_ENDPOINTS.CHAT,
      { method: 'POST', body: JSON.stringify(request) },
      { ...config, cache: false }
    );

    return data.message;
  }

  /**
   * Get embeddings for texts (batch processing)
   */
  async getEmbeddings(request: EmbeddingsRequest, config?: RequestConfig): Promise<number[][]> {
    const cacheKey = API_ENDPOINTS.EMBEDDINGS;
    const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours (embeddings are deterministic)

    // Use cache if enabled (embeddings are expensive, cache aggressively)
    if (config?.cache !== false && DEFAULT_CONFIG.cache) {
      return withCache(
        cacheKey,
        () => this.request<{ embeddings: number[][] }>(
          API_ENDPOINTS.EMBEDDINGS,
          { method: 'POST', body: JSON.stringify(request) },
          config
        ).then((data) => data.embeddings),
        cacheTTL,
        request
      );
    }

    // No cache - direct request
    const data = await this.request<{ embeddings: number[][] }>(
      API_ENDPOINTS.EMBEDDINGS,
      { method: 'POST', body: JSON.stringify(request) },
      config
    );

    return data.embeddings;
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    apiCache.clear();
  }

  /**
   * Invalidate cache for specific endpoint
   */
  invalidateCache(endpoint: string, params?: Record<string, any>): void {
    apiCache.invalidate(endpoint, params);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return apiCache.getStats();
  }
}

// ============================================================================
// Global API Client Instance
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;
