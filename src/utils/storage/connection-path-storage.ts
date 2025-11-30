/**
 * Connection Path Storage Module
 * Handles storage operations for connection paths
 */

import { log, LogCategory } from '../logger';
import type { ConnectionPath } from '../../types/watchlist';
import { CONNECTION_PATHS_STORAGE_KEY } from '../../types/watchlist';

// Get connection paths from storage
export async function getConnectionPaths(): Promise<ConnectionPath[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getConnectionPaths', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching connection paths from storage');
      const result = await chrome.storage.local.get(CONNECTION_PATHS_STORAGE_KEY);
      const paths = result[CONNECTION_PATHS_STORAGE_KEY] || [];
      log.info(LogCategory.STORAGE, 'Connection paths retrieved', { count: paths.length });
      console.log('[Uproot] Retrieved connection paths:', paths.length, 'paths');
      return paths;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error getting connection paths', { error });
      console.error('[Uproot] Error getting connection paths:', error);
      return [];
    }
  });
}

// Save connection paths to storage
export async function saveConnectionPaths(paths: ConnectionPath[]): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveConnectionPaths', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving connection paths to storage', { count: paths.length });
      await chrome.storage.local.set({ [CONNECTION_PATHS_STORAGE_KEY]: paths });
      log.change(LogCategory.STORAGE, 'connectionPaths', 'update', { count: paths.length });
      console.log('[Uproot] Connection paths saved:', paths.length, 'paths');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error saving connection paths', { error, count: paths.length });
      console.error('[Uproot] Error saving connection paths:', error);
      throw error;
    }
  });
}

// Add connection path
export async function addConnectionPath(
  path: Omit<ConnectionPath, 'id' | 'addedAt' | 'lastUpdated'>
): Promise<ConnectionPath> {
  return log.trackAsync(LogCategory.STORAGE, 'addConnectionPath', async () => {
    log.debug(LogCategory.STORAGE, 'Adding connection path', { targetName: path.targetName, targetProfileUrl: path.targetProfileUrl });
    const paths = await getConnectionPaths();

    // Generate ID from target profile URL
    const id = path.targetProfileUrl;

    // Check if already exists
    const existingIndex = paths.findIndex((p) => p.id === id);
    if (existingIndex !== -1) {
      log.info(LogCategory.STORAGE, 'Connection path already exists', { targetName: path.targetName, id });
      console.log('[Uproot] Connection path already exists:', path.targetName);
      return paths[existingIndex];
    }

    // Create new connection path
    const newPath: ConnectionPath = {
      ...path,
      id,
      addedAt: Date.now(),
      lastUpdated: Date.now(),
    };

    // Add to beginning of list
    paths.unshift(newPath);

    await saveConnectionPaths(paths);
    log.change(LogCategory.STORAGE, 'connectionPaths', 'create', { id: newPath.id, targetName: newPath.targetName });
    console.log('[Uproot] Added connection path:', path.targetName);

    return newPath;
  });
}

// Remove connection path
export async function removeConnectionPath(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'removeConnectionPath', async () => {
    log.debug(LogCategory.STORAGE, 'Removing connection path', { id });
    const paths = await getConnectionPaths();
    const filteredPaths = paths.filter((p) => p.id !== id);

    await saveConnectionPaths(filteredPaths);
    log.change(LogCategory.STORAGE, 'connectionPaths', 'delete', { id });
    console.log('[Uproot] Removed connection path:', id);
  });
}

// Update connection path
export async function updateConnectionPath(
  id: string,
  updates: Partial<ConnectionPath>
): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateConnectionPath', async () => {
    log.debug(LogCategory.STORAGE, 'Updating connection path', { id, updates });
    const paths = await getConnectionPaths();
    const index = paths.findIndex((p) => p.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Connection path not found', { id });
      throw new Error('Connection path not found');
    }

    paths[index] = {
      ...paths[index],
      ...updates,
      lastUpdated: Date.now(),
    };

    await saveConnectionPaths(paths);
    log.change(LogCategory.STORAGE, 'connectionPaths', 'update', { id, updates });
    console.log('[Uproot] Updated connection path:', id);
  });
}

// Mark step as connected in a path
export async function markStepConnected(pathId: string, stepIndex: number): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'markStepConnected', async () => {
    log.debug(LogCategory.STORAGE, 'Marking step as connected', { pathId, stepIndex });
    const paths = await getConnectionPaths();
    const pathIndex = paths.findIndex((p) => p.id === pathId);

    if (pathIndex === -1) {
      log.error(LogCategory.STORAGE, 'Connection path not found', { pathId });
      throw new Error('Connection path not found');
    }

    const path = paths[pathIndex];

    if (stepIndex < 0 || stepIndex >= path.path.length) {
      log.error(LogCategory.STORAGE, 'Invalid step index', { pathId, stepIndex, maxIndex: path.path.length - 1 });
      throw new Error('Invalid step index');
    }

    // Mark step as connected
    path.path[stepIndex].connected = true;

    // Update completed steps count
    path.completedSteps = path.path.filter((step) => step.connected).length;

    // Check if path is complete
    path.isComplete = path.completedSteps === path.totalSteps;
    path.lastUpdated = Date.now();

    await saveConnectionPaths(paths);
    log.change(LogCategory.STORAGE, 'connectionPaths', 'update', { pathId, stepIndex, isComplete: path.isComplete });
    console.log('[Uproot] Marked step as connected:', pathId, stepIndex);
  });
}

// Check if connection path exists
export async function isConnectionPathSaved(targetProfileUrl: string): Promise<boolean> {
  return log.trackAsync(LogCategory.STORAGE, 'isConnectionPathSaved', async () => {
    log.debug(LogCategory.STORAGE, 'Checking if connection path exists', { targetProfileUrl });
    const paths = await getConnectionPaths();
    const exists = paths.some((p) => p.id === targetProfileUrl);
    log.info(LogCategory.STORAGE, 'Connection path check complete', { targetProfileUrl, exists });
    return exists;
  });
}
