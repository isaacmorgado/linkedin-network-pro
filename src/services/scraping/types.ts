/**
 * Scraping Orchestrator Type Definitions
 * Types for task queue management and priority scheduling
 */

// ============================================================================
// PRIORITY SYSTEM
// ============================================================================

export enum ScrapingPriority {
  HIGH = 0,    // User-requested scrapes (profile, company, search results)
  MEDIUM = 1,  // Activity scraping for pathfinding
  LOW = 2,     // Background sync (connections refresh, batch updates)
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type ScraperType = 'connection' | 'profile' | 'activity' | 'company' | 'batch_profile';

export interface ScraperTask {
  id: string;                    // Unique task ID (uuid)
  type: ScraperType;             // Type of scraper to run
  priority: ScrapingPriority;    // Queue priority
  params: Record<string, any>;   // Task-specific parameters
  createdAt: string;             // ISO timestamp
  status: TaskStatus;
  progress?: TaskProgress;       // Optional progress tracking
  retries: number;               // Retry count (max 3)
  error?: string;                // Error message if failed
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

export interface TaskProgress {
  current: number;        // Items processed
  total: number | null;   // Total items (null if unknown)
  status: string;         // Human-readable status message
  lastUpdate: string;     // ISO timestamp
}

// ============================================================================
// QUEUE STATUS
// ============================================================================

export interface QueueStatus {
  highPriority: number;    // Tasks in HIGH queue
  mediumPriority: number;  // Tasks in MEDIUM queue
  lowPriority: number;     // Tasks in LOW queue
  currentTask: ScraperTask | null; // Currently running task
  isPaused: boolean;       // Global pause state
  totalCompleted: number;  // Completed task count
  totalFailed: number;     // Failed task count
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Messages sent from Popup/Content Script -> Background
 */
export type OrchestratorRequest =
  | { type: 'ENQUEUE_SCRAPE'; payload: Omit<ScraperTask, 'id' | 'createdAt' | 'status' | 'retries'> }
  | { type: 'PAUSE_ALL_SCRAPING' }
  | { type: 'RESUME_ALL_SCRAPING' }
  | { type: 'CANCEL_TASK'; payload: { taskId: string } }
  | { type: 'GET_QUEUE_STATUS' }
  | { type: 'CLEAR_COMPLETED_TASKS' };

/**
 * Messages sent from Background -> Popup/Content Script
 */
export type OrchestratorResponse =
  | { type: 'SCRAPER_PROGRESS'; payload: TaskProgress & { taskId: string; taskType: ScraperType } }
  | { type: 'SCRAPER_COMPLETED'; payload: { taskId: string; result: any } }
  | { type: 'SCRAPER_FAILED'; payload: { taskId: string; error: string } }
  | { type: 'QUEUE_STATUS'; payload: QueueStatus };

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const ORCHESTRATOR_STORAGE_KEYS = {
  QUEUE: 'uproot_scraper_queue',
  STATS: 'uproot_scraper_stats',
} as const;
