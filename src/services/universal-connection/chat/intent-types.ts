/**
 * Intent Types
 * Type definitions for intent classification
 */

/**
 * Intent types for chat agent classification
 */
export type IntentType =
  | 'SEARCH'              // Find people matching criteria
  | 'FIND_PATH'           // Discover connection paths
  | 'GENERATE_MESSAGE'    // Draft outreach messages
  | 'GENERAL';            // Context-dependent queries

/**
 * Classified intent with extracted entities
 */
export interface Intent {
  type: IntentType;
  confidence: number;     // 0-1 (how confident we are in classification)
  entities: {
    // For SEARCH intents
    query?: string;
    company?: string;
    role?: string;
    location?: string;
    connectionDegree?: number[];

    // For FIND_PATH and GENERATE_MESSAGE intents
    target?: string;      // Person name to reach
    targetCompany?: string; // Company context

    // For GENERAL intents
    contextReference?: string; // e.g., "first result", "that person"
  };
  reasoning: string;      // Human-readable explanation
  rawMessage: string;     // Original user input
}
