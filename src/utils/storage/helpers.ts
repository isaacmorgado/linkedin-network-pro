/**
 * Storage Helper Functions
 * Utility functions for handling storage errors
 */

/**
 * Checks if an error is due to extension context invalidation or storage access denial
 * This typically occurs during extension reloads in development or in restricted contexts
 */
export function isContextInvalidatedError(error: any): boolean {
  if (!error) return false;

  // Check error message
  if (error.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('extension context invalidated') ||
      message.includes('access to storage is not allowed') ||
      message.includes('storage is not available') ||
      message.includes('context invalidated')
    ) {
      return true;
    }
  }

  // Check error string representation
  const errorStr = String(error).toLowerCase();
  return (
    errorStr.includes('extension context invalidated') ||
    errorStr.includes('access to storage is not allowed') ||
    errorStr.includes('storage is not available') ||
    errorStr.includes('context invalidated')
  );
}
