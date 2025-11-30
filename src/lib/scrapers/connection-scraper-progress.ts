/**
 * Connection Scraper - Progress Management
 * Handles progress persistence and state management
 */

const PROGRESS_KEY = 'connection_scrape_progress';

export interface ConnectionScrapeProgress {
  totalScraped: number;
  lastScrapedId: string | null;
  startedAt: string;
  lastSaveAt: string;
  status: 'running' | 'paused' | 'complete' | 'error';
  totalConnections: number | null;
}

export interface ProgressUpdate {
  scraped: number;
  total: number | null;
  status: 'running' | 'paused' | 'complete' | 'error';
  lastSaved: number;
}

// Global state for pause/resume control
let isPaused = false;
let isStopped = false;

export function pauseScraping(): void {
  console.log('[ConnectionScraper] Pausing scrape operation...');
  isPaused = true;
}

export function resumeScraping(): void {
  console.log('[ConnectionScraper] Resuming scrape operation...');
  isPaused = false;
}

export function stopScraping(): void {
  console.log('[ConnectionScraper] Stopping scrape operation...');
  isStopped = true;
}

export function resetState(): void {
  isPaused = false;
  isStopped = false;
}

export function checkPaused(): boolean {
  return isPaused;
}

export function checkStopped(): boolean {
  return isStopped;
}

export async function loadProgress(): Promise<ConnectionScrapeProgress | null> {
  try {
    const result = await chrome.storage.local.get(PROGRESS_KEY);
    return result[PROGRESS_KEY] || null;
  } catch (error) {
    console.error('[ConnectionScraper] Failed to load progress:', error);
    return null;
  }
}

export async function updateProgress(progress: ConnectionScrapeProgress): Promise<void> {
  try {
    await chrome.storage.local.set({ [PROGRESS_KEY]: progress });
    console.log(`[ConnectionScraper] Progress saved: ${progress.totalScraped} connections`);
  } catch (error) {
    console.error('[ConnectionScraper] Failed to save progress:', error);
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await chrome.storage.local.remove(PROGRESS_KEY);
    console.log('[ConnectionScraper] Progress cleared');
  } catch (error) {
    console.error('[ConnectionScraper] Failed to clear progress:', error);
  }
}
