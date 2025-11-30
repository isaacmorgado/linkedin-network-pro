# Task 4.3: Extension API Client

**Status:** ✅ COMPLETED
**Date:** November 24, 2025

---

## What Was Implemented

Created complete API client for the Chrome extension to communicate with the backend API endpoints.

**3 NEW FILES (500+ lines):**

1. **`src/services/api/client.ts`** (400+ lines) - Main API client class
2. **`src/services/api/endpoints.ts`** (120 lines) - URL configuration & error types
3. **`src/services/api/cache.ts`** (150 lines) - Client-side response caching

---

## Files Created

### 1. `src/services/api/client.ts`

**Purpose:** Type-safe HTTP client for all backend API endpoints

**Features:**
- ✅ **5 API Methods** - All backend endpoints accessible
- ✅ **Authentication** - JWT token from chrome.storage
- ✅ **Retry Logic** - Exponential backoff (max 3 retries)
- ✅ **Timeout Handling** - 30s default timeout
- ✅ **Error Handling** - ApiError, NetworkError, TimeoutError
- ✅ **Response Caching** - Automatic for search/findPath/embeddings
- ✅ **Type Safety** - Full TypeScript types for all requests/responses
- ✅ **Logging** - Request/response logging in dev mode

**API Methods:**

```typescript
class ApiClient {
  // Search & Pathfinding (Task 4.1)
  async search(request: SearchRequest): Promise<SearchResult[]>
  async findPath(request: FindPathRequest): Promise<EnhancedConnectionRoute>

  // Messages & Chat (Task 4.2)
  async generateMessage(request: GenerateMessageRequest): Promise<GenerateMessageResponse>
  async chat(request: ChatRequest): Promise<ChatMessage>
  async getEmbeddings(request: EmbeddingsRequest): Promise<number[][]>

  // Auth & Cache Management
  async setAuthToken(token: string): Promise<void>
  async clearAuthToken(): Promise<void>
  clearCache(): void
  invalidateCache(endpoint: string): void
  getCacheStats(): CacheStats
}
```

**Usage Example:**

```typescript
import { apiClient } from '@/services/api';

// Search user's network
const results = await apiClient.search({
  userId: 'user-123',
  query: 'software engineer with ML experience',
  filters: {
    company: 'Google',
    connectionDegree: [1, 2]
  }
});

// Find path to target
const route = await apiClient.findPath({
  userId: 'user-123',
  sourceProfileId: 'source-id',
  targetProfileId: 'target-id',
  strategy: 'mutual'
});

// Generate personalized message
const messageResponse = await apiClient.generateMessage({
  userId: 'user-123',
  targetProfile: { /* ... */ },
  sourceProfile: { /* ... */ },
  context: {
    purpose: 'networking',
    sharedContext: ['AI Ethics', 'ML']
  },
  tone: 'professional'
});

// Chat for network exploration
const chatResponse = await apiClient.chat({
  userId: 'user-123',
  message: 'Find software engineers at Google'
});

// Get embeddings
const embeddings = await apiClient.getEmbeddings({
  texts: ['software engineer', 'machine learning']
});
```

---

### 2. `src/services/api/endpoints.ts`

**Purpose:** Centralized API configuration and error types

**Features:**
- ✅ **Environment-aware URLs** - localhost (dev) vs production
- ✅ **API endpoint constants** - Single source of truth
- ✅ **Custom error classes** - ApiError, NetworkError, TimeoutError
- ✅ **Request configuration** - Timeout, retries, caching settings
- ✅ **URL helpers** - Query param building, logging

**Configuration:**

```typescript
// Development: http://localhost:3000
// Production: https://uproot-backend.vercel.app

const API_ENDPOINTS = {
  SEARCH: `${BASE_URL}/api/search`,
  FIND_PATH: `${BASE_URL}/api/find-path`,
  GENERATE_MESSAGE: `${BASE_URL}/api/generate-message`,
  CHAT: `${BASE_URL}/api/chat`,
  EMBEDDINGS: `${BASE_URL}/api/embeddings`,
};

const DEFAULT_CONFIG = {
  timeout: 30000,       // 30 seconds
  retries: 3,           // 3 retry attempts
  cache: true,          // Enable caching
  cacheTTL: 300000,     // 5 minutes
};
```

**Error Types:**

```typescript
class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  details?: unknown;
}

class NetworkError extends Error {
  // Network connectivity issues
}

class TimeoutError extends Error {
  // Request timeout
}
```

---

### 3. `src/services/api/cache.ts`

**Purpose:** Client-side response caching with LRU eviction

**Features:**
- ✅ **In-memory cache** - Fast access, no persistence needed
- ✅ **TTL expiration** - Automatic cache invalidation
- ✅ **LRU eviction** - Removes oldest entries when full
- ✅ **Cache statistics** - Hit rate tracking
- ✅ **Pattern invalidation** - Bulk cache clearing
- ✅ **Size limits** - Max 100 entries (configurable)

**Cache Logic:**

```typescript
class ApiCache {
  // Store responses with TTL
  set(endpoint, data, ttl, params?)

  // Retrieve cached responses (null if expired)
  get(endpoint, params?): T | null

  // Invalidate specific cache entry
  invalidate(endpoint, params?)

  // Invalidate all entries matching pattern
  invalidatePattern(pattern: string)

  // Clear entire cache
  clear()

  // Get statistics
  getStats(): {
    size: number,
    hitCount: number,
    missCount: number,
    hitRate: number
  }
}
```

**Cache Strategy:**

| Endpoint | Cached? | TTL | Reason |
|----------|---------|-----|--------|
| /api/search | ✅ Yes | 5 min | Search results stable short-term |
| /api/find-path | ✅ Yes | 5 min | Paths change infrequently |
| /api/embeddings | ✅ Yes | 24 hrs | Embeddings are deterministic |
| /api/generate-message | ❌ No | - | Always fresh, personalized |
| /api/chat | ❌ No | - | Conversational context matters |

**Cache Example:**

```typescript
import { withCache } from '@/services/api';

// Automatically cached for 5 minutes
const results = await withCache(
  'search-software-engineers',
  () => apiClient.search({ query: 'software engineer' }),
  300000 // 5 minutes
);

// First call: Cache MISS → API request
// Second call: Cache HIT → Instant return
```

---

## Integration Architecture

### **Extension → Backend Communication Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  Chrome Extension (Frontend)                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  UI Component (React)                                  │ │
│  │  - User clicks "Find Connection"                       │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │  apiClient.findPath({...})                              │ │
│  │  - Type-safe request                                    │ │
│  │  - Auto-retry on failure                                │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │  Cache Layer                                            │ │
│  │  - Check cache first (5min TTL)                         │ │
│  │  - Return cached if valid                               │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                        │
│                     │ Cache MISS                            │
│                     ▼                                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  HTTP Request                                          │ │
│  │  - POST to /api/find-path                              │ │
│  │  - Authorization: Bearer <JWT>                         │ │
│  │  - Content-Type: application/json                      │ │
│  │  - Timeout: 30s                                        │ │
│  └──────────────────┬──────────────────────────────────────┘ │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Vercel)                                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  /api/find-path                                        │ │
│  │  - Validate request (Zod)                              │ │
│  │  - Query database                                      │ │
│  │  - Run pathfinding algorithm                           │ │
│  │  - Return EnhancedConnectionRoute                      │ │
│  └──────────────────┬──────────────────────────────────────┘ │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ Response
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Chrome Extension (Frontend)                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Response Handling                                     │ │
│  │  - Parse JSON                                          │ │
│  │  - Validate response                                   │ │
│  │  - Cache for 5 minutes                                 │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │  UI Update                                              │ │
│  │  - Display path visualization                           │ │
│  │  - Show action steps                                    │ │
│  │  - Enable "Generate Message" button                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

### **Retry Logic:**

```typescript
// Network errors → Retry with exponential backoff
Attempt 1: Immediate
Attempt 2: Wait 1s
Attempt 3: Wait 2s
Attempt 4: Wait 4s
Max wait: 10s

// Client errors (4xx) → No retry
400 Bad Request → Throw immediately
401 Unauthorized → Throw immediately
403 Forbidden → Throw immediately
404 Not Found → Throw immediately

// Server errors (5xx) → Retry
500 Internal Server Error → Retry
503 Service Unavailable → Retry
```

### **Error Propagation:**

```typescript
try {
  const results = await apiClient.search({...});
} catch (error) {
  if (error instanceof ApiError) {
    // Backend validation error (4xx)
    console.error(`API Error [${error.errorCode}]: ${error.message}`);
    showUserError(error.message);
  } else if (error instanceof NetworkError) {
    // Network connectivity issue
    console.error('Network Error:', error.message);
    showUserError('Please check your internet connection');
  } else if (error instanceof TimeoutError) {
    // Request timeout
    console.error('Timeout Error:', error.message);
    showUserError('Request took too long. Please try again.');
  }
}
```

---

## Authentication Flow

### **JWT Token Management:**

```typescript
// 1. User logs in (future implementation)
await apiClient.setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
// Token saved to chrome.storage.local

// 2. API requests automatically include token
const results = await apiClient.search({...});
// Request header: Authorization: Bearer <token>

// 3. User logs out
await apiClient.clearAuthToken();
// Token removed from chrome.storage.local
```

### **Auth Header Injection:**

All API requests automatically include:

```http
POST /api/search
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "user-123",
  "query": "software engineer"
}
```

---

## Performance Characteristics

### **Request Latency:**

| Scenario | Latency | Notes |
|----------|---------|-------|
| Cache HIT | ~1ms | In-memory retrieval |
| Cache MISS (local backend) | ~50-200ms | localhost:3000 |
| Cache MISS (Vercel) | ~300-800ms | US East region |
| With retry (1 failure) | +1-2s | Exponential backoff |
| Timeout error | 30s | Configurable |

### **Cache Performance:**

**Expected hit rates:**
- Search queries: 40-60% (frequently repeated searches)
- Find path: 30-50% (paths queried multiple times)
- Embeddings: 70-90% (same texts embedded repeatedly)

**Memory usage:**
- Max 100 cache entries
- ~1-5KB per entry
- Total: ~100-500KB memory

---

## Type Safety

### **Request/Response Types:**

All types match backend exactly (from `backend/src/types/index.ts`):

```typescript
// Search
interface SearchRequest {
  userId: string;
  query: string;
  filters?: {...};
}

interface SearchResult {
  profile: NetworkNode;
  matchScore: number;
  reasoning: string;
  pathAvailable: boolean;
}

// Find Path
interface FindPathRequest {
  userId: string;
  sourceProfileId: string;
  targetProfileId: string;
  strategy?: 'direct' | 'mutual' | ...;
}

interface EnhancedConnectionRoute {
  path: NetworkNode[];
  strategy: string;
  successProbability: number;
  actionSteps: string[];
  reasoning: string;
}

// Generate Message
interface GenerateMessageRequest {
  userId: string;
  targetProfile: NetworkNode;
  sourceProfile: NetworkNode;
  context: {...};
  tone: 'professional' | 'casual' | 'enthusiastic';
}

interface GenerateMessageResponse {
  message: string;
  alternatives: string[];
  reasoning: string[];
  characterCount: number;
  metadata?: {...};
}
```

TypeScript ensures compile-time type safety for all API calls.

---

## Usage in Extension

### **Example 1: Search Component**

```typescript
import { apiClient } from '@/services/api';

async function handleSearch(query: string) {
  try {
    setLoading(true);

    const results = await apiClient.search({
      userId: currentUserId,
      query,
      filters: {
        connectionDegree: [1, 2]
      }
    });

    setSearchResults(results);
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}
```

### **Example 2: Message Generation**

```typescript
import { apiClient } from '@/services/api';

async function generateConnectionMessage(target: Profile) {
  try {
    setGenerating(true);

    const response = await apiClient.generateMessage({
      userId: currentUserId,
      targetProfile: target,
      sourceProfile: currentUser,
      context: {
        purpose: 'networking',
        sharedContext: ['AI Ethics', 'ML']
      },
      tone: 'professional'
    });

    setMessage(response.message);
    setAlternatives(response.alternatives);
    setReasoning(response.reasoning);
  } catch (error) {
    handleError(error);
  } finally {
    setGenerating(false);
  }
}
```

### **Example 3: Cache Management**

```typescript
import { apiClient } from '@/services/api';

// Clear cache after profile update
function handleProfileUpdate() {
  // Clear all search results
  apiClient.invalidateCache(API_ENDPOINTS.SEARCH);

  // Or clear entire cache
  apiClient.clearCache();
}

// View cache statistics
function showCacheStats() {
  const stats = apiClient.getCacheStats();
  console.log('Cache Statistics:', {
    hitRate: `${stats.hitRate * 100}%`,
    size: `${stats.size}/${stats.maxSize}`,
    hits: stats.hitCount,
    misses: stats.missCount
  });
}
```

---

## Testing

### **Manual Testing:**

```typescript
// 1. Test search endpoint
const results = await apiClient.search({
  userId: 'test-user',
  query: 'software engineer',
  filters: { company: 'Google' }
});
console.log('Search results:', results);

// 2. Test find-path endpoint
const route = await apiClient.findPath({
  userId: 'test-user',
  sourceProfileId: 'source-123',
  targetProfileId: 'target-456'
});
console.log('Connection route:', route);

// 3. Test message generation
const messageResponse = await apiClient.generateMessage({
  userId: 'test-user',
  targetProfile: { name: 'Jane Doe', /* ... */ },
  sourceProfile: { name: 'John Smith', /* ... */ },
  context: { purpose: 'networking' },
  tone: 'professional'
});
console.log('Generated message:', messageResponse.message);

// 4. Test cache behavior
console.log('First call (cache MISS):');
await apiClient.search({ userId: 'test', query: 'engineer' });

console.log('Second call (cache HIT):');
await apiClient.search({ userId: 'test', query: 'engineer' });

console.log('Cache stats:', apiClient.getCacheStats());
```

### **Error Testing:**

```typescript
// Test retry logic (simulate network failure)
try {
  await apiClient.search({
    userId: 'test-user',
    query: 'engineer'
  }, { retries: 3, timeout: 5000 });
} catch (error) {
  console.log('Expected error:', error);
}

// Test validation error (400)
try {
  await apiClient.search({
    userId: '', // Invalid - empty string
    query: ''
  });
} catch (error) {
  console.log('Validation error:', error.errorCode);
}
```

---

## Environment Configuration

### **Development (.env.local):**

```bash
VITE_BACKEND_URL=http://localhost:3000
```

### **Production (Vercel):**

```bash
VITE_BACKEND_URL=https://uproot-backend.vercel.app
```

### **Build-time configuration:**

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || 'http://localhost:3000'
    )
  }
});
```

---

## Success Criteria

### ✅ Completed

- [x] Created API client class with all 5 endpoint methods
- [x] Implemented authentication with JWT tokens
- [x] Added retry logic with exponential backoff
- [x] Implemented client-side response caching
- [x] Added comprehensive error handling
- [x] Included request/response logging
- [x] Full TypeScript type safety
- [x] Cache statistics and management
- [x] Environment-aware URL configuration
- [x] Documentation complete

### ⚠️ Pending (for later tasks)

- [ ] Integration with UI components (Task 4.4+)
- [ ] Real authentication flow (login/logout)
- [ ] E2E testing with real backend
- [ ] Error boundary integration in React
- [ ] Loading state management
- [ ] Offline detection and queueing

---

## Next Steps

**Task 4.4:** Watchlist Tab Enhancement - Universal Search
- Connect UI to apiClient.search()
- Display search results
- Show connection paths
- Integrate message generation

**Task 4.5:** Profile Detail Enhancement
- Use apiClient.findPath() for path visualization
- Use apiClient.generateMessage() for message composer
- Cache profile data

---

**TASK 4.3 COMPLETE!** ✅

API client is ready for frontend integration. All backend endpoints are now accessible from the Chrome extension with proper error handling, caching, and type safety.
