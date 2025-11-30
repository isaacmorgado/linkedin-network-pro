/**
 * LinkedIn Data Scrapers - Barrel Export
 * Re-exports all functionality from the refactored scrapers module
 *
 * This file maintains backward compatibility while keeping the codebase
 * organized according to the 300-line rule.
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

// Re-export everything from the refactored module
export * from './scrapers/index';
