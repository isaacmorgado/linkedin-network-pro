/**
 * Scraping Orchestrator
 * Coordinates all scraping tasks with priority queuing and progress tracking
 *
 * Features:
 * - 3-tier priority queue (HIGH > MEDIUM > LOW)
 * - Progress tracking with UI notifications
 * - Pause/resume capability (global and per-task)
 * - Automatic retry with exponential backoff
 * - Queue persistence across extension restarts
 */

import type {
  ScraperTask,
  TaskProgress,
  QueueStatus,
} from './types';

// Import scrapers
import { scrapeProfileData } from '@/lib/scrapers/profile-scraper';
import { scrapeProfileActivitySafe } from '@/lib/scrapers/activity-scraper';
import { scrapeCompanyMapSafe } from '@/lib/scrapers/company-scraper';
import { networkDB } from '@/lib/storage/network-db';
import type { NetworkNode } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUEUE_KEY = 'uproot_scraper_queue';
const STATS_KEY = 'uproot_scraper_stats';
const PROGRESS_THROTTLE_MS = 5000; // Max 1 progress message per 5s per task

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

class ScrapingOrchestrator {
  // Queues (3 separate arrays for priority)
  private highPriorityQueue: ScraperTask[] = [];
  private mediumPriorityQueue: ScraperTask[] = [];
  private lowPriorityQueue: ScraperTask[] = [];

  // State
  private currentTask: ScraperTask | null = null;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  // Statistics
  private totalCompleted: number = 0;
  private totalFailed: number = 0;

  // Progress throttling (taskId -> last message timestamp)
  private lastProgressMessage: Map<string, number> = new Map();

  constructor() {
    // Load queue and stats on initialization
    this.loadQueue().then(() => {
      console.log('[Orchestrator] Loaded queue from storage');
      // Auto-resume processing if there are pending tasks
      if (!this.isPaused && this.hasPendingTasks()) {
        this.processQueue();
      }
    });
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Enqueue a new scraping task
   *
   * @param task - Task configuration (without id, createdAt, status, retries)
   * @returns Task ID for tracking
   *
   * @example
   * ```typescript
   * const taskId = await orchestrator.enqueueTask({
   *   type: 'profile',
   *   priority: ScrapingPriority.HIGH,
   *   params: { profileUrl: 'https://linkedin.com/in/john-doe' }
   * });
   * ```
   */
  async enqueueTask(
    task: Omit<ScraperTask, 'id' | 'createdAt' | 'status' | 'retries'>
  ): Promise<string> {
    const fullTask: ScraperTask = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      retries: 0,
    };

    // Add to correct queue based on priority
    this.addToQueue(fullTask);

    // Save queue to storage
    await this.saveQueue();

    console.log(`[Orchestrator] Enqueued task ${fullTask.id} (${fullTask.type}, priority: ${fullTask.priority})`);

    // Start processing if not already running
    if (!this.isProcessing && !this.isPaused) {
      this.processQueue();
    }

    return fullTask.id;
  }

  /**
   * Pause all scraping operations
   * Current task will finish current batch and pause
   */
  async pauseAll(): Promise<void> {
    console.log('[Orchestrator] Pausing all scraping...');
    this.isPaused = true;

    // Pause current task if it supports pausing
    if (this.currentTask?.type === 'connection') {
      await this.sendToContentScript('PAUSE_CONNECTION_SCRAPE', {});
    }

    await this.saveQueue();
  }

  /**
   * Resume all scraping operations
   * Continues from where it was paused
   */
  async resumeAll(): Promise<void> {
    console.log('[Orchestrator] Resuming all scraping...');
    this.isPaused = false;

    // Resume current task if it was paused
    if (this.currentTask?.type === 'connection') {
      await this.sendToContentScript('RESUME_CONNECTION_SCRAPE', {});
    }

    // Restart queue processing
    if (!this.isProcessing && this.hasPendingTasks()) {
      this.processQueue();
    }

    await this.saveQueue();
  }

  /**
   * Cancel a specific task
   *
   * @param taskId - Task ID to cancel
   * @returns True if task was cancelled, false if not found
   */
  async cancelTask(taskId: string): Promise<boolean> {
    console.log(`[Orchestrator] Cancelling task ${taskId}...`);

    // Check if it's the current task
    if (this.currentTask?.id === taskId) {
      this.currentTask.status = 'cancelled';
      this.isPaused = true; // Pause to stop current task
      await this.saveQueue();
      return true;
    }

    // Check all queues
    const removed =
      this.removeFromQueue(this.highPriorityQueue, taskId) ||
      this.removeFromQueue(this.mediumPriorityQueue, taskId) ||
      this.removeFromQueue(this.lowPriorityQueue, taskId);

    if (removed) {
      await this.saveQueue();
      console.log(`[Orchestrator] Task ${taskId} cancelled`);
      return true;
    }

    console.warn(`[Orchestrator] Task ${taskId} not found`);
    return false;
  }

  /**
   * Get current queue status
   *
   * @returns Queue status with task counts and current task
   */
  async getQueueStatus(): Promise<QueueStatus> {
    return {
      highPriority: this.highPriorityQueue.length,
      mediumPriority: this.mediumPriorityQueue.length,
      lowPriority: this.lowPriorityQueue.length,
      currentTask: this.currentTask,
      isPaused: this.isPaused,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
    };
  }

  /**
   * Clear all completed and failed tasks from queues
   */
  async clearCompletedTasks(): Promise<void> {
    console.log('[Orchestrator] Clearing completed/failed tasks...');

    this.highPriorityQueue = this.highPriorityQueue.filter(
      (t) => t.status !== 'completed' && t.status !== 'failed'
    );
    this.mediumPriorityQueue = this.mediumPriorityQueue.filter(
      (t) => t.status !== 'completed' && t.status !== 'failed'
    );
    this.lowPriorityQueue = this.lowPriorityQueue.filter(
      (t) => t.status !== 'completed' && t.status !== 'failed'
    );

    await this.saveQueue();
  }

  // ==========================================================================
  // QUEUE MANAGEMENT
  // ==========================================================================

  /**
   * Add task to correct queue based on priority
   */
  private addToQueue(task: ScraperTask): void {
    switch (task.priority) {
      case 0: // HIGH
        this.highPriorityQueue.push(task);
        break;
      case 1: // MEDIUM
        this.mediumPriorityQueue.push(task);
        break;
      case 2: // LOW
        this.lowPriorityQueue.push(task);
        break;
      default:
        console.warn(`[Orchestrator] Unknown priority: ${task.priority}, defaulting to LOW`);
        this.lowPriorityQueue.push(task);
    }
  }

  /**
   * Get next task to process (HIGH > MEDIUM > LOW, FIFO within priority)
   */
  private getNextTask(): ScraperTask | null {
    // Try HIGH priority first
    const highTask = this.highPriorityQueue.find((t) => t.status === 'pending');
    if (highTask) return highTask;

    // Then MEDIUM priority
    const mediumTask = this.mediumPriorityQueue.find((t) => t.status === 'pending');
    if (mediumTask) return mediumTask;

    // Finally LOW priority
    const lowTask = this.lowPriorityQueue.find((t) => t.status === 'pending');
    if (lowTask) return lowTask;

    return null; // No pending tasks
  }

  /**
   * Check if there are any pending tasks in any queue
   */
  private hasPendingTasks(): boolean {
    return (
      this.highPriorityQueue.some((t) => t.status === 'pending') ||
      this.mediumPriorityQueue.some((t) => t.status === 'pending') ||
      this.lowPriorityQueue.some((t) => t.status === 'pending')
    );
  }

  /**
   * Remove task from queue by ID
   */
  private removeFromQueue(queue: ScraperTask[], taskId: string): boolean {
    const index = queue.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // TASK PROCESSING
  // ==========================================================================

  /**
   * Main queue processing loop
   * Runs continuously until queue is empty or paused
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) {
      console.log('[Orchestrator] Already processing or paused, skipping');
      return;
    }

    this.isProcessing = true;
    console.log('[Orchestrator] Starting queue processing...');

    try {
      while (true) {
        // Check pause state
        if (this.isPaused) {
          console.log('[Orchestrator] Processing paused');
          break;
        }

        // Get next task (priority order)
        const task = this.getNextTask();
        if (!task) {
          console.log('[Orchestrator] Queue empty, stopping processing');
          break;
        }

        // Execute task
        this.currentTask = task;
        task.status = 'running';
        await this.saveQueue();

        console.log(`[Orchestrator] Executing task ${task.id} (${task.type})`);

        try {
          await this.executeTask(task);
          task.status = 'completed';
          this.totalCompleted++;
          console.log(`[Orchestrator] Task ${task.id} completed successfully`);

          // Notify completion
          this.notifyCompletion(task);
        } catch (error) {
          const errorMessage = (error as Error).message;
          const isPageNotAvailable = errorMessage.includes('LinkedIn connections page not open');

          // Only log as error if it's a real failure, not just waiting for page
          if (isPageNotAvailable) {
            console.log(`[Orchestrator] Task ${task.id} waiting: ${errorMessage}`);
          } else {
            console.error(`[Orchestrator] Task ${task.id} failed:`, error);
          }

          // Retry logic with extended limit for "page not available" errors
          const maxRetries = isPageNotAvailable ? 20 : 3;

          if (task.retries < maxRetries) {
            task.retries++;
            task.status = 'pending';
            task.error = errorMessage;

            // Longer backoff for page not available (30s), normal for real errors (2s, 4s, 8s)
            const backoffMs = isPageNotAvailable ? 30000 : Math.pow(2, task.retries) * 1000;

            if (isPageNotAvailable) {
              console.log(`[Orchestrator] Task ${task.id} will retry in ${backoffMs/1000}s when page is available (attempt ${task.retries + 1}/${maxRetries + 1})`);
            } else {
              console.log(`[Orchestrator] Retrying task ${task.id} in ${backoffMs}ms (attempt ${task.retries + 1}/${maxRetries + 1})`);
            }

            await this.sleep(backoffMs);
          } else {
            // Max retries reached
            task.status = 'failed';
            task.error = errorMessage;
            this.totalFailed++;
            console.error(`[Orchestrator] Task ${task.id} failed after ${maxRetries} retries`);

            // Notify failure
            this.notifyFailure(task, errorMessage);
          }
        }

        await this.saveQueue();
        this.currentTask = null;
      }
    } finally {
      this.isProcessing = false;
      console.log('[Orchestrator] Queue processing stopped');
    }
  }

  /**
   * Execute a specific scraper task
   */
  private async executeTask(task: ScraperTask): Promise<void> {
    switch (task.type) {
      case 'connection':
        await this.executeConnectionScrape(task);
        break;

      case 'profile':
        await this.executeProfileScrape(task);
        break;

      case 'activity':
        await this.executeActivityScrape(task);
        break;

      case 'company':
        await this.executeCompanyScrape(task);
        break;

      case 'batch_profile':
        await this.executeBatchProfileScrape(task);
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Execute connection list scrape
   * Delegates to Content Script since it requires DOM access
   */
  private async executeConnectionScrape(task: ScraperTask): Promise<void> {
    const resume = task.params.resume ?? true;

    console.log(`[Orchestrator] Delegating connection scrape to Content Script (taskId: ${task.id})`);

    // Get the active LinkedIn tab
    const tabs = await chrome.tabs.query({
      url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/*'
    });

    if (tabs.length === 0) {
      // Gracefully handle missing connections page - will retry with extended backoff
      // Don't log here - processQueue will log appropriately
      throw new Error('LinkedIn connections page not open - will retry when page is available');
    }

    const tab = tabs[0];
    if (!tab.id) {
      throw new Error('Invalid tab ID for LinkedIn connections page');
    }

    console.log(`[Orchestrator] Sending EXECUTE_CONNECTION_SCRAPE to tab ${tab.id}`);

    // Send message to Content Script to execute scraping
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tab.id!,
        {
          type: 'EXECUTE_CONNECTION_SCRAPE',
          payload: {
            taskId: task.id,
            params: { resume },
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const error = `Content Script communication failed: ${chrome.runtime.lastError.message}`;
            console.error(`[Orchestrator] ${error}`);
            reject(new Error(error));
            return;
          }

          if (!response?.success) {
            const error = response?.error || 'Unknown error from Content Script';
            console.error(`[Orchestrator] Content Script returned error: ${error}`);
            reject(new Error(error));
            return;
          }

          console.log(`[Orchestrator] Connection scrape completed: ${response.data?.connectionsScraped || 0} connections`);
          resolve();
        }
      );
    });
  }

  /**
   * Execute profile scrape
   */
  private async executeProfileScrape(task: ScraperTask): Promise<void> {
    const { profileUrl: _profileUrl, includeActivity } = task.params;

    const profileData = await scrapeProfileData({ includeActivity });

    if (profileData) {
      // Convert to NetworkNode and save
      const node: NetworkNode = {
        id: profileData.publicId || profileData.id || '',
        profile: profileData as any, // Type assertion
        status: 'not_contacted',
        degree: 0, // Will be updated by pathfinding
        matchScore: 0,
      };

      await networkDB.nodes.put(node);
      console.log(`[Orchestrator] Profile saved: ${node.id}`);
    }
  }

  /**
   * Execute activity scrape
   */
  private async executeActivityScrape(task: ScraperTask): Promise<void> {
    const { profileUrl } = task.params;

    const activities = await scrapeProfileActivitySafe(profileUrl);

    if (activities.length > 0) {
      // Save to activities table
      await networkDB.activities.bulkPut(activities);
      console.log(`[Orchestrator] Saved ${activities.length} activities`);
    }
  }

  /**
   * Execute company scrape
   */
  private async executeCompanyScrape(task: ScraperTask): Promise<void> {
    const { companyUrl } = task.params;

    const companyMap = await scrapeCompanyMapSafe(companyUrl);

    if (companyMap) {
      // Save company map
      await networkDB.companies.put(companyMap);
      console.log(`[Orchestrator] Saved company map: ${companyMap.companyName} (${companyMap.employees.length} employees)`);
    }
  }

  /**
   * Execute batch profile scrape (multiple profiles)
   */
  private async executeBatchProfileScrape(task: ScraperTask): Promise<void> {
    const { profileUrls } = task.params;
    const total = profileUrls.length;

    for (let i = 0; i < total; i++) {
      const _profileUrl = profileUrls[i];

      try {
        const profileData = await scrapeProfileData();

        if (profileData) {
          const node: NetworkNode = {
            id: profileData.publicId || profileData.id || '',
            profile: profileData as any,
            status: 'not_contacted',
            degree: 0,
            matchScore: 0,
          };

          await networkDB.nodes.put(node);
        }

        // Progress notification
        this.notifyProgress(task, {
          current: i + 1,
          total,
          status: `Scraping profiles... (${i + 1}/${total})`,
          lastUpdate: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`[Orchestrator] Failed to scrape profile ${_profileUrl}:`, error);
        // Continue with next profile
      }
    }
  }

  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================

  /**
   * Send progress notification to UI (throttled)
   */
  private notifyProgress(task: ScraperTask, progress: TaskProgress): void {
    // Update task progress
    task.progress = progress;

    // Throttle messages: max 1 per 5s per task
    const now = Date.now();
    const lastMessage = this.lastProgressMessage.get(task.id) || 0;

    if (now - lastMessage < PROGRESS_THROTTLE_MS) {
      return; // Skip this message
    }

    this.lastProgressMessage.set(task.id, now);

    // Send message to UI
    chrome.runtime.sendMessage({
      type: 'SCRAPER_PROGRESS',
      payload: {
        ...progress,
        taskId: task.id,
        taskType: task.type,
      },
    }).catch(() => {
      // Ignore errors (no listeners)
    });
  }

  /**
   * Notify task completion
   */
  private notifyCompletion(task: ScraperTask): void {
    chrome.runtime.sendMessage({
      type: 'SCRAPER_COMPLETED',
      payload: {
        taskId: task.id,
        result: null, // Could include result data
      },
    }).catch(() => {
      // Ignore errors
    });
  }

  /**
   * Notify task failure
   */
  private notifyFailure(task: ScraperTask, error: string): void {
    chrome.runtime.sendMessage({
      type: 'SCRAPER_FAILED',
      payload: {
        taskId: task.id,
        error,
      },
    }).catch(() => {
      // Ignore errors
    });
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /**
   * Save queue to chrome.storage.local
   */
  private async saveQueue(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [QUEUE_KEY]: {
          high: this.highPriorityQueue,
          medium: this.mediumPriorityQueue,
          low: this.lowPriorityQueue,
          currentTask: this.currentTask,
          isPaused: this.isPaused,
        },
        [STATS_KEY]: {
          totalCompleted: this.totalCompleted,
          totalFailed: this.totalFailed,
        },
      });
    } catch (error) {
      console.error('[Orchestrator] Failed to save queue:', error);
    }
  }

  /**
   * Load queue from chrome.storage.local
   */
  private async loadQueue(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([QUEUE_KEY, STATS_KEY]);

      if (result[QUEUE_KEY]) {
        const queue = result[QUEUE_KEY];
        this.highPriorityQueue = queue.high || [];
        this.mediumPriorityQueue = queue.medium || [];
        this.lowPriorityQueue = queue.low || [];
        this.currentTask = queue.currentTask || null;
        this.isPaused = queue.isPaused || false;
      }

      if (result[STATS_KEY]) {
        const stats = result[STATS_KEY];
        this.totalCompleted = stats.totalCompleted || 0;
        this.totalFailed = stats.totalFailed || 0;
      }

      console.log('[Orchestrator] Queue loaded from storage');
    } catch (error) {
      console.error('[Orchestrator] Failed to load queue:', error);
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Send message to Content Script on LinkedIn connections page
   */
  private async sendToContentScript(messageType: string, payload: any): Promise<any> {
    try {
      // Get the LinkedIn connections tab
      const tabs = await chrome.tabs.query({
        url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/*'
      });

      if (tabs.length === 0) {
        console.warn(`[Orchestrator] No LinkedIn connections page found for ${messageType}`);
        return null;
      }

      const tab = tabs[0];
      if (!tab.id) {
        console.warn(`[Orchestrator] Invalid tab ID for ${messageType}`);
        return null;
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { type: messageType, payload },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(`[Orchestrator] Failed to send ${messageType}: ${chrome.runtime.lastError.message}`);
              resolve(null);
              return;
            }
            resolve(response);
          }
        );
      });
    } catch (error) {
      console.error(`[Orchestrator] Error sending ${messageType}:`, error);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const scrapingOrchestrator = new ScrapingOrchestrator();
