/**
 * Shared helper functions for search features
 */

/**
 * Get degree suffix for connection degree
 */
export function getDegreeSuffix(degree: number): string {
  if (degree === 1) return 'st';
  if (degree === 2) return 'nd';
  if (degree === 3) return 'rd';
  return 'th';
}
