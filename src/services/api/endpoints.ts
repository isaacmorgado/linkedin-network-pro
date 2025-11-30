/**
 * API Endpoints Configuration
 * Centralized URL management for backend API calls
 */

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get backend API base URL from environment
 * Defaults to localhost for development
 */
export function getBackendUrl(): string {
  // In production, this would come from build-time environment variable
  // For now, use localhost for development
  const envUrl = import.meta.env?.VITE_BACKEND_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Default to localhost for development
  if (import.meta.env?.DEV) {
    return 'http://localhost:3000';
  }

  // Production Vercel URL (replace with your actual deployment)
  return 'https://uproot-backend.vercel.app';
}

// ============================================================================
// API Endpoints
// ============================================================================

const BASE_URL = getBackendUrl();

export const API_ENDPOINTS = {
  // Search & Pathfinding (Task 4.1)
  SEARCH: `${BASE_URL}/api/search`,
  FIND_PATH: `${BASE_URL}/api/find-path`,

  // Messages & Chat (Task 4.2)
  GENERATE_MESSAGE: `${BASE_URL}/api/generate-message`,
  CHAT: `${BASE_URL}/api/chat`,
  EMBEDDINGS: `${BASE_URL}/api/embeddings`,

  // Future endpoints
  // HEALTH: `${BASE_URL}/api/health`,
  // AUTH: `${BASE_URL}/api/auth`,
} as const;

// ============================================================================
// Request Configuration
// ============================================================================

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number; // milliseconds
}

export const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  cache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
};

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build full URL with query parameters
 */
export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const searchParams = new URLSearchParams(params);
  return `${endpoint}?${searchParams.toString()}`;
}

/**
 * Log API request (for debugging)
 */
export function logApiRequest(endpoint: string, method: string, data?: unknown): void {
  if (import.meta.env?.DEV) {
    console.log(`[API] ${method} ${endpoint}`, data ? { body: data } : '');
  }
}

/**
 * Log API response (for debugging)
 */
export function logApiResponse(endpoint: string, response: unknown, duration: number): void {
  if (import.meta.env?.DEV) {
    console.log(`[API] Response from ${endpoint} (${duration}ms)`, response);
  }
}
