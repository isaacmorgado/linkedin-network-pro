/**
 * Centralized Logging Utility
 * Provides consistent, structured logging across the LinkedIn Extension
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log categories for filtering
export enum LogCategory {
  STORAGE = 'STORAGE',
  SERVICE = 'SERVICE',
  UI = 'UI',
  NETWORK = 'NETWORK',
  BACKGROUND = 'BACKGROUND',
  CONTENT_SCRIPT = 'CONTENT_SCRIPT',
  PERFORMANCE = 'PERFORMANCE',
  ANALYTICS = 'ANALYTICS',
}

interface LogOptions {
  level?: LogLevel;
  category?: LogCategory;
  data?: any;
  error?: Error;
  duration?: number;
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = LogLevel.DEBUG;
  private enabledCategories: Set<LogCategory> = new Set(Object.values(LogCategory));
  private logHistory: Array<{ timestamp: number; level: LogLevel; category: LogCategory; message: string; data?: any }> = [];
  private maxHistorySize = 1000;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set minimum log level (only logs at or above this level will be shown)
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
    this.info('LOGGER', 'Log level changed', { newLevel: LogLevel[level] });
  }

  /**
   * Enable/disable specific log categories
   */
  setCategories(categories: LogCategory[]): void {
    this.enabledCategories = new Set(categories);
    this.info('LOGGER', 'Log categories updated', { categories: categories.map(c => LogCategory[c]) });
  }

  /**
   * Get log history (useful for debugging)
   */
  getHistory(limit?: number): any[] {
    return limit ? this.logHistory.slice(-limit) : this.logHistory;
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
    console.log('[Uproot] Log history cleared');
  }

  /**
   * Main logging method
   */
  private log(level: LogLevel, category: LogCategory, message: string, options: LogOptions = {}): void {
    // Check if this log should be shown
    if (level < this.minLevel || !this.enabledCategories.has(category)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const categoryName = LogCategory[category];

    // Build log entry
    const logEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data: options.data,
    };

    // Add to history (with size limit)
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Format console output
    const prefix = `[Uproot][${levelName}][${categoryName}]`;
    const fullMessage = `${prefix} ${message}`;

    // Choose console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, options.data || '');
        break;
      case LogLevel.INFO:
        console.log(fullMessage, options.data || '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, options.data || '');
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, options.data || '', options.error || '');
        if (options.error) {
          console.error('Stack trace:', options.error.stack);
        }
        break;
    }

    // Log duration if provided (performance tracking)
    if (options.duration !== undefined) {
      console.log(`${prefix} ⏱️ Duration: ${options.duration.toFixed(2)}ms`);
    }
  }

  // Convenience methods
  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, { data });
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, { data });
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, { data });
  }

  error(category: LogCategory, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, category, message, { error, data });
  }

  /**
   * Performance tracking helper
   */
  startTimer(category: LogCategory, operation: string): () => void {
    const startTime = performance.now();
    this.debug(LogCategory.PERFORMANCE, `▶️ Started: ${operation}`, { category: LogCategory[category] });

    return () => {
      const duration = performance.now() - startTime;
      this.info(LogCategory.PERFORMANCE, `✅ Completed: ${operation}`, { category: LogCategory[category], duration: `${duration.toFixed(2)}ms` });
    };
  }

  /**
   * Async operation wrapper with automatic logging
   */
  async trackAsync<T>(
    category: LogCategory,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    this.debug(category, `▶️ Started: ${operation}`);

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.info(category, `✅ Completed: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(category, `❌ Failed: ${operation}`, error as Error, { duration: `${duration.toFixed(2)}ms` });
      throw error;
    }
  }

  /**
   * Log function entry/exit (for detailed tracing)
   */
  trace(category: LogCategory, functionName: string, args?: any): () => void {
    this.debug(category, `→ Entering: ${functionName}`, { args });

    return (returnValue?: any) => {
      this.debug(category, `← Exiting: ${functionName}`, { returnValue });
    };
  }

  /**
   * Log data changes (useful for state management)
   */
  logChange(category: LogCategory, entity: string, action: 'create' | 'update' | 'delete', data: any): void {
    const emoji = action === 'create' ? '➕' : action === 'update' ? '✏️' : '🗑️';
    this.info(category, `${emoji} ${action.toUpperCase()}: ${entity}`, data);
  }

  /**
   * Log analytics events
   */
  logEvent(eventName: string, properties?: any): void {
    this.info(LogCategory.ANALYTICS, `📊 Event: ${eventName}`, properties);
  }

  /**
   * Log user actions
   */
  logAction(action: string, details?: any): void {
    this.info(LogCategory.UI, `👆 User Action: ${action}`, details);
  }

  /**
   * Log API calls
   */
  logApiCall(method: string, endpoint: string, status?: number, duration?: number): void {
    const statusEmoji = status && status >= 200 && status < 300 ? '✅' : '❌';
    this.info(LogCategory.NETWORK, `${statusEmoji} ${method} ${endpoint}`, { status, duration: duration ? `${duration}ms` : undefined });
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(): void {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uproot-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.info('LOGGER' as any, 'Logs downloaded');
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (category: LogCategory, message: string, data?: any) => logger.debug(category, message, data),
  info: (category: LogCategory, message: string, data?: any) => logger.info(category, message, data),
  warn: (category: LogCategory, message: string, data?: any) => logger.warn(category, message, data),
  error: (category: LogCategory, message: string, error?: Error, data?: any) => logger.error(category, message, error, data),

  // Specialized logging
  startTimer: (category: LogCategory, operation: string) => logger.startTimer(category, operation),
  trackAsync: <T>(category: LogCategory, operation: string, fn: () => Promise<T>) => logger.trackAsync(category, operation, fn),
  trace: (category: LogCategory, functionName: string, args?: any) => logger.trace(category, functionName, args),
  change: (category: LogCategory, entity: string, action: 'create' | 'update' | 'delete', data: any) => logger.logChange(category, entity, action, data),
  event: (eventName: string, properties?: any) => logger.logEvent(eventName, properties),
  action: (action: string, details?: any) => logger.logAction(action, details),
  apiCall: (method: string, endpoint: string, status?: number, duration?: number) => logger.logApiCall(method, endpoint, status, duration),

  // Utility
  setMinLevel: (level: LogLevel) => logger.setMinLevel(level),
  setCategories: (categories: LogCategory[]) => logger.setCategories(categories),
  getHistory: (limit?: number) => logger.getHistory(limit),
  clearHistory: () => logger.clearHistory(),
  exportLogs: () => logger.exportLogs(),
  downloadLogs: () => logger.downloadLogs(),
};

// Initialize logging
logger.info('LOGGER' as any, '🚀 Uproot LinkedIn Extension - Logging initialized', {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
});
