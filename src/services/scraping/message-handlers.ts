/**
 * Scraping Orchestrator Message Handlers
 * Handles messages from popup/content scripts for orchestrator commands
 */

import { scrapingOrchestrator } from './orchestrator';

/**
 * Handle orchestrator-related messages
 *
 * @param message - Message object from chrome.runtime.onMessage
 * @param sender - Message sender
 * @param sendResponse - Response callback
 * @returns True if response will be sent asynchronously
 */
export function handleOrchestratorMessage(
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
): boolean {
  // All orchestrator handlers are async
  (async () => {
    try {
      switch (message.type) {
        case 'ENQUEUE_SCRAPE': {
          const taskId = await scrapingOrchestrator.enqueueTask(message.payload);
          sendResponse({ success: true, taskId });
          break;
        }

        case 'PAUSE_ALL_SCRAPING':
          await scrapingOrchestrator.pauseAll();
          sendResponse({ success: true });
          break;

        case 'RESUME_ALL_SCRAPING':
          await scrapingOrchestrator.resumeAll();
          sendResponse({ success: true });
          break;

        case 'CANCEL_TASK': {
          const cancelled = await scrapingOrchestrator.cancelTask(message.payload.taskId);
          sendResponse({ success: cancelled });
          break;
        }

        case 'GET_QUEUE_STATUS': {
          const status = await scrapingOrchestrator.getQueueStatus();
          sendResponse({ success: true, data: status });
          break;
        }

        case 'CLEAR_COMPLETED_TASKS':
          await scrapingOrchestrator.clearCompletedTasks();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown orchestrator message type' });
      }
    } catch (error) {
      console.error('[Orchestrator] Message handler error:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  })();

  return true; // Will respond asynchronously
}

/**
 * Check if message is an orchestrator message
 */
export function isOrchestratorMessage(message: any): boolean {
  const orchestratorTypes = [
    'ENQUEUE_SCRAPE',
    'PAUSE_ALL_SCRAPING',
    'RESUME_ALL_SCRAPING',
    'CANCEL_TASK',
    'GET_QUEUE_STATUS',
    'CLEAR_COMPLETED_TASKS',
    'EXECUTE_CONNECTION_SCRAPE',
  ];

  return orchestratorTypes.includes(message.type);
}
