/**
 * Universal Connection Chat Module
 * Exports all chat-related functionality
 */

// Intent Classifier
export { classifyIntent } from './intent-classifier';

// Response Generator
export { generateResponse } from './response-generator';

// Chat Agent
export { ChatAgent, chatAgent } from './agent';

// Types
export type { Intent, IntentType } from './intent-classifier';
