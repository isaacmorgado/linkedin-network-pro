/**
 * API Service Module
 * Exports all API-related functionality
 */

export { apiClient, ApiClient, type SearchRequest, type SearchResult, type FindPathRequest, type EnhancedConnectionRoute, type GenerateMessageRequest, type GenerateMessageResponse, type ChatRequest, type ChatMessage, type EmbeddingsRequest } from './client';

export { API_ENDPOINTS, DEFAULT_CONFIG, getBackendUrl, ApiError, NetworkError, TimeoutError, type RequestConfig } from './endpoints';

export { apiCache, ApiCache, withCache, type CacheEntry } from './cache';
